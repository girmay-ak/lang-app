# Supabase Authentication Setup Guide

Complete step-by-step guide to configure authentication for the Language Exchange app.

## Table of Contents
1. [Supabase Dashboard Configuration](#supabase-dashboard-configuration)
2. [Environment Variables](#environment-variables)
3. [Email Templates](#email-templates)
4. [Social OAuth Setup](#social-oauth-setup)
5. [Security Settings](#security-settings)
6. [Testing](#testing)

---

## 1. Supabase Dashboard Configuration

### Step 1.1: Enable Authentication Methods

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Providers**
3. Enable the following providers:

#### Email/Password
- Toggle **Email** to ON
- **Confirm email**: Toggle ON (recommended for production)
- **Secure email change**: Toggle ON
- **Secure password change**: Toggle ON

#### Google OAuth
- Toggle **Google** to ON
- Click **Configure**
- Add your Google OAuth credentials:
  - **Client ID**: Get from [Google Cloud Console](https://console.cloud.google.com/)
  - **Client Secret**: Get from Google Cloud Console
- **Authorized redirect URLs**: `https://[YOUR-PROJECT-REF].supabase.co/auth/v1/callback`

#### Facebook OAuth
- Toggle **Facebook** to ON
- Click **Configure**
- Add your Facebook App credentials:
  - **App ID**: Get from [Facebook Developers](https://developers.facebook.com/)
  - **App Secret**: Get from Facebook Developers
- **Authorized redirect URLs**: `https://[YOUR-PROJECT-REF].supabase.co/auth/v1/callback`

#### Apple OAuth
- Toggle **Apple** to ON
- Click **Configure**
- Add your Apple credentials:
  - **Services ID**: Get from [Apple Developer](https://developer.apple.com/)
  - **Team ID**: Your Apple Developer Team ID
  - **Key ID**: Your Apple Sign In Key ID
  - **Private Key**: Your .p8 private key file content
- **Authorized redirect URLs**: `https://[YOUR-PROJECT-REF].supabase.co/auth/v1/callback`

### Step 1.2: Configure Email Settings

1. Navigate to **Authentication** → **Email Templates**
2. Configure the following templates:

#### Confirm Signup Template
\`\`\`html
<h2>Confirm your signup</h2>
<p>Welcome to Language Exchange! 🌍</p>
<p>Click the link below to confirm your email address and start connecting with language partners:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm your email</a></p>
<p>If you didn't create an account, you can safely ignore this email.</p>
\`\`\`

#### Reset Password Template
\`\`\`html
<h2>Reset your password</h2>
<p>Someone requested a password reset for your Language Exchange account.</p>
<p>Click the link below to reset your password:</p>
<p><a href="{{ .ConfirmationURL }}">Reset password</a></p>
<p>This link expires in 1 hour.</p>
<p>If you didn't request this, you can safely ignore this email.</p>
\`\`\`

#### Magic Link Template
\`\`\`html
<h2>Your magic link</h2>
<p>Click the link below to sign in to Language Exchange:</p>
<p><a href="{{ .ConfirmationURL }}">Sign in</a></p>
<p>This link expires in 1 hour.</p>
\`\`\`

### Step 1.3: Configure URL Settings

1. Navigate to **Authentication** → **URL Configuration**
2. Set the following URLs:

- **Site URL**: `https://your-domain.com` (production) or `http://localhost:3000` (development)
- **Redirect URLs**: Add all allowed redirect URLs:
  \`\`\`
  http://localhost:3000/**
  https://your-domain.com/**
  https://your-vercel-app.vercel.app/**
  \`\`\`

---

## 2. Environment Variables

Add these environment variables to your project:

### Required Variables (Already Set)
\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
\`\`\`

### Additional Variables for Development
\`\`\`env
# Development redirect URL for email confirmation
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000

# Production site URL
NEXT_PUBLIC_SITE_URL=https://your-domain.com
\`\`\`

### How to Add in Vercel
1. Go to your Vercel project
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable with appropriate values for:
   - Production
   - Preview
   - Development

---

## 3. Social OAuth Setup

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **Google+ API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure OAuth consent screen:
   - App name: "Language Exchange"
   - User support email: your-email@example.com
   - Scopes: email, profile
6. Create OAuth 2.0 Client ID:
   - Application type: Web application
   - Authorized redirect URIs:
     \`\`\`
     https://[YOUR-PROJECT-REF].supabase.co/auth/v1/callback
     \`\`\`
7. Copy **Client ID** and **Client Secret** to Supabase

### Facebook OAuth Setup

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app or select existing
3. Add **Facebook Login** product
4. Configure Facebook Login settings:
   - Valid OAuth Redirect URIs:
     \`\`\`
     https://[YOUR-PROJECT-REF].supabase.co/auth/v1/callback
     \`\`\`
5. Go to **Settings** → **Basic**
6. Copy **App ID** and **App Secret** to Supabase
7. Make app public (switch from Development to Live mode)

### Apple OAuth Setup

1. Go to [Apple Developer](https://developer.apple.com/)
2. Create an **App ID** with Sign In with Apple capability
3. Create a **Services ID**:
   - Configure Sign In with Apple
   - Add domain: your-domain.com
   - Add return URL:
     \`\`\`
     https://[YOUR-PROJECT-REF].supabase.co/auth/v1/callback
     \`\`\`
4. Create a **Key** for Sign In with Apple
5. Download the .p8 key file
6. Copy all credentials to Supabase

---

## 4. Security Settings

### Step 4.1: Password Requirements

1. Navigate to **Authentication** → **Policies**
2. Configure password requirements:
   - **Minimum password length**: 8 characters
   - **Require uppercase**: ON
   - **Require lowercase**: ON
   - **Require numbers**: ON
   - **Require special characters**: OFF (optional)

### Step 4.2: Rate Limiting

1. Navigate to **Authentication** → **Rate Limits**
2. Configure limits:
   - **Email signups**: 10 per hour per IP
   - **Password attempts**: 5 per hour per email
   - **Password resets**: 3 per hour per email
   - **Email sends**: 10 per hour per user

### Step 4.3: Session Settings

1. Navigate to **Authentication** → **Settings**
2. Configure session:
   - **JWT expiry**: 3600 seconds (1 hour)
   - **Refresh token expiry**: 2592000 seconds (30 days)
   - **Refresh token rotation**: ON
   - **Reuse interval**: 10 seconds

### Step 4.4: Email Verification

1. Navigate to **Authentication** → **Settings**
2. Configure email verification:
   - **Enable email confirmations**: ON
   - **Secure email change**: ON
   - **Double confirm email changes**: ON

---

## 5. Database Triggers

The following trigger automatically creates a user profile when a new auth user is created:

\`\`\`sql
-- This is already in your database from script 002_fix_users_rls.sql
-- Verify it exists by checking Functions in Supabase dashboard

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
\`\`\`

---

## 6. Row Level Security (RLS) Policies

Verify these RLS policies are in place:

\`\`\`sql
-- Users table policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Anyone can read public profiles (for discovery)
CREATE POLICY "Public profiles are viewable"
  ON users FOR SELECT
  USING (true);
\`\`\`

---

## 7. Testing Checklist

### Email/Password Signup
- [ ] User can sign up with email and password
- [ ] Confirmation email is sent
- [ ] User can confirm email via link
- [ ] User profile is created automatically
- [ ] User can log in after confirmation

### Social OAuth
- [ ] Google sign in works
- [ ] Facebook sign in works
- [ ] Apple sign in works (test on iOS device)
- [ ] User profile is created automatically
- [ ] User can log in again with same provider

### Password Reset
- [ ] User can request password reset
- [ ] Reset email is sent
- [ ] Reset link works and expires after 1 hour
- [ ] User can set new password
- [ ] User can log in with new password

### Security
- [ ] Rate limiting works (try multiple failed logins)
- [ ] Email verification is required
- [ ] Weak passwords are rejected
- [ ] Sessions expire correctly
- [ ] Refresh tokens work

### Session Management
- [ ] User stays logged in after page refresh
- [ ] User can log out
- [ ] Session expires after inactivity
- [ ] Multiple devices can be logged in

---

## 8. Troubleshooting

### Issue: Email confirmation not working
**Solution**: Check that "Confirm email" is enabled in Authentication settings and that your email templates are configured correctly.

### Issue: Social OAuth redirect fails
**Solution**: Verify that redirect URLs are correctly configured in both Supabase and the OAuth provider's dashboard.

### Issue: User profile not created
**Solution**: Check that the `handle_new_user()` trigger exists and is enabled. Run the SQL from section 5.

### Issue: RLS policy blocks user access
**Solution**: Verify RLS policies allow users to read/update their own profiles. Check policies in Database → Tables → users.

### Issue: Session not persisting
**Solution**: Ensure `persistSession: true` is set in the Supabase client configuration and that cookies/localStorage are not blocked.

---

## 9. Production Checklist

Before going live:

- [ ] All OAuth providers are configured and tested
- [ ] Email templates are customized with your branding
- [ ] Rate limiting is enabled
- [ ] Email verification is required
- [ ] RLS policies are in place
- [ ] Database triggers are working
- [ ] Environment variables are set in production
- [ ] Redirect URLs include production domain
- [ ] Test all auth flows in production environment
- [ ] Monitor auth logs for errors

---

## Support

For issues or questions:
- Supabase Docs: https://supabase.com/docs/guides/auth
- Supabase Discord: https://discord.supabase.com
- Project Issues: Create an issue in your repository
