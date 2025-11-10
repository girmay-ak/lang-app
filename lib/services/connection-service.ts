"use client"

import { createClient } from "@/lib/supabase/client"
import { createNotification } from "@/lib/supabase/notifications"

type ConnectionStatus = "active" | "pending" | "resolved"

interface ConnectionRow {
  status: ConnectionStatus | null
}

async function getSessionUserId(): Promise<string | null> {
  const supabase = createClient()
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()

  if (error) {
    console.error("[connectionService] auth.getSession error:", error)
    throw error
  }

  return session?.user?.id ?? null
}

export const connectionService = {
  async listFavoriteUserIds(): Promise<string[]> {
    const supabase = createClient()
    const userId = await getSessionUserId()
    if (!userId) return []

    const { data, error } = await supabase
      .from("user_connections")
      .select("target_user_id")
      .eq("user_id", userId)
      .eq("connection_type", "favorite")
      .eq("status", "active")

    if (error) {
      console.error("[connectionService] listFavoriteUserIds error:", error)
      throw error
    }

    return (data ?? []).map((row) => row.target_user_id)
  },

  async setFavorite(targetUserId: string, shouldFavorite: boolean, actorName?: string) {
    const supabase = createClient()
    const userId = await getSessionUserId()
    if (!userId) {
      throw new Error("You need to be signed in to manage favorites.")
    }

    const normalizedTargetId = targetUserId

    if (shouldFavorite) {
      const { data: existing, error: existingError } = await supabase
        .from("user_connections")
        .select<ConnectionRow>("status")
        .eq("user_id", userId)
        .eq("target_user_id", normalizedTargetId)
        .eq("connection_type", "favorite")
        .maybeSingle()

      if (existingError) {
        console.error("[connectionService] setFavorite existing error:", existingError)
        throw existingError
      }

      if (existing?.status === "active") {
        return { alreadyFavorited: true as const }
      }

      const { error } = await supabase.from("user_connections").upsert(
        {
          user_id: userId,
          target_user_id: normalizedTargetId,
          connection_type: "favorite",
          status: "active",
        },
        {
          onConflict: "user_id,target_user_id,connection_type",
        },
      )

      if (error) {
        console.error("[connectionService] setFavorite upsert error:", error)
        throw error
      }

      if (actorName) {
        try {
          await createNotification(
            normalizedTargetId,
            "social_favorited",
            `${actorName} favorited you`,
            `${actorName} saved your profile. Say hi back when you have a moment!`,
            { actor: actorName },
          )
        } catch (notificationError) {
          console.warn("[connectionService] setFavorite notification warning:", notificationError)
        }
      }

      return { alreadyFavorited: false as const }
    }

    const { error } = await supabase
      .from("user_connections")
      .delete()
      .eq("user_id", userId)
      .eq("target_user_id", normalizedTargetId)
      .eq("connection_type", "favorite")

    if (error) {
      console.error("[connectionService] setFavorite delete error:", error)
      throw error
    }

    return { alreadyFavorited: false as const }
  },

  async sendFriendRequest(targetUserId: string, actorName?: string) {
    const supabase = createClient()
    const userId = await getSessionUserId()
    if (!userId) {
      throw new Error("You need to be signed in to send match requests.")
    }

    const normalizedTargetId = targetUserId

    const { data: existing, error: existingError } = await supabase
      .from("user_connections")
      .select<ConnectionRow>("status")
      .eq("user_id", userId)
      .eq("target_user_id", normalizedTargetId)
      .eq("connection_type", "friend_request")
      .maybeSingle()

    if (existingError) {
      console.error("[connectionService] sendFriendRequest existing error:", existingError)
      throw existingError
    }

    if (existing?.status === "pending") {
      return { alreadyPending: true as const }
    }

    const { error } = await supabase.from("user_connections").upsert(
      {
        user_id: userId,
        target_user_id: normalizedTargetId,
        connection_type: "friend_request",
        status: "pending",
      },
      {
        onConflict: "user_id,target_user_id,connection_type",
      },
    )

    if (error) {
      console.error("[connectionService] sendFriendRequest upsert error:", error)
      throw error
    }

    if (actorName) {
      try {
        await createNotification(
          normalizedTargetId,
          "social_friend_request",
          `${actorName} wants to match with you`,
          `${actorName} sent you a language exchange request. Tap to respond.`,
          { actor: actorName },
        )
      } catch (notificationError) {
        console.warn("[connectionService] sendFriendRequest notification warning:", notificationError)
      }
    }

    return { alreadyPending: false as const }
  },

  async sendEventInvite(targetUserId: string, actorName?: string, eventTitle = "Language Exchange meetup") {
    const supabase = createClient()
    const userId = await getSessionUserId()
    if (!userId) {
      throw new Error("You need to be signed in to invite someone to an event.")
    }

    const normalizedTargetId = targetUserId

    try {
      await createNotification(
        normalizedTargetId,
        "system_announcements",
        `${actorName ?? "A nearby speaker"} invited you`,
        `${actorName ?? "A nearby speaker"} would love to meet at ${eventTitle}.`,
        {
          actor: actorName,
          eventTitle,
          kind: "event_invite",
        },
      )
    } catch (notificationError) {
      console.warn("[connectionService] sendEventInvite notification warning:", notificationError)
    }

    const { error } = await supabase.from("user_connections").upsert(
      {
        user_id: userId,
        target_user_id: normalizedTargetId,
        connection_type: "friend_request",
        status: "pending",
      },
      {
        onConflict: "user_id,target_user_id,connection_type",
      },
    )

    if (error) {
      console.error("[connectionService] sendEventInvite upsert error:", error)
      throw error
    }
  },
}

