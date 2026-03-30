# SA Casino Review Agent

SEO-optimised casino review generator for South Africa, powered by Claude AI.

---

## Deploy in 10 minutes (free)

### Step 1 — Get your Anthropic API key
1. Go to https://console.anthropic.com
2. Sign up / log in
3. Click **API Keys** → **Create Key**
4. Copy the key (starts with `sk-ant-...`)

### Step 2 — Put the code on GitHub
1. Go to https://github.com and create a free account if needed
2. Click **New repository** → name it `casino-review-agent` → **Create**
3. Upload all these files (drag and drop into GitHub, or use Git)

### Step 3 — Deploy to Vercel (free)
1. Go to https://vercel.com and sign up with your GitHub account
2. Click **Add New Project** → select your `casino-review-agent` repo
3. Click **Environment Variables** and add:
   - Key: `ANTHROPIC_API_KEY`
   - Value: your key from Step 1
4. Click **Deploy**
5. In ~2 minutes you'll get a live URL like `casino-review-agent.vercel.app`

That's it. Share that URL with anyone — they can use the agent without needing their own API key.

---

## Run locally (for testing)

```bash
# Install dependencies
npm install

# Add your API key
echo "ANTHROPIC_API_KEY=sk-ant-your-key-here" > .env.local

# Start the dev server
npm run dev

# Open http://localhost:3000
```

---

## How it works

- The **frontend** (React) runs in the browser — handles the UI
- The **backend** (`/app/api/generate/route.js`) runs on the server — makes the Anthropic API call
- The API key stays on the server, never exposed to the browser
- Results stream back to the browser in real time via Server-Sent Events

---

## Adding casinos or sources

Edit `app/page.js`:
- `DEFAULT_CASINOS` array — add any casino with name, domain, slug
- `DEFAULT_SOURCES` array — add any review site URL
