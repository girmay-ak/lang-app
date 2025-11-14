"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sidebar } from "./sidebar"
import { Header } from "./header"
import { LeftPanel } from "./left-panel"
import { MapSection } from "./map-section"
import { cn } from "@/lib/utils"

interface DashboardLayoutProps {
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

export function DashboardLayout({
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
}: DashboardLayoutProps) {
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
      const width = window.innerWidth
      setIsMobile(width < 1024)
      // Auto-collapse on mobile, keep open on desktop (≥1280px)
      if (width < 1280) {
        setIsLeftPanelCollapsed(true)
      } else if (width >= 1280 && activeSidebarItem === "discover") {
        setIsLeftPanelCollapsed(false)
      }
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [activeSidebarItem])

  // Auto-collapse panel when changing sidebar items (except discover)
  useEffect(() => {
    if (activeSidebarItem !== "discover") {
      setIsLeftPanelCollapsed(true)
    } else if (!isMobile) {
      // Only open on desktop if on discover
      const width = window.innerWidth
      if (width >= 1280) {
        setIsLeftPanelCollapsed(false)
      }
    }
  }, [activeSidebarItem, isMobile])

  const handleToggleLeftPanel = useCallback(() => {
    setIsLeftPanelCollapsed((prev) => !prev)
  }, [])

  return (
    <div className={cn("relative flex h-screen w-full flex-col overflow-hidden bg-[#0a0a0f]", className)}>
      {/* Header - Full Width at Top Level (Like Reference Design) */}
      <Header
        searchValue={cityName}
        onSetAvailability={onSetAvailability}
        onOpenFilters={onOpenFilters}
        userAvatar={userAvatar}
        userName={userName}
        userStatus={userStatus}
      />

      {/* Main Content Area - Sidebar + Left Panel + Right Panel */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar - Fixed Left (Panel 1) */}
        <Sidebar
          activeSidebarItem={activeSidebarItem}
          onSidebarItemChange={setActiveSidebarItem}
          userAvatar={userAvatar}
          userName={userName}
          onSetAvailability={onSetAvailability}
        />

        {/* Content Area - Left Panel + Right Panel (with sidebar margin) */}
        <div className="flex-1 flex overflow-hidden bg-gradient-to-br from-[#0a0a0f] via-[#0d0d14] to-[#12121a] md:ml-20">
          {/* Left Panel - Partner List/Filters (Panel 2) - Responsive & Collapsible */}
          <AnimatePresence mode="wait">
            {activeSidebarItem === "discover" && (
              <LeftPanel
                key="discover-panel"
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

          {/* Right Panel - Map/Dynamic Content (Panel 3) - Responsive & Dynamic */}
          <div 
            className={cn(
              "flex-1 relative transition-all duration-300 ease-in-out",
              "p-4 md:p-6 lg:p-8",
              // Responsive padding based on left panel state
              !isLeftPanelCollapsed && activeSidebarItem === "discover" 
                ? "pl-4 md:pl-6 lg:pl-8" 
                : "pl-4 md:pl-6 lg:pl-8"
            )}
            style={{
              transition: "all 300ms cubic-bezier(0.4, 0, 0.2, 1)"
            }}
          >
            <AnimatePresence mode="wait">
              {activeSidebarItem === "discover" ? (
                <motion.div
                  key="map-view"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="h-full w-full"
                >
                  <MapSection
                    nearbyCount={nearbyCount}
                    cityName={cityName}
                    onRecenter={onRecenterMap}
                    onZoomIn={onZoomIn}
                    onZoomOut={onZoomOut}
                  >
                    {mapComponent}
                  </MapSection>
                </motion.div>
              ) : (
                <motion.div
                  key={`content-${activeSidebarItem}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="h-full w-full flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-2xl border border-white/10"
                >
                  <div className="max-w-lg rounded-2xl border border-white/10 bg-[rgba(18,20,36,0.9)] px-8 py-10 text-center shadow-xl backdrop-blur-md">
                    <motion.div
                      initial={{ scale: 0.9 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.1 }}
                    >
                      <h3 className="text-2xl font-semibold text-white mb-3">
                        {activeSidebarItem === "home" && "🏠 Home"}
                        {activeSidebarItem === "messages" && "💬 Messages"}
                        {activeSidebarItem === "favorites" && "⭐ Favorites"}
                        {activeSidebarItem === "settings" && "⚙️ Settings"}
                      </h3>
                      <p className="text-sm text-white/70 mb-6">
                        {activeSidebarItem === "home" && "Welcome to your dashboard. Explore language partners on the Discover tab."}
                        {activeSidebarItem === "messages" && "Your conversations will appear here. Start chatting with language partners!"}
                        {activeSidebarItem === "favorites" && "Save your favorite language partners here for easy access."}
                        {activeSidebarItem === "settings" && "Manage your account settings, preferences, and more."}
                      </p>
                      <button
                        onClick={() => setActiveSidebarItem("discover")}
                        className="px-6 py-3 rounded-full bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-lg shadow-purple-500/30"
                      >
                        Go to Discover
                      </button>
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
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

