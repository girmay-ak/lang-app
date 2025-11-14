"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ImprovedSidebar } from "./improved-sidebar"
import { ImprovedHeader } from "./improved-header"
import { ImprovedLeftPanel } from "./improved-left-panel"
import { ImprovedMapSection } from "./improved-map-section"
import { cn } from "@/lib/utils"

interface ImprovedDashboardLayoutProps {
  // Map related props
  mapComponent?: React.ReactNode
  onRecenterMap?: () => void
  onZoomIn?: () => void
  onZoomOut?: () => void
  nearbyCount?: number
  cityName?: string
  
  // User related props
  userName?: string
  userAvatar?: string
  userStatus?: string
  
  // Callbacks
  onSetAvailability?: () => void
  onOpenFilters?: () => void
  
  // Partner data
  partners?: any[]
  
  className?: string
}

export function ImprovedDashboardLayout({
  mapComponent,
  onRecenterMap,
  onZoomIn,
  onZoomOut,
  nearbyCount = 12,
  cityName = "Den Haag",
  userName = "Language Explorer",
  userAvatar,
  userStatus = "Active explorer",
  onSetAvailability,
  onOpenFilters,
  partners,
  className,
}: ImprovedDashboardLayoutProps) {
  const [activeSidebarItem, setActiveSidebarItem] = useState<
    "home" | "messages" | "discover" | "favorites" | "settings"
  >("discover")
  const [isLeftPanelCollapsed, setIsLeftPanelCollapsed] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeLanguage, setActiveLanguage] = useState("All")
  const [isMobile, setIsMobile] = useState(false)

  // Handle responsive behavior
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
      if (window.innerWidth < 1280) {
        setIsLeftPanelCollapsed(true)
      }
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // Auto-collapse panel on mobile when changing sidebar items
  useEffect(() => {
    if (isMobile && activeSidebarItem !== "discover") {
      setIsLeftPanelCollapsed(true)
    }
  }, [activeSidebarItem, isMobile])

  const handleToggleLeftPanel = useCallback(() => {
    setIsLeftPanelCollapsed((prev) => !prev)
  }, [])

  return (
    <div className={cn("relative flex h-screen w-full overflow-hidden bg-[#0a0a0f]", className)}>
      {/* Sidebar - Icon Only */}
      <ImprovedSidebar
        activeSidebarItem={activeSidebarItem}
        onSidebarItemChange={setActiveSidebarItem}
        userAvatar={userAvatar}
        userName={userName}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden md:ml-20">
        {/* Header */}
        <ImprovedHeader
          searchValue={cityName}
          onSetAvailability={onSetAvailability}
          onOpenFilters={onOpenFilters}
          userAvatar={userAvatar}
          userName={userName}
          userStatus={userStatus}
        />

        {/* Content Area - Split View */}
        <div className="flex-1 flex overflow-hidden bg-gradient-to-br from-[#0a0a0f] via-[#0d0d14] to-[#12121a]">
          {/* Left Panel - Partner List */}
          <AnimatePresence mode="wait">
            {activeSidebarItem === "discover" && (
              <ImprovedLeftPanel
                isCollapsed={isLeftPanelCollapsed}
                onToggleCollapse={handleToggleLeftPanel}
                partners={partners}
                activeLanguage={activeLanguage}
                onLanguageChange={setActiveLanguage}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                className="flex-shrink-0"
              />
            )}
          </AnimatePresence>

          {/* Right Area - Map */}
          <div className={cn(
            "flex-1 p-4 md:p-6 lg:p-8 transition-all duration-300",
            !isLeftPanelCollapsed && activeSidebarItem === "discover" ? "lg:pl-4" : ""
          )}>
            <ImprovedMapSection
              nearbyCount={nearbyCount}
              cityName={cityName}
              onRecenter={onRecenterMap}
              onZoomIn={onZoomIn}
              onZoomOut={onZoomOut}
            >
              {mapComponent}
            </ImprovedMapSection>

            {/* Show message when not on discover */}
            {activeSidebarItem !== "discover" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-10"
              >
                <div className="max-w-md rounded-2xl border border-white/10 bg-[rgba(18,20,36,0.9)] px-8 py-8 text-center shadow-xl backdrop-blur-md">
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {activeSidebarItem === "home" && "Home View"}
                    {activeSidebarItem === "messages" && "Messages View"}
                    {activeSidebarItem === "favorites" && "Favorites View"}
                    {activeSidebarItem === "settings" && "Settings View"}
                  </h3>
                  <p className="text-sm text-white/70">
                    Switch back to <span className="text-purple-400 font-semibold">Discover</span> to explore the map.
                  </p>
                  <button
                    onClick={() => setActiveSidebarItem("discover")}
                    className="mt-6 px-6 py-2 rounded-full bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold hover:from-purple-700 hover:to-purple-800 transition-all duration-200"
                  >
                    Go to Discover
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Floating Button for Left Panel (when collapsed on mobile) */}
      {isMobile && isLeftPanelCollapsed && activeSidebarItem === "discover" && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
          onClick={handleToggleLeftPanel}
          className="fixed bottom-6 left-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-purple-700 text-white shadow-lg shadow-purple-500/30"
        >
          <motion.svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </motion.svg>
        </motion.button>
      )}

      {/* Global Styles for animations */}
      <style jsx global>{`
        @keyframes pulseRing {
          0% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 0.6;
          }
          50% {
            transform: translate(-50%, -50%) scale(2);
            opacity: 0.3;
          }
          100% {
            transform: translate(-50%, -50%) scale(3);
            opacity: 0;
          }
        }

        @keyframes radarSweep {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  )
}




