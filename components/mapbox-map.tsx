"use client"

import { useEffect, useRef, useState } from "react"
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
}

export function MapboxMap({ users, onUserClick }: MapboxMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [mapStyle, setMapStyle] = useState<"standard" | "satellite" | "3d">("standard")
  const [showStyleSwitcher, setShowStyleSwitcher] = useState(false)

  const add3DBuildings = (map: any, style: "standard" | "satellite" | "3d") => {
    try {
      if (!map || !map.isStyleLoaded()) {
        console.log("[v0] Map style not loaded yet, waiting...")
        map.once("styledata", () => add3DBuildings(map, style))
        return
      }

      // Remove existing building layer if it exists
      if (map.getLayer("3d-buildings")) {
        map.removeLayer("3d-buildings")
      }

      // Check if the composite source exists (required for 3D buildings)
      const source = map.getSource("composite")
      if (!source) {
        console.log("[v0] Composite source not available in this style, skipping 3D buildings")
        return
      }

      const mapStyle = map.getStyle()
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

      map.addLayer(
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

  useEffect(() => {
    if (typeof window === "undefined" || mapInstanceRef.current) return

    const timeoutId = setTimeout(() => {
      if (!mapRef.current) {
        console.error("[v0] Map container ref is not available")
        return
      }

      import("mapbox-gl")
        .then((mapboxgl) => {
          if (!mapRef.current) {
            console.error("[v0] Map container ref became null during import")
            return
          }

          mapboxgl.default.accessToken =
            "pk.eyJ1IjoiZ2lybWF5bmwyMSIsImEiOiJjbWgyODQ4ancxNDdqMmlxeTY2aHFkdDdqIn0.kx667AeRIVB9gDo42gLOHA"

          try {
            const map = new mapboxgl.default.Map({
              container: mapRef.current,
              style: "mapbox://styles/mapbox/dark-v11",
              center: [4.3007, 52.0705],
              zoom: 13,
              pitch: 0,
              bearing: 0,
            })

            map.on("load", () => {
              setIsLoaded(true)

              try {
                map.addSource("mapbox-dem", {
                  type: "raster-dem",
                  url: "mapbox://mapbox.mapbox-terrain-dem-v1",
                  tileSize: 512,
                  maxzoom: 14,
                })
                map.setTerrain({ source: "mapbox-dem", exaggeration: 1.5 })
              } catch (error) {
                console.error("[v0] Error adding terrain:", error)
              }

              // Add 3D buildings after terrain
              add3DBuildings(map, "standard")

              const updatedUsers = users.map((user, index) => {
                const distances = [
                  { lat: 52.0705, lng: 4.3007, distance: "0m" },
                  { lat: 52.0755, lng: 4.3057, distance: "650m" },
                  { lat: 52.0655, lng: 4.2957, distance: "1.2km" },
                  { lat: 52.0805, lng: 4.3107, distance: "2.8km" },
                  { lat: 52.0605, lng: 4.2907, distance: "3.5km" },
                  { lat: 52.0855, lng: 4.3157, distance: "5km" },
                ]
                return {
                  ...user,
                  lat: distances[index % distances.length].lat,
                  lng: distances[index % distances.length].lng,
                  distance: distances[index % distances.length].distance,
                }
              })

              updatedUsers.forEach((user) => {
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
                      ${user.name[0]}
                    </div>
                    ${
                      user.isOnline
                        ? '<div class="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-3 border-white shadow-lg"></div>'
                        : ""
                    }
                    <div class="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white shadow-lg flex items-center justify-center text-base border-2 border-white">
                      ${user.flag}
                    </div>
                  </div>
                  <div class="mt-1 bg-gray-900/80 backdrop-blur-sm px-2 py-1 rounded-full">
                    <span class="text-white text-xs font-semibold">${user.name}</span>
                  </div>
                  <div class="bg-blue-500/90 backdrop-blur-sm px-2 py-0.5 rounded-full">
                    <span class="text-white text-xs font-medium">${user.distance}</span>
                  </div>
                </div>
              `

                el.addEventListener("click", () => {
                  onUserClick(user)
                })

                const marker = new mapboxgl.default.Marker(el)
                  .setLngLat([user.lng, user.lat])
                  .setPopup(
                    new mapboxgl.default.Popup({ offset: 25, closeButton: false }).setHTML(`
                    <div class="text-center p-3">
                      <div class="text-lg font-bold mb-1">${user.name}</div>
                      <div class="text-sm text-gray-600 mb-2">${user.flag} ${user.language}</div>
                      <div class="text-xs text-gray-500">${user.distance} away</div>
                      <div class="text-xs text-gray-500 mt-1">${user.currentLocation}</div>
                    </div>
                  `),
                  )
                  .addTo(map)

                markersRef.current.push(marker)
              })
            })

            mapInstanceRef.current = map
          } catch (error) {
            console.error("[v0] Error initializing Mapbox:", error)
          }
        })
        .catch((error) => {
          console.error("[v0] Error loading Mapbox GL:", error)
        })
    }, 100)

    return () => {
      clearTimeout(timeoutId)

      markersRef.current.forEach((marker) => marker.remove())
      markersRef.current = []

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [users, onUserClick])

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
