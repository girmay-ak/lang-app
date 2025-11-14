"use client"

import { Search, Zap, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
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

interface HeaderProps {
  searchValue?: string
  onSearchChange?: (value: string) => void
  onSetAvailability?: () => void
  onOpenFilters?: () => void
  userAvatar?: string
  userName?: string
  userStatus?: string
  className?: string
}

export function Header({
  searchValue = "",
  onSearchChange,
  onSetAvailability,
  onOpenFilters,
  userAvatar = "/diverse-person-smiling.png",
  userName = "User",
  userStatus = "Active explorer",
  className,
}: HeaderProps) {
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
      transition={{ duration: 0.3 }}
      className={cn(
        "sticky top-0 z-[1200] flex h-16 items-center justify-between px-4 md:px-6 lg:px-8",
        "bg-black/60 backdrop-blur-lg border-b border-white/20",
        "shadow-xl",
        // Full width at top level, with left padding for sidebar on desktop
        "w-full md:pl-24",
        className
      )}
    >
      {/* Left Section - Search */}
      <div className="flex flex-1 items-center gap-3 md:gap-4 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder="Search city or partner..."
            className={cn(
              "h-10 w-full rounded-full pl-11 pr-4 text-sm font-medium",
              "bg-white/10 text-white placeholder-gray-400",
              "border border-white/10 hover:border-white/20",
              "focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent",
              "transition-all duration-200"
            )}
          />
        </div>
      </div>

      {/* Right Section - Actions */}
      <div className="flex items-center gap-3">
        {/* Set Availability Button - Desktop */}
        <Button
          onClick={onSetAvailability}
          className={cn(
            "hidden md:flex h-10 items-center gap-2 rounded-full px-5",
            "bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800",
            "text-sm font-semibold text-white",
            "shadow-lg shadow-purple-500/30 hover:shadow-purple-500/40",
            "transition-all duration-200"
          )}
        >
          <Zap className="h-4 w-4" />
          Set availability
        </Button>

        {/* Set Availability Button - Mobile */}
        <Button
          onClick={onSetAvailability}
          className={cn(
            "flex md:hidden h-10 w-10 items-center justify-center rounded-full p-0",
            "bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800",
            "text-white shadow-lg shadow-purple-500/30",
            "transition-all duration-200"
          )}
        >
          <Zap className="h-4 w-4" />
        </Button>

        {/* Filters Button */}
        <Button
          onClick={onOpenFilters}
          variant="outline"
          className={cn(
            "h-10 items-center gap-2 rounded-full px-4 hidden sm:flex",
            "bg-white/10 hover:bg-white/20 text-white",
            "border border-white/10 hover:border-white/20",
            "transition-all duration-200"
          )}
        >
          <Settings className="h-4 w-4" />
          <span className="text-sm font-medium">Filters</span>
        </Button>

        {/* Filters Button - Icon Only Mobile */}
        <Button
          onClick={onOpenFilters}
          variant="outline"
          className={cn(
            "flex sm:hidden h-10 w-10 items-center justify-center rounded-full p-0",
            "bg-white/10 hover:bg-white/20 text-white",
            "border border-white/10",
            "transition-all duration-200"
          )}
        >
          <Settings className="h-4 w-4" />
        </Button>

        {/* User Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "flex items-center gap-2 rounded-full h-10",
                "bg-white/10 hover:bg-white/15 border border-white/10",
                "py-1 pl-1 pr-3",
                "transition-all duration-200"
              )}
            >
              <Avatar className="h-8 w-8 border border-white/20">
                <AvatarImage src={userAvatar} alt={userName} />
                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-xs font-semibold">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden lg:flex flex-col items-start">
                <span className="text-xs font-semibold text-white leading-tight">
                  {userName}
                </span>
                <span className="text-[10px] text-white/60 leading-tight">
                  {userStatus}
                </span>
              </div>
            </motion.button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-48 bg-gray-900/95 backdrop-blur-md border-white/20 text-white shadow-xl"
          >
            <DropdownMenuItem className="cursor-pointer hover:bg-white/10">
              View Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer hover:bg-white/10">
              Notifications
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer hover:bg-white/10">
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem className="cursor-pointer text-rose-400 hover:bg-rose-500/10">
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.header>
  )
}

