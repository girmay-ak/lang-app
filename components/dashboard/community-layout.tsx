"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CommunityHeader } from "./community-header"
import { CommunitySidebar } from "./community-sidebar"
import { CommunityCenterPanel } from "./community-center-panel"
import { CommunityRightPanel } from "./community-right-panel"
import { cn } from "@/lib/utils"

interface CommunityLayoutProps {
  userName?: string
  userAvatar?: string
  userStatus?: string
  onSetAvailability?: () => void
  className?: string
}

export function CommunityLayout({
  userName = "User",
  userAvatar,
  userStatus = "Active explorer",
  onSetAvailability,
  className,
}: CommunityLayoutProps) {
  const [activeNavItem, setActiveNavItem] = useState<
    "home" | "profile" | "messages" | "favorites" | "settings"
  >("home")
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  return (
    <div className={cn("relative flex h-screen w-full flex-col overflow-hidden bg-gradient-to-br from-[#e0f2fe] via-[#dbeafe] to-[#e0f2fe]", className)}>
      <div className="max-w-[1400px] w-full mx-auto h-full flex flex-col bg-white rounded-none shadow-lg overflow-hidden my-0">
        {/* Main Content Area - 3 Panels */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Sidebar - Groups & Partners (Panel 1) */}
          <CommunitySidebar
            userName={userName}
            userAvatar={userAvatar}
            onSetAvailability={onSetAvailability}
          />

          {/* Central Panel - Events & Activities (Panel 2) */}
          <div className="flex-1 flex flex-col">
            {/* Top Nav */}
            <CommunityHeader
              activeNavItem={activeNavItem}
              onNavItemChange={setActiveNavItem}
              userName={userName}
              userAvatar={userAvatar}
              userStatus={userStatus}
            />

            {/* Content Area */}
            <CommunityCenterPanel activeNavItem={activeNavItem} />
          </div>

          {/* Right Panel - Live Session & Chat (Panel 3) */}
          <CommunityRightPanel />
        </div>
      </div>
    </div>
  )
}

