"use client"

import { motion, AnimatePresence } from "framer-motion"
import { X, Search, MapPin, Users, Star, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

interface PartnerCardData {
  id: string
  name: string
  avatar?: string
  bio: string
  distance: string
  languages: string
  matchScore: number
  isOnline: boolean
  city?: string
}

interface ImprovedLeftPanelProps {
  isCollapsed: boolean
  onToggleCollapse: () => void
  partners?: PartnerCardData[]
  activeLanguage?: string
  onLanguageChange?: (language: string) => void
  searchTerm?: string
  onSearchChange?: (value: string) => void
  className?: string
}

const LANGUAGE_CHIPS = ["All", "English", "Spanish", "German", "Dutch", "French", "Japanese"]

const MOCK_PARTNERS: PartnerCardData[] = [
  {
    id: "1",
    name: "Emma",
    bio: "British expat in Den Haag",
    distance: "1.2 km",
    languages: "EN ↔ NL",
    matchScore: 87,
    isOnline: true,
    city: "Den Haag",
  },
  {
    id: "2",
    name: "Carlos",
    bio: "Spanish teacher & coffee lover",
    distance: "2.5 km",
    languages: "ES ↔ EN",
    matchScore: 92,
    isOnline: true,
    city: "Rotterdam",
  },
  {
    id: "3",
    name: "Yuki",
    bio: "Learning Dutch for work",
    distance: "3.1 km",
    languages: "JP ↔ NL",
    matchScore: 78,
    isOnline: false,
    city: "Den Haag",
  },
]

export function ImprovedLeftPanel({
  isCollapsed,
  onToggleCollapse,
  partners = MOCK_PARTNERS,
  activeLanguage = "All",
  onLanguageChange,
  searchTerm = "",
  onSearchChange,
  className,
}: ImprovedLeftPanelProps) {
  if (isCollapsed) {
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className={cn(
          "flex items-center justify-center",
          "w-14 h-full",
          className
        )}
      >
        <button
          onClick={onToggleCollapse}
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl",
            "bg-white/5 hover:bg-white/10 border border-white/10",
            "text-white/70 hover:text-white",
            "transition-all duration-200"
          )}
          aria-label="Expand panel"
        >
          <span className="text-lg font-bold">›</span>
        </button>
      </motion.div>
    )
  }

  return (
    <motion.section
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn(
        "relative flex flex-col w-full h-full",
        "md:w-[380px]",
        "bg-[#111]/80 backdrop-blur-md",
        "border-r border-white/10",
        "shadow-xl",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <h2 className="text-lg font-semibold text-white">Nearby Partners</h2>
        <button
          onClick={onToggleCollapse}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg",
            "bg-white/5 hover:bg-white/10",
            "text-white/70 hover:text-white",
            "transition-all duration-200"
          )}
          aria-label="Collapse panel"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-white/10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder="Search city..."
            className={cn(
              "w-full h-10 rounded-lg pl-10 pr-4",
              "bg-white/10 text-white text-sm placeholder-gray-400",
              "border border-white/10 hover:border-white/20",
              "focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent",
              "transition-all duration-200"
            )}
          />
        </div>
      </div>

      {/* Language Filter Chips */}
      <div className="px-4 py-3 border-b border-white/10">
        <ScrollArea className="w-full" orientation="horizontal">
          <div className="flex gap-2">
            {LANGUAGE_CHIPS.map((lang) => (
              <button
                key={lang}
                onClick={() => onLanguageChange?.(lang)}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm font-medium whitespace-nowrap",
                  "transition-all duration-200",
                  activeLanguage === lang
                    ? "bg-purple-600 text-white shadow-lg shadow-purple-500/30"
                    : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
                )}
              >
                {lang}
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Stats Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/10">
        <div className="flex items-center gap-2 text-sm text-white/70">
          <Users className="h-4 w-4 text-purple-400" />
          <span>{partners.length} partners</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-white/70">
          <TrendingUp className="h-4 w-4 text-emerald-400" />
          <span>Online: {partners.filter(p => p.isOnline).length}</span>
        </div>
      </div>

      {/* Partner List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {partners.map((partner) => (
            <motion.div
              key={partner.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "group relative flex items-start gap-3 p-4 rounded-xl cursor-pointer",
                "bg-white/5 hover:bg-white/10",
                "border border-white/10 hover:border-purple-500/50",
                "transition-all duration-200",
                "shadow-lg hover:shadow-purple-500/20"
              )}
            >
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <Avatar className="h-12 w-12 border-2 border-white/20">
                  <AvatarImage src={partner.avatar} alt={partner.name} />
                  <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white font-semibold">
                    {partner.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {partner.isOnline && (
                  <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-gray-900 bg-emerald-400 shadow-lg" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-white truncate">
                      {partner.name}
                    </h3>
                    <p className="text-xs text-gray-400 truncate mt-0.5">
                      {partner.bio}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-semibold text-purple-400">
                    <Star className="h-3 w-3 fill-current" />
                    <span>{partner.matchScore}%</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-2">
                  <Badge
                    variant="secondary"
                    className="text-xs px-2 py-0.5 bg-purple-500/20 text-purple-300 border-purple-500/30"
                  >
                    {partner.languages}
                  </Badge>
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <MapPin className="h-3 w-3" />
                    <span>{partner.distance}</span>
                  </div>
                </div>
              </div>

              {/* Hover Indicator */}
              <div className="absolute inset-0 rounded-xl border-2 border-purple-500 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </motion.div>
          ))}
        </div>
      </ScrollArea>

      {/* Footer CTA */}
      <div className="p-4 border-t border-white/10 bg-gradient-to-t from-black/40 to-transparent">
        <button
          className={cn(
            "w-full h-10 rounded-full font-semibold text-sm",
            "bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800",
            "text-white shadow-lg shadow-purple-500/30",
            "transition-all duration-200"
          )}
        >
          View All Partners
        </button>
      </div>
    </motion.section>
  )
}




