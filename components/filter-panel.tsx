"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"

interface FilterPanelProps {
  isOpen: boolean
  onClose: () => void
}

export function FilterPanel({ isOpen, onClose }: FilterPanelProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [distance, setDistance] = useState([2.5])
  const [rating, setRating] = useState([4])
  const [ageRange, setAgeRange] = useState<[number, number]>([22, 35])
  const [availability, setAvailability] = useState({ now: true, today: false, week: false })
  const [levels, setLevels] = useState({ beginner: false, intermediate: true, advanced: true, native: false })
  const [userTypes, setUserTypes] = useState({ verified: true, premium: false, new: false })
  const [times, setTimes] = useState({ morning: false, afternoon: true, evening: true, lateNight: false })
  const [locations, setLocations] = useState({ cafe: true, library: true, park: false, online: false })
  const [professions, setProfessions] = useState({ tutor: false, student: false, professional: false, any: true })
  const [goals, setGoals] = useState({ conversational: false, business: false, travel: false, exam: false, fun: false })
  const [interests, setInterests] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<"distance" | "rating" | "activity" | "match" | "recent">("distance")
  const [nativeLanguages, setNativeLanguages] = useState<string[]>(["🇳🇱 Dutch", "🇩🇪 German"])
  const [learningLanguages, setLearningLanguages] = useState<string[]>(["🇬🇧 English", "🇪🇸 Spanish"])

  const interestOptions = useMemo(
    () => ["Sports", "Music", "Gaming", "Art", "Tech", "Travel", "Food", "Books", "Movies"],
    [],
  )
  const languageOptions = useMemo(
    () => ["🇳🇱 Dutch", "🇬🇧 English", "🇩🇪 German", "🇪🇸 Spanish", "🇫🇷 French", "🇯🇵 Japanese", "🇰🇷 Korean", "🇨🇳 Mandarin"],
    [],
  )

  const toggleChip = (value: string, collection: string[], setter: (next: string[]) => void) => {
    setter(collection.includes(value) ? collection.filter((item) => item !== value) : [...collection, value])
  }

  const handleClearAll = () => {
    setSearchTerm("")
    setDistance([2.5])
    setRating([4])
    setAgeRange([22, 35])
    setAvailability({ now: true, today: false, week: false })
    setLevels({ beginner: false, intermediate: true, advanced: true, native: false })
    setUserTypes({ verified: true, premium: false, new: false })
    setTimes({ morning: false, afternoon: true, evening: true, lateNight: false })
    setLocations({ cafe: true, library: true, park: false, online: false })
    setProfessions({ tutor: false, student: false, professional: false, any: true })
    setGoals({ conversational: false, business: false, travel: false, exam: false, fun: false })
    setInterests([])
    setSortBy("distance")
    setNativeLanguages(["🇳🇱 Dutch", "🇩🇪 German"])
    setLearningLanguages(["🇬🇧 English", "🇪🇸 Spanish"])
  }

  if (!isOpen) return null

  const matchedCount = 12

  return (
    <>
      <div className="fixed inset-0 z-[3200] bg-gradient-to-br from-[#0c0d14f2] via-[#101224d9] to-[#0d101d] backdrop-blur-[10px]" />
      <div className="fixed inset-0 z-[3201] flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="relative flex h-full w-full max-w-3xl flex-col overflow-hidden rounded-[28px] border border-white/12 bg-[#1A1A1A]/95 shadow-[0_60px_140px_rgba(5,8,25,0.7)]">
          <div className="flex items-start justify-between border-b border-white/10 px-8 py-7">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/45">Explorer Toolkit</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Advanced Search</h2>
            </div>
            <div className="flex gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClearAll}
                className="h-11 w-11 rounded-full border border-white/12 bg-[#24242f] text-[#5eead4] shadow-[0_12px_28px_rgba(10,14,28,0.55)] transition hover:bg-[#2d2d37]"
              >
                ↻
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-11 w-11 rounded-full border border-white/12 bg-[#24242f] text-white/70 transition hover:bg-[#2d2d37]"
              >
                ✕
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-8 py-6 sm:px-10">
            <div className="grid gap-6">
              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.3em] text-white/50">Search</label>
                <div className="mt-3 flex items-center rounded-2xl border border-white/12 bg-[#222231]/85 px-4 py-3 text-white shadow-[0_20px_60px_rgba(6,10,25,0.55)]">
                  <span className="text-lg text-[#7bdcff]">🔍</span>
                  <input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search by name, language, goals…"
                    className="ml-3 w-full bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <section className="rounded-2xl border border-white/10 bg-[#20212b]/85 p-5 shadow-[0_16px_45px_rgba(5,8,25,0.45)]">
                  <header className="flex items-center justify-between text-white">
                    <span className="text-sm font-semibold">📏 Distance</span>
                    <span className="text-sm font-semibold text-[#5eead4]">{distance[0].toFixed(1)} km</span>
                  </header>
                  <p className="mt-2 text-xs uppercase tracking-[0.25em] text-white/40">0.5 km – 10 km</p>
                  <div className="mt-6">
                    <Slider value={distance} onValueChange={setDistance} max={10} min={0.5} step={0.1} />
                  </div>
                </section>

                <section className="rounded-2xl border border-white/10 bg-[#20212b]/85 p-5 shadow-[0_16px_45px_rgba(5,8,25,0.45)]">
                  <header className="flex items-center justify-between text-white">
                    <span className="text-sm font-semibold">⭐ Minimum Rating</span>
                    <span className="text-sm font-semibold text-[#fcd34d]">{rating[0].toFixed(1)}★</span>
                  </header>
                  <p className="mt-2 text-xs uppercase tracking-[0.25em] text-white/40">0.0 – 5.0</p>
                  <div className="mt-6">
                    <Slider value={rating} onValueChange={setRating} max={5} min={0} step={0.1} />
                  </div>
                </section>
              </div>

              <section className="grid gap-6 rounded-2xl border border-white/10 bg-[#20212b]/85 p-5 shadow-[0_16px_45px_rgba(5,8,25,0.45)] sm:grid-cols-2">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-white/50">🗣️ Native Languages</h3>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {languageOptions.map((language) => (
                      <button
                        key={`native-${language}`}
                        type="button"
                        onClick={() => toggleChip(language, nativeLanguages, setNativeLanguages)}
                        className={cn(
                          "rounded-2xl border px-3 py-1.5 text-sm font-medium transition",
                          nativeLanguages.includes(language)
                            ? "border-[#00d9ff] bg-[#14303d] text-[#7bdcff] shadow-[0_10px_25px_rgba(11,40,60,0.55)]"
                            : "border-white/10 bg-[#1a1b23] text-white/50 hover:border-white/25",
                        )}
                      >
                        {language}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-white/50">🎯 Learning Languages</h3>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {languageOptions.map((language) => (
                      <button
                        key={`learning-${language}`}
                        type="button"
                        onClick={() => toggleChip(language, learningLanguages, setLearningLanguages)}
                        className={cn(
                          "rounded-2xl border px-3 py-1.5 text-sm font-medium transition",
                          learningLanguages.includes(language)
                            ? "border-[#667EEA] bg-[#1f1f2e] text-[#aab3ff] shadow-[0_10px_25px_rgba(20,30,70,0.55)]"
                            : "border-white/10 bg-[#1a1b23] text-white/50 hover:border-white/25",
                        )}
                      >
                        {language}
                      </button>
                    ))}
                  </div>
                </div>
              </section>

              <section className="grid gap-6 rounded-2xl border border-white/10 bg-[#20212b]/85 p-5 shadow-[0_16px_45px_rgba(5,8,25,0.45)] sm:grid-cols-2">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-white/50">🎯 Proficiency Level</h3>
                  <div className="mt-4 space-y-3 text-white">
                    {[
                      ["Beginner", "beginner"],
                      ["Intermediate", "intermediate"],
                      ["Advanced", "advanced"],
                      ["Native", "native"],
                    ].map(([label, key]) => (
                      <label
                        key={key}
                        className={cn(
                          "flex items-center gap-3 rounded-2xl border p-3 transition",
                          (levels as any)[key]
                            ? "border-[#00d9ff] bg-[#173043]/90"
                            : "border-white/10 bg-[#1a1b23]/80",
                        )}
                      >
                        <Checkbox
                          checked={(levels as any)[key]}
                          onCheckedChange={(checked) => setLevels((prev) => ({ ...prev, [key]: Boolean(checked) }))}
                          className="data-[state=checked]:bg-[#00d9ff] data-[state=checked]:border-[#00d9ff]"
                        />
                        <span className="text-sm font-medium">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-white/50">📅 Availability</h3>
                  <div className="mt-4 space-y-3 text-white">
                    {[
                      ["Available now", "now"],
                      ["Available today", "today"],
                      ["Available this week", "week"],
                    ].map(([label, key]) => (
                      <label
                        key={key}
                        className={cn(
                          "flex items-center gap-3 rounded-2xl border p-3 transition",
                          (availability as any)[key]
                            ? "border-[#5eead4] bg-[#123837]/90"
                            : "border-white/10 bg-[#1a1b23]/80",
                        )}
                      >
                        <Checkbox
                          checked={(availability as any)[key]}
                          onCheckedChange={(checked) =>
                            setAvailability((prev) => ({ ...prev, [key]: Boolean(checked) }))
                          }
                          className="data-[state=checked]:bg-[#5eead4] data-[state=checked]:border-[#5eead4]"
                        />
                        <span className="text-sm font-medium">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </section>

              <section className="grid gap-6 rounded-2xl border border-white/10 bg-[#20212b]/85 p-5 shadow-[0_16px_45px_rgba(5,8,25,0.45)] sm:grid-cols-2">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-white/50">👤 User Type</h3>
                  <div className="mt-4 space-y-3 text-white">
                    {[
                      ["Verified users only", "verified"],
                      ["Premium users only", "premium"],
                      ["New users (joined < 30 days)", "new"],
                    ].map(([label, key]) => (
                      <label
                        key={key}
                        className={cn(
                          "flex items-center gap-3 rounded-2xl border p-3 transition",
                          (userTypes as any)[key]
                            ? "border-[#facc15] bg-[#2d2712]/90"
                            : "border-white/10 bg-[#1a1b23]/80",
                        )}
                      >
                        <Checkbox
                          checked={(userTypes as any)[key]}
                          onCheckedChange={(checked) => setUserTypes((prev) => ({ ...prev, [key]: Boolean(checked) }))}
                          className="data-[state=checked]:bg-[#facc15] data-[state=checked]:border-[#facc15]"
                        />
                        <span className="text-sm font-medium">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-white/50">🎂 Age Range</h3>
                  <p className="mt-2 text-sm text-white/70">
                    {ageRange[0]} – {ageRange[1]}
                  </p>
                  <div className="mt-6">
                    <Slider
                      value={ageRange}
                      onValueChange={(value) => setAgeRange(value as [number, number])}
                      max={65}
                      min={18}
                      step={1}
                    />
                  </div>
                </div>
              </section>

              <section className="grid gap-6 rounded-2xl border border-white/10 bg-[#20212b]/85 p-5 shadow-[0_16px_45px_rgba(5,8,25,0.45)] sm:grid-cols-2">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-white/50">💼 Profession</h3>
                  <div className="mt-4 space-y-3 text-white">
                    {[
                      ["Teacher / Tutor", "tutor"],
                      ["Student", "student"],
                      ["Professional", "professional"],
                      ["Any", "any"],
                    ].map(([label, key]) => (
                      <label
                        key={key}
                        className={cn(
                          "flex items-center gap-3 rounded-2xl border p-3 transition",
                          (professions as any)[key]
                            ? "border-[#67e8f9] bg-[#15303a]/90"
                            : "border-white/10 bg-[#1a1b23]/80",
                        )}
                      >
                        <Checkbox
                          checked={(professions as any)[key]}
                          onCheckedChange={(checked) => setProfessions((prev) => ({ ...prev, [key]: Boolean(checked) }))}
                          className="data-[state=checked]:bg-[#67e8f9] data-[state=checked]:border-[#67e8f9]"
                        />
                        <span className="text-sm font-medium">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-white/50">🎯 Learning Goals</h3>
                  <div className="mt-4 space-y-3 text-white">
                    {[
                      ["Conversational", "conversational"],
                      ["Business / Professional", "business"],
                      ["Travel preparation", "travel"],
                      ["Exam preparation", "exam"],
                      ["Just for fun", "fun"],
                    ].map(([label, key]) => (
                      <label
                        key={key}
                        className={cn(
                          "flex items-center gap-3 rounded-2xl border p-3 transition",
                          (goals as any)[key]
                            ? "border-[#fb7185] bg-[#321723]/90"
                            : "border-white/10 bg-[#1a1b23]/80",
                        )}
                      >
                        <Checkbox
                          checked={(goals as any)[key]}
                          onCheckedChange={(checked) => setGoals((prev) => ({ ...prev, [key]: Boolean(checked) }))}
                          className="data-[state=checked]:bg-[#fb7185] data-[state=checked]:border-[#fb7185]"
                        />
                        <span className="text-sm font-medium">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </section>

              <section className="grid gap-6 rounded-2xl border border-white/10 bg-[#20212b]/85 p-5 shadow-[0_16px_45px_rgba(5,8,25,0.45)] sm:grid-cols-2">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-white/50">⏰ Preferred Time</h3>
                  <div className="mt-4 space-y-3 text-white">
                    {[
                      ["Mornings (6am-12pm)", "morning"],
                      ["Afternoons (12pm-6pm)", "afternoon"],
                      ["Evenings (6pm-10pm)", "evening"],
                      ["Late night (10pm-6am)", "lateNight"],
                    ].map(([label, key]) => (
                      <label
                        key={key}
                        className={cn(
                          "flex items-center gap-3 rounded-2xl border p-3 transition",
                          (times as any)[key]
                            ? "border-[#c4b5fd] bg-[#221d3a]/90"
                            : "border-white/10 bg-[#1a1b23]/80",
                        )}
                      >
                        <Checkbox
                          checked={(times as any)[key]}
                          onCheckedChange={(checked) => setTimes((prev) => ({ ...prev, [key]: Boolean(checked) }))}
                          className="data-[state=checked]:bg-[#c4b5fd] data-[state=checked]:border-[#c4b5fd]"
                        />
                        <span className="text-sm font-medium">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-white/50">📍 Preferred Locations</h3>
                  <div className="mt-4 space-y-3 text-white">
                    {[
                      ["Coffee shops", "cafe"],
                      ["Libraries", "library"],
                      ["Parks", "park"],
                      ["Home / Online only", "online"],
                    ].map(([label, key]) => (
                      <label
                        key={key}
                        className={cn(
                          "flex items-center gap-3 rounded-2xl border p-3 transition",
                          (locations as any)[key]
                            ? "border-[#f97316] bg-[#2b1d14]/90"
                            : "border-white/10 bg-[#1a1b23]/80",
                        )}
                      >
                        <Checkbox
                          checked={(locations as any)[key]}
                          onCheckedChange={(checked) => setLocations((prev) => ({ ...prev, [key]: Boolean(checked) }))}
                          className="data-[state=checked]:bg-[#f97316] data-[state=checked]:border-[#f97316]"
                        />
                        <span className="text-sm font-medium">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-white/10 bg-[#20212b]/85 p-5 shadow-[0_16px_45px_rgba(5,8,25,0.45)]">
                <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-white/50">❤️ Interests</h3>
                <div className="mt-4 flex flex-wrap gap-2">
                  {interestOptions.map((interest) => (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => toggleChip(interest, interests, setInterests)}
                      className={cn(
                        "rounded-2xl border px-3 py-1.5 text-sm font-medium transition",
                        interests.includes(interest)
                          ? "border-[#f472b6] bg-[#31182b] text-[#f9a8d4] shadow-[0_10px_25px_rgba(70,20,60,0.55)]"
                          : "border-white/10 bg-[#1a1b23] text-white/50 hover:border-white/25",
                      )}
                    >
                      {interest}
                    </button>
                  ))}
                </div>
              </section>

              <section className="rounded-2xl border border-white/10 bg-[#20212b]/85 p-5 shadow-[0_16px_45px_rgba(5,8,25,0.45)]">
                <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-white/50">Sort By</h3>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {[
                    ["Distance (closest first)", "distance"],
                    ["Rating (highest first)", "rating"],
                    ["Activity (most active first)", "activity"],
                    ["Match % (best match first)", "match"],
                    ["Recently joined (newest first)", "recent"],
                  ].map(([label, key]) => (
                    <label
                      key={key}
                      className={cn(
                        "flex items-center gap-3 rounded-2xl border p-3 transition text-white",
                        sortBy === key ? "border-[#00d9ff] bg-[#13313d]/90" : "border-white/10 bg-[#1a1b23]/80",
                      )}
                    >
                      <input
                        type="radio"
                        name="sort"
                        value={key}
                        checked={sortBy === key}
                        onChange={() => setSortBy(key as typeof sortBy)}
                        className="h-4 w-4 cursor-pointer accent-[#00d9ff]"
                      />
                      <span className="text-sm font-medium">{label}</span>
                    </label>
                  ))}
                </div>
              </section>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-white/10 bg-[#18181f]/95 px-8 py-6">
            <p className="text-sm text-white/55">
              <span className="text-base font-semibold text-white">{matchedCount}</span> users match your filters
            </p>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                className="h-11 rounded-full border border-white/15 px-5 text-sm font-medium text-white/70 hover:text-white"
                onClick={handleClearAll}
              >
                Reset Filters
              </Button>
              <Button
                className="h-11 rounded-full bg-gradient-to-r from-[#00FF88] to-[#00D9FF] px-6 text-sm font-semibold text-slate-900 shadow-[0_14px_45px_rgba(0,255,136,0.35)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_55px_rgba(0,255,136,0.5)]"
                onClick={onClose}
              >
                Apply Filters
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
