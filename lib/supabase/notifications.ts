import { createClient } from "./client"
import type { RealtimeChannel } from "@supabase/supabase-js"

// =====================================================
// TYPES
// =====================================================

export type NotificationType =
  // Chat
  | "chat_new_message"
  | "chat_typing"
  | "chat_message_read"
  // Social
  | "social_story_view"
  | "social_story_reaction"
  | "social_story_reply"
  | "social_friend_request"
  | "social_friend_accepted"
  | "social_favorited"
  // Activity
  | "activity_nearby_user"
  | "activity_challenge_completed"
  | "activity_achievement"
  | "activity_level_up"
  | "activity_streak_milestone"
  // System
  | "system_welcome"
  | "system_streak_reminder"
  | "system_inactivity_reminder"
  | "system_announcements"

export interface Notification {
  id: string
  user_id: string
  notification_type: NotificationType
  title: string
  body: string
  data: Record<string, any>
  is_read: boolean
  read_at: string | null
  created_at: string
}

export interface NotificationPreferences {
  id: string
  user_id: string
  // Chat
  chat_new_message: boolean
  chat_typing: boolean
  chat_message_read: boolean
  // Social
  social_story_view: boolean
  social_story_reaction: boolean
  social_story_reply: boolean
  social_friend_request: boolean
  social_friend_accepted: boolean
  social_favorited: boolean
  // Activity
  activity_nearby_user: boolean
  activity_challenge_completed: boolean
  activity_achievement: boolean
  activity_level_up: boolean
  activity_streak_milestone: boolean
  // System
  system_welcome: boolean
  system_streak_reminder: boolean
  system_inactivity_reminder: boolean
  system_announcements: boolean
  // Delivery
  push_enabled: boolean
  email_enabled: boolean
  sound_enabled: boolean
  // Quiet hours
  quiet_hours_enabled: boolean
  quiet_hours_start: string
  quiet_hours_end: string
  created_at: string
  updated_at: string
}

export interface PushToken {
  id: string
  user_id: string
  token: string
  platform: "ios" | "android" | "web"
  device_name: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

// =====================================================
// NOTIFICATION OPERATIONS
// =====================================================

/**
 * Get all notifications for the current user
 */
export async function getNotifications(limit = 50, offset = 0) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) throw error
  return data as Notification[]
}

/**
 * Get unread notifications
 */
export async function getUnreadNotifications() {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("is_read", false)
    .order("created_at", { ascending: false })

  if (error) throw error
  return data as Notification[]
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(): Promise<number> {
  const supabase = createClient()

  const { data, error } = await supabase.rpc("get_unread_notification_count")

  if (error) throw error
  return data as number
}

/**
 * Get unread count by type
 */
export async function getUnreadCountByType(): Promise<Record<NotificationType, number>> {
  const supabase = createClient()

  const { data, error } = await supabase.rpc("get_unread_count_by_type")

  if (error) throw error

  const result: Record<string, number> = {}
  data?.forEach((item: any) => {
    result[item.notification_type] = Number.parseInt(item.count)
  })

  return result as Record<NotificationType, number>
}

/**
 * Mark notification as read
 */
export async function markAsRead(notificationId: string) {
  const supabase = createClient()

  const { error } = await supabase.rpc("mark_notification_read", {
    p_notification_id: notificationId,
  })

  if (error) throw error
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead(): Promise<number> {
  const supabase = createClient()

  const { data, error } = await supabase.rpc("mark_all_notifications_read")

  if (error) throw error
  return data as number
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string) {
  const supabase = createClient()

  const { error } = await supabase.from("notifications").delete().eq("id", notificationId)

  if (error) throw error
}

/**
 * Delete all notifications
 */
export async function deleteAllNotifications() {
  const supabase = createClient()

  const { error } = await supabase.from("notifications").delete().neq("id", "00000000-0000-0000-0000-000000000000") // Delete all

  if (error) throw error
}

// =====================================================
// NOTIFICATION PREFERENCES
// =====================================================

/**
 * Get user's notification preferences
 */
export async function getNotificationPreferences(): Promise<NotificationPreferences | null> {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from("user_notification_preferences")
    .select("*")
    .eq("user_id", user.id)
    .single()

  if (error) {
    // Create default preferences if they don't exist
    const { data: newPrefs, error: insertError } = await supabase
      .from("user_notification_preferences")
      .insert({ user_id: user.id })
      .select()
      .single()

    if (insertError) throw insertError
    return newPrefs as NotificationPreferences
  }

  return data as NotificationPreferences
}

/**
 * Update notification preferences
 */
export async function updateNotificationPreferences(
  preferences: Partial<Omit<NotificationPreferences, "id" | "user_id" | "created_at" | "updated_at">>,
) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  const { data, error } = await supabase
    .from("user_notification_preferences")
    .update(preferences)
    .eq("user_id", user.id)
    .select()
    .single()

  if (error) throw error
  return data as NotificationPreferences
}

// =====================================================
// PUSH TOKENS
// =====================================================

/**
 * Register a push notification token
 */
export async function registerPushToken(token: string, platform: "ios" | "android" | "web", deviceName?: string) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  const { data, error } = await supabase
    .from("push_tokens")
    .upsert(
      {
        user_id: user.id,
        token,
        platform,
        device_name: deviceName,
        is_active: true,
      },
      {
        onConflict: "user_id,token",
      },
    )
    .select()
    .single()

  if (error) throw error
  return data as PushToken
}

/**
 * Unregister a push token
 */
export async function unregisterPushToken(token: string) {
  const supabase = createClient()

  const { error } = await supabase.from("push_tokens").update({ is_active: false }).eq("token", token)

  if (error) throw error
}

/**
 * Get all active push tokens for current user
 */
export async function getPushTokens(): Promise<PushToken[]> {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase.from("push_tokens").select("*").eq("user_id", user.id).eq("is_active", true)

  if (error) throw error
  return data as PushToken[]
}

// =====================================================
// REALTIME SUBSCRIPTIONS
// =====================================================

/**
 * Subscribe to new notifications
 */
export function subscribeToNotifications(callback: (notification: Notification) => void): RealtimeChannel {
  const supabase = createClient()

  const channel = supabase
    .channel("notifications")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${supabase.auth.getUser().then((r) => r.data.user?.id)}`,
      },
      (payload) => {
        callback(payload.new as Notification)
      },
    )
    .subscribe()

  return channel
}

/**
 * Unsubscribe from notifications
 */
export function unsubscribeFromNotifications(channel: RealtimeChannel) {
  channel.unsubscribe()
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Create a notification (usually called from backend/triggers)
 */
export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  body: string,
  data: Record<string, any> = {},
  relatedUserId?: string,
) {
  const supabase = createClient()

  const { data: notificationId, error } = await supabase.rpc("create_notification", {
    p_user_id: userId,
    p_notification_type: type,
    p_title: title,
    p_body: body,
    p_data: data,
    p_related_user_id: relatedUserId,
  })

  if (error) throw error
  return notificationId as string | null
}

/**
 * Send a push notification (integrate with Expo/FCM)
 */
export async function sendPushNotification(
  userId: string,
  title: string,
  body: string,
  data: Record<string, any> = {},
) {
  // Get user's push tokens
  const supabase = createClient()

  const { data: tokens, error } = await supabase
    .from("push_tokens")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)

  if (error || !tokens || tokens.length === 0) {
    console.log("[v0] No push tokens found for user:", userId)
    return
  }

  // Send to each token
  // This is where you'd integrate with Expo Push Notifications or FCM
  // See documentation for implementation details

  console.log("[v0] Would send push notification to", tokens.length, "devices")
  console.log("[v0] Title:", title)
  console.log("[v0] Body:", body)
  console.log("[v0] Data:", data)

  // Example Expo Push Notification:
  /*
  const messages = tokens.map(token => ({
    to: token.token,
    sound: 'default',
    title,
    body,
    data
  }))
  
  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(messages)
  })
  */
}
