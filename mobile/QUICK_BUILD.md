# Quick Build Guide 🚀

## Step 1: Login to Expo

```bash
cd mobile
npx eas login
```

Enter your Expo account credentials (create one at [expo.dev](https://expo.dev) if needed)

## Step 2: Configure EAS (First Time Only)

```bash
npx eas build:configure
```

This will:
- Link your project to Expo
- Update `app.json` with project ID
- Set up build profiles

## Step 3: Build iOS App

**For Testing (Preview):**
```bash
npm run build:ios-preview
```

**For App Store (Production):**
```bash
npm run ios:build
```

## Step 4: Build Android App

**For Testing (APK):**
```bash
npm run build:android-preview
```

**For Play Store (AAB):**
```bash
npm run android:build
```

## Build Both

```bash
npm run build:all
```

## What Happens

1. ✅ Code is uploaded to Expo servers
2. ✅ Build runs in the cloud
3. ✅ You get download link via email/terminal
4. ✅ iOS builds: ~15-20 minutes
5. ✅ Android builds: ~10-15 minutes

## Check Build Status

Visit: [expo.dev](https://expo.dev) → Your Project → Builds

Or check terminal for build URL.

## First Time Setup

1. Create Expo account: [expo.dev/signup](https://expo.dev/signup)
2. Run `npx eas login`
3. Run `npx eas build:configure`
4. Build!

**Ready to build?** Start with Step 1! 🎉









