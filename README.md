# JobGuard — Netlify Deployment

## File Structure
```
/
├── fraud-job-detector.html      ← Main app (rename to index.html)
├── netlify.toml                 ← Netlify config
└── netlify/
    └── functions/
        └── analyze.js           ← API proxy function
```

## Deploy Steps

1. **Rename the HTML file**
   Rename `fraud-job-detector.html` → `index.html` so Netlify serves it at the root.

2. **Push to GitHub**
   Create a repo with the structure above and push all files.

3. **Connect to Netlify**
   - Go to app.netlify.com → Add new site → Import from Git
   - Select your repo
   - Build settings are already in `netlify.toml` — nothing to change

4. **Add your API key**
   - In Netlify dashboard → Site settings → Environment variables
   - Add: `ANTHROPIC_API_KEY` = your key from console.anthropic.com
   - Redeploy the site after adding it

5. **Done** — your site will be live at `https://your-site.netlify.app`

## How it works
The browser calls `/api/analyze` on your own domain (no CORS issues).
The Netlify function receives the request, adds your secret API key, and forwards
it to Anthropic's API server-to-server. Your API key is never exposed to the browser.

## Cost
Netlify's free tier includes 125,000 function invocations/month — more than enough
for personal or small-group use. Each analysis = ~2-3 function calls (one per
web search + one for the final response).
