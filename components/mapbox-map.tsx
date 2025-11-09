"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Layers, Mountain, Satellite } from "lucide-react"
import { Button } from "@/components/ui/button"

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
  languagesSpoken: { language: string; flag: string; level: string }[]
}

interface MapboxMapProps {
  users: User[]
  onUserClick: (user: User) => void
  currentUserLocation?: { lat: number; lng: number } | null
  showCurrentUserRadar?: boolean
}

export function MapboxMap({ users, onUserClick, currentUserLocation, showCurrentUserRadar = true }: MapboxMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const currentUserRadarRef = useRef<any>(null)
  const radarStyleInjectedRef = useRef(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [mapStyle, setMapStyle] = useState<"standard" | "satellite" | "3d">("standard")
  const [showStyleSwitcher, setShowStyleSwitcher] = useState(false)

  const ensureRadarStyles = useCallback(() => {
    if (radarStyleInjectedRef.current || typeof window === "undefined") return
    const style = document.createElement("style")
    style.innerHTML = `
      @keyframes radar-pulse {
        0% { transform: scale(0.35); opacity: 0.55; }
        55% { transform: scale(1); opacity: 0.15; }
        100% { transform: scale(1.35); opacity: 0; }
      }

      @keyframes radar-sweep {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      .current-user-radar-marker {
        position: relative;
        width: 220px;
        height: 220px;
        transform: translate(-50%, -50%);
        pointer-events: none;
      }

      .current-user-radar-marker .pulse-ring {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 160px;
        height: 160px;
        margin: -80px 0 0 -80px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(56, 189, 248, 0.35) 0%, rgba(56, 189, 248, 0) 70%);
        border: 2px solid rgba(56, 189, 248, 0.5);
        animation: radar-pulse 3.2s ease-out infinite;
      }

      .current-user-radar-marker .pulse-ring:nth-child(2) {
        animation-delay: 1.1s;
        opacity: 0.4;
      }

      .current-user-radar-marker .pulse-ring:nth-child(3) {
        animation-delay: 2.2s;
        opacity: 0.25;
      }

      .current-user-radar-marker .radar-sweep {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 190px;
        height: 190px;
        margin: -95px 0 0 -95px;
        border-radius: 50%;
        background: conic-gradient(
          rgba(56, 189, 248, 0.55),
          rgba(56, 189, 248, 0.15) 35%,
          transparent 55%
        );
        filter: blur(2px);
        animation: radar-sweep 5s linear infinite;
        opacity: 0.6;
      }

      .current-user-radar-marker .radar-core {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 22px;
        height: 22px;
        margin: -11px 0 0 -11px;
        border-radius: 50%;
        background: linear-gradient(135deg, #38bdf8, #6366f1);
        box-shadow: 0 0 18px rgba(56, 189, 248, 0.9);
        border: 2px solid rgba(255, 255, 255, 0.75);
      }
    `
    document.head.appendChild(style)
    radarStyleInjectedRef.current = true
  }, [])

  const add3DBuildings = (map: any, style: "standard" | "satellite" | "3d") => {
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
        console.log("[v0] Map style not loaded yet, waiting...")
        map.once("styledata", () => add3DBuildings(map, style))
        return
      }

      // Remove existing building layer if it exists
      if (typeof map.getLayer === "function" && map.getLayer("3d-buildings")) {
        map.removeLayer("3d-buildings")
      }

      // Check if the composite source exists (required for 3D buildings)
      const source = typeof map.getSource === "function" ? map.getSource("composite") : null
      if (!source) {
        console.log("[v0] Composite source not available in this style, skipping 3D buildings")
        return
      }

      const mapStyle = typeof map.getStyle === "function" ? map.getStyle() : null
      if (!mapStyle || !mapStyle.layers) {
        console.log("[v0] Map style or layers not available yet")
        return
      }

      // Find the first symbol layer to insert buildings below labels
      const layers = mapStyle.layers
      let labelLayerId
      for (let i = 0; i < layers.length; i++) {
        if (layers[i].type === "symbol" && layers[i].layout && layers[i].layout["text-field"]) {
          labelLayerId = layers[i].id
          break
        }
      }

      const addLayer =
        typeof map.addLayer === "function"
          ? map.addLayer.bind(map)
          : null

      if (!addLayer) {
        return
      }

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
      console.error("[v0] Error adding 3D buildings:", error)
    }
  }

  const changeMapStyle = (style: "standard" | "satellite" | "3d") => {
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
        mapInstanceRef.current.setPitch(60)
        mapInstanceRef.current.setBearing(-17.6)
      }

      mapInstanceRef.current.once("styledata", () => {
        // Add a small delay to ensure everything is ready
        setTimeout(() => {
          add3DBuildings(mapInstanceRef.current, style)
        }, 100)
      })
    } catch (error) {
      console.error("[v0] Error changing map style:", error)
    }
  }

  const clearMarkers = useCallback(() => {
    markersRef.current.forEach((marker) => marker.remove())
    markersRef.current = []
  }, [])

  const renderMarkers = useCallback(
    (map: any, mapboxgl: any, sourceUsers: User[]) => {
      clearMarkers()

      sourceUsers.forEach((user) => {
        const el = document.createElement("div")
        el.className = "custom-mapbox-marker"
        el.style.width = "80px"
        el.style.height = "80px"
        el.style.cursor = "pointer"

        el.innerHTML = `
          <div class="relative flex flex-col items-center">
            <div class="w-16 h-16 rounded-full border-4 border-white shadow-2xl overflow-hidden bg-gradient-to-br from-blue-400 to-purple-400 ring-4 ring-blue-400/30 transition-transform hover:scale-110 relative">
              <img src="${user.image}" alt="${user.name}" class="w-full h-full object-cover" onerror="this.style.display='none'" />
              <div class="absolute inset-0 flex items-center justify-center text-white text-xl font-bold">
                ${user.name[0] ?? "U"}
              </div>
              ${
                user.isOnline
                  ? '<div class="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-3 border-white shadow-lg"></div>'
                  : ""
              }
              <div class="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white shadow-lg flex items-center justify-center text-base border-2 border-white">
                ${user.flag ?? "🌍"}
              </div>
            </div>
            <div class="mt-1 bg-gray-900/80 backdrop-blur-sm px-2 py-1 rounded-full">
              <span class="text-white text-xs font-semibold">${user.name}</span>
            </div>
            <div class="bg-blue-500/90 backdrop-blur-sm px-2 py-0.5 rounded-full">
              <span class="text-white text-xs font-medium">${user.distance ?? "—"}</span>
            </div>
          </div>
        `

        el.addEventListener("click", () => {
          onUserClick(user)
        })

        if (typeof user.lng !== "number" || typeof user.lat !== "number") {
          return
        }

        const marker = new mapboxgl.default.Marker(el)
          .setLngLat([user.lng, user.lat])
          .setPopup(
            new mapboxgl.default.Popup({ offset: 25, closeButton: false }).setHTML(`
              <div class="text-center p-3">
                <div class="text-lg font-bold mb-1">${user.name}</div>
                <div class="text-sm text-gray-600 mb-2">${user.flag ?? "🌍"} ${user.language}</div>
                <div class="text-xs text-gray-500">${user.distance ?? "—"} away</div>
                <div class="text-xs text-gray-500 mt-1">${user.currentLocation ?? ""}</div>
              </div>
            `),
          )
          .addTo(map)

        markersRef.current.push(marker)
      })
    },
    [onUserClick, clearMarkers],
  )

  useEffect(() => {
    if (typeof window === "undefined" || mapInstanceRef.current) return

    import("mapbox-gl")
      .then((mapboxgl) => {
        if (!mapRef.current) {
          console.error("[v0] Map container ref is not available")
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
              if (typeof map.getSource === "function" && !map.getSource("mapbox-dem")) {
                if (typeof map.addSource === "function") {
                  map.addSource("mapbox-dem", {
                    type: "raster-dem",
                    url: "mapbox://mapbox.mapbox-terrain-dem-v1",
                    tileSize: 512,
                    maxzoom: 14,
                  })
                }
              }
              if (typeof map.setTerrain === "function") {
                map.setTerrain({ source: "mapbox-dem", exaggeration: 1.5 })
              }
            } catch (error) {
              console.error("[v0] Error adding terrain:", error)
            }

            add3DBuildings(map, "standard")
            renderMarkers(map, mapboxgl, users)
          })

          mapInstanceRef.current = map
        } catch (error) {
          console.error("[v0] Error initializing Mapbox:", error)
        }
      })
      .catch((error) => {
        console.error("[v0] Error loading Mapbox GL:", error)
      })

    return () => {
      clearMarkers()
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [users, currentUserLocation, renderMarkers, clearMarkers])

  useEffect(() => {
    if (!mapInstanceRef.current || !isLoaded) return

    import("mapbox-gl").then((mapboxgl) => {
      renderMarkers(mapInstanceRef.current, mapboxgl, users)
    })
  }, [users, isLoaded, renderMarkers])

  // Animate a radar effect around the current user location
  useEffect(() => {
    if (!mapInstanceRef.current || !isLoaded || !currentUserLocation || !showCurrentUserRadar) {
      if (currentUserRadarRef.current) {
        currentUserRadarRef.current.remove()
        currentUserRadarRef.current = null
      }
      return
    }

    const map = mapInstanceRef.current

    import("mapbox-gl")
      .then(() => {
        try {
          ensureRadarStyles()

          if (!currentUserRadarRef.current) {
            const el = document.createElement("div")
            el.className = "current-user-radar-marker"
            el.innerHTML = `
              <div class="pulse-ring"></div>
              <div class="pulse-ring"></div>
              <div class="pulse-ring"></div>
              <div class="radar-sweep"></div>
              <div class="radar-core"></div>
            `

            currentUserRadarRef.current = new mapboxgl.default.Marker({
              element: el,
              anchor: "center",
            })
              .setLngLat([currentUserLocation.lng, currentUserLocation.lat])
              .addTo(map)
          } else {
            currentUserRadarRef.current.setLngLat([currentUserLocation.lng, currentUserLocation.lat])
          }
        } catch (error) {
          console.error("[v0] Error adding current user radar:", error)
        }
      })
      .catch((error) => {
        console.error("[v0] Error loading Mapbox GL for radar:", error)
      })

    return () => {
      try {
        if (currentUserRadarRef.current) {
          currentUserRadarRef.current.remove()
          currentUserRadarRef.current = null
        }
      } catch (error) {
        console.warn("[v0] Error cleaning up radar layers:", error)
      }
    }
  }, [currentUserLocation, isLoaded, showCurrentUserRadar, ensureRadarStyles])

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full" />

      {isLoaded && (
        <div className="absolute inset-0 pointer-events-none z-[5]">
          {/* Radar circles */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            {[150, 250, 350, 450].map((size, i) => (
              <div
                key={i}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-blue-500/20"
                style={{
                  width: `${size}px`,
                  height: `${size}px`,
                }}
              />
            ))}
          </div>

          {/* Radar sweep effect */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px]">
            <div className="radar-sweep" />
          </div>

          {/* Center point (You) */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 bg-blue-500 rounded-full shadow-lg shadow-blue-500/50 animate-pulse border-2 border-white" />
        </div>
      )}

      {isLoaded && (
        <div className="absolute top-24 right-4 z-10">
          <div className="relative">
            <Button
              size="icon"
              onClick={() => setShowStyleSwitcher(!showStyleSwitcher)}
              className="h-12 w-12 rounded-2xl bg-white/90 backdrop-blur-md hover:bg-white shadow-xl border-0 transition-all hover:scale-105"
            >
              {mapStyle === "standard" && <Layers className="h-5 w-5 text-gray-800" />}
              {mapStyle === "satellite" && <Satellite className="h-5 w-5 text-gray-800" />}
              {mapStyle === "3d" && <Mountain className="h-5 w-5 text-gray-800" />}
            </Button>

            {showStyleSwitcher && (
              <div className="absolute top-14 right-0 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 overflow-hidden animate-in slide-in-from-top-2 min-w-[160px]">
                <button
                  onClick={() => changeMapStyle("standard")}
                  className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-100 transition-colors ${
                    mapStyle === "standard" ? "bg-blue-50 text-blue-600" : "text-gray-700"
                  }`}
                >
                  <Layers className="h-4 w-4" />
                  <span className="text-sm font-medium">Standard</span>
                </button>
                <button
                  onClick={() => changeMapStyle("satellite")}
                  className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-100 transition-colors ${
                    mapStyle === "satellite" ? "bg-blue-50 text-blue-600" : "text-gray-700"
                  }`}
                >
                  <Satellite className="h-4 w-4" />
                  <span className="text-sm font-medium">Satellite</span>
                </button>
                <button
                  onClick={() => changeMapStyle("3d")}
                  className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-100 transition-colors ${
                    mapStyle === "3d" ? "bg-blue-50 text-blue-600" : "text-gray-700"
                  }`}
                >
                  <Mountain className="h-4 w-4" />
                  <span className="text-sm font-medium">3D View</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-sm text-gray-400">Loading map...</p>
          </div>
        </div>
      )}
    </div>
  )
}
