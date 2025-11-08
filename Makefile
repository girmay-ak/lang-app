# Makefile for common project tasks

PNPM=pnpm
TS_NODE=./node_modules/.bin/tsc

.PHONY: install dev build start lint typecheck env env-print deploy-prep git-init git-push vercel-setup mobile-setup mobile-install mobile-dev mobile-build-ios mobile-build-android

install:
	$(PNPM) install

dev:
	$(PNPM) dev

build:
	$(PNPM) build

start:
	$(PNPM) start

lint:
	$(PNPM) lint

typecheck:
	$(TS_NODE) -p tsconfig.json --noEmit

# Create .env.local from sample (won't overwrite existing)
env:
	@if [ -f .env.local ]; then \
		echo ".env.local already exists. Skipping."; \
	else \
		cp env.local.sample .env.local && echo ".env.local created from env.local.sample"; \
	fi

# Print selected envs for quick verification
env-print:
	@echo "NEXT_PUBLIC_SUPABASE_URL=$$NEXT_PUBLIC_SUPABASE_URL"
	@echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=$${NEXT_PUBLIC_SUPABASE_ANON_KEY:.0}... (hidden)"
	@echo "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=$${NEXT_PUBLIC_GOOGLE_MAPS_API_KEY:.0}... (hidden)"

# Git and Deployment Commands
git-init:
	@echo "Initializing git repository..."
	git init
	git add .
	git commit -m "Initial commit: Language Exchange App"
	@echo "Git repository initialized. Next steps:"
	@echo "1. Create a GitHub repository"
	@echo "2. Run: git remote add origin <your-repo-url>"
	@echo "3. Run: git push -u origin main"

git-push:
	@echo "Pushing to GitHub..."
	git add .
	git commit -m "Update: $(shell date +'%Y-%m-%d %H:%M:%S')" || echo "No changes to commit"
	git push

# Prepare for deployment
deploy-prep:
	@echo "Preparing for deployment..."
	@echo "1. Running linter..."
	$(PNPM) lint || echo "Lint warnings found"
	@echo "2. Building application..."
	$(PNPM) build
	@echo "3. Checking environment variables..."
	@test -f .env.local || (echo "Warning: .env.local not found. Create it from env.local.sample" && exit 1)
	@echo "Deployment preparation complete!"

# Vercel setup helper
vercel-setup:
	@echo "To set up Vercel:"
	@echo "1. Install Vercel CLI: npm i -g vercel"
	@echo "2. Run: vercel login"
	@echo "3. Run: vercel"
	@echo "4. Follow the prompts to link your project"

# Mobile Development Commands
mobile-setup:
	@echo "Setting up mobile development environment..."
	@cd mobile && npm install || echo "Mobile directory not found. Run: mkdir mobile"
	@echo "Mobile setup complete!"

mobile-install:
	@echo "Installing mobile dependencies..."
	@cd mobile && npm install

mobile-dev:
	@echo "Starting mobile development server..."
	@cd mobile && npm start

mobile-build-ios:
	@echo "Building iOS app..."
	@cd mobile && npx eas build --platform ios

mobile-build-android:
	@echo "Building Android app..."
	@cd mobile && npx eas build --platform android

mobile-build-all:
	@echo "Building for both iOS and Android..."
	@cd mobile && npx eas build --platform all

mobile-eas-login:
	@echo "Logging into Expo..."
	@cd mobile && npx eas login

mobile-eas-configure:
	@echo "Configuring EAS build..."
	@cd mobile && npx eas build:configure
