import { AnimatePresence, motion, useMotionValue, useTransform } from "framer-motion"
import { useCallback, useEffect, useMemo } from "react"

import { MapPin, Zap } from "lucide-react"

import type { ProfileCardProfile } from "./profile-card"

interface ProfileCarouselProps {
  profiles: ProfileCardProfile[]
  activeIndex: number
  onNext: () => void
  onPrev: () => void
  onSelect: (index: number) => void
  direction: number
  meta: {
    distanceLabel?: string
    timeToMeetLabel?: string
    ratingValue?: string
    reviewCountLabel?: number
    isOnline: boolean
    badgeTitle?: string
    badgeSubtitle?: string
    ratingSummary?: string
  }
}

interface CarouselItem {
  profile: ProfileCardProfile
  index: number
  offset: -1 | 0 | 1
}

export function ProfileCarousel({
  profiles,
  activeIndex,
  onNext,
  onPrev,
  onSelect,
  direction,
  meta,
}: ProfileCarouselProps) {
  const items = useMemo<CarouselItem[]>(() => {
    if (!profiles.length) return []
    const prevIndex = (activeIndex - 1 + profiles.length) % profiles.length
    const nextIndex = (activeIndex + 1) % profiles.length

    return [
      { profile: profiles[prevIndex], index: prevIndex, offset: -1 },
      { profile: profiles[activeIndex], index: activeIndex, offset: 0 },
      { profile: profiles[nextIndex], index: nextIndex, offset: 1 },
    ]
  }, [profiles, activeIndex])

  const centerProfile = items.find((item) => item.offset === 0)?.profile

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault()
        onPrev()
      } else if (event.key === "ArrowRight") {
        event.preventDefault()
        onNext()
      }
    },
    [onNext, onPrev],
  )

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])

  if (!centerProfile) {
    return null
  }

  const centerX = useMotionValue(0)
  const rotateY = useTransform(centerX, [-220, 0, 220], ["15deg", "0deg", "-15deg"])

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: { offset: { x: number } }) => {
    if (info.offset.x > 140) {
      onPrev()
    } else if (info.offset.x < -140) {
      onNext()
    }
  }

  return (
    <div className="relative flex w-full flex-col items-center justify-center">
      <div className="pointer-events-none absolute inset-0 mx-auto max-w-[520px] rounded-[36px] bg-gradient-to-b from-white/5 via-transparent to-transparent blur-3xl" />

      <div className="relative flex w-full items-center justify-center py-10">
        {/* Side cards */}
        {items
          .filter((item) => item.offset !== 0)
          .map((item) => {
            const isLeft = item.offset === -1
            return (
              <motion.button
                key={item.profile.id}
                type="button"
                className={`group absolute hidden h-[170px] w-[170px] -translate-y-6 items-center justify-center rounded-[32px] border border-white/10 bg-gradient-to-br from-white/5 to-white/0 shadow-[0_18px_40px_rgba(10,14,35,0.45)] backdrop-blur filter blur-sm hover:blur-0 xl:flex ${
                  isLeft ? "-left-12" : "-right-12"
                }`}
                onClick={() => onSelect(item.index)}
                initial={{ scale: 0.4, opacity: 0.4 }}
                animate={{ scale: 0.52, opacity: 0.55 }}
                whileHover={{ scale: 0.6, opacity: 0.8 }}
                transition={{ type: "spring", stiffness: 220, damping: 20 }}
              >
                <div className="flex flex-col items-center gap-3 text-white/80">
                  <div className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-slate-700 to-slate-900 shadow-[0_12px_30px_rgba(8,8,16,0.65)]">
                    {item.profile.avatarUrl ? (
                      <img src={item.profile.avatarUrl} alt={item.profile.displayName} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-2xl">{item.profile.avatar ?? item.profile.flag ?? "👤"}</span>
                    )}
                    <div className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-white/10 ring-offset-4 ring-offset-black/20" />
                  </div>
                  <div className="text-center text-xs font-semibold uppercase tracking-[0.3em] text-white/40">Preview</div>
                  <div className="text-sm font-semibold text-white/80">{item.profile.displayName}</div>
                </div>
              </motion.button>
            )
          })}

        {/* Center card */}
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={centerProfile.id}
            custom={direction}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            style={{ x: centerX, rotateY }}
            onDragEnd={handleDragEnd}
            initial={{ x: direction === 0 ? 0 : direction > 0 ? 220 : -220, scale: 0.8, opacity: 0, rotateY: direction > 0 ? -20 : 20 }}
            animate={{ x: 0, scale: 1, opacity: 1, rotateY: 0 }}
            exit={{ x: direction >= 0 ? -220 : 220, scale: 0.8, opacity: 0, rotateY: direction >= 0 ? 20 : -20 }}
            transition={{ type: "spring", stiffness: 200, damping: 26 }}
            className="relative w-full max-w-[420px] rounded-[32px] border border-white/10 bg-[linear-gradient(145deg,#171922,#10121c)] px-8 pb-12 pt-10 text-center shadow-[0_24px_70px_rgba(8,12,30,0.65)]"
          >
            <motion.div
              className="pointer-events-none absolute inset-0 rounded-[32px] bg-gradient-to-b from-white/10 via-transparent to-transparent opacity-60"
              style={{ rotateY }}
            />

            <div className="relative mx-auto h-32 w-32">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#00D9FF] to-[#667EEA] opacity-70 blur-[18px]" />
              <div className="relative flex h-full w-full items-center justify-center rounded-full bg-[#0f1724] ring-4 ring-white/10">
                {centerProfile.avatarUrl ? (
                  <img src={centerProfile.avatarUrl} alt={centerProfile.displayName} className="h-full w-full rounded-full object-cover" />
                ) : (
                  <span className="text-4xl font-semibold text-white">{centerProfile.avatar ?? centerProfile.displayName.charAt(0)}</span>
                )}
                {meta.isOnline && (
                  <span className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-2 border-[#11121c] bg-[#00FF88] shadow-[0_0_16px_rgba(0,255,136,0.75)]" />
                )}
              </div>
            </div>

            <div className="mt-3 flex flex-col items-center gap-2">
              {meta.badgeTitle && (
                <span className="rounded-full border border-white/15 bg-white/10 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-white/70">
                  {meta.badgeTitle}
                </span>
              )}
              {meta.badgeSubtitle && <span className="text-xs text-white/55">{meta.badgeSubtitle}</span>}
            </div>

            <div className="mt-6 flex flex-col items-center gap-1">
              <span className="text-xs font-semibold uppercase tracking-[0.3em] text-white/40">Handle</span>
              <span className="text-sm text-white/65">{centerProfile.username}</span>
              <h2 className="mt-1 text-[28px] font-semibold text-white sm:text-[30px]">{centerProfile.displayName}</h2>
            </div>

            <div className="mt-4 flex items-center justify-center gap-3 text-sm text-white/75 sm:text-base">
              {meta.distanceLabel && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4 text-white/60" />
                  {meta.distanceLabel}
                </span>
              )}
              {meta.distanceLabel && meta.timeToMeetLabel && <span className="text-white/40">•</span>}
              {meta.timeToMeetLabel && (
                <span className="flex items-center gap-1 text-[#00FF88]">
                  <Zap className="h-4 w-4" />
                  {meta.timeToMeetLabel}
                </span>
              )}
            </div>

            {(meta.ratingValue || typeof meta.reviewCountLabel === "number" || meta.ratingSummary) && (
              <div className="mt-5 flex flex-col items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-6 py-4 text-center text-xs text-white/80">
                {meta.ratingValue && (
                  <span className="text-base font-semibold text-white">
                    ⭐ {meta.ratingValue.replace(/[★]/g, "").trim() || "4.8"}
                  </span>
                )}
                <span className="uppercase tracking-[0.25em] text-white/45">
                  {meta.ratingSummary
                    ? meta.ratingSummary
                    : typeof meta.reviewCountLabel === "number"
                    ? `Based on ${meta.reviewCountLabel} review${meta.reviewCountLabel === 1 ? "" : "s"}`
                    : "No reviews yet"}
                </span>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-6 flex items-center justify-between gap-6 text-xs text-white/50 sm:text-sm">
        <button type="button" onClick={onPrev} className="rounded-full border border-white/15 px-4 py-2 transition hover:bg-white/10">
          ← Previous
        </button>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        <button type="button" onClick={onNext} className="rounded-full border border-white/15 px-4 py-2 transition hover:bg-white/10">
          Next →
        </button>
      </div>
    </div>
  )
}

export default ProfileCarousel

