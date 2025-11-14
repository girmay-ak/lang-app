"use client"

import { Check, ChevronDown, Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export type Language = {
  code: string
  name: string
  flag: string
}

interface LanguagePickerProps {
  title: string
  description: string
  placeholder: string
  open: boolean
  setOpen: (value: boolean) => void
  selected: Language[]
  onAdd: (code: string) => void
  onRemove: (code: string) => void
  emptyLabel: string
  languages: Language[]
}

export function LanguagePicker({
  title,
  description,
  placeholder,
  open,
  setOpen,
  selected,
  onAdd,
  onRemove,
  emptyLabel,
  languages,
}: LanguagePickerProps) {
  return (
    <div className="space-y-4 rounded-3xl border border-white/12 bg-white/8 p-6">
      <div>
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <p className="mt-1 text-sm text-white/65">{description}</p>
      </div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="h-12 w-full justify-between rounded-2xl border border-white/15 bg-black/10 px-4 text-sm text-white/80 hover:bg-white/10"
          >
            <span className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              {placeholder}
            </span>
            <ChevronDown className="h-4 w-4 opacity-60" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[min(380px,90vw)] overflow-hidden rounded-xl border border-white/10 bg-[#040720]/95 p-0 shadow-2xl backdrop-blur-xl">
          <Command>
            <CommandInput placeholder="Search languages..." className="border-b border-white/10" />
            <CommandList className="max-h-64">
              <CommandEmpty className="py-5 text-sm text-white/60">No language found.</CommandEmpty>
              <CommandGroup>
                {languages.map((language) => (
                  <CommandItem
                    key={language.code}
                    value={language.name}
                    onSelect={() => onAdd(language.code)}
                    className="flex items-center gap-4 px-5 py-3 text-white/85"
                  >
                    <span className="text-xl">{language.flag}</span>
                    <span className="flex-1 text-sm">{language.name}</span>
                    {selected.some((item) => item.code === language.code) && <Check className="h-4 w-4 text-emerald-400" />}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selected.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {selected.map((language) => (
            <div
              key={language.code}
              className="group inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs text-white transition hover:border-white/30 hover:bg-white/15"
            >
              <span className="text-lg">{language.flag}</span>
              <span className="font-medium">{language.name}</span>
              <button
                onClick={() => onRemove(language.code)}
                className="rounded-full bg-white/0 p-1 text-white/60 transition group-hover:bg-white/15 group-hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-white/55">{emptyLabel}</p>
      )}
    </div>
  )
}

