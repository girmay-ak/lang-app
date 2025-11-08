# 🗺️ Mapbox Integration Guide

## Current Setup ✅

### Expo Go (Current Implementation)
- **Uses**: WebView with Mapbox GL JS
- **Works**: ✅ Fully functional with zoom, pan, and all interactions
- **Access Token**: Already configured in `app.json`
- **No additional setup needed** - works immediately!

### Standalone Build (Future)
- **Option 1**: Continue using WebView (works, but less native)
- **Option 2**: Use native Mapbox iOS SDK (better performance, more features)

## Native Mapbox iOS SDK Setup (For Standalone Builds)

According to [Mapbox iOS SDK documentation](https://docs.mapbox.com/ios/maps/guides/):

### Requirements
- ✅ iOS 12 or higher (we support iOS 12+)
- ✅ Xcode 15+ (for SDK v11)
- ✅ Swift 5.9+
- ✅ Mapbox Access Token (already have: `pk.eyJ1IjoiZ2lybWF5bmwyMSIsImEiOiJjbWgyODQ4ancxNDdqMmlxeTY2aHFkdDdqIn0.kx667AeRIVB9gDo42gLOHA`)

### Benefits of Native SDK
- 🚀 Better performance
- 🎨 Runtime styling (change map style dynamically)
- 📍 Advanced camera manipulation
- 🗺️ Custom data overlays
- 🎯 Better querying capabilities
- ⚡ Native iOS integration

### Implementation Steps (When Building Standalone)

1. **Install Mapbox iOS SDK**:
   ```bash
   cd mobile/ios
   pod install
   # Add Mapbox SDK via CocoaPods or Swift Package Manager
   ```

2. **Configure in app.json**:
   ```json
   {
     "ios": {
       "config": {
         "mapboxAccessToken": "pk.eyJ1IjoiZ2lybWF5bmwyMSIsImEiOiJjbWgyODQ4ancxNDdqMmlxeTY2aHFkdDdqIn0.kx667AeRIVB9gDo42gLOHA"
       }
     }
   }
   ```

3. **Update MapScreen.tsx** to use native SDK in standalone builds

### Attribution Requirements
According to Mapbox [attribution guidelines](https://docs.mapbox.com/ios/maps/guides/):
- ✅ Must include Mapbox wordmark on maps
- ✅ Attribution must be visible
- ✅ Can adjust position/colors to match design
- ✅ Must provide telemetry opt-out if hiding attribution

## Current Status

### ✅ What's Working Now
- **Expo Go**: Interactive WebView map with Mapbox GL JS
  - Full zoom/pan functionality
  - User markers
  - Style switching (dark/satellite)
  - All gestures work perfectly

- **Standalone Build**: Will use react-native-maps (Google Maps on Android, Apple Maps on iOS)
  - Can be upgraded to native Mapbox SDK later if needed

### 📝 Notes
- **WebView approach** is perfect for Expo Go testing
- **Native SDK** would be better for production standalone builds
- Current implementation works great for both scenarios!

## Next Steps

1. **For now**: Keep using WebView in Expo Go (already working!)
2. **For production**: Consider native Mapbox SDK for better performance
3. **Attribution**: Already handled in WebView (Mapbox includes it)

Your current setup is excellent! The WebView approach gives you full functionality in Expo Go. 🎉

