import React, { useState, useEffect, useRef } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Image, Dimensions, Modal, Animated, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import Constants from 'expo-constants'
import { WebView } from 'react-native-webview'
import { Colors } from '../constants/Colors'
import { MapPin, Users, Zap, Filter, Layers, X, MessageCircle, Star, Clock, MapPin as MapPinIcon } from 'lucide-react-native'
import * as Location from 'expo-location'
import { createClient } from '../lib/supabase'
import { useMap } from '../src/services/hooks/useMap'
import { userService } from '../src/services/api/user.service'
import AnimatedButton from '../components/AnimatedButton'
import FloatingActionButton from '../components/FloatingActionButton'
import ShimmerButton from '../components/ShimmerButton'
import TextReveal from '../components/TextReveal'
import AnimatedReanimated, { 
  FadeIn, 
  FadeInDown, 
  FadeInUp, 
  SlideInRight, 
  SlideInLeft,
  SlideInUp,
  ZoomIn,
  ZoomOut,
  BounceIn,
  useAnimatedStyle, 
  useSharedValue, 
  withSpring, 
  withTiming, 
  withRepeat,
  withSequence,
  interpolate,
  Extrapolate,
  Easing
} from 'react-native-reanimated'

const { width, height } = Dimensions.get('window')
const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1IjoiZ2lybWF5bmwyMSIsImEiOiJjbWgyODQ4ancxNDdqMmlxeTY2aHFkdDdqIn0.kx667AeRIVB9gDo42gLOHA'
const GOOGLE_MAPS_API_KEY = 'AIzaSyCJlhCsal8nx2Gj3VRgrQ6zQ7JLNSJbpRA'

// Bounding box that covers the greater The Hague area (Den Haag)
const DEN_HAAG_BOUNDS = {
  north: 52.125,
  south: 52.025,
  east: 4.41,
  west: 4.235,
}

const FALLBACK_CITY_CENTER = {
  latitude: 52.0705,
  longitude: 4.3007,
}

const MARKER_META_ZOOM_THRESHOLD = 12

const clamp = (value: number, min: number, max: number) => {
  if (value < min) return min
  if (value > max) return max
  return value
}

const getApproximateZoomLevel = (latitudeDelta: number) => {
  if (!latitudeDelta || latitudeDelta <= 0) {
    return MARKER_META_ZOOM_THRESHOLD
  }

  const zoom = Math.log2(360 / latitudeDelta)
  return clamp(zoom, 0, 20)
}

// Conditionally import MapView - only works in standalone builds
let MapViewComponent: any = null
let MarkerComponent: any = null
let PROVIDER_GOOGLE: any = null

// Check if we're in Expo Go (where react-native-maps won't work)
const isExpoGo = Constants.executionEnvironment === 'storeClient'

if (!isExpoGo) {
  try {
    const Maps = require('react-native-maps')
    MapViewComponent = Maps.default
    MarkerComponent = Maps.Marker
    PROVIDER_GOOGLE = Maps.PROVIDER_GOOGLE
  } catch (e) {
    console.warn('react-native-maps not available:', e)
  }
}

const hasMapSupport = !isExpoGo && MapViewComponent !== null

// Helper function to get language flag emoji
// Handles both language codes (en, nl, es) and full names (English, Dutch, Spanish)
function getLanguageFlag(lang: string): string {
  const flagMap: Record<string, string> = {
    // Language codes (from database)
    'en': '🇬🇧',
    'nl': '🇳🇱',
    'es': '🇪🇸',
    'fr': '🇫🇷',
    'de': '🇩🇪',
    'it': '🇮🇹',
    'pt': '🇵🇹',
    'ja': '🇯🇵',
    'ar': '🇸🇦',
    'sv': '🇸🇪',
    // Full names (fallback)
    'English': '🇬🇧',
    'Dutch': '🇳🇱',
    'Spanish': '🇪🇸',
    'French': '🇫🇷',
    'German': '🇩🇪',
    'Italian': '🇮🇹',
    'Portuguese': '🇵🇹',
    'Japanese': '🇯🇵',
    'Arabic': '🇸🇦',
    'Swedish': '🇸🇪',
  }
  return flagMap[lang] || '🌍'
}

// Scan Circle Component for nearby users
const ScanCircle = ({ delay }: { delay: number }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current
  const opacityAnim = useRef(new Animated.Value(0.8)).current

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 2.5,
          duration: 2000,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 2000,
          delay,
          useNativeDriver: true,
        }),
      ])
    ).start()
  }, [])

  return (
    <Animated.View
      style={[
        styles.scanCircle,
        {
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
        },
      ]}
    />
  )
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
  isOnline: boolean
  rating: number
  responseTime: string
  currentLocation: string
  availableNow: boolean
  languagesSpoken: { language: string; flag: string; level: string }[]
  image: string
  isFallbackLocation?: boolean
}

const toPositiveHash = (value: string) => {
  let hash = 0
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0
  }
  return hash
}

const generateDenHaagCoordinate = (userId: string, axis: 'lat' | 'lng', offset: number) => {
  const hash = toPositiveHash(`${userId}-${axis}-${offset}`)
  const normalized = (hash % 10000) / 10000

  if (axis === 'lat') {
    return DEN_HAAG_BOUNDS.south + (DEN_HAAG_BOUNDS.north - DEN_HAAG_BOUNDS.south) * normalized
  }

  return DEN_HAAG_BOUNDS.west + (DEN_HAAG_BOUNDS.east - DEN_HAAG_BOUNDS.west) * normalized
}

const resolveUserCoordinates = (
  userId: string,
  latitude?: number | null,
  longitude?: number | null,
) => {
  if (typeof latitude === 'number' && typeof longitude === 'number') {
    return {
      latitude,
      longitude,
      isFallback: false,
    }
  }

  const lat = generateDenHaagCoordinate(userId, 'lat', 1)
  const lng = generateDenHaagCoordinate(userId, 'lng', 2)

  return {
    latitude: lat,
    longitude: lng,
    isFallback: true,
  }
}

// Helper function to calculate distance in km
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371 // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

const formatDistanceLabel = (distanceKm: number): string => {
  if (Number.isNaN(distanceKm)) {
    return '—'
  }

  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m`
  }

  return `${distanceKm.toFixed(1)}km`
}

// Cafe users removed - now using only database users from Supabase
  
// Helper function to generate users within 1-5km radius
const generateNearbyUsers = (centerLat: number, centerLng: number): User[] => {
  const users: User[] = [
  {
    id: '1',
    name: 'Maria',
    language: 'Spanish',
    flag: '🇪🇸',
      distance: '',
      lat: centerLat + 0.0108, // ~1.2km
      lng: centerLng + 0.0065,
    bio: 'Native Spanish speaker 🇪🇸 learning Dutch 🇳🇱. Love practicing over coffee!',
    availableFor: '30 min',
    isOnline: true,
    rating: 4.9,
    responseTime: '2 min',
    currentLocation: 'Starbucks, Spui',
    availableNow: true,
    languagesSpoken: [
      { language: 'Spanish', flag: '🇪🇸', level: 'Native' },
      { language: 'English', flag: '🇺🇸', level: 'Fluent' },
      { language: 'Dutch', flag: '🇳🇱', level: 'Learning' },
    ],
    image: '/diverse-woman-smiling.png',
  },
    {
      id: '2',
      name: 'Yuki',
      language: 'Japanese',
      flag: '🇯🇵',
      distance: '',
      lat: centerLat - 0.0072, // ~0.8km
      lng: centerLng + 0.0043,
      bio: 'Native Japanese speaker 🇯🇵 teaching Japanese, learning English 🇬🇧',
      availableFor: '1 hr',
      isOnline: true,
      rating: 5.0,
      responseTime: '1 min',
      currentLocation: 'Haagse Bos Park',
      availableNow: true,
      languagesSpoken: [
        { language: 'Japanese', flag: '🇯🇵', level: 'Native' },
        { language: 'English', flag: '🇺🇸', level: 'Learning' },
        { language: 'Dutch', flag: '🇳🇱', level: 'Beginner' },
      ],
      image: '/serene-asian-woman.png',
    },
    {
      id: '3',
      name: 'Pierre',
      language: 'French',
      flag: '🇫🇷',
      distance: '',
      lat: centerLat - 0.0189, // ~2.1km
      lng: centerLng - 0.0108,
      bio: 'French teacher 🇫🇷 helping with French, learning Dutch 🇳🇱',
      availableFor: '45 min',
      isOnline: true,
      rating: 4.7,
      responseTime: '3 min',
      currentLocation: 'KB National Library',
      availableNow: true,
      languagesSpoken: [
        { language: 'French', flag: '🇫🇷', level: 'Native' },
        { language: 'English', flag: '🇺🇸', level: 'Fluent' },
        { language: 'Dutch', flag: '🇳🇱', level: 'Learning' },
      ],
      image: '/french-man.png',
    },
  {
    id: '4',
    name: 'Anna',
    language: 'German',
    flag: '🇩🇪',
      distance: '',
      lat: centerLat + 0.0252, // ~2.8km
      lng: centerLng - 0.0144,
    bio: 'German native 🇩🇪 teaching German, learning Spanish 🇪🇸',
      availableFor: '1 hr',
    isOnline: true,
    rating: 4.8,
      responseTime: '2 min',
    currentLocation: 'Plein Café',
    availableNow: true,
    languagesSpoken: [
      { language: 'German', flag: '🇩🇪', level: 'Native' },
      { language: 'English', flag: '🇺🇸', level: 'Fluent' },
      { language: 'Spanish', flag: '🇪🇸', level: 'Learning' },
    ],
    image: '/german-woman.jpg',
  },
    {
      id: '5',
      name: 'Sophie',
      language: 'Dutch',
      flag: '🇳🇱',
      distance: '',
      lat: centerLat + 0.0315, // ~3.5km
      lng: centerLng + 0.0180,
      bio: 'Native Dutch speaker 🇳🇱 teaching Dutch, learning French 🇫🇷',
      availableFor: '45 min',
      isOnline: true,
      rating: 4.9,
      responseTime: '1 min',
      currentLocation: 'Binnenhof',
      availableNow: true,
      languagesSpoken: [
        { language: 'Dutch', flag: '🇳🇱', level: 'Native' },
        { language: 'English', flag: '🇺🇸', level: 'Fluent' },
        { language: 'French', flag: '🇫🇷', level: 'Learning' },
      ],
      image: '/diverse-person-smiling.png',
    },
    {
      id: '6',
      name: 'Luca',
      language: 'Italian',
      flag: '🇮🇹',
      distance: '',
      lat: centerLat - 0.0135, // ~1.5km
      lng: centerLng + 0.0072,
      bio: 'Italian chef 🇮🇹 teaching Italian, learning English 🇬🇧',
      availableFor: '30 min',
      isOnline: true,
      rating: 4.6,
      responseTime: '4 min',
      currentLocation: 'Central Market',
      availableNow: true,
      languagesSpoken: [
        { language: 'Italian', flag: '🇮🇹', level: 'Native' },
        { language: 'English', flag: '🇺🇸', level: 'Learning' },
        { language: 'Dutch', flag: '🇳🇱', level: 'Beginner' },
      ],
      image: '/placeholder.jpg',
    },
    {
      id: '7',
      name: 'Emma',
      language: 'English',
      flag: '🇬🇧',
      distance: '',
      lat: centerLat - 0.0378, // ~4.2km
      lng: centerLng + 0.0216,
      bio: 'English teacher 🇬🇧 helping with English, learning Spanish 🇪🇸',
      availableFor: '1 hr',
      isOnline: true,
      rating: 4.9,
      responseTime: '1 min',
      currentLocation: 'University Campus',
      availableNow: true,
      languagesSpoken: [
        { language: 'English', flag: '🇬🇧', level: 'Native' },
        { language: 'Spanish', flag: '🇪🇸', level: 'Learning' },
        { language: 'Dutch', flag: '🇳🇱', level: 'Fluent' },
      ],
      image: '/professional-woman.png',
    },
    {
      id: '8',
      name: 'Carlos',
      language: 'Portuguese',
      flag: '🇵🇹',
      distance: '',
      lat: centerLat + 0.0225, // ~2.5km
      lng: centerLng + 0.0129,
      bio: 'Portuguese speaker 🇵🇹 teaching Portuguese, learning French 🇫🇷',
      availableFor: '45 min',
      isOnline: true,
      rating: 4.7,
      responseTime: '3 min',
      currentLocation: 'Beach Café',
      availableNow: true,
      languagesSpoken: [
        { language: 'Portuguese', flag: '🇵🇹', level: 'Native' },
        { language: 'English', flag: '🇺🇸', level: 'Fluent' },
        { language: 'French', flag: '🇫🇷', level: 'Learning' },
      ],
      image: '/man-glasses-beard.jpg',
    },
    {
      id: '9',
      name: 'Sofia',
      language: 'Greek',
      flag: '🇬🇷',
      distance: '',
      lat: centerLat - 0.0342, // ~3.8km
      lng: centerLng - 0.0195,
      bio: 'Greek native 🇬🇷 teaching Greek, learning English 🇬🇧',
      availableFor: '30 min',
      isOnline: true,
      rating: 4.8,
      responseTime: '2 min',
      currentLocation: 'Museum District',
      availableNow: true,
      languagesSpoken: [
        { language: 'Greek', flag: '🇬🇷', level: 'Native' },
        { language: 'English', flag: '🇺🇸', level: 'Learning' },
        { language: 'Dutch', flag: '🇳🇱', level: 'Intermediate' },
      ],
      image: '/diverse-woman-portrait.png',
    },
    {
      id: '10',
      name: 'Ahmed',
      language: 'Arabic',
      flag: '🇸🇦',
      distance: '',
      lat: centerLat + 0.0162, // ~1.8km
      lng: centerLng - 0.0093,
      bio: 'Arabic speaker 🇸🇦 teaching Arabic, learning Dutch 🇳🇱',
      availableFor: '1 hr',
      isOnline: true,
      rating: 5.0,
      responseTime: '1 min',
      currentLocation: 'City Center',
      availableNow: true,
      languagesSpoken: [
        { language: 'Arabic', flag: '🇸🇦', level: 'Native' },
        { language: 'English', flag: '🇺🇸', level: 'Fluent' },
        { language: 'Dutch', flag: '🇳🇱', level: 'Learning' },
      ],
      image: '/man-beard.jpg',
    },
    {
      id: '11',
      name: 'Lisa',
      language: 'Swedish',
      flag: '🇸🇪',
      distance: '',
      lat: centerLat + 0.0405, // ~4.5km
      lng: centerLng - 0.0232,
      bio: 'Swedish speaker 🇸🇪 teaching Swedish, learning Spanish 🇪🇸',
      availableFor: '45 min',
      isOnline: true,
      rating: 4.9,
      responseTime: '2 min',
      currentLocation: 'Park Area',
      availableNow: true,
      languagesSpoken: [
        { language: 'Swedish', flag: '🇸🇪', level: 'Native' },
        { language: 'English', flag: '🇺🇸', level: 'Fluent' },
        { language: 'Spanish', flag: '🇪🇸', level: 'Learning' },
      ],
      image: '/diverse-person-portrait.png',
    },
  ]
  
  // Use only regular users (cafe users removed - this function is legacy and not used)
  const allUsers = users
  
  // Calculate actual distances and format them
  return allUsers.map(user => {
    const distance = calculateDistance(centerLat, centerLng, user.lat, user.lng)
    return {
      ...user,
      distance: formatDistanceLabel(distance)
    }
  })
}

export default function MapScreen() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [mapStyle, setMapStyle] = useState<'standard' | 'satellite'>('standard')
  const [staticMapUrl, setStaticMapUrl] = useState<string>('')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; avatar_url?: string | null } | null>(null)
  const [filterDistance, setFilterDistance] = useState(50)
  const [filterAvailableNow, setFilterAvailableNow] = useState(false)
  const [filterSkillLevel, setFilterSkillLevel] = useState<string[]>([])
  const [mapRegion, setMapRegion] = useState<{ latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number } | null>(null)
  const [isUserInteracting, setIsUserInteracting] = useState(false)
  const [canDismissProfileModal, setCanDismissProfileModal] = useState(false)
  const profileDismissTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [mapZoomLevel, setMapZoomLevel] = useState<number>(MARKER_META_ZOOM_THRESHOLD)
  
  // Animation values for buttons
  const filterButtonScale = useSharedValue(1)
  const availabilityButtonScale = useSharedValue(1)
  const layersButtonScale = useSharedValue(1)
  const nearbyBadgeScale = useSharedValue(1)
  const modalScale = useSharedValue(0.9)
  const modalOpacity = useSharedValue(0)

  // Use real backend hook for nearby users
  const { users: nearbyUsers, userLocation: hookLocation, loading: usersLoading, error: usersError } = useMap({
    distance: filterDistance,
    availableNow: filterAvailableNow,
    languages: [],
    skillLevel: filterSkillLevel,
  })

  // Convert hook location format to component format
  const userLocation = hookLocation ? { latitude: hookLocation.lat, longitude: hookLocation.lng } : null

  // Transform nearby users from database to UI format
  const mockUsers = React.useMemo(() => {
    if (!nearbyUsers || nearbyUsers.length === 0) {
      console.log('[MapScreen] No nearby users from database')
      return []
    }
    
    console.log(`[MapScreen] Transforming ${nearbyUsers.length} users from database`)
    return nearbyUsers.map((dbUser) => {
      // Get primary language from languages_speak or languages_learn
      const primaryLang = dbUser.languages_speak?.[0] || dbUser.languages_learn?.[0] || 'English'
      const coordinates = resolveUserCoordinates(dbUser.id, dbUser.latitude, dbUser.longitude)
      
      return {
        id: dbUser.id,
        name: dbUser.full_name || 'User',
        language: primaryLang,
        flag: getLanguageFlag(primaryLang),
        distance: '',
        lat: coordinates.latitude,
        lng: coordinates.longitude,
        bio: dbUser.bio || 'Language enthusiast',
        availableFor: '30 min',
        isOnline: dbUser.is_online || false,
        rating: 4.8,
        responseTime: '2 min',
        currentLocation: dbUser.city || 'Unknown',
        availableNow: dbUser.availability_status === 'available',
        languagesSpoken: (dbUser.languages_speak || []).map((lang: string) => ({
          language: lang,
          flag: getLanguageFlag(lang),
          level: 'Native',
        })),
        image: dbUser.avatar_url || '/placeholder-user.jpg',
        isFallbackLocation: coordinates.isFallback,
      }
    })
  }, [nearbyUsers])

  // Use only database users (cafe users removed)
  const allUsers = React.useMemo(() => {
    return mockUsers
  }, [mockUsers])
  
  // Calculate actual distances and format them
  const availableUsers = React.useMemo(() => {
    const referenceLatitude = userLocation?.latitude ?? FALLBACK_CITY_CENTER.latitude
    const referenceLongitude = userLocation?.longitude ?? FALLBACK_CITY_CENTER.longitude

    return allUsers
      .filter(user => {
        // Apply filters to all users
        const distance = calculateDistance(referenceLatitude, referenceLongitude, user.lat, user.lng)
        const withinDistance = distance <= filterDistance
        
        const matchesAvailability = !filterAvailableNow || user.availableNow
        
        const matchesSkillLevel = filterSkillLevel.length === 0 || 
          user.languagesSpoken.some((lang: any) => 
            filterSkillLevel.some((level: string) => lang.level.toLowerCase().includes(level))
          )
        
        return withinDistance && matchesAvailability && matchesSkillLevel
      })
      .map(user => {
        const distance = calculateDistance(referenceLatitude, referenceLongitude, user.lat, user.lng)
        return {
          ...user,
          distance: formatDistanceLabel(distance)
        }
      })
  }, [allUsers, userLocation, filterDistance, filterAvailableNow, filterSkillLevel])

  const shouldShowMarkerDetails = mapZoomLevel >= MARKER_META_ZOOM_THRESHOLD

  // Animate nearby badge when count changes
  useEffect(() => {
    nearbyBadgeScale.value = withSequence(
      withSpring(1.2, { damping: 8 }),
      withSpring(1, { damping: 10 })
    )
  }, [availableUsers.length])

  // Animate modal on open/close
  useEffect(() => {
    if (selectedUser !== null) {
      modalScale.value = withSpring(1, { damping: 15, stiffness: 300 })
      modalOpacity.value = withTiming(1, { duration: 300 })
      setCanDismissProfileModal(false)
      if (profileDismissTimeoutRef.current) {
        clearTimeout(profileDismissTimeoutRef.current)
      }
      profileDismissTimeoutRef.current = setTimeout(() => {
        setCanDismissProfileModal(true)
        profileDismissTimeoutRef.current = null
      }, 250)
    } else {
      modalScale.value = withTiming(0.9, { duration: 200 })
      modalOpacity.value = withTiming(0, { duration: 200 })
      setCanDismissProfileModal(false)
      if (profileDismissTimeoutRef.current) {
        clearTimeout(profileDismissTimeoutRef.current)
        profileDismissTimeoutRef.current = null
      }
    }
    return () => {
      if (profileDismissTimeoutRef.current) {
        clearTimeout(profileDismissTimeoutRef.current)
        profileDismissTimeoutRef.current = null
      }
    }
  }, [selectedUser])

  // Animation styles
  const filterButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: filterButtonScale.value }],
  }))

  const availabilityButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: availabilityButtonScale.value }],
  }))

  const layersButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: layersButtonScale.value }],
  }))

  const nearbyBadgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: nearbyBadgeScale.value }],
  }))

  const modalAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: modalScale.value }],
    opacity: modalOpacity.value,
  }))

  // Get current user from Supabase
  useEffect(() => {
    (async () => {
      try {
        const user = await userService.getCurrentUser()
        if (user) {
          setCurrentUser({
            id: user.id,
            name: user.full_name || 'You',
            avatar_url: user.avatar_url,
          })

          // Sync location to database
          if (hookLocation) {
            await userService.updateLocation(user.id, hookLocation.lat, hookLocation.lng)
          }
        }
      } catch (error) {
        console.error('Error fetching current user:', error)
      }
    })()
  }, [hookLocation])

  // Sync location to database when it changes
  useEffect(() => {
    if (hookLocation && currentUser) {
      userService.updateLocation(currentUser.id, hookLocation.lat, hookLocation.lng).catch(console.error)
    }
  }, [hookLocation, currentUser])

  // Generate static map URL for Expo Go using Mapbox
  useEffect(() => {
    const isExpoGoCheck = Constants.executionEnvironment === 'storeClient'
    if (!isExpoGoCheck) return

    const centerLatitude = userLocation?.latitude ?? FALLBACK_CITY_CENTER.latitude
    const centerLongitude = userLocation?.longitude ?? FALLBACK_CITY_CENTER.longitude
    const center = `${centerLongitude},${centerLatitude}`
    const zoom = 13

    const markerSource = availableUsers.length > 0 ? availableUsers : mockUsers
    if (markerSource.length === 0) return

    const markers = markerSource.slice(0, 20).map((user) => {
      return `pin-s+ff6b6b(${user.lng},${user.lat})`
    }).join(',')

    const userMarker = `pin-s+ffd93d(${centerLongitude},${centerLatitude})`

    let mapStyleId = 'dark-v11'
    if (mapStyle === 'satellite') {
      mapStyleId = 'satellite-v9'
    }

    const mapUrl = `https://api.mapbox.com/styles/v1/mapbox/${mapStyleId}/static/${userMarker},${markers}/${center},${zoom},0/${Math.floor(width)}x${Math.floor(height)}@2x?access_token=${MAPBOX_ACCESS_TOKEN}`

    setStaticMapUrl(mapUrl)
  }, [userLocation, mapStyle, mockUsers, availableUsers])

  // Default region (The Hague, Netherlands)
  const defaultRegion = {
    latitude: 52.0705,
    longitude: 4.3007,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  }

  // Initialize map region when user location is first available
  useEffect(() => {
    if (userLocation && !mapRegion && !isUserInteracting) {
      setMapRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      })
    }
  }, [userLocation])

  // Only update map region when location changes if user is not interacting
  useEffect(() => {
    if (userLocation && !isUserInteracting && mapRegion) {
      // Only update if location changed significantly (more than 100m)
      const latDiff = Math.abs(userLocation.latitude - mapRegion.latitude)
      const lngDiff = Math.abs(userLocation.longitude - mapRegion.longitude)
      if (latDiff > 0.001 || lngDiff > 0.001) {
        setMapRegion({
          ...mapRegion,
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
        })
      }
    }
  }, [userLocation, isUserInteracting])

  // Use current map region or default
  const currentMapRegion = mapRegion || (userLocation
    ? {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }
    : defaultRegion)

  useEffect(() => {
    if (currentMapRegion && typeof currentMapRegion.latitudeDelta === 'number') {
      setMapZoomLevel(getApproximateZoomLevel(currentMapRegion.latitudeDelta))
    }
  }, [currentMapRegion])

  // Note: Filtering is now handled in availableUsers memo - no need for separate filteredUsers


  // Generate HTML for interactive Mapbox map with custom profile markers
  const generateMapHTML = (style: 'standard' | 'satellite', currentUserData: typeof currentUser) => {
    const styleId = style === 'satellite' ? 'satellite-v9' : 'dark-v11'
    const center = userLocation ? [userLocation.longitude, userLocation.latitude] : [4.3007, 52.0705]
    
    // Create markers for available users with profile info
    const markers = availableUsers.map((user) => ({
      coordinates: [user.lng, user.lat],
      name: user.name,
      flag: user.flag || '🌍',
      distance: user.distance,
      initial: user.name[0],
      id: user.id,
      isFallback: user.isFallbackLocation,
      availableNow: user.availableNow,
    }))
    
    // Debug: Log marker count
    console.log(`[MapScreen] Generating map with ${markers.length} user markers from database`)
    
    // Prepare user data for template string
    const userName = currentUserData?.name || 'You'
    const userInitial = currentUserData?.name?.[0] || 'U'
    const hasCurrentUser = !!currentUserData
    
    return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <script src="https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js"></script>
  <link href="https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css" rel="stylesheet">
  <style>
    body { margin: 0; padding: 0; overflow: hidden; }
    #map { width: 100%; height: 100vh; }
    .mapboxgl-ctrl { display: none; }
    .custom-marker {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      width: 56px;
      height: 56px;
      border-radius: 28px;
      border: 3px solid white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 24px;
      color: white;
      box-shadow: 0 4px 8px rgba(0,0,0,0.3);
      position: relative;
      cursor: pointer;
    }
    .flag-badge {
      position: absolute;
      bottom: -2px;
      right: -2px;
      width: 24px;
      height: 24px;
      border-radius: 12px;
      background: white;
      border: 2px solid #1e293b;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
    }
    .user-location-marker {
      background: linear-gradient(135deg, #ffd93d 0%, #f6c23e 100%);
      width: 56px;
      height: 56px;
      border-radius: 28px;
      border: 3px solid white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 24px;
      color: white;
      box-shadow: 0 4px 8px rgba(0,0,0,0.3);
    }
    .custom-marker-root {
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    .marker-live-indicator {
      position: absolute;
      top: -16px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(34, 197, 94, 0.95);
      color: #042f1a;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.06em;
      padding: 2px 8px;
      border-radius: 999px;
      box-shadow: 0 0 12px rgba(34, 197, 94, 0.45);
      text-transform: uppercase;
    }
    .marker-meta {
      position: absolute;
      bottom: -28px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(15, 23, 42, 0.92);
      color: white;
      font-size: 12px;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 999px;
      display: flex;
      align-items: center;
      gap: 8px;
      box-shadow: 0 6px 12px rgba(15, 23, 42, 0.35);
      backdrop-filter: blur(6px);
      border: 1px solid rgba(148, 163, 184, 0.3);
    }
    .marker-meta--fallback {
      opacity: 0.85;
    }
    .marker-flag {
      font-size: 14px;
      line-height: 1;
    }
    .marker-distance {
      line-height: 1;
    }
    body.hide-marker-meta .marker-meta,
    body.hide-marker-meta .marker-live-indicator {
      display: none !important;
    }
    .mapboxgl-popup-content {
      background: rgba(30, 41, 59, 0.95);
      border: 1px solid rgba(255,255,255,0.2);
      border-radius: 16px;
      padding: 12px;
      color: white;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .mapboxgl-popup-tip {
      border-top-color: rgba(30, 41, 59, 0.95);
    }
    .radar-container {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      pointer-events: none;
      z-index: 1;
    }
    .radar-circle {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      border: 1px solid rgba(59, 130, 246, 0.2);
      border-radius: 50%;
      animation: pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }
    @keyframes pulse-ring {
      0% {
        transform: translate(-50%, -50%) scale(1);
        opacity: 1;
      }
      100% {
        transform: translate(-50%, -50%) scale(1.5);
        opacity: 0;
      }
    }
    .radar-sweep {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 450px;
      height: 450px;
      transform: translate(-50%, -50%);
      background: conic-gradient(from 0deg, transparent 0deg, rgba(59, 130, 246, 0.3) 30deg, transparent 60deg);
      border-radius: 50%;
      animation: radar-sweep 4s linear infinite;
      pointer-events: none;
    }
    @keyframes radar-sweep {
      0% {
        transform: translate(-50%, -50%) rotate(0deg);
      }
      100% {
        transform: translate(-50%, -50%) rotate(360deg);
      }
    }
    .user-scan-circle {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      border: 2px solid rgba(59, 130, 246, 0.4);
      border-radius: 50%;
      animation: scan-pulse 2s ease-out infinite;
    }
    @keyframes scan-pulse {
      0% {
        width: 0;
        height: 0;
        opacity: 1;
      }
      100% {
        width: 200px;
        height: 200px;
        opacity: 0;
      }
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <!-- Radar scan overlay -->
  <div class="radar-container">
    ${[150, 250, 350, 450].map((size, i) => `
      <div class="radar-circle" style="width: ${size}px; height: ${size}px; animation-delay: ${i * 0.5}s;"></div>
    `).join('')}
    <div class="radar-sweep"></div>
  </div>
  <script>
    mapboxgl.accessToken = '${MAPBOX_ACCESS_TOKEN}';
    const map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/${styleId}',
      center: ${JSON.stringify(center)},
      zoom: 13,
      interactive: true,
      scrollZoom: true,
      boxZoom: true,
      dragRotate: false,
      dragPan: true,
      keyboard: false,
      doubleClickZoom: true,
      touchZoomRotate: true
    });
    
    const metadataZoomThreshold = ${MARKER_META_ZOOM_THRESHOLD};
    if (!${shouldShowMarkerDetails ? 'true' : 'false'}) {
      document.body.classList.add('hide-marker-meta');
    }
    const toggleMarkerMeta = () => {
      const shouldShow = map.getZoom() >= metadataZoomThreshold;
      document.body.classList.toggle('hide-marker-meta', !shouldShow);
    };
    map.on('zoom', toggleMarkerMeta);
 
    map.on('load', () => {
      toggleMarkerMeta();
      // Add user location marker with custom profile avatar
      ${hasCurrentUser ? `
      const userLocationEl = document.createElement('div');
      userLocationEl.className = 'custom-marker';
      userLocationEl.style.background = 'linear-gradient(135deg, #ffd93d 0%, #f6c23e 100%)';
      userLocationEl.innerHTML = '${userInitial}';
      userLocationEl.style.position = 'relative';
      ` : `
      const userLocationEl = document.createElement('div');
      userLocationEl.className = 'user-location-marker';
      userLocationEl.innerHTML = '📍';
      userLocationEl.style.position = 'relative';
      `}
      
      // Add scan circles around user location
      const scanContainer = document.createElement('div');
      scanContainer.style.position = 'absolute';
      scanContainer.style.top = '50%';
      scanContainer.style.left = '50%';
      scanContainer.style.transform = 'translate(-50%, -50%)';
      scanContainer.style.width = '200px';
      scanContainer.style.height = '200px';
      scanContainer.style.pointerEvents = 'none';
      
      // Create multiple scan circles
      for (let i = 0; i < 3; i++) {
        const scanCircle = document.createElement('div');
        scanCircle.className = 'user-scan-circle';
        scanCircle.style.animationDelay = (i * 0.7) + 's';
        scanCircle.style.width = '200px';
        scanCircle.style.height = '200px';
        scanContainer.appendChild(scanCircle);
      }
      
      const userMarkerWrapper = document.createElement('div');
      userMarkerWrapper.style.position = 'relative';
      userMarkerWrapper.appendChild(userLocationEl);
      userMarkerWrapper.appendChild(scanContainer);
      
      new mapboxgl.Marker(userMarkerWrapper)
        .setLngLat(${JSON.stringify(center)})
        .setPopup(new mapboxgl.Popup().setHTML('<div style="text-align:center;"><strong>${userName}</strong></div>'))
        .addTo(map);
      
      console.log('Adding ${markers.length} user markers to map');
      
      // Add custom profile markers for available users with scan circles
      ${markers.map((marker, index) => {
        const hasFlag = marker.flag ? true : false;
        const flagEmoji = marker.flag || '🌍';
        const distance = marker.distance || '0m';
        const distanceLabel = marker.distance ? marker.distance : "";
        const metaHtml = `<span class="marker-flag">${flagEmoji}</span><span class="marker-distance">${distanceLabel}</span>`;
        let distanceValue = 0;
        if (distance === '0m') {
          distanceValue = 0;
        } else if (distance.includes('km')) {
          distanceValue = parseFloat(distance.replace('km', '').trim());
        } else if (distance.includes('m')) {
          distanceValue = parseFloat(distance.replace('m', '').trim()) / 1000;
        }
        const showScan = distanceValue === 0 || distanceValue < 1;
        return `
      setTimeout(() => {
        const markerRoot = document.createElement('div');
        markerRoot.className = 'custom-marker-root';
        markerRoot.style.position = 'relative';
        markerRoot.style.zIndex = '1000';

        const baseEl = document.createElement('div');
        baseEl.className = 'custom-marker';
        baseEl.textContent = '${marker.initial}';
        markerRoot.appendChild(baseEl);

        const shouldShowScan = ${showScan};
        if (shouldShowScan) {
          const scanContainer = document.createElement('div');
          scanContainer.style.position = 'absolute';
          scanContainer.style.top = '50%';
          scanContainer.style.left = '50%';
          scanContainer.style.transform = 'translate(-50%, -50%)';
          scanContainer.style.width = '200px';
          scanContainer.style.height = '200px';
          scanContainer.style.pointerEvents = 'none';
          scanContainer.style.zIndex = '-1';

          for (let i = 0; i < 3; i++) {
            const scanCircle = document.createElement('div');
            scanCircle.className = 'user-scan-circle';
            scanCircle.style.animationDelay = (i * 0.7) + 's';
            scanCircle.style.width = '200px';
            scanCircle.style.height = '200px';
            scanContainer.appendChild(scanCircle);
          }

          markerRoot.appendChild(scanContainer);
        }

        ${hasFlag ? `
        const flagBadge = document.createElement('div');
        flagBadge.className = 'flag-badge';
        flagBadge.textContent = '${flagEmoji}';
        markerRoot.appendChild(flagBadge);
        ` : ''}

        const markerIsFallback = ${marker.isFallback};
        const markerIsLive = ${marker.availableNow};

        const meta = document.createElement('div');
        meta.className = 'marker-meta';
        if (markerIsFallback) {
          meta.classList.add('marker-meta--fallback');
        }
        meta.innerHTML = ${JSON.stringify(metaHtml)};
        markerRoot.appendChild(meta);

        if (markerIsLive) {
          const liveIndicator = document.createElement('div');
          liveIndicator.className = 'marker-live-indicator';
          liveIndicator.textContent = 'LIVE';
          markerRoot.appendChild(liveIndicator);
        }

        markerRoot.addEventListener('click', () => {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'userClick',
            userId: '${marker.id}'
          }));
        });

        const markerInstance = new mapboxgl.Marker(markerRoot)
          .setLngLat(${JSON.stringify(marker.coordinates)})
          .addTo(map);

        console.log('Added marker ${index + 1}/${markers.length} for ${marker.name} at', ${JSON.stringify(marker.coordinates)});
      }, ${index * 100});
        `;
      }).join('')}
    });
  </script>
</body>
</html>
    `
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Map</Text>
          <Text style={styles.headerSubtitle}>Find language partners nearby</Text>
        </View>
        
        {/* Top Controls - matching screenshot exactly */}
        <View style={styles.topControls}>
          {/* Filter Button */}
          <TouchableOpacity 
            style={styles.glassButton}
            onPress={() => setIsFilterOpen(!isFilterOpen)}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Filter size={20} color={Colors.text.primary} />
          </TouchableOpacity>

          {/* Nearby Count - matching web exactly */}
          <View style={styles.nearbyButton}>
            <Users size={16} color={Colors.text.primary} />
            <Text style={styles.nearbyText}>{availableUsers.length} nearby</Text>
          </View>

          {/* Right Side Buttons */}
          <View style={styles.rightButtons}>
            {/* Availability Button */}
            <TouchableOpacity 
              style={styles.availabilityButton}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Zap size={20} color={Colors.text.primary} />
            </TouchableOpacity>
            {/* Layers Button - Toggle map style */}
            <TouchableOpacity 
              style={styles.layersButton}
              onPress={() => {
                const newStyle = mapStyle === 'standard' ? 'satellite' : 'standard'
                setMapStyle(newStyle)
                // WebView will automatically reload with new style
              }}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Layers size={20} color={Colors.text.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Map Container - Full Screen */}
        <View style={styles.mapContainer}>
          {hasMapSupport ? (
            // Real map for standalone builds
            MapViewComponent && (
              <MapViewComponent
                provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
                style={styles.map}
                initialRegion={currentMapRegion}
                region={currentMapRegion}
                mapType={mapStyle === 'satellite' ? 'satellite' : 'standard'}
                showsUserLocation={false}
                showsMyLocationButton={false}
                customMapStyle={mapStyle === 'standard' ? darkMapStyle : undefined}
                onRegionChangeComplete={(region: any) => {
                  setIsUserInteracting(true)
                  setMapRegion(region)
                  if (typeof region?.latitudeDelta === 'number') {
                    setMapZoomLevel(getApproximateZoomLevel(region.latitudeDelta))
                  }
                  // Reset interaction flag after a delay
                  setTimeout(() => {
                    setIsUserInteracting(false)
                  }, 2000)
                }}
                onPanDrag={() => setIsUserInteracting(true)}
                onZoomChanged={() => setIsUserInteracting(true)}
              >
                {/* Current User's Profile Marker */}
                {userLocation && currentUser && (
                  <MarkerComponent
                    coordinate={{
                      latitude: userLocation.latitude,
                      longitude: userLocation.longitude,
                    }}
                  >
                    <View style={styles.markerContainer}>
                      {/* Scan circles around user location */}
                      {[0, 1, 2].map((i) => (
                        <ScanCircle key={`user-scan-${i}`} delay={i * 700} />
                      ))}
                      <View style={[styles.userMarkerAvatar, styles.currentUserMarker]}>
                        <Text style={styles.userMarkerInitial}>
                          {currentUser.name[0] || 'U'}
                        </Text>
                      </View>
                    </View>
                  </MarkerComponent>
                )}
                
                {/* User Markers - Only show available users */}
                {availableUsers.map((user) => (
                  MarkerComponent && (
                    <MarkerComponent
                      key={user.id}
                      coordinate={{
                        latitude: user.lat,
                        longitude: user.lng,
                      }}
                    onPress={() => setSelectedUser(user)}
                    >
                      <View style={styles.markerContainer}>
                        {/* Scan circles for nearby users (within 1km or 0m) */}
                        {(() => {
                          const distance = user.distance || '0m'
                          let distanceValue = 0
                          if (distance === '0m') {
                            distanceValue = 0
                          } else if (distance.includes('km')) {
                            distanceValue = parseFloat(distance.replace('km', '').trim())
                          } else if (distance.includes('m')) {
                            distanceValue = parseFloat(distance.replace('m', '').trim()) / 1000
                          }
                          const showScan = distanceValue === 0 || distanceValue < 1
                          if (!showScan) return null
                          
                          return (
                            <>
                              {[0, 1, 2].map((i) => (
                                <ScanCircle key={`scan-${i}`} delay={i * 700} />
                              ))}
                            </>
                          )
                        })()}
                        <View
                          style={[
                            styles.userMarkerAvatar,
                            user.availableNow && styles.userMarkerAvatarLive,
                          ]}
                        >
                          <Text style={styles.userMarkerInitial}>{user.name[0]}</Text>
                          {user.flag && (
                            <View style={styles.flagBadge}>
                              <Text style={styles.flagText}>{user.flag}</Text>
                            </View>
                          )}
                        </View>
                        {user.availableNow && shouldShowMarkerDetails && (
                          <View style={styles.markerLivePill} pointerEvents="none">
                            <Text style={styles.markerLiveText}>LIVE</Text>
                          </View>
                        )}
                        {shouldShowMarkerDetails && (
                          <View
                            style={[
                              styles.markerMetaPill,
                              user.isFallbackLocation && styles.markerMetaFallback,
                            ]}
                            pointerEvents="none"
                          >
                            <Text style={styles.markerMetaFlag}>{user.flag || '🌍'}</Text>
                            <Text style={styles.markerMetaDistance}>{user.distance || '—'}</Text>
                          </View>
                        )}
                        </View>
                    </MarkerComponent>
                  )
                ))}
              </MapViewComponent>
            )
          ) : (
            // Fallback for Expo Go - show interactive Mapbox WebView
            <View style={styles.mapBackground}>
              {userLocation ? (
                <WebView
                  key={`${mapStyle}-${availableUsers.length}`} // Force re-render when style or user count changes
                  source={{ html: generateMapHTML(mapStyle, currentUser) }}
                  style={styles.webViewMap}
                  scrollEnabled={false}
                  zoomEnabled={true}
                  showsHorizontalScrollIndicator={false}
                  showsVerticalScrollIndicator={false}
                  bounces={false}
                  onMessage={(event) => {
                    try {
                      const data = JSON.parse(event.nativeEvent.data)
                      if (data.type === 'userClick') {
                        const user = availableUsers.find(u => u.id === data.userId)
                        if (user) {
                          setSelectedUser(user)
                        }
                      }
                    } catch (e) {
                      console.error('Error parsing WebView message:', e)
                    }
                  }}
                  javaScriptEnabled={true}
                  domStorageEnabled={true}
                  allowsInlineMediaPlayback={true}
                  mediaPlaybackRequiresUserAction={false}
                />
              ) : (
                // Loading or fallback gradient
                <LinearGradient
                  colors={[Colors.background.secondary, Colors.background.tertiary, Colors.background.secondary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.mapBackground}
                >
                  <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Loading map...</Text>
                  </View>
                </LinearGradient>
                      )}
                    </View>
          )}
        </View>
      </SafeAreaView>

      {/* User Profile Modal - Animated */}
      <Modal
        visible={selectedUser !== null}
        animationType="none"
        transparent={true}
        onRequestClose={() => setSelectedUser(null)}
      >
        {selectedUser && (
          <AnimatedReanimated.View 
            entering={FadeIn.duration(300)}
            style={styles.modalOverlay}
          >
            <TouchableOpacity 
              style={StyleSheet.absoluteFill}
              activeOpacity={1}
              pointerEvents={canDismissProfileModal ? 'auto' : 'none'}
              disabled={!canDismissProfileModal}
              onPress={() => {
                if (canDismissProfileModal) {
                  setSelectedUser(null)
                }
              }}
            />
            <AnimatedReanimated.View 
              entering={SlideInUp.springify().damping(20).stiffness(300)}
              style={styles.modalContainer}
              onStartShouldSetResponder={() => true}
            >
              <SafeAreaView style={styles.modalSafeArea} edges={['top', 'bottom']}>
                {/* Header - Animated */}
                <AnimatedReanimated.View 
                  entering={FadeInDown.duration(400).delay(100)}
                  style={styles.modalHeader}
                >
                  <View style={styles.modalHeaderContent}>
                    <TouchableOpacity
                      onPress={() => setSelectedUser(null)}
                      style={styles.closeButton}
                      activeOpacity={0.7}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <X size={24} color={Colors.text.primary} />
                    </TouchableOpacity>
                  </View>
                </AnimatedReanimated.View>

              <ScrollView 
                style={styles.modalContent} 
                contentContainerStyle={styles.modalContentContainer}
                showsVerticalScrollIndicator={false}
              >
                {/* User Avatar and Info - Animated */}
                <AnimatedReanimated.View 
                  entering={ZoomIn.springify().damping(15).delay(200)}
                  style={styles.userProfileHeader}
                >
                  <AnimatedReanimated.View 
                    entering={BounceIn.duration(600).delay(300)}
                    style={styles.profileAvatar}
                  >
                    <LinearGradient
                      colors={['#8b5cf6', '#6366f1', '#3b82f6']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.profileAvatarGradient}
                    >
                      <Text style={styles.profileAvatarInitial}>{selectedUser.name[0]}</Text>
                    </LinearGradient>
                    {selectedUser.flag && (
                      <AnimatedReanimated.View 
                        entering={ZoomIn.duration(400).delay(500)}
                        style={styles.profileFlagBadge}
                      >
                        <Text style={styles.profileFlagText}>{selectedUser.flag}</Text>
                      </AnimatedReanimated.View>
                    )}
                    {selectedUser.isOnline && (
                      <AnimatedReanimated.View 
                        entering={ZoomIn.duration(400).delay(600)}
                        style={styles.onlineIndicator}
                      />
                    )}
                  </AnimatedReanimated.View>
                  <AnimatedReanimated.View 
                    entering={FadeInUp.duration(400).delay(400)}
                    style={styles.userInfo}
                  >
                    <TextReveal
                      text={selectedUser.name}
                      style={styles.userName}
                      delay={400}
                      animationType="slide"
                    />
                    <TextReveal
                      text={`@${selectedUser.name.toLowerCase()}`}
                      style={styles.userUsername}
                      delay={500}
                      animationType="fade"
                    />
                    <AnimatedReanimated.View 
                      entering={FadeInUp.duration(400).delay(500)}
                      style={styles.userStats}
                    >
                      <AnimatedReanimated.View entering={SlideInRight.duration(300).delay(600)} style={styles.statItem}>
                        <Star size={16} color={Colors.accent.primary} fill={Colors.accent.primary} />
                        <Text style={styles.statText}>{selectedUser.rating}</Text>
                      </AnimatedReanimated.View>
                      {selectedUser.distance && (
                        <AnimatedReanimated.View entering={SlideInRight.duration(300).delay(700)} style={styles.statItem}>
                          <MapPinIcon size={16} color={Colors.accent.primary} />
                          <Text style={styles.statText}>{selectedUser.distance}</Text>
                        </AnimatedReanimated.View>
                      )}
                      {selectedUser.responseTime && (
                        <AnimatedReanimated.View entering={SlideInRight.duration(300).delay(800)} style={styles.statItem}>
                          <Clock size={16} color={Colors.accent.primary} />
                          <Text style={styles.statText}>{selectedUser.responseTime}</Text>
                        </AnimatedReanimated.View>
                      )}
                    </AnimatedReanimated.View>
                  </AnimatedReanimated.View>
                </AnimatedReanimated.View>

                {/* Bio Card - Animated */}
                <AnimatedReanimated.View 
                  entering={FadeInUp.duration(400).delay(600)}
                  style={styles.bioCard}
                >
                  <Text style={styles.bioText}>{selectedUser.bio}</Text>
                  
                  {/* Availability - Animated */}
                  {selectedUser.availableNow && (
                    <AnimatedReanimated.View 
                      entering={SlideInLeft.duration(400).delay(700)}
                      style={styles.availabilityBadge}
                    >
                      <Zap size={14} color={Colors.accent.success} fill={Colors.accent.success} />
                      <Text style={styles.availabilityText}>
                        Available now for {selectedUser.availableFor}
                      </Text>
                    </AnimatedReanimated.View>
                  )}

                  {/* Languages - Animated */}
                  <AnimatedReanimated.View 
                    entering={FadeInUp.duration(400).delay(800)}
                    style={styles.languagesSection}
                  >
                    <Text style={styles.sectionTitle}>LANGUAGES</Text>
                    <View style={styles.languagesList}>
                      {selectedUser.languagesSpoken.map((lang, index) => (
                        <AnimatedReanimated.View 
                          key={index}
                          entering={SlideInRight.duration(300).delay(900 + index * 100)}
                          style={styles.languageBadge}
                        >
                          <Text style={styles.languageFlag}>{lang.flag}</Text>
                          <Text style={styles.languageName}>{lang.language}</Text>
                          <Text style={styles.languageLevel}>{lang.level}</Text>
                        </AnimatedReanimated.View>
                      ))}
                    </View>
                  </AnimatedReanimated.View>

                  {/* Location - Animated */}
                  {selectedUser.currentLocation && (
                    <AnimatedReanimated.View 
                      entering={FadeInUp.duration(400).delay(1000)}
                      style={styles.locationSection}
                    >
                      <Text style={styles.sectionTitle}>CURRENT LOCATION</Text>
                      <AnimatedReanimated.View 
                        entering={SlideInLeft.duration(300).delay(1100)}
                        style={styles.locationItem}
                      >
                        <MapPinIcon size={16} color={Colors.accent.success} />
                        <Text style={styles.locationText}>{selectedUser.currentLocation}</Text>
                      </AnimatedReanimated.View>
                    </AnimatedReanimated.View>
                  )}
                </AnimatedReanimated.View>

                {/* Action Buttons - Animated */}
                <AnimatedReanimated.View 
                  entering={FadeInUp.duration(400).delay(1200)}
                  style={styles.actionButtons}
                >
                  <ShimmerButton
                    onPress={() => {
                      // Navigate to chat
                      setSelectedUser(null)
                    }}
                    variant="gradient"
                    size="large"
                    style={styles.chatButton}
                  >
                    <View style={styles.chatButtonContent}>
                      <MessageCircle size={20} color="#ffffff" />
                      <Text style={styles.chatButtonText}>Start Chat</Text>
                    </View>
                  </ShimmerButton>
                </AnimatedReanimated.View>
              </ScrollView>
              </SafeAreaView>
            </AnimatedReanimated.View>
          </AnimatedReanimated.View>
        )}
      </Modal>

      {/* Filter Panel */}
      <Modal
        visible={isFilterOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsFilterOpen(false)}
      >
        <TouchableOpacity
          style={styles.filterOverlay}
          activeOpacity={1}
          onPress={() => setIsFilterOpen(false)}
        >
          <View style={styles.filterPanel}>
            <View style={styles.filterHeader}>
              <Text style={styles.filterTitle}>Filters</Text>
              <TouchableOpacity
                onPress={() => setIsFilterOpen(false)}
                style={styles.filterCloseButton}
              >
                <X size={24} color={Colors.text.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.filterContent} showsVerticalScrollIndicator={false}>
              {/* Distance Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Distance</Text>
                <View style={styles.sliderContainer}>
                  <Text style={styles.sliderValue}>{filterDistance} km</Text>
                  <View style={styles.sliderTrack}>
                    <View style={[styles.sliderFill, { width: `${(filterDistance / 50) * 100}%` }]} />
                    <View style={[styles.sliderThumb, { left: `${(filterDistance / 50) * 100}%` }]} />
                  </View>
                  <View style={styles.sliderLabels}>
                    <Text style={styles.sliderLabel}>1km</Text>
                    <Text style={styles.sliderLabel}>50km</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.sliderButton}
                    onPress={() => {
                      const newDistance = filterDistance === 1 ? 5 : filterDistance === 5 ? 10 : filterDistance === 10 ? 25 : 50
                      setFilterDistance(newDistance)
                    }}
                  >
                    <Text style={styles.sliderButtonText}>
                      {filterDistance === 1 ? '5km' : filterDistance === 5 ? '10km' : filterDistance === 10 ? '25km' : '1km'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Availability Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Availability</Text>
                <TouchableOpacity
                  style={[styles.filterOption, filterAvailableNow && styles.filterOptionActive]}
                  onPress={() => setFilterAvailableNow(!filterAvailableNow)}
                >
                  <View style={[styles.checkbox, filterAvailableNow && styles.checkboxChecked]}>
                    {filterAvailableNow && <View style={styles.checkboxInner} />}
                  </View>
                  <Text style={[styles.filterOptionText, filterAvailableNow && styles.filterOptionTextActive]}>
                    Available Now
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Skill Level Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Skill Level</Text>
                {['beginner', 'intermediate', 'advanced'].map((level) => (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.filterOption,
                      filterSkillLevel.includes(level) && styles.filterOptionActive,
                    ]}
                    onPress={() => {
                      setFilterSkillLevel(prev =>
                        prev.includes(level)
                          ? prev.filter(l => l !== level)
                          : [...prev, level]
                      )
                    }}
                  >
                    <View style={[styles.checkbox, filterSkillLevel.includes(level) && styles.checkboxChecked]}>
                      {filterSkillLevel.includes(level) && <View style={styles.checkboxInner} />}
                    </View>
                    <Text
                      style={[
                        styles.filterOptionText,
                        filterSkillLevel.includes(level) && styles.filterOptionTextActive,
                      ]}
                    >
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Clear Filters Button */}
              <TouchableOpacity
                style={styles.clearFiltersButton}
                onPress={() => {
                  setFilterDistance(5)
                  setFilterAvailableNow(true)
                  setFilterSkillLevel(['intermediate'])
                }}
              >
                <Text style={styles.clearFiltersText}>Clear All Filters</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  )
}

// Dark map style for better visibility
const darkMapStyle = [
  {
    elementType: 'geometry',
    stylers: [{ color: '#1e293b' }],
  },
  {
    elementType: 'labels.text.fill',
    stylers: [{ color: '#ffffff' }],
  },
  {
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#000000' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#334155' }],
  },
]

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  safeArea: {
    flex: 1,
  },
  topControls: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 120 : 100,
    left: 16,
    right: 16,
    zIndex: 1000,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    pointerEvents: 'box-none',
  },
  glassButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surface.glass,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  nearbyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface.glass,
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    gap: 6,
  },
  nearbyText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  rightButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  availabilityButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.accent.success,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.accent.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    marginRight: 8,
  },
  layersButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surface.glass,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  mapBackground: {
    flex: 1,
    position: 'relative',
  },
  webViewMap: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  staticMap: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: Colors.text.secondary,
    fontSize: 16,
  },
  header: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 50,
    left: 0,
    right: 0,
    zIndex: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
    pointerEvents: 'box-none',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text.secondary,
  },
  markersContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'box-none',
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  scanCircle: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: 'rgba(59, 130, 246, 0.4)',
    backgroundColor: 'transparent',
  },
  userMarker: {
    position: 'absolute',
    alignItems: 'center',
    flexDirection: 'column',
    gap: 8,
  },
  userMarkerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.accent.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.text.primary,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  userMarkerAvatarLive: {
    backgroundColor: '#1d4ed8',
    borderColor: '#38bdf8',
    shadowColor: '#38bdf8',
    shadowOpacity: 0.6,
  },
  userMarkerInitial: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  flagBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.text.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.background.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  flagText: {
    fontSize: 12,
  },
  markerLivePill: {
    position: 'absolute',
    top: -18,
    alignSelf: 'center',
    backgroundColor: '#22c55e',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    shadowColor: '#22c55e',
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
    pointerEvents: 'none',
  },
  markerLiveText: {
    color: '#052e16',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  markerMetaPill: {
    position: 'absolute',
    bottom: -32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.4)',
    shadowColor: '#0f172a',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    pointerEvents: 'none',
  },
  markerMetaFallback: {
    opacity: 0.85,
  },
  markerMetaFlag: {
    fontSize: 16,
  },
  markerMetaDistance: {
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  markerInfo: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface.glass,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    minWidth: 70,
  },
  markerName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  distanceBadge: {
    backgroundColor: Colors.accent.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    shadowColor: Colors.accent.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  distanceText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.text.primary,
    letterSpacing: 0.5,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: Colors.background.primary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
  },
  modalSafeArea: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  modalHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    width: '100%',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface.glass,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  modalContent: {
    flex: 1,
  },
  modalContentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  userProfileHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
    gap: 16,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.text.primary,
    position: 'relative',
    overflow: 'hidden',
  },
  profileAvatarGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileAvatarInitial: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  profileFlagBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.text.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.background.primary,
  },
  profileFlagText: {
    fontSize: 14,
  },
  onlineIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.accent.success,
    borderWidth: 2,
    borderColor: Colors.background.primary,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  userUsername: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 12,
  },
  userStats: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  bioCard: {
    backgroundColor: Colors.surface.glass,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  bioText: {
    fontSize: 16,
    lineHeight: 24,
    color: Colors.text.primary,
    marginBottom: 16,
  },
  availabilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 8,
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  availabilityText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.accent.success,
  },
  languagesSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border.primary,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text.secondary,
    letterSpacing: 1,
    marginBottom: 12,
  },
  languagesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  languageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  languageFlag: {
    fontSize: 16,
  },
  languageName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  languageLevel: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginLeft: 4,
  },
  locationSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border.primary,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.accent.success,
  },
  actionButtons: {
    marginTop: 24,
    marginBottom: 32,
  },
  chatButton: {
    width: '100%',
    borderRadius: 16,
  },
  chatButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  chatButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  availabilityButtonAnimated: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  // Current User Marker
  currentUserMarker: {
    backgroundColor: '#ffd93d',
    borderColor: '#f6c23e',
  },
  // Filter Panel Styles
  filterOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  filterPanel: {
    backgroundColor: Colors.background.primary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: 32,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
  },
  filterTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  filterCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface.glass,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 16,
  },
  sliderContainer: {
    marginBottom: 8,
  },
  sliderValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.accent.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  sliderTrack: {
    height: 4,
    backgroundColor: Colors.background.secondary,
    borderRadius: 2,
    position: 'relative',
    marginBottom: 8,
  },
  sliderFill: {
    height: 4,
    backgroundColor: Colors.accent.primary,
    borderRadius: 2,
    position: 'absolute',
  },
  sliderThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.accent.primary,
    position: 'absolute',
    top: -10,
    marginLeft: -12,
    borderWidth: 3,
    borderColor: Colors.text.primary,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sliderLabel: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
  sliderButton: {
    backgroundColor: Colors.surface.glass,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  sliderButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: Colors.surface.glass,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  filterOptionActive: {
    backgroundColor: Colors.accent.primary + '20',
    borderColor: Colors.accent.primary,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border.primary,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    borderColor: Colors.accent.primary,
    backgroundColor: Colors.accent.primary,
  },
  checkboxInner: {
    width: 12,
    height: 12,
    borderRadius: 3,
    backgroundColor: Colors.text.primary,
  },
  filterOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text.secondary,
  },
  filterOptionTextActive: {
    color: Colors.text.primary,
    fontWeight: '600',
  },
  clearFiltersButton: {
    backgroundColor: Colors.surface.glass,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  clearFiltersText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
})
