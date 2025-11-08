"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"

import { cn } from "@/lib/utils"

export interface ShimmerButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
}

export const ShimmerButton = React.forwardRef<HTMLButtonElement, ShimmerButtonProps>(
  ({ className, asChild = false, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"

    return (
      <Comp
        ref={ref}
        className={cn(
          "group relative inline-flex items-center justify-center overflow-hidden rounded-full border border-white/20 bg-gradient-to-r from-indigo-600 via-sky-500 to-purple-600 px-6 py-3 text-sm font-semibold uppercase tracking-wider text-white shadow-lg shadow-indigo-500/30 transition-all duration-300 hover:scale-105 hover:shadow-indigo-500/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/70 focus-visible:ring-offset-4 focus-visible:ring-offset-slate-950",
          className
        )}
        {...props}
      >
        <span className="relative flex w-full items-center justify-center">
          <span className="absolute inset-0 z-0 opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-100">
            <span className="absolute inset-0 bg-gradient-to-r from-cyan-400/40 via-white/40 to-fuchsia-400/40 blur-xl" />
          </span>
          <span className="absolute inset-0 z-0 -translate-x-full rounded-full bg-white/40 mix-blend-screen shimmer-sheen" />
          <span className="relative z-[1] flex items-center gap-2">{children}</span>
        </span>
      </Comp>
    )
  }
)

ShimmerButton.displayName = "ShimmerButton"

