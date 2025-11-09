"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { format } from "date-fns"
import { chatService, type ChatMessage } from "@/lib/services/chat-service"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  AlertCircle,
  ArrowLeft,
  Loader2,
  Mic,
  MoreVertical,
  Phone,
  Play,
  Smile,
  Video,
} from "lucide-react"

type Sender = "me" | "them"
type MessageType = "text" | "voice" | "image" | "system"

interface UIMessengerMessage {
  id: string
  text?: string | null
  type: MessageType
  sender: Sender
  timestamp: string
  mediaUrl?: string | null
  voiceDuration?: string
}

interface ChatConversationProps {
  chat: {
    id: string
    name: string
    avatar: string
    online: boolean
    otherUserId: string
  }
  onBack: () => void
}

export function ChatConversation({ chat, onBack }: ChatConversationProps) {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [messages, setMessages] = useState<UIMessengerMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    let isMounted = true

    async function initialiseConversation() {
      try {
        setIsLoading(true)
        setError(null)
        const userId = await chatService.getCurrentUserId()
        if (!isMounted) return
        setCurrentUserId(userId)

        const data = await chatService.getMessages(chat.id)
        if (!isMounted) return

        setMessages(data.map((message) => mapMessageToUI(message, userId)))
        await chatService.markConversationRead(chat.id)
      } catch (err) {
        if (!isMounted) return
        console.error("[ChatConversation] Failed to load messages:", err)
        setError(err instanceof Error ? err.message : "Failed to load messages")
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    initialiseConversation()

    const unsubscribe = chatService.subscribeToMessages(chat.id, (message) => {
      setMessages((prev) => {
        if (prev.some((existing) => existing.id === message.id)) {
          return prev
        }

        return [...prev, mapMessageToUI(message, currentUserId)]
      })
    })

    return () => {
      isMounted = false
      unsubscribe?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chat.id])

  const handleSend = async () => {
    if (!newMessage.trim() || !currentUserId) return

    const optimisticId = `temp-${Date.now()}`
    const optimisticMessage: UIMessengerMessage = {
      id: optimisticId,
      text: newMessage.trim(),
      type: "text",
      sender: "me",
      timestamp: format(new Date(), "HH:mm"),
    }

    setMessages((prev) => [...prev, optimisticMessage])
    const content = newMessage.trim()
    setNewMessage("")
    setIsSending(true)
    setError(null)

    try {
      const saved = await chatService.sendMessage(chat.id, content, "text")
      setMessages((prev) =>
        prev.map((message) => (message.id === optimisticId ? mapMessageToUI(saved, currentUserId) : message)),
      )
    } catch (err) {
      console.error("[ChatConversation] Failed to send message:", err)
      setMessages((prev) => prev.filter((message) => message.id !== optimisticId))
      setError(err instanceof Error ? err.message : "Failed to send message")
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      handleSend()
    }
  }

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((segment) => segment[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)

  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-slate-900 text-white">
        <Loader2 className="h-10 w-10 animate-spin mb-4" />
        <p className="text-white/70">Loading conversation…</p>
      </div>
    )
  }

  return (
    <div className="h-full bg-white flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 bg-slate-800 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="text-white hover:bg-white/10 rounded-xl h-12 w-12"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="relative">
              <Avatar className="h-12 w-12">
                <AvatarImage src={chat.avatar || "/placeholder.svg"} alt={chat.name} />
                <AvatarFallback className="bg-slate-600 text-white">{getInitials(chat.name)}</AvatarFallback>
              </Avatar>
              {chat.online && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-800" />
              )}
            </div>
            <div>
              <h2 className="font-semibold text-white text-lg">{chat.name}</h2>
              <p className="text-sm text-white/70">{chat.online ? "Online" : "Offline"}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 rounded-full h-10 w-10">
              <Phone className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 rounded-full h-10 w-10">
              <Video className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 rounded-full h-10 w-10">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-gradient-to-b from-slate-50 to-white">
        {error && (
          <div className="flex items-center gap-2 rounded-2xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}

        {messages.length === 0 ? (
          <div className="text-center text-slate-400 mt-20">
            <p>No messages yet.</p>
            <p className="text-sm text-slate-300 mt-2">Start the conversation with a friendly hello!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className={`flex gap-3 ${message.sender === "me" ? "flex-row-reverse" : "flex-row"}`}>
              <Avatar className={`h-10 w-10 flex-shrink-0 ${message.sender === "me" ? "bg-pink-500" : "bg-indigo-500"}`}>
                <AvatarFallback className="text-white font-medium">
                  {message.sender === "me" ? getInitials("Me") : getInitials(chat.name)}
                </AvatarFallback>
              </Avatar>

              <div className={`flex flex-col ${message.sender === "me" ? "items-end" : "items-start"}`}>
                {renderMessageContent(message)}
                <span className="text-xs text-slate-400 mt-1 px-1">{message.timestamp}</span>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 bg-white border-t border-slate-200 p-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full h-10 w-10 flex-shrink-0"
          >
            <Smile className="h-5 w-5" />
          </Button>
          <Input
            type="text"
            placeholder="Enter your message"
            value={newMessage}
            onChange={(event) => setNewMessage(event.target.value)}
            onKeyDown={handleKeyPress}
            className="flex-1 bg-slate-100 border-0 text-slate-900 placeholder:text-slate-400 rounded-full px-5 h-12 focus-visible:ring-1 focus-visible:ring-slate-300"
            disabled={isSending}
          />
          <Button
            variant="ghost"
            size="icon"
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full h-10 w-10 flex-shrink-0"
            onClick={handleSend}
            disabled={isSending || !newMessage.trim()}
          >
            {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Mic className="h-5 w-5" />}
          </Button>
        </div>
      </div>
    </div>
  )
}

function mapMessageToUI(message: ChatMessage, currentUserId: string | null): UIMessengerMessage {
  const sender: Sender = message.sender_id === currentUserId ? "me" : "them"
  const timestamp = format(new Date(message.created_at), "HH:mm")

  return {
    id: message.id,
    text: message.content,
    type: (message.message_type as MessageType) ?? "text",
    sender,
    timestamp,
    mediaUrl: message.media_url,
    voiceDuration:
      message.voice_duration != null ? formatVoiceDuration(message.voice_duration ?? 0) : undefined,
  }
}

function renderMessageContent(message: UIMessengerMessage) {
  if (message.type === "image" && message.mediaUrl) {
    return (
      <div className="rounded-2xl overflow-hidden border border-white/20">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={message.mediaUrl} alt="Attachment" className="max-w-xs rounded-2xl" />
      </div>
    )
  }

  if (message.type === "voice") {
    return (
      <div
        className={`rounded-2xl px-4 py-3 flex items-center gap-3 ${
          message.sender === "me"
            ? "bg-slate-800 text-white rounded-tr-sm"
            : "bg-slate-100 text-slate-900 rounded-tl-sm"
        }`}
      >
        <Button
          size="icon"
          variant="ghost"
          className={`h-8 w-8 rounded-full flex-shrink-0 ${
            message.sender === "me"
              ? "bg-white/20 hover:bg-white/30 text-white"
              : "bg-slate-800/10 hover:bg-slate-800/20 text-slate-900"
          }`}
        >
          <Play className="h-4 w-4 fill-current" />
        </Button>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5">
            {[...Array(8)].map((_, index) => (
              <div
                key={index}
                className={`w-0.5 rounded-full ${message.sender === "me" ? "bg-white/40" : "bg-slate-400"}`}
                style={{ height: `${Math.random() * 16 + 8}px` }}
              />
            ))}
          </div>
          <span className={`text-xs ${message.sender === "me" ? "text-white/70" : "text-slate-500"}`}>
            {message.voiceDuration ?? "00:00"}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`rounded-2xl px-4 py-3 max-w-[280px] ${
        message.sender === "me"
          ? "bg-slate-800 text-white rounded-tr-sm"
          : "bg-slate-100 text-slate-900 rounded-tl-sm"
      }`}
    >
      <p className="text-[15px] leading-relaxed">{message.text}</p>
    </div>
  )
}

function formatVoiceDuration(durationSeconds: number) {
  const minutes = Math.floor(durationSeconds / 60)
  const seconds = durationSeconds % 60
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
}
