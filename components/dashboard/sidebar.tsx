"use client"

import { motion } from "framer-motion"
import { Home, MessageCircle, Compass, Heart, Settings, Zap } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface SidebarProps {
  activeSidebarItem: "home" | "messages" | "discover" | "favorites" | "settings"
  onSidebarItemChange: (item: "home" | "messages" | "discover" | "favorites" | "settings") => void
  userAvatar?: string
  userName?: string
  onSetAvailability?: () => void
  className?: string
}

const NAV_ITEMS = [
  { id: "home", icon: Home, label: "Home" },
  { id: "messages", icon: MessageCircle, label: "Messages" },
  { id: "discover", icon: Compass, label: "Discover" },
  { id: "favorites", icon: Heart, label: "Favorites" },
] as const

export function Sidebar({
  activeSidebarItem,
  onSidebarItemChange,
  userAvatar = "/diverse-person-smiling.png",
  userName = "User",
  onSetAvailability,
  className,
}: SidebarProps) {
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
          "fixed top-0 left-0 h-full w-20 z-50 flex-col items-center justify-between py-6 hidden md:flex",
          "bg-gradient-to-b from-[#121218] via-[#0f0f15] to-[#0d0d12] backdrop-blur-md",
          "border-r border-white/10 shadow-2xl",
          className
        )}
      >
        {/* Top Section - Logo & Navigation */}
        <div className="flex flex-col items-center gap-6 w-full">
          {/* Logo - Matching Reference Design */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex flex-col items-center gap-2 px-2"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7c3aed] to-[#6366f1] text-lg font-bold uppercase tracking-tighter text-white shadow-lg shadow-purple-500/40">
              PLAS
            </div>
            <div className="text-center">
              <p className="text-[8px] font-semibold uppercase tracking-widest text-white/50 leading-tight">YOUR HUB</p>
              <p className="text-[9px] font-bold text-white/90 leading-tight">Plas</p>
            </div>
          </motion.div>

          {/* Navigation Items */}
          <nav className="flex flex-col items-center gap-2 w-full px-2">
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
                        "relative flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-200",
                        isActive
                          ? "bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] text-white shadow-lg shadow-purple-500/50"
                          : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                      )}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="activeIndicator"
                          className="absolute -left-3 h-7 w-1 rounded-r-full bg-gradient-to-b from-blue-400 to-purple-500"
                          transition={{ type: "spring", stiffness: 380, damping: 30 }}
                        />
                      )}
                      <Icon className="h-5 w-5" />
                    </motion.button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="bg-[#1a1a20] text-white border-white/20 shadow-xl">
                    <p className="text-xs font-medium">{item.label}</p>
                  </TooltipContent>
                </Tooltip>
              )
            })}
          </nav>

          {/* Settings Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.button
                onClick={() => onSidebarItemChange("settings")}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-200",
                  activeSidebarItem === "settings"
                    ? "bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] text-white shadow-lg shadow-purple-500/50"
                    : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                )}
              >
                <Settings className="h-5 w-5" />
              </motion.button>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-[#1a1a20] text-white border-white/20 shadow-xl">
              <p className="text-xs font-medium">Settings</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Bottom Section - User Status & Set Availability (Matching Reference) */}
        <div className="flex flex-col items-center gap-3 w-full px-2 pb-2">
          {/* YOU'RE SET Section */}
          <div className="flex flex-col items-center gap-3 w-full">
            <p className="text-[8px] font-semibold uppercase tracking-widest text-white/40">YOU'RE SET</p>
            
            {/* User Avatar */}
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative"
                >
                  <Avatar className="h-12 w-12 border-2 border-white/20 shadow-lg">
                    <AvatarImage src={userAvatar} alt={userName} />
                    <AvatarFallback className="bg-gradient-to-br from-purple-500 via-pink-500 to-purple-600 text-white text-sm font-bold">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-[#121218] bg-emerald-400 shadow-lg" />
                </motion.div>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-[#1a1a20] text-white border-white/20 shadow-xl">
                <p className="text-xs font-medium">{userName}</p>
              </TooltipContent>
            </Tooltip>

            {/* Status Text */}
            <p className="text-[9px] text-center text-white/70 leading-tight px-2">
              Ready to connect nearby.
            </p>

            {/* Set Availability Button */}
            <Button
              onClick={onSetAvailability}
              className={cn(
                "w-full h-8 rounded-full text-[9px] font-semibold",
                "bg-gradient-to-r from-pink-500 via-purple-500 to-pink-600",
                "hover:from-pink-600 hover:via-purple-600 hover:to-pink-700",
                "text-white shadow-lg shadow-purple-500/30",
                "transition-all duration-200"
              )}
            >
              <Zap className="h-3 w-3 mr-1" />
              Set availability
            </Button>
          </div>
        </div>
      </motion.aside>
    </TooltipProvider>
  )
}

