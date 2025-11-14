"use client"

import { createClient } from "@/lib/supabase/client"

export type ChatMessageType = "text" | "voice" | "image" | "system"

export interface ChatMessage {
  id: string
  conversation_id: string
  sender_id: string
  content: string | null
  message_type: ChatMessageType
  media_url: string | null
  voice_duration: number | null
  created_at: string
  is_read: boolean
}

export interface ConversationRecord {
  id: string
  user1_id: string
  user2_id: string
  user1_last_read_at: string | null
  user2_last_read_at: string | null
  unread_count_user1: number | null
  unread_count_user2: number | null
  last_message: string | null
  last_message_at: string | null
  created_at: string
  updated_at: string
}

export interface ConversationSummary {
  conversationId: string
  otherUserId: string
  name: string
  avatar: string | null
  online: boolean
  lastMessage: string | null
  lastMessageAt: string | null
  unreadCount: number
  isRequest?: boolean
  languagePair?: string | null
}

export const chatService = {
  async getCurrentUserId(): Promise<string | null> {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    return user?.id ?? null
  },

  async getConversations(): Promise<ConversationRecord[]> {
    try {
      const supabase = createClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        return []
      }

      const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order("updated_at", { ascending: false })

      if (error) throw error

      return data ?? []
    } catch (error) {
      console.error("[chatService] getConversations error:", error)
      return []
    }
  },

  async getConversationWithOtherUser(otherUserId: string): Promise<ConversationRecord | null> {
    try {
      const supabase = createClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return null

      const { data: conversation, error } = await supabase
        .from("conversations")
        .select("*")
        .or(
          `and(user1_id.eq.${user.id},user2_id.eq.${otherUserId}),and(user1_id.eq.${otherUserId},user2_id.eq.${user.id})`,
        )
        .maybeSingle()

      if (error) throw error

      return conversation ?? null
    } catch (error) {
      console.error("[chatService] getConversationWithOtherUser error:", error)
      return null
    }
  },

  async getMessages(conversationId: string): Promise<ChatMessage[]> {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("messages")
        .select(`
          id,
          conversation_id,
          sender_id,
          content,
          message_type,
          media_url,
          voice_duration,
          created_at,
          is_read,
          is_deleted
        `)
        .eq("conversation_id", conversationId)
        .eq("is_deleted", false)
        .order("created_at", { ascending: true })

      if (error) {
        console.error("[chatService] getMessages error:", error)
        throw error
      }

      if (!data) return []

      // Map to ChatMessage format
      return data.map((msg: any) => ({
        id: msg.id,
        conversation_id: msg.conversation_id,
        sender_id: msg.sender_id,
        content: msg.content,
        message_type: msg.message_type || "text",
        media_url: msg.media_url,
        voice_duration: msg.voice_duration,
        created_at: msg.created_at,
        is_read: msg.is_read || false,
      }))
    } catch (error) {
      console.error("[chatService] getMessages error:", error)
      return []
    }
  },

  async sendMessage(
    conversationId: string,
    content: string,
    messageType: ChatMessageType = "text",
    mediaUrl?: string,
    voiceDuration?: number,
  ): Promise<ChatMessage> {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new Error("You must be signed in to send messages.")
    }

    const payload: Record<string, any> = {
      conversation_id: conversationId,
      sender_id: user.id,
      content,
      message_type: messageType,
    }

    if (mediaUrl) payload.media_url = mediaUrl
    if (voiceDuration) payload.voice_duration = voiceDuration

    const { data, error } = await supabase.from("messages").insert(payload).select().single()

    if (error) throw error

    // Update conversation with last message (unread count is handled by database trigger)
    // The trigger will automatically update last_message, last_message_at, and increment unread count
    await supabase
      .from("conversations")
      .update({
        updated_at: new Date().toISOString(),
      })
      .eq("id", conversationId)

    return data as ChatMessage
  },

  async markConversationRead(conversationId: string) {
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { data: conversation } = await supabase
        .from("conversations")
        .select("user1_id, user2_id")
        .eq("id", conversationId)
        .maybeSingle()

      if (!conversation) return

      const isUser1 = conversation.user1_id === user.id
      const readField = isUser1 ? "user1_last_read_at" : "user2_last_read_at"
      const unreadField = isUser1 ? "unread_count_user1" : "unread_count_user2"

      await supabase
        .from("conversations")
        .update({
          [readField]: new Date().toISOString(),
          [unreadField]: 0,
        })
        .eq("id", conversationId)

      await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("conversation_id", conversationId)
        .neq("sender_id", user.id)
    } catch (error) {
      console.error("[chatService] markConversationRead error:", error)
    }
  },

  subscribeToMessages(conversationId: string, onMessage: (message: ChatMessage) => void) {
    const supabase = createClient()
    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage
          onMessage(newMessage)
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log("[chatService] Subscribed to conversation", conversationId)
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  },

  async setTypingIndicator(conversationId: string, isTyping: boolean) {
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      if (isTyping) {
        await supabase.from("typing_indicators").upsert({
          conversation_id: conversationId,
          user_id: user.id,
          is_typing: true,
          updated_at: new Date().toISOString(),
        })
      } else {
        await supabase
          .from("typing_indicators")
          .delete()
          .eq("conversation_id", conversationId)
          .eq("user_id", user.id)
      }
    } catch (error) {
      console.error("[chatService] setTypingIndicator error:", error)
    }
  },

  subscribeToTyping(
    conversationId: string,
    onTypingChange: (userId: string, isTyping: boolean) => void,
  ) {
    const supabase = createClient()
    const channel = supabase
      .channel(`typing:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "typing_indicators",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
            onTypingChange(payload.new.user_id, payload.new.is_typing)
          } else if (payload.eventType === "DELETE") {
            onTypingChange(payload.old.user_id, false)
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  },

  async updateOnlineStatus(isOnline: boolean) {
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      await supabase
        .from("users")
        .update({
          is_online: isOnline,
          last_seen_at: new Date().toISOString(),
        })
        .eq("id", user.id)
    } catch (error) {
      console.error("[chatService] updateOnlineStatus error:", error)
    }
  },

  async createOrGetConversation(otherUserId: string): Promise<ConversationRecord> {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new Error("You must be signed in to start a conversation.")
    }

    if (otherUserId === user.id) {
      throw new Error("You can’t start a conversation with yourself.")
    }

    const existing = await this.getConversationWithOtherUser(otherUserId)
    if (existing) {
      return existing
    }

    const nowIso = new Date().toISOString()
    const { data, error } = await supabase
      .from("conversations")
      .insert({
        user1_id: user.id,
        user2_id: otherUserId,
        user1_last_read_at: nowIso,
        user2_last_read_at: null,
        unread_count_user1: 0,
        unread_count_user2: 0,
        last_message: null,
        last_message_at: null,
      })
      .select("*")
      .single()

    if (error) {
      console.error("[chatService] createOrGetConversation error:", error)
      throw error
    }

    return data as ConversationRecord
  },

  async getConversationPreview(conversationId: string) {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new Error("You must be signed in to view conversations.")
    }

      const { data, error } = await supabase
        .from("conversations")
        .select(
          `
        id,
        user1_id,
        user2_id,
        last_message,
        last_message_at,
        unread_count_user1,
        unread_count_user2,
        user1:users!conversations_user1_id_fkey(id, full_name, avatar_url, is_online),
        user2:users!conversations_user2_id_fkey(id, full_name, avatar_url, is_online)
      `,
        )
        .eq("id", conversationId)
        .maybeSingle()

      if (error) {
        console.error("[chatService] getConversationPreview error:", error)
        throw error
      }

      if (!data) return null

      const otherUserId = data.user1_id === user.id ? data.user2_id : data.user1_id
      const otherUser = data.user1_id === user.id ? data.user2 : data.user1
      const unreadCount = data.user1_id === user.id ? data.unread_count_user1 : data.unread_count_user2

    return {
      id: data.id,
      otherUserId,
      name: otherUser?.full_name || "New Partner",
      avatar: otherUser?.avatar_url || "/placeholder-user.jpg",
      online: otherUser?.is_online ?? false,
      lastMessage: data.last_message,
      lastMessageAt: data.last_message_at,
      unreadCount: unreadCount ?? 0,
    }
  },

  async getConversationSummaries(): Promise<ConversationSummary[]> {
    try {
      const supabase = createClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return []

      const { data, error } = await supabase
        .from("conversations")
        .select(
          `
          id,
          user1_id,
          user2_id,
          last_message,
          last_message_at,
          unread_count_user1,
          unread_count_user2,
          user1:users!conversations_user1_id_fkey(id, full_name, avatar_url, is_online),
          user2:users!conversations_user2_id_fkey(id, full_name, avatar_url, is_online)
        `,
        )
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order("updated_at", { ascending: false })

      if (error) throw error

      // Get current user's languages for language pair display
      const { data: currentUserLanguages } = await supabase
        .from("user_languages")
        .select("language_code, language_type")
        .eq("user_id", user.id)

      const currentUserNativeLangs = currentUserLanguages
        ?.filter((lang) => lang.language_type === "native")
        .map((lang) => lang.language_code) || []
      const currentUserLearningLangs = currentUserLanguages
        ?.filter((lang) => lang.language_type === "learning")
        .map((lang) => lang.language_code) || []

      // Get language pairs for all conversations in parallel
      const conversationSummaries = await Promise.all(
        (data ?? []).map(async (record: any) => {
          const isUser1 = record.user1_id === user.id
          const otherUser = isUser1 ? record.user2 : record.user1
          const unreadCount = isUser1 ? record.unread_count_user1 : record.unread_count_user2
          const otherUserId = otherUser?.id ?? (isUser1 ? record.user2_id : record.user1_id)

          // Get language pair
          const languagePair = await this.getLanguagePair(user.id, otherUserId)

          return {
            conversationId: record.id,
            otherUserId,
            name: otherUser?.full_name ?? "Language Partner",
            avatar: otherUser?.avatar_url ?? null,
            online: Boolean(otherUser?.is_online),
            lastMessage: record.last_message,
            lastMessageAt: record.last_message_at,
            unreadCount: typeof unreadCount === "number" ? unreadCount : 0,
            isRequest: record.status ? record.status === "pending" : false,
            languagePair,
          } satisfies ConversationSummary
        })
      )

      return conversationSummaries
    } catch (error) {
      console.error("[chatService] getConversationSummaries error:", error)
      return []
    }
  },

  async getLanguagePair(userId1: string, userId2: string): Promise<string | null> {
    try {
      const supabase = createClient()

      // Get languages for both users
      const [user1Langs, user2Langs] = await Promise.all([
        supabase
          .from("user_languages")
          .select("language_code, language_type")
          .eq("user_id", userId1),
        supabase
          .from("user_languages")
          .select("language_code, language_type")
          .eq("user_id", userId2),
      ])

      const user1Native = user1Langs.data?.filter((l) => l.language_type === "native").map((l) => l.language_code) || []
      const user1Learning = user1Langs.data?.filter((l) => l.language_type === "learning").map((l) => l.language_code) || []
      const user2Native = user2Langs.data?.filter((l) => l.language_type === "native").map((l) => l.language_code) || []
      const user2Learning = user2Langs.data?.filter((l) => l.language_type === "learning").map((l) => l.language_code) || []

      // Find matching languages (user1's native matches user2's learning, or vice versa)
      const match1 = user1Native.find((lang) => user2Learning.includes(lang))
      const match2 = user2Native.find((lang) => user1Learning.includes(lang))

      if (match1 && match2) {
        // Get language names from languages table
        const [lang1, lang2] = await Promise.all([
          supabase.from("languages").select("code").eq("code", match1).single(),
          supabase.from("languages").select("code").eq("code", match2).single(),
        ])

        const code1 = lang1.data?.code?.toUpperCase() || match1.toUpperCase()
        const code2 = lang2.data?.code?.toUpperCase() || match2.toUpperCase()
        return `${code1} ↔ ${code2}`
      }

      return null
    } catch (error) {
      console.error("[chatService] getLanguagePair error:", error)
      return null
    }
  },
}


