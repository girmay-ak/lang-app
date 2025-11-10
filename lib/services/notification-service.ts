"use client"

import { createClient } from "@/lib/supabase/client"
import type { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js"

type JsonRecord = Record<string, any>

export interface NotificationUserSummary {
  id: string
  full_name: string | null
  avatar_url: string | null
}

export interface NotificationRow {
  id: string
  user_id: string
  notification_type: string
  title: string
  body: string
  data: JsonRecord | null
  is_read: boolean
  created_at: string
  reference_id?: string | null
  type?: string
}

export type NotificationRecord = NotificationRow & {
  related_users: NotificationUserSummary[]
}

const NOTIFICATION_LIMIT = 50

type SubscriptionHandlers = {
  onInsert?: (payload: RealtimePostgresChangesPayload<NotificationRow>) => void
  onUpdate?: (payload: RealtimePostgresChangesPayload<NotificationRow>) => void
  onDelete?: (payload: RealtimePostgresChangesPayload<NotificationRow>) => void
}

const parseData = (raw: unknown): JsonRecord => {
  if (!raw) return {}
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as JsonRecord
    } catch (error) {
      console.warn("[notificationService] Failed to parse notification data", error)
      return {}
    }
  }
  if (typeof raw === "object") {
    return raw as JsonRecord
  }
  return {}
}

const extractUserIds = (data: JsonRecord): string[] => {
  if (!data) return []
  const candidates: string[] = []

  if (Array.isArray(data.users)) {
    for (const entry of data.users) {
      if (typeof entry === "string") {
        candidates.push(entry)
      } else if (entry && typeof entry === "object") {
        if (typeof (entry as JsonRecord).id === "string") {
          candidates.push((entry as JsonRecord).id as string)
        } else if (typeof (entry as JsonRecord).user_id === "string") {
          candidates.push((entry as JsonRecord).user_id as string)
        }
      }
    }
  }

  if (typeof data.user_id === "string") {
    candidates.push(data.user_id)
  }

  if (typeof data.sender_id === "string") {
    candidates.push(data.sender_id)
  }

  return Array.from(new Set(candidates))
}

const hydrateNotifications = async (rows: NotificationRow[]): Promise<NotificationRecord[]> => {
  if (rows.length === 0) return []

  const supabase = createClient()
  const uniqueUserIds = new Set<string>()
  const parsedRows = rows.map((row) => ({
    ...row,
    data: parseData(row.data),
  }))

  parsedRows.forEach((row) => {
    extractUserIds(row.data ?? {}).forEach((id) => uniqueUserIds.add(id))
  })

  let userSummaries: NotificationUserSummary[] = []
  if (uniqueUserIds.size > 0) {
    const { data: users, error } = await supabase
      .from("users")
      .select("id, full_name, avatar_url")
      .in("id", Array.from(uniqueUserIds))

    if (error) {
      console.error("[notificationService] Failed to load related users:", error)
    } else {
      userSummaries = users ?? []
    }
  }

  const userMap = new Map<string, NotificationUserSummary>()
  for (const user of userSummaries) {
    userMap.set(user.id, user)
  }

  return parsedRows.map((row) => {
    const ids = extractUserIds(row.data ?? {})
    const related_users = ids
      .map((id) => userMap.get(id))
      .filter((user): user is NotificationUserSummary => Boolean(user))
      .slice(0, 3)

    return {
      ...row,
      related_users,
    }
  })
}

const sortNotifications = (notifications: NotificationRecord[]) =>
  [...notifications].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )

const normalizeSupabaseError = (error: unknown, fallbackMessage: string) => {
  if (error instanceof Error) {
    return error
  }

  if (error && typeof error === "object" && "message" in error) {
    const message = typeof (error as { message?: unknown }).message === "string"
      ? ((error as { message?: string }).message || fallbackMessage)
      : fallbackMessage
    const normalized = new Error(message)
    ;(normalized as { cause?: unknown }).cause = error
    return normalized
  }

  return new Error(fallbackMessage)
}

const getSessionUserId = async (): Promise<string | null> => {
  const supabase = createClient()
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()

  if (error) {
    throw normalizeSupabaseError(error, "Failed to determine the current session.")
  }

  return session?.user?.id ?? null
}

export const notificationService = {
  async listForCurrentUser(limit = NOTIFICATION_LIMIT): Promise<{
    notifications: NotificationRecord[]
    userId: string | null
  }> {
    const supabase = createClient()
    const userId = await getSessionUserId()
    if (!userId) {
      return { notifications: [], userId: null }
    }

    const { data, error } = await supabase
      .from("notifications")
      .select(`id, user_id, notification_type, type, title, body, data, is_read, created_at, reference_id`)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      throw normalizeSupabaseError(
        error,
        "We couldn't load your notifications right now. Please try again shortly.",
      )
    }

    const normalizedRows: NotificationRow[] =
      (data as (NotificationRow & { type?: string })[] | null)?.map((row) => ({
        ...row,
        notification_type: row.notification_type ?? row.type ?? "system_announcements",
      })) ?? []

    const hydrated = await hydrateNotifications(normalizedRows)
    return { notifications: sortNotifications(hydrated), userId }
  },

  async hydrateRow(row: NotificationRow): Promise<NotificationRecord> {
    const [record] = await hydrateNotifications([row])
    return record ?? {
      ...row,
      data: parseData(row.data),
      related_users: [],
    }
  },

  async markAsRead(notificationId: string) {
    const supabase = createClient()
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId)
      .eq("is_read", false)

    if (error) {
      console.error("[notificationService] markAsRead error:", error)
      throw error
    }
  },

  async markManyAsRead(notificationIds: string[]) {
    if (notificationIds.length === 0) return
    const supabase = createClient()
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .in("id", notificationIds)
      .eq("is_read", false)

    if (error) {
      console.error("[notificationService] markManyAsRead error:", error)
      throw error
    }
  },

  async markAllAsRead(userId?: string | null) {
    const supabase = createClient()
    const targetUserId = userId ?? (await getSessionUserId())
    if (!targetUserId) return

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", targetUserId)
      .eq("is_read", false)

    if (error) {
      console.error("[notificationService] markAllAsRead error:", error)
      throw error
    }
  },

  async deleteNotification(notificationId: string) {
    const supabase = createClient()
    const { error } = await supabase.from("notifications").delete().eq("id", notificationId)

    if (error) {
      console.error("[notificationService] deleteNotification error:", error)
      throw error
    }
  },

  subscribeToUserNotifications(userId: string, handlers: SubscriptionHandlers) {
    const supabase = createClient()
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on<NotificationRow>(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          handlers.onInsert?.(payload)
        },
      )
      .on<NotificationRow>(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          handlers.onUpdate?.(payload)
        },
      )
      .on<NotificationRow>(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          handlers.onDelete?.(payload)
        },
      )
      .subscribe()

    const unsubscribe = () => {
      supabase.removeChannel(channel)
    }

    return { channel, unsubscribe }
  },

  async acceptFollowRequest(requestorId: string) {
    const supabase = createClient()
    const currentUserId = await getSessionUserId()
    if (!currentUserId) {
      throw new Error("You need to be signed in to accept follow requests.")
    }

    const payload = {
      user_id: currentUserId,
      target_user_id: requestorId,
      connection_type: "friend",
      status: "active",
    }

    const reversePayload = {
      user_id: requestorId,
      target_user_id: currentUserId,
      connection_type: "friend",
      status: "active",
    }

    const { error } = await supabase.from("user_connections").upsert(payload, {
      onConflict: "user_id,target_user_id,connection_type",
    })

    if (error) {
      console.error("[notificationService] acceptFollowRequest upsert error:", error)
      throw error
    }

    const { error: reverseError } = await supabase.from("user_connections").upsert(reversePayload, {
      onConflict: "user_id,target_user_id,connection_type",
    })

    if (reverseError) {
      console.error("[notificationService] acceptFollowRequest reverse error:", reverseError)
      throw reverseError
    }

    // Resolve pending request if it exists
    await supabase
      .from("user_connections")
      .update({ status: "resolved" })
      .eq("user_id", requestorId)
      .eq("target_user_id", currentUserId)
      .eq("connection_type", "friend_request")
      .eq("status", "pending")
      .limit(1)
  },

  async declineFollowRequest(requestorId: string) {
    const supabase = createClient()
    const currentUserId = await getSessionUserId()
    if (!currentUserId) {
      throw new Error("You need to be signed in to manage follow requests.")
    }

    const { error } = await supabase
      .from("user_connections")
      .update({ status: "resolved" })
      .eq("user_id", requestorId)
      .eq("target_user_id", currentUserId)
      .eq("connection_type", "friend_request")
      .eq("status", "pending")

    if (error) {
      console.error("[notificationService] declineFollowRequest error:", error)
      throw error
    }
  },

  sortNotifications,
}
