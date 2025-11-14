"use client"

import { X, User, Settings, Globe, Heart, HelpCircle, LogOut, Award, TrendingUp, Users, Search, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  isPermanent?: boolean
  userName?: string
  userAvatar?: string
}

// Mock data - will be replaced with real data
const LANGUAGE_GROUPS = [
  { id: 1, name: "English Exchange Den Haag", flag: "🇬🇧", members: 234, online: 12 },
  { id: 2, name: "Spanish Practice Circle", flag: "🇪🇸", members: 189, online: 8 },
  { id: 3, name: "Dutch Learning Hub", flag: "🇳🇱", members: 156, online: 5 },
]

const FRIENDS = [
  { id: 1, name: "Carlos", avatar: null, status: "online", lastActive: "now", languages: "EN ↔ ES" },
  { id: 2, name: "Anna", avatar: null, status: "online", lastActive: "2 min", languages: "DE ↔ NL" },
  { id: 3, name: "Yuki", avatar: null, status: "away", lastActive: "11 min", languages: "EN ↔ JP" },
  { id: 4, name: "Emma", avatar: null, status: "online", lastActive: "5 min", languages: "EN ↔ FR" },
]

export function Sidebar({ isOpen, onClose, isPermanent = false, userName = "User", userAvatar }: SidebarProps) {
  return (
    <>
      {isOpen && !isPermanent && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity animate-in fade-in duration-300"
          onClick={onClose}
        />
      )}

      <div
        className={cn(
          isPermanent ? "relative" : "fixed",
          "top-0 left-0 h-full w-80 flex-shrink-0 flex flex-col",
          "bg-white/60 backdrop-blur-md border-r border-gray-200/50",
          isPermanent ? "" : "z-50",
          "transform transition-transform duration-300 ease-in-out shadow-2xl",
          isOpen || isPermanent ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full overflow-y-auto">
          {/* Top Section - Logo & Search */}
          <div className="p-4 border-b border-gray-200/50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 text-white font-bold text-lg shadow-lg">
                  LX
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Language</p>
                  <p className="text-sm font-bold text-gray-900">Exchange</p>
                </div>
              </div>
              {!isPermanent && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="text-gray-600 hover:bg-gray-100 rounded-full"
                >
                  <X className="h-5 w-5" />
                </Button>
              )}
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                className="w-full h-9 rounded-lg pl-10 pr-3 text-sm bg-gray-100/80 border border-gray-200/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
          </div>

          {/* YOUR GROUPS Section */}
          <div className="p-4 border-b border-gray-200/50">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              YOUR GROUPS
            </h3>
            <div className="space-y-2">
              {LANGUAGE_GROUPS.map((group) => (
                <motion.button
                  key={group.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100/80 transition-colors"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-100 to-purple-100 text-2xl">
                    {group.flag}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-semibold text-gray-900 leading-tight">{group.name}</p>
                    <p className="text-xs text-gray-500">{group.members} members • {group.online} online</p>
                  </div>
                </motion.button>
              ))}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full mt-3 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            >
              <UserPlus className="h-3 w-3 mr-1" />
              Join Group
            </Button>
          </div>

          {/* FRIENDS Section */}
          <div className="p-4 flex-1">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              FRIENDS
            </h3>
            <div className="space-y-2">
              {FRIENDS.map((friend) => (
                <motion.button
                  key={friend.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100/80 transition-colors"
                >
                  <div className="relative">
                    <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                      <AvatarImage src={friend.avatar || undefined} alt={friend.name} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-400 text-white text-xs font-semibold">
                        {friend.name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <span
                      className={cn(
                        "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white",
                        friend.status === "online" ? "bg-green-400" : "bg-yellow-400"
                      )}
                    />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-semibold text-gray-900 leading-tight">{friend.name}</p>
                    <p className="text-xs text-gray-500">{friend.languages} • {friend.lastActive}</p>
                  </div>
                </motion.button>
              ))}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full mt-3 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            >
              <Globe className="h-3 w-3 mr-1" />
              Find Friends
            </Button>
          </div>

          <Separator className="bg-gray-200/50" />

          {/* Menu Items */}
          <nav className="p-4 space-y-1">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-12 text-gray-700 hover:bg-gray-100 rounded-xl font-medium"
            >
              <User className="h-5 w-5 text-blue-600" />
              <span>My Profile</span>
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-12 text-gray-700 hover:bg-gray-100 rounded-xl font-medium"
            >
              <Heart className="h-5 w-5 text-pink-600" />
              <span>Favorites</span>
              <Badge className="ml-auto bg-pink-100 text-pink-700 border-0">12</Badge>
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-12 text-gray-700 hover:bg-gray-100 rounded-xl font-medium"
            >
              <Award className="h-5 w-5 text-yellow-600" />
              <span>Achievements</span>
              <Badge className="ml-auto bg-yellow-100 text-yellow-700 border-0">8</Badge>
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-12 text-gray-700 hover:bg-gray-100 rounded-xl font-medium"
            >
              <Settings className="h-5 w-5 text-gray-600" />
              <span>Settings</span>
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-12 text-gray-700 hover:bg-gray-100 rounded-xl font-medium"
            >
              <HelpCircle className="h-5 w-5 text-gray-600" />
              <span>Help & Support</span>
            </Button>
          </nav>

          <Separator className="bg-gray-200/50" />

          {/* Footer - User Info & Logout */}
          <div className="p-4 space-y-3">
            {/* User Info */}
            {userName && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-br from-blue-50 to-purple-50">
                <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                  <AvatarImage src={userAvatar} alt={userName} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-400 text-white text-xs font-semibold">
                    {userName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{userName}</p>
                  <p className="text-xs text-gray-500">Active explorer</p>
                </div>
              </div>
            )}

            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-12 text-red-600 hover:bg-red-50 rounded-xl font-medium"
            >
              <LogOut className="h-5 w-5" />
              <span>Log Out</span>
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
