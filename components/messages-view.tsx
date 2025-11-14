"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  Compass,
  Filter,
  Heart,
  Home,
  MapPin,
  MessageCircle,
  Menu,
  Mic,
  MoreVertical,
  Paperclip,
  Phone,
  Play,
  Settings,
  Star,
  Video,
  X,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { chatService, type ChatMessage, type ConversationSummary } from "@/lib/services/chat-service"
import { useIsMobile } from "@/hooks/use-mobile"

type Section = "home" | "messages" | "explore" | "favorites" | "settings"

const SIDEBAR_ITEMS: Array<{ id: Section; icon: typeof Home; label: string }> = [
  { id: "home", icon: Home, label: "Home" },
  { id: "messages", icon: MessageCircle, label: "Messages" },
  { id: "explore", icon: Compass, label: "Explore" },
  { id: "favorites", icon: Heart, label: "Favorites" },
  { id: "settings", icon: Settings, label: "Settings" },
]

const ACTIVITY_ITEMS = [
  {
    id: "activity-anna",
    name: "Anna · DE ⇄ NL",
    message: "Shared a Dutch pronunciation workshop",
    time: "12m ago",
    sentiment: "positive",
  },
  {
    id: "activity-carlos",
    name: "Carlos · EN ⇄ ES",
    message: "Invited you for coffee later today",
    time: "2m ago",
    sentiment: "warm",
  },
  {
    id: "activity-yuki",
    name: "Yuki · EN ⇄ JP",
    message: "Sent a new vocabulary list",
    time: "1h ago",
    sentiment: "informative",
  },
  {
    id: "activity-dmitri",
    name: "Dmitri · RU ⇄ EN",
    message: "Scheduled a pronunciation session",
    time: "3h ago",
    sentiment: "scheduled",
  },
] as const

const DISCOVER_TAGS = ["Nearby", "Advanced", "Casual", "Business", "Grammar focus", "Pronunciation"] as const

const DISCOVER_RESULTS = [
  {
    id: "discover-emma",
    name: "Emma Johansson",
    languages: "SV ⇄ EN",
    location: "Stockholm · GMT+1",
    availability: "Weeknights",
    compatibility: 92,
  },
  {
    id: "discover-luca",
    name: "Luca Marino",
    languages: "IT ⇄ EN",
    location: "Milan · GMT+1",
    availability: "Flexible",
    compatibility: 88,
  },
  {
    id: "discover-sora",
    name: "Sora Kim",
    languages: "KO ⇄ EN",
    location: "Seoul · GMT+9",
    availability: "Mornings",
    compatibility: 84,
  },
] as const

const FAVORITE_PARTNERS = [
  {
    id: "favorite-sophie",
    name: "Sophie Dubois",
    languages: ["FR native", "EN intermediate"],
    bio: "Paris-based designer, practicing business English ahead of her NY pitch.",
    streak: 16,
    availability: "Weekdays · 19:00–21:00",
  },
  {
    id: "favorite-kiara",
    name: "Kiara Singh",
    languages: ["EN native", "HI conversational", "ES beginner"],
    bio: "Organises community language meetups in Barcelona. Loves cooking exchanges.",
    streak: 9,
    availability: "Weekend mornings",
  },
  {
    id: "favorite-joao",
    name: "João Pereira",
    languages: ["PT native", "EN fluent"],
    bio: "Preparing for his Cambridge proficiency exam. Guitar enthusiast.",
    streak: 21,
    availability: "Weekdays · 07:00–09:00",
  },
] as const

const SETTINGS_SECTIONS = [
  {
    id: "profile",
    title: "Profile",
    description: "Update your photo, display name, languages, and time zone.",
  },
  {
    id: "privacy",
    title: "Privacy",
    description: "Adjust visibility, contact preferences, and discovery controls.",
  },
  {
    id: "notifications",
    title: "Notifications",
    description: "Choose which alerts you want by push, email, or in-app.",
  },
  {
    id: "billing",
    title: "Billing",
    description: "Manage premium features, invoices, and payment methods.",
  },
] as const

const TRANSITION_MS = 240

export function MessagesView() {
  const sidebarRef = useRef<HTMLDivElement>(null)
  const channelListRef = useRef<HTMLDivElement>(null)
  const messageScrollRef = useRef<HTMLDivElement>(null)

  const isMobile = useIsMobile()

  const [activeSection, setActiveSection] = useState<Section>("messages")
  const [channelListOpen, setChannelListOpen] = useState(true)

  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [conversationsLoading, setConversationsLoading] = useState(true)
  const [conversationSearch, setConversationSearch] = useState("")
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [messageInput, setMessageInput] = useState("")
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  const [activeDiscoverId, setActiveDiscoverId] = useState<string | null>(DISCOVER_RESULTS[0]?.id ?? null)
  const [activeFavoriteId, setActiveFavoriteId] = useState<string | null>(FAVORITE_PARTNERS[0]?.id ?? null)
  const [activeSettingsTab, setActiveSettingsTab] = useState<string | null>(SETTINGS_SECTIONS[0]?.id ?? null)
  const [exploreView, setExploreView] = useState<"map" | "list">("map")

  useEffect(() => {
    setChannelListOpen(!isMobile)
  }, [isMobile])

  useEffect(() => {
    if (!isMobile) return
    document.body.style.overflow = channelListOpen ? "hidden" : ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [channelListOpen, isMobile])

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
      } catch (error) {
        console.error("[MessagesView] failed to load conversations", error)
      } finally {
        if (isMounted) {
          setConversationsLoading(false)
        }
      }
    }

    bootstrap().catch((error) => {
      console.error("[MessagesView] bootstrap error", error)
      setConversationsLoading(false)
    })

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (!channelListOpen || isMobile) return

    const handleClick = (event: MouseEvent) => {
      if (!channelListOpen) return
      const target = event.target as Node
      if (channelListRef.current?.contains(target)) return
      if (sidebarRef.current?.contains(target)) return
      setChannelListOpen(false)
    }

    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [channelListOpen, isMobile])

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
    if (!activeConversationId) {
      setMessages([])
      return
    }

    let isMounted = true
    setMessagesLoading(true)

    const loadMessages = async () => {
      try {
        const initialMessages = await chatService.getMessages(activeConversationId)
        if (!isMounted) return
        setMessages(initialMessages)
        setMessagesLoading(false)
      } catch (error) {
        console.error("[MessagesView] failed to load messages", error)
        if (isMounted) {
          setMessages([])
          setMessagesLoading(false)
        }
      }
    }

    loadMessages().catch((error) => {
      console.error("[MessagesView] loadMessages error", error)
      setMessagesLoading(false)
    })

    const unsubscribe = chatService.subscribeToMessages(activeConversationId, (message) => {
      setMessages((prev) => {
        if (prev.some((existing) => existing.id === message.id)) return prev
        return [...prev, message]
      })
    })

    chatService.markConversationRead(activeConversationId).catch((error) => {
      console.warn("[MessagesView] markConversationRead failed", error)
    })

    return () => {
      isMounted = false
      unsubscribe?.()
    }
  }, [activeConversationId])

  useEffect(() => {
    if (!messageScrollRef.current) return
    messageScrollRef.current.scrollTop = messageScrollRef.current.scrollHeight
  }, [messages, messagesLoading])

  const activeSectionLabel = useMemo(
    () => SIDEBAR_ITEMS.find((item) => item.id === activeSection)?.label ?? "Menu",
    [activeSection],
  )

  const filteredConversations = useMemo(() => {
    if (!conversationSearch.trim()) return conversations
    const query = conversationSearch.trim().toLowerCase()
    return conversations.filter((conversation) => {
      return (
        conversation.name.toLowerCase().includes(query) ||
        conversation.lastMessage?.toLowerCase().includes(query) ||
        conversation.conversationId.toLowerCase().includes(query)
      )
    })
  }, [conversationSearch, conversations])

  const selectedConversation =
    conversations.find((conversation) => conversation.conversationId === activeConversationId) ?? null

  const activeFavorite = FAVORITE_PARTNERS.find((partner) => partner.id === activeFavoriteId) ?? null
  const activeSettingsSection = SETTINGS_SECTIONS.find((section) => section.id === activeSettingsTab) ?? null

  const handleSectionClick = (section: Section) => {
    if (section === activeSection) {
      setChannelListOpen((open) => !open)
      return
    }

    setActiveSection(section)
    if (isMobile) {
      setChannelListOpen(section === "messages")
    } else {
      setChannelListOpen(true)
    }
  }

  const handleSelectConversation = (conversationId: string) => {
    setActiveConversationId(conversationId)
    chatService.markConversationRead(conversationId).catch((error) => {
      console.warn("[MessagesView] markConversationRead failed", error)
    })
    if (isMobile) {
      setChannelListOpen(false)
    }
  }

  const handleSendMessage = async () => {
    if (!activeConversationId || !messageInput.trim()) return

    try {
      const trimmed = messageInput.trim()
      setMessageInput("")
      const newMessage = await chatService.sendMessage(activeConversationId, trimmed)
      setMessages((prev) => [...prev, newMessage])
      chatService.markConversationRead(activeConversationId).catch(() => {})
      const summaries = await chatService.getConversationSummaries()
      setConversations(summaries)
    } catch (error) {
      console.error("[MessagesView] sendMessage error", error)
    }
  }

  const renderMobileNavigation = () => (
    <div className="border-b border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between px-4 py-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setChannelListOpen(true)}
          className="h-11 w-11 rounded-xl text-slate-600 hover:bg-slate-100"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <span className="text-sm font-semibold text-slate-900">{activeSectionLabel}</span>
        <div className="h-11 w-11" />
      </div>
      <div className="flex items-center gap-2 overflow-x-auto px-4 pb-3">
        {SIDEBAR_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = item.id === activeSection
          return (
            <Button
              key={item.id}
              variant={isActive ? "default" : "ghost"}
              size="sm"
              onClick={() => handleSectionClick(item.id)}
              className={`flex items-center gap-2 rounded-full px-4 py-2 ${
                isActive ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="text-xs font-semibold">{item.label}</span>
            </Button>
          )
        })}
      </div>
    </div>
  )

  const renderMessageContent = (message: ChatMessage, isOwn: boolean) => {
    if (message.message_type === "voice") {
      return (
        <div
          className={`flex items-center gap-3 rounded-3xl px-4 py-3 shadow ${
            isOwn ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-900"
          }`}
        >
          <Button
            size="icon"
            variant="ghost"
            className={`h-9 w-9 rounded-full ${isOwn ? "bg-white/20 text-white" : "bg-slate-900/10 text-slate-900"}`}
          >
            <Play className="h-4 w-4" />
          </Button>
          <div className="flex items-end gap-0.5">
            {[...Array(16)].map((_, index) => (
              <span
                // eslint-disable-next-line react/no-array-index-key
                key={index}
                className={`w-0.5 rounded-full ${isOwn ? "bg-white/60" : "bg-slate-400"}`}
                style={{ height: `${Math.random() * 18 + 8}px` }}
              />
            ))}
          </div>
          {message.voice_duration ? (
            <span className="text-xs opacity-80">{Math.round(message.voice_duration)}s</span>
          ) : null}
        </div>
      )
    }

    if (message.message_type === "image" && message.media_url) {
      return (
        <div className="overflow-hidden rounded-3xl border border-slate-200 shadow">
          <img src={message.media_url} alt="Shared attachment" className="max-h-72 max-w-xs object-cover" />
        </div>
      )
    }

    return (
      <div
        className={`rounded-3xl px-5 py-3 text-sm leading-relaxed shadow ${
          isOwn ? "bg-slate-900 text-white rounded-br-lg" : "bg-white text-slate-900 rounded-bl-lg border border-slate-100"
        }`}
      >
        {message.content}
      </div>
    )
  }

  const renderMessagesMain = () => {
    if (!selectedConversation) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-4 bg-slate-900/5 text-center text-slate-500">
          <MessageCircle className="h-14 w-14 text-slate-400" />
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-slate-700">Select a conversation</h3>
            <p className="text-sm text-slate-500">Pick a chat from the channel list to view the full thread.</p>
          </div>
        </div>
      )
    }

    const { name, avatar, online } = selectedConversation

    return (
      <div className="flex h-full flex-col bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="h-12 w-12">
                <AvatarImage src={avatar ?? "/placeholder-user.jpg"} alt={name} />
                <AvatarFallback>{name.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              {online && <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border border-white bg-emerald-500" />}
            </div>
            <div>
              <p className="text-base font-semibold text-slate-900">{name}</p>
              <span className="text-xs text-slate-500">{online ? "Online now" : "Offline"}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full text-slate-500 hover:bg-slate-100">
              <Phone className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full text-slate-500 hover:bg-slate-100">
              <Video className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full text-slate-500 hover:bg-slate-100">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div ref={messageScrollRef} className="flex-1 overflow-y-auto bg-slate-50 px-6 py-6">
          {messagesLoading ? (
            <div className="flex h-full items-center justify-center text-sm text-slate-500">Loading messages…</div>
          ) : messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-slate-400">
              <p>No messages yet</p>
              <span className="text-xs">Say hello to start the conversation.</span>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((message) => {
                const isOwn = message.sender_id === currentUserId
                const timeLabel = new Date(message.created_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })

                return (
                  <div key={message.id} className={`flex items-end gap-3 ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
                    {!isOwn && (
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={avatar ?? "/placeholder-user.jpg"} alt={name} />
                        <AvatarFallback>{name.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                    )}
                    <div className={`max-w-[70%] space-y-2 ${isOwn ? "text-right" : "text-left"}`}>
                      {renderMessageContent(message, isOwn)}
                      <p className="px-1 text-xs text-slate-400">{timeLabel}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="border-t border-slate-200 bg-white px-6 py-4">
          <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-4 py-2">
            <Button size="icon" variant="ghost" className="h-10 w-10 rounded-full text-slate-500 hover:bg-slate-200">
              <Paperclip className="h-4 w-4" />
            </Button>
            <Input
              value={messageInput}
              onChange={(event) => setMessageInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault()
                  handleSendMessage().catch(() => {})
                }
              }}
              placeholder="Enter your message"
              className="flex-1 border-0 bg-transparent text-slate-700 placeholder:text-slate-400 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            <Button
              size="icon"
              variant="ghost"
              onClick={() => handleSendMessage().catch(() => {})}
              disabled={!messageInput.trim()}
              className="h-10 w-10 rounded-full text-slate-500 hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Mic className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const renderHomeMain = () => (
    <div className="flex h-full flex-col gap-6 bg-white p-8">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Today’s Overview</h2>
        <p className="text-sm text-slate-500">Track activity, streaks, and upcoming exchanges.</p>
      </div>
      <div className="grid flex-1 grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="rounded-3xl border-slate-100 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 text-white shadow-xl">
          <p className="text-sm uppercase tracking-[0.3em] text-white/60">Streak</p>
          <h3 className="mt-3 text-4xl font-semibold">12 days</h3>
          <p className="mt-4 text-sm text-white/70">Keep up your pronunciation practice to hit your goal streak.</p>
        </Card>
        <Card className="rounded-3xl border-slate-100 bg-white p-6 shadow-lg shadow-slate-200/40">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-700">Upcoming Sessions</span>
            <Badge variant="secondary">3 this week</Badge>
          </div>
          <div className="mt-4 space-y-4 text-sm text-slate-600">
            <div className="rounded-2xl border border-slate-100 p-3">
              <p className="font-medium text-slate-800">Thursday · 19:00 CET</p>
              <span className="text-xs text-slate-500">Yuki · Vocabulary exchange</span>
            </div>
            <div className="rounded-2xl border border-slate-100 p-3">
              <p className="font-medium text-slate-800">Saturday · 10:30 CET</p>
              <span className="text-xs text-slate-500">Carlos · Café meetup</span>
            </div>
          </div>
        </Card>
        <Card className="rounded-3xl border-slate-100 bg-white p-6 shadow-lg shadow-slate-200/40">
          <h3 className="text-sm font-semibold text-slate-700">Weekly Highlights</h3>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <p>• 4 new practice notes received</p>
            <p>• 2 pronunciation clips shared</p>
            <p>• 93% response rate this week</p>
          </div>
        </Card>
      </div>
    </div>
  )

  const renderExploreMain = () => (
    <div className="flex h-full flex-col gap-6 bg-white p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Discover partners</h2>
          <p className="text-sm text-slate-500">Switch between the interactive map and list to explore matches.</p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 p-1">
          <Button
            variant={exploreView === "map" ? "default" : "ghost"}
            size="sm"
            className={`rounded-full px-4 ${exploreView === "map" ? "" : "text-slate-600"}`}
            onClick={() => setExploreView("map")}
          >
            Map view
          </Button>
          <Button
            variant={exploreView === "list" ? "default" : "ghost"}
            size="sm"
            className={`rounded-full px-4 ${exploreView === "list" ? "" : "text-slate-600"}`}
            onClick={() => setExploreView("list")}
          >
            List view
          </Button>
        </div>
      </div>

      {exploreView === "map" ? (
        <div className="relative flex flex-1 items-center justify-center overflow-hidden rounded-3xl border border-slate-100 bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 shadow-xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(147,197,253,0.35),transparent_65%)]" />
          <div className="relative flex flex-col items-center text-center text-white">
            <MapPin className="mb-4 h-14 w-14 text-blue-200" />
            <h3 className="text-2xl font-semibold">Interactive map</h3>
            <p className="mt-2 max-w-sm text-sm text-blue-100">
              Zoom and pan to find partners near Den Haag. Filters update the markers in real time.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-2">
          {DISCOVER_RESULTS.map((result) => (
            <Card
              key={result.id}
              className={`rounded-3xl border ${result.id === activeDiscoverId ? "border-indigo-500 shadow-lg" : "border-slate-100"} p-5 transition`}
              onClick={() => setActiveDiscoverId(result.id)}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-slate-900">{result.name}</p>
                  <span className="text-sm text-slate-500">{result.languages}</span>
                </div>
                <Badge className="rounded-full bg-indigo-100 text-indigo-700">
                  {result.compatibility}% match
                </Badge>
              </div>
              <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
                <MapPin className="h-4 w-4" />
                {result.location}
              </div>
              <p className="mt-2 text-sm text-slate-500">Availability: {result.availability}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  )

  const renderFavoritesMain = () => {
    if (!activeFavorite) {
      return (
        <div className="flex h-full items-center justify-center bg-white text-sm text-slate-500">
          Select a saved partner to view their profile highlights.
        </div>
      )
    }

    return (
      <div className="flex h-full flex-col gap-6 bg-white p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">{activeFavorite.name}</h2>
            <p className="text-sm text-slate-500">Saved partner overview and quick actions.</p>
          </div>
          <Badge className="rounded-full bg-emerald-100 text-emerald-700">Streak · {activeFavorite.streak} days</Badge>
        </div>
        <Card className="rounded-3xl border-slate-100 bg-white p-6 shadow-lg shadow-slate-200/40">
          <h3 className="text-sm font-semibold text-slate-700">Languages</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {activeFavorite.languages.map((language) => (
              <Badge key={language} className="rounded-full bg-slate-900 text-white">
                {language}
              </Badge>
            ))}
          </div>
          <Separator className="my-6" />
          <p className="text-sm leading-relaxed text-slate-600">{activeFavorite.bio}</p>
          <Separator className="my-6" />
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Star className="h-4 w-4 text-amber-500" />
            Preferred time: {activeFavorite.availability}
          </div>
        </Card>
      </div>
    )
  }

  const renderSettingsMain = () => {
    if (!activeSettingsSection) {
      return (
        <div className="flex h-full items-center justify-center bg-white text-sm text-slate-500">
          Choose a settings tab from the channel list.
        </div>
      )
    }

    return (
      <div className="flex h-full flex-col gap-6 bg-white p-8">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">{activeSettingsSection.title}</h2>
          <p className="text-sm text-slate-500">{activeSettingsSection.description}</p>
        </div>
        <Card className="flex-1 rounded-3xl border-slate-100 bg-white p-6 shadow-lg shadow-slate-200/40">
          <div className="space-y-4 text-sm text-slate-600">
            <p>Settings controls will appear here. Break them into sections aligned with Teams-like tabs.</p>
            <p className="text-xs text-slate-400">
              This placeholder keeps the layout consistent while backend wiring is completed.
            </p>
          </div>
        </Card>
      </div>
    )
  }

  const renderMainContent = () => {
    switch (activeSection) {
      case "home":
        return renderHomeMain()
      case "messages":
        return renderMessagesMain()
      case "explore":
        return renderExploreMain()
      case "favorites":
        return renderFavoritesMain()
      case "settings":
        return renderSettingsMain()
      default:
        return null
    }
  }

  const renderChannelListContent = () => {
    switch (activeSection) {
      case "home":
        return (
          <div className="flex h-full flex-col">
            <div className="px-6 pt-6">
              <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Activity</h3>
              <p className="mt-2 text-base font-semibold text-slate-900">Latest timeline</p>
            </div>
            <div className="mt-4 flex-1 space-y-3 overflow-y-auto px-6 pb-8">
              {ACTIVITY_ITEMS.map((item) => (
                <Card key={item.id} className="rounded-3xl border border-slate-100 p-4 shadow-sm transition hover:border-slate-200 hover:shadow-md">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{item.name}</p>
                      <p className="text-sm text-slate-600">{item.message}</p>
                    </div>
                    <Badge variant="secondary" className="rounded-full">
                      {item.time}
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )
      case "messages":
        return (
          <div className="flex h-full flex-col">
            <div className="px-6 pt-6">
              <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Messages</h3>
              <p className="mt-2 text-base font-semibold text-slate-900">Conversation list</p>
              <div className="mt-4 flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2">
                <Filter className="h-4 w-4 text-slate-400" />
                <Input
                  value={conversationSearch}
                  onChange={(event) => setConversationSearch(event.target.value)}
                  placeholder="Search conversations"
                  className="border-0 px-0 text-sm text-slate-700 placeholder:text-slate-400 focus-visible:ring-0"
                />
              </div>
            </div>
            <div className="mt-4 flex-1 space-y-2 overflow-y-auto px-4 pb-8">
              {conversationsLoading ? (
                <div className="flex h-full items-center justify-center text-sm text-slate-500">Loading conversations…</div>
              ) : filteredConversations.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-slate-500">No conversations match your search.</div>
              ) : (
                filteredConversations.map((conversation) => {
                  const isActive = conversation.conversationId === activeConversationId
                  return (
                    <button
                      key={conversation.conversationId}
                      type="button"
                      onClick={() => handleSelectConversation(conversation.conversationId)}
                      className={`flex w-full items-center gap-3 rounded-3xl border px-4 py-3 text-left transition ${
                        isActive ? "border-indigo-500 bg-indigo-50" : "border-transparent bg-white hover:border-slate-200"
                      }`}
                    >
                      <div className="relative">
                        <Avatar className="h-11 w-11">
                          <AvatarImage src={conversation.avatar ?? "/placeholder-user.jpg"} alt={conversation.name} />
                          <AvatarFallback>{conversation.name.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        {conversation.online && (
                          <span className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full border border-white bg-emerald-500" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <p className="truncate text-sm font-semibold text-slate-900">{conversation.name}</p>
                          <span className="text-xs text-slate-400">
                            {conversation.lastMessageAt
                              ? new Date(conversation.lastMessageAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                              : ""}
                          </span>
                        </div>
                        <p className="truncate text-xs text-slate-500">{conversation.lastMessage || "Say hello to start chatting."}</p>
                      </div>
                      {conversation.unreadCount > 0 && (
                        <Badge className="rounded-full bg-blue-500 text-white">{conversation.unreadCount}</Badge>
                      )}
                    </button>
                  )
                })
              )}
            </div>
          </div>
        )
      case "explore":
        return (
          <div className="flex h-full flex-col">
            <div className="px-6 pt-6">
              <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Filters</h3>
              <p className="mt-2 text-base font-semibold text-slate-900">Refine discovery</p>
            </div>
            <div className="mt-4 grid gap-4 px-6">
              <div className="flex flex-wrap gap-2">
                {DISCOVER_TAGS.map((tag) => (
                  <Badge key={tag} className="rounded-full bg-slate-900 text-white">
                    {tag}
                  </Badge>
                ))}
              </div>
              <Separator />
              <div className="space-y-3">
                {DISCOVER_RESULTS.map((result) => (
                  <Card
                    key={result.id}
                    className={`rounded-3xl border ${result.id === activeDiscoverId ? "border-indigo-500" : "border-slate-100"} p-4`}
                    onClick={() => setActiveDiscoverId(result.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{result.name}</p>
                        <span className="text-xs text-slate-500">{result.languages}</span>
                      </div>
                      <Badge variant="secondary">{result.compatibility}%</Badge>
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                      <MapPin className="h-3 w-3" />
                      {result.location}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )
      case "favorites":
        return (
          <div className="flex h-full flex-col">
            <div className="px-6 pt-6">
              <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Saved</h3>
              <p className="mt-2 text-base font-semibold text-slate-900">Favourite partners</p>
            </div>
            <div className="mt-4 flex-1 space-y-3 overflow-y-auto px-6 pb-8">
              {FAVORITE_PARTNERS.map((partner) => (
                <Card
                  key={partner.id}
                  className={`rounded-3xl border ${partner.id === activeFavoriteId ? "border-rose-400 bg-rose-50" : "border-slate-100"} p-4 transition`}
                  onClick={() => setActiveFavoriteId(partner.id)}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{partner.name}</p>
                      <span className="text-xs text-slate-500">{partner.languages.join(" · ")}</span>
                    </div>
                    <Badge className="rounded-full bg-rose-500 text-white">{partner.streak}d</Badge>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )
      case "settings":
        return (
          <div className="flex h-full flex-col">
            <div className="px-6 pt-6">
              <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Settings</h3>
              <p className="mt-2 text-base font-semibold text-slate-900">Manage account</p>
            </div>
            <div className="mt-4 flex-1 space-y-2 overflow-y-auto px-6 pb-8">
              {SETTINGS_SECTIONS.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setActiveSettingsTab(section.id)}
                  className={`w-full rounded-3xl border px-4 py-3 text-left transition ${
                    section.id === activeSettingsTab ? "border-slate-900 bg-slate-900 text-white" : "border-transparent bg-white hover:border-slate-200"
                  }`}
                >
                  <p className="text-sm font-semibold">{section.title}</p>
                  <span className="text-xs opacity-80">{section.description}</span>
                </button>
              ))}
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="flex h-full min-h-screen bg-slate-950/5">
      <aside
        ref={sidebarRef}
        className="flex w-20 flex-shrink-0 flex-col items-center gap-4 border-r border-slate-200/60 bg-white py-6 shadow-sm"
      >
        {SIDEBAR_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = item.id === activeSection && channelListOpen
          const isHighlighted = item.id === activeSection && !channelListOpen
          return (
            <Button
              key={item.id}
              variant="ghost"
              size="icon"
              onClick={() => handleSectionClick(item.id)}
              className={`h-12 w-12 rounded-2xl transition-all ${
                isActive
                  ? "bg-slate-900 text-white shadow-lg"
                  : isHighlighted
                    ? "bg-slate-200 text-slate-900"
                    : "text-slate-500 hover:bg-slate-100"
              }`}
            >
              <Icon className="h-5 w-5" />
            </Button>
          )
        })}
      </aside>

      <div className="flex flex-1 overflow-hidden">
        <div
          ref={channelListRef}
          style={{
            width: channelListOpen ? 320 : 0,
            transition: `width ${TRANSITION_MS}ms ease`,
          }}
          className="relative flex-shrink-0 overflow-hidden border-r border-slate-200/60 bg-slate-50"
        >
          <div
            className="absolute inset-0 flex flex-col"
            style={{
              opacity: channelListOpen ? 1 : 0,
              transition: `opacity ${TRANSITION_MS}ms ease`,
              pointerEvents: channelListOpen ? "auto" : "none",
            }}
          >
            {renderChannelListContent()}
          </div>
        </div>

        <main
          className="flex-1 overflow-hidden"
          style={{
            transition: `margin ${TRANSITION_MS}ms ease`,
          }}
        >
          {renderMainContent()}
        </main>
      </div>
    </div>
  )
}
