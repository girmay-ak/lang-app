"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Flame, Heart, Users, Calendar, Clock, Video, MapPin } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { ScrollArea } from "@/components/ui/scroll-area"
import Image from "next/image"

interface CommunityCenterPanelProps {
  activeNavItem: "home" | "profile" | "messages" | "favorites" | "settings"
  className?: string
}

// Mock data - matching HTML design
const STORIES = [
  { id: 1, name: "Quinn", initial: "Q", online: true, gradient: "from-[#f093fb] to-[#f5576c]" },
  { id: 2, name: "Alex", initial: "A", online: false, gradient: "from-[#4facfe] to-[#00f2fe]" },
  { id: 3, name: "Sarah", initial: "S", online: false, gradient: "from-[#fbbf24] to-[#f59e0b]" },
  { id: 4, name: "Sebastian", initial: "S", online: true, gradient: "from-[#06b6d4] to-[#0891b2]" },
  { id: 5, name: "Stevy", initial: "S", online: false, gradient: "from-[#fbbf24] to-[#f59e0b]" },
  { id: 6, name: "Jose", initial: "J", online: false, gradient: "from-[#c084fc] to-[#a855f7]" },
  { id: 7, name: "Alita", initial: "A", online: false, gradient: "from-[#fb923c] to-[#f97316]" },
  { id: 8, name: "Andrew", initial: "A", online: true, gradient: "from-[#f472b6] to-[#ec4899]" },
]

const EVENTS = [
  {
    id: 1,
    title: "Spanish Conversation Coffee",
    date: "MAY 08",
    day: "08",
    month: "MAY",
    time: "Thu 10:00",
    location: "Café Central",
    description: "Join us for casual Spanish conversation over coffee. All levels welcome! Practice speaking in a relaxed environment.",
    host: { name: "Valentino Del More", title: "Spanish Native • Host", initial: "V" },
    participants: 12,
    reactions: { fire: 12, heart: 30 },
    gradient: "from-[#667eea] to-[#764ba2]",
  },
  {
    id: 2,
    title: "Dutch Language Exchange",
    date: "MAY 09",
    day: "09",
    month: "MAY",
    time: "Thu 10:00",
    location: "Library Center",
    description: "Practice Dutch with native speakers! Bring your questions and let's learn together in a friendly group setting.",
    host: { name: "Angelina Joly", title: "Dutch Teacher • Organizer", initial: "A" },
    participants: 12,
    reactions: { fire: 12, heart: 30 },
    gradient: "from-[#06b6d4] to-[#0891b2]",
  },
]

export function CommunityCenterPanel({
  activeNavItem,
  className,
}: CommunityCenterPanelProps) {
  if (activeNavItem !== "home") {
    return (
      <div className={cn("flex-1 flex items-center justify-center bg-white/40", className)}>
        <div className="text-center">
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            {activeNavItem === "profile" && "👤 Profile"}
            {activeNavItem === "messages" && "💬 Messages"}
            {activeNavItem === "favorites" && "⭐ Favorites"}
            {activeNavItem === "settings" && "⚙️ Settings"}
          </h3>
          <p className="text-sm text-gray-500">Content coming soon...</p>
        </div>
      </div>
    )
  }

  return (
    <ScrollArea className={cn("flex-1 bg-white", className)}>
      <div className="px-8 py-8">
        {/* Stories Row - Horizontal Scroll */}
        <div className="flex gap-4 mb-8 overflow-x-auto pb-2 scrollbar-hide">
          {STORIES.map((story) => (
            <motion.div
              key={story.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex-shrink-0 text-center cursor-pointer"
            >
              <div className={cn(
                "w-18 h-18 rounded-full bg-gradient-to-br border-3 border-white shadow-md mb-2 relative",
                story.gradient,
                "flex items-center justify-center text-2xl font-bold text-white"
              )}>
                {story.initial}
                {story.online && (
                  <div className="absolute bottom-0.5 right-0.5 w-4 h-4 bg-[#10b981] rounded-full border-3 border-white" />
                )}
              </div>
              <span className="text-[13px] font-semibold text-[#111827]">{story.name}</span>
            </motion.div>
          ))}
        </div>

        {/* Event Cards - 2 Column Grid */}
        <div className="grid grid-cols-2 gap-6">
          {EVENTS.map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white border border-[#e5e7eb] rounded-[20px] overflow-hidden cursor-pointer hover:shadow-xl transition-all hover:-translate-y-1"
            >
              {/* Event Image */}
              <div className={cn(
                "relative h-[240px] bg-gradient-to-br flex items-center justify-center",
                event.gradient
              )}>
                {/* Date Badge */}
                <div className="absolute top-4 left-4 bg-[#06b6d4] text-white px-4 py-2 rounded-xl font-bold text-center">
                  <div className="text-[11px] uppercase">{event.month}</div>
                  <div className="text-xl">{event.day}</div>
                </div>
                {/* More Options */}
                <div className="absolute top-4 right-4 w-9 h-9 bg-white/90 backdrop-blur-md rounded-lg flex items-center justify-center cursor-pointer text-lg">
                  ⋯
                </div>
              </div>

              {/* Event Content */}
              <div className="p-5">
                <h3 className="text-[17px] font-bold text-[#111827] mb-2">{event.title}</h3>
                <div className="flex gap-2 text-[13px] text-[#6b7280] mb-3">
                  <span>{event.time}</span>
                  <span>•</span>
                  <span>{event.location}</span>
                </div>
                <p className="text-[13px] text-[#6b7280] leading-relaxed mb-4">{event.description}</p>
                
                {/* Host Info */}
                <div className="flex items-center gap-2.5 mb-4">
                  <div className={cn(
                    "w-9 h-9 rounded-full bg-gradient-to-br flex items-center justify-center text-sm font-bold text-white",
                    event.gradient
                  )}>
                    {event.host.initial}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-[#111827]">{event.host.name}</p>
                    <p className="text-xs text-[#6b7280]">{event.host.title}</p>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4">
                  <div className="bg-[#eef2ff] text-[#667eea] px-3 py-1.5 rounded-[20px] text-xs font-bold">
                    👥 {event.participants} Participants
                  </div>
                  <div className="flex items-center gap-1.5 text-[13px] font-semibold">
                    <span className="text-lg">🔥</span>
                    <span>{event.reactions.fire}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[13px] font-semibold">
                    <span className="text-lg">👍</span>
                    <span>{event.reactions.heart}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </ScrollArea>
  )
}

