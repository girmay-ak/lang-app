"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { createRoot, type Root } from "react-dom/client"
import { Layers, Mountain, Satellite } from "lucide-react"
import { Button } from "@/components/ui/button"

export type MapFilter = "people" | "places" | "events" | "highlights"

interface LanguageBadge {
  language: string
  flag: string
  level: string
}

export interface MapPoi {
  id: string
  type: "cafe" | "school" | "event" | "highlight"
  title: string
  subtitle?: string
  languages: string[]
  time?: string
  emoji: string
  lat: number
  lng: number
  description?: string
  isNew?: boolean
}

interface User {
  id: string
  name: string
  language: string
  flag: string
  distance: string
  lat: number
  lng: number
  bio: string
  availableFor: string
  image: string
  isOnline: boolean
  rating: number
  responseTime: string
  currentLocation: string
  availableNow: boolean
  timePreference: string
  languagesSpoken: LanguageBadge[]
  availabilityMessage?: string | null
  availabilityEmoji?: string | null
  isViewer?: boolean
  matchScore?: number
  statusIcon?: string
  statusText?: string
  levelGradient?: { from: string; to: string; label: string }
  primaryFlag?: string
  secondaryFlag?: string
  pairFlags?: string[]
}

interface MapboxMapProps {
  users: User[]
  pois?: MapPoi[]
  activeFilter: MapFilter
  onUserClick: (user: User) => void
  onPoiClick?: (poi: MapPoi) => void
  currentUserLocation?: { lat: number; lng: number } | null
  showCurrentUserRadar?: boolean
  centerOffset?: { x: number; y: number }
  onMapReady?: (map: any) => void
}

type MarkerEntry = {
  marker: any
  root: Root | null
}

const filterTint: Record<MapFilter, string | null> = {
  people: null,
  places: "radial-gradient(circle at 50% 50%, rgba(209, 178, 125, 0.18) 0%, rgba(12, 18, 42, 0.75) 65%)",
  events: "radial-gradient(circle at 50% 50%, rgba(244, 187, 74, 0.22) 0%, rgba(11, 18, 41, 0.75) 70%)",
  highlights: "radial-gradient(circle at 50% 50%, rgba(56, 189, 248, 0.22) 0%, rgba(9, 12, 30, 0.7) 70%)",
}

function UserMarker({ user, onSelect }: { user: User; onSelect: () => void }) {
  const [isHovered, setIsHovered] = useState(false)
  const pairFlags = useMemo(() => {
    const base = (user.pairFlags && user.pairFlags.length > 0
      ? user.pairFlags
      : [user.primaryFlag, user.secondaryFlag, user.flag]
    ).filter(Boolean) as string[]
    return Array.from(new Set(base)).slice(0, 2)
  }, [user.pairFlags, user.primaryFlag, user.secondaryFlag, user.flag])

  const levelGradient = user.levelGradient ?? { from: "#475569", to: "#1e293b", label: "Explorer" }
  const levelLabel = levelGradient.label ?? "Explorer"
  const matchScore = typeof user.matchScore === "number" ? Math.round(user.matchScore) : null
  const matchTone =
    matchScore === null
      ? "text-slate-300"
      : matchScore >= 85
        ? "text-emerald-300"
        : matchScore >= 70
          ? "text-amber-300"
          : "text-slate-300"

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.95 }}
      onClick={onSelect}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative flex w-28 flex-col items-center focus:outline-none"
    >
      <div className="relative">
        {pairFlags.length > 0 && (
          <div className="absolute -top-6 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full border border-white/10 bg-slate-950/90 px-2.5 py-1 text-[11px] font-semibold text-white shadow-[0_8px_24px_rgba(6,10,25,0.55)] backdrop-blur">
            {pairFlags.map((flag, index) => (
              <span key={`${flag}-${index}`} className="text-base leading-none">
                {flag}
              </span>
            ))}
          </div>
        )}
        <div className="relative h-16 w-16">
          {/* Glow ring - purple for viewer, soft white/blue for others */}
          {user.isViewer ? (
            <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-purple-500/60 to-purple-600/60 blur-md animate-pulse" style={{ boxShadow: "0 0 12px rgba(155,93,245,0.6)" }} />
          ) : (
            <div className="absolute -inset-1 rounded-full bg-white/20 blur-sm" style={{ boxShadow: "0 0 8px rgba(255,255,255,0.3)" }} />
          )}
          <div
            className="absolute inset-0 rounded-full shadow-[0_12px_28px_rgba(8,12,32,0.35)]"
            style={{ background: `linear-gradient(135deg, ${levelGradient.from}, ${levelGradient.to})` }}
          />
          <div className="absolute inset-[3px] rounded-full bg-slate-950/85 p-[2px]">
            <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-slate-900/70">
              {user.image ? (
                <img src={user.image} alt={user.name} className="h-full w-full object-cover" />
              ) : (
                <span className="text-lg font-semibold text-white">{(user.name ?? "U").charAt(0).toUpperCase()}</span>
              )}
            </div>
          </div>
          <div className="absolute -bottom-3 left-1/2 flex -translate-x-1/2 items-center rounded-full border border-white/15 bg-slate-950/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.25em] text-white/80 backdrop-blur">
            {levelLabel}
          </div>
        </div>
      </div>

      <div className="mt-7 w-full rounded-2xl border border-white/12 bg-slate-950/85 px-3 py-2.5 text-center shadow-[0_22px_45px_rgba(6,10,25,0.55)] backdrop-blur">
        <p className="text-sm font-semibold text-white">{user.isViewer ? "You" : user.name}</p>
        {!user.isViewer && matchScore !== null && (
          <p className={`mt-0.5 text-xs font-semibold ${matchTone}`}>{matchScore}% match</p>
        )}
        <p className="mt-1 text-[11px] text-slate-300">
          {user.distance ?? "—"} • {user.language}
        </p>
        {user.statusText && (
          <p className="mt-1 flex items-center justify-center gap-1 text-[11px] text-slate-200">
            {user.statusIcon ? <span>{user.statusIcon}</span> : null}
            <span className="line-clamp-1">{user.statusText}</span>
          </p>
        )}
      </div>

      <AnimatePresence>
        {isHovered && user.availabilityMessage && (
          <motion.div
            key="availability-message"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.22 }}
            className="absolute -top-24 left-1/2 w-52 -translate-x-1/2 rounded-2xl border border-white/10 bg-slate-950/95 px-3 py-2 text-left text-slate-100 shadow-[0_16px_45px_rgba(6,10,25,0.6)]"
          >
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-200">
              <span>{user.availabilityEmoji ?? (user.availableNow ? "💬" : "🌙")}</span>
              <span>{user.timePreference}</span>
            </div>
            <p className="mt-1 text-[11px] leading-snug">{user.availabilityMessage}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  )
}

const poiAccent: Record<MapPoi["type"], string> = {
  cafe: "from-amber-500/20 via-orange-500/20 to-amber-500/10",
  school: "from-sky-500/20 via-sky-400/20 to-sky-500/10",
  event: "from-yellow-500/20 via-amber-400/20 to-yellow-500/10",
  highlight: "from-emerald-500/20 via-cyan-500/20 to-emerald-500/10",
}

function PoiMarker({ poi, onSelect }: { poi: MapPoi; onSelect: () => void }) {
  return (
    <motion.button
      type="button"
      onClick={onSelect}
      whileTap={{ scale: 0.92 }}
      className="group relative flex w-24 flex-col items-center text-center focus:outline-none"
    >
      <div className="relative">
        {poi.isNew && (
          <motion.span
            className="absolute -inset-6 rounded-full bg-amber-400/20 blur-2xl"
            animate={{ scale: [0.9, 1.25, 0.9], opacity: [0.3, 0.12, 0.3] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
          />
        )}

        <div
          className={`relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-white/15 bg-slate-950/90 shadow-lg ring-2 ring-white/10 backdrop-blur`}
        >
          <span className="text-xl">{poi.emoji}</span>
        </div>
        <div
          className={`absolute inset-0 -z-10 rounded-3xl bg-gradient-to-br ${poiAccent[poi.type]} opacity-60 blur-xl transition-opacity duration-300 group-hover:opacity-90`}
        />
      </div>

      <span className="mt-3 rounded-full bg-slate-950/70 px-2 py-0.5 text-xs font-semibold text-white/90">
        {poi.title}
      </span>
      {poi.subtitle && <span className="mt-1 text-[11px] text-slate-300">{poi.subtitle}</span>}
    </motion.button>
  )
}

export function MapboxMap({
  users,
  pois = [],
  activeFilter,
  onUserClick,
  onPoiClick,
  currentUserLocation,
  showCurrentUserRadar = true,
  centerOffset,
  onMapReady,
}: MapboxMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<MarkerEntry[]>([])
  const pendingUnmountsRef = useRef<Root[]>([])
  const isUnmountFlushScheduledRef = useRef(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [mapStyle, setMapStyle] = useState<"standard" | "satellite" | "3d">("standard")
  const [showStyleSwitcher, setShowStyleSwitcher] = useState(false)

  const add3DBuildings = useCallback((map: any, style: "standard" | "satellite" | "3d") => {
    try {
      if (
        !map ||
        typeof map.isStyleLoaded !== "function" ||
        typeof map.once !== "function" ||
        typeof map.getSource !== "function" ||
        typeof map.addLayer !== "function"
      ) {
        return
      }

      if (!map.isStyleLoaded()) {
        map.once("styledata", () => add3DBuildings(map, style))
        return
      }

      if (typeof map.getLayer === "function" && map.getLayer("3d-buildings")) {
        map.removeLayer("3d-buildings")
      }

      const source = typeof map.getSource === "function" ? map.getSource("composite") : null
      if (!source) {
        return
      }

      const mapStyle = typeof map.getStyle === "function" ? map.getStyle() : null
      if (!mapStyle || !mapStyle.layers) {
        return
      }

      const compositeSource: any = mapStyle.sources?.composite
      const hasBuildingLayer =
        compositeSource?.vector_layers?.some?.(
          (layer: { id?: string }) => layer?.id === "building" || layer?.id === "building-outline",
        ) ?? false

      if (!hasBuildingLayer) {
        return
      }

      const { layers } = mapStyle
      let labelLayerId
      for (let i = 0; i < layers.length; i += 1) {
        if (layers[i].type === "symbol" && layers[i].layout && layers[i].layout["text-field"]) {
          labelLayerId = layers[i].id
          break
        }
      }

      const addLayer = typeof map.addLayer === "function" ? map.addLayer.bind(map) : null
      if (!addLayer) return

      addLayer(
        {
          id: "3d-buildings",
          source: "composite",
          "source-layer": "building",
          filter: ["==", "extrude", "true"],
          type: "fill-extrusion",
          minzoom: 13,
          paint: {
            "fill-extrusion-color": style === "satellite" ? "#aaa" : "#1a1a2e",
            "fill-extrusion-height": ["case", ["has", "height"], ["get", "height"], 15],
            "fill-extrusion-base": ["case", ["has", "min_height"], ["get", "min_height"], 0],
            "fill-extrusion-opacity": style === "satellite" ? 0.8 : 0.6,
          },
        },
        labelLayerId,
      )
    } catch (error) {
      console.error("[MapboxMap] Error adding 3D buildings:", error)
    }
  }, [])

  const changeMapStyle = useCallback(
    (style: "standard" | "satellite" | "3d") => {
    if (!mapInstanceRef.current) return

    setMapStyle(style)
    setShowStyleSwitcher(false)

    try {
      if (style === "standard") {
        mapInstanceRef.current.setStyle("mapbox://styles/mapbox/dark-v11")
        mapInstanceRef.current.setPitch(0)
        mapInstanceRef.current.setBearing(0)
      } else if (style === "satellite") {
        mapInstanceRef.current.setStyle("mapbox://styles/mapbox/satellite-streets-v12")
        mapInstanceRef.current.setPitch(0)
        mapInstanceRef.current.setBearing(0)
      } else if (style === "3d") {
        mapInstanceRef.current.setStyle("mapbox://styles/mapbox/dark-v11")
          mapInstanceRef.current.setPitch(55)
          mapInstanceRef.current.setBearing(-18)
      }

      mapInstanceRef.current.once("styledata", () => {
        setTimeout(() => {
          add3DBuildings(mapInstanceRef.current, style)
          }, 120)
      })
    } catch (error) {
        console.error("[MapboxMap] Error changing style:", error)
    }
    },
    [add3DBuildings],
  )

  const flushPendingUnmounts = useCallback(() => {
    const roots = pendingUnmountsRef.current.splice(0)
    if (roots.length === 0) {
      isUnmountFlushScheduledRef.current = false
      return
    }

    roots.forEach((root) => {
      try {
        root.unmount()
      } catch (error) {
        console.warn("[MapboxMap] Failed to unmount marker root:", error)
      }
    })

    isUnmountFlushScheduledRef.current = false
  }, [])

  const schedulePendingUnmountFlush = useCallback(() => {
    if (isUnmountFlushScheduledRef.current) return
    isUnmountFlushScheduledRef.current = true

    const schedule = () => {
      if (typeof window !== "undefined" && "requestAnimationFrame" in window) {
        window.requestAnimationFrame(() => flushPendingUnmounts())
      } else {
        setTimeout(() => flushPendingUnmounts(), 0)
      }
    }

    setTimeout(schedule, 0)
  }, [flushPendingUnmounts])

  const clearMarkers = useCallback(() => {
    let hasRootsToUnmount = false

    markersRef.current.forEach(({ marker, root }) => {
      try {
        marker.remove()
      } catch (error) {
        console.warn("[MapboxMap] Failed to remove marker:", error)
      }

      if (root) {
        pendingUnmountsRef.current.push(root)
        hasRootsToUnmount = true
      }
    })
    markersRef.current = []

    if (hasRootsToUnmount) {
      schedulePendingUnmountFlush()
    }
  }, [schedulePendingUnmountFlush])

  const renderAllMarkers = useCallback(
    (map: any, mapboxgl: any, nextUsers: User[], nextPois: MapPoi[]) => {
      clearMarkers()

      nextUsers.forEach((user) => {
        if (typeof user.lng !== "number" || typeof user.lat !== "number") {
          return
        }
        const container = document.createElement("div")
        container.style.width = "96px"
        container.style.pointerEvents = "auto"
        const root = createRoot(container)
        root.render(<UserMarker user={user} onSelect={() => onUserClick(user)} />)

        const marker = new mapboxgl.default.Marker({ element: container, anchor: "bottom" })
          .setLngLat([user.lng, user.lat])
          .addTo(map)

        markersRef.current.push({ marker, root })
      })

      nextPois.forEach((poi) => {
        if (typeof poi.lng !== "number" || typeof poi.lat !== "number") {
          return
        }
        const container = document.createElement("div")
        container.style.width = "96px"
        container.style.pointerEvents = "auto"
        const root = createRoot(container)
        root.render(<PoiMarker poi={poi} onSelect={() => onPoiClick?.(poi)} />)

        const marker = new mapboxgl.default.Marker({ element: container, anchor: "bottom" })
          .setLngLat([poi.lng, poi.lat])
          .addTo(map)

        markersRef.current.push({ marker, root })
      })
    },
    [clearMarkers, onUserClick, onPoiClick],
  )

  useEffect(() => {
    if (typeof window === "undefined" || mapInstanceRef.current) return

    import("mapbox-gl")
      .then((mapboxgl) => {
        if (!mapRef.current) {
          console.error("[MapboxMap] Map container ref missing")
          return
        }

        mapboxgl.default.accessToken =
          "pk.eyJ1IjoiZ2lybWF5bmwyMSIsImEiOiJjbWgyODQ4ancxNDdqMmlxeTY2aHFkdDdqIn0.kx667AeRIVB9gDo42gLOHA"

        try {
          const map = new mapboxgl.default.Map({
            container: mapRef.current,
            style: "mapbox://styles/mapbox/dark-v11",
            center: [currentUserLocation?.lng ?? 4.3007, currentUserLocation?.lat ?? 52.0705],
            zoom: 13,
            pitch: 0,
            bearing: 0,
          })

          map.on("load", () => {
            setIsLoaded(true)

            try {
              if (
                typeof map.getSource === "function" &&
                !map.getSource("mapbox-dem") &&
                typeof map.addSource === "function"
              ) {
                  map.addSource("mapbox-dem", {
                    type: "raster-dem",
                    url: "mapbox://mapbox.mapbox-terrain-dem-v1",
                    tileSize: 512,
                    maxzoom: 14,
                  })
              }
              if (typeof map.setTerrain === "function") {
                map.setTerrain({ source: "mapbox-dem", exaggeration: 1.4 })
              }
            } catch (error) {
              console.error("[MapboxMap] Error configuring terrain:", error)
            }

            add3DBuildings(map, "standard")
            renderAllMarkers(map, mapboxgl, users, pois)
            
            // Expose map instance to parent
            if (onMapReady) {
              onMapReady(map)
            }
          })

          mapInstanceRef.current = map
        } catch (error) {
          console.error("[MapboxMap] Error initializing Mapbox:", error)
        }
      })
      .catch((error) => {
        console.error("[MapboxMap] Error loading Mapbox GL:", error)
      })

    return () => {
      clearMarkers()
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [users, pois, currentUserLocation, add3DBuildings, renderAllMarkers, clearMarkers])

  useEffect(() => {
    if (!mapInstanceRef.current || !isLoaded) return

    import("mapbox-gl")
      .then((mapboxgl) => {
        renderAllMarkers(mapInstanceRef.current, mapboxgl, users, pois)
      })
      .catch((error) => {
        console.error("[MapboxMap] Failed to update markers:", error)
    })
  }, [users, pois, isLoaded, renderAllMarkers])

  useEffect(() => {
    return () => {
      schedulePendingUnmountFlush()
    }
  }, [schedulePendingUnmountFlush])

  // Handle center offset when sidebar/panels are open
  useEffect(() => {
    if (!mapInstanceRef.current || !isLoaded || !centerOffset) return

    const map = mapInstanceRef.current
    const currentCenter = map.getCenter()
    
    if (currentCenter && typeof map.easeTo === "function") {
      map.easeTo({
        center: [currentCenter.lng, currentCenter.lat],
        offset: [centerOffset.x, centerOffset.y],
        duration: 500,
      })
    }
  }, [centerOffset, isLoaded])

  // Resize map when layout changes
  useEffect(() => {
    if (!mapInstanceRef.current || !isLoaded) return
    
    const map = mapInstanceRef.current
    setTimeout(() => {
      if (typeof map.resize === "function") {
        map.resize()
      }
    }, 100)
  }, [centerOffset, isLoaded])

  const tint = filterTint[activeFilter]

  return (
    <div className="relative h-full w-full overflow-hidden">
      <div ref={mapRef} className="h-full w-full" />

      <AnimatePresence mode="wait">
        {tint && (
          <motion.div
            key={activeFilter}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.35 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: "easeInOut" }}
            style={{ background: tint }}
            className="pointer-events-none absolute inset-0 z-[4]"
          />
        )}
      </AnimatePresence>

      {isLoaded && (
        <div className="absolute top-24 right-4 z-20">
          <div className="relative">
            <Button
              size="icon"
              onClick={() => setShowStyleSwitcher((prev) => !prev)}
              className="h-12 w-12 rounded-2xl border-0 bg-white/90 text-gray-900 shadow-xl backdrop-blur transition hover:scale-105 hover:bg-white"
            >
              {mapStyle === "standard" && <Layers className="h-5 w-5" />}
              {mapStyle === "satellite" && <Satellite className="h-5 w-5" />}
              {mapStyle === "3d" && <Mountain className="h-5 w-5" />}
            </Button>

            <AnimatePresence>
            {showStyleSwitcher && (
                <motion.div
                  initial={{ opacity: 0, y: -12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  className="absolute top-14 right-0 min-w-[170px] overflow-hidden rounded-2xl border border-white/10 bg-slate-900/95 text-white shadow-2xl backdrop-blur"
                >
                  {[
                    { id: "standard", label: "Standard", icon: Layers },
                    { id: "satellite", label: "Satellite", icon: Satellite },
                    { id: "3d", label: "3D View", icon: Mountain },
                  ].map(({ id, label, icon: Icon }) => (
                <button
                      key={id}
                      type="button"
                      onClick={() => changeMapStyle(id as "standard" | "satellite" | "3d")}
                      className={`flex w-full items-center gap-3 px-4 py-3 text-sm transition hover:bg-white/5 ${
                        mapStyle === id ? "bg-white/10 text-emerald-200" : "text-white/80"
                  }`}
                >
                      <Icon className="h-4 w-4" />
                      <span>{label}</span>
                </button>
                  ))}
                </motion.div>
            )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {!isLoaded && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-cyan-400" />
            <p className="text-sm text-slate-400">Loading map...</p>
          </div>
        </div>
      )}
    </div>
  )
}
