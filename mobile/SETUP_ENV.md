# Environment Setup Guide

## ✅ Fixed Issues

### 1. **Supabase Configuration Error**
- Added Supabase URL and Anon Key to `app.json` under `extra` field
- Updated `lib/supabase.ts` to check for environment variables from multiple sources:
  - Expo Constants (from `app.json` extra)
  - `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` from `.env`
  - Fallback to `NEXT_PUBLIC_*` variables

### 2. **Inline Component Warning**
- Fixed the Plus screen component to use children prop instead of inline function
- Changed from `component={() => null}` to `{() => null}` as children

### 3. **Error Handling**
- Added graceful error handling in `App.tsx` for missing Supabase configuration
- App will show onboarding/login screens even if Supabase is not configured

## Configuration Options

### Option 1: Use app.json (Recommended for Expo)
The Supabase credentials are already configured in `mobile/app.json`:
```json
"extra": {
  "supabaseUrl": "https://lnmgmxblinnqfsecjkdu.supabase.co",
  "supabaseAnonKey": "your-key-here"
}
```

### Option 2: Use .env file
Create `mobile/.env`:
```env
EXPO_PUBLIC_SUPABASE_URL=https://lnmgmxblinnqfsecjkdu.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### Option 3: Use process.env directly
Set environment variables before running:
```bash
export EXPO_PUBLIC_SUPABASE_URL="https://lnmgmxblinnqfsecjkdu.supabase.co"
export EXPO_PUBLIC_SUPABASE_ANON_KEY="your-key"
npx expo start
```

## Current Configuration

The app is currently configured with:
- **Supabase URL**: `https://lnmgmxblinnqfsecjkdu.supabase.co`
- **Anon Key**: Set in `app.json`

## Testing

After configuration, restart the Expo dev server:
```bash
cd mobile
npx expo start --clear
```

The app should now:
1. ✅ Load without Supabase errors
2. ✅ Show onboarding on first launch
3. ✅ Show login screen if not authenticated
4. ✅ Handle auth state changes properly






