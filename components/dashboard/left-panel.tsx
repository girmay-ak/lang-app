"use client"

import { motion, AnimatePresence } from "framer-motion"
import { X, Search, Users, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { PartnerCard, type PartnerCardData } from "./partner-card"

interface LeftPanelProps {
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

export function LeftPanel({
  isCollapsed,
  onToggleCollapse,
  partners = [],
  activeLanguage = "All",
  onLanguageChange,
  searchTerm = "",
  onSearchChange,
  className,
}: LeftPanelProps) {
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
        // Responsive widths matching reference design (480-520px on desktop)
        "w-[320px] sm:w-[360px] md:w-[400px] lg:w-[460px] xl:w-[520px]",
        "bg-[#0f0f17]/95 backdrop-blur-md",
        "border-r border-white/15",
        "shadow-2xl",
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
            <PartnerCard key={partner.id} partner={partner} />
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

