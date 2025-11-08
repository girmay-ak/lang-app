"use client"

import { useMemo } from "react"

interface NetworkNode {
  id: string
  x: number
  y: number
  radius: number
  delay: number
  flag: string
  label: string
}

interface NetworkConnection {
  id: string
  from: string
  to: string
}

const nodes: NetworkNode[] = [
  { id: "nl", x: 52, y: 36, radius: 3.5, delay: 0, flag: "🇳🇱", label: "Den Haag" },
  { id: "us", x: 22, y: 32, radius: 3.2, delay: 120, flag: "🇺🇸", label: "Seattle" },
  { id: "mx", x: 25, y: 45, radius: 2.8, delay: 240, flag: "🇲🇽", label: "CDMX" },
  { id: "br", x: 32, y: 66, radius: 3, delay: 360, flag: "🇧🇷", label: "São Paulo" },
  { id: "ng", x: 48, y: 55, radius: 2.7, delay: 480, flag: "🇳🇬", label: "Lagos" },
  { id: "eg", x: 58, y: 45, radius: 2.6, delay: 600, flag: "🇪🇬", label: "Cairo" },
  { id: "in", x: 68, y: 48, radius: 3.2, delay: 720, flag: "🇮🇳", label: "Delhi" },
  { id: "jp", x: 82, y: 36, radius: 3.1, delay: 840, flag: "🇯🇵", label: "Tokyo" },
  { id: "au", x: 84, y: 72, radius: 2.9, delay: 960, flag: "🇦🇺", label: "Sydney" },
  { id: "sg", x: 76, y: 60, radius: 2.6, delay: 1080, flag: "🇸🇬", label: "Singapore" },
]

const connections: NetworkConnection[] = [
  { id: "nl-us", from: "nl", to: "us" },
  { id: "nl-mx", from: "nl", to: "mx" },
  { id: "nl-br", from: "nl", to: "br" },
  { id: "nl-ng", from: "nl", to: "ng" },
  { id: "nl-eg", from: "nl", to: "eg" },
  { id: "nl-in", from: "nl", to: "in" },
  { id: "nl-jp", from: "nl", to: "jp" },
  { id: "nl-au", from: "nl", to: "au" },
  { id: "nl-sg", from: "nl", to: "sg" },
  { id: "us-br", from: "us", to: "br" },
  { id: "in-sg", from: "in", to: "sg" },
  { id: "jp-au", from: "jp", to: "au" },
]

export function NetworkVisual() {
  const nodeMap = useMemo(() => {
    return nodes.reduce<Record<string, NetworkNode>>((acc, node) => {
      acc[node.id] = node
      return acc
    }, {})
  }, [])

  return (
    <div
      className="relative h-[520px] w-full overflow-hidden rounded-[32px]"
      style={{
        backgroundImage:
          "linear-gradient(135deg, rgba(15,23,42,0.92) 0%, rgba(2,6,23,0.95) 100%), url('https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Blue_Marble_2002.png/1280px-Blue_Marble_2002.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-500/20 via-sky-500/10 to-purple-500/30" />

      <svg viewBox="0 0 100 100" className="relative z-10 h-full w-full">
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(125, 211, 252, 0.8)" />
            <stop offset="100%" stopColor="rgba(129, 140, 248, 0.4)" />
          </linearGradient>
          <radialGradient id="nodeGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(226, 232, 240, 0.95)" />
            <stop offset="100%" stopColor="rgba(96, 165, 250, 0.65)" />
          </radialGradient>
        </defs>

        <g opacity={0.7}>
          <rect x={0} y={0} width={100} height={100} fill="url(#nodeGradient)" opacity={0.05} />
        </g>

        {connections.map((connection, index) => {
          const from = nodeMap[connection.from]
          const to = nodeMap[connection.to]
          if (!from || !to) return null

          return (
            <line
              key={connection.id}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke="url(#lineGradient)"
              strokeWidth={0.45}
              strokeLinecap="round"
              className="network-line"
              style={{ animationDelay: `${index * 120}ms` }}
            />
          )
        })}

        {nodes.map((node) => (
          <g key={node.id}>
            <circle
              cx={node.x}
              cy={node.y}
              r={node.radius}
              fill="url(#nodeGradient)"
              className="network-node"
              style={{ animationDelay: `${node.delay}ms` }}
            />
            <text
              x={node.x}
              y={node.y + 0.5}
              textAnchor="middle"
              fontSize={node.radius * 1.6}
            >
              {node.flag}
            </text>
            <text
              x={node.x}
              y={node.y + node.radius + 4}
              textAnchor="middle"
              fontSize={3}
              fill="rgba(226,232,240,0.85)"
            >
              {node.label}
            </text>
          </g>
        ))}

        <circle
          cx={nodeMap["nl"].x}
          cy={nodeMap["nl"].y}
          r={nodeMap["nl"].radius + 2}
          fill="none"
          stroke="rgba(129, 140, 248, 0.8)"
          strokeWidth={0.6}
          strokeDasharray="2 2"
          opacity={0.7}
        />
      </svg>

      <div className="absolute inset-x-8 bottom-8 z-20 rounded-3xl border border-white/10 bg-black/40 p-6 backdrop-blur-2xl">
        <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-slate-200/80">
          <div>
            <p className="text-[10px] uppercase tracking-[0.4em] text-sky-200/80">Global mesh</p>
            <p className="mt-1 text-sm font-medium text-white/90">Native speakers spanning 15 time zones</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-[11px]">
            <span className="rounded-full bg-white/10 px-3 py-1 text-white/80">70+ connected cities</span>
            <span className="rounded-full bg-white/10 px-3 py-1 text-white/80">120+ language pairs</span>
            <span className="rounded-full bg-white/10 px-3 py-1 text-white/80">Realtime Supabase sync</span>
          </div>
        </div>
      </div>
    </div>
  )
}

