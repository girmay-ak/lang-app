"use client";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertCircle,
  ArrowLeft,
  CalendarCheck,
  Heart,
  Loader2,
  MapPin,
  MessageCircle,
  Mic,
  Send,
  Smile,
  Sparkles,
  Filter,
  Users,
  Zap,
  X,
} from "lucide-react";
import { MapboxMap, type MapFilter, type MapPoi } from "./mapbox-map";
import { FilterPanel } from "./filter-panel";
import { useMap } from "@/hooks/use-map";
import { userService, type UserRecord } from "@/lib/services/user-service";
import { chatService } from "@/lib/services/chat-service";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";

interface MapUser {
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
  languagesSpoken: { language: string; flag: string; level: string }[];
  isFallbackLocation?: boolean;
  availabilityMessage?: string | null;
  availabilityEmoji?: string | null;
  isViewer?: boolean;
}

const FALLBACK_CITY_CENTER = {
  latitude: 52.0705,
  longitude: 4.3007,
};

const DEN_HAAG_BOUNDS = {
  north: 52.125,
  south: 52.025,
  east: 4.41,
  west: 4.235,
};

const AVAILABILITY_EMOJIS = ["☕", "🧋", "💬", "🎧", "🏖"] as const;

const MAP_FILTERS: Array<{
  id: MapFilter;
  icon: string;
  label: string;
  hint: string;
}> = [
  {
    id: "people",
    icon: "👥",
    label: "People",
    hint: "Nearby language partners",
  },
  { id: "places", icon: "🏪", label: "Places", hint: "Cafés & schools" },
  {
    id: "events",
    icon: "📅",
    label: "Events",
    hint: "Pop-up exchange sessions",
  },
  {
    id: "highlights",
    icon: "⭐",
    label: "Highlights",
    hint: "Live meetups & available friends",
  },
];

const toPositiveHash = (value: string) => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
};

const generateDenHaagCoordinate = (
  userId: string,
  axis: "lat" | "lng",
  offset: number,
) => {
  const hash = toPositiveHash(`${userId}-${axis}-${offset}`);
  const normalized = (hash % 10000) / 10000;

  if (axis === "lat") {
    return (
      DEN_HAAG_BOUNDS.south +
      (DEN_HAAG_BOUNDS.north - DEN_HAAG_BOUNDS.south) * normalized
    );
  }

  return (
    DEN_HAAG_BOUNDS.west +
    (DEN_HAAG_BOUNDS.east - DEN_HAAG_BOUNDS.west) * normalized
  );
};

const resolveUserCoordinates = (
  userId: string,
  latitude?: number | null,
  longitude?: number | null,
) => {
  if (typeof latitude === "number" && typeof longitude === "number") {
    return { latitude, longitude, isFallback: false };
  }

  return {
    latitude: generateDenHaagCoordinate(userId, "lat", 1),
    longitude: generateDenHaagCoordinate(userId, "lng", 2),
    isFallback: true,
  };
};

const LANGUAGE_FLAG_MAP: Record<string, string> = {
  af: "🇿🇦",
  ar: "🇸🇦",
  de: "🇩🇪",
  en: "🇬🇧",
  es: "🇪🇸",
  fr: "🇫🇷",
  it: "🇮🇹",
  ja: "🇯🇵",
  nl: "🇳🇱",
  pt: "🇵🇹",
  ru: "🇷🇺",
  sv: "🇸🇪",
  zh: "🇨🇳",
  "zh-tw": "🇹🇼",
  japanese: "🇯🇵",
  spanish: "🇪🇸",
  french: "🇫🇷",
  german: "🇩🇪",
  english: "🇬🇧",
  dutch: "🇳🇱",
  portuguese: "🇵🇹",
  italian: "🇮🇹",
  arabic: "🇸🇦",
  swedish: "🇸🇪",
};

const LANGUAGE_NAME_MAP: Record<string, string> = {
  af: "Afrikaans",
  ar: "Arabic",
  de: "German",
  en: "English",
  es: "Spanish",
  fr: "French",
  it: "Italian",
  ja: "Japanese",
  nl: "Dutch",
  pt: "Portuguese",
  ru: "Russian",
  sv: "Swedish",
  zh: "Chinese",
  "zh-tw": "Chinese (Traditional)",
};

const getLanguageFlag = (language: string): string => {
  if (!language) return "🌍";
  const key = language.toLowerCase();
  return LANGUAGE_FLAG_MAP[key] || LANGUAGE_FLAG_MAP[key.slice(0, 2)] || "🌍";
};

const getLanguageName = (language: string): string => {
  if (!language) return "Language";
  const key = language.toLowerCase();
  return (
    LANGUAGE_NAME_MAP[key] ||
    language.charAt(0).toUpperCase() + language.slice(1)
  );
};

const MAPBOX_STATIC_TOKEN =
  process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ??
  "pk.eyJ1IjoiZ2lybWF5bmwyMSIsImEiOiJjbWgyODQ4ancxNDdqMmlxeTY2aHFkdDdqIn0.kx667AeRIVB9gDo42gLOHA";

const formatDistance = (km?: number): string => {
  if (typeof km !== "number" || Number.isNaN(km)) return "—";
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `${km.toFixed(1)}km`;
};

const ACTIVITY_EMOJI_MAP: Array<{ keywords: RegExp; emoji: string }> = [
  { keywords: /coffee|espresso|latte|☕/i, emoji: "☕" },
  { keywords: /tea|bubble|boba|🧋/i, emoji: "🧋" },
  { keywords: /park|walk|stroll|🌳/i, emoji: "🌳" },
  { keywords: /remote|laptop|work|💻/i, emoji: "💻" },
  { keywords: /museum|art|gallery/i, emoji: "🖼️" },
  { keywords: /study|library/i, emoji: "📚" },
];

const getAvailabilityEmoji = (description?: string | null) => {
  if (!description) return "✨";
  const match = ACTIVITY_EMOJI_MAP.find((item) =>
    item.keywords.test(description),
  );
  return match ? match.emoji : "✨";
};

const getTimeLeftLabel = (
  availability?: string | null,
  fallback?: string | null,
) => {
  if (availability) {
    const minuteMatch = availability.match(/(\d+)\s?(?:m|min|minutes?)/i);
    if (minuteMatch) {
      return `${minuteMatch[1]}m left`;
    }
  }

  if (fallback) {
    const minuteMatch = fallback.match(/(\d+)\s?(?:m|min|minutes?)/i);
    if (minuteMatch) {
      return `${minuteMatch[1]}m left`;
    }
  }

  return "Available now";
};

interface MapViewProps {
  onSetFlag: () => void;
  onProfileModalChange?: (isOpen: boolean) => void;
  onRegisterAvailabilityToggle?: (toggle: (() => void) | null) => void;
  onStartChat?: (chat: {
    conversationId: string;
    otherUserId: string;
    name: string;
    avatar: string;
    online: boolean;
  }) => void;
}

export function MapView({
  onSetFlag,
  onProfileModalChange,
  onRegisterAvailabilityToggle,
  onStartChat,
}: MapViewProps) {
  const [selectedUser, setSelectedUser] = useState<MapUser | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isAvailabilityModalOpen, setIsAvailabilityModalOpen] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const [availabilityDuration, setAvailabilityDuration] = useState<number>(60);
  const [tempIsAvailable, setTempIsAvailable] = useState(false);
  const [tempAvailabilityDuration, setTempAvailabilityDuration] =
    useState<number>(60);
  const [isSavingAvailability, setIsSavingAvailability] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(
    null,
  );
  const [connectMessage, setConnectMessage] = useState("");
  const [connectError, setConnectError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isOpeningChat, setIsOpeningChat] = useState(false);
  const [isMatching, setIsMatching] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [filterDistance, setFilterDistance] = useState(25);
  const [filterAvailableNow, setFilterAvailableNow] = useState(false);
  const [filterSkillLevel, setFilterSkillLevel] = useState<string[]>([]);
  const [currentCity, setCurrentCity] = useState<string | null>(null);
  const [availabilityMessage, setAvailabilityMessage] = useState("");
  const [tempAvailabilityMessage, setTempAvailabilityMessage] = useState("");
  const [availabilityEmoji, setAvailabilityEmoji] =
    useState<(typeof AVAILABILITY_EMOJIS)[number]>("💬");
  const [tempAvailabilityEmoji, setTempAvailabilityEmoji] =
    useState<(typeof AVAILABILITY_EMOJIS)[number]>("💬");
  const [activeMapFilter, setActiveMapFilter] = useState<MapFilter>("people");
  const [selectedPoi, setSelectedPoi] = useState<MapPoi | null>(null);
  const [currentUserProfile, setCurrentUserProfile] =
    useState<UserRecord | null>(null);
  const [recentEventIds, setRecentEventIds] = useState<string[]>([]);
  const previousEventIdsRef = useRef<Set<string>>(new Set());

  const { toast } = useToast();

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = window.localStorage.getItem("availability-meta");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.message) {
          setAvailabilityMessage(String(parsed.message).slice(0, 100));
        }
        if (parsed?.emoji && AVAILABILITY_EMOJIS.includes(parsed.emoji)) {
          setAvailabilityEmoji(
            parsed.emoji as (typeof AVAILABILITY_EMOJIS)[number],
          );
        }
      }
    } catch (error) {
      console.warn("[MapView] Failed to restore availability meta:", error);
    }
  }, []);

  const {
    users: nearbyUsers,
    userLocation,
    loading: isLoading,
    error: loadError,
    refetch,
  } = useMap({
    distance: filterDistance,
    availableNow: filterAvailableNow,
    languages: [],
    skillLevel: filterSkillLevel,
  });

  useEffect(() => {
    let isMounted = true;
    userService
      .getCurrentUser()
      .then((user) => {
        if (!isMounted) return;
        setCurrentUserProfile(user ?? null);
        const normalizedCity = user?.city?.trim();
        setCurrentCity(
          normalizedCity && normalizedCity.length > 0 ? normalizedCity : null,
        );
        if (!availabilityMessage && user?.bio) {
          setAvailabilityMessage(user.bio.slice(0, 100));
        }
      })
      .catch((error) => {
        console.warn("[MapView] Failed to fetch current user:", error);
        if (isMounted) {
          setCurrentCity(null);
          setCurrentUserProfile(null);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [availabilityMessage]);

  const mapUsers = useMemo<MapUser[]>(() => {
    return nearbyUsers.map((dbUser) => {
      const coordinates = resolveUserCoordinates(
        dbUser.id,
        dbUser.latitude,
        dbUser.longitude,
      );
      const primaryLanguageCode =
        dbUser.languages_speak?.[0] ?? dbUser.languages_learn?.[0] ?? "en";
      const languageName = getLanguageName(primaryLanguageCode);
      const flag = getLanguageFlag(primaryLanguageCode);

      const spoken = (dbUser.languages_speak ?? []).map((code) => ({
        language: getLanguageName(code),
        flag: getLanguageFlag(code),
        level: "Native",
      }));

      const learning = (dbUser.languages_learn ?? []).map((code) => ({
        language: getLanguageName(code),
        flag: getLanguageFlag(code),
        level: "Learning",
      }));

      const languagesSpoken = [...spoken, ...learning];
      const nativeFlagIcon = spoken[0]?.flag ?? flag;

      return {
        id: dbUser.id,
        name: dbUser.full_name ?? "Language Explorer",
        language: languageName,
        flag,
        nativeFlag: nativeFlagIcon,
        distance: dbUser.distanceFormatted ?? formatDistance(dbUser.distance),
        lat: coordinates.latitude,
        lng: coordinates.longitude,
        bio: dbUser.bio ?? "Language enthusiast ready to connect.",
    availableFor: "30 min",
        image: dbUser.avatar_url ?? "/placeholder-user.jpg",
        isOnline: Boolean(dbUser.is_online),
        rating: 4.8,
    responseTime: "2 min",
        currentLocation: dbUser.city ?? "Unknown location",
        availableNow: dbUser.availability_status === "available",
        timePreference:
          dbUser.availability_status === "available"
            ? "Available now"
            : "Flexible schedule",
        languagesSpoken:
          languagesSpoken.length > 0
            ? languagesSpoken
            : [
                {
                  language: languageName,
                  flag,
                  level: "Native",
                },
              ],
        isFallbackLocation: coordinates.isFallback,
        availabilityMessage:
          dbUser.bio?.slice(0, 100) ??
          (dbUser.availability_status === "available"
            ? "Available for a quick conversation."
            : "Ping me to schedule a language exchange."),
        availabilityEmoji:
          dbUser.availability_status === "available" ? "💬" : "🌙",
        isViewer: false,
      };
    });
  }, [nearbyUsers]);

  const viewerLanguages = useMemo(() => {
    const speak =
      currentUserProfile?.languages_speak?.map((code) => ({
        language: getLanguageName(code),
        flag: getLanguageFlag(code),
        level: "Native",
      })) ?? [];

    const learn =
      currentUserProfile?.languages_learn?.map((code) => ({
        language: getLanguageName(code),
        flag: getLanguageFlag(code),
        level: "Learning",
      })) ?? [];

    const combined = [...speak, ...learn];
    if (combined.length === 0) {
      return [
        {
          language: "English",
          flag: getLanguageFlag("en"),
          level: "Native",
        },
      ];
    }
    return combined;
  }, [currentUserProfile]);

  useEffect(() => {
    if (!selectedUser) return;
    const stillExists = mapUsers.some((user) => user.id === selectedUser.id);
    if (!stillExists) {
      setSelectedUser(null);
      onProfileModalChange?.(false);
    }
  }, [mapUsers, onProfileModalChange, selectedUser]);

  useEffect(() => {
    setIsAvailable(filterAvailableNow);
  }, [filterAvailableNow]);

  const effectiveUserLocation = userLocation ?? {
    lat: FALLBACK_CITY_CENTER.latitude,
    lng: FALLBACK_CITY_CENTER.longitude,
  };
  const nearbyCount = nearbyUsers.length;
  const displayCity = currentCity ?? "Den Haag";
  const mapPreviewUrl = useMemo(() => {
    if (!effectiveUserLocation || !MAPBOX_STATIC_TOKEN) return null;
    const { lat, lng } = effectiveUserLocation;
    const formattedLat = Number.isFinite(lat)
      ? lat.toFixed(6)
      : FALLBACK_CITY_CENTER.latitude.toFixed(6);
    const formattedLng = Number.isFinite(lng)
      ? lng.toFixed(6)
      : FALLBACK_CITY_CENTER.longitude.toFixed(6);
    return `https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/pin-s+38bdf8(${formattedLng},${formattedLat})/${formattedLng},${formattedLat},13,0/480x240@2x?access_token=${MAPBOX_STATIC_TOKEN}`;
  }, [effectiveUserLocation]);

  const viewerMarker = useMemo<MapUser | null>(() => {
    if (!effectiveUserLocation) return null;
    return {
      id: "viewer",
      name: currentUserProfile?.full_name ?? "You",
      language: viewerLanguages[0]?.language ?? "Any language",
      flag: viewerLanguages[0]?.flag ?? "🌍",
      distance: "0m",
      lat: effectiveUserLocation.lat,
      lng: effectiveUserLocation.lng,
      bio: currentUserProfile?.bio ?? "Ready to meet nearby learners.",
      availableFor: `${availabilityDuration} min`,
      image: currentUserProfile?.avatar_url ?? "/placeholder-user.jpg",
    isOnline: true,
      rating: 5,
      responseTime: "Instant",
      currentLocation: displayCity,
      availableNow: isAvailable,
      timePreference: isAvailable ? "Available now" : "Offline",
      languagesSpoken: viewerLanguages,
      isFallbackLocation: false,
      availabilityMessage: availabilityMessage || "Ready to connect nearby.",
      availabilityEmoji: availabilityEmoji,
      isViewer: true,
    };
  }, [
    effectiveUserLocation,
    currentUserProfile,
    viewerLanguages,
    availabilityDuration,
    displayCity,
    isAvailable,
    availabilityMessage,
    availabilityEmoji,
  ]);

  const basePois = useMemo<MapPoi[]>(() => {
    if (!effectiveUserLocation) return [];
    const { lat, lng } = effectiveUserLocation;
    return [
      {
        id: "cafe-esperanto",
        type: "cafe",
        title: "Café Esperanto",
        subtitle: "International coffee chat",
        languages: ["ES", "EN"],
        time: "Today • 17:30",
        emoji: "☕",
        lat: lat + 0.006,
        lng: lng + 0.004,
        description: "Sip espresso and trade idioms with local linguaphiles.",
      },
      {
        id: "school-polyglot",
        type: "school",
        title: "Polyglot Lab",
        subtitle: "Language studio",
        languages: ["NL", "EN", "FR"],
        time: "Weekdays • 09:00-18:00",
        emoji: "🏫",
        lat: lat - 0.004,
        lng: lng - 0.006,
        description:
          "Drop-in pronunciation booths and tutoring corners for immersive practice.",
      },
      {
        id: "event-tandem-sunset",
        type: "event",
        title: "Sunset Tandem",
        subtitle: "Beach walk & chats",
        languages: ["EN", "DE", "ES"],
        time: "Today • 19:00",
        emoji: "📅",
        lat: lat + 0.008,
        lng: lng - 0.003,
        description:
          "Evening stroll by the dunes with rotating partners every 10 minutes.",
      },
      {
        id: "event-silent-disco",
        type: "event",
        title: "Silent Disco Stories",
        subtitle: "Audio exchange",
        languages: ["EN", "KO", "JP"],
        time: "Tomorrow • 21:00",
        emoji: "🎧",
        lat: lat - 0.007,
        lng: lng + 0.005,
        description:
          "Pair up, plug in, and narrate your playlist picks in another language.",
      },
      {
        id: "cafe-matcha",
        type: "cafe",
        title: "Matcha & Manuscripts",
        subtitle: "Tea house micro-meet",
        languages: ["JP", "EN"],
        time: "Sat • 14:00",
        emoji: "🧋",
        lat: lat + 0.002,
        lng: lng + 0.007,
        description: "Guided kanji sketching over calming tea flights.",
      },
    ];
  }, [effectiveUserLocation]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const currentEventIds = basePois
      .filter((poi) => poi.type === "event")
      .map((poi) => poi.id);
    const previousIds = previousEventIdsRef.current;
    const newIds = currentEventIds.filter((id) => !previousIds.has(id));
    previousEventIdsRef.current = new Set(currentEventIds);
    if (newIds.length === 0) return;
    setRecentEventIds((prev) => Array.from(new Set([...prev, ...newIds])));
    const timeout = window.setTimeout(() => {
      setRecentEventIds((prev) => prev.filter((id) => !newIds.includes(id)));
    }, 8000);
    return () => window.clearTimeout(timeout);
  }, [basePois]);

  const poisForMap = useMemo<MapPoi[]>(() => {
    if (!recentEventIds.length) return basePois;
    return basePois.map((poi) => ({
      ...poi,
      isNew: recentEventIds.includes(poi.id),
    }));
  }, [basePois, recentEventIds]);

  const usersForMap = useMemo(() => {
    if (activeMapFilter === "places" || activeMapFilter === "events") {
      return viewerMarker ? [viewerMarker] : [];
    }
    const base =
      activeMapFilter === "highlights"
        ? mapUsers.filter((user) => user.availableNow)
        : mapUsers;
    return viewerMarker ? [viewerMarker, ...base] : base;
  }, [activeMapFilter, viewerMarker, mapUsers]);

  const filteredPois = useMemo(() => {
    switch (activeMapFilter) {
      case "places":
        return poisForMap.filter(
          (poi) => poi.type === "cafe" || poi.type === "school",
        );
      case "events":
        return poisForMap.filter((poi) => poi.type === "event");
      case "highlights":
        return poisForMap.filter((poi) => poi.type === "event");
      default:
        return [];
    }
  }, [poisForMap, activeMapFilter]);

  useEffect(() => {
    if (!selectedPoi) return;
    const stillExists = filteredPois.some((poi) => poi.id === selectedPoi.id);
    if (!stillExists) {
      setSelectedPoi(null);
    }
  }, [filteredPois, selectedPoi]);

  useEffect(() => {
    if (!onRegisterAvailabilityToggle) return;

    const openAvailability = () => {
      setIsAvailabilityModalOpen(true);
    };

    onRegisterAvailabilityToggle(openAvailability);

    return () => {
      onRegisterAvailabilityToggle(null);
    };
  }, [onRegisterAvailabilityToggle]);

  useEffect(() => {
    if (isAvailabilityModalOpen) {
      setAvailabilityError(null);
      setTempIsAvailable(isAvailable);
      setTempAvailabilityDuration(availabilityDuration);
      setTempAvailabilityMessage(availabilityMessage);
      setTempAvailabilityEmoji(availabilityEmoji);
    }
  }, [
    isAvailabilityModalOpen,
    isAvailable,
    availabilityDuration,
    availabilityMessage,
    availabilityEmoji,
  ]);

  const handleRefresh = () => {
    refetch().catch((error) => {
      console.error("[MapView] Refresh failed:", error);
    });
  };

  const handleUserSelect = (user: MapUser | null) => {
    if (user?.isViewer) {
      return;
    }
    setSelectedUser(user);
    onProfileModalChange?.(user !== null);
    setConnectMessage("");
    setConnectError(null);
  };

  const durationOptions = [30, 60, 90, 120] as const;

  const handleToggleAvailability = () => {
    if (isSavingAvailability) return;
    setTempIsAvailable((prev) => !prev);
  };

  const handleSaveAvailability = async () => {
    const wasAvailable = isAvailable;
    const trimmedMessage = tempAvailabilityMessage.trim().slice(0, 100);
    const selectedEmoji = tempAvailabilityEmoji;

    setAvailabilityError(null);
    setIsSavingAvailability(true);
    try {
      const supabase = createClient();
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) throw sessionError;
      const userId = session?.user?.id;
      if (!userId)
        throw new Error("Please sign in again to update availability.");

      await userService.updateAvailability(
        userId,
        tempIsAvailable ? "available" : "offline",
      );

      setIsAvailable(tempIsAvailable);
      setAvailabilityDuration(tempAvailabilityDuration);
      setFilterAvailableNow(tempIsAvailable);
      setAvailabilityMessage(trimmedMessage);
      setAvailabilityEmoji(selectedEmoji);
      if (typeof window !== "undefined") {
        try {
          window.localStorage.setItem(
            "availability-meta",
            JSON.stringify({ message: trimmedMessage, emoji: selectedEmoji }),
          );
        } catch (storageError) {
          console.warn(
            "[MapView] Failed to persist availability meta:",
            storageError,
          );
        }
      }
      setIsAvailabilityModalOpen(false);
      if (tempIsAvailable && !wasAvailable) {
        toast({
          title: `${selectedEmoji} You’re now live`,
          description:
            trimmedMessage.length > 0
              ? `${trimmedMessage} • Visible in ${displayCity} for ${tempAvailabilityDuration} minutes.`
              : `Learners nearby in ${displayCity} can see you for the next ${tempAvailabilityDuration} minutes.`,
        });
      }
      await refetch();
    } catch (error: any) {
      console.error("[MapView] Availability update error:", error);
      setAvailabilityError(
        error?.message ?? "Failed to update availability. Please try again.",
      );
    } finally {
      setIsSavingAvailability(false);
    }
  };

  const handleConnectAndChat = async () => {
    if (!selectedUser || isConnecting) return;

    setConnectError(null);
    setIsConnecting(true);

    try {
      const supabase = createClient();
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) throw sessionError;
      if (!session?.user) {
        throw new Error("Please sign in again to start a conversation.");
      }

      const conversation = await chatService.createOrGetConversation(
        selectedUser.id,
      );

      const messageContent = connectMessage.trim();
      if (messageContent) {
        await chatService.sendMessage(conversation.id, messageContent, "text");
      }

      onStartChat?.({
        conversationId: conversation.id,
        otherUserId: selectedUser.id,
        name: selectedUser.name,
        avatar: selectedUser.image || "/placeholder-user.jpg",
        online: selectedUser.isOnline,
      });

      setConnectMessage("");
      setSelectedUser(null);
      onProfileModalChange?.(false);
    } catch (error: any) {
      console.error("[MapView] Failed to start chat:", error);
      setConnectError(
        error?.message ?? "We couldn’t start the chat. Please try again.",
      );
    } finally {
      setIsConnecting(false);
    }
  };

  const handleAskToMatch = () => {
    if (!selectedUser || isMatching) return;
    setIsMatching(true);
    toast({
      title: "Match request sent",
      description: `We let ${selectedUser.name.split(" ")[0]} know you’d like to connect.`,
    });
    setTimeout(() => setIsMatching(false), 1200);
  };

  const handleOpenChat = async () => {
    if (!selectedUser || isOpeningChat) return;

    try {
      setIsOpeningChat(true);
      const supabase = createClient();
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) throw sessionError;
      if (!session?.user) {
        throw new Error("Please sign in again to start a conversation.");
      }

      const conversation = await chatService.createOrGetConversation(
        selectedUser.id,
      );

      onStartChat?.({
        conversationId: conversation.id,
        otherUserId: selectedUser.id,
        name: selectedUser.name,
        avatar: selectedUser.image || "/placeholder-user.jpg",
        online: selectedUser.isOnline,
      });

      setSelectedUser(null);
      onProfileModalChange?.(false);
    } catch (error: any) {
      console.error("[MapView] Failed to open chat:", error);
      toast({
        title: "Unable to open chat",
        description: error?.message ?? "Please try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setIsOpeningChat(false);
    }
  };

  const handleInviteToEvent = () => {
    if (!selectedUser || isInviting) return;
    setIsInviting(true);
    toast({
      title: "Invite sent",
      description: `Sent a quick invite to ${selectedUser.name.split(" ")[0]}!`,
    });
    setTimeout(() => setIsInviting(false), 900);
  };

  if (selectedUser) {
    const nativeLanguages = selectedUser.languagesSpoken.filter(
      (lang) => lang.level === "Native",
    );
    const learningLanguages = selectedUser.languagesSpoken.filter(
      (lang) => lang.level !== "Native",
    );
    const distanceLabel = selectedUser.distance || "Nearby";
    const availabilityEmoji = getAvailabilityEmoji(
      selectedUser.availableFor || selectedUser.timePreference,
    );
    const timeLeftLabel = getTimeLeftLabel(
      selectedUser.availableFor,
      selectedUser.timePreference,
    );
    const locationLabel = selectedUser.currentLocation || displayCity;
    const userHandle = `@${selectedUser.name.toLowerCase().replace(/\s+/g, "")}`;
    const canSendMessage = connectMessage.trim().length > 0;

    return (
      <div className="relative h-full">
        <div className="pointer-events-none absolute inset-0 opacity-20">
          <MapboxMap
            users={usersForMap}
            pois={filteredPois}
            activeFilter={activeMapFilter}
            onUserClick={() => {}}
            onPoiClick={() => {}}
            currentUserLocation={effectiveUserLocation}
            showCurrentUserRadar={Boolean(
              isAvailable &&
                (activeMapFilter === "people" ||
                  activeMapFilter === "highlights"),
            )}
          />
        </div>

        <div className="absolute inset-0 flex justify-end p-3 sm:p-6">
          <motion.div
            initial={{ x: 120, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 120, opacity: 0 }}
            transition={{ type: "spring", stiffness: 120, damping: 18 }}
            className="relative flex h-full w-full max-w-md flex-col overflow-hidden rounded-[32px] border border-white/10 bg-slate-950/70 text-white shadow-[0_48px_120px_rgba(5,6,24,0.7)] backdrop-blur-2xl"
          >
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/15" />
            <div className="pointer-events-none absolute -top-24 right-[-90px] h-72 w-72 rounded-full bg-sky-500/25 blur-[160px]" />
            <div className="pointer-events-none absolute bottom-[-120px] left-[-90px] h-72 w-72 rounded-full bg-emerald-500/20 blur-[160px]" />

            <div className="relative flex h-full flex-col">
              <div className="flex items-center justify-between px-6 pt-6">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => handleUserSelect(null)}
                  className="h-11 w-11 rounded-full border border-white/10 bg-white/5 text-white transition hover:bg-white/15"
                >
                  <ArrowLeft className="h-5 w-5" />
              </Button>
                <motion.div
                  className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.28em] text-white/60"
                  animate={{ opacity: [0.6, 1, 0.6] }}
                  transition={{
                    duration: 6,
                    repeat: Infinity,
                    repeatType: "mirror",
                  }}
                >
                  <Sparkles className="h-4 w-4 text-emerald-300" />
                  Live
                </motion.div>
              </div>

              <div className="flex-1 overflow-y-auto px-6 pb-8">
                <motion.div
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05, duration: 0.35, ease: "easeOut" }}
                  className="relative mt-6 overflow-hidden rounded-[28px] border border-white/10 bg-white/10 p-6 shadow-[0_18px_45px_rgba(31,41,55,0.35)]"
                >
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-white/10" />
                  <div className="relative flex items-start gap-5">
                    <div className="relative">
                      <motion.span
                        className="absolute inset-0 rounded-[24px] bg-gradient-to-br from-emerald-400 via-sky-400 to-indigo-500 blur-[35px]"
                        animate={{
                          opacity: [0.4, 0.8, 0.4],
                          scale: [0.95, 1.05, 0.95],
                        }}
                        transition={{ duration: 6, repeat: Infinity }}
                      />
                      <Avatar className="relative h-20 w-20 rounded-[24px] border-4 border-white/40 shadow-[0_15px_35px_rgba(15,118,110,0.35)]">
                        <AvatarImage
                          src={selectedUser.image || "/placeholder.svg"}
                          alt={selectedUser.name}
                        />
                        <AvatarFallback className="bg-gradient-to-br from-emerald-400 to-sky-500 text-3xl font-bold text-white">
                    {selectedUser.name[0]}
                  </AvatarFallback>
                </Avatar>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-emerald-300" />
                        <span className="text-xs font-semibold uppercase tracking-[0.35em] text-white/60">
                          Available now
                        </span>
                      </div>
                <div>
                        <h2 className="text-2xl font-semibold text-white">
                          {selectedUser.name}
                        </h2>
                        <p className="text-sm text-white/70">
                          {userHandle} · {distanceLabel}
                        </p>
                      </div>
                </div>
              </div>

                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    {nativeLanguages.length > 0 && (
                      <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70">
                        <span className="font-semibold text-white/80">
                          Native
                        </span>
                        {nativeLanguages.map((lang) => (
                          <motion.span
                            key={`native-${lang.language}`}
                            className="text-xl"
                            animate={{ rotate: [0, 6, -4, 0] }}
                            transition={{
                              duration: 4.2,
                              repeat: Infinity,
                              repeatType: "loop",
                              delay: Math.random(),
                            }}
                          >
                            {lang.flag}
                          </motion.span>
                        ))}
                </div>
                    )}
                    {learningLanguages.length > 0 && (
                      <div className="flex items-center gap-2 rounded-full border border-sky-400/40 bg-sky-500/10 px-3 py-1.5 text-xs text-sky-100">
                        <span className="font-semibold uppercase tracking-wide text-sky-200">
                          Learning
                  </span>
                        {learningLanguages.map((lang) => (
                          <motion.span
                            key={`learn-${lang.language}`}
                            className="text-xl"
                            animate={{ rotate: [0, -5, 4, 0] }}
                            transition={{
                              duration: 4.6,
                              repeat: Infinity,
                              repeatType: "loop",
                              delay: Math.random(),
                            }}
                          >
                            {lang.flag}
                          </motion.span>
                        ))}
                </div>
                    )}
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.12, duration: 0.35, ease: "easeOut" }}
                  className="mt-6 space-y-4 rounded-[28px] border border-white/10 bg-white/5 p-6"
                >
                  <div className="flex items-start gap-3">
                    <Sparkles className="mt-0.5 h-5 w-5 text-emerald-300" />
                    <div>
                      <p className="text-sm leading-relaxed text-white/80">
                        {selectedUser.bio}
                      </p>
                  </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedUser.languagesSpoken.map((lang, index) => (
                      <span
                        key={`${lang.language}-${index}`}
                        className="flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium text-white/80 backdrop-blur"
                      >
                        <span className="text-lg">{lang.flag}</span>
                        <span className="tracking-wide">{lang.language}</span>
                        <span className="text-[10px] uppercase text-white/50">
                          {lang.level}
                        </span>
                      </span>
                    ))}
                </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.18, duration: 0.35, ease: "easeOut" }}
                  className="mt-6 overflow-hidden rounded-[28px] border border-emerald-500/25 bg-gradient-to-br from-emerald-500/20 via-sky-500/10 to-indigo-500/20 p-6 shadow-[0_24px_60px_rgba(16,185,129,0.25)]"
                >
                  <div className="relative z-10 flex items-start justify-between gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm font-medium text-white">
                        <span className="text-2xl">{availabilityEmoji}</span>
                        <span>{timeLeftLabel}</span>
                </div>
                      <p className="text-sm text-white/80">
                        {selectedUser.availableFor ||
                          "Open for a relaxed language exchange."}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-white/80">
                        <MapPin className="h-4 w-4 text-emerald-200" />
                        <span>{locationLabel}</span>
              </div>
                      </div>
                    <div className="relative h-24 w-24 overflow-hidden rounded-2xl border border-white/30 bg-white/10">
                      {mapPreviewUrl ? (
                        <Image
                          src={mapPreviewUrl}
                          alt={`Map preview for ${displayCity}`}
                          fill
                          sizes="96px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-2xl">
                          🗺️
                    </div>
                      )}
                  </div>
                </div>
                  <div className="mt-4 flex items-center gap-3 text-xs text-emerald-100/80">
                    <Sparkles className="h-4 w-4" />
                    <span>
                      Let’s make a plan right away — short notice meetups
                      welcome.
                    </span>
              </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.24, duration: 0.35, ease: "easeOut" }}
                  className="mt-6 grid gap-3 sm:grid-cols-3"
                >
                  <motion.button
                    type="button"
                    onClick={handleAskToMatch}
                    disabled={isMatching}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    animate={
                      isMatching ? { scale: [1, 1.08, 1] } : { scale: 1 }
                    }
                    transition={{ duration: 0.6 }}
                    className="flex h-14 flex-col items-center justify-center rounded-2xl border border-rose-300/40 bg-gradient-to-br from-rose-500/40 to-rose-500/20 text-sm font-semibold text-rose-50 shadow-lg shadow-rose-500/25 transition disabled:opacity-70"
                  >
                    <Heart className="h-4 w-4" />
                    Ask to Match
                  </motion.button>
                  <motion.button
                    type="button"
                    onClick={handleOpenChat}
                    disabled={isOpeningChat}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex h-14 flex-col items-center justify-center rounded-2xl border border-emerald-400/50 bg-gradient-to-br from-emerald-500/70 via-teal-500/60 to-sky-500/70 text-sm font-semibold text-emerald-50 shadow-lg shadow-emerald-500/30 transition disabled:opacity-70"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Send Message
                  </motion.button>
                  <motion.button
                    type="button"
                    onClick={handleInviteToEvent}
                    disabled={isInviting}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex h-14 flex-col items-center justify-center rounded-2xl border border-sky-400/50 bg-gradient-to-br from-sky-500/50 via-violet-500/45 to-indigo-500/45 text-sm font-semibold text-sky-50 shadow-lg shadow-sky-500/25 transition disabled:opacity-70"
                  >
                    <CalendarCheck className="h-4 w-4" />
                    Invite to Event
                  </motion.button>
                </motion.div>
              </div>

              <div className="relative border-t border-white/10 bg-slate-950/60 px-6 py-5">
                <AnimatePresence>
                  {connectError && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      className="mb-3 flex items-center gap-2 rounded-2xl border border-rose-400/40 bg-rose-500/15 px-4 py-2 text-sm text-rose-100"
                    >
                      <AlertCircle className="h-4 w-4" />
                      <span>{connectError}</span>
                    </motion.div>
                  )}
                </AnimatePresence>
                <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
                  <button
                    type="button"
                    className="text-white/60 transition hover:text-white"
                    aria-label="Add emoji"
                  >
                    <Smile className="h-5 w-5" />
                  </button>
                  <input
                    type="text"
                    value={connectMessage}
                    onChange={(event) => setConnectMessage(event.target.value)}
                    placeholder={`Say hi to ${selectedUser.name.split(" ")[0]}...`}
                    className="flex-1 bg-transparent text-sm text-white placeholder:text-white/50 focus:outline-none"
                    disabled={isConnecting}
                  />
                  <button
                    type="button"
                    className="text-white/60 transition hover:text-white disabled:opacity-50"
                    aria-label="Send voice note"
                    disabled
                  >
                    <Mic className="h-5 w-5" />
                  </button>
                  <motion.button
                    type="button"
                    onClick={handleConnectAndChat}
                    disabled={!canSendMessage || isConnecting}
                    whileHover={{
                      scale: canSendMessage && !isConnecting ? 1.05 : 1,
                    }}
                    whileTap={{
                      scale: canSendMessage && !isConnecting ? 0.96 : 1,
                    }}
                    className={`inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 via-sky-400 to-indigo-500 text-slate-950 shadow-lg transition ${
                      !canSendMessage || isConnecting ? "opacity-50" : ""
                    }`}
                  >
                    {isConnecting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
          </div>
        </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-background">
      <FilterPanel
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
      />

      {isLoading && (
        <div className="absolute inset-0 z-[1200] flex items-center justify-center bg-slate-950/70 backdrop-blur-md">
          <div className="text-center">
            <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-sky-500 border-t-transparent" />
            <p className="text-sm text-slate-200/80">
              Scanning for nearby partners...
            </p>
          </div>
        </div>
      )}

      {!isLoading && loadError && (
        <div className="absolute inset-x-4 top-20 z-[1200]">
          <div className="rounded-2xl border border-red-400/40 bg-red-500/20 px-4 py-3 text-sm text-red-100 shadow-xl backdrop-blur">
            <p className="font-semibold">
              We couldn&apos;t load nearby partners.
            </p>
            <button
              type="button"
              onClick={handleRefresh}
              className="mt-2 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/20"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {!isLoading && !loadError && nearbyCount === 0 && (
        <div className="absolute inset-0 z-[1100] flex items-center justify-center">
          <div className="pointer-events-auto max-w-sm rounded-3xl border border-white/10 bg-white/5 px-6 py-8 text-center text-white backdrop-blur-2xl shadow-2xl">
            <h3 className="text-lg font-semibold">No partners nearby yet</h3>
            <p className="mt-2 text-sm text-white/70">
              Adjust your availability window or refresh to widen the search.
            </p>
            <Button
              onClick={handleRefresh}
              className="mt-4 rounded-full bg-white/90 text-slate-900 hover:bg-white"
            >
              Refresh search
            </Button>
          </div>
        </div>
      )}

      {isAvailabilityModalOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 animate-fade-in">
          <div
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-md"
            onClick={() => setIsAvailabilityModalOpen(false)}
          />

          <div className="relative w-full max-w-md rounded-[32px] border border-white/10 bg-[#0b122a]/95 px-6 py-7 text-white shadow-[0_45px_120px_rgba(5,6,24,0.65)] backdrop-blur-[32px] sm:px-8">
            <div className="flex items-start justify-between gap-6">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-white/40">
                  Set Availability
                </p>
                <h3 className="mt-2 text-2xl font-semibold">
                  Let friends know you’re free
                </h3>
                <p className="mt-1 text-sm text-white/60">
                  Toggle your availability to show up for nearby learners in{" "}
                  {displayCity}.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAvailabilityModalOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition hover:bg-white/15"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 px-4 py-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                  <p className="flex items-center gap-2 text-sm font-semibold text-white">
                    <Zap className="h-4 w-4 text-emerald-300" />
                    Available Now
                  </p>
                  <p className="mt-1 text-xs text-white/60">
                    When enabled, other users can see you’re available for
                    language exchange.
                  </p>
                  </div>
                <motion.button
                  type="button"
                  onClick={handleToggleAvailability}
                  disabled={isSavingAvailability}
                  className={`relative inline-flex h-11 w-20 items-center overflow-hidden rounded-full p-1 transition-colors duration-200 ${
                    tempIsAvailable
                      ? "justify-end bg-gradient-to-r from-emerald-400/80 via-emerald-500/80 to-emerald-400/70 shadow-[0_0_25px_rgba(16,185,129,0.35)]"
                      : "justify-start bg-white/10"
                  } ${isSavingAvailability ? "cursor-not-allowed opacity-60" : "hover:bg-white/15"}`}
                >
                  <span className="sr-only">Toggle availability</span>
                  <motion.span
                    className="pointer-events-none absolute inset-0 rounded-full"
                    initial={false}
                    animate={{
                      opacity: tempIsAvailable ? 0.45 : 0,
                      scale: tempIsAvailable ? 1.05 : 0.92,
                      background: tempIsAvailable
                        ? "radial-gradient(circle at 50% 50%, rgba(16,185,129,0.55) 0%, rgba(16,185,129,0) 70%)"
                        : "transparent",
                    }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  />
                  <motion.span
                    layout
                    transition={{ type: "spring", stiffness: 320, damping: 20 }}
                    className="relative z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-lg"
                  >
                    <motion.span
                      className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-500"
                      initial={false}
                      animate={{ opacity: tempIsAvailable ? 1 : 0 }}
                      transition={{ duration: 0.25 }}
                    />
                    <motion.span
                      className="relative text-xs font-semibold"
                      initial={false}
                      animate={{
                        color: tempIsAvailable ? "#052e16" : "#0f172a",
                        scale: tempIsAvailable ? 1 : 0.95,
                      }}
                      transition={{ duration: 0.2 }}
                    >
                      {tempIsAvailable ? "On" : "Off"}
                    </motion.span>
                  </motion.span>
                </motion.button>
                  </div>
                </div>

            <AnimatePresence mode="wait">
              {tempIsAvailable ? (
                <motion.div
                  key="availability-on"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="mt-6 space-y-6"
                >
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4"
                  >
                    <div className="flex flex-col gap-3">
                  <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/40">
                          Custom Message
                        </p>
                        <p className="mt-1 text-xs text-white/60">
                          Share what makes this availability window special.
                        </p>
                  </div>
                      <Textarea
                        value={tempAvailabilityMessage}
                        onChange={(event) =>
                          setTempAvailabilityMessage(
                            event.target.value.slice(0, 100),
                          )
                        }
                        maxLength={100}
                        rows={3}
                        placeholder="e.g. ☕ Working from the café – open to conversation bursts!"
                        className="resize-none rounded-2xl border border-white/10 bg-slate-900/70 text-sm text-white placeholder:text-white/30 focus-visible:ring-1 focus-visible:ring-emerald-400/50"
                      />
                      <div className="flex items-center justify-between text-[11px] text-white/50">
                        <span>
                          {tempAvailabilityMessage.length}/100 characters
                        </span>
                        <div className="flex items-center gap-1 text-white/60">
                          <Smile className="h-3.5 w-3.5 text-emerald-300" />
                          <span>Pick a vibe</span>
                  </div>
                </div>
                      <div className="flex items-center gap-2">
                        {AVAILABILITY_EMOJIS.map((emoji) => {
                          const isActive = tempAvailabilityEmoji === emoji;
                          return (
                            <motion.button
                              key={emoji}
                              type="button"
                              onClick={() => setTempAvailabilityEmoji(emoji)}
                              whileTap={{ scale: 0.92 }}
                              className={`flex h-10 w-10 items-center justify-center rounded-full border transition ${
                                isActive
                                  ? "border-emerald-400 bg-emerald-500/20 text-emerald-100 shadow-[0_0_25px_rgba(16,185,129,0.35)]"
                                  : "border-white/10 bg-white/5 text-white/80 hover:bg-white/10"
                              }`}
                            >
                              <span className="text-lg">{emoji}</span>
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/40">
                      Duration
                    </p>
                    <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {durationOptions.map((minutes) => {
                        const isActive = tempAvailabilityDuration === minutes;
                        return (
                          <motion.button
                            key={minutes}
                            type="button"
                            onClick={() => setTempAvailabilityDuration(minutes)}
                            disabled={isSavingAvailability}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            className={`relative overflow-hidden rounded-2xl border px-4 py-3 text-sm font-semibold transition-colors ${
                              isActive
                                ? "border-emerald-400/80 bg-emerald-500/20 text-emerald-50"
                                : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
                            } ${isSavingAvailability ? "cursor-not-allowed opacity-60" : ""}`}
                          >
                            <motion.span
                              className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-400/50 via-emerald-500/20 to-emerald-400/0"
                              initial={false}
                              animate={{
                                opacity: isActive ? 1 : 0,
                                scale: isActive ? 1 : 0.9,
                                boxShadow: isActive
                                  ? "0 0 35px rgba(16,185,129,0.55)"
                                  : "0 0 0 rgba(0,0,0,0)",
                              }}
                              transition={{ duration: 0.3 }}
                            />
                            <span className="relative z-10">{minutes}m</span>
                          </motion.button>
                        );
                      })}
                  </div>
                    <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                      <Slider
                        value={[tempAvailabilityDuration]}
                        min={30}
                        max={120}
                        step={15}
                        onValueChange={(value) => {
                          const [first] = value;
                          if (typeof first === "number") {
                            setTempAvailabilityDuration(first);
                          }
                        }}
                      />
                      <div className="mt-2 flex items-center justify-between text-xs text-white/50">
                        <span>Availability window</span>
                        <span>{tempAvailabilityDuration} minutes</span>
                  </div>
                </div>
                  </div>

                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: 0.05,
                      duration: 0.25,
                      ease: "easeOut",
                    }}
                    className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/40">
                        Location
                      </p>
                      <p className="mt-1 text-sm font-medium text-white">
                        {displayCity}
                      </p>
                      <p className="mt-1 text-xs text-white/50">
                        {currentCity
                          ? "Updated automatically from your latest check-in."
                          : "Using your default meetup city for now."}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="h-9 rounded-full border border-white/10 px-4 text-xs font-semibold text-sky-300 transition hover:bg-white/10"
                    >
                      Change
              </button>
                  </motion.div>

                  {mapPreviewUrl && (
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        delay: 0.1,
                        duration: 0.25,
                        ease: "easeOut",
                      }}
                      className="overflow-hidden rounded-2xl border border-white/10 bg-white/5"
                    >
                      <div className="relative h-40 w-full">
                        <Image
                          src={mapPreviewUrl}
                          alt={`Map preview of ${displayCity}`}
                          fill
                          sizes="(min-width: 640px) 480px, 100vw"
                          className="object-cover"
                        />
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/40 via-slate-950/10 to-transparent" />
            </div>
                      <div className="px-4 py-3 text-xs text-white/60">
                        Preview updates after you save your availability.
                      </div>
                    </motion.div>
                  )}

                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: 0.15,
                      duration: 0.25,
                      ease: "easeOut",
                    }}
                    className="rounded-2xl border border-emerald-400/40 bg-emerald-500/15 px-4 py-3 text-sm text-emerald-100 shadow-[0_18px_35px_rgba(16,185,129,0.15)]"
                  >
                    <span className="font-semibold text-emerald-100">
                      {tempAvailabilityEmoji} {tempAvailabilityDuration} minutes
                      live
                    </span>
                    <p className="mt-1 text-sm text-emerald-50/90">
                      {tempAvailabilityMessage
                        ? tempAvailabilityMessage
                        : "We’ll surface you to nearby explorers while you’re open."}
                    </p>
                  </motion.div>
                </motion.div>
              ) : (
                <motion.div
                  key="availability-off"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="mt-6 rounded-2xl border border-white/10 bg-white/5 px-4 py-5 text-center text-sm text-white/60"
                >
                  You&apos;re currently unavailable
                </motion.div>
              )}
            </AnimatePresence>

            {availabilityError && (
              <p className="mt-4 text-sm text-rose-300">{availabilityError}</p>
            )}

              <Button
              onClick={handleSaveAvailability}
              disabled={isSavingAvailability}
              className={`mt-8 h-12 w-full rounded-full text-sm font-semibold shadow-lg transition ${
                tempIsAvailable
                  ? "bg-gradient-to-r from-emerald-400 to-emerald-500 text-emerald-950 hover:from-emerald-500 hover:to-emerald-600 disabled:opacity-70 disabled:hover:from-emerald-400 disabled:hover:to-emerald-500"
                  : "bg-white/10 text-white hover:bg-white/15 disabled:opacity-70"
              }`}
            >
              {isSavingAvailability
                ? "Saving..."
                : tempIsAvailable
                  ? "Set as Available"
                  : "Set as Unavailable"}
              </Button>
          </div>
        </div>
      )}

      <div className="absolute top-4 left-4 right-4 z-[1000] pointer-events-none">
        <div className="flex items-center justify-between">
        <Button
          size="icon"
            className="glass-button h-12 w-12 rounded-full pointer-events-auto"
          onClick={() => setIsFilterOpen(true)}
        >
          <Filter className="h-5 w-5 text-white" />
        </Button>

          <div className="glass-button pointer-events-auto flex items-center gap-2 rounded-full px-4 py-2">
          <Users className="h-4 w-4 text-white" />
            <span className="text-sm font-semibold text-white">
              {nearbyCount} nearby
            </span>
        </div>

        <Button
          size="icon"
            className={`pointer-events-auto h-12 w-12 rounded-full transition-all shadow-lg ${
            isAvailable
                ? "animate-pulse-slow bg-gradient-to-br from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600"
              : "glass-button"
          }`}
          onClick={() => setIsAvailabilityModalOpen(true)}
        >
            <Zap className="h-5 w-5 text-white" />
        </Button>
        </div>

        <div className="pointer-events-auto mt-4 flex justify-center">
          <LayoutGroup>
            <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-2 backdrop-blur">
              {MAP_FILTERS.map((filter) => {
                const isActive = activeMapFilter === filter.id;
                return (
                  <motion.button
                    key={filter.id}
                    type="button"
                    onClick={() => setActiveMapFilter(filter.id)}
                    className="relative flex flex-col items-center rounded-full px-3 py-1.5 text-center text-white/70 transition hover:text-white"
                    whileTap={{ scale: 0.9 }}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="map-filter-pill"
                        className="absolute inset-0 rounded-full bg-white/15"
                        transition={{
                          type: "spring",
                          stiffness: 420,
                          damping: 32,
                        }}
                      />
                    )}
                    <span className="relative text-lg leading-none">
                      {filter.icon}
                    </span>
                    <span className="relative mt-1 text-[10px] font-semibold uppercase tracking-[0.25em]">
                      {filter.label}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </LayoutGroup>
        </div>
        <p className="pointer-events-none mt-2 text-center text-[11px] text-white/55">
          {MAP_FILTERS.find((filter) => filter.id === activeMapFilter)?.hint}
        </p>
      </div>

      <div className="absolute inset-0">
        <MapboxMap
          users={usersForMap}
          pois={filteredPois}
          activeFilter={activeMapFilter}
          onUserClick={handleUserSelect}
          onPoiClick={setSelectedPoi}
          currentUserLocation={effectiveUserLocation}
          showCurrentUserRadar={Boolean(
            isAvailable &&
              (activeMapFilter === "people" ||
                activeMapFilter === "highlights"),
          )}
        />
      </div>

      <AnimatePresence>
        {selectedPoi && (
          <motion.div
            key={selectedPoi.id}
            initial={{ opacity: 0, y: 160 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 160 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className="pointer-events-none fixed inset-x-0 bottom-0 z-[2100] px-4 pb-6"
          >
            <div className="pointer-events-auto mx-auto w-full max-w-md rounded-[28px] border border-white/10 bg-[#0b122a]/95 px-6 py-6 text-white shadow-[0_40px_120px_rgba(5,6,24,0.75)] backdrop-blur-xl">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{selectedPoi.emoji}</span>
                  <div>
                    <h3 className="text-lg font-semibold">
                      {selectedPoi.title}
                    </h3>
                    {selectedPoi.subtitle && (
                      <p className="text-sm text-white/60">
                        {selectedPoi.subtitle}
                      </p>
                    )}
    </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPoi(null)}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/70 transition hover:bg-white/10"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {selectedPoi.languages.map((language) => (
                  <span
                    key={`${selectedPoi.id}-${language}`}
                    className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-emerald-100"
                  >
                    {language}
                  </span>
                ))}
              </div>

              {selectedPoi.description && (
                <p className="mt-4 text-sm text-white/70">
                  {selectedPoi.description}
                </p>
              )}

              {selectedPoi.time && (
                <div className="mt-4 flex items-center gap-2 text-xs text-white/60">
                  <CalendarCheck className="h-4 w-4 text-emerald-300" />
                  <span>{selectedPoi.time}</span>
                </div>
              )}

              <div className="mt-6 flex items-center justify-between gap-3">
                <div className="text-xs text-white/50">
                  <p>Tap Join to RSVP and notify your circle.</p>
                  <p className="mt-1 flex items-center gap-1 text-white/40">
                    <MessageCircle className="h-3.5 w-3.5" />
                    <span>Chats unlock 30 minutes before start.</span>
                  </p>
                </div>
                <Button className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-emerald-950 shadow-lg transition hover:bg-emerald-400">
                  Join
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
