"use client"

import { useEffect, useMemo, useState } from "react"

interface OrbitBadge {
  id: string
  label: string
  icon?: string
  orbit: number
  angle: number
}

interface OrbitingSkillsProps {
  items: Array<{ label: string; icon?: string }>
  className?: string
}

export function OrbitingSkills({ items, className }: OrbitingSkillsProps) {
  const [angles, setAngles] = useState<number[]>([])

  const badges: OrbitBadge[] = useMemo(() => {
    const radii = [70, 110, 150]
    return items.map((item, index) => ({
      id: `${item.label}-${index}`,
      label: item.label,
      icon: item.icon,
      orbit: radii[index % radii.length],
      angle: (360 / items.length) * index,
    }))
  }, [items])

  useEffect(() => {
    const initial = badges.map((badge) => badge.angle)
    setAngles(initial)

    const interval = window.setInterval(() => {
      setAngles((prev) => prev.map((angle, index) => (angle + 0.4 + index * 0.02) % 360))
    }, 30)

    return () => window.clearInterval(interval)
  }, [badges])

  return (
    <div className={className}>
      <div className="relative mx-auto flex h-[360px] w-[360px] items-center justify-center">
        <div className="absolute inset-0 rounded-full border border-white/10" />
        <div className="absolute inset-6 rounded-full border border-white/10" />
        <div className="absolute inset-12 rounded-full border border-white/10" />

        <div className="relative z-10 flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-sky-500/40 via-purple-500/40 to-fuchsia-500/40 text-center text-sm font-semibold text-white/90 backdrop-blur-xl shadow-[0_0_40px_rgba(56,189,248,0.45)]">
          LangEx
        </div>

        {badges.map((badge, index) => {
          const angle = angles[index] ?? badge.angle
          const radians = (angle * Math.PI) / 180
          const x = 180 + badge.orbit * Math.cos(radians)
          const y = 180 + badge.orbit * Math.sin(radians)

          return (
            <div
              key={badge.id}
              className="absolute flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-xs font-medium text-white/85 backdrop-blur-xl shadow-[0_0_30px_rgba(99,102,241,0.35)]"
              style={{
                left: x,
                top: y,
              }}
            >
              <span className="flex flex-col items-center gap-1">
                {badge.icon && <span className="text-base">{badge.icon}</span>}
                <span>{badge.label}</span>
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
