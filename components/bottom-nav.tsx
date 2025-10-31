"use client"

import { MessageSquare, Map, Bell, Plus, User } from "lucide-react"
import { cn } from "@/lib/utils"

interface BottomNavProps {
  activeTab: "map" | "chats" | "notifications" | "profile"
  onTabChange: (tab: "map" | "chats" | "notifications" | "profile") => void
  onNewExchange?: () => void
}

export function BottomNav({ activeTab, onTabChange, onNewExchange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md">
      <div className="relative">
        {/* Glassmorphic background bar */}
        <div className="bg-slate-800/80 backdrop-blur-xl rounded-full shadow-2xl border border-white/10 px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => onTabChange("map")}
              className={cn(
                "flex items-center justify-center transition-all",
                activeTab === "map" ? "text-blue-400" : "text-slate-400 hover:text-slate-300",
              )}
              aria-label="Explore"
            >
              <Map className="h-6 w-6" strokeWidth={1.5} />
            </button>

            <button
              onClick={() => onTabChange("chats")}
              className={cn(
                "flex items-center justify-center transition-all",
                activeTab === "chats" ? "text-blue-400" : "text-slate-400 hover:text-slate-300",
              )}
              aria-label="Chats"
            >
              <MessageSquare className="h-6 w-6" strokeWidth={1.5} />
            </button>

            {/* Center spacer for elevated button */}
            <div className="w-14" />

            <button
              onClick={() => onTabChange("notifications")}
              className={cn(
                "flex items-center justify-center transition-all relative",
                activeTab === "notifications" ? "text-blue-400" : "text-slate-400 hover:text-slate-300",
              )}
              aria-label="Notifications"
            >
              <Bell className="h-6 w-6" strokeWidth={1.5} />
              {/* Notification badge */}
              <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs font-semibold rounded-full h-5 w-5 flex items-center justify-center">
                5
              </span>
            </button>

            <button
              onClick={() => onTabChange("profile")}
              className={cn(
                "flex items-center justify-center transition-all",
                activeTab === "profile" ? "text-blue-400" : "text-slate-400 hover:text-slate-300",
              )}
              aria-label="Profile"
            >
              <User className="h-6 w-6" strokeWidth={1.5} />
            </button>
          </div>
        </div>

        <button
          onClick={onNewExchange}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-16 w-16 rounded-full bg-gradient-to-br from-green-400 to-green-500 hover:from-green-500 hover:to-green-600 shadow-2xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 border-4 border-slate-900"
          aria-label="New Exchange"
        >
          <Plus className="h-8 w-8 text-white" strokeWidth={2.5} />
        </button>
      </div>
    </nav>
  )
}
