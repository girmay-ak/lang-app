# Disable Email Confirmation (Development Only)

For faster development and testing, you can disable email confirmation in Supabase.

## Steps to Disable Email Confirmation

1. **Go to Supabase Dashboard**
   - Navigate to your project at https://supabase.com/dashboard

2. **Open Authentication Settings**
   - Click on "Authentication" in the left sidebar
   - Click on "Providers" tab
   - Find "Email" provider

3. **Disable Email Confirmation**
   - Toggle OFF "Confirm email"
   - Click "Save"

4. **Update Email Templates (Optional)**
   - Go to "Email Templates" tab
   - Customize the confirmation email template if needed

## Alternative: Auto-Confirm Emails for Testing

If you want to keep email confirmation enabled but auto-confirm for testing:

\`\`\`sql
-- Run this in SQL Editor
CREATE OR REPLACE FUNCTION public.auto_confirm_user()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE auth.users
  SET email_confirmed_at = NOW()
  WHERE id = NEW.id
  AND email_confirmed_at IS NULL;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER auto_confirm_user_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION auto_confirm_user();
\`\`\`

## Re-enable for Production

**IMPORTANT**: Always re-enable email confirmation before deploying to production!

1. Go back to Authentication > Providers > Email
2. Toggle ON "Confirm email"
3. Click "Save"

## Testing the Flow

After disabling email confirmation:

1. Sign up with a new email
2. You should be immediately logged in
3. No confirmation email will be sent
4. Session will be active right away

## Troubleshooting

If you still see "Check Your Email" screen:
1. Clear browser localStorage
2. Clear Supabase cache: `localStorage.clear()`
3. Refresh the page
4. Try signing up again
