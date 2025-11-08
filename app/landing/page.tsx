/* eslint-disable @typescript-eslint/ban-ts-comment */
"use client"

import { Fragment, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import CountUp from "react-countup"

import { NetworkVisualization, OrbitingSkills, GlowLineEffect, ShimmerButton, TextReveal } from "seraui"
import { LaserFlowBackground } from "@/components/marketing/laser-flow"

import { Button } from "@/components/ui/button"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"

const problems = [
  {
    title: "Cost",
    emoji: "💸",
    description: "Apps, tutors, and textbooks add up fast—practice stalls before you ever meet someone local.",
  },
  {
    title: "Boredom",
    emoji: "😴",
    description: "Traditional drills feel like homework. Most people give up before learning feels like living.",
  },
  {
    title: "Isolation",
    emoji: "🌍",
    description: "It’s hard to find native speakers nearby, so conversations stay stuck online and in your head.",
  },
]

const howItWorks = [
  {
    title: "Create your profile",
    description: "Set your target language, vibe, and availability. LangEx helps you show up as your authentic self.",
  },
  {
    title: "Match with locals",
    description: "We recommend nearby partners who complement your goals, fluency, and preferred meeting style.",
  },
  {
    title: "Meet & explore",
    description: "Pick cafés, events, or co-working spaces together. Discover cultural gems as you practice IRL.",
  },
  {
    title: "Track the journey",
    description: "Keep streaks alive, swap highlights, and celebrate milestones with your growing language crew.",
  },
]

const featureGrid = [
  {
    emoji: "🗺️",
    title: "Location-based matching",
    copy: "See who’s practicing within a few blocks and filter by fluency, schedule, and interests.",
  },
  {
    emoji: "💬",
    title: "Instant messaging",
    copy: "Break the ice with AI-assisted prompts and voice notes that feel natural, not scripted.",
  },
  {
    emoji: "☕",
    title: "Discover places",
    copy: "Unlock curated cafés, cultural hubs, and hidden gems recommended by the community.",
  },
  {
    emoji: "🎉",
    title: "Join events",
    copy: "Weekly pop-up meetups, themed dinners, and co-learning sessions in 70+ cities.",
  },
  {
    emoji: "🏆",
    title: "Gamified journeys",
    copy: "Stay motivated with streaks, badges, and collaborative quests made for real-world practice.",
  },
  {
    emoji: "⭐",
    title: "Trusted community",
    copy: "Community verification and safety tools give you confidence every time you connect.",
  },
]

const testimonials = [
  {
    quote: "LangEx helped me make Dutch friends fast and finally feel at home in Amsterdam.",
    name: "Mike",
    location: "Amsterdam 🇳🇱",
  },
  {
    quote: "From Tokyo to São Paulo, I always find someone to practice Portuguese before every trip.",
    name: "Hana",
    location: "Tokyo 🇯🇵",
  },
  {
    quote: "The events are incredible—every meetup feels like a mini cultural festival.",
    name: "Gabriela",
    location: "São Paulo 🇧🇷",
  },
]

const globalCounters = [
  { label: "Cities", value: 70, suffix: "+", sublabel: "Live local communities" },
  { label: "Language pairs", value: 120, suffix: "+", sublabel: "Meaningful combinations" },
  { label: "Weekly meetups", value: 4600, suffix: " ", sublabel: "Hosted around the globe", formatter: (val: number) => `${(val / 1000).toFixed(1)}K` },
]

const stats = [
  { value: 127000, suffix: "+", label: "Active users" },
  { value: 150, suffix: "+", label: "Countries represented" },
  { value: 2500000, suffix: "+", label: "Exchanges completed" },
]

const heroFlags = [
  { emoji: "🇳🇱", label: "Dutch" },
  { emoji: "🇪🇸", label: "Spanish" },
  { emoji: "🇯🇵", label: "Japanese" },
  { emoji: "🇧🇷", label: "Portuguese" },
  { emoji: "🇰🇷", label: "Korean" },
  { emoji: "🇫🇷", label: "French" },
]

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  show: { opacity: 1, y: 0 },
}

export default function LandingPage() {
  const router = useRouter()

  const orbitingProps = useMemo(
    () => ({
      // @ts-expect-error The library exposes additional props not typed in the bundle.
      className: "size-full opacity-40",
    }),
    [],
  )

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <LaserFlowBackground />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.35),_rgba(15,23,42,0.9))]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.6),rgba(15,23,42,0.95))]" />
      </div>

      <header className="relative">
        <div className="mx-auto flex w-full max-w-[1300px] items-center justify-between px-6 pt-8 sm:px-10">
          <Link href="/" className="group flex items-center gap-3 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold backdrop-blur-md transition hover:bg-white/20">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-fuchsia-500 text-lg">
              🌐
            </span>
            <span className="tracking-wide text-white">
              LangEx
            </span>
          </Link>
          <div className="hidden items-center gap-6 text-sm text-white/70 md:flex">
            <Link className="transition hover:text-white" href="#problem">
              Why LangEx
            </Link>
            <Link className="transition hover:text-white" href="#how-it-works">
              How it works
            </Link>
            <Link className="transition hover:text-white" href="#features">
              Features
            </Link>
            <Link className="transition hover:text-white" href="#community">
              Community
            </Link>
          </div>
          <Button
            onClick={() => router.push("/auth/login")}
            variant="outline"
            className="hidden rounded-full border-white/20 bg-white/10 px-6 text-white transition hover:bg-white/20 md:inline-flex"
          >
            Sign in
          </Button>
        </div>

        <section className="relative mx-auto mt-16 grid w-full max-w-[1300px] items-center gap-14 px-6 pb-24 sm:px-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,0.85fr)]">
          <div className="space-y-10">
            <motion.div initial="hidden" animate="show" variants={fadeUp} transition={{ duration: 0.6 }}>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-white/80">
                Language flag exchange
              </div>
            </motion.div>

            <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.15, duration: 0.7 }} className="space-y-6">
              <h1 className="text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
                Learn Languages Through
                <span className="ml-2 bg-gradient-to-r from-sky-300 via-purple-300 to-fuchsia-300 bg-clip-text text-transparent">
                  Real Connections
                </span>
              </h1>
              <p className="max-w-xl text-lg text-white/80">
                Connect with native speakers nearby. Exchange stories, swap cultures, and grow together through immersive local experiences.
              </p>
            </motion.div>

            <motion.div
              className="flex flex-col gap-4 sm:flex-row"
              variants={fadeUp}
              initial="hidden"
              animate="show"
              transition={{ delay: 0.3, duration: 0.7 }}
            >
              <ShimmerButton
                // @ts-expect-error shimmer button props mismatch with type definition
                className="h-12 rounded-full px-10 text-base font-semibold"
                onClick={() => router.push("/auth/signup")}
              >
                Get Started
              </ShimmerButton>
              <Button
                variant="outline"
                className="h-12 rounded-full border-white/30 bg-transparent px-10 text-base font-semibold text-white transition hover:bg-white/15"
                onClick={() => router.push("/landing#community")}
              >
                View Demo Map
              </Button>
            </motion.div>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="show"
              transition={{ delay: 0.45, duration: 0.7 }}
              className="grid gap-4 sm:grid-cols-3"
            >
              {stats.map((metric) => (
                <div key={metric.label} className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                  <div className="text-3xl font-semibold">
                    <CountUp end={metric.value} duration={1.8} separator="," />
                    {metric.suffix}
                  </div>
                  <p className="mt-2 text-sm text-white/70">{metric.label}</p>
                </div>
              ))}
            </motion.div>
          </div>

          <div className="relative flex h-[520px] w-full items-center justify-center">
            <div className="absolute inset-0 rounded-[40px] bg-white/10 blur-3xl" />
            <div className="relative z-10 flex h-[460px] w-[460px] items-center justify-center rounded-[40px] border border-white/15 bg-slate-900/60 p-10 shadow-2xl backdrop-blur-2xl">
              <div className="absolute inset-6 rounded-full border border-white/10" />
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0"
              >
                {heroFlags.slice(0, 3).map((flag, index) => (
                  <div
                    key={flag.label}
                    className="absolute flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-white/15 text-xl backdrop-blur-lg"
                    style={
                      [
                        { top: "-1.5rem", left: "50%", transform: "translate(-50%, 0)" },
                        { right: "-1.5rem", top: "50%", transform: "translate(0, -50%)" },
                        { bottom: "-1.5rem", left: "50%", transform: "translate(-50%, 0)" },
                      ][index]
                    }
                  >
                    {flag.emoji}
                  </div>
                ))}
              </motion.div>
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 34, repeat: Infinity, ease: "linear" }}
                className="absolute inset-16"
              >
                {heroFlags.slice(3).map((flag, index) => (
                  <div
                    key={flag.label}
                    className="absolute flex h-12 w-12 items-center justify-center rounded-full border border-white/25 bg-white/10 text-lg backdrop-blur-lg"
                    style={
                      [
                        { top: "50%", left: "-1.25rem", transform: "translate(0, -50%)" },
                        { top: "-1rem", right: "-0.5rem" },
                        { bottom: "-1rem", right: "-0.5rem" },
                      ][index]
                    }
                  >
                    {flag.emoji}
                  </div>
                ))}
              </motion.div>
              <div className="relative flex size-40 flex-col items-center justify-center gap-2 rounded-[28px] border border-white/10 bg-white/15 p-6 text-center backdrop-blur-2xl">
                <span className="text-xs uppercase tracking-[0.35em] text-white/70">Live exchange</span>
                <p className="text-2xl font-semibold text-white">Den Haag ↔ Tokyo</p>
                <p className="text-sm text-white/65">12 new matches this hour</p>
              </div>
              <div className="absolute inset-0">
                {/* @ts-expect-error Decorative usage */}
                <OrbitingSkills {...orbitingProps} />
              </div>
            </div>
          </div>
        </section>
      </header>

      <main className="relative z-10 space-y-28 pb-28">
        <section id="problem" className="relative mx-auto w-full max-w-[1200px] px-6 sm:px-10">
          <div className="rounded-[40px] border border-white/10 bg-white/5 p-10 backdrop-blur-xl">
            <div className="grid gap-10 lg:grid-cols-[0.65fr_0.35fr]">
              <div className="space-y-10">
                <motion.h2
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, margin: "-20%" }}
                  variants={fadeUp}
                  transition={{ duration: 0.6 }}
                  className="text-3xl font-semibold sm:text-4xl"
                >
                  Language learning shouldn’t feel transactional.
                </motion.h2>
                <div className="grid gap-6 md:grid-cols-3">
                  {problems.map((problem, index) => (
                    <motion.div
                      key={problem.title}
                      initial="hidden"
                      whileInView="show"
                      viewport={{ once: true, margin: "-20%" }}
                      variants={fadeUp}
                      transition={{ delay: index * 0.12, duration: 0.6 }}
                      className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-lg"
                    >
                      <div className="text-3xl">{problem.emoji}</div>
                      <h3 className="mt-4 text-lg font-semibold text-white">{problem.title}</h3>
                      <p className="mt-2 text-sm text-white/70">{problem.description}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
              <div className="relative flex flex-col justify-between rounded-3xl border border-white/10 bg-gradient-to-br from-sky-500/30 via-purple-500/20 to-fuchsia-500/30 p-6 text-center shadow-xl">
                {/* @ts-expect-error TextReveal typing */}
                <TextReveal text="LangEx Solves This" className="text-2xl font-semibold text-white" />
                <p className="text-sm text-white/80">
                  Your city, your language goals, one vibrant map of people ready to connect. Welcome to the global language exchange network.
                </p>
                <div className="absolute -left-10 top-1/2 hidden h-24 w-24 rounded-full bg-sky-400/30 blur-2xl sm:block" />
                <div className="absolute -right-8 top-6 hidden h-20 w-20 rounded-full bg-fuchsia-400/30 blur-2xl sm:block" />
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="relative mx-auto w-full max-w-[1200px] px-6 sm:px-10">
          <div className="relative overflow-hidden rounded-[40px] border border-white/10 bg-slate-900/50 p-10 backdrop-blur-xl">
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-20%" }}
              variants={fadeUp}
              transition={{ duration: 0.6 }}
              className="mx-auto mb-12 max-w-2xl text-center"
            >
              <p className="text-sm uppercase tracking-[0.3em] text-white/60">How LangEx works</p>
              <h2 className="mt-4 text-3xl font-semibold sm:text-4xl">From profile to practice in four guided steps</h2>
            </motion.div>

            <div className="relative grid gap-8 md:grid-cols-2">
              {howItWorks.map((step, index) => (
                <motion.div
                  key={step.title}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, margin: "-15%" }}
                  variants={fadeUp}
                  transition={{ delay: index * 0.1, duration: 0.6 }}
                  className="relative rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-md"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15 text-lg font-semibold text-white">
                    {index + 1}
                  </div>
                  <h3 className="mt-5 text-xl font-semibold text-white">{step.title}</h3>
                  <p className="mt-3 text-sm text-white/70">{step.description}</p>
                </motion.div>
              ))}
              <div className="pointer-events-none absolute inset-x-1/2 hidden h-full -translate-x-1/2 items-center justify-center md:flex">
                {/* @ts-expect-error GlowLineEffect untyped */}
                <GlowLineEffect className="h-[calc(100%-4rem)] w-1 bg-gradient-to-b from-sky-400/40 via-white/40 to-fuchsia-400/40" />
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="relative mx-auto w-full max-w-[1200px] px-6 sm:px-10">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-15%" }}
            variants={fadeUp}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <p className="text-sm uppercase tracking-[0.3em] text-white/60">Product features</p>
            <h2 className="mt-4 text-3xl font-semibold sm:text-4xl">
              A premium platform for modern language explorers
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm text-white/70">
              Built with Framer Motion, shadcn/ui, SeraUI, and ReactBits—everything feels dynamic, tactile, and ready for your community to join today.
            </p>
          </motion.div>

          <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featureGrid.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-20%" }}
                variants={fadeUp}
                transition={{ delay: index * 0.06, duration: 0.6 }}
                className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:border-white/30"
              >
                <div className="absolute inset-0 -z-10 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
                <div className="text-3xl">{feature.emoji}</div>
                <h3 className="mt-5 text-lg font-semibold text-white">{feature.title}</h3>
                <p className="mt-3 text-sm text-white/70">{feature.copy}</p>
              </motion.div>
            ))}
          </div>
        </section>

        <section id="community" className="relative mx-auto w-full max-w-[1200px] px-6 sm:px-10">
          <div className="overflow-hidden rounded-[40px] border border-white/10 bg-slate-900/60 p-10 backdrop-blur-xl">
            <div className="grid gap-10 lg:grid-cols-[0.45fr_0.55fr] lg:items-center">
              <motion.div
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-20%" }}
                variants={fadeUp}
                transition={{ duration: 0.6 }}
                className="space-y-6"
              >
                <p className="text-sm uppercase tracking-[0.3em] text-white/60">Global network</p>
                <h2 className="text-3xl font-semibold sm:text-4xl">See the LangEx map come alive</h2>
                <p className="text-sm text-white/75">
                  Every pulse on the map represents native speakers meeting travellers, expats, and locals for meaningful exchanges.
                  Watch connections spark from Den Haag to Nairobi, Toronto to Seoul—powered by live community data.
                </p>
                <div className="grid gap-4 sm:grid-cols-3">
                  {globalCounters.map((item) => (
                    <div key={item.label} className="rounded-3xl border border-white/10 bg-white/5 p-5 text-center backdrop-blur-md">
                      <div className="text-2xl font-semibold">
                        {item.formatter ? item.formatter(item.value) : <CountUp end={item.value} duration={1.4} />}
                        {item.suffix}
                      </div>
                      <p className="mt-2 text-xs uppercase tracking-[0.2em] text-white/60">{item.label}</p>
                      <p className="mt-1 text-xs text-white/60">{item.sublabel}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-15%" }}
                transition={{ duration: 0.7 }}
                className="relative flex min-h-[420px] items-center justify-center"
              >
                <div className="absolute inset-0 rounded-[32px] border border-white/10 bg-white/5 blur-2xl" />
                <div className="absolute inset-0">
                  {/* @ts-expect-error SeraUI typing */}
                  <NetworkVisualization className="size-full" />
                </div>
                <div className="relative z-10 mx-auto max-w-[80%] rounded-3xl border border-white/10 bg-slate-900/70 p-6 text-center backdrop-blur-xl">
                  <p className="text-sm text-white/75">
                    Live cities pulsing: Den Haag · Tokyo · São Paulo · Cape Town · Toronto · Nairobi · Barcelona · Seoul · Melbourne
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <section className="relative mx-auto w-full max-w-[1000px] px-6 sm:px-10">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-20%" }}
            variants={fadeUp}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <p className="text-sm uppercase tracking-[0.3em] text-white/60">Voices from the map</p>
            <h2 className="mt-4 text-3xl font-semibold sm:text-4xl">Testimonials from the LangEx community</h2>
          </motion.div>

          <div className="relative mt-12 rounded-[32px] border border-white/10 bg-slate-900/60 p-10 backdrop-blur-xl">
            <Carousel className="relative">
              <CarouselContent>
                {testimonials.map((testimonial, index) => (
                  <CarouselItem key={testimonial.name} className="flex basis-full justify-center">
                    <motion.div
                      initial={{ opacity: 0.4, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                      className="max-w-xl text-center"
                    >
                      <p className="text-xl font-medium text-white/90">&ldquo;{testimonial.quote}&rdquo;</p>
                      <p className="mt-4 text-sm text-white/60">— {testimonial.name}, {testimonial.location}</p>
                    </motion.div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="border-white/30 text-white/60 hover:border-white hover:text-white" />
              <CarouselNext className="border-white/30 text-white/60 hover:border-white hover:text-white" />
            </Carousel>
          </div>
        </section>

        <section className="relative mx-auto w-full max-w-[1100px] px-6 sm:px-10">
          <div className="grid gap-6 rounded-[40px] border border-white/10 bg-white/5 p-10 text-center backdrop-blur-xl sm:grid-cols-3">
            {stats.map((item, index) => (
              <motion.div
                key={item.label}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-20%" }}
                variants={fadeUp}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-sky-400/10 via-purple-400/10 to-fuchsia-400/10 p-6"
              >
                <div className="text-4xl font-semibold text-transparent [-webkit-text-stroke:1px_rgba(255,255,255,0.6)]">
                  <CountUp end={item.value} duration={1.8} separator="," />
                  {item.suffix}
                </div>
                <p className="mt-3 text-sm text-white/75">{item.label}</p>
                <div className="absolute -top-6 right-4 text-3xl">✨</div>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="relative mx-auto w-full max-w-[1200px] px-6 sm:px-10">
          <div className="overflow-hidden rounded-[48px] border border-white/10 bg-gradient-to-br from-sky-500/20 via-purple-500/20 to-fuchsia-500/20 p-[1px]">
            <div className="relative flex flex-col items-center gap-8 rounded-[48px] bg-slate-950/80 px-10 py-16 text-center backdrop-blur-2xl">
              <motion.h2
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-20%" }}
                variants={fadeUp}
                transition={{ duration: 0.6 }}
                className="text-4xl font-semibold sm:text-5xl"
              >
                Start Your Language Journey Today — It’s Free!
              </motion.h2>
              <p className="max-w-2xl text-sm text-white/75">
                Join a trusted community of travellers, expats, locals, and world-schoolers building real friendships in every language.
              </p>
              <div className="flex flex-col gap-4 sm:flex-row">
                <ShimmerButton
                  // @ts-expect-error typing mismatch
                  className="h-12 rounded-full px-12 text-base font-semibold"
                  onClick={() => router.push("/auth/signup")}
                >
                  Download App
                </ShimmerButton>
                <Button
                  onClick={() => router.push("/auth/signup")}
                  className="h-12 rounded-full bg-white/10 px-10 text-base font-semibold text-white backdrop-blur-xl transition hover:bg-white/20"
                >
                  Join Community
                </Button>
              </div>
              <div className="flex flex-col items-center gap-3 text-xs text-white/70 sm:flex-row">
                <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2">
                  <span className="font-semibold text-white"></span>
                  <span className="text-left">
                    Available on <span className="font-medium text-white">App Store</span>
                  </span>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2">
                  <span className="font-semibold text-white">▶</span>
                  <span className="text-left">
                    Explore on <span className="font-medium text-white">Google Play</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-white/10 bg-slate-950/90">
        <div className="mx-auto flex w-full max-w-[1200px] flex-col items-center justify-between gap-6 px-6 py-10 text-center text-xs text-white/60 sm:flex-row sm:text-left">
          <div className="text-sm font-semibold text-white">LangEx</div>
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
            {["About", "Privacy", "Terms", "Contact", "Careers"].map((link) => (
              <Fragment key={link}>
                <Link href={`/${link.toLowerCase()}`} className="transition hover:text-white">
                  {link}
                </Link>
              </Fragment>
            ))}
          </div>
          <p className="text-xs text-white/50">© LangEx 2025 – All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

