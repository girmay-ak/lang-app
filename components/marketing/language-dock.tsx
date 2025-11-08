"use client"

import { useMemo, useState } from "react"
import { motion } from "framer-motion"

import { cn } from "@/lib/utils"

type DockItem = {
  label: string
  icon: React.ReactNode
  accent?: string
}

type LanguageDockProps = {
  items: DockItem[]
  className?: string
}

export function LanguageDock({ items, className }: LanguageDockProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  const computed = useMemo(
    () =>
      items.map((item, idx) => ({
        ...item,
        order: idx,
      })),
    [items],
  )

  return (
    <div
      className={cn(
        "flex w-full flex-wrap items-end justify-center gap-3 rounded-3xl border border-white/10 bg-white/5 px-6 py-4 shadow-[0_18px_40px_rgba(124,58,237,0.25)] backdrop-blur",
        className,
      )}
      onMouseLeave={() => setActiveIndex(null)}
    >
      {computed.map((item, index) => {
        const isActive = activeIndex === index
        const scale = isActive ? 1.25 : activeIndex === null ? 1 : 0.95

        return (
          <motion.button
            type="button"
            key={item.label}
            animate={{ scale }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            onMouseEnter={() => setActiveIndex(index)}
            onFocus={() => setActiveIndex(index)}
            className="group relative flex h-16 w-16 flex-col items-center justify-center rounded-2xl border border-white/10 bg-[#0b1120]/70 text-xs font-semibold text-white transition hover:border-white/30 hover:bg-white/10 focus-visible:outline-none"
          >
            <span className="text-2xl">{item.icon}</span>
            <span className="mt-2 text-[10px] uppercase tracking-wide text-white/70">{item.label}</span>
            {item.accent ? (
              <span className="pointer-events-none absolute -top-8 rounded-full bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#38bdf8] opacity-0 transition duration-200 group-hover:opacity-100">
                {item.accent}
              </span>
            ) : null}
          </motion.button>
        )
      })}
    </div>
  )
}

