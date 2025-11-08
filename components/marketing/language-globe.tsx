"use client"

import { useEffect, useState } from "react"

import { cn } from "@/lib/utils"

type Marker = {
  label: string
  position: [number, number]
  flag: string
}

type LanguageGlobeProps = {
  markers?: Marker[]
  className?: string
}

const defaultMarkers: Marker[] = [
  { label: "Seoul", position: [45, -60], flag: "🇰🇷" },
  { label: "Lisbon", position: [10, 20], flag: "🇵🇹" },
  { label: "Mexico City", position: [-5, -100], flag: "🇲🇽" },
  { label: "Nairobi", position: [-10, 35], flag: "🇰🇪" },
  { label: "Tokyo", position: [35, -130], flag: "🇯🇵" },
]

export function LanguageGlobe({ markers = defaultMarkers, className }: LanguageGlobeProps) {
  const [rotation, setRotation] = useState(0)

  useEffect(() => {
    const interval = window.setInterval(() => {
      setRotation((prev) => (prev + 0.3) % 360)
    }, 40)
    return () => window.clearInterval(interval)
  }, [])

  return (
    <div className={cn("relative mx-auto h-[320px] w-[320px]", className)}>
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#182848] via-[#23395d] to-[#0b1220] shadow-[0_25px_80px_rgba(37,99,235,0.35)]" />
      <div
        className="absolute inset-[18px] rounded-full border border-white/20 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.25),rgba(15,23,42,0.15)_45%,rgba(8,12,24,0.9)_75%)] transition-transform"
        style={{ transform: `rotate(${rotation}deg)` }}
      >
        <div className="absolute inset-6 rounded-full border border-white/10 opacity-40" />
        <div className="absolute inset-10 rounded-full border border-white/10 opacity-20" />
        <div className="absolute inset-0">
          {markers.map((marker) => (
            <div
              key={marker.label}
              className="absolute flex flex-col items-center gap-1 text-center text-xs text-white"
              style={{
                top: `${50 - marker.position[0]}%`,
                left: `${50 + marker.position[1]}%`,
              }}
            >
              <span className="rounded-full border border-white/10 bg-white/10 px-3 py-2 text-base shadow-lg shadow-[#38bdf8]/30">
                {marker.flag}
              </span>
              <span className="rounded-full bg-black/40 px-2 py-1 text-[10px] uppercase tracking-wide text-white/80">
                {marker.label}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-br from-transparent via-transparent to-[#111827]/60" />
    </div>
  )
}

