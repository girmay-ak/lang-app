# Building iOS & Android Apps

## Prerequisites

1. **Expo Account** - Create one at [expo.dev](https://expo.dev)
2. **EAS CLI** - Build tool for Expo apps
3. **Apple Developer Account** (for iOS) - $99/year
4. **Google Play Developer Account** (for Android) - $25 one-time

## Setup Steps

### 1. Install EAS CLI

```bash
npm install -g eas-cli
```

### 2. Login to Expo

```bash
npx eas login
```

### 3. Initialize EAS

```bash
cd mobile
npx eas build:configure
```

This will:
- Create your EAS project
- Update `app.json` with your project ID
- Set up build profiles

### 4. Build Options

**iOS Preview Build (for testing):**
```bash
npx eas build --platform ios --profile preview
```

**iOS Production Build (for App Store):**
```bash
npx eas build --platform ios --profile production
```

**Android Preview Build (APK for direct install):**
```bash
npx eas build --platform android --profile preview
```

**Android Production Build (AAB for Play Store):**
```bash
npx eas build --platform android --profile production
```

**Both Platforms:**
```bash
npx eas build --platform all --profile production
```

## Build Process

1. EAS uploads your code to Expo's servers
2. Build runs in the cloud
3. You get a download link when complete
4. iOS builds take ~15-20 minutes
5. Android builds take ~10-15 minutes

## Quick Start

```bash
# 1. Login
npx eas login

# 2. Configure (first time only)
npx eas build:configure

# 3. Build iOS
npm run ios:build

# 4. Build Android
npm run android:build
```

## Build Status

Check builds at: [expo.dev/accounts/[your-account]/projects/lang-exchange/builds](https://expo.dev)

## Notes

- First build may take longer
- Free tier: Limited builds per month
- Paid tier: More builds + faster queue
- Builds are queued - may need to wait















