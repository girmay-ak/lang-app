"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Heart, MessageCircle, UserPlus, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { formatDistanceToNow, isToday, format } from "date-fns"

interface Notification {
  id: string
  notification_type: string
  title: string
  body: string
  data: any
  is_read: boolean
  created_at: string
  related_user?: {
    id: string
    full_name: string
    avatar_url: string | null
  }
}

export function NotificationsView() {
  const [activeFilter, setActiveFilter] = useState<"all" | "likes" | "comments" | "requests">("all")
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchNotifications() {
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

        // Fetch notifications from database
        const { data, error } = await supabase
          .from("notifications")
          .select(`
            id,
            notification_type,
            title,
            body,
            data,
            is_read,
            created_at,
            reference_id
          `)
          .eq("user_id", session.user.id)
          .order("created_at", { ascending: false })
          .limit(50)

        if (error) {
          console.error("[v0] Error fetching notifications:", error)
          setIsLoading(false)
          return
        }

        // Fetch related user data for notifications that have user references
        const notificationsWithUsers = await Promise.all(
          (data || []).map(async (notif) => {
            if (notif.data?.user_id || notif.data?.users) {
              const userIds = notif.data.users || [notif.data.user_id].filter(Boolean)
              if (userIds.length > 0) {
                const { data: users } = await supabase
                  .from("users")
                  .select("id, full_name, avatar_url")
                  .in("id", userIds.slice(0, 3)) // Limit to first 3 users
                
                return {
                  ...notif,
                  related_users: users || [],
                }
              }
            }
            return notif
          })
        )

        setNotifications(notificationsWithUsers as any)
      } catch (error) {
        console.error("[v0] Error loading notifications:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchNotifications()
  }, [])

  const getNotificationType = (type: string): "likes" | "comment" | "follow" => {
    if (type.includes("favorited") || type.includes("likes")) return "likes"
    if (type.includes("reply") || type.includes("comment")) return "comment"
    if (type.includes("friend_request") || type.includes("follow")) return "follow"
    return "likes" // default
  }

  const filteredNotifications = notifications.filter((notif) => {
    if (activeFilter === "all") return true
    const notifType = getNotificationType(notif.notification_type)
    if (activeFilter === "likes") return notifType === "likes"
    if (activeFilter === "comments") return notifType === "comment"
    if (activeFilter === "requests") return notifType === "follow"
    return true
  })

  const todayNotifications = filteredNotifications.filter((n) => isToday(new Date(n.created_at)))
  const olderNotifications = filteredNotifications.filter((n) => !isToday(new Date(n.created_at)))

  const getNotificationIcon = (type: string) => {
    const notifType = getNotificationType(type)
    switch (notifType) {
      case "likes":
        return (
          <div className="absolute -top-0.5 -right-0.5 bg-red-500 rounded-full p-1 border-2 border-slate-900">
            <Heart className="h-2.5 w-2.5 text-white fill-white" />
          </div>
        )
      case "comment":
        return (
          <div className="absolute -top-0.5 -right-0.5 bg-blue-500 rounded-full p-1 border-2 border-slate-900">
            <MessageCircle className="h-2.5 w-2.5 text-white fill-white" />
          </div>
        )
      case "follow":
        return (
          <div className="absolute -top-0.5 -right-0.5 bg-orange-500 rounded-full p-1 border-2 border-slate-900">
            <UserPlus className="h-2.5 w-2.5 text-white" />
          </div>
        )
      default:
        return null
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    if (isToday(date)) {
      return formatDistanceToNow(date, { addSuffix: true })
    }
    return format(date, "d MMM")
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-950">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-white animate-spin mx-auto mb-4" />
          <p className="text-white/60">Loading notifications...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-slate-950">
      <div className="bg-slate-900/50 backdrop-blur-xl border-b border-white/10 px-6 py-4">
        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <ArrowLeft className="h-6 w-6 text-white" />
          </button>
          <h1 className="text-xl font-bold text-white">Notifications</h1>
        </div>
      </div>

      <div className="bg-slate-900/30 backdrop-blur-xl border-b border-white/10 px-6 py-3">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveFilter("all")}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeFilter === "all"
                ? "bg-white/20 text-white backdrop-blur-xl"
                : "bg-transparent text-gray-400 hover:bg-white/10"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveFilter("likes")}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeFilter === "likes"
                ? "bg-white/20 text-white backdrop-blur-xl"
                : "bg-transparent text-gray-400 hover:bg-white/10"
            }`}
          >
            Loves
          </button>
          <button
            onClick={() => setActiveFilter("comments")}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeFilter === "comments"
                ? "bg-white/20 text-white backdrop-blur-xl"
                : "bg-transparent text-gray-400 hover:bg-white/10"
            }`}
          >
            Comments
          </button>
          <button
            onClick={() => setActiveFilter("requests")}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeFilter === "requests"
                ? "bg-white/20 text-white backdrop-blur-xl"
                : "bg-transparent text-gray-400 hover:bg-white/10"
            }`}
          >
            Mutual Requests
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-32">
        {notifications.length === 0 && !isLoading ? (
          <div className="text-center py-12 mt-6">
            <p className="text-white/60">No notifications yet</p>
            <p className="text-white/40 text-sm mt-2">You'll see notifications here when people interact with you!</p>
          </div>
        ) : (
          <>
            {/* Today Section */}
            {todayNotifications.length > 0 && (
          <div className="mt-6">
            <h2 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-3">Today</h2>
            <div className="space-y-2">
              {todayNotifications.map((notification) => {
                const notifType = getNotificationType(notification.notification_type)
                const users = (notification as any).related_users || []
                const userNames = users.map((u: any) => u.full_name).join(", ") || "Someone"
                const userAvatars = users.map((u: any) => u.avatar_url || "/placeholder-user.jpg")
                
                return (
                  <div
                    key={notification.id}
                    className="flex items-start gap-2.5 bg-slate-800/30 backdrop-blur-xl border border-white/10 rounded-xl p-3 hover:bg-slate-800/50 transition-colors"
                  >
                    {/* Post thumbnail or avatar */}
                    <div className="relative flex-shrink-0">
                      {notification.data?.postImage ? (
                        <img
                          src={notification.data.postImage || "/placeholder.svg"}
                          alt="Post"
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      ) : (
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={userAvatars[0] || "/placeholder-user.jpg"} />
                          <AvatarFallback>{userNames[0]}</AvatarFallback>
                        </Avatar>
                      )}
                      {getNotificationIcon(notification.notification_type)}
                    </div>

                    {/* User avatars */}
                    {userAvatars.length > 0 && (
                      <div className="flex -space-x-2 flex-shrink-0 mt-0.5">
                        {userAvatars.slice(0, 3).map((avatar, idx) => (
                          <Avatar key={idx} className="h-7 w-7 border-2 border-slate-900">
                            <AvatarImage src={avatar || "/placeholder-user.jpg"} />
                            <AvatarFallback>{userNames[idx]?.[0]}</AvatarFallback>
                          </Avatar>
                        ))}
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] leading-snug text-white">
                        <span className="font-semibold">{userNames}</span>{" "}
                        <span className="text-gray-400">{notification.body || notification.title}</span>
                      </p>

                      {/* Action buttons for follow notifications */}
                      {notifType === "follow" && (
                        <div className="flex gap-2 mt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-3 text-xs rounded-lg border-white/20 text-gray-300 hover:bg-white/10 bg-transparent"
                          >
                            Discard
                          </Button>
                          <Button
                            size="sm"
                            className="h-7 px-3 text-xs rounded-lg bg-white/20 text-white hover:bg-white/30 backdrop-blur-xl"
                          >
                            Follow Back
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Time */}
                    <span className="text-[11px] text-gray-500 flex-shrink-0">{formatTime(notification.created_at)}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Last 7 Days Section */}
        {olderNotifications.length > 0 && (
          <div className="mt-6">
            <h2 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-3">Last 7 Days</h2>
            <div className="space-y-2">
              {olderNotifications.map((notification) => {
                const users = (notification as any).related_users || []
                const userNames = users.map((u: any) => u.full_name).join(", ") || "Someone"
                const userAvatars = users.map((u: any) => u.avatar_url || "/placeholder-user.jpg")
                
                return (
                  <div
                    key={notification.id}
                    className="flex items-start gap-2.5 bg-slate-800/30 backdrop-blur-xl border border-white/10 rounded-xl p-3 hover:bg-slate-800/50 transition-colors"
                  >
                    {/* Post thumbnail */}
                    <div className="relative flex-shrink-0">
                      {notification.data?.postImage ? (
                        <img
                          src={notification.data.postImage || "/placeholder.svg"}
                          alt="Post"
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      ) : (
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={userAvatars[0] || "/placeholder-user.jpg"} />
                          <AvatarFallback>{userNames[0]}</AvatarFallback>
                        </Avatar>
                      )}
                      {getNotificationIcon(notification.notification_type)}
                    </div>

                    {/* User avatars */}
                    {userAvatars.length > 0 && (
                      <div className="flex -space-x-2 flex-shrink-0 mt-0.5">
                        {userAvatars.slice(0, 3).map((avatar, idx) => (
                          <Avatar key={idx} className="h-7 w-7 border-2 border-slate-900">
                            <AvatarImage src={avatar || "/placeholder-user.jpg"} />
                            <AvatarFallback>{userNames[idx]?.[0]}</AvatarFallback>
                          </Avatar>
                        ))}
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] leading-snug text-white">
                        <span className="font-semibold">{userNames}</span>{" "}
                        <span className="text-gray-400">{notification.body || notification.title}</span>
                      </p>
                    </div>

                    {/* Time */}
                    <span className="text-[11px] text-gray-500 flex-shrink-0">{formatTime(notification.created_at)}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
          </>
        )}
      </div>
    </div>
  )
}
