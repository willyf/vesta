# FieldStack — Deploy to Vercel

## What's in this folder
```
fieldstack/
├── api/
│   └── process.js      ← serverless function (calls Claude)
├── public/
│   └── index.html      ← the app
├── vercel.json         ← routing config
├── package.json
└── DEPLOY.md           ← this file
```

---

## Step 1 — Get your Anthropic API key
1. Go to https://console.anthropic.com
2. Click **API Keys** in the left sidebar
3. Click **Create Key**, give it a name like "fieldstack"
4. Copy the key (starts with `sk-ant-...`) — you won't see it again

---

## Step 2 — Push to GitHub
1. Go to https://github.com/new and create a new repo called `fieldstack`
2. Upload all files in this folder (maintain the folder structure)
   - `api/process.js`
   - `public/index.html`
   - `vercel.json`
   - `package.json`

---

## Step 3 — Deploy on Vercel
1. Go to https://vercel.com and sign in with GitHub
2. Click **Add New → Project**
3. Select your `fieldstack` repo
4. Click **Deploy** (defaults are fine)

---

## Step 4 — Add your API key (critical)
This is what keeps your key secret and out of the code.

1. In Vercel, go to your project → **Settings** → **Environment Variables**
2. Click **Add New**
   - Name: `ANTHROPIC_API_KEY`
   - Value: paste your `sk-ant-...` key
   - Environment: check **Production**, **Preview**, **Development**
3. Click **Save**
4. Go to **Deployments** → click the three dots on your latest deploy → **Redeploy**

---

## Step 5 — Share with Andrew
Your app will be live at: `https://fieldstack.vercel.app` (or similar)

Send him the URL. That's it.

---

## Updating the app later
1. Edit files locally
2. Push to GitHub
3. Vercel redeploys automatically within ~30 seconds

---

## Costs
- Vercel free tier: plenty for a few users
- Anthropic API: ~$3-6/month at Andrew's usage level
- Total: essentially free to run

---

## If something breaks
- Check Vercel dashboard → **Functions** tab → click `process` → view logs
- Most common issue: API key not set or typo in the environment variable name
