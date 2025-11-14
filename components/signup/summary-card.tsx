"use client"

import type { Language } from "./language-picker"

interface SummaryCardProps {
  title: string
  items: Language[]
  placeholder: string
}

export function SummaryCard({ title, items, placeholder }: SummaryCardProps) {
  return (
    <div className="rounded-3xl border border-white/12 bg-white/8 p-6">
      <h4 className="text-base font-semibold text-white">{title}</h4>
      {items.length > 0 ? (
        <div className="mt-4 space-y-2 text-sm text-white/75">
          {items.map((language) => (
            <div key={language.code} className="flex items-center gap-3">
              <span className="text-lg">{language.flag}</span>
              <span>{language.name}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-white/55">{placeholder}</p>
      )}
    </div>
  )
}

