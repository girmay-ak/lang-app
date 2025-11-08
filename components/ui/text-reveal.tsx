"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

interface TextRevealProps extends React.HTMLAttributes<HTMLSpanElement> {
  text: string
  as?: keyof JSX.IntrinsicElements
  delay?: number
}

export function TextReveal({
  text,
  className,
  as: Component = "span",
  delay = 0,
  ...props
}: TextRevealProps) {
  const [isVisible, setIsVisible] = React.useState(false)

  React.useEffect(() => {
    const timeout = setTimeout(() => setIsVisible(true), delay)
    return () => clearTimeout(timeout)
  }, [delay])

  return (
    <Component
      className={cn("reveal-text", isVisible && "is-visible", className)}
      style={{ transitionDelay: `${delay}ms` }}
      {...props}
    >
      {text}
    </Component>
  )
}

