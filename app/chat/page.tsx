"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { format, formatDistanceToNow } from "date-fns"
import { chatService, type ChatMessage, type ConversationSummary } from "@/lib/services/chat-service"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import {
  ArrowLeft,
  Search,
  Send,
  Mic,
  Paperclip,
  Phone,
  Video,
  MoreVertical,
  Loader2,
  AlertCircle,
  Smile,
  Play,
  Home,
  MessageCircle,
  Compass,
  Heart,
  Settings,
  Bell,
  Menu,
  X,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

export default function ChatPage() {
  const router = useRouter()
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [selectedConversation, setSelectedConversation] = useState<ConversationSummary | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [messageInput, setMessageInput] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isTyping, setIsTyping] = useState(false)
  const [otherUserTyping, setOtherUserTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const supabase = createClient()

  // Initialize user and load conversations
  useEffect(() => {
    let isMounted = true

    async function initialize() {
      try {
        setIsLoading(true)
        setError(null)

        const userId = await chatService.getCurrentUserId()
        if (!isMounted) return

        if (!userId) {
          router.push("/auth/login")
          return
        }

        setCurrentUserId(userId)

        // Load conversations
        const summaries = await chatService.getConversationSummaries()
        if (!isMounted) return

        setConversations(summaries)

        // Set online status
        await supabase
          .from("users")
          .update({ is_online: true, last_seen_at: new Date().toISOString() })
          .eq("id", userId)
      } catch (err) {
        console.error("[ChatPage] Initialization error:", err)
        setError(err instanceof Error ? err.message : "Failed to load chats")
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    initialize()

    return () => {
      isMounted = false
    }
  }, [router, supabase])

  // Subscribe to conversation updates and user online status
  useEffect(() => {
    if (!currentUserId) return

    // Subscribe to conversation changes
    const conversationsChannel = supabase
      .channel("conversations-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversations",
          filter: `or(user1_id.eq.${currentUserId},user2_id.eq.${currentUserId})`,
        },
        async () => {
          try {
            const summaries = await chatService.getConversationSummaries()
            setConversations(summaries)
          } catch (err) {
            console.error("[ChatPage] Failed to refresh conversations:", err)
          }
        }
      )
      .subscribe()

    // Subscribe to user online status changes for users in conversations
    const usersChannel = supabase
      .channel("users-online-status")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "users",
        },
        async () => {
          // Refresh conversations to update online status
          try {
            const summaries = await chatService.getConversationSummaries()
            setConversations(summaries)
          } catch (err) {
            console.error("[ChatPage] Failed to refresh user status:", err)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(conversationsChannel)
      supabase.removeChannel(usersChannel)
    }
  }, [currentUserId, supabase])

  // Load messages when conversation is selected
  useEffect(() => {
    if (!selectedConversation || !currentUserId) {
      setMessages([])
      return
    }

    let isMounted = true
    let unsubscribe: (() => void) | null = null

    async function loadMessages() {
      if (!selectedConversation) return
      
      try {
        const initialMessages = await chatService.getMessages(selectedConversation.conversationId)
        if (!isMounted) return

        setMessages(initialMessages)

        // Mark conversation as read
        await chatService.markConversationRead(selectedConversation.conversationId)

        // Subscribe to new messages
        unsubscribe = chatService.subscribeToMessages(selectedConversation.conversationId, (message) => {
          setMessages((prev) => {
            if (prev.some((existing) => existing.id === message.id)) return prev
            return [...prev, message]
          })

          // Mark as read if it's from the other user
          if (message.sender_id !== currentUserId && selectedConversation) {
            chatService.markConversationRead(selectedConversation.conversationId).catch(() => {})
          }
        })

        // Subscribe to typing indicators
        const typingChannel = supabase
          .channel(`typing:${selectedConversation.conversationId}`)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "typing_indicators",
              filter: `conversation_id=eq.${selectedConversation.conversationId}`,
            },
            (payload: any) => {
              if (payload.new?.user_id !== currentUserId) {
                if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
                  setOtherUserTyping(payload.new.is_typing)
                } else if (payload.eventType === "DELETE") {
                  setOtherUserTyping(false)
                }
              }
            }
          )
          .subscribe()

        return () => {
          supabase.removeChannel(typingChannel)
        }
      } catch (err) {
        console.error("[ChatPage] Failed to load messages:", err)
        setError(err instanceof Error ? err.message : "Failed to load messages")
      }
    }

    loadMessages()

    return () => {
      isMounted = false
      unsubscribe?.()
    }
  }, [selectedConversation, currentUserId, supabase])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, otherUserTyping])

  // Focus input when conversation is selected
  useEffect(() => {
    if (selectedConversation && inputRef.current) {
      // Small delay to ensure the input is rendered
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }, [selectedConversation])

  // Handle typing indicator
  const handleInputChange = useCallback(
    (value: string) => {
      setMessageInput(value)

      if (!selectedConversation || !currentUserId) return

      // Set typing indicator
      if (value.trim() && !isTyping) {
        setIsTyping(true)
        supabase
          .from("typing_indicators")
          .upsert({
            conversation_id: selectedConversation.conversationId,
            user_id: currentUserId,
            is_typing: true,
            updated_at: new Date().toISOString(),
          })
          .catch(() => {})
      }

      // Clear typing indicator after 3 seconds of no typing
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }

      typingTimeoutRef.current = setTimeout(() => {
        if (isTyping) {
          setIsTyping(false)
          supabase
            .from("typing_indicators")
            .delete()
            .eq("conversation_id", selectedConversation.conversationId)
            .eq("user_id", currentUserId)
            .catch(() => {})
        }
      }, 3000)
    },
    [selectedConversation, currentUserId, isTyping, supabase]
  )

  // Send message
  const handleSendMessage = useCallback(async () => {
    if (!selectedConversation || !messageInput.trim() || isSending) return

    const content = messageInput.trim()
    setMessageInput("")
    setIsSending(true)
    setError(null)

    // Clear typing indicator
    if (isTyping) {
      setIsTyping(false)
      await supabase
        .from("typing_indicators")
        .delete()
        .eq("conversation_id", selectedConversation.conversationId)
        .eq("user_id", currentUserId!)
        .catch(() => {})
    }

    try {
      const sentMessage = await chatService.sendMessage(selectedConversation.conversationId, content, "text")
      
      // Add message to local state immediately for better UX
      setMessages((prev) => [...prev, sentMessage])

      // Refresh conversations to update last message and unread counts
      const summaries = await chatService.getConversationSummaries()
      setConversations(summaries)
      
      // Update selected conversation if it's still selected
      const updatedConv = summaries.find(
        (c) => c.conversationId === selectedConversation.conversationId
      )
      if (updatedConv) {
        setSelectedConversation(updatedConv)
      }
    } catch (err) {
      console.error("[ChatPage] Failed to send message:", err)
      setError(err instanceof Error ? err.message : "Failed to send message")
      setMessageInput(content) // Restore message on error
    } finally {
      setIsSending(false)
    }
  }, [selectedConversation, messageInput, isSending, isTyping, currentUserId, supabase])

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Filter conversations
  const filteredConversations = conversations.filter((conv) => {
    const query = searchQuery.toLowerCase()
    return conv.name.toLowerCase().includes(query) || conv.lastMessage?.toLowerCase().includes(query)
  })

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      if (currentUserId) {
        supabase
          .from("users")
          .update({ is_online: false, last_seen_at: new Date().toISOString() })
          .eq("id", currentUserId)
          .catch(() => {})
      }
    }
  }, [currentUserId, supabase])

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userData, setUserData] = useState<{ name: string; avatar: string; email: string } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Fetch user data from database
  useEffect(() => {
    async function fetchUserData() {
      if (!currentUserId) return
      
      try {
        const supabase = createClient()
        const { data: user, error } = await supabase
          .from("users")
          .select("full_name, avatar_url, email, is_online")
          .eq("id", currentUserId)
          .single()

        if (error) {
          console.error("[ChatPage] Failed to fetch user data:", error)
          return
        }

        if (user) {
          setUserData({
            name: user.full_name || "User",
            avatar: user.avatar_url || null,
            email: user.email || "",
          })
          
          // Update online status if not already set
          if (user.is_online === null || user.is_online === false) {
            try {
              await supabase
                .from("users")
                .update({ is_online: true, last_seen_at: new Date().toISOString() })
                .eq("id", currentUserId)
            } catch (updateError) {
              // Silently fail - online status update is not critical
              console.error("[ChatPage] Failed to update online status:", updateError)
            }
          }
        }
      } catch (err) {
        console.error("[ChatPage] Error fetching user data:", err)
      }
    }
    
    if (currentUserId) {
      fetchUserData()
    }
  }, [currentUserId])

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex h-screen w-screen items-center justify-center bg-[#0a0a0f]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading chats...</p>
        </div>
      </div>
    )
  }

  const userInitials = userData?.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U"

  return (
    <div className="fixed inset-0 flex h-screen w-screen bg-[#0a0a0f] overflow-hidden">
      {/* Left Sidebar - Navigation */}
      <aside className="hidden md:flex fixed top-0 left-0 h-full w-20 flex-col items-center justify-between py-6 bg-gradient-to-b from-gray-900/80 to-gray-800/80 backdrop-blur-md border-r border-white/10 z-50">
        {/* Top Section - Logo & Navigation */}
        <div className="flex flex-col items-center gap-6 w-full">
          {/* Logo */}
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-purple-700 text-sm font-bold text-white shadow-lg shadow-purple-500/30">
            LX
          </div>

          {/* Navigation Items */}
          <nav className="flex flex-col items-center gap-2 w-full px-3">
            <button
              onClick={() => router.push("/")}
              className="flex h-12 w-12 items-center justify-center rounded-xl text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
            >
              <Home className="h-5 w-5" />
            </button>
            <button
              className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-purple-700 text-white shadow-lg shadow-purple-500/50"
            >
              <MessageCircle className="h-5 w-5" />
            </button>
            <button
              onClick={() => router.push("/")}
              className="flex h-12 w-12 items-center justify-center rounded-xl text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
            >
              <Compass className="h-5 w-5" />
            </button>
            <button
              onClick={() => router.push("/profile")}
              className="flex h-12 w-12 items-center justify-center rounded-xl text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
            >
              <Heart className="h-5 w-5" />
            </button>
          </nav>
        </div>

        {/* Bottom Section - Settings & Profile */}
        <div className="flex flex-col items-center gap-2 w-full px-3">
          <button className="flex h-12 w-12 items-center justify-center rounded-xl text-gray-400 hover:bg-white/10 hover:text-white transition-colors">
            <Settings className="h-5 w-5" />
          </button>
          <button onClick={() => router.push("/profile")}>
            <Avatar className="h-11 w-11 border-2 border-gray-600 hover:border-purple-500 transition-colors">
              <AvatarImage src={userData?.avatar} alt={userData?.name} />
              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-sm font-semibold">
                {userInitials}
              </AvatarFallback>
            </Avatar>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden md:ml-20">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between px-4 md:px-6 bg-black/40 backdrop-blur-md border-b border-white/10 shadow-lg">
          {/* Left Section - Mobile Menu & Search */}
          <div className="flex items-center gap-3 flex-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden h-10 w-10 text-white hover:bg-white/10"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <div className="relative flex-1 max-w-2xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="search"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-full pl-11 pr-4 bg-white/10 text-white placeholder-gray-400 border-white/10 focus:bg-white/15 focus:border-white/20"
              />
            </div>
          </div>

          {/* Right Section - Notifications & User */}
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full relative text-white hover:bg-white/10">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full border-2 border-black/40" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full h-10 px-2 hover:bg-white/10 transition-colors">
                  <Avatar className="h-8 w-8 border border-white/20">
                    <AvatarImage src={userData?.avatar} alt={userData?.name} />
                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-xs font-semibold">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden lg:flex flex-col items-start">
                    <span className="text-sm font-semibold text-white leading-tight">
                      {userData?.name || "User"}
                    </span>
                    <span className="text-xs text-white/60 leading-tight">
                      {userData?.email || ""}
                    </span>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-gray-900/95 backdrop-blur-md border-white/20 text-white shadow-xl">
                <DropdownMenuItem onClick={() => router.push("/profile")} className="cursor-pointer hover:bg-white/10">
                  View Profile
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer hover:bg-white/10">Settings</DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem className="cursor-pointer text-red-400 hover:bg-red-500/10">Logout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Main Content - Split View */}
        <div className="flex-1 flex overflow-hidden bg-gradient-to-br from-[#0a0a0f] via-[#0d0d14] to-[#12121a]">
          {/* Conversation List Sidebar */}
          <div className={cn(
            "border-r border-white/10 bg-[rgba(18,20,36,0.9)] backdrop-blur-md flex flex-col flex-shrink-0 transition-all duration-300",
            selectedConversation 
              ? "hidden md:flex md:w-[420px] lg:w-[480px] xl:w-[520px]" 
              : "w-full md:w-[420px] lg:w-[480px] xl:w-[520px]"
          )}>
            {/* INBOX Header */}
            <div className="px-6 py-4 border-b border-white/10">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-bold text-white">INBOX</h2>
                {selectedConversation && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedConversation(null)}
                    className="text-xs text-purple-400 hover:text-purple-300 hover:bg-white/5"
                  >
                    Open full chat
                  </Button>
                )}
              </div>
              <p className="text-sm text-gray-400">Recent conversations</p>
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto">
              {error && (
                <div className="mx-4 mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-200 text-sm flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}

              {filteredConversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-6">
                  <div className="text-gray-500 mb-2">
                    <MessageCircle className="h-12 w-12 mx-auto opacity-50" />
                  </div>
                  <p className="text-gray-400 font-medium">
                    {searchQuery ? "No conversations found" : "No conversations yet"}
                  </p>
                  <p className="text-gray-500 text-sm mt-1">
                    {searchQuery ? "Try a different search term" : "Start chatting from the map or feed!"}
                  </p>
                </div>
              ) : (
                <div className="p-4 space-y-2">
                  {filteredConversations.map((conversation) => {
                    const isSelected = selectedConversation?.conversationId === conversation.conversationId
                    const isTyping = otherUserTyping && selectedConversation?.conversationId === conversation.conversationId
                    const lastMessageIsFromMe = messages.length > 0 && messages[messages.length - 1]?.sender_id === currentUserId
                    
                    return (
                      <div
                        key={conversation.conversationId}
                        className={cn(
                          "cursor-pointer transition-all rounded-xl p-4",
                          isSelected
                            ? "bg-gradient-to-r from-purple-600/20 to-purple-700/20 border border-purple-500/30"
                            : "bg-white/5 hover:bg-white/10 border border-transparent"
                        )}
                        onClick={() => {
                          console.log('[ChatPage] Conversation clicked:', conversation.conversationId)
                          setSelectedConversation(conversation)
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <div className="relative">
                            <Avatar className="h-12 w-12 border-2 border-white/20">
                              <AvatarImage src={conversation.avatar || undefined} alt={conversation.name} />
                              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                                {conversation.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            {conversation.online && (
                              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-[rgba(18,20,36,0.9)]" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="font-semibold text-white truncate">{conversation.name}</h3>
                              {conversation.lastMessageAt && (
                                <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                                  {formatDistanceToNow(new Date(conversation.lastMessageAt), { addSuffix: true })}
                                </span>
                              )}
                            </div>
                            {conversation.languagePair && (
                              <p className="text-xs text-gray-400 mb-1">{conversation.languagePair}</p>
                            )}
                            <p className="text-sm text-gray-300 truncate mb-1">
                              {conversation.lastMessage || "Say hello to start chatting!"}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              {isTyping ? (
                                <span className="text-xs text-purple-400 font-medium">TYPING...</span>
                              ) : lastMessageIsFromMe && selectedConversation?.conversationId === conversation.conversationId ? (
                                <span className="text-xs text-green-400 font-medium">DELIVERED</span>
                              ) : conversation.unreadCount > 0 ? (
                                <Badge className="bg-purple-600 text-white text-xs">
                                  {conversation.unreadCount}
                                </Badge>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Message View */}
          {selectedConversation ? (
            <div className="flex-1 flex flex-col bg-[rgba(18,20,36,0.9)] backdrop-blur-md min-w-0 overflow-hidden">
              {/* Chat Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/40 backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedConversation(null)}
                    className="md:hidden h-10 w-10 text-white hover:bg-white/10"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <div className="relative">
                    <Avatar className="h-10 w-10 border border-white/20">
                      <AvatarImage
                        src={selectedConversation.avatar || undefined}
                        alt={selectedConversation.name}
                      />
                      <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                        {selectedConversation.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {selectedConversation.online && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-[rgba(18,20,36,0.9)]" />
                    )}
                  </div>
                  <div>
                    <h2 className="font-semibold text-white">{selectedConversation.name}</h2>
                    <p className="text-xs text-gray-400">
                      {selectedConversation.online ? "Online" : "Offline"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full text-white hover:bg-white/10">
                    <Phone className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full text-white hover:bg-white/10">
                    <Video className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full text-white hover:bg-white/10">
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-gradient-to-b from-[#0a0a0f] to-[#0d0d14]">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="text-gray-500 mb-2 opacity-50">
                      <MessageCircle className="h-12 w-12 mx-auto" />
                    </div>
                    <p className="text-gray-400 font-medium">No messages yet</p>
                    <p className="text-gray-500 text-sm mt-1">Say hello to start the conversation!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message) => {
                      const isOwn = message.sender_id === currentUserId
                      const timeLabel = format(new Date(message.created_at), "HH:mm")

                      return (
                        <div
                          key={message.id}
                          className={`flex items-end gap-3 ${isOwn ? "flex-row-reverse" : "flex-row"}`}
                        >
                          {!isOwn && (
                            <Avatar className="h-8 w-8 flex-shrink-0 border border-white/20">
                              <AvatarImage
                                src={selectedConversation.avatar || undefined}
                                alt={selectedConversation.name}
                              />
                              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-xs">
                                {selectedConversation.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          )}

                          <div className={`flex flex-col max-w-[70%] ${isOwn ? "items-end" : "items-start"}`}>
                            {renderMessageContent(message, isOwn)}
                            <span className="text-xs text-gray-500 mt-1 px-1">{timeLabel}</span>
                          </div>
                        </div>
                      )
                    })}

                    {otherUserTyping && (
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8 border border-white/20">
                          <AvatarImage
                            src={selectedConversation.avatar || undefined}
                            alt={selectedConversation.name}
                          />
                          <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-xs">
                            {selectedConversation.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-3 flex items-center gap-1 border border-white/10">
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                          </div>
                        </div>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Message Input */}
              <div className="border-t border-white/10 bg-black/40 backdrop-blur-md p-4 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full text-gray-400 hover:bg-white/10 hover:text-white">
                    <Paperclip className="h-5 w-5" />
                  </Button>
                  <Input
                    ref={inputRef}
                    type="text"
                    placeholder="Type a message..."
                    value={messageInput}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1 bg-white/10 text-white placeholder-gray-400 border-white/10 rounded-full px-5 h-12 focus:bg-white/15 focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/30 caret-purple-400"
                    disabled={isSending}
                    autoFocus={selectedConversation !== null}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim() || isSending}
                    className="h-10 w-10 rounded-full text-purple-400 hover:bg-purple-500/20 disabled:opacity-50"
                  >
                    {isSending ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : messageInput.trim() ? (
                      <Send className="h-5 w-5" />
                    ) : (
                      <Mic className="h-5 w-5" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-[#0a0a0f] via-[#0d0d14] to-[#12121a] min-w-0">
              <div className="text-center px-6">
                <div className="text-gray-500 mb-4 opacity-50">
                  <MessageCircle className="h-16 w-16 mx-auto" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Select a conversation</h3>
                <p className="text-gray-400 text-sm">Choose a chat from the list to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <aside
            className="fixed top-0 left-0 h-full w-64 bg-gradient-to-b from-gray-900/95 to-gray-800/95 backdrop-blur-md shadow-xl border-r border-white/10 z-50"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col h-full py-6">
              <div className="px-6 mb-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-purple-700 text-sm font-bold text-white shadow-lg shadow-purple-500/30">
                    LX
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSidebarOpen(false)}
                    className="h-10 w-10 text-white hover:bg-white/10"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                <nav className="space-y-2">
                  <button
                    onClick={() => {
                      router.push("/")
                      setSidebarOpen(false)
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
                  >
                    <Home className="h-5 w-5" />
                    <span className="font-medium">Home</span>
                  </button>
                  <button
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-gradient-to-r from-purple-600/20 to-purple-700/20 text-purple-400 font-medium border border-purple-500/30"
                  >
                    <MessageCircle className="h-5 w-5" />
                    <span>Messages</span>
                  </button>
                  <button
                    onClick={() => {
                      router.push("/")
                      setSidebarOpen(false)
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
                  >
                    <Compass className="h-5 w-5" />
                    <span className="font-medium">Discover</span>
                  </button>
                  <button
                    onClick={() => {
                      router.push("/profile")
                      setSidebarOpen(false)
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
                  >
                    <Heart className="h-5 w-5" />
                    <span className="font-medium">Favorites</span>
                  </button>
                  <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-white/10 hover:text-white transition-colors">
                    <Settings className="h-5 w-5" />
                    <span className="font-medium">Settings</span>
                  </button>
                </nav>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}

function renderMessageContent(message: ChatMessage, isOwn: boolean) {
  if (message.message_type === "voice") {
    return (
      <div
        className={`rounded-2xl px-4 py-3 flex items-center gap-3 ${
          isOwn ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-900"
        }`}
      >
        <Button
          size="icon"
          variant="ghost"
          className={`h-8 w-8 rounded-full ${
            isOwn ? "bg-white/20 hover:bg-white/30 text-white" : "bg-slate-800/10 hover:bg-slate-800/20 text-slate-900"
          }`}
        >
          <Play className="h-4 w-4 fill-current" />
        </Button>
        <div className="flex items-center gap-2">
          <div className="flex items-end gap-0.5">
            {[...Array(8)].map((_, index) => (
              <div
                key={index}
                className={`w-0.5 rounded-full ${isOwn ? "bg-white/40" : "bg-slate-400"}`}
                style={{ height: `${Math.random() * 16 + 8}px` }}
              />
            ))}
          </div>
          {message.voice_duration && (
            <span className={`text-xs ${isOwn ? "text-white/70" : "text-slate-500"}`}>
              {Math.round(message.voice_duration)}s
            </span>
          )}
        </div>
      </div>
    )
  }

  if (message.message_type === "image" && message.media_url) {
    return (
      <div className="rounded-2xl overflow-hidden border border-slate-200">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={message.media_url} alt="Attachment" className="max-w-xs rounded-2xl" />
      </div>
    )
  }

  return (
    <div
      className={cn(
        "rounded-2xl px-4 py-3 max-w-full shadow-sm",
        isOwn
          ? "bg-indigo-600 text-white rounded-br-sm"
          : "bg-white text-slate-900 rounded-bl-sm border border-slate-200"
      )}
    >
      <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
    </div>
  )
}

