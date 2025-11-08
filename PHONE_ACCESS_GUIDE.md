# 📱 How to Access App on Your Phone

## 🚀 Quick Start - Access on Phone NOW

### Option 1: Web App (Works Immediately)
1. **Find your laptop's IP address:**
   ```bash
   # On Mac, run this in terminal:
   ipconfig getifaddr en0
   # Or check in System Preferences > Network
   ```

2. **Make sure phone and laptop are on the same WiFi network**

3. **Open on your phone's browser:**
   - Go to: `http://YOUR_IP_ADDRESS:3000`
   - Example: `http://192.168.1.100:3000`

### Option 2: Mobile App (Expo Go - Works with Tunnel)

1. **Install Expo Go app on your phone:**
   - iOS: Download from App Store
   - Android: Download from Google Play Store

2. **Start the mobile app with tunnel:**
   ```bash
   cd mobile
   npx expo start --tunnel
   ```
   This creates a tunnel URL that works even when disconnected!

3. **Scan the QR code:**
   - Open Expo Go app
   - Tap "Scan QR Code"
   - Scan the QR code from terminal
   - The app will load on your phone

## 🔌 Making App Work WITHOUT Laptop Connection

### Method 1: Use Expo Tunnel (Easiest - Already Set Up!)
The `--tunnel` flag creates a public URL that works anywhere:
- ✅ Works even when phone and laptop are on different networks
- ✅ Works when laptop is closed/disconnected
- ⚠️ Requires laptop to be running (but can be on different network)

**To use:**
```bash
cd mobile
npx expo start --tunnel
```
Scan the QR code - it will work from anywhere!

### Method 2: Build Standalone App (Best for Production)

This creates a real app that works completely independently:

#### For iOS:
```bash
cd mobile
npm run ios:build
# Follow prompts to build with EAS
```

#### For Android:
```bash
cd mobile
npm run android:build
# Follow prompts to build with EAS
```

**After building:**
1. Download the `.ipa` (iOS) or `.apk` (Android) file
2. Install on your phone:
   - **iOS**: Use TestFlight or install via Xcode
   - **Android**: Transfer `.apk` to phone and install

### Method 3: Development Build (For Testing)

This creates a development version that still needs backend but works standalone:

```bash
cd mobile
eas build --profile development --platform ios
# or
eas build --profile development --platform android
```

## 📋 Current Status

✅ **Web App**: Running at `http://localhost:3000`
✅ **Mobile App**: Starting with tunnel mode
✅ **Supabase**: Configured in `app.json`

## 🔍 Troubleshooting

### Can't access web app on phone?
1. Check firewall settings on your Mac
2. Make sure both devices are on same WiFi
3. Try using your Mac's IP address instead of localhost

### Expo tunnel not working?
1. Make sure you have an Expo account (free)
2. Run: `npx expo login`
3. Try: `npx expo start --tunnel --clear`

### Want to deploy permanently?
1. Deploy web app to Vercel (free)
2. Build mobile app with EAS Build
3. Submit to App Store / Google Play

## 💡 Recommended Approach

**For Testing Now:**
- Use Expo Go with `--tunnel` flag (already started)
- Scan QR code to test on phone
- Works even when disconnected from laptop

**For Production:**
- Build standalone app with EAS Build
- Install on phone as a real app
- Works completely independently!

