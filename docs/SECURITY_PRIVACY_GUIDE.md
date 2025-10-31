# Security & Privacy System Guide

Complete implementation of security, privacy, blocking, reporting, and GDPR compliance for the Language Exchange app.

## Table of Contents

1. [Overview](#overview)
2. [Blocking System](#blocking-system)
3. [Reporting System](#reporting-system)
4. [Privacy Settings](#privacy-settings)
5. [Rate Limiting](#rate-limiting)
6. [Content Moderation](#content-moderation)
7. [GDPR Compliance](#gdpr-compliance)
8. [Admin Functions](#admin-functions)

## Overview

The security and privacy system provides comprehensive protection for users with:

- **Blocking**: Users can block each other with complete isolation
- **Reporting**: Report inappropriate content with admin review
- **Privacy Controls**: Granular settings for visibility and discoverability
- **Rate Limiting**: Prevent abuse and spam
- **Content Moderation**: Auto-flagging and manual review
- **GDPR Compliance**: Data export and account deletion

## Blocking System

### Block a User

\`\`\`typescript
import { blockUser } from '@/lib/supabase/security'

await blockUser('user-id-to-block')
\`\`\`

### Unblock a User

\`\`\`typescript
import { unblockUser } from '@/lib/supabase/security'

await unblockUser('user-id-to-unblock')
\`\`\`

### Check if User is Blocked

\`\`\`typescript
import { isUserBlocked } from '@/lib/supabase/security'

const blocked = await isUserBlocked('user-id')
\`\`\`

### Get Blocked Users List

\`\`\`typescript
import { getBlockedUsers } from '@/lib/supabase/security'

const blockedUsers = await getBlockedUsers()
\`\`\`

### What Happens When You Block Someone

- They can't see you in discovery
- They can't message you
- They can't see your stories
- They can't see your activity
- Past messages remain visible (for safety/reporting)
- The block is mutual (they can't see you either)

## Reporting System

### Create a Report

\`\`\`typescript
import { createReport } from '@/lib/supabase/security'

await createReport({
  reportedUserId: 'user-id',
  reportType: 'harassment',
  contentType: 'message',
  contentId: 'message-id',
  reason: 'This user is sending inappropriate messages'
})
\`\`\`

### Report Types

- `inappropriate_message` - Inappropriate message content
- `inappropriate_story` - Inappropriate story content
- `inappropriate_profile` - Inappropriate profile content
- `harassment` - Harassment or bullying
- `spam` - Spam or unwanted content
- `fake_profile` - Fake or impersonation profile
- `underage` - Underage user
- `other` - Other reasons

### Auto-Flagging

Content is automatically flagged for moderation after:
- **3+ reports** on the same content
- **Profanity detection** in messages
- **Suspicious patterns** (future implementation)

### Rate Limits

- **10 reports per day** per user
- Prevents report spam and abuse

## Privacy Settings

### Get Privacy Settings

\`\`\`typescript
import { getPrivacySettings } from '@/lib/supabase/security'

const settings = await getPrivacySettings()
\`\`\`

### Update Privacy Settings

\`\`\`typescript
import { updatePrivacySettings } from '@/lib/supabase/security'

await updatePrivacySettings({
  hide_exact_location: true,
  hide_last_seen: true,
  who_can_message: 'connections_only',
  story_visibility: 'connections_only',
  profile_visibility: 'language_learners_only',
  discoverable: false
})
\`\`\`

### Privacy Options

**Location Privacy:**
- `hide_exact_location` - Show approximate location only (100m-5km radius)
- `location_precision_meters` - Precision level (100, 500, 1000, 5000)

**Activity Privacy:**
- `hide_last_seen` - Hide "last seen" timestamp
- `hide_online_status` - Hide online/offline status

**Messaging Privacy:**
- `everyone` - Anyone can message you
- `connections_only` - Only people you've messaged can message you
- `no_one` - Disable DMs completely

**Story Privacy:**
- `everyone` - All users can see your stories
- `nearby` - Only nearby users can see
- `connections_only` - Only your connections can see
- `no_one` - Stories are private

**Profile Privacy:**
- `all` - Visible to everyone
- `language_learners_only` - Only visible to language learners
- `hidden` - Ghost mode (not discoverable)

**Discovery Settings:**
- `discoverable` - Show in discovery/search
- `show_in_search` - Show in search results

## Rate Limiting

### Check Rate Limit

\`\`\`typescript
import { checkRateLimit } from '@/lib/supabase/security'

const canSend = await checkRateLimit('send_message', 30, 1) // 30 per minute
if (!canSend) {
  alert('Rate limit exceeded. Please wait.')
}
\`\`\`

### Rate Limits by Action

- **Login attempts**: 5 per minute
- **Message sending**: 30 per minute
- **Profile updates**: 5 per minute
- **Story posts**: 10 per day
- **Reports**: 10 per day
- **API calls**: 100 per minute per user

### Log Rate Limit Action

\`\`\`typescript
import { logRateLimit } from '@/lib/supabase/security'

await logRateLimit('send_message')
\`\`\`

## Content Moderation

### Auto-Flagging Triggers

Content is automatically flagged when:
1. **Profanity detected** in messages
2. **3+ reports** on the same content
3. **Suspicious patterns** (future: rapid messaging, spam keywords)

### Moderation Queue

Flagged content goes to the moderation queue for admin review with:
- Content type and ID
- User information
- Flag reason
- Severity level (low, medium, high, critical)
- Report count
- Auto-flagged status

### Admin Actions

Admins can take the following actions:
- **None** - Approve content, no action needed
- **Warning** - Send warning to user
- **Content Removed** - Remove the flagged content
- **User Suspended** - Temporarily suspend user
- **User Banned** - Permanently ban user

## GDPR Compliance

### Export User Data

\`\`\`typescript
import { exportUserData } from '@/lib/supabase/security'

const userData = await exportUserData()
// Returns JSON with all user data
\`\`\`

### Delete User Account

\`\`\`typescript
import { deleteUserAccount } from '@/lib/supabase/security'

await deleteUserAccount()
// Permanently deletes account and anonymizes data
\`\`\`

### What Gets Exported

- Profile information
- Messages sent
- Conversations
- Blocks
- Reports made
- Stories posted
- Activity history

### What Gets Deleted

- Profile data (anonymized)
- Personal information removed
- Messages soft-deleted (kept for other users' history)
- Auth account deleted
- Related data cascaded

## Admin Functions

### Get Pending Reports

\`\`\`typescript
import { getPendingReports } from '@/lib/supabase/security'

const reports = await getPendingReports()
\`\`\`

### Get Moderation Queue

\`\`\`typescript
import { getModerationQueue } from '@/lib/supabase/security'

const queue = await getModerationQueue()
\`\`\`

### Review Report

\`\`\`typescript
import { reviewReport } from '@/lib/supabase/security'

await reviewReport(
  'report-id',
  'resolved',
  'User has been warned and content removed'
)
\`\`\`

### Moderate Content

\`\`\`typescript
import { moderateContent } from '@/lib/supabase/security'

await moderateContent(
  'queue-id',
  'removed',
  'content_removed',
  'Content violates community guidelines'
)
\`\`\`

## Row Level Security (RLS)

All tables have comprehensive RLS policies:

### Users Table
- Users can view their own profile
- Users can view non-blocked, non-ghost profiles
- Users can update their own profile
- Admins can view all users

### Messages Table
- Users can view messages in their conversations
- Users can send messages to non-blocked users
- Users can delete their own messages
- Blocked users can't message each other

### Conversations Table
- Users can view their own conversations
- Users can create conversations with non-blocked users
- Users can update their own conversations

### Reports & Moderation
- Users can view their own reports
- Users can create reports
- Admins can view all reports and moderation queue

### Privacy Settings
- Users can view and update their own settings
- Settings are private to the user

## Best Practices

1. **Always check if user is blocked** before showing content
2. **Respect privacy settings** when displaying user information
3. **Check rate limits** before allowing actions
4. **Log all security events** for audit trail
5. **Handle errors gracefully** and show user-friendly messages
6. **Test RLS policies** thoroughly before production
7. **Monitor moderation queue** regularly
8. **Respond to reports** within 24-48 hours

## Security Checklist

- [ ] RLS enabled on all tables
- [ ] Blocking system tested
- [ ] Reporting system tested
- [ ] Privacy settings working
- [ ] Rate limiting active
- [ ] Content moderation queue monitored
- [ ] GDPR export/delete tested
- [ ] Admin dashboard functional
- [ ] Error handling implemented
- [ ] Audit logging active

## Support

For security issues or questions, contact the development team immediately.
