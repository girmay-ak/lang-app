"use client"

export function BackgroundGlow() {
  return (
    <div className="pointer-events-none absolute inset-0">
      <div className="absolute -top-44 -left-32 h-96 w-96 rounded-full bg-[#6366f1]/45 blur-[170px]" />
      <div className="absolute top-[22%] right-[-140px] h-80 w-80 rounded-full bg-[#ec4899]/35 blur-[150px]" />
      <div className="absolute bottom-[-160px] left-[18%] h-[420px] w-[420px] rounded-full bg-[#0ea5e9]/25 blur-[180px]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_5%_0%,rgba(129,140,248,0.18),transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_95%_0%,rgba(244,114,182,0.14),transparent_55%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(15,23,42,0.65)_0%,rgba(3,5,24,0.92)_60%)]" />
    </div>
  )
}

