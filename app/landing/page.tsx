"use client"

import { useRouter } from "next/navigation"
import { ArrowRight, Globe2, Languages, Map, MessageCircle, ShieldCheck, Sparkles, Users, Zap } from "lucide-react"

import { Button } from "@/components/ui/button"
import { NetworkVisual } from "@/components/marketing/network-visual"

const metrics = [
  { label: "Cities", value: "70+" },
  { label: "Language pairs", value: "120" },
  { label: "Weekly meetups", value: "4.6K" },
  { label: "Avg. response", value: "2.1 hrs" },
]

const featureCards = [
  {
    icon: Globe2,
    title: "React Network Visualization",
    copy: "Supabase-powered geo clusters show who is practicing nearby and across the world in real time.",
  },
  {
    icon: Sparkles,
    title: "Motion.dev laser flows",
    copy: "Micro animations inspired by Motion.dev guide the eye from discovery to the start-chat CTA.",
  },
  {
    icon: Users,
    title: "React Orbiting Skills",
    copy: "Orbit carousels surface mentors who match your goals, badges, and availability.",
  },
  {
    icon: MessageCircle,
    title: "React Video Text Copy",
    copy: "Send 10s intro clips with auto captions, tone rewrites, and bilingual prompts.",
  },
  {
    icon: ShieldCheck,
    title: "React Verify Badge",
    copy: "Every profile is backed by Supabase auth, streak proofs, and community verification.",
  },
  {
    icon: Zap,
    title: "Component loaders",
    copy: "Skeleton states, shimmer buttons, and toast copy keep conversations feeling instant.",
  },
]

const timelineSteps = [
  {
    title: "Map your intent",
    description: "Drop a pin, pick languages, and set your energy. React Search Copy translates your context into filters.",
  },
  {
    title: "Craft the opener",
    description: "Video Text Copy + Prompt UI suggest culturally-aware intros, with Motion.dev easing for delivery.",
  },
  {
    title: "Meet & GlitchVault",
    description: "Capture highlights in GlitchVault cards—translated, encrypted, and ready to revisit in DocTabs.",
  },
  {
    title: "Toast the wins",
    description: "React Toast Copy + Verify Badge celebrate streaks so you keep practicing from Den Haag to Dubai.",
  },
]

const toolkit = [
  {
    title: "Search + Chatbot UI",
    copy: "Seraui Search Copy and Prompt UI work together to find partners, suggest cafés, and schedule follow-ups.",
  },
  {
    title: "Passwordless trust",
    copy: "React Password Input + Verify Badge keep onboarding low-friction, high-signal, and globally compliant.",
  },
  {
    title: "DocTabs knowledge",
    copy: "React DocTabs organise city guides, slang decks, and facilitator playbooks for every timezone.",
  },
]

const orbitLanguages = [
  "Dutch",
  "Spanish",
  "Japanese",
  "Arabic",
  "Portuguese",
  "Korean",
  "English",
  "Hindi",
]

export default function LandingPage() {
  const router = useRouter()

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0 -z-10 hero-aurora" />

      <header className="relative px-6 pt-8 sm:px-10">
        <nav className="mx-auto flex max-w-6xl items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur-xl">
          <span className="flex items-center gap-3 text-base font-semibold">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-purple-500 text-lg">
              ✨
            </span>
            Orbit Atlas
          </span>
          <div className="hidden items-center gap-6 text-sm text-white/70 sm:flex">
            <a className="hover:text-white transition" href="#vision">
              Vision
            </a>
            <a className="hover:text-white transition" href="#features">
              Features
            </a>
            <a className="hover:text-white transition" href="#timeline">
              Timeline
            </a>
            <a className="hover:text-white transition" href="#toolkit">
              Toolkit
            </a>
          </div>
          <Button
            onClick={() => router.push("/auth/login")}
            variant="outline"
            className="hidden rounded-full border-white/20 bg-transparent text-white hover:bg-white/10 sm:inline-flex"
          >
            Sign in
          </Button>
        </nav>

        <section id="vision" className="mx-auto grid max-w-6xl gap-12 py-20 sm:py-28 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-center">
          <div className="space-y-8">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-200">
              Global language mesh
            </span>
            <h1 className="text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
              Design language exchange that feels crafted for every city on earth.
            </h1>
            <p className="max-w-xl text-lg text-slate-200/80">
              Orbit Atlas blends React Network Visualization, Seraui Orbit components, Motion.dev laser flows, and Supabase realtime to
              help communities match, meet, and stay in conversation from Den Haag to Tokyo.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Button
                onClick={() => router.push("/auth/signup")}
                className="group h-12 rounded-full bg-gradient-to-r from-sky-500 to-purple-600 px-8 font-semibold text-white hover:from-sky-600 hover:to-purple-700"
              >
                Launch your hub
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button
                variant="outline"
                className="h-12 rounded-full border-white/20 bg-transparent px-8 text-white hover:bg-white/10"
                onClick={() => router.push("/auth/login")}
              >
                View demo map
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
              {metrics.map((metric) => (
                <div key={metric.label} className="metric-card rounded-2xl border border-white/10 bg-white/10 p-4 text-center shadow-lg">
                  <p className="text-2xl font-semibold text-white">{metric.value}</p>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-200/70">{metric.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="hero-orbit-card">
              <div className="flex flex-col items-center gap-3 text-center">
                <span className="rounded-full bg-white/15 px-4 py-1 text-xs uppercase tracking-[0.25em] text-slate-900/80">Live right now</span>
                <p className="text-xl font-semibold text-slate-900">Orbit feed</p>
                <p className="text-xs text-slate-700/70">Mentors circling your profile</p>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-4">
                {orbitLanguages.map((language) => (
                  <div key={language} className="rounded-2xl border border-slate-900/10 bg-white/60 p-4 text-left">
                    <p className="text-sm font-semibold text-slate-900">{language}</p>
                    <p className="text-xs text-slate-600">3 mentors online</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex items-center justify-between rounded-2xl bg-slate-900/5 px-4 py-3 text-slate-700">
                <span className="text-sm font-medium">Laser flow active</span>
                <span className="text-xs">Motion.dev easing v2</span>
              </div>
            </div>
          </div>
        </section>
      </header>

      <main className="relative z-10 space-y-24 px-6 pb-24 sm:px-10">
        <section id="features" className="mx-auto max-w-6xl space-y-12">
          <div className="space-y-4 text-center">
            <p className="section-heading">experience modules</p>
            <h2 className="text-3xl font-semibold text-white sm:text-4xl">Built from the best of ReactBits & Motion.dev</h2>
            <p className="mx-auto max-w-3xl text-sm text-slate-200/75">
              Each module combines Seraui components with custom gradients, glassmorphism, and Supabase realtime so your community looks and
              feels premium out of the gate.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featureCards.map((feature) => (
              <div key={feature.title} className="bento-card bento-card--soft">
                <div className="bento-card__content">
                  <feature.icon className="h-6 w-6 text-sky-200" />
                  <h3 className="text-lg font-semibold text-white/90">{feature.title}</h3>
                  <p className="text-sm text-slate-200/70">{feature.copy}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="network" className="mx-auto max-w-6xl space-y-10">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,0.55fr)_minmax(0,0.45fr)] lg:items-center">
            <div className="space-y-4">
              <p className="section-heading">global map</p>
              <h2 className="text-3xl font-semibold text-white">React Network Visualization + Supabase realtime</h2>
              <p className="text-sm text-slate-200/75">
                Every pin represents a meetup, café suggestion, or language mentor. Zoom into Den Haag, pan to São Paulo, and watch the laser flow
                animations pulse as new connections go live.
              </p>
            </div>
            <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl">
              <NetworkVisual />
            </div>
          </div>
        </section>

        <section id="timeline" className="mx-auto max-w-6xl space-y-10">
          <div className="space-y-4 text-center">
            <p className="section-heading">journey</p>
            <h2 className="text-3xl font-semibold text-white">The Seraui timeline, remixed for language exchange</h2>
          </div>
          <div className="timeline-column space-y-10">
            {timelineSteps.map((step) => (
              <div key={step.title} className="relative rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg backdrop-blur">
                <div className="timeline-dot" />
                <h3 className="text-lg font-semibold text-white/90">{step.title}</h3>
                <p className="mt-3 text-sm text-slate-200/70">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="toolkit" className="mx-auto max-w-6xl space-y-10">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,0.45fr)_minmax(0,0.55fr)] lg:items-center">
            <div className="space-y-4">
              <p className="section-heading">operations toolkit</p>
              <h2 className="text-3xl font-semibold text-white">Everything syncs through Supabase + React components</h2>
              <p className="text-sm text-slate-200/75">
                The Orbit Atlas admin view uses Seraui Search, Prompt UI, Password Input, DocTabs, and Component Loaders so your team can focus on
                community—not plumbing.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {toolkit.map((card) => (
                <div key={card.title} className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-md backdrop-blur">
                  <h3 className="text-sm font-semibold text-white/85">{card.title}</h3>
                  <p className="mt-2 text-xs text-slate-200/70">{card.copy}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl space-y-6 rounded-[32px] border border-white/10 bg-white/5 p-10 text-center shadow-2xl backdrop-blur-xl">
          <p className="section-heading">launch</p>
          <h2 className="text-3xl font-semibold text-white sm:text-4xl">Start your Orbit Atlas chapter today</h2>
          <p className="mx-auto max-w-3xl text-sm text-slate-200/75">
            Shimmer Buttons, Verify Badges, DocTabs knowledge bases, Component Loaders, and Toast Copy are all ready. Invite mentors, plan meetups,
            and celebrate every new conversation.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 pt-4 sm:flex-row">
            <Button
              onClick={() => router.push("/auth/signup")}
              className="group h-12 rounded-full bg-gradient-to-r from-sky-500 to-purple-600 px-8 font-semibold text-white hover:from-sky-600 hover:to-purple-700"
            >
              Get started now
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/auth/login")}
              className="h-12 rounded-full border-white/20 bg-transparent px-8 text-white hover:bg-white/10"
            >
              Already a member? Log in
            </Button>
          </div>
        </section>
      </main>

      <footer className="relative z-10 px-6 pb-10 text-center text-xs text-slate-200/60 sm:px-10">
        Powered by React Network Visualization, Video Text Copy, GlitchVault Card, Orbiting Skills, Orbit Carousel, Timeline, Shimmer Button,
        Verify Badge, Toast Copy, Search Component, Prompt UI, Password Input, Text Reveal Animation, DocTabs, and Component Loaders.
      </footer>
    </div>
  )
}

