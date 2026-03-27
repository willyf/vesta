export const config = { runtime: 'edge' };

const SYSTEM_PROMPT = `You are an AI assistant for a general contractor. Your job is to read any document pasted in — emails, text messages, subcontractor bids, invoices, change order requests, permit notices, job site notes — and extract the key information.

Always respond with ONLY a valid JSON object (no markdown, no explanation, no code fences) in this exact format:
{
  "type": "bid|email|text|invoice|change|permit|note",
  "from": "person or company name, or 'Unknown'",
  "summary": "2-3 sentence plain English summary of what this document says and what action (if any) is needed",
  "amount": "dollar amount as a string like '$18,400' if present, null if none",
  "date": "relevant date or deadline as a string if present, null if none",
  "tags": ["array", "of", "short", "keywords"],
  "urgent": true or false,
  "action_required": true or false,
  "action_note": "one sentence describing what action is needed, or null"
}

Type definitions:
- bid: subcontractor bid or quote
- email: client or vendor email
- text: text message or SMS thread
- invoice: invoice or bill requesting payment
- change: change order request
- permit: permit, inspection notice, or code violation
- note: job site note, memo, or general observation

Tags should be short keywords like: electrical, plumbing, framing, roofing, client, sub, payment, deadline, warranty, inspection.`;

export default async function handler(req) {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });
  }

  try {
    const { text, mode, context } = await req.json();

    if (!text || !text.trim()) {
      return new Response(JSON.stringify({ error: 'No text provided' }), { status: 400, headers });
    }

    const userMessage = mode === 'ask'
      ? `The contractor is asking a question: "${text}"\n\nHere are the documents logged so far:\n${context || 'No documents logged yet.'}\n\nAnswer based on these documents. Be specific and concise — 2-4 sentences. No JSON needed.`
      : `Please read and extract information from this document:\n\n${text}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Anthropic API error:', err);
      return new Response(JSON.stringify({ error: 'Claude API error' }), { status: 500, headers });
    }

    const data = await response.json();
    const content = data.content?.[0]?.text || '';

    if (mode === 'ask') {
      return new Response(JSON.stringify({ answer: content }), { status: 200, headers });
    }

// Parse JSON from Claude
    try {
      const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned);
      return new Response(JSON.stringify(parsed), { status: 200, headers });
    } catch {
      // Claude returned something unparseable — wrap it as a note
      return new Response(JSON.stringify({
        type: 'note',
        from: 'Document',
        summary: content.slice(0, 300),
        amount: null,
        date: null,
        tags: ['misc'],
        urgent: false,
        action_required: false,
        action_note: null,
      }), { status: 200, headers });
    }

  } catch (err) {
    console.error('Handler error:', err);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500, headers });
  }
}
