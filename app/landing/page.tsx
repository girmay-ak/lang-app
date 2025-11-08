"use client"

import Image from "next/image"
import type { ReactNode } from "react"
import { useRef } from "react"
import Link from "next/link"
import { ArrowRight, Globe2, MessageSquare, Sparkles, UsersRound } from "lucide-react"

import { AnimatedLanguageList } from "@/components/marketing/animated-language-list"
import { DottedMap } from "@/components/marketing/dotted-map"
import { LanguageDock } from "@/components/marketing/language-dock"
import { LanguageGlobe } from "@/components/marketing/language-globe"
import { OrbitingFlags } from "@/components/marketing/orbiting-flags"
import { AnimatedBeam } from "@/components/ui/animated-beam"
import { HyperspeedBackground } from "@/components/marketing/hyperspeed-background"

const hyperspeedEffectOptions = {
  distortion: "lightTunnel",
  lanesPerRoad: 3,
  roadWidth: 8,
  islandWidth: 1,
  totalSideLightSticks: 30,
  lightPairsPerRoadWay: 36,
  carLightsFade: 0.45,
  colors: {
    roadColor: 0x0f172a,
    islandColor: 0x111827,
    background: 0x1e293b,
    shoulderLines: 0x7c3aed,
    brokenLines: 0xa855f7,
    leftCars: [0x7c3aed, 0x9333ea, 0xf472b6],
    rightCars: [0x38bdf8, 0x22d3ee, 0xa855f7],
    sticks: 0xa855f7,
  },
}

type Stat = {
  label: string
  value: string
  suffix?: string
}

type Feature = {
  title: string
  description: string
  icon: ReactNode
}

const stats: Stat[] = [
  { label: "Conversations sparked this month", value: "128", suffix: "k+" },
  { label: "Cities with verified hosts", value: "220" },
  { label: "Average partner satisfaction", value: "97", suffix: "%" },
]

const features: Feature[] = [
  {
    title: "Instant, meaningful matches",
    description:
      "Tell us where you are, how you speak, and how you want to grow. Our intent engine brings the right people to you in seconds.",
    icon: <Sparkles className="h-6 w-6" />,
  },
  {
    title: "Anytime language adventures",
    description:
      "Drop into virtual lounges or meet at community hotspots--from Seoul rooftops to Lisbon espresso walks--in your own language.",
    icon: <Globe2 className="h-6 w-6" />,
  },
  {
    title: "Guided practice that sticks",
    description:
      "Use coach-crafted prompts, streak tracking, and cultural nuggets that keep every chat natural, fun, and memorable.",
    icon: <MessageSquare className="h-6 w-6" />,
  },
]

const travelMoments = [
  {
    title: "Travel doesn't have to be lonely",
    description:
      "Discover new cultures and make friends anywhere in the world. Speak your own language, connect with locals and travelers from any region, and turn every trip into a truly unique experience.",
  },
  {
    title: "Stay in the conversation",
    description:
      "Voice rooms, map-based meetups, and curated mini events keep you connected wherever you land--no awkward small talk required.",
  },
  {
    title: "Safety-first community",
    description:
      "Every profile is human-reviewed, with availability windows, moderators, and check-ins so you can explore with confidence.",
  },
]

const experienceHighlights = [
  {
    label: "Spark",
    title: "Create your orbit",
    copy: "Share your language mix, travel plans, and vibe. We'll match you with people who get it.",
  },
  {
    label: "Connect",
    title: "Practice anywhere",
    copy: "Meet in-app, on the ground, or in curated hubs. Guided prompts keep conversations flowing.",
  },
  {
    label: "Grow",
    title: "Celebrate every win",
    copy: "Earn badges, keep streaks alive, and store highlights from your best cross-cultural moments.",
  },
]

const heroMapNodes = [
  {
    id: "nyc",
    flag: "🇺🇸",
    city: "New York",
    pairing: "Jess • Carlos",
    languages: "English ↔ Spanish",
    top: "18%",
    left: "18%",
    gradient: ["#22d3ee", "#38bdf8"],
  },
  {
    id: "lisbon",
    flag: "🇵🇹",
    city: "Lisbon",
    pairing: "Rita • Kenji",
    languages: "Portuguese ↔ Japanese",
    top: "32%",
    left: "46%",
    gradient: ["#ec4899", "#f97316"],
  },
  {
    id: "nairobi",
    flag: "🇰🇪",
    city: "Nairobi",
    pairing: "Amina • Luca",
    languages: "Swahili ↔ Italian",
    top: "55%",
    left: "54%",
    gradient: ["#fbbf24", "#22d3ee"],
  },
  {
    id: "dubai",
    flag: "🇦🇪",
    city: "Dubai",
    pairing: "Omar • Elena",
    languages: "Arabic ↔ Russian",
    top: "28%",
    left: "70%",
    gradient: ["#a855f7", "#9333ea"],
  },
  {
    id: "seoul",
    flag: "🇰🇷",
    city: "Seoul",
    pairing: "Minji • Theo",
    languages: "Korean ↔ French",
    top: "48%",
    left: "80%",
    gradient: ["#38bdf8", "#c084fc"],
  },
  {
    id: "sao-paulo",
    flag: "🇧🇷",
    city: "São Paulo",
    pairing: "Luiza • Sam",
    languages: "Portuguese ↔ English",
    top: "68%",
    left: "34%",
    gradient: ["#22c55e", "#10b981"],
  },
]

const connectionColors = ["#38bdf8", "#a855f7", "#f472b6", "#22d3ee", "#fbbf24", "#10b981"]

const HeroWorldMap = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const hubRef = useRef<HTMLDivElement>(null)
  const nycRef = useRef<HTMLDivElement>(null)
  const lisbonRef = useRef<HTMLDivElement>(null)
  const nairobiRef = useRef<HTMLDivElement>(null)
  const dubaiRef = useRef<HTMLDivElement>(null)
  const seoulRef = useRef<HTMLDivElement>(null)
  const saoPauloRef = useRef<HTMLDivElement>(null)

  const nodes = [
    { ...heroMapNodes[0], ref: nycRef },
    { ...heroMapNodes[1], ref: lisbonRef },
    { ...heroMapNodes[2], ref: nairobiRef },
    { ...heroMapNodes[3], ref: dubaiRef },
    { ...heroMapNodes[4], ref: seoulRef },
    { ...heroMapNodes[5], ref: saoPauloRef },
  ]

  return (
    <div
      ref={containerRef}
      className="relative h-[360px] w-full overflow-hidden rounded-[3rem] border border-white/10 bg-[radial-gradient(circle_at_50%_0%,rgba(124,58,237,0.3),rgba(8,12,24,0.9))] p-6 shadow-[0_32px_90px_rgba(56,189,248,0.25)] backdrop-blur"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_left,rgba(14,165,233,0.25),transparent_55%)] opacity-70" />
      <div className="absolute inset-4 rounded-[2.4rem] border border-white/10" />

      <div className="absolute inset-6 grid grid-cols-[repeat(28,1fr)] grid-rows-[repeat(14,1fr)] gap-[3px] opacity-40">
        {Array.from({ length: 28 * 14 }).map((_, index) => (
          <div
            key={index}
            className="size-[3px] rounded-full bg-white/40"
            style={{
              opacity: 0.2 + ((index % 7) / 14),
            }}
          />
        ))}
      </div>

      <div
        ref={hubRef}
        className="absolute left-1/2 top-1/2 flex h-36 w-36 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-[2.5rem] border border-white/20 bg-gradient-to-br from-[#7c3aed]/40 via-[#9333ea]/35 to-[#22d3ee]/30 text-center text-white shadow-[0_20px_60px_rgba(124,58,237,0.35)] backdrop-blur"
      >
        <p className="text-lg font-semibold">You + Orbit</p>
        <p className="mt-2 text-xs text-white/80">Algorithm pairs you with native partners in real time.</p>
      </div>

      {nodes.map((node) => (
        <div
          key={node.id}
          ref={node.ref}
          className="absolute flex w-36 flex-col items-center text-center text-xs text-white"
          style={{ top: node.top, left: node.left }}
        >
          <span
            className="flex h-14 w-14 items-center justify-center rounded-full border border-white/20 text-2xl shadow-lg shadow-[#38bdf8]/30"
            style={{
              background: "rgba(15,23,42,0.6)",
            }}
          >
            {node.flag}
          </span>
          <div className="mt-2 rounded-full bg-black/50 px-3 py-1 text-[10px] uppercase tracking-wide">{node.city}</div>
          <div className="mt-2 w-full rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-[10px] uppercase tracking-wide text-white/70">
            {node.languages}
          </div>
          <div className="mt-1 text-[11px] text-[#c4b5fd]">{node.pairing}</div>
        </div>
      ))}

      {nodes.map((node, index) => (
        <AnimatedBeam
          key={node.id}
          containerRef={containerRef}
          fromRef={node.ref}
          toRef={hubRef}
          curvature={index % 2 === 0 ? 60 : -70}
          pathWidth={3}
          gradientStartColor={connectionColors[index % connectionColors.length]}
          gradientStopColor={node.gradient[1]}
          pathOpacity={0.6}
          delay={index * 0.35}
        />
      ))}

      <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1 text-center text-xs text-white/70">
        <span className="text-sm font-semibold text-white">Live matches in your orbit</span>
        <span>Each beam shows a mutual interest that connected partners this minute.</span>
      </div>
    </div>
  )
}

const LanguageBeamShowcase = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const hubRef = useRef<HTMLDivElement>(null)
  const spanishRef = useRef<HTMLDivElement>(null)
  const koreanRef = useRef<HTMLDivElement>(null)
  const portugueseRef = useRef<HTMLDivElement>(null)
  const arabicRef = useRef<HTMLDivElement>(null)

  const circleClass =
    "flex h-24 w-24 flex-col items-center justify-center rounded-full border border-white/15 bg-white/10 text-sm font-semibold text-white shadow-lg shadow-[#6366f1]/20 backdrop-blur"

  return (
    <div
      ref={containerRef}
      className="relative isolate mx-auto flex h-[320px] w-full max-w-4xl flex-col justify-center overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/5 p-8 shadow-[0_30px_80px_rgba(99,102,241,0.35)] backdrop-blur"
    >
      <div className="flex h-full w-full items-center justify-between">
        <div className="flex h-full flex-col justify-between">
          <div ref={spanishRef} className={circleClass}>
            <span className="text-2xl">🇪🇸</span>
            <span>Madrid</span>
          </div>
          <div ref={koreanRef} className={circleClass}>
            <span className="text-2xl">🇰🇷</span>
            <span>Seoul</span>
          </div>
        </div>

        <div className="flex h-full flex-col justify-center">
          <div
            ref={hubRef}
            className="flex h-40 w-40 flex-col items-center justify-center rounded-[3rem] border border-white/20 bg-gradient-to-br from-[#7c3aed]/40 via-[#9333ea]/40 to-[#0ea5e9]/40 text-center text-white shadow-[0_20px_50px_rgba(124,58,237,0.35)] backdrop-blur"
          >
            <p className="text-lg font-semibold">Orbit Hub</p>
            <p className="mt-1 text-xs text-white/80">Live matches & prompts</p>
          </div>
        </div>

        <div className="flex h-full flex-col justify-between">
          <div ref={portugueseRef} className={circleClass}>
            <span className="text-2xl">🇵🇹</span>
            <span>Lisbon</span>
          </div>
          <div ref={arabicRef} className={circleClass}>
            <span className="text-2xl">🇦🇪</span>
            <span>Dubai</span>
          </div>
        </div>
      </div>

      <AnimatedBeam
        containerRef={containerRef}
        fromRef={spanishRef}
        toRef={hubRef}
        curvature={-80}
        pathWidth={3}
        gradientStartColor="#f97316"
        gradientStopColor="#f472b6"
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={koreanRef}
        toRef={hubRef}
        curvature={60}
        pathWidth={3}
        gradientStartColor="#22d3ee"
        gradientStopColor="#a855f7"
        delay={0.6}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={portugueseRef}
        toRef={hubRef}
        curvature={-50}
        pathWidth={3}
        gradientStartColor="#38bdf8"
        gradientStopColor="#c084fc"
        delay={1.2}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={arabicRef}
        toRef={hubRef}
        curvature={70}
        pathWidth={3}
        gradientStartColor="#ef4444"
        gradientStopColor="#fbbf24"
        delay={1.8}
      />

      <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 flex-col items-center text-center text-xs text-white/70">
        <span className="text-sm font-semibold text-white">Lightspeed practice</span>
        <span>Beams represent conversation prompts traveling between live sessions.</span>
      </div>
    </div>
  )
}

export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0b1120] text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(124,58,237,0.35)_0%,rgba(15,23,42,0.9)_45%,rgba(8,12,24,1)_100%)]" />
      <div className="pointer-events-none absolute -left-32 top-28 h-72 w-72 rounded-full bg-gradient-to-br from-[#a855f7] via-[#7c3aed] to-transparent opacity-40 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 bottom-40 h-80 w-80 rounded-full bg-gradient-to-br from-[#22d3ee] via-[#6366f1] to-transparent opacity-30 blur-[140px]" />

      <header className="relative overflow-hidden pt-16 pb-16 md:pb-24">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f172a] via-[#111827] to-[#1e293b]" />
        <HyperspeedBackground
          className="pointer-events-none absolute inset-0 opacity-40 mix-blend-screen"
          effectOptions={hyperspeedEffectOptions}
        />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#0b1220] to-transparent" />

        <nav className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-6 md:px-10 lg:px-12">
          <Link href="/" className="inline-flex items-center gap-2 text-white">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-lg font-semibold shadow-lg shadow-[#7c3aed]/30">
              LF
            </div>
            <div className="hidden flex-col leading-tight sm:flex">
              <span className="text-sm font-semibold uppercase tracking-[0.3em] text-white/70">Language</span>
              <span className="text-lg font-semibold text-white">Flag Exchange</span>
            </div>
          </Link>
          <div className="hidden items-center gap-8 text-sm font-medium text-white/70 md:flex">
            <Link href="#experience" className="transition hover:text-white">
              Experience
            </Link>
            <Link href="#community" className="transition hover:text-white">
              Community
            </Link>
            <Link href="#cta" className="transition hover:text-white">
              Join Us
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/auth/login"
              className="hidden rounded-full border border-white/20 px-5 py-2 text-sm font-semibold text-white/80 transition hover:border-white/40 hover:text-white md:inline-flex"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-full bg-white/10 px-6 py-2 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(124,58,237,0.35)] transition hover:bg-white/20"
            >
              Join waitlist
            </Link>
          </div>
        </nav>

        <div className="relative z-10 mx-auto mt-12 flex max-w-6xl flex-col gap-14 px-6 md:mt-16 md:flex-row md:items-center md:gap-16 md:px-10 lg:px-12">
          <div className="flex-1 space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.32em] text-white/70 backdrop-blur">
              <span className="relative flex h-6 w-6 items-center justify-center">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-40" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-sky-300" />
              </span>
              AI specialized in translation
            </div>

            <div className="space-y-6">
              <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-white md:text-5xl lg:text-6xl">
                ChatGPT will never help you as much as the people we bring together.
            </h1>
              <p className="max-w-lg text-lg text-slate-200">
                Build real connections with native speakers in every timezone. Discover new dialects, master slang, and
                uncover cultures through authentic conversations that feel like hanging out with friends.
            </p>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <Link
                href="/signup"
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#7c3aed] via-[#9333ea] to-[#ec4899] px-10 py-3 text-sm font-semibold text-white shadow-[0_20px_45px_rgba(124,58,237,0.45)] transition hover:-translate-y-1 hover:shadow-[0_30px_65px_rgba(236,72,153,0.45)]"
              >
                Join the waiting list
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </Link>
              <Link
                href="#how-it-feels"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 px-10 py-3 text-sm font-semibold text-white/80 backdrop-blur transition hover:bg-white/20 hover:text-white"
              >
                Explore the experience
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-5 pt-6">
              <div className="flex -space-x-3">
                {["/diverse-person-smiling.png", "/serene-asian-woman.png", "/man-glasses-beard.jpg", "/woman-pink.jpg", "/professional-woman.png"].map(
                  (avatar, index) => (
                    <div key={avatar} className="overflow-hidden rounded-full border-2 border-white shadow-md shadow-[#c084fc]/30">
                      <Image src={avatar} alt={`Community member ${index + 1}`} width={48} height={48} className="h-12 w-12 object-cover" />
                    </div>
                  ),
                )}
              </div>
              <p className="text-sm font-medium text-white/70">
                More than <span className="font-semibold text-white">100k</span> curious travelers practicing weekly.
              </p>
            </div>

            <div className="grid gap-4 pt-4 sm:grid-cols-3">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-3xl border border-white/10 bg-white/10 px-6 py-5 text-white shadow-lg shadow-[#6366f1]/20 backdrop-blur transition hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="text-3xl font-semibold">
                    {stat.value}
                    {stat.suffix ? <span className="pl-1 text-lg font-medium text-[#c4b5fd]">{stat.suffix}</span> : null}
                  </div>
                  <p className="mt-3 text-sm text-slate-200">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative flex-1">
            <HeroWorldMap />
          </div>
        </div>
      </header>

      <section className="relative z-10 mx-auto -mt-8 max-w-6xl px-6 pb-12 md:px-10 lg:px-12">
        <LanguageBeamShowcase />
      </section>

      <section id="experience" className="relative z-10 mx-auto max-w-6xl px-6 py-20 md:px-10 lg:px-12">
        <div className="grid gap-10 md:grid-cols-[1.1fr_0.9fr] md:items-start">
          <div className="space-y-6">
            <div className="space-y-4">
              <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-[#c4b5fd]">
                Curated practice loops
              </p>
              <h2 className="text-3xl font-semibold text-white md:text-4xl">Everything you need to make conversations flow.</h2>
              <p className="text-base text-slate-200">
                Rotating prompts, instant context, and playful challenges keep every session fresh. The animated list below mirrors what
                learners see in the app before jumping into a new exchange.
              </p>
            </div>

            <AnimatedLanguageList
              items={[
                {
                  title: "Tone-matching prompts",
                  description: "Adaptive suggestions that mirror your partner's vibe—professional, casual, or curious explorer.",
                },
                {
                  title: "Culture cards",
                  description: "Snippets about local food, idioms, and etiquette so you sound less like a phrasebook and more like a friend.",
                  accent: "New",
                },
                {
                  title: "Momentum streaks",
                  description: "Earn badges for every meaningful exchange and unlock next-city invites from our ambassadors.",
                },
              ]}
            />
          </div>

          <div className="space-y-6">
            <div className="rounded-[2.5rem] border border-white/10 bg-white/5 p-6 text-white shadow-[0_28px_70px_rgba(124,58,237,0.25)] backdrop-blur">
              <p className="text-xs uppercase tracking-[0.3em] text-white/60">Dock Preview</p>
              <h3 className="mt-3 text-xl font-semibold text-white">Tap an interest to shape your next match.</h3>
              <p className="mt-2 text-sm text-slate-200">
                Choose from interests or moods inside the dock to instantly filter language partners. We&apos;ll connect you with people who
                share the same energy.
              </p>
              <LanguageDock
                className="mt-6"
                items={[
                  { label: "Street Food", icon: "🍜", accent: "Seoul bites" },
                  { label: "Tech Talk", icon: "💡", accent: "Startups" },
                  { label: "Art Walks", icon: "🎨", accent: "Lisbon" },
                  { label: "Surf Crew", icon: "🌊", accent: "Rio" },
                  { label: "Night Owls", icon: "🌙", accent: "Late chat" },
                ]}
              />
            </div>

          </div>
        </div>
      </section>

      <section id="community" className="relative z-10 mx-auto max-w-6xl px-6 py-20 md:px-10 lg:px-12">
        <div className="grid gap-10 md:grid-cols-[1.05fr_0.95fr] md:items-center">
          <div className="space-y-6 md:pr-8">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-[#c4b5fd]">
              Global meetups
            </p>
            <h2 className="text-3xl font-semibold text-white md:text-4xl">In-person hosts and travel-ready friends.</h2>
            <p className="text-base text-slate-200">
              Drop a pin anywhere in the world and see who&apos;s available. Dotted view visualizes verified hosts and members ready for a
              language stroll, rooftop hang, or night market crawl.
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/10 p-5 shadow shadow-[#38bdf8]/20 backdrop-blur">
                <p className="text-3xl font-semibold text-white">92%</p>
                <p className="mt-1 text-sm text-slate-200">weekly host attendance with feedback above 4.8/5</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 p-5 shadow shadow-[#9333ea]/20 backdrop-blur">
                <p className="text-3xl font-semibold text-white">48</p>
                <p className="mt-1 text-sm text-slate-200">cities launching community micro-events next quarter</p>
              </div>
            </div>
          </div>

          <DottedMap className="md:ml-auto" />
        </div>
      </section>

      <section
        id="how-it-feels"
        className="relative z-10 border-y border-white/10 bg-gradient-to-br from-[#0f172a] via-[#111827] to-[#0b1120] py-20"
      >
        <div className="mx-auto flex max-w-6xl flex-col gap-12 px-6 md:flex-row md:px-10 lg:px-12">
          <div className="space-y-6 md:w-1/2">
            <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[#c4b5fd]">How it feels</p>
            <h2 className="text-3xl font-semibold text-white md:text-4xl">Practice that feels like play.</h2>
            <p className="text-base text-slate-200">
              We merge travel-inspired design, real-time availability, and AI-powered prompts so every session feels
              effortless. The result? Conversations you want to keep coming back to.
            </p>
            <div className="grid gap-6">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="grid gap-4 rounded-2xl border border-white/10 bg-white/10 p-5 shadow-md shadow-[#6366f1]/30 backdrop-blur sm:grid-cols-[auto_1fr]"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-[#c084fc]">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
                    <p className="mt-2 text-sm text-slate-200">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-8 md:w-1/2">
            <div className="rounded-[2rem] border border-white/10 bg-white/10 p-6 shadow-lg shadow-[#6366f1]/30 backdrop-blur">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f0fdf4]/10 text-emerald-400">
                  <UsersRound className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-300">Community snapshot</p>
                  <p className="text-sm font-semibold text-white">Global friends, real-time map</p>
                </div>
              </div>
              <div className="mt-6 rounded-2xl border border-white/10 bg-white/10 p-6">
                <div className="grid gap-4 text-xs text-slate-200">
                  <div className="flex items-center justify-between">
                    <span>New York City</span>
                    <span className="flex items-center gap-2 text-emerald-400">
                      <span className="h-2 w-2 rounded-full bg-emerald-400" />
                      6 online
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Lisbon</span>
                    <span className="flex items-center gap-2 text-emerald-400">
                      <span className="h-2 w-2 rounded-full bg-emerald-400" />
                      4 online
                        </span>
                      </div>
                  <div className="flex items-center justify-between">
                    <span>Seoul</span>
                    <span className="flex items-center gap-2 text-emerald-400">
                      <span className="h-2 w-2 rounded-full bg-emerald-400" />
                      8 online
                    </span>
                  </div>
                  <div className="flex rounded-xl border border-white/10 bg-white/10 p-3 text-slate-200">
                    <p>
                      "Met three new friends in NYC over tacos. Practiced Spanish, got local tips, and kept the group chat
                      going."
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/10 p-8 shadow-lg shadow-[#6366f1]/30 backdrop-blur">
              <div className="grid gap-6 md:grid-cols-3">
                {experienceHighlights.map((highlight) => (
                  <div key={highlight.label} className="space-y-3">
                    <div className="inline-flex rounded-full bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-[#c084fc]">
                      {highlight.label}
                    </div>
                    <h3 className="text-lg font-semibold text-white">{highlight.title}</h3>
                    <p className="text-sm text-slate-200">{highlight.copy}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-6xl px-6 py-20 md:px-10 lg:px-12">
        <div className="grid gap-10 md:grid-cols-2 md:items-center">
          <div className="space-y-6">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-[#c4b5fd]">
              Planet-scale practice
            </p>
            <h2 className="text-3xl font-semibold text-white md:text-4xl">Follow the flags and orbit with friends.</h2>
            <p className="text-base text-slate-200">
              The animated globe highlights live availability in major cities, while orbiting circles represent collaborative study groups
              cycling through prompts in real time.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 shadow shadow-[#38bdf8]/20 backdrop-blur">
                <p className="text-sm font-semibold text-white">Rotating crews</p>
                <p className="mt-1 text-xs text-slate-200">Stay in orbit with up to five friends practicing the same goals.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 shadow shadow-[#c084fc]/20 backdrop-blur">
                <p className="text-sm font-semibold text-white">Timezone aware</p>
                <p className="mt-1 text-xs text-slate-200">Beams update automatically as partners come online around the globe.</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-12">
            <LanguageGlobe />
            <OrbitingFlags />
          </div>
        </div>
      </section>

      <section id="cta" className="relative z-10 mx-auto max-w-5xl px-6 py-20 md:px-10">
        <div className="rounded-[2.5rem] border border-white bg-gradient-to-br from-[#7c3aed] via-[#9333ea] to-[#ec4899] p-12 text-center shadow-[0_24px_80px_rgba(147,51,234,0.45)] text-white">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/50 bg-white/20 px-5 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-white/90">
            Made for curious travelers
          </div>
          <h2 className="mt-6 text-3xl font-semibold md:text-4xl">
            Your fluency era starts with one conversation.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-white/80 md:text-base">
            Join linguists, expats, and remote workers building friendships that last longer than a translation. We'll
            handle the match--just bring your vibe.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-full bg-white px-8 py-3 text-sm font-semibold text-[#7c3aed] shadow-lg shadow-[#a855f7]/30 transition hover:-translate-y-1 hover:shadow-xl"
            >
              Get started
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center rounded-full border border-white/50 px-8 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              I already have an account
            </Link>
          </div>
      </div>
      </section>
    </main>
  )
}

