"use client"

import { cn } from "@/lib/utils"
import { MapControls } from "./map-controls"

interface MapSectionProps {
  nearbyCount?: number
  cityName?: string
  onRecenter?: () => void
  onZoomIn?: () => void
  onZoomOut?: () => void
  children?: React.ReactNode
  className?: string
}

export function MapSection({
  nearbyCount = 12,
  cityName = "Den Haag",
  onRecenter,
  onZoomIn,
  onZoomOut,
  children,
  className,
}: MapSectionProps) {
  return (
    <section className={cn("relative flex-1 h-full", className)}>
      {/* Map Container */}
      <div className="relative h-full w-full overflow-hidden rounded-2xl border border-white/10 bg-[#0d0d14] shadow-2xl">
        {/* Map Content (passed as children) */}
        {children}

        {/* Overlay UI */}
        <MapControls
          nearbyCount={nearbyCount}
          cityName={cityName}
          onRecenter={onRecenter}
          onZoomIn={onZoomIn}
          onZoomOut={onZoomOut}
        />
      </div>
    </section>
  )
}

