"use client"

import { motion } from "framer-motion"
import { MapPin, Star } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export interface PartnerCardData {
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

interface PartnerCardProps {
  partner: PartnerCardData
  onClick?: () => void
}

export function PartnerCard({ partner, onClick }: PartnerCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
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
  )
}

