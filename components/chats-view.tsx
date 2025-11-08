"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, Loader2 } from "lucide-react"
import { ChatConversation } from "./chat-conversation"
import { createClient } from "@/lib/supabase/client"
import { formatDistanceToNow } from "date-fns"

interface Chat {
  id: string
  name: string
  avatar: string
  lastMessage: string
  timeAgo: string
  online: boolean
  unread?: boolean
  isGroup?: boolean
  badges?: { label: string; variant: "default" | "secondary" | "destructive" }[]
}

interface Conversation {
  id: string
  user1_id: string
  user2_id: string
  last_message: string | null
  last_message_at: string | null
  user1_unread_count: number
  user2_unread_count: number
  other_user: {
    id: string
    full_name: string
    avatar_url: string | null
    is_online: boolean
  }
}

interface ChatsViewProps {
  onChatOpenChange?: (isOpen: boolean) => void
}

export function ChatsView({ onChatOpenChange }: ChatsViewProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null)
  const [chats, setChats] = useState<Chat[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [requests, setRequests] = useState<Array<{ id: string; avatar: string }>>([])

  useEffect(() => {
    async function fetchChats() {
      try {
        setIsLoading(true)
        const supabase = createClient()
        
        const {
          data: { session },
        } = await supabase.auth.getSession()
        
        if (!session) {
          setIsLoading(false)
          return
        }

        const userId = session.user.id

        // Fetch conversations where user is participant
        const { data: conversations, error } = await supabase
          .from("conversations")
          .select(`
            id,
            user1_id,
            user2_id,
            last_message,
            last_message_at,
            user1_unread_count,
            user2_unread_count,
            user1:users!conversations_user1_id_fkey(id, full_name, avatar_url, is_online),
            user2:users!conversations_user2_id_fkey(id, full_name, avatar_url, is_online)
          `)
          .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
          .order("last_message_at", { ascending: false, nullsLast: true })

        if (error) {
          // Supabase errors need to be parsed from JSON string
          let errorData: any = {}
          try {
            const errorJson = JSON.stringify(error, null, 2)
            errorData = JSON.parse(errorJson)
            console.error("[v0] Error fetching conversations:", {
              message: errorData.message || "Unknown error",
              code: errorData.code || "unknown",
              details: errorData.details || null,
              hint: errorData.hint || null,
            })
          } catch (e) {
            // Fallback if stringify/parse fails
            console.error("[v0] Error fetching conversations:", error)
          }
          setIsLoading(false)
          return
        }

        // Format conversations into chat list
        const formattedChats: Chat[] = (conversations || []).map((conv: any) => {
          const otherUserId = conv.user1_id === userId ? conv.user2_id : conv.user1_id
          const otherUser = conv.user1_id === userId ? conv.user2 : conv.user1
          const unreadCount = conv.user1_id === userId ? conv.user1_unread_count : conv.user2_unread_count
          
          return {
            id: conv.id,
            name: otherUser?.full_name || "Unknown User",
            avatar: otherUser?.avatar_url || "/placeholder-user.jpg",
            lastMessage: conv.last_message || "No messages yet",
            timeAgo: conv.last_message_at 
              ? formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true })
              : "Never",
            online: otherUser?.is_online || false,
            unread: unreadCount > 0,
          }
        })

        setChats(formattedChats)

        // Fetch friend requests (placeholder - you can implement this based on your schema)
        // For now, using empty array
        setRequests([])
      } catch (error) {
        console.error("[v0] Error loading chats:", {
          message: error instanceof Error ? error.message : String(error),
          error: error instanceof Error ? error.stack : JSON.stringify(error, Object.getOwnPropertyNames(error))
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchChats()
  }, [])

  const handleChatSelect = (chat: Chat) => {
    setSelectedChat(chat)
    onChatOpenChange?.(true)
  }

  const handleChatBack = () => {
    setSelectedChat(null)
    onChatOpenChange?.(false)
  }

  if (selectedChat) {
    return <ChatConversation chat={selectedChat} onBack={handleChatBack} />
  }

  if (isLoading) {
    return (
      <div className="h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-white animate-spin mx-auto mb-4" />
          <p className="text-white/60">Loading chats...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 p-6 pb-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-white">Chats</h1>
          <div className="flex items-center gap-2">
            <span className="text-sm text-white/60">Requests</span>
            <div className="flex items-center">
              {requests.length > 0 ? (
                <>
                  {requests.slice(0, 3).map((request, idx) => (
                    <Avatar
                      key={request.id}
                      className="h-8 w-8 border-2 border-slate-900"
                      style={{ marginLeft: idx > 0 ? "-8px" : "0" }}
                    >
                      <AvatarImage src={request.avatar || "/placeholder.svg"} />
                      <AvatarFallback>U</AvatarFallback>
                    </Avatar>
                  ))}
                  {requests.length > 3 && (
                    <div className="h-8 w-8 rounded-full bg-green-500 border-2 border-slate-900 flex items-center justify-center text-xs font-semibold text-white -ml-2">
                      +{requests.length - 3}
                    </div>
                  )}
                </>
              ) : null}
            </div>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/50" />
          <Input
            type="search"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/10 border-white/20 text-white placeholder:text-white/50 rounded-2xl pl-10"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto px-6 space-y-3 pb-32">
        {chats.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-white/60">No conversations yet</p>
            <p className="text-white/40 text-sm mt-2">Start a conversation from the map or feed!</p>
          </div>
        ) : (
          chats
            .filter((chat) => 
              chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .map((chat) => (
          <Card
            key={chat.id}
            className="bg-slate-800/50 backdrop-blur-xl border-white/10 p-4 rounded-3xl hover:bg-slate-800/70 transition-all cursor-pointer"
            onClick={() => handleChatSelect(chat)}
          >
            <div className="flex items-start gap-3">
              <div className="relative flex-shrink-0">
                <Avatar className="h-14 w-14 border-2 border-white/20">
                  <AvatarImage src={chat.avatar || "/placeholder.svg"} alt={chat.name} />
                  <AvatarFallback>{chat.name[0]}</AvatarFallback>
                </Avatar>
                {chat.online && (
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-slate-800" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-white truncate">{chat.name}</h3>
                  <span className="text-xs text-white/50 flex-shrink-0 ml-2">{chat.timeAgo}</span>
                </div>

                <p className="text-sm text-white/60 truncate mb-2">{chat.lastMessage}</p>

                {chat.badges && (
                  <div className="flex flex-wrap gap-2">
                    {chat.badges.map((badge, idx) => (
                      <Badge
                        key={idx}
                        className={
                          badge.variant === "default"
                            ? "bg-yellow-500 text-yellow-900 hover:bg-yellow-600"
                            : badge.variant === "secondary"
                              ? "bg-orange-500 text-orange-900 hover:bg-orange-600"
                              : "bg-red-500 text-red-900 hover:bg-red-600"
                        }
                      >
                        {badge.label}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))
        )}
      </div>
    </div>
  )
}
