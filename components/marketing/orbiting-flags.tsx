"use client"

import { useMemo } from "react"

import { cn } from "@/lib/utils"

type OrbitingFlagsProps = {
  centerLabel?: string
  flags?: Array<{
    icon: string
    caption?: string
    radius?: number
    duration?: number
  }>
  className?: string
}

const defaultFlags = [
  { icon: "🇺🇸", caption: "English", radius: 95, duration: 24 },
  { icon: "🇪🇸", caption: "Spanish", radius: 120, duration: 30 },
  { icon: "🇫🇷", caption: "French", radius: 140, duration: 26 },
  { icon: "🇯🇵", caption: "Japanese", radius: 105, duration: 20 },
  { icon: "🇧🇷", caption: "Portuguese", radius: 135, duration: 32 },
]

export function OrbitingFlags({ centerLabel = "You", flags = defaultFlags, className }: OrbitingFlagsProps) {
  const computed = useMemo(
    () =>
      flags.map((flag, index) => ({
        ...flag,
        radius: flag.radius ?? 120,
        duration: flag.duration ?? 28,
        delay: index * 2.5,
      })),
    [flags],
  )

  return (
    <div className={cn("relative mx-auto flex h-[320px] w-[320px] items-center justify-center", className)}>
      <div className="relative flex h-[180px] w-[180px] items-center justify-center rounded-full border border-white/20 bg-white/10 text-center text-white shadow-[0_18px_60px_rgba(124,58,237,0.35)] backdrop-blur">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-white/50">Orbit</p>
          <p className="text-lg font-semibold text-white">{centerLabel}</p>
        </div>
      </div>

      {computed.map((flag, index) => (
        <div
          key={flag.icon + index}
          className="absolute flex items-center justify-center"
          style={{
            animation: `orbit-${index} ${flag.duration}s linear infinite`,
            width: `${flag.radius * 2}px`,
            height: `${flag.radius * 2}px`,
            animationDelay: `${flag.delay}s`,
          }}
        >
          <div className="flex flex-col items-center gap-1">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-2xl text-white shadow-[0_10px_25px_rgba(59,130,246,0.25)]">
              {flag.icon}
            </span>
            {flag.caption ? (
              <span className="rounded-full bg-black/40 px-2 py-1 text-[10px] uppercase tracking-wide text-white/70">
                {flag.caption}
              </span>
            ) : null}
          </div>
        </div>
      ))}

      <style jsx>{`
        ${computed
          .map(
            (_flag, index) => `
          @keyframes orbit-${index} {
            0% {
              transform: rotate(0deg);
            }
            50% {
              transform: rotate(180deg);
            }
            100% {
              transform: rotate(360deg);
            }
          }
        `,
          )
          .join("\n")}
      `}</style>
    </div>
  )
}

