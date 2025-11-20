# Deployment Guide

## Cloudflare Pages (Recommended)

Your project is already configured for Cloudflare Pages deployment. This is the easiest option since your API functions are already in the Cloudflare Pages Functions format.

### Prerequisites

1. **Cloudflare Account**: Sign up at [cloudflare.com](https://www.cloudflare.com)
2. **Wrangler CLI**: Already installed (included in devDependencies)
3. **Cloudflare API Token**: Get one from [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens)

### Option 1: Deploy via Wrangler CLI (Quick)

1. **Authenticate Wrangler**:
   ```bash
   npx wrangler login
   ```
   This will open a browser to authenticate with Cloudflare.

2. **Deploy to Cloudflare Pages**:
   ```bash
   npm run pages:deploy
   ```

3. **Your site will be live at**: `https://terralogos.pages.dev` (or a custom domain if configured)

### Apply Telemetry Database Migrations

The SSE worker persists data to D1. Before deploying, run:

```bash
# Create the database if it does not exist
wrangler d1 create terralogos-db

# Apply the schema locally (for wrangler pages dev / docker)
npx wrangler d1 migrations apply TERRA_DB --local

# Apply the schema to the production binding
wrangler d1 migrations apply TERRA_DB
```

Remember to replace the placeholder `database_id` in `wrangler.toml` with the actual value returned by `wrangler d1 create`.

### Option 2: Deploy via GitHub (Automatic)

1. **Push your code to GitHub** (if not already done)

2. **Connect to Cloudflare Pages**:
   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → Pages
   - Click "Create a project" → "Connect to Git"
   - Select your GitHub repository
   - Configure build settings:
     - **Build command**: `npm run build`
     - **Build output directory**: `dist`
     - **Root directory**: `/` (or leave empty)
   - Click "Save and Deploy"

3. **Automatic deployments**: Every push to your main branch will trigger a new deployment

### Option 3: GitHub Actions (CI/CD)

A GitHub Actions workflow is included (`.github/workflows/deploy.yml`). It will automatically deploy when you push to the `main` branch.

**Setup**:
1. Add your Cloudflare API token as a GitHub secret:
   - Go to your GitHub repo → Settings → Secrets and variables → Actions
   - Add a new secret: `CLOUDFLARE_API_TOKEN` with your token value
   - Add another secret: `CLOUDFLARE_ACCOUNT_ID` (find it in Cloudflare Dashboard)

2. Push to `main` branch and the workflow will deploy automatically

### Custom Domain

To add a custom domain:
1. Go to Cloudflare Pages → Your project → Custom domains
2. Add your domain
3. Follow the DNS configuration instructions

---

## Firebase (Alternative)

If you prefer Firebase, you'll need to:

1. **Convert API Functions**: Your current functions use Cloudflare Pages format. For Firebase, you'd need to:
   - Convert to Firebase Functions (Node.js)
   - Or use Firebase Hosting with Cloud Functions

2. **Setup Firebase**:
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase init
   ```

3. **Configure Firebase**:
   - Select Hosting
   - Public directory: `dist`
   - Single-page app: Yes
   - Configure functions separately

**Note**: Firebase would require rewriting your API functions. Cloudflare Pages is recommended since everything is already configured.

---

## Environment Variables

If you need to add environment variables:

### Cloudflare Pages
- Go to Pages → Your project → Settings → Environment variables
- Add variables for production/preview

### Access in Functions
```javascript
// In your functions/api/*.js files
export async function onRequest(context) {
  const apiKey = context.env.API_KEY; // Access env vars
  // ...
}
```

---

## Troubleshooting

### Build fails
- Check that all dependencies are in `package.json`
- Run `npm install` before building
- Check build logs in Cloudflare Dashboard

### API endpoints not working
- Verify functions are in `functions/api/` directory
- Check function names match the route (e.g., `seismic.js` → `/api/seismic`)
- Check Cloudflare Pages Functions logs in the dashboard

### CORS issues
- Your functions already include CORS headers
- If issues persist, check the `Access-Control-Allow-Origin` header in your functions

---

## Quick Deploy Commands

```bash
# Build and deploy to production
npm run pages:deploy

# Deploy to preview environment
npm run pages:deploy:preview

# Local development with Pages Functions
npm run pages:dev
```
