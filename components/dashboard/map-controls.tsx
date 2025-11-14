"use client"

import { motion } from "framer-motion"
import { MapPin, Compass, Users, Plus, Minus, Locate } from "lucide-react"
import { cn } from "@/lib/utils"

interface MapControlsProps {
  nearbyCount?: number
  cityName?: string
  onRecenter?: () => void
  onZoomIn?: () => void
  onZoomOut?: () => void
  className?: string
}

export function MapControls({
  nearbyCount = 12,
  cityName = "Den Haag",
  onRecenter,
  onZoomIn,
  onZoomOut,
  className,
}: MapControlsProps) {
  return (
    <div className={cn("pointer-events-none absolute inset-0", className)}>
      {/* Top Left - City Badge */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="absolute top-6 left-6"
      >
        <div className="pointer-events-auto inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-black/60 backdrop-blur-md px-5 py-3 text-sm font-semibold text-white shadow-lg">
          <Compass className="h-4 w-4 text-purple-400" />
          <span>{cityName}, Netherlands</span>
        </div>
      </motion.div>

      {/* Top Right - Map Controls */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="absolute top-6 right-6 flex items-center gap-3"
      >
        <button
          onClick={() => {/* Add layers toggle */}}
          className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-black/60 backdrop-blur-md text-white shadow-lg hover:bg-black/80 hover:border-purple-500/50 transition-all duration-200"
          aria-label="Map layers"
        >
          <MapPin className="h-5 w-5" />
        </button>
      </motion.div>

      {/* Top Center - Nearby Count */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="absolute top-16 left-1/2 -translate-x-1/2"
      >
        <div className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/60 backdrop-blur-md px-5 py-2 text-sm font-semibold text-white shadow-lg">
          <Users className="h-4 w-4 text-purple-400" />
          <span>{nearbyCount} nearby</span>
        </div>
      </motion.div>

      {/* Center - Radar/Pulse Animation */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        <div className="relative h-40 w-40">
          {/* Static center circle */}
          <span className="absolute inset-0 rounded-full border border-purple-500/30 bg-purple-500/10" />
          
          {/* Pulse rings */}
          {[0, 1, 2].map((index) => (
            <motion.span
              key={index}
              className="absolute inset-0 rounded-full border-2 border-purple-500/40"
              initial={{ scale: 1, opacity: 0.6 }}
              animate={{
                scale: [1, 2, 3],
                opacity: [0.6, 0.3, 0],
              }}
              transition={{
                duration: 4,
                delay: index * 1.3,
                repeat: Infinity,
                ease: "easeOut",
              }}
            />
          ))}

          {/* Rotating radar sweep */}
          <motion.div
            className="absolute inset-0"
            animate={{ rotate: 360 }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            <div
              className="absolute left-1/2 top-1/2 h-[180%] w-1 -translate-x-1/2 -translate-y-[90%] origin-bottom"
              style={{
                background: "linear-gradient(to bottom, transparent, rgba(139, 92, 246, 0.5), rgba(139, 92, 246, 0.8))",
                filter: "blur(2px)",
              }}
            />
          </motion.div>

          {/* Center glow */}
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-purple-500 shadow-lg shadow-purple-500/50" />
        </div>
      </div>

      {/* Bottom Left - Zoom Controls */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.4 }}
        className="absolute bottom-6 left-6 flex flex-col gap-2"
      >
        <button
          onClick={onZoomIn}
          className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-black/60 backdrop-blur-md text-white text-xl font-bold shadow-lg hover:bg-black/80 hover:border-purple-500/50 transition-all duration-200"
          aria-label="Zoom in"
        >
          <Plus className="h-5 w-5" />
        </button>
        <button
          onClick={onZoomOut}
          className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-black/60 backdrop-blur-md text-white text-xl font-bold shadow-lg hover:bg-black/80 hover:border-purple-500/50 transition-all duration-200"
          aria-label="Zoom out"
        >
          <Minus className="h-5 w-5" />
        </button>
      </motion.div>

      {/* Bottom Right - Recenter Button */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.4 }}
        className="absolute bottom-6 right-6"
      >
        <motion.button
          onClick={onRecenter}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-xl border border-purple-500/50 bg-gradient-to-br from-purple-600/90 to-purple-700/90 backdrop-blur-md text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-200"
          aria-label="Recenter map (press R)"
        >
          <Locate className="h-6 w-6" />
        </motion.button>
      </motion.div>

      {/* Grid overlay for depth */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(139, 92, 246, 0.08) 0px, rgba(139, 92, 246, 0.08) 1px, transparent 1px, transparent 80px), repeating-linear-gradient(90deg, rgba(139, 92, 246, 0.08) 0px, rgba(139, 92, 246, 0.08) 1px, transparent 1px, transparent 80px)",
        }}
      />
    </div>
  )
}

