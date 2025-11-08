# Quick Deployment Guide

## 🚀 Quick Start

### 1. Prepare Your Code

```bash
# Install dependencies
make install

# Test locally
make dev
```

### 2. Push to GitHub

```bash
# If not already initialized
make git-init

# Create GitHub repo, then:
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

### 3. Deploy to Vercel

**Via Dashboard (Easiest):**
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Add environment variables (see below)
4. Click Deploy

**Via CLI:**
```bash
npm install -g vercel
vercel login
vercel --prod
```

### 4. Add Environment Variables in Vercel

Go to **Settings → Environment Variables** and add:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=https://your-app.vercel.app/auth/callback
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-key
```

### 5. Update Supabase Redirect URLs

In Supabase Dashboard → Authentication → URL Configuration:

- **Site URL**: `https://your-app.vercel.app`
- **Redirect URLs**: Add `https://your-app.vercel.app/auth/callback`

## 📝 Next Steps

1. Set up GitHub Actions secrets (see `docs/DEPLOYMENT_GUIDE.md`)
2. Test your deployment
3. Set up custom domain (optional)

For detailed instructions, see `docs/DEPLOYMENT_GUIDE.md`








