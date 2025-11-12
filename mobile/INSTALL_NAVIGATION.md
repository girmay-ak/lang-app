# Navigation Setup - After App Works

## Current Status

I've simplified the app to a basic version first to ensure it runs without errors. Once this works, we'll add navigation back.

## To Add Navigation Back

Once the basic app is running:

1. **Install navigation dependencies:**
   ```bash
   cd mobile
   npm install react-native-gesture-handler react-native-reanimated --legacy-peer-deps
   ```

2. **Update babel.config.js:**
   ```js
   module.exports = function(api) {
     api.cache(true);
     return {
       presets: ['babel-preset-expo'],
       plugins: ['react-native-reanimated/plugin'],
     };
   };
   ```

3. **Restore navigation:**
   - Copy `App-with-navigation.tsx.backup` to `App.tsx`
   - Or manually add navigation components

## For Now

The simplified App.tsx should work without errors. Test it first, then we can add navigation once it's stable.















