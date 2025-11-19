# Quick Deploy Guide

## 🚀 Deploy in 3 Steps

### Step 1: Authenticate
```bash
npx wrangler login
```
This opens your browser to log in to Cloudflare.

### Step 2: Build & Deploy
```bash
npm run pages:deploy
```

### Step 3: Done! 🎉
Your site will be live at: `https://terralogos.pages.dev`

---

## Alternative: GitHub Integration

1. Push your code to GitHub
2. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → Pages
3. Click "Create a project" → "Connect to Git"
4. Select your repository
5. Build settings:
   - Build command: `npm run build`
   - Build output directory: `dist`
6. Deploy!

Every push to `main` will auto-deploy.

---

## Need Help?

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

