# Mobile Build Guide - iOS & Android

Complete guide for building native iOS and Android apps from your Language Exchange app.

## 📱 Overview

We support two approaches:

1. **PWA (Progressive Web App)** - Installable web app (Quickest)
2. **React Native/Expo** - Native iOS and Android apps (Full native experience)

## 🚀 Option 1: PWA (Progressive Web App)

### What is PWA?

A PWA allows users to install your web app on their phone like a native app. It works on both iOS and Android.

### Setup Complete!

The PWA is already configured:
- ✅ `manifest.json` created
- ✅ Service worker ready
- ✅ Mobile metadata in layout

### Testing PWA

1. Build your Next.js app:
   ```bash
   pnpm build
   pnpm start
   ```

2. **On iOS (Safari)**:
   - Open your app URL
   - Tap Share button
   - Tap "Add to Home Screen"

3. **On Android (Chrome)**:
   - Open your app URL
   - Tap menu (3 dots)
   - Tap "Add to Home Screen" or "Install App"

### PWA Icons

You need to create app icons:
- `public/icon-192.png` - 192x192px
- `public/icon-512.png` - 512x512px

Generate icons using:
- [PWA Asset Generator](https://www.pwabuilder.com/imageGenerator)
- [RealFaviconGenerator](https://realfavicongenerator.net/)

## 📲 Option 2: React Native/Expo (Native Apps)

### Prerequisites

- Node.js 18+
- npm or yarn
- **For iOS**: Xcode (macOS only)
- **For Android**: Android Studio
- Expo CLI: `npm install -g expo-cli eas-cli`

### Initial Setup

1. **Navigate to mobile directory:**
   ```bash
   cd mobile
   npm install
   ```

2. **Create Expo account:**
   ```bash
   npx expo login
   ```

3. **Initialize EAS (Expo Application Services):**
   ```bash
   npx eas init
   ```
   - This will ask you to create an Expo account if you don't have one
   - It will create a project ID

4. **Update `app.json`**:
   - Replace `"your-project-id-here"` with your actual project ID from EAS

### Development

**Start development server:**
```bash
npm start
# or
npx expo start
```

**Run on iOS Simulator:**
```bash
npm run ios
# or
npx expo start --ios
```

**Run on Android Emulator:**
```bash
npm run android
# or
npx expo start --android
```

**Scan QR code with Expo Go app:**
- Install "Expo Go" from App Store/Play Store
- Scan QR code from terminal

### Building Native Apps

#### iOS Build

1. **Configure EAS Build:**
   ```bash
   npx eas build:configure
   ```

2. **Build for iOS:**
   ```bash
   npm run ios:build
   # or
   npx eas build --platform ios
   ```

3. **Build Options:**
   - **Development Build**: For testing
   - **Preview Build**: For TestFlight/Internal testing
   - **Production Build**: For App Store submission

#### Android Build

1. **Build for Android:**
   ```bash
   npm run android:build
   # or
   npx eas build --platform android
   ```

2. **Build Options:**
   - **APK**: For direct installation (preview)
   - **AAB**: For Play Store submission (production)

### App Store Submission

#### iOS (App Store)

1. **Build production app:**
   ```bash
   npx eas build --platform ios --profile production
   ```

2. **Submit to App Store:**
   ```bash
   npx eas submit --platform ios
   ```

   You'll need:
   - Apple Developer account ($99/year)
   - App Store Connect access
   - Bundle identifier (already set: `com.langexchange.app`)

#### Android (Google Play Store)

1. **Build production app:**
   ```bash
   npx eas build --platform android --profile production
   ```

2. **Submit to Play Store:**
   ```bash
   npx eas submit --platform android
   ```

   You'll need:
   - Google Play Developer account ($25 one-time)
   - Play Store Console access
   - Package name (already set: `com.langexchange.app`)

### Environment Variables

Create `mobile/.env`:

```env
EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-key
```

### Sharing Code Between Web and Mobile

Since you have a Next.js web app, consider:

1. **Shared business logic**: Move to a `shared/` directory
2. **Supabase client**: Already compatible with React Native
3. **API routes**: Use Next.js API routes, mobile calls them

### Mobile-Specific Features

The mobile app includes:

- ✅ Location services (`expo-location`)
- ✅ Push notifications (`expo-notifications`)
- ✅ Offline storage (`@react-native-async-storage/async-storage`)
- ✅ Native navigation (React Navigation)

### Troubleshooting

**iOS Build Issues:**
- Make sure you have Xcode installed
- Run `sudo xcode-select --switch /Applications/Xcode.app`
- Check your Apple Developer account is active

**Android Build Issues:**
- Install Android Studio
- Set up Android SDK
- Add Android environment variables:
  ```bash
  export ANDROID_HOME=$HOME/Library/Android/sdk
  export PATH=$PATH:$ANDROID_HOME/emulator
  export PATH=$PATH:$ANDROID_HOME/tools
  export PATH=$PATH:$ANDROID_HOME/tools/bin
  export PATH=$PATH:$ANDROID_HOME/platform-tools
  ```

**Expo Build Fails:**
- Check `eas.json` configuration
- Verify environment variables are set
- Check EAS project ID in `app.json`

## 📋 Quick Reference

### PWA Commands

```bash
# Build and test PWA
pnpm build
pnpm start

# Access on mobile browser
# iOS: Safari → Add to Home Screen
# Android: Chrome → Install App
```

### React Native Commands

```bash
# Development
cd mobile
npm start
npm run ios        # iOS simulator
npm run android    # Android emulator

# Build
npm run ios:build      # Build iOS app
npm run android:build # Build Android app

# Submit to stores
npx eas submit --platform ios
npx eas submit --platform android
```

## 🎯 Recommended Approach

**For Quick Launch:**
1. Start with PWA - Get it working immediately
2. Test user adoption and features
3. Build native apps if needed

**For Full Native Experience:**
1. Use React Native/Expo from the start
2. Share Supabase integration
3. Build platform-specific features

## 📚 Resources

- [Expo Documentation](https://docs.expo.dev/)
- [EAS Build Guide](https://docs.expo.dev/build/introduction/)
- [React Navigation](https://reactnavigation.org/)
- [PWA Documentation](https://web.dev/progressive-web-apps/)

---

**Ready to build?** Start with PWA for quick testing, then move to native if needed! 🚀









