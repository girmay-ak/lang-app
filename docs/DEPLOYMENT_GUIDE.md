# Deployment Guide - Language Exchange App

Complete guide for deploying the Language Exchange App to Vercel with GitHub CI/CD.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [GitHub Setup](#github-setup)
4. [Vercel Setup](#vercel-setup)
5. [Environment Variables](#environment-variables)
6. [CI/CD Configuration](#cicd-configuration)
7. [Deployment Steps](#deployment-steps)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

- Node.js 20+ installed
- pnpm installed (`npm install -g pnpm`)
- GitHub account
- Vercel account (free tier is fine)
- Supabase project set up

## Initial Setup

### 1. Install Dependencies

```bash
make install
# or
pnpm install
```

### 2. Set Up Environment Variables

```bash
make env
# This creates .env.local from env.local.sample
```

Then edit `.env.local` with your actual values:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - Your Google Maps API key (if using maps)
- Any other required environment variables

### 3. Test Locally

```bash
make dev
# or
pnpm dev
```

Visit `http://localhost:3000` to verify everything works.

## GitHub Setup

### 1. Initialize Git Repository

If not already initialized:

```bash
make git-init
```

This will:
- Initialize git
- Add all files (respecting .gitignore)
- Create initial commit

### 2. Create GitHub Repository

1. Go to [GitHub](https://github.com) and create a new repository
2. **DO NOT** initialize with README, .gitignore, or license (we already have these)
3. Copy the repository URL

### 3. Connect Local Repository to GitHub

```bash
git remote add origin https://github.com/yourusername/your-repo-name.git
git branch -M main
git push -u origin main
```

## Vercel Setup

### Option 1: Via Vercel Dashboard (Recommended for First Time)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./`
   - **Build Command**: `pnpm build`
   - **Output Directory**: `.next`
   - **Install Command**: `pnpm install`

5. Add Environment Variables (see [Environment Variables](#environment-variables) section)

6. Click "Deploy"

### Option 2: Via Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy (follow prompts)
vercel

# For production deployment
vercel --prod
```

## Environment Variables

### Required Environment Variables

Add these in Vercel Dashboard → Your Project → Settings → Environment Variables:

#### Public Variables (NEXT_PUBLIC_*)

These are exposed to the browser:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=https://your-app.vercel.app/auth/callback
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-key
```

#### Server Variables (Optional)

These are only available server-side:

```env
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret
```

### Setting Environment Variables in Vercel

1. Go to your project in Vercel Dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable:
   - **Name**: The variable name (e.g., `NEXT_PUBLIC_SUPABASE_URL`)
   - **Value**: The variable value
   - **Environments**: Select where to apply (Production, Preview, Development)

4. Click **Save**
5. **Redeploy** your application for changes to take effect

### Environment Variable Checklist

- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL` (update with your Vercel URL)
- [ ] `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (if using maps)

## CI/CD Configuration

### GitHub Actions Setup

The project includes a CI/CD workflow (`.github/workflows/ci.yml`) that:

1. **Lints** code on every push/PR
2. **Type checks** the codebase
3. **Builds** the application
4. **Deploys** previews for pull requests
5. **Deploys** to production on pushes to `main`

### Required GitHub Secrets

Add these secrets in GitHub → Your Repository → Settings → Secrets and variables → Actions:

1. **VERCEL_TOKEN**
   - Get from: [Vercel Settings → Tokens](https://vercel.com/account/tokens)
   - Create a new token with full access

2. **VERCEL_ORG_ID**
   - Get from: Vercel Dashboard → Your Team → Settings → General
   - Or run: `vercel whoami` in CLI

3. **VERCEL_PROJECT_ID**
   - Get from: Vercel Dashboard → Your Project → Settings → General
   - Found in the project URL or settings page

4. **NEXT_PUBLIC_SUPABASE_URL** (for build)
   - Your Supabase URL

5. **NEXT_PUBLIC_SUPABASE_ANON_KEY** (for build)
   - Your Supabase anon key

### Enabling GitHub Actions

1. Push your code to GitHub (if not already done)
2. Go to your repository → **Actions** tab
3. Enable workflows if prompted
4. The workflow will run automatically on pushes and PRs

## Deployment Steps

### First Deployment

1. **Prepare your code:**
   ```bash
   make deploy-prep
   ```

2. **Commit and push:**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

3. **Deploy to Vercel:**
   - Via Dashboard: Import project and deploy
   - Via CLI: `vercel --prod`

4. **Update Supabase Redirect URLs:**
   - Go to Supabase Dashboard → Authentication → URL Configuration
   - Add your Vercel URL: `https://your-app.vercel.app/auth/callback`
   - Update `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL` in Vercel environment variables

5. **Test the deployment:**
   - Visit your Vercel URL
   - Test authentication
   - Test key features

### Subsequent Deployments

Deployments happen automatically:

- **On push to `main`**: Production deployment
- **On pull requests**: Preview deployment
- **Manual**: Use Vercel CLI or dashboard

### Manual Deployment

```bash
# Make sure you're on main branch
git checkout main

# Pull latest changes
git pull origin main

# Deploy
vercel --prod
```

## Supabase Configuration

### Update Redirect URLs

After deploying, update Supabase authentication redirect URLs:

1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Add to **Redirect URLs**:
   ```
   https://your-app.vercel.app/auth/callback
   https://your-app.vercel.app/**
   ```

3. Add to **Site URL**:
   ```
   https://your-app.vercel.app
   ```

### Database Setup

Make sure all database migrations are run:

1. Go to Supabase Dashboard → SQL Editor
2. Run all scripts in order:
   - `001_setup_users_rls.sql`
   - `002_fix_users_rls.sql`
   - `003_complete_database_schema.sql`
   - ... (other scripts as needed)

## Troubleshooting

### Build Failures

**Error: Environment variable not found**
- Check all `NEXT_PUBLIC_*` variables are set in Vercel
- Make sure variables are added to Production, Preview, and Development environments

**Error: Module not found**
- Run `pnpm install` locally to check for missing dependencies
- Make sure `package.json` has all required dependencies

**Error: Type errors**
- Check `tsconfig.json` settings
- Currently `ignoreBuildErrors: true` is set in `next.config.mjs`

### Deployment Issues

**Preview deployments not working**
- Check GitHub Actions secrets are set correctly
- Verify Vercel tokens are valid
- Check workflow logs in GitHub Actions

**Authentication not working**
- Verify redirect URLs in Supabase match Vercel URL
- Check `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL` in Vercel env vars
- Make sure Supabase auth settings allow your Vercel domain

### Performance Issues

**Slow builds**
- Consider caching node_modules in CI/CD
- Use Vercel's built-in caching
- Optimize images and assets

## Quick Reference

### Common Commands

```bash
# Development
make dev              # Start dev server
make build            # Build for production
make lint             # Run linter
make typecheck        # Type check

# Deployment
make deploy-prep      # Prepare for deployment
make git-push         # Push to GitHub
vercel --prod         # Deploy to Vercel production
```

### Useful Links

- [Vercel Dashboard](https://vercel.com/dashboard)
- [GitHub Repository](https://github.com/yourusername/your-repo)
- [Supabase Dashboard](https://app.supabase.com)
- [Vercel Documentation](https://vercel.com/docs)

## Next Steps

After successful deployment:

1. ✅ Set up custom domain (optional)
2. ✅ Configure analytics
3. ✅ Set up error monitoring (Sentry, etc.)
4. ✅ Configure backup strategy for database
5. ✅ Set up staging environment (optional)
6. ✅ Document API endpoints (if any)

---

**Need Help?**

- Check Vercel deployment logs
- Review GitHub Actions workflow runs
- Check Supabase logs
- Review application logs in Vercel

Happy Deploying! 🚀












