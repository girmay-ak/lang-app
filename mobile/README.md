# Language Exchange Mobile App

## Quick Start

### Prerequisites
- Node.js 18+
- Expo CLI: `npm install -g expo-cli`
- iOS Simulator (macOS) or physical iOS device
- Xcode (for iOS simulator)

### Running on iOS

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start development server:**
   ```bash
   npm start
   # or
   npx expo start
   ```

3. **Run on iOS Simulator:**
   ```bash
   npm run ios
   # or
   npx expo start --ios
   ```

4. **Run on physical device:**
   - Install "Expo Go" app from App Store
   - Scan QR code from terminal
   - Or press `i` in the terminal to open iOS simulator

### Troubleshooting

**Port already in use:**
```bash
npx expo start --port 8082
```

**Missing assets:**
Create these files in `assets/`:
- `icon.png` - 1024x1024px app icon
- `splash.png` - 2048x2048px splash screen
- `adaptive-icon.png` - 1024x1024px (Android)

**iOS Simulator not opening:**
- Make sure Xcode is installed
- Run: `sudo xcode-select --switch /Applications/Xcode.app`
- Try: `open -a Simulator` to manually open simulator

### Next Steps

1. Add your app screens to replace placeholder screens in `App.tsx`
2. Connect to your Supabase backend
3. Add navigation between screens
4. Implement your features












