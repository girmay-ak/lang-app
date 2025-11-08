# 🚀 Start Building Your App

## Quick Start - 3 Steps

### Step 1: Login to Expo

```bash
cd mobile
npx eas login
```

Create account at [expo.dev](https://expo.dev) if you don't have one.

### Step 2: Configure EAS (First Time Only)

```bash
npx eas build:configure
```

This links your project and sets up build configuration.

### Step 3: Build!

**iOS:**
```bash
npm run ios:build
```

**Android:**
```bash
npm run android:build
```

**Both:**
```bash
npm run build:all
```

## Or Use Makefile

```bash
# From project root
make mobile-eas-login      # Login first
make mobile-eas-configure  # Configure (first time)
make mobile-build-ios      # Build iOS
make mobile-build-android  # Build Android
make mobile-build-all      # Build both
```

## Build Types

### Preview Builds (For Testing)
- iOS: Creates `.ipa` file you can install via TestFlight or directly
- Android: Creates `.apk` file you can install directly

```bash
npm run build:ios-preview
npm run build:android-preview
```

### Production Builds (For Stores)
- iOS: Creates build for App Store submission
- Android: Creates `.aab` for Play Store submission

```bash
npm run ios:build
npm run android:build
```

## Build Time

- ⏱️ iOS: ~15-20 minutes
- ⏱️ Android: ~10-15 minutes
- 📧 You'll get an email when build completes
- 🔗 Download link in terminal and Expo dashboard

## Check Build Status

Visit: [expo.dev](https://expo.dev) → Your Account → Projects → lang-exchange → Builds

## Next Steps After Build

1. **iOS:** Download and install on device, or submit to App Store
2. **Android:** Download APK and install, or submit AAB to Play Store

**Ready? Start with Step 1!** 🎉








