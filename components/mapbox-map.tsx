"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createRoot, type Root } from "react-dom/client";
import { Layers, Mountain, Satellite } from "lucide-react";
import { Button } from "@/components/ui/button";

export type MapFilter = "people" | "places" | "events" | "highlights";

interface LanguageBadge {
  language: string;
  flag: string;
  level: string;
}

export interface MapPoi {
  id: string;
  type: "cafe" | "school" | "event" | "highlight";
  title: string;
  subtitle?: string;
  languages: string[];
  time?: string;
  emoji: string;
  lat: number;
  lng: number;
  description?: string;
  isNew?: boolean;
}

interface User {
  id: string;
  name: string;
  language: string;
  flag: string;
  nativeFlag?: string;
  distance: string;
  lat: number;
  lng: number;
  bio: string;
  availableFor: string;
  image: string;
  isOnline: boolean;
  rating: number;
  responseTime: string;
  currentLocation: string;
  availableNow: boolean;
  timePreference: string;
  languagesSpoken: LanguageBadge[];
  availabilityMessage?: string | null;
  availabilityEmoji?: string | null;
  isViewer?: boolean;
}

interface MapboxMapProps {
  users: User[];
  pois?: MapPoi[];
  activeFilter: MapFilter;
  onUserClick: (user: User) => void;
  onPoiClick?: (poi: MapPoi) => void;
  currentUserLocation?: { lat: number; lng: number } | null;
  showCurrentUserRadar?: boolean;
}

type MarkerEntry = {
  marker: any;
  root: Root | null;
};

const filterTint: Record<MapFilter, string | null> = {
  people: null,
  places:
    "radial-gradient(circle at 50% 50%, rgba(209, 178, 125, 0.18) 0%, rgba(12, 18, 42, 0.75) 65%)",
  events:
    "radial-gradient(circle at 50% 50%, rgba(244, 187, 74, 0.22) 0%, rgba(11, 18, 41, 0.75) 70%)",
  highlights:
    "radial-gradient(circle at 50% 50%, rgba(56, 189, 248, 0.22) 0%, rgba(9, 12, 30, 0.7) 70%)",
};

function resolveFlagSequence(user: User): string[] {
  const uniqueFlags = new Set<string>();
  if (Array.isArray(user.languagesSpoken)) {
    user.languagesSpoken.forEach((badge) => {
      if (badge.flag) {
        uniqueFlags.add(badge.flag);
      }
    });
  }
  if (user.flag) {
    uniqueFlags.add(user.flag);
  }
  const flags = Array.from(uniqueFlags);
  if (flags.length === 0) {
    flags.push("🌍");
  }
  if (flags.length === 1) {
    flags.push(flags[0]);
  }
  return flags.slice(0, 4);
}

function UserMarker({ user, onSelect }: { user: User; onSelect: () => void }) {
  const [isHovered, setIsHovered] = useState(false);
  const nativeFlag = user.nativeFlag || user.flag || "🌍";

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.95 }}
      onClick={onSelect}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative flex w-24 flex-col items-center focus:outline-none"
    >
      <div className="relative">
        <motion.div
          className="absolute -top-9 left-1/2 flex -translate-x-1/2 flex-col items-center"
          animate={{ rotate: [0, 3, -3, 0], y: [0, -1.5, 1.5, 0] }}
          transition={{ duration: 5.2, repeat: Infinity, ease: "easeInOut" }}
        >
          <span className="rounded-md bg-slate-950/80 px-2 py-1 text-sm shadow-[0_4px_12px_rgba(56,189,248,0.45)] ring-1 ring-white/20">
            {nativeFlag}
          </span>
          <span className="mt-[-2px] h-4 w-0.5 rounded-full bg-white/30 shadow-[0_0_4px_rgba(56,189,248,0.35)]" />
        </motion.div>

        {user.availableNow && (
          <motion.span
            className="absolute -inset-4 rounded-full bg-emerald-400/25 blur-3xl"
            animate={{ opacity: [0.3, 0.12, 0.3], scale: [1, 1.2, 1] }}
            transition={{ duration: 2.8, ease: "easeInOut", repeat: Infinity }}
          />
        )}

        <div className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-slate-900/90 shadow-xl ring-2 ring-cyan-400/20 backdrop-blur">
          {user.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.image}
              alt={user.name}
              className="h-full w-full object-cover"
              onError={(event) => {
                (event.currentTarget as HTMLImageElement).style.display =
                  "none";
              }}
            />
          ) : null}
          {!user.image && (
            <span className="text-lg font-semibold text-white">
              {(user.name ?? "U").charAt(0).toUpperCase()}
            </span>
          )}
          {user.isOnline && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full border-2 border-white bg-emerald-400 shadow-lg" />
          )}
        </div>

        <div className="absolute -bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/10 bg-slate-950/80 px-3 py-1 text-[11px] text-white/85 shadow-lg backdrop-blur">
          <span>{user.distance ?? "—"}</span>
          <span className="text-white/40">•</span>
          <span>{user.language}</span>
        </div>
      </div>

      <div className="mt-6 flex flex-col items-center text-center">
        <span className="rounded-full bg-slate-950/70 px-2 py-0.5 text-xs font-semibold text-white/90">
          {user.isViewer ? "You" : user.name}
        </span>
        <span className="mt-1 text-[11px] text-slate-300">
          {user.timePreference}
        </span>
      </div>

      <AnimatePresence>
        {isHovered && user.availabilityMessage && (
          <motion.div
            key="availability-message"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.22 }}
            className="absolute -top-24 left-1/2 w-48 -translate-x-1/2 rounded-2xl border border-white/10 bg-slate-950/95 px-3 py-2 text-left shadow-2xl backdrop-blur"
          >
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-200">
              <span>
                {user.availabilityEmoji ?? (user.availableNow ? "💬" : "🌙")}
              </span>
              <span>{user.timePreference}</span>
            </div>
            <p className="mt-1 text-[11px] leading-snug text-slate-100">
              {user.availabilityMessage}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

const poiAccent: Record<MapPoi["type"], string> = {
  cafe: "from-amber-500/20 via-orange-500/20 to-amber-500/10",
  school: "from-sky-500/20 via-sky-400/20 to-sky-500/10",
  event: "from-yellow-500/20 via-amber-400/20 to-yellow-500/10",
  highlight: "from-emerald-500/20 via-cyan-500/20 to-emerald-500/10",
};

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
      {poi.subtitle && (
        <span className="mt-1 text-[11px] text-slate-300">{poi.subtitle}</span>
      )}
    </motion.button>
  );
}

export function MapboxMap({
  users,
  pois = [],
  activeFilter,
  onUserClick,
  onPoiClick,
  currentUserLocation,
  showCurrentUserRadar = true,
}: MapboxMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<MarkerEntry[]>([]);
  const currentUserRadarRef = useRef<any>(null);
  const radarStyleInjectedRef = useRef(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [mapStyle, setMapStyle] = useState<"standard" | "satellite" | "3d">(
    "standard",
  );
  const [showStyleSwitcher, setShowStyleSwitcher] = useState(false);

  const ensureRadarStyles = useCallback(() => {
    if (radarStyleInjectedRef.current || typeof window === "undefined") return;
    const style = document.createElement("style");
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
    `;
    document.head.appendChild(style);
    radarStyleInjectedRef.current = true;
  }, []);

  const add3DBuildings = useCallback(
    (map: any, style: "standard" | "satellite" | "3d") => {
      try {
        if (
          !map ||
          typeof map.isStyleLoaded !== "function" ||
          typeof map.once !== "function" ||
          typeof map.getSource !== "function" ||
          typeof map.addLayer !== "function"
        ) {
          return;
        }

        if (!map.isStyleLoaded()) {
          map.once("styledata", () => add3DBuildings(map, style));
          return;
        }

        if (
          typeof map.getLayer === "function" &&
          map.getLayer("3d-buildings")
        ) {
          map.removeLayer("3d-buildings");
        }

        const source =
          typeof map.getSource === "function"
            ? map.getSource("composite")
            : null;
        if (!source) {
          return;
        }

        const mapStyle =
          typeof map.getStyle === "function" ? map.getStyle() : null;
        if (!mapStyle || !mapStyle.layers) {
          return;
        }

        const { layers } = mapStyle;
        let labelLayerId;
        for (let i = 0; i < layers.length; i += 1) {
          if (
            layers[i].type === "symbol" &&
            layers[i].layout &&
            layers[i].layout["text-field"]
          ) {
            labelLayerId = layers[i].id;
            break;
          }
        }

        const addLayer =
          typeof map.addLayer === "function" ? map.addLayer.bind(map) : null;
        if (!addLayer) return;

        addLayer(
          {
            id: "3d-buildings",
            source: "composite",
            "source-layer": "building",
            filter: ["==", "extrude", "true"],
            type: "fill-extrusion",
            minzoom: 13,
            paint: {
              "fill-extrusion-color":
                style === "satellite" ? "#aaa" : "#1a1a2e",
              "fill-extrusion-height": [
                "case",
                ["has", "height"],
                ["get", "height"],
                15,
              ],
              "fill-extrusion-base": [
                "case",
                ["has", "min_height"],
                ["get", "min_height"],
                0,
              ],
              "fill-extrusion-opacity": style === "satellite" ? 0.8 : 0.6,
            },
          },
          labelLayerId,
        );
      } catch (error) {
        console.error("[MapboxMap] Error adding 3D buildings:", error);
      }
    },
    [],
  );

  const changeMapStyle = useCallback(
    (style: "standard" | "satellite" | "3d") => {
      if (!mapInstanceRef.current) return;

      setMapStyle(style);
      setShowStyleSwitcher(false);

      try {
        if (style === "standard") {
          mapInstanceRef.current.setStyle("mapbox://styles/mapbox/dark-v11");
          mapInstanceRef.current.setPitch(0);
          mapInstanceRef.current.setBearing(0);
        } else if (style === "satellite") {
          mapInstanceRef.current.setStyle(
            "mapbox://styles/mapbox/satellite-streets-v12",
          );
          mapInstanceRef.current.setPitch(0);
          mapInstanceRef.current.setBearing(0);
        } else if (style === "3d") {
          mapInstanceRef.current.setStyle("mapbox://styles/mapbox/dark-v11");
          mapInstanceRef.current.setPitch(55);
          mapInstanceRef.current.setBearing(-18);
        }

        mapInstanceRef.current.once("styledata", () => {
          setTimeout(() => {
            add3DBuildings(mapInstanceRef.current, style);
          }, 120);
        });
      } catch (error) {
        console.error("[MapboxMap] Error changing style:", error);
      }
    },
    [add3DBuildings],
  );

  const clearMarkers = useCallback(() => {
    markersRef.current.forEach(({ marker, root }) => {
      try {
        marker.remove();
      } catch (error) {
        console.warn("[MapboxMap] Failed to remove marker:", error);
      }
      try {
        root?.unmount();
      } catch (error) {
        console.warn("[MapboxMap] Failed to unmount marker root:", error);
      }
    });
    markersRef.current = [];
  }, []);

  const renderAllMarkers = useCallback(
    (map: any, mapboxgl: any, nextUsers: User[], nextPois: MapPoi[]) => {
      clearMarkers();

      nextUsers.forEach((user) => {
        if (typeof user.lng !== "number" || typeof user.lat !== "number") {
          return;
        }
        const container = document.createElement("div");
        container.style.width = "96px";
        container.style.pointerEvents = "auto";
        const root = createRoot(container);
        root.render(
          <UserMarker user={user} onSelect={() => onUserClick(user)} />,
        );

        const marker = new mapboxgl.default.Marker({
          element: container,
          anchor: "bottom",
        })
          .setLngLat([user.lng, user.lat])
          .addTo(map);

        markersRef.current.push({ marker, root });
      });

      nextPois.forEach((poi) => {
        if (typeof poi.lng !== "number" || typeof poi.lat !== "number") {
          return;
        }
        const container = document.createElement("div");
        container.style.width = "96px";
        container.style.pointerEvents = "auto";
        const root = createRoot(container);
        root.render(<PoiMarker poi={poi} onSelect={() => onPoiClick?.(poi)} />);

        const marker = new mapboxgl.default.Marker({
          element: container,
          anchor: "bottom",
        })
          .setLngLat([poi.lng, poi.lat])
          .addTo(map);

        markersRef.current.push({ marker, root });
      });
    },
    [clearMarkers, onUserClick, onPoiClick],
  );

  useEffect(() => {
    if (typeof window === "undefined" || mapInstanceRef.current) return;

    import("mapbox-gl")
      .then((mapboxgl) => {
        if (!mapRef.current) {
          console.error("[MapboxMap] Map container ref missing");
          return;
        }

        mapboxgl.default.accessToken =
          "pk.eyJ1IjoiZ2lybWF5bmwyMSIsImEiOiJjbWgyODQ4ancxNDdqMmlxeTY2aHFkdDdqIn0.kx667AeRIVB9gDo42gLOHA";

        try {
          const map = new mapboxgl.default.Map({
            container: mapRef.current,
            style: "mapbox://styles/mapbox/dark-v11",
            center: [
              currentUserLocation?.lng ?? 4.3007,
              currentUserLocation?.lat ?? 52.0705,
            ],
            zoom: 13,
            pitch: 0,
            bearing: 0,
          });

          map.on("load", () => {
            setIsLoaded(true);

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
                });
              }
              if (typeof map.setTerrain === "function") {
                map.setTerrain({ source: "mapbox-dem", exaggeration: 1.4 });
              }
            } catch (error) {
              console.error("[MapboxMap] Error configuring terrain:", error);
            }

            add3DBuildings(map, "standard");
            renderAllMarkers(map, mapboxgl, users, pois);
          });

          mapInstanceRef.current = map;
        } catch (error) {
          console.error("[MapboxMap] Error initializing Mapbox:", error);
        }
      })
      .catch((error) => {
        console.error("[MapboxMap] Error loading Mapbox GL:", error);
      });

    return () => {
      clearMarkers();
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [
    users,
    pois,
    currentUserLocation,
    add3DBuildings,
    renderAllMarkers,
    clearMarkers,
  ]);

  useEffect(() => {
    if (!mapInstanceRef.current || !isLoaded) return;

    import("mapbox-gl")
      .then((mapboxgl) => {
        renderAllMarkers(mapInstanceRef.current, mapboxgl, users, pois);
      })
      .catch((error) => {
        console.error("[MapboxMap] Failed to update markers:", error);
      });
  }, [users, pois, isLoaded, renderAllMarkers]);

  useEffect(() => {
    if (
      !mapInstanceRef.current ||
      !isLoaded ||
      !currentUserLocation ||
      !showCurrentUserRadar
    ) {
      if (currentUserRadarRef.current) {
        currentUserRadarRef.current.remove();
        currentUserRadarRef.current = null;
      }
      return;
    }

    const map = mapInstanceRef.current;

    import("mapbox-gl")
      .then((mapboxgl) => {
        try {
          ensureRadarStyles();

          if (!currentUserRadarRef.current) {
            const el = document.createElement("div");
            el.className = "current-user-radar-marker";
            el.innerHTML = `
              <div class="pulse-ring"></div>
              <div class="pulse-ring"></div>
              <div class="pulse-ring"></div>
              <div class="radar-sweep"></div>
              <div class="radar-core"></div>
            `;
            currentUserRadarRef.current = new mapboxgl.default.Marker({
              element: el,
              anchor: "center",
            })
              .setLngLat([currentUserLocation.lng, currentUserLocation.lat])
              .addTo(map);
          } else {
            currentUserRadarRef.current.setLngLat([
              currentUserLocation.lng,
              currentUserLocation.lat,
            ]);
          }
        } catch (error) {
          console.error("[MapboxMap] Error adding radar marker:", error);
        }
      })
      .catch((error) => {
        console.error("[MapboxMap] Error loading Mapbox GL for radar:", error);
      });

    return () => {
      try {
        if (currentUserRadarRef.current) {
          currentUserRadarRef.current.remove();
          currentUserRadarRef.current = null;
        }
      } catch (error) {
        console.warn("[MapboxMap] Radar cleanup issue:", error);
      }
    };
  }, [currentUserLocation, isLoaded, showCurrentUserRadar, ensureRadarStyles]);

  const showRadarOverlay =
    isLoaded && (activeFilter === "people" || activeFilter === "highlights");
  const tint = filterTint[activeFilter];

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

      {showRadarOverlay && (
        <div className="pointer-events-none absolute inset-0 z-[5]">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            {[180, 280, 380, 480].map((size, index) => (
              <motion.div
                key={size}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-500/15"
                style={{ width: `${size}px`, height: `${size}px` }}
                animate={{ opacity: [0.25, 0.45, 0.25] }}
                transition={{
                  duration: 6,
                  ease: "easeInOut",
                  repeat: Infinity,
                  delay: index * 0.5,
                }}
              />
            ))}
          </div>
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[520px] w-[520px] rounded-full"
            style={{
              background:
                "conic-gradient(from 0deg, rgba(56,189,248,0.55), rgba(56,189,248,0.12) 45%, transparent 68%)",
              filter: "blur(4px)",
            }}
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 18, ease: "linear", repeat: Infinity }}
          />
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 rounded-full border-2 border-white bg-cyan-500 shadow-lg shadow-cyan-500/60"
            animate={{ scale: [0.8, 1.1, 0.8], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      )}

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
                      onClick={() =>
                        changeMapStyle(id as "standard" | "satellite" | "3d")
                      }
                      className={`flex w-full items-center gap-3 px-4 py-3 text-sm transition hover:bg-white/5 ${
                        mapStyle === id
                          ? "bg-white/10 text-emerald-200"
                          : "text-white/80"
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
  );
}
