"use client"

import { type CSSProperties, useEffect, useMemo, useState } from "react"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Mic, MoreHorizontal, Paperclip, PenLine, Play } from "lucide-react"

import { useIsMobile } from "@/hooks/use-mobile"
import { chatService, type ChatMessage, type ConversationSummary } from "@/lib/services/chat-service"

const TABS = ["Inbox", "Unread", "Requests"] as const

export function MessagesView() {
  const isMobile = useIsMobile()
  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [conversationsLoading, setConversationsLoading] = useState<boolean>(true)
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [selectedChat, setSelectedChat] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [messagesLoading, setMessagesLoading] = useState<boolean>(false)
  const [messageInput, setMessageInput] = useState("")
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("Inbox")

  useEffect(() => {
    let isMounted = true

    const bootstrap = async () => {
      try {
        setConversationsLoading(true)
        const [userId, summaries] = await Promise.all([
          chatService.getCurrentUserId(),
          chatService.getConversationSummaries(),
        ])

        if (!isMounted) return

        setCurrentUserId(userId)
        setConversations(summaries)
        if (summaries.length > 0) {
          setActiveConversationId((current) => current ?? summaries[0].conversationId)
        }
      } finally {
        if (isMounted) {
          setConversationsLoading(false)
        }
      }
    }

    bootstrap().catch((error) => {
      console.error("[MessagesView] failed to load conversations", error)
      setConversationsLoading(false)
    })

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (conversations.length === 0) {
      setActiveConversationId(null)
      return
    }

    if (!activeConversationId) {
      setActiveConversationId(conversations[0].conversationId)
      return
    }

    if (!conversations.some((conversation) => conversation.conversationId === activeConversationId)) {
      setActiveConversationId(conversations[0].conversationId)
    }
  }, [activeConversationId, conversations])

  useEffect(() => {
    if (!selectedChat) {
      setMessages([])
      return
    }

    let isMounted = true
    setMessagesLoading(true)

    const loadMessages = async () => {
      const initialMessages = await chatService.getMessages(selectedChat)
      if (isMounted) {
        setMessages(initialMessages)
        setMessagesLoading(false)
      }
    }

    loadMessages().catch((error) => {
      console.error("[MessagesView] failed to load messages", error)
      setMessagesLoading(false)
    })

    const unsubscribe = chatService.subscribeToMessages(selectedChat, (message) => {
      setMessages((prev) => {
        if (prev.find((item) => item.id === message.id)) return prev
        return [...prev, message]
      })
    })

    return () => {
      isMounted = false
      unsubscribe?.()
    }
  }, [selectedChat])

  const carouselConversations = useMemo(() => conversations.slice(0, 7), [conversations])
  const activeCarouselIndex = useMemo(() => {
    if (!activeConversationId) return -1
    return carouselConversations.findIndex((conversation) => conversation.conversationId === activeConversationId)
  }, [activeConversationId, carouselConversations])
  const effectiveCarouselIndex = activeCarouselIndex >= 0 ? activeCarouselIndex : 0

  const activeCarouselConversation = carouselConversations[effectiveCarouselIndex] ?? null
  const activeConversation = conversations.find((conversation) => conversation.conversationId === activeConversationId) ?? null
  const activeConversationForDetail = conversations.find((conversation) => conversation.conversationId === selectedChat) ?? activeConversation

  const radius = isMobile ? 180 : 240
  const angleStep = carouselConversations.length > 1 ? 180 / (carouselConversations.length - 1) : 0
  const angles = useMemo(
    () => carouselConversations.map((_, index) => -90 + index * angleStep),
    [carouselConversations, angleStep],
  )

  const filteredConversations = useMemo(() => {
    if (activeTab === "Unread") {
      return conversations.filter((conversation) => conversation.unreadCount > 0)
    }

    if (activeTab === "Requests") {
      return conversations.filter((conversation) => conversation.isRequest === true)
    }

    return conversations
  }, [activeTab, conversations])

  const handleOpenConversation = (conversation: ConversationSummary) => {
    setActiveConversationId(conversation.conversationId)
    setSelectedChat(conversation.conversationId)
    chatService.markConversationRead(conversation.conversationId).catch((error) => {
      console.warn("[MessagesView] markConversationRead failed", error)
    })
  }

  const handleSendMessage = async () => {
    if (!selectedChat || !messageInput.trim()) return

    try {
      setMessageInput("")
      const newMessage = await chatService.sendMessage(selectedChat, messageInput.trim())
      setMessages((prev) => [...prev, newMessage])
      chatService.markConversationRead(selectedChat).catch(() => {})
      const summaries = await chatService.getConversationSummaries()
      setConversations(summaries)
    } catch (error) {
      console.error("[MessagesView] sendMessage error", error)
    }
  }

  if (selectedChat && activeConversationForDetail) {
    const otherParticipantName = activeConversationForDetail.name
    const otherParticipantAvatar = activeConversationForDetail.avatar
    const otherParticipantOnline = activeConversationForDetail.online

    return (
      <div className="flex h-full flex-col bg-white">
        <div className="flex items-center gap-3 bg-gray-900 px-4 py-4 text-white">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSelectedChat(null)}
            className="h-12 w-12 rounded-full text-white hover:bg-gray-800"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <div className="flex-1 text-center">
            <h3 className="text-lg font-semibold">{otherParticipantName}</h3>
            <p className="text-sm text-gray-400">{otherParticipantOnline ? "Online" : "Offline"}</p>
          </div>
          <Avatar className="h-12 w-12 border-2 border-gray-700">
            <AvatarImage src={otherParticipantAvatar || "/placeholder-user.jpg"} alt={otherParticipantName} />
            <AvatarFallback>{otherParticipantName.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto bg-white p-4">
          {messagesLoading ? (
            <div className="flex h-full items-center justify-center">
              <span className="text-sm text-gray-400">Loading messages…</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-gray-400">
              <span>No messages yet</span>
              <span className="text-xs">Say hello to start the conversation.</span>
            </div>
          ) : (
            messages.map((msg) => {
              const isOwnMessage = msg.sender_id === currentUserId
              const createdAt = new Date(msg.created_at)
              const timeLabel = createdAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

              return (
                <div key={msg.id} className={`flex gap-2 ${isOwnMessage ? "justify-end" : "justify-start"}`}>
                  {!isOwnMessage && (
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarImage src={otherParticipantAvatar || "/placeholder-user.jpg"} alt={otherParticipantName} />
                      <AvatarFallback>{otherParticipantName.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  )}

                  <div className={`flex max-w-[70%] flex-col gap-1 ${isOwnMessage ? "items-end" : "items-start"}`}>
                    {msg.message_type === "voice" ? (
                      <div className="flex items-center gap-3 rounded-3xl bg-gray-800 px-4 py-3 text-white shadow-md">
                        <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full bg-gray-700 hover:bg-gray-600">
                          <Play className="h-4 w-4 text-white" />
                        </Button>
                        <div className="flex h-8 flex-1 items-center gap-0.5">
                          {[...Array(18)].map((_, index) => (
                            <div key={index} className="w-1 rounded-full bg-white" style={{ height: `${Math.random() * 100}%` }} />
                          ))}
                        </div>
                        <span className="text-xs">{msg.voice_duration ? `${msg.voice_duration}s` : ""}</span>
                      </div>
                    ) : msg.message_type === "image" ? (
                      <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white/70 shadow-sm">
                        {msg.media_url ? (
                          <img src={msg.media_url} alt="Shared" className="h-48 w-48 object-cover" />
                        ) : (
                          <div className="flex h-32 w-32 items-center justify-center text-xs text-gray-400">Image unavailable</div>
                        )}
                      </div>
                    ) : (
                      <div
                        className={`rounded-3xl px-5 py-3 shadow-sm ${
                          isOwnMessage ? "rounded-br-md bg-gray-800 text-white" : "rounded-bl-md border border-gray-200 bg-white text-gray-900"
                        }`}
                      >
                        <p className="text-sm leading-relaxed">{msg.content}</p>
                      </div>
                    )}
                    <span className="px-2 text-xs text-gray-400">{timeLabel}</span>
                  </div>
                </div>
              )
            })
          )}
        </div>

        <div className="border-t border-gray-100 bg-white p-4">
          <div className="flex items-center gap-3 rounded-full border border-gray-200 bg-gray-50 px-4 py-2">
            <Button size="icon" variant="ghost" className="h-10 w-10 rounded-full text-gray-500">
              <Paperclip className="h-5 w-5" />
            </Button>
            <Input
              placeholder="Enter your message"
              value={messageInput}
              onChange={(event) => setMessageInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault()
                  handleSendMessage().catch(() => {})
                }
              }}
              className="flex-1 border-0 bg-transparent text-gray-600 placeholder:text-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            <Button size="icon" variant="ghost" className="h-10 w-10 rounded-full text-gray-500" onClick={() => handleSendMessage().catch(() => {})}>
              <Mic className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const conversationsEmpty = !conversationsLoading && conversations.length === 0

  return (
    <div className="flex h-full flex-col bg-background">
      <div
        className="relative overflow-hidden rounded-b-[36px] bg-gradient-to-r from-blue-500 to-purple-500 text-white"
        style={{ paddingTop: isMobile ? "56px" : "72px", paddingBottom: `${Math.round(radius / 2 + 72)}px` }}
      >
        <div className="flex items-center justify-between px-6">
          <Button variant="ghost" size="icon" className="h-11 w-11 rounded-full bg-white/15 text-white hover:bg-white/25">
            <PenLine className="h-5 w-5" />
          </Button>
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.5em] text-white/60">Messages</p>
            <h1 className="text-2xl font-semibold leading-tight">Stay connected</h1>
          </div>
          <Button variant="ghost" size="icon" className="h-11 w-11 rounded-full bg-white/15 text-white hover:bg-white/25">
            <MoreHorizontal className="h-5 w-5" />
          </Button>
        </div>

        <div className="relative mx-auto mt-10 w-full max-w-xl" style={{ height: `${radius}px` }}>
          {activeCarouselConversation && (
            <div className="absolute left-1/2 top-[-28px] flex -translate-x-1/2 flex-col items-center gap-1 text-slate-900">
              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold shadow-lg">Add Note</span>
              <span className="h-2 w-2 rotate-45 bg-white shadow-md" />
            </div>
          )}

          {carouselConversations.map((conversation, index) => {
            const angle = angles[index] ?? 0
            const transformWrapper: CSSProperties = {
              transform: `translate(-50%, 0) rotate(${angle}deg)`,
            }
            const transformInner: CSSProperties = {
              transform: `translateY(-${radius}px) rotate(${-angle}deg)`,
            }
            const isActive = conversation.conversationId === activeConversationId

            return (
              <div key={conversation.conversationId} className="absolute left-1/2 bottom-0 origin-bottom" style={transformWrapper}>
                <button
                  type="button"
                  onClick={() => setActiveConversationId(conversation.conversationId)}
                  className="pointer-events-auto flex items-center justify-center"
                  style={transformInner}
                >
                  <div
                    className={`relative flex h-[68px] w-[68px] items-center justify-center overflow-hidden rounded-full border-2 border-white/20 bg-white/15 backdrop-blur-sm transition-all duration-200 md:h-[84px] md:w-[84px] ${
                      isActive ? "scale-[1.15] drop-shadow-[0_0_10px_rgba(255,255,255,0.25)]" : "scale-100"
                    }`}
                  >
                    {conversation.avatar ? (
                      <img src={conversation.avatar} alt={conversation.name} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-sm font-semibold text-white/80">{conversation.name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                </button>
              </div>
            )
          })}
        </div>
      </div>

      <div className="relative -mt-16 flex justify-center px-6">
        <div className="flex items-center gap-2 rounded-full bg-white px-2 py-1 shadow-lg">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                activeTab === tab ? "bg-gray-900 text-white" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              {tab}
              {tab === "Requests" && <span className="ml-1 inline-block h-2 w-2 rounded-full bg-red-500" />}
            </button>
          ))}
        </div>
      </div>

      {conversationsLoading ? (
        <div className="flex flex-1 items-center justify-center text-gray-400">Loading conversations…</div>
      ) : conversationsEmpty ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 text-gray-400">
          <span>No conversations yet</span>
          <span className="text-sm">Start connecting with language partners to see them here.</span>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-4 pb-6 pt-12">
          <div className="space-y-3">
            {filteredConversations.map((conversation) => {
              const isActiveCard = conversation.conversationId === activeConversationId
              return (
                <Card
                  key={conversation.conversationId}
                  onClick={() => handleOpenConversation(conversation)}
                  className={`cursor-pointer rounded-3xl border-2 transition-all hover:border-white/50 hover:shadow-xl ${
                    isActiveCard ? "border-white/70 bg-white/90 shadow-lg" : "bg-white/80"
                  }`}
                >
                  <div className="flex items-center gap-3 p-4">
                    <div className="relative">
                      <Avatar className="h-14 w-14 border-2 border-white shadow-md">
                        <AvatarImage src={conversation.avatar || "/placeholder-user.jpg"} alt={conversation.name} />
                        <AvatarFallback>{conversation.name.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      {conversation.online && (
                        <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full border-2 border-white bg-green-500" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="truncate text-base font-semibold text-gray-900">{conversation.name}</h3>
                        <span className="text-xs text-gray-400">
                          {conversation.lastMessageAt
                            ? new Date(conversation.lastMessageAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                            : ""}
                        </span>
                      </div>
                      <p className="truncate text-sm text-gray-500">{conversation.lastMessage || "Tap to start chatting"}</p>
                    </div>
                    {conversation.unreadCount > 0 && (
                      <span className="ml-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-xs font-semibold text-white">
                        {conversation.unreadCount}
                      </span>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
