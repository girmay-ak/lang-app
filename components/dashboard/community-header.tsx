"use client"

import { Search, Home, User, MessageCircle, Heart, Settings, Bell } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

interface CommunityHeaderProps {
  activeNavItem: "home" | "profile" | "messages" | "favorites" | "settings"
  onNavItemChange: (item: "home" | "profile" | "messages" | "favorites" | "settings") => void
  userName?: string
  userAvatar?: string
  userStatus?: string
  className?: string
}

const NAV_ITEMS = [
  { id: "home", icon: Home, label: "Home" },
  { id: "profile", icon: User, label: "Profile" },
  { id: "messages", icon: MessageCircle, label: "Messages" },
  { id: "favorites", icon: Heart, label: "Favorites" },
  { id: "settings", icon: Settings, label: "Settings" },
] as const

export function CommunityHeader({
  activeNavItem,
  onNavItemChange,
  userName = "User",
  userAvatar,
  userStatus = "Active explorer",
  className,
}: CommunityHeaderProps) {
  const userInitials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={cn(
        "flex h-auto items-center justify-between px-8 py-6",
        "border-b border-[#e5e7eb]",
        className
      )}
    >
      {/* Left Section - Navigation Icons */}
      <div className="flex items-center gap-3">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = activeNavItem === item.id

          return (
            <motion.button
              key={item.id}
              onClick={() => onNavItemChange(item.id as any)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className={cn(
                "w-12 h-12 flex items-center justify-center rounded-xl text-xl transition-all duration-200",
                isActive
                  ? "bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white"
                  : "bg-[#f9fafb] hover:bg-[#f3f4f6]"
              )}
              title={item.label}
            >
              {item.id === "home" && "🏠"}
              {item.id === "profile" && "👥"}
              {item.id === "messages" && "💬"}
              {item.id === "favorites" && "⏰"}
              {item.id === "settings" && "⚙️"}
            </motion.button>
          )
        })}
      </div>

      {/* Right Section - Notifications & User */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative w-12 h-12 flex items-center justify-center rounded-xl bg-[#f9fafb] hover:bg-[#f3f4f6] text-xl transition-colors"
        >
          🔔
          <span className="absolute -top-1 -right-1 w-[18px] h-[18px] rounded-full bg-[#ef4444] flex items-center justify-center text-[11px] font-bold text-white border-2 border-white">
            3
          </span>
        </motion.button>

        {/* User Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-3 px-2 py-2 pr-4 rounded-full bg-[#f9fafb] hover:bg-[#f3f4f6] transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center text-sm font-bold text-white">
                {userInitials[0]}
              </div>
              <span className="text-sm font-semibold text-[#111827]">{userName}</span>
              <span className="text-[#9ca3af]">▾</span>
            </motion.button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-48 bg-white border-[#e5e7eb] shadow-xl"
          >
            <DropdownMenuItem className="cursor-pointer hover:bg-[#f3f4f6]">
              View Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer hover:bg-[#f3f4f6]">
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-[#e5e7eb]" />
            <DropdownMenuItem className="cursor-pointer text-[#ef4444] hover:bg-red-50">
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.header>
  )
}

