"use client"

import { useEffect, useId, useMemo, useState } from "react"
import { motion } from "framer-motion"

import { cn } from "@/lib/utils"

type AnimatedBeamProps = {
  containerRef: React.RefObject<HTMLElement | null>
  fromRef: React.RefObject<HTMLElement | null>
  toRef: React.RefObject<HTMLElement | null>
  className?: string
  curvature?: number
  reverse?: boolean
  duration?: number
  delay?: number
  pathColor?: string
  pathWidth?: number
  pathOpacity?: number
  gradientStartColor?: string
  gradientStopColor?: string
  startXOffset?: number
  startYOffset?: number
  endXOffset?: number
  endYOffset?: number
}

type Point = {
  x: number
  y: number
}

const DEFAULTS = {
  pathColor: "rgba(148, 163, 184, 0.45)",
  gradientStartColor: "#38bdf8",
  gradientStopColor: "#a855f7",
}

export function AnimatedBeam({
  containerRef,
  fromRef,
  toRef,
  className,
  curvature = 0,
  reverse = false,
  duration = 4.5,
  delay = 0,
  pathColor = DEFAULTS.pathColor,
  pathWidth = 2.5,
  pathOpacity = 0.8,
  gradientStartColor = DEFAULTS.gradientStartColor,
  gradientStopColor = DEFAULTS.gradientStopColor,
  startXOffset = 0,
  startYOffset = 0,
  endXOffset = 0,
  endYOffset = 0,
}: AnimatedBeamProps) {
  const gradientId = useId()
  const [pathDefinition, setPathDefinition] = useState<string>("")

  useEffect(() => {
    if (!containerRef.current || !fromRef.current || !toRef.current) return

    const container = containerRef.current
    const startEl = fromRef.current
    const endEl = toRef.current

    const computePath = () => {
      if (!containerRef.current || !fromRef.current || !toRef.current) return

      const containerRect = containerRef.current.getBoundingClientRect()
      const fromRect = fromRef.current.getBoundingClientRect()
      const toRect = toRef.current.getBoundingClientRect()

      const getCenter = (rect: DOMRect): Point => ({
        x: rect.left - containerRect.left + rect.width / 2,
        y: rect.top - containerRect.top + rect.height / 2,
      })

      let startPoint = getCenter(fromRect)
      let endPoint = getCenter(toRect)

      startPoint = {
        x: startPoint.x + startXOffset,
        y: startPoint.y + startYOffset,
      }
      endPoint = {
        x: endPoint.x + endXOffset,
        y: endPoint.y + endYOffset,
      }

      if (reverse) {
        const temp = startPoint
        startPoint = endPoint
        endPoint = temp
      }

      const midX = (startPoint.x + endPoint.x) / 2
      const midY = (startPoint.y + endPoint.y) / 2

      const controlPoint1: Point = {
        x: midX,
        y: midY + curvature,
      }

      const controlPoint2: Point = {
        x: midX,
        y: midY - curvature,
      }

      const path = `M ${startPoint.x} ${startPoint.y} C ${controlPoint1.x} ${controlPoint1.y}, ${controlPoint2.x} ${controlPoint2.y}, ${endPoint.x} ${endPoint.y}`
      setPathDefinition(path)
    }

    computePath()

    const observer = new ResizeObserver(() => computePath())

    observer.observe(container)
    observer.observe(startEl)
    observer.observe(endEl)

    window.addEventListener("resize", computePath)
    window.addEventListener("scroll", computePath, true)

    return () => {
      observer.disconnect()
      window.removeEventListener("resize", computePath)
      window.removeEventListener("scroll", computePath, true)
    }
  }, [
    containerRef,
    fromRef,
    toRef,
    curvature,
    reverse,
    startXOffset,
    startYOffset,
    endXOffset,
    endYOffset,
  ])

  const gradientPathId = useMemo(() => `beam-gradient-${gradientId}`, [gradientId])

  if (!pathDefinition) {
    return null
  }

  return (
    <div className={cn("pointer-events-none absolute inset-0", className)}>
      <svg className="h-full w-full" fill="none">
        <defs>
          <linearGradient id={gradientPathId} gradientUnits="userSpaceOnUse">
            <stop stopColor={gradientStartColor} />
            <stop offset="1" stopColor={gradientStopColor} />
          </linearGradient>
        </defs>

        <path
          d={pathDefinition}
          stroke={pathColor}
          strokeWidth={pathWidth}
          strokeOpacity={pathOpacity * 0.4}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <motion.path
          d={pathDefinition}
          stroke={`url(#${gradientPathId})`}
          strokeWidth={pathWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{
            duration,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "linear",
            delay,
          }}
        />
      </svg>
    </div>
  )
}

