"use client"

import { motion, useIsPresent } from "framer-motion"

import { cn } from "@/lib/utils"

type AnimatedLanguageListProps = {
  items: Array<{
    title: string
    description: string
    accent?: string
    icon?: React.ReactNode
  }>
  className?: string
}

export function AnimatedLanguageList({ items, className }: AnimatedLanguageListProps) {
  const isPresent = useIsPresent()

  return (
    <div className={cn("relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur", className)}>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#0b1120] via-transparent to-transparent opacity-80" />
      <motion.ul
        className="grid gap-4"
        initial="hidden"
        whileInView="visible"
        transition={{ staggerChildren: 0.12 }}
        viewport={{ once: true, amount: 0.4 }}
      >
        {items.map((item, index) => (
          <motion.li
            key={item.title}
            className="group relative flex items-start gap-4 rounded-2xl border border-white/10 bg-white/10 p-4 text-left text-white/80 shadow shadow-[#312e81]/20 transition hover:border-white/30 hover:bg-white/15"
            variants={{
              hidden: { opacity: 0, y: 18 },
              visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 140, damping: 18 } },
            }}
          >
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-white">
              {item.icon ?? `0${index + 1}`}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                {item.accent ? (
                  <span className="rounded-full bg-[#7c3aed]/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#c084fc]">
                    {item.accent}
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-sm text-slate-200/80">{item.description}</p>
            </div>
            <motion.span
              aria-hidden="true"
              className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 transition group-hover:opacity-100"
              animate={
                isPresent
                  ? {
                      backgroundPosition: ["0% 50%", "100% 50%"],
                    }
                  : {}
              }
              transition={{ duration: 2.4, repeat: Infinity, ease: "linear" }}
            />
          </motion.li>
        ))}
      </motion.ul>
    </div>
  )
}

