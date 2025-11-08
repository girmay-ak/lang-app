# 📱 How to Use App on Your Phone

## 🚀 Quick Start - Access NOW

### Option 1: Web App (Same WiFi)
1. **On your phone's browser**, go to:
   ```
   http://10.166.84.66:3000
   ```
   *(Make sure phone and laptop are on same WiFi)*

### Option 2: Mobile App (Expo Go - Same WiFi)
1. **Install Expo Go** on your phone:
   - iOS: App Store → Search "Expo Go"
   - Android: Google Play → Search "Expo Go"

2. **Open Expo Go** and tap "Scan QR Code"

3. **Look at your terminal** - you should see a QR code
   - If not, run: `cd mobile && npx expo start --lan`

4. **Scan the QR code** - app will load!

---

## 🔌 Make It Work WITHOUT Laptop Connection

### Method 1: Build Standalone App (BEST - Works Completely Alone)

This creates a REAL app that works 100% independently:

```bash
cd mobile

# For iPhone:
npm run ios:build

# For Android:
npm run android:build
```

**What happens:**
1. You'll need an Expo account (free at expo.dev)
2. Build will take 10-20 minutes
3. You'll get a download link
4. Install on your phone like any app
5. **Works completely without laptop!**

### Method 2: Use Tunnel (Works Anywhere, but Laptop Must Be On)

```bash
cd mobile
npx expo start --tunnel
```

**How it works:**
- Creates a public URL that works from anywhere
- Phone and laptop don't need to be on same WiFi
- ⚠️ **Laptop must be running** (but can be anywhere)

**Note:** Tunnel might fail if ngrok is slow. Try again or use Method 1.

### Method 3: LAN Mode (Same WiFi Only)

```bash
cd mobile
npx expo start --lan
```

**How it works:**
- Phone and laptop must be on same WiFi
- ⚠️ **Laptop must be running**
- ✅ Fast and reliable

---

## 📋 Current Setup

✅ **Web App**: `http://10.166.84.66:3000` (same WiFi)
✅ **Mobile App**: Starting with LAN mode
✅ **Supabase**: Already configured

---

## 🎯 Recommended: Build Standalone App

**Why?**
- ✅ Works completely independently
- ✅ No laptop needed
- ✅ Works like a real app
- ✅ Can submit to App Store/Play Store later

**Steps:**
1. Sign up at expo.dev (free)
2. Run: `cd mobile && npx expo login`
3. Run: `npm run ios:build` or `npm run android:build`
4. Download and install on phone
5. Done! Works forever without laptop!

---

## 💡 Quick Commands

```bash
# Start mobile app (same WiFi)
cd mobile && npx expo start --lan

# Start mobile app (works anywhere, laptop must be on)
cd mobile && npx expo start --tunnel

# Build standalone app (works without laptop)
cd mobile && npm run ios:build
cd mobile && npm run android:build

# Start web app
npm run dev
```

