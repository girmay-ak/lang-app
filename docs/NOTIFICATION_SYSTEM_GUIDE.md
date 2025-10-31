# Notification System Guide

Complete guide for implementing and using the notification system in your language exchange app.

## Table of Contents

1. [Overview](#overview)
2. [Database Schema](#database-schema)
3. [Notification Types](#notification-types)
4. [User Preferences](#user-preferences)
5. [Creating Notifications](#creating-notifications)
6. [Push Notifications](#push-notifications)
7. [Email Notifications](#email-notifications)
8. [React Hooks](#react-hooks)
9. [Best Practices](#best-practices)

## Overview

The notification system provides:
- **In-app notifications** with real-time updates
- **Push notifications** for mobile devices (iOS/Android)
- **Email notifications** (optional)
- **Granular user preferences** for each notification type
- **Quiet hours** to prevent notifications during sleep
- **Rate limiting** to prevent spam
- **Batching** to combine similar notifications
- **Auto-cleanup** to keep database lean

## Database Schema

### Tables

1. **notifications** - Stores all notifications
2. **user_notification_preferences** - User settings for each notification type
3. **push_tokens** - Device tokens for push notifications
4. **notification_batch_tracker** - Tracks recent notifications for rate limiting

### Key Features

- **RLS Policies**: Users can only see their own notifications
- **Indexes**: Optimized for fast queries
- **Triggers**: Auto-create notifications on events
- **Functions**: Helper functions for common operations

## Notification Types

### Chat Notifications
- `chat_new_message` - New message received
- `chat_typing` - Someone is typing
- `chat_message_read` - Message was read

### Social Notifications
- `social_story_view` - Someone viewed your story
- `social_story_reaction` - Someone reacted to your story
- `social_story_reply` - Someone replied to your story
- `social_friend_request` - New friend request
- `social_friend_accepted` - Friend request accepted
- `social_favorited` - Someone favorited you

### Activity Notifications
- `activity_nearby_user` - New user nearby matching your languages
- `activity_challenge_completed` - Daily challenge completed
- `activity_achievement` - Achievement unlocked
- `activity_level_up` - Level up
- `activity_streak_milestone` - Streak milestone (7, 30, 60, 100, 365 days)

### System Notifications
- `system_welcome` - Welcome message after signup
- `system_streak_reminder` - Don't break your streak!
- `system_inactivity_reminder` - Haven't used app in 3 days
- `system_announcements` - New feature announcements

## User Preferences

Users can control each notification type individually:

\`\`\`typescript
import { getNotificationPreferences, updateNotificationPreferences } from '@/lib/supabase/notifications'

// Get current preferences
const prefs = await getNotificationPreferences()

// Update preferences
await updateNotificationPreferences({
  chat_new_message: true,
  social_friend_request: false,
  quiet_hours_enabled: true,
  quiet_hours_start: '22:00:00',
  quiet_hours_end: '08:00:00'
})
\`\`\`

### Quiet Hours

Prevent notifications during sleep:

\`\`\`typescript
await updateNotificationPreferences({
  quiet_hours_enabled: true,
  quiet_hours_start: '22:00:00', // 10 PM
  quiet_hours_end: '08:00:00'    // 8 AM
})
\`\`\`

## Creating Notifications

### Automatic Notifications

Most notifications are created automatically via database triggers:

- **New message** → Triggers `notify_new_message()`
- **Achievement unlocked** → Triggers `notify_achievement_unlocked()`
- **Level up** → Triggers `notify_level_up()`
- **Streak milestone** → Triggers `notify_streak_milestone()`

### Manual Notifications

Create custom notifications:

\`\`\`typescript
import { createNotification } from '@/lib/supabase/notifications'

await createNotification(
  userId,
  'activity_nearby_user',
  'New user nearby!',
  'Sarah speaks Spanish and wants to learn English',
  {
    nearby_user_id: 'user-123',
    distance_km: 2.5
  }
)
\`\`\`

### Rate Limiting

The system automatically prevents spam:
- Max 1 notification per type per user per 5 minutes
- Similar notifications are batched together
- Respects user's quiet hours

## Push Notifications

### Setup with Expo

1. **Install Expo Notifications**:
\`\`\`bash
npx expo install expo-notifications expo-device expo-constants
\`\`\`

2. **Register for push notifications**:
\`\`\`typescript
import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import { registerPushToken } from '@/lib/supabase/notifications'

async function registerForPushNotifications() {
  if (!Device.isDevice) {
    alert('Must use physical device for push notifications')
    return
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync()
  let finalStatus = existingStatus
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }
  
  if (finalStatus !== 'granted') {
    alert('Failed to get push token for push notification!')
    return
  }

  const token = (await Notifications.getExpoPushTokenAsync()).data
  
  // Register token with your backend
  await registerPushToken(token, 'ios', Device.deviceName)
}
\`\`\`

3. **Handle incoming notifications**:
\`\`\`typescript
import { useEffect } from 'react'
import * as Notifications from 'expo-notifications'

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
})

function App() {
  useEffect(() => {
    // Handle notification received while app is foregrounded
    const subscription = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification)
    })

    // Handle notification tapped
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification tapped:', response)
      // Navigate to relevant screen
    })

    return () => {
      subscription.remove()
      responseSubscription.remove()
    }
  }, [])

  return <YourApp />
}
\`\`\`

### Setup with Firebase Cloud Messaging (FCM)

For native apps or web push:

1. **Install FCM**:
\`\`\`bash
npm install firebase
\`\`\`

2. **Initialize Firebase**:
\`\`\`typescript
import { initializeApp } from 'firebase/app'
import { getMessaging, getToken } from 'firebase/messaging'

const firebaseConfig = {
  // Your Firebase config
}

const app = initializeApp(firebaseConfig)
const messaging = getMessaging(app)

// Get FCM token
const token = await getToken(messaging, {
  vapidKey: 'YOUR_VAPID_KEY'
})

await registerPushToken(token, 'web')
\`\`\`

## Email Notifications

### Setup with Supabase

1. **Configure email templates** in Supabase Dashboard:
   - Go to Authentication → Email Templates
   - Customize templates for each notification type

2. **Send email notifications**:
\`\`\`typescript
// This would be done in a backend function or Edge Function
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role key
)

async function sendEmailNotification(
  userId: string,
  subject: string,
  body: string
) {
  const { data: user } = await supabase
    .from('users')
    .select('email, full_name')
    .eq('id', userId)
    .single()
  
  if (!user) return
  
  // Check if user has email notifications enabled
  const { data: prefs } = await supabase
    .from('user_notification_preferences')
    .select('email_enabled')
    .eq('user_id', userId)
    .single()
  
  if (!prefs?.email_enabled) return
  
  // Send email using your email service
  // (Resend, SendGrid, AWS SES, etc.)
}
\`\`\`

## React Hooks

### useNotifications Hook

\`\`\`typescript
import { useState, useEffect } from 'react'
import { 
  getNotifications, 
  getUnreadCount,
  subscribeToNotifications,
  type Notification 
} from '@/lib/supabase/notifications'

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadNotifications()
    loadUnreadCount()

    // Subscribe to new notifications
    const channel = subscribeToNotifications((notification) => {
      setNotifications(prev => [notification, ...prev])
      setUnreadCount(prev => prev + 1)
    })

    return () => {
      channel.unsubscribe()
    }
  }, [])

  async function loadNotifications() {
    try {
      const data = await getNotifications(50)
      setNotifications(data)
    } catch (error) {
      console.error('Error loading notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  async function loadUnreadCount() {
    try {
      const count = await getUnreadCount()
      setUnreadCount(count)
    } catch (error) {
      console.error('Error loading unread count:', error)
    }
  }

  return {
    notifications,
    unreadCount,
    loading,
    refresh: loadNotifications
  }
}
\`\`\`

### Usage in Component

\`\`\`typescript
import { useNotifications } from '@/hooks/useNotifications'
import { markAsRead, markAllAsRead } from '@/lib/supabase/notifications'

export function NotificationCenter() {
  const { notifications, unreadCount, loading } = useNotifications()

  const handleMarkAsRead = async (id: string) => {
    await markAsRead(id)
  }

  const handleMarkAllAsRead = async () => {
    await markAllAsRead()
  }

  if (loading) return <div>Loading...</div>

  return (
    <div>
      <h2>Notifications ({unreadCount})</h2>
      <button onClick={handleMarkAllAsRead}>Mark all as read</button>
      
      {notifications.map(notification => (
        <div key={notification.id} onClick={() => handleMarkAsRead(notification.id)}>
          <h3>{notification.title}</h3>
          <p>{notification.body}</p>
          {!notification.is_read && <span>NEW</span>}
        </div>
      ))}
    </div>
  )
}
\`\`\`

## Best Practices

### 1. Rate Limiting
The system automatically rate limits notifications (1 per type per 5 minutes). Don't try to bypass this.

### 2. Batching
Similar notifications are automatically batched. For example, "3 new messages from Sarah" instead of 3 separate notifications.

### 3. Quiet Hours
Always respect user's quiet hours. The system handles this automatically.

### 4. User Preferences
Check user preferences before sending notifications. The `create_notification()` function does this automatically.

### 5. Cleanup
Old notifications are automatically cleaned up (keeps last 100 per user). Run the cleanup job daily:

\`\`\`sql
SELECT cron.schedule(
  'cleanup-old-notifications',
  '0 3 * * *',
  'SELECT cleanup_old_notifications()'
);
\`\`\`

### 6. Testing
Test notifications thoroughly:
- Test each notification type
- Test quiet hours
- Test rate limiting
- Test on different devices
- Test with notifications disabled

### 7. Analytics
Track notification engagement:
\`\`\`typescript
// Track when user opens a notification
await supabase
  .from('notification_analytics')
  .insert({
    notification_id: notification.id,
    action: 'opened',
    timestamp: new Date().toISOString()
  })
\`\`\`

## Troubleshooting

### Notifications not appearing
1. Check user preferences
2. Check quiet hours
3. Check rate limiting
4. Check RLS policies
5. Check database triggers

### Push notifications not working
1. Verify push token is registered
2. Check device permissions
3. Test with Expo push notification tool
4. Check FCM/APNS configuration

### Too many notifications
1. Adjust rate limiting interval
2. Improve batching logic
3. Review which events trigger notifications
4. Add more user preference options

## Production Checklist

- [ ] Set up push notification service (Expo/FCM)
- [ ] Configure email service (Resend/SendGrid)
- [ ] Set up pg_cron for cleanup jobs
- [ ] Test all notification types
- [ ] Test on iOS and Android
- [ ] Set up monitoring and alerts
- [ ] Document notification types for users
- [ ] Add notification preferences UI
- [ ] Test rate limiting
- [ ] Test quiet hours
- [ ] Set up analytics tracking
