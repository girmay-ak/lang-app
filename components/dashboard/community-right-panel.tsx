"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Send, Pin, ThumbsUp, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useState } from "react"

interface CommunityRightPanelProps {
  className?: string
}

// Mock data - will be replaced with real data
const LIVE_SESSION = {
  isActive: true,
  title: "Spanish Conversation Practice",
  viewers: 3456,
  participants: [
    { id: 1, name: "Carlos", avatar: null },
    { id: 2, name: "Sarah", avatar: null },
    { id: 3, name: "Alex", avatar: null },
  ],
}

const CHAT_MESSAGES = [
  { id: 1, user: "Sarah", action: "Just Raising hand", time: "now", type: "action" },
  { id: 2, user: "Alex", action: "Just Joining", time: "now", type: "action" },
  { id: 3, user: "Suny Suka", message: "Wow Keep it up dude 🔥🔥", time: "09:00", type: "message" },
  { id: 4, user: "Arman Bahir", message: "Amazing", time: "09:01", type: "message" },
  { id: 5, user: "John Doe", message: "Can you look my comment here 🤔", time: "09:10", type: "message" },
]

const PINNED_MESSAGE = {
  text: "How to make Youtube subscriber grow faster.",
}

export function CommunityRightPanel({ className }: CommunityRightPanelProps) {
  const [comment, setComment] = useState("")

  return (
    <div className={cn("w-[360px] flex-shrink-0 flex flex-col bg-[#fafafa] border-l border-[#e5e7eb] overflow-y-auto", className)}>
      {/* Live Session Section */}
      {LIVE_SESSION.isActive && (
        <div className="bg-white rounded-[20px] overflow-hidden mb-6 shadow-lg mx-6 mt-6">
          {/* Live Image */}
          <div className="relative h-[200px] bg-gradient-to-br from-[#f093fb] to-[#f5576c]">
            <div className="absolute top-3 left-3 bg-[#ef4444] text-white px-3 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              LIVE
              <span className="ml-1">👁 {LIVE_SESSION.viewers.toLocaleString()}</span>
            </div>
            <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-md text-white px-3 py-1.5 rounded-lg text-xs font-semibold">
              {LIVE_SESSION.viewers >= 1000 ? `${(LIVE_SESSION.viewers / 1000).toFixed(1)}K` : LIVE_SESSION.viewers} watching
            </div>
          </div>

          {/* Live Chat Header */}
          <div className="bg-[#1e40af] text-white px-4 py-4 flex justify-between items-center">
            <div>
              <div className="text-sm font-bold">Live Chat</div>
              <div className="text-xs opacity-90">🎙️ 15.1k Peoples</div>
            </div>
            <div className="flex gap-2">
              <span className="cursor-pointer">📌</span>
              <span className="cursor-pointer">✕</span>
            </div>
          </div>

          {/* Pinned Message */}
          <div className="px-4 pt-4 pb-4 bg-[#eff6ff] border-l-[3px] border-[#3b82f6]">
            <div className="flex items-center gap-1.5 mb-1">
              <span>📌</span>
              <span className="text-xs font-semibold text-[#3b82f6]">Pinned</span>
            </div>
            <p className="text-[13px] text-[#1e40af]">{PINNED_MESSAGE.text}</p>
          </div>

          {/* Chat Messages */}
          <div className="px-4 py-4 max-h-[280px] overflow-y-auto">
            {CHAT_MESSAGES.map((msg) => (
              <div key={msg.id} className="mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className={cn(
                    "w-6 h-6 rounded-full bg-gradient-to-br flex items-center justify-center text-[10px] font-bold text-white",
                    msg.user === "Suny Suka" ? "from-[#fbbf24] to-[#f59e0b]" :
                    msg.user === "Arman Bahir" ? "from-[#667eea] to-[#764ba2]" :
                    msg.user === "John Doe" ? "from-[#10b981] to-[#059669]" :
                    msg.user === "Stevany Poetri" ? "from-[#f093fb] to-[#f5576c]" :
                    "from-[#667eea] to-[#764ba2]"
                  )}>
                    {msg.user[0]}
                  </div>
                  <span className="text-[13px] font-semibold text-[#111827]">{msg.user}</span>
                  <span className="text-[11px] text-[#9ca3af] ml-auto">{msg.time}</span>
                </div>
                {msg.type === "message" ? (
                  <p className="text-[13px] text-[#4b5563] leading-relaxed ml-8">{msg.message}</p>
                ) : (
                  <p className="text-xs text-[#9ca3af] italic ml-8">{msg.action}</p>
                )}
              </div>
            ))}
          </div>

          {/* Chat Input */}
          <div className="px-4 py-4 bg-white border-t border-[#e5e7eb]">
            <div className="flex items-center gap-2.5 bg-[#06b6d4] rounded-xl px-4 py-3">
              <span className="text-lg cursor-pointer">😊</span>
              <input
                type="text"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add your comment"
                className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder:text-white/70"
              />
              <span className="text-lg cursor-pointer text-white">➤</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

