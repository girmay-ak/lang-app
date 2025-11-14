"use client"

import { Search, Users, UserPlus, Globe } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

interface CommunitySidebarProps {
  userName?: string
  userAvatar?: string
  onSetAvailability?: () => void
  className?: string
}

// Mock data - matching HTML design
const LANGUAGE_GROUPS = [
  { id: 1, name: "Spanish Learners", flag: "🇪🇸" },
  { id: 2, name: "Dutch Practice", flag: "🇳🇱" },
]

const PARTNERS = [
  { id: 1, name: "Elena Peña", initial: "E", status: "online", lastActive: "11 min", gradient: "from-[#f093fb] to-[#f5576c]" },
  { id: 2, name: "Lucas Meyer", initial: "L", status: "online", lastActive: null, gradient: "from-[#4facfe] to-[#00f2fe]" },
  { id: 3, name: "Brooklyn Simmons", initial: "B", status: "online", lastActive: null, gradient: "from-[#43e97b] to-[#38f9d7]" },
  { id: 4, name: "Arlene McCoy", initial: "A", status: "offline", lastActive: "11 min", gradient: "from-[#fa709a] to-[#fee140]" },
  { id: 5, name: "Jerome Bell", initial: "J", status: "offline", lastActive: "9 min", gradient: "from-[#667eea] to-[#764ba2]" },
  { id: 6, name: "Darlene Robertson", initial: "D", status: "online", lastActive: null, gradient: "from-[#fbbf24] to-[#f59e0b]" },
]

export function CommunitySidebar({
  userName = "User",
  userAvatar,
  onSetAvailability,
  className,
}: CommunitySidebarProps) {
  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className={cn(
        "w-[280px] flex-shrink-0 flex flex-col",
        "bg-[#fafafa] border-r border-[#e5e7eb]",
        "overflow-y-auto",
        className
      )}
    >
      {/* Top Section - Logo & Search */}
      <div className="px-6 py-8 mb-8">
        <div className="mb-5">
          <div className="w-12 h-12 bg-gradient-to-br from-[#667eea] to-[#764ba2] rounded-xl flex items-center justify-center text-2xl mb-5 cursor-pointer">
            🌍
          </div>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9ca3af]" />
            <input
              type="text"
              placeholder="Search"
              className="w-full h-9 pl-10 pr-3 text-sm bg-[#f3f4f6] border-none rounded-xl focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* YOUR GROUPS Section */}
      <div className="px-6 mb-8">
        <h3 className="text-xs font-bold text-[#9ca3af] uppercase tracking-wider mb-4">
          Your Groups
        </h3>
        <div className="space-y-2">
          {LANGUAGE_GROUPS.map((group) => (
            <motion.button
              key={group.id}
              whileHover={{ backgroundColor: "#f3f4f6" }}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-colors text-left"
            >
              <span className="text-xl">{group.flag}</span>
              <span className="text-sm font-semibold text-[#111827]">{group.name}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* PARTNERS Section */}
      <div className="px-6 flex-1">
        <h3 className="text-xs font-bold text-[#9ca3af] uppercase tracking-wider mb-4">
          Partners
        </h3>
        <div className="space-y-2">
          {PARTNERS.map((partner) => (
            <motion.button
              key={partner.id}
              whileHover={{ backgroundColor: "#f3f4f6" }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-left"
            >
              <div className="relative">
                <div className={cn(
                  "w-10 h-10 rounded-full bg-gradient-to-br",
                  partner.gradient,
                  "flex items-center justify-center text-sm font-bold text-white"
                )}>
                  {partner.initial}
                </div>
                {partner.status === "online" && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#10b981] rounded-full border-2 border-[#fafafa]" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#111827] leading-tight truncate">{partner.name}</p>
                {partner.lastActive && (
                  <p className="text-xs text-[#9ca3af]">{partner.lastActive}</p>
                )}
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </motion.aside>
  )
}

