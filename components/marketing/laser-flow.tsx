"use client"

export function LaserFlowBackground() {
  return (
    <div className="relative h-full w-full overflow-hidden">
      <div className="absolute inset-0 laser-flow-background" />
      <div className="absolute inset-0 opacity-40">
        <div className="absolute -left-1/3 top-1/4 h-1/2 w-2/3 rotate-[12deg] rounded-full bg-gradient-to-r from-sky-500/40 via-fuchsia-400/40 to-purple-500/40 blur-[120px]" />
        <div className="absolute right-[-25%] top-1/3 h-1/2 w-1/2 -rotate-[18deg] rounded-full bg-gradient-to-r from-purple-500/40 via-sky-400/40 to-purple-500/20 blur-[140px]" />
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-[70%] w-[70%] rounded-[50%] border border-white/10" />
        <div className="h-[50%] w-[50%] rounded-[50%] border border-white/10" />
        <div className="h-[30%] w-[30%] rounded-[50%] border border-white/10" />
      </div>
      <div className="absolute inset-0 animate-spin-slow">
        <div className="absolute left-1/2 top-[10%] h-16 w-16 -translate-x-1/2 rounded-full bg-sky-400/60 blur-2xl" />
        <div className="absolute bottom-[12%] left-[18%] h-12 w-12 rounded-full bg-purple-500/60 blur-2xl" />
        <div className="absolute right-[16%] top-[18%] h-10 w-10 rounded-full bg-fuchsia-400/70 blur-xl" />
      </div>
    </div>
  )
}
