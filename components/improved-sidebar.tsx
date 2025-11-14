"use client"

import { motion } from "framer-motion"
import { Home, MessageCircle, Compass, Heart, Settings, User } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface ImprovedSidebarProps {
  activeSidebarItem: "home" | "messages" | "discover" | "favorites" | "settings"
  onSidebarItemChange: (item: "home" | "messages" | "discover" | "favorites" | "settings") => void
  userAvatar?: string
  userName?: string
  className?: string
}

const NAV_ITEMS = [
  { id: "home", icon: Home, label: "Home" },
  { id: "messages", icon: MessageCircle, label: "Messages" },
  { id: "discover", icon: Compass, label: "Discover" },
  { id: "favorites", icon: Heart, label: "Favorites" },
] as const

export function ImprovedSidebar({
  activeSidebarItem,
  onSidebarItemChange,
  userAvatar = "/diverse-person-smiling.png",
  userName = "User",
  className,
}: ImprovedSidebarProps) {
  const userInitials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <TooltipProvider delayDuration={300}>
      <motion.aside
        initial={false}
        className={cn(
          "fixed top-0 left-0 h-full w-20 flex-col items-center justify-between py-6 hidden md:flex",
          "bg-gradient-to-b from-gray-900/80 to-gray-800/80 backdrop-blur-md",
          "border-r border-white/10 shadow-2xl",
          className
        )}
      >
        {/* Top Section - Logo & Navigation */}
        <div className="flex flex-col items-center gap-6 w-full">
          {/* Logo */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7b61ff] to-[#4f46e5] text-sm font-bold uppercase tracking-wider text-white shadow-lg shadow-purple-500/30"
          >
            LX
          </motion.div>

          {/* Navigation Items */}
          <nav className="flex flex-col items-center gap-3 w-full px-3">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon
              const isActive = activeSidebarItem === item.id
              
              return (
                <Tooltip key={item.id}>
                  <TooltipTrigger asChild>
                    <motion.button
                      onClick={() => onSidebarItemChange(item.id as any)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={cn(
                        "relative flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-200",
                        isActive
                          ? "bg-gradient-to-br from-purple-600 to-purple-700 text-white shadow-lg shadow-purple-500/50"
                          : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                      )}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="activeIndicator"
                          className="absolute -left-3 h-8 w-1 rounded-r-full bg-gradient-to-b from-purple-400 to-purple-600"
                          transition={{ type: "spring", stiffness: 380, damping: 30 }}
                        />
                      )}
                      <Icon className="h-5 w-5" />
                    </motion.button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="bg-gray-900 text-white border-white/20">
                    <p>{item.label}</p>
                  </TooltipContent>
                </Tooltip>
              )
            })}
          </nav>
        </div>

        {/* Bottom Section - Settings & Profile */}
        <div className="flex flex-col items-center gap-3 w-full px-3">
          {/* Settings */}
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.button
                onClick={() => onSidebarItemChange("settings")}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-200",
                  activeSidebarItem === "settings"
                    ? "bg-gradient-to-br from-purple-600 to-purple-700 text-white shadow-lg shadow-purple-500/50"
                    : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                )}
              >
                <Settings className="h-5 w-5" />
              </motion.button>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-gray-900 text-white border-white/20">
              <p>Settings</p>
            </TooltipContent>
          </Tooltip>

          {/* User Profile */}
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative"
              >
                <Avatar className="h-11 w-11 border-2 border-gray-600 hover:border-purple-500 transition-colors">
                  <AvatarImage src={userAvatar} alt={userName} />
                  <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-sm font-semibold">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-gray-900 bg-emerald-400 shadow-lg" />
              </motion.button>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-gray-900 text-white border-white/20">
              <p>{userName}</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </motion.aside>
    </TooltipProvider>
  )
}




