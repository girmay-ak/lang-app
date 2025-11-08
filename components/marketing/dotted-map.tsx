"use client"

import { motion } from "framer-motion"

import { cn } from "@/lib/utils"

type DottedMapProps = {
  points?: Array<{ x: number; y: number; label: string; flag: string }>
  className?: string
}

const defaultPoints = [
  { x: 20, y: 35, label: "NYC", flag: "🇺🇸" },
  { x: 42, y: 48, label: "Lisbon", flag: "🇵🇹" },
  { x: 58, y: 60, label: "Nairobi", flag: "🇰🇪" },
  { x: 70, y: 40, label: "Dubai", flag: "🇦🇪" },
  { x: 80, y: 55, label: "Seoul", flag: "🇰🇷" },
  { x: 32, y: 70, label: "São Paulo", flag: "🇧🇷" },
]

export function DottedMap({ points = defaultPoints, className }: DottedMapProps) {
  return (
    <div
      className={cn(
        "relative h-[360px] w-full overflow-hidden rounded-[2.5rem] border border-white/10 bg-[radial-gradient(circle_at_50%_-20%,rgba(99,102,241,0.35),rgba(8,12,24,0.95))] p-6 shadow-[0_32px_90px_rgba(56,189,248,0.2)]",
        className,
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_left,rgba(14,165,233,0.25),transparent_55%)] opacity-60" />
      <div className="absolute inset-6 rounded-[2rem] border border-white/5 bg-transparent" />

      <div className="absolute inset-6 grid grid-cols-[repeat(32,1fr)] grid-rows-[repeat(16,1fr)] gap-1 opacity-40">
        {Array.from({ length: 32 * 16 }).map((_, index) => (
          <motion.span
            key={index}
            className="size-1 rounded-full bg-white/30"
            animate={{
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{ duration: 3, ease: "easeInOut", repeat: Infinity, delay: (index % 16) * 0.08 }}
          />
        ))}
      </div>

      {points.map((point, index) => (
        <motion.div
          key={point.label}
          className="absolute flex flex-col items-center gap-2 text-center text-xs text-white"
          style={{
            top: `${point.y}%`,
            left: `${point.x}%`,
          }}
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.12, type: "spring", stiffness: 180, damping: 22 }}
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-white/10 text-lg shadow-lg shadow-[#38bdf8]/30">
            {point.flag}
          </span>
          <span className="rounded-full bg-black/40 px-2 py-1 text-[10px] uppercase tracking-wide text-white/80">
            {point.label}
          </span>
        </motion.div>
      ))}
    </div>
  )
}

