# Language Exchange App

A modern language exchange platform built with Next.js, Supabase, and TypeScript.

## 🚀 Quick Start

```bash
# Install dependencies
make install

# Set up environment variables
make env

# Start development server
make dev
```

Visit `http://localhost:3000` to see the app.

## 📚 Documentation

- [Deployment Guide](./docs/DEPLOYMENT_GUIDE.md) - Complete guide for deploying to Vercel
- [Quick Deployment](./DEPLOY.md) - Quick reference for deployment
- [Database Schema](./docs/DATABASE_SCHEMA.md) - Database structure and design
- [Supabase Auth Setup](./docs/SUPABASE_AUTH_SETUP.md) - Authentication configuration

## 🛠️ Development

### Available Commands

```bash
make install      # Install dependencies
make dev          # Start development server
make build        # Build for production
make lint         # Run linter
make typecheck    # Type check
make deploy-prep  # Prepare for deployment
```

### Project Structure

```
lang-e/
├── app/              # Next.js app directory
├── components/       # React components
├── lib/              # Utility libraries
├── scripts/          # Database migration scripts
├── docs/             # Documentation
└── public/           # Static assets
```

## 🚢 Deployment

### Quick Deploy to Vercel

1. Push to GitHub:
   ```bash
   make git-init
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. Deploy on Vercel:
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your GitHub repository
   - Add environment variables
   - Deploy!

See [DEPLOY.md](./DEPLOY.md) for detailed instructions.

## 🔧 Environment Variables

Copy `env.local.sample` to `.env.local` and fill in your values:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-key
```

## 📦 Tech Stack

- **Framework**: Next.js 15
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **Deployment**: Vercel
- **CI/CD**: GitHub Actions

## 📝 License

Private project
