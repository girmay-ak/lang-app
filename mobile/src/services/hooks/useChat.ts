import { useState, useEffect, useCallback } from 'react'
import { createClient } from '../../../lib/supabase'
import { chatService, Conversation, Message } from '../api/chat.service'

export function useChat() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await chatService.getConversations()
      setConversations(data)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch conversations')
      setError(error)
      console.error('[useChat] Error:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  // Set up real-time subscription for conversations
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('conversations')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
        },
        () => {
          // Refetch conversations when they change
          fetchConversations()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchConversations])

  return {
    conversations,
    loading,
    error,
    refetch: fetchConversations,
  }
}

export function useConversation(conversationId: string) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await chatService.getMessages(conversationId)
      setMessages(data)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch messages')
      setError(error)
      console.error('[useConversation] Error:', error)
    } finally {
      setLoading(false)
    }
  }, [conversationId])

  useEffect(() => {
    fetchMessages()
  }, [fetchMessages])

  // Set up real-time subscription for messages
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setMessages((prev) => [...prev, payload.new as Message])
          } else if (payload.eventType === 'UPDATE') {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === payload.new.id ? (payload.new as Message) : msg
              )
            )
          } else if (payload.eventType === 'DELETE') {
            setMessages((prev) => prev.filter((msg) => msg.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId])

  const sendMessage = useCallback(
    async (
      content: string,
      messageType: 'text' | 'voice' | 'image' = 'text',
      mediaUrl?: string,
      voiceDuration?: number
    ) => {
      try {
        const message = await chatService.sendMessage(
          conversationId,
          content,
          messageType,
          mediaUrl,
          voiceDuration
        )
        setMessages((prev) => [...prev, message])
        return message
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to send message')
        setError(error)
        throw error
      }
    },
    [conversationId]
  )

  const markAsRead = useCallback(async () => {
    try {
      await chatService.markAsRead(conversationId)
    } catch (err) {
      console.error('[useConversation] markAsRead error:', err)
    }
  }, [conversationId])

  useEffect(() => {
    // Mark as read when conversation is opened
    markAsRead()
  }, [markAsRead])

  return {
    messages,
    loading,
    error,
    sendMessage,
    markAsRead,
    refetch: fetchMessages,
  }
}

