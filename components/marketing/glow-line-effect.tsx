"use client"

import { cn } from "@/lib/utils"

interface GlowLineEffectProps {
  className?: string
  direction?: "horizontal" | "vertical"
  intensity?: "soft" | "strong"
}

const intensityMap = {
  soft: "from-sky-400/10 via-purple-500/10 to-transparent",
  strong: "from-sky-400/40 via-purple-500/40 to-transparent",
}

export function GlowLineEffect({ className, direction = "horizontal", intensity = "soft" }: GlowLineEffectProps) {
  const orientationClasses =
    direction === "horizontal"
      ? "h-px w-full bg-gradient-to-r"
      : "w-px h-full bg-gradient-to-b"

  return (
    <span
      aria-hidden
      className={cn(
        "relative overflow-hidden rounded-full",
        orientationClasses,
        `bg-gradient-to-r ${intensityMap[intensity]}`,
        className,
      )}
    >
      <span
        className={cn(
          "absolute inset-0 animate-[pulse_4s_ease-in-out_infinite] bg-gradient-to-r",
          intensity === "strong"
            ? "from-sky-300/40 via-white/40 to-purple-400/40"
            : "from-sky-300/20 via-white/20 to-purple-300/20",
        )}
      />
    </span>
  )
}
