"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Search, Home, MapPin, MessageCircle, Clock, Flag, Settings, Bell, ChevronDown } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { MapboxMap } from "./mapbox-map"

interface ExploreLayoutProps {
  userName?: string
  userAvatar?: string
  unreadNotificationCount?: number
  onTabChange?: (tab: "home" | "map" | "chats" | "events" | "flag" | "settings") => void
  activeTab?: "home" | "map" | "chats" | "events" | "flag" | "settings"
  mapComponent?: React.ReactNode
}

interface Group {
  id: string
  name: string
  flag: string
}

interface Partner {
  id: string
  name: string
  avatar?: string
  initials: string
  lastActive?: string
  isOnline: boolean
  gradient: string
}

interface ChatMessage {
  id: string
  name: string
  initials: string
  language: string
  message: string
  timeAgo: string
  gradient: string
}

interface MapStory {
  id: string
  name: string
  initials: string
  isOnline: boolean
  gradient: string
}

interface MapMarker {
  id: string
  name: string
  initials: string
  matchScore: number
  top: string
  left: string
  gradient: string
  isActive?: boolean
}

interface EventCard {
  id: string
  date: string
  title: string
  location: string
  time: string
  participants: number
  gradient: string
}

const GROUPS: Group[] = [
  { id: "1", name: "Spanish Learners", flag: "🇪🇸" },
  { id: "2", name: "Dutch Practice", flag: "🇳🇱" },
]

const PARTNERS: Partner[] = [
  {
    id: "1",
    name: "Elena Peña",
    initials: "E",
    lastActive: "11 min",
    isOnline: true,
    gradient: "from-[#f093fb] to-[#f5576c]",
  },
  {
    id: "2",
    name: "Lucas Meyer",
    initials: "L",
    isOnline: true,
    gradient: "from-[#4facfe] to-[#00f2fe]",
  },
  {
    id: "3",
    name: "Brooklyn Simmons",
    initials: "B",
    isOnline: true,
    gradient: "from-[#43e97b] to-[#38f9d7]",
  },
  {
    id: "4",
    name: "Arlene McCoy",
    initials: "A",
    lastActive: "11 min",
    isOnline: false,
    gradient: "from-[#fa709a] to-[#fee140]",
  },
  {
    id: "5",
    name: "Jerome Bell",
    initials: "J",
    lastActive: "9 min",
    isOnline: false,
    gradient: "from-[#667eea] to-[#764ba2]",
  },
]

const CHAT_MESSAGES: ChatMessage[] = [
  {
    id: "1",
    name: "Sarah M.",
    initials: "S",
    language: "🇪🇸 Learning Spanish",
    message: "Anyone want to practice Spanish over coffee today? ☕",
    timeAgo: "2m ago",
    gradient: "from-[#f093fb] to-[#f5576c]",
  },
  {
    id: "2",
    name: "Max Chen",
    initials: "M",
    language: "🇳🇱 Teaching Chinese",
    message: "Looking for Dutch conversation partner! Near Scheveningen 🏖️",
    timeAgo: "5m ago",
    gradient: "from-[#4facfe] to-[#00f2fe]",
  },
  {
    id: "3",
    name: "Luna Silva",
    initials: "L",
    language: "🇧🇷 Teaching Portuguese",
    message: "Just joined! Excited to practice French with native speakers 🎉",
    timeAgo: "12m ago",
    gradient: "from-[#43e97b] to-[#38f9d7]",
  },
  {
    id: "4",
    name: "Emma Wilson",
    initials: "E",
    language: "🇬🇧 Teaching English",
    message: "Who's going to the language meetup tomorrow? 👋",
    timeAgo: "15m ago",
    gradient: "from-[#fbbf24] to-[#f59e0b]",
  },
]

const MAP_STORIES: MapStory[] = [
  { id: "1", name: "Quinn", initials: "Q", isOnline: true, gradient: "from-[#f093fb] to-[#f5576c]" },
  { id: "2", name: "Alex", initials: "A", isOnline: false, gradient: "from-[#4facfe] to-[#00f2fe]" },
  { id: "3", name: "Sarah", initials: "S", isOnline: false, gradient: "from-[#fbbf24] to-[#f59e0b]" },
  { id: "4", name: "Sebastian", initials: "S", isOnline: true, gradient: "from-[#06b6d4] to-[#0891b2]" },
  { id: "5", name: "Stevy", initials: "S", isOnline: false, gradient: "from-[#fbbf24] to-[#f59e0b]" },
  { id: "6", name: "Jose", initials: "J", isOnline: false, gradient: "from-[#c084fc] to-[#a855f7]" },
]

const MAP_MARKERS: MapMarker[] = [
  { id: "1", name: "S", initials: "S", matchScore: 92, top: "40%", left: "35%", gradient: "from-[#f093fb] to-[#f5576c]", isActive: true },
  { id: "2", name: "M", initials: "M", matchScore: 88, top: "32%", left: "55%", gradient: "from-[#4facfe] to-[#00f2fe]" },
  { id: "3", name: "L", initials: "L", matchScore: 75, top: "60%", left: "25%", gradient: "from-[#43e97b] to-[#38f9d7]" },
  { id: "4", name: "E", initials: "E", matchScore: 85, top: "55%", left: "60%", gradient: "from-[#fbbf24] to-[#f59e0b]" },
  { id: "5", name: "A", initials: "A", matchScore: 80, top: "70%", left: "45%", gradient: "from-[#fb923c] to-[#f97316]" },
  { id: "6", name: "J", initials: "J", matchScore: 78, top: "25%", left: "42%", gradient: "from-[#c084fc] to-[#a855f7]" },
]

const EVENT_CARDS: EventCard[] = [
  {
    id: "1",
    date: "MAY 08",
    title: "Spanish Coffee Chat",
    location: "Café Central",
    time: "Thu 10:00",
    participants: 9,
    gradient: "from-[#667eea] to-[#764ba2]",
  },
  {
    id: "2",
    date: "MAY 09",
    title: "Dutch Language Meetup",
    location: "Library",
    time: "Thu 15:00",
    participants: 7,
    gradient: "from-[#06b6d4] to-[#0891b2]",
  },
]

const FILTER_CHIPS = [
  { id: "spanish", label: "🇪🇸 Spanish", active: true },
  { id: "dutch", label: "🇳🇱 Dutch", active: false },
  { id: "french", label: "🇫🇷 French", active: false },
  { id: "german", label: "🇩🇪 German", active: false },
  { id: "nearby", label: "📍 Nearby", active: false },
  { id: "online", label: "● Online Now", active: false },
]

export function ExploreLayout({
  userName = "Girmay Lalana",
  userAvatar,
  unreadNotificationCount = 3,
  onTabChange,
  activeTab = "map",
  mapComponent,
}: ExploreLayoutProps) {
  const [activeFilter, setActiveFilter] = useState("spanish")
  const userInitials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  const navIcons = [
    { id: "home", icon: Home, label: "Home" },
    { id: "map", icon: MapPin, label: "Map" },
    { id: "chats", icon: MessageCircle, label: "Chats" },
    { id: "events", icon: Clock, label: "Events" },
    { id: "flag", icon: Flag, label: "Flag" },
    { id: "settings", icon: Settings, label: "Settings" },
  ]

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        .explore-chat-messages-area::-webkit-scrollbar {
          width: 6px;
        }
        .explore-chat-messages-area::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 3px;
        }
        .explore-chat-messages-area::-webkit-scrollbar-track {
          background: transparent;
        }
        .explore-map-stories::-webkit-scrollbar {
          height: 4px;
        }
        .explore-map-stories::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 2px;
        }
      `}} />
      <div className="absolute inset-0 bg-gradient-to-br from-[#e0f2fe] to-[#dbeafe] p-8 overflow-hidden">
      <div className="max-w-[1400px] mx-auto h-full bg-white rounded-[32px] shadow-[0_20px_60px_rgba(0,0,0,0.08)] overflow-hidden flex">
        {/* LEFT SIDEBAR */}
        <div className="w-[280px] bg-[#fafafa] p-8 border-r border-[#e5e7eb] flex flex-col">
          {/* Logo & Search */}
          <div className="mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-[#667eea] to-[#764ba2] rounded-xl flex items-center justify-center text-2xl mb-5 cursor-pointer">
              🌍
            </div>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9ca3af]" />
              <input
                type="text"
                placeholder="Search"
                className="w-full px-3 py-3 pl-10 bg-[#f3f4f6] border-none rounded-xl text-sm outline-none"
              />
            </div>
          </div>

          {/* YOUR GROUPS */}
          <div className="mb-8">
            <div className="text-xs font-bold uppercase text-[#9ca3af] tracking-wider mb-4">
              Your Groups
            </div>
            <div className="space-y-2">
              {GROUPS.map((group) => (
                <div
                  key={group.id}
                  className="flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer hover:bg-[#f3f4f6] transition-all"
                >
                  <span className="text-xl">{group.flag}</span>
                  <span className="text-sm font-semibold text-[#111827]">{group.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* PARTNERS */}
          <div className="flex-1">
            <div className="text-xs font-bold uppercase text-[#9ca3af] tracking-wider mb-4">
              Partners
            </div>
            <div className="space-y-2">
              {PARTNERS.map((partner) => (
                <div
                  key={partner.id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-[#f3f4f6] transition-all"
                >
                  <div className="relative">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white",
                        `bg-gradient-to-br ${partner.gradient}`
                      )}
                    >
                      {partner.initials}
                    </div>
                    {partner.isOnline && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#10b981] border-2 border-[#fafafa] rounded-full" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-[#111827]">{partner.name}</div>
                    {partner.lastActive && (
                      <div className="text-xs text-[#9ca3af]">{partner.lastActive}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="flex-1 flex flex-col">
          {/* TOP NAV */}
          <div className="px-8 py-6 border-b border-[#e5e7eb] flex justify-between items-center">
            <div className="flex gap-3">
              {navIcons.map((item) => {
                const Icon = item.icon
                const isActive = activeTab === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => onTabChange?.(item.id as any)}
                    className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center transition-all",
                      isActive
                        ? "bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white"
                        : "bg-[#f9fafb] hover:bg-[#f3f4f6] text-gray-600"
                    )}
                    title={item.label}
                  >
                    <Icon className="h-5 w-5" />
                  </button>
                )
              })}
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <button className="w-12 h-12 rounded-xl bg-[#f9fafb] flex items-center justify-center hover:bg-[#f3f4f6] transition-all">
                  <Bell className="h-5 w-5 text-gray-600" />
                </button>
                {unreadNotificationCount > 0 && (
                  <div className="absolute -top-1 -right-1 w-[18px] h-[18px] bg-[#ef4444] rounded-full flex items-center justify-center text-[11px] font-bold text-white border-2 border-white">
                    {unreadNotificationCount}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3 px-4 py-2 bg-[#f9fafb] rounded-3xl cursor-pointer">
                <div
                  className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-white",
                    "bg-gradient-to-br from-[#667eea] to-[#764ba2]"
                  )}
                >
                  {userInitials[0] || "G"}
                </div>
                <div className="text-sm font-semibold text-[#111827]">{userName}</div>
                <ChevronDown className="h-4 w-4 text-gray-600" />
              </div>
            </div>
          </div>

          {/* MAP AREA */}
          <div className="flex-1 relative bg-gradient-to-br from-[#e0e7ff] to-[#f3f4f6] overflow-hidden">
            {/* Map Grid Background */}
            <div
              className="absolute inset-0 opacity-40 pointer-events-none"
              style={{
                backgroundImage: `repeating-linear-gradient(90deg, rgba(102, 126, 234, 0.04) 0, rgba(102, 126, 234, 0.04) 1px, transparent 1px, transparent 60px),
                  repeating-linear-gradient(0deg, rgba(102, 126, 234, 0.04) 0, rgba(102, 126, 234, 0.04) 1px, transparent 1px, transparent 60px)`,
              }}
            />

            {/* Map Component */}
            {mapComponent && (
              <div className="absolute inset-0 w-full h-full z-0">
                <div className="w-full h-full">
                  {mapComponent}
                </div>
              </div>
            )}

            {/* Stories on Map */}
            <div className="absolute top-8 left-8 right-[400px] flex gap-4 overflow-x-auto pb-2 z-20 explore-map-stories pointer-events-auto">
              {MAP_STORIES.map((story) => (
                <div key={story.id} className="flex-shrink-0 text-center cursor-pointer">
                  <div className="relative">
                    <div
                      className={cn(
                        "w-16 h-16 rounded-full flex items-center justify-center font-bold text-xl text-white border-[3px] border-white shadow-lg mb-1.5",
                        `bg-gradient-to-br ${story.gradient}`
                      )}
                    >
                      {story.initials}
                    </div>
                    {story.isOnline && (
                      <div className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-[#10b981] border-[3px] border-white rounded-full" />
                    )}
                  </div>
                  <div className="text-xs font-semibold text-[#111827] bg-white px-2 py-1 rounded-lg shadow-md">
                    {story.name}
                  </div>
                </div>
              ))}
            </div>

            {/* Map Markers */}
            <div className="absolute inset-0 pointer-events-none z-10">
              {MAP_MARKERS.map((marker) => (
                <motion.div
                  key={marker.id}
                  className="absolute cursor-pointer pointer-events-auto"
                  style={{ top: marker.top, left: marker.left }}
                  whileHover={{ scale: 1.15 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="relative">
                    <div
                      className={cn(
                        "w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-white border-4 border-white shadow-lg transition-all",
                        `bg-gradient-to-br ${marker.gradient}`,
                        marker.isActive && "border-[#667eea] border-[5px] animate-pulse"
                      )}
                    >
                      {marker.initials}
                    </div>
                    <div className="absolute -top-1.5 -right-1.5 bg-[#10b981] text-white px-2 py-1 rounded-lg text-[11px] font-bold border-2 border-white">
                      {marker.matchScore}%
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Event Cards on Map */}
            {EVENT_CARDS.map((event, index) => (
              <motion.div
                key={event.id}
                className="absolute w-[280px] bg-white rounded-2xl overflow-hidden shadow-lg cursor-pointer z-30 hover:shadow-xl transition-all hover:-translate-y-1 pointer-events-auto"
                style={{
                  top: index === 0 ? "25%" : "55%",
                  right: index === 0 ? "420px" : "480px",
                }}
                whileHover={{ y: -4 }}
              >
                <div className={`h-[140px] bg-gradient-to-br ${event.gradient} relative`}>
                  <div className="absolute top-3 left-3 bg-[#06b6d4] text-white px-3 py-1.5 rounded-[10px] font-bold text-[11px]">
                    {event.date}
                  </div>
                </div>
                <div className="p-4">
                  <div className="text-[15px] font-bold mb-2 text-[#111827]">{event.title}</div>
                  <div className="text-xs text-[#6b7280] mb-3">
                    📍 {event.location} • {event.time}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex -ml-2">
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className={cn(
                            "w-7 h-7 rounded-full border-2 border-white ml-[-8px]",
                            i === 0 && `bg-gradient-to-br ${event.gradient}`,
                            i === 1 && "bg-gradient-to-br from-[#4facfe] to-[#00f2fe]",
                            i === 2 && "bg-gradient-to-br from-[#43e97b] to-[#38f9d7]"
                          )}
                        />
                      ))}
                    </div>
                    <div className="text-xs font-semibold text-[#6b7280]">+{event.participants} going</div>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Filters Panel */}
            <div className="absolute bottom-8 left-8 bg-white rounded-2xl p-5 shadow-lg z-30 min-w-[280px] pointer-events-auto">
              <div className="text-base font-bold mb-4 text-[#111827]">Find Partners</div>
              <div className="flex flex-wrap gap-2">
                {FILTER_CHIPS.map((chip) => (
                  <button
                    key={chip.id}
                    onClick={() => setActiveFilter(chip.id)}
                    className={cn(
                      "px-3.5 py-2 bg-[#f3f4f6] rounded-[10px] text-[13px] font-semibold cursor-pointer transition-all",
                      activeFilter === chip.id
                        ? "bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white"
                        : "text-[#6b7280] hover:bg-[#e5e7eb]"
                    )}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDEBAR - CHAT */}
        <div className="w-[360px] bg-[#fafafa] border-l border-[#e5e7eb] flex flex-col">
          <div className="p-6 border-b border-[#e5e7eb]">
            <div className="text-lg font-bold mb-1 text-[#111827]">Nearby Chat</div>
            <div className="text-[13px] text-[#6b7280]">14 language partners online</div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-5 explore-chat-messages-area">
            {CHAT_MESSAGES.map((msg) => (
              <div key={msg.id}>
                <div className="flex items-center gap-2.5 mb-2">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center font-bold text-[13px] text-white",
                      `bg-gradient-to-br ${msg.gradient}`
                    )}
                  >
                    {msg.initials}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-[#111827]">{msg.name}</div>
                    <div className="text-[11px] text-[#6b7280]">{msg.language}</div>
                  </div>
                  <div className="text-xs text-[#9ca3af]">{msg.timeAgo}</div>
                </div>
                <div className="ml-[42px] bg-white px-4 py-3 rounded-xl text-[13px] text-[#4b5563] leading-relaxed shadow-sm">
                  {msg.message}
                </div>
              </div>
            ))}
          </div>

          <div className="p-5 bg-white border-t border-[#e5e7eb]">
            <div className="flex items-center gap-3 bg-[#f3f4f6] rounded-xl px-4 py-3">
              <span className="text-xl cursor-pointer">😊</span>
              <input
                type="text"
                placeholder="Type a message..."
                className="flex-1 bg-transparent border-none outline-none text-sm text-[#111827]"
              />
              <div className="w-9 h-9 bg-gradient-to-br from-[#667eea] to-[#764ba2] rounded-[10px] flex items-center justify-center text-white cursor-pointer text-base">
                ➤
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  )
}

