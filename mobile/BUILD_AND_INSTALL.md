# 📱 Building and Installing the App on Your Phone

This guide will help you build and install the app on your phone so you can use it without connecting to your computer.

## Prerequisites

1. ✅ EAS CLI is installed (already done)
2. ✅ Expo account (free)
3. ✅ Phone ready to install

## Step 1: Login to EAS

```bash
cd mobile
npm run eas:login
```

Or if you prefer:
```bash
eas login
```

Enter your Expo account credentials (create one at https://expo.dev if you don't have one).

## Step 2: Configure EAS Project (if needed)

```bash
npm run eas:configure
```

This will create/update the `eas.json` file and set up your project ID.

## Step 3: Build for Your Phone

### For iOS (iPhone):

```bash
npm run build:ios-preview
```

Or for a development build:
```bash
eas build --platform ios --profile development
```

### For Android:

```bash
npm run build:android-preview
```

Or for a development build:
```bash
eas build --platform android --profile development
```

## Step 4: Install on Your Phone

### Option A: Preview Build (Recommended for Testing)

Preview builds are perfect for testing on your device without app stores:

**iOS:**
- The build will be available as a download link
- You can install it via TestFlight (if you set it up) or direct download
- For direct download, you'll get a link after the build completes

**Android:**
- You'll get an APK download link
- Download it on your phone
- Enable "Install from Unknown Sources" in Android settings
- Install the APK

### Option B: Development Build (For Active Development)

Development builds allow you to:
- Use the app standalone
- Connect to Metro bundler if needed (for hot reload)
- Test all native features

```bash
# iOS
eas build --platform ios --profile development

# Android
eas build --platform android --profile development
```855474

## Step 5: Track Your Build

After starting a build, you can:

1. Check build status:
```bash
eas build:list
```

2. View build details in browser:
```bash
eas build:view
```

3. Get the download link when the build completes

## Quick Commands Summary

```bash
# Login to EAS
npm run eas:login

# Build for iOS (Preview)
npm run build:ios-preview

# Build for Android (Preview)
npm run build:android-preview

# Build for both platforms
npm run build:all

# Check build status
eas build:list

# View latest build
eas build:view
```

## Important Notes

1. **Build Time**: First build takes 10-20 minutes. Subsequent builds are faster.

2. **Project ID**: Update `app.json` with your actual EAS project ID:
   ```json
   "extra": {
     "eas": {
       "projectId": "your-actual-project-id"
     }
   }
   ```

3. **iOS Requirements**: 
   - For iOS, you need an Apple Developer account (free for personal use)
   - Preview builds can be installed via TestFlight or direct download

4. **Android Requirements**:
   - No special account needed for preview builds
   - Just enable "Install from Unknown Sources"

5. **Map Keys**: Make sure your Google Maps and Mapbox keys are valid and have proper restrictions set.

## Troubleshooting

If you get errors:

1. **Not logged in**: Run `eas login`
2. **Project not configured**: Run `eas build:configure`
3. **Build fails**: Check the build logs in the Expo dashboard

## Next Steps After Installation

Once installed on your phone:
- ✅ The app works completely offline (no computer connection needed)
- ✅ All features work as expected
- ✅ You can use it like any other app on your phone

For updates, you'll need to create a new build and reinstall, or set up OTA updates with EAS Update.

