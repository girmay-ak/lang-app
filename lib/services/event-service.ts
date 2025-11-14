"use client"

import { createClient } from "@/lib/supabase/client"
import type { SupabaseClient } from "@supabase/supabase-js"

export interface LanguageEvent {
  id: string
  title: string
  description?: string
  event_type: "meetup" | "class" | "workshop" | "social" | "online" | "other"
  latitude?: number
  longitude?: number
  location_name?: string
  address?: string
  city?: string
  languages: string[]
  primary_language?: string
  start_time: string
  end_time?: string
  emoji: string
  image_url?: string
  external_url?: string
  organizer_name?: string
  attendees_count: number
  is_free: boolean
  price?: string
  source: "eventbrite" | "google_places" | "user_created" | "manual" | "other"
  distance_km?: number
  tags?: string[]
}

interface FindEventsFilters {
  languages?: string[]
  event_type?: string[]
  radius_km?: number
  start_after?: Date
  limit?: number
  city?: string
}

// Language-related keywords for filtering events
const LANGUAGE_KEYWORDS = [
  "language",
  "linguistic",
  "polyglot",
  "exchange",
  "practice",
  "conversation",
  "speaking",
  "tandem",
  "immersion",
  "learn",
  "study",
  "workshop",
  "class",
  "meetup",
  "cafe",
  "coffee",
  "chat",
  "spanish",
  "french",
  "german",
  "italian",
  "portuguese",
  "chinese",
  "japanese",
  "korean",
  "arabic",
  "russian",
  "dutch",
  "english",
]

// Language codes mapping
const LANGUAGE_NAMES: Record<string, string[]> = {
  en: ["english", "eng"],
  es: ["spanish", "español", "esp"],
  fr: ["french", "français", "francais"],
  de: ["german", "deutsch"],
  it: ["italian", "italiano"],
  pt: ["portuguese", "português", "portugues"],
  zh: ["chinese", "mandarin", "中文"],
  ja: ["japanese", "日本語", "nihongo"],
  ko: ["korean", "한국어", "hangul"],
  ar: ["arabic", "عربي"],
  ru: ["russian", "русский"],
  nl: ["dutch", "nederlands"],
  pl: ["polish", "polski"],
  tr: ["turkish", "türkçe"],
  hi: ["hindi", "हिन्दी"],
  sv: ["swedish", "svenska"],
  no: ["norwegian", "norsk"],
  da: ["danish", "dansk"],
  fi: ["finnish", "suomi"],
}

function extractLanguagesFromText(text: string): string[] {
  const lowerText = text.toLowerCase()
  const foundLanguages: string[] = []

  for (const [code, names] of Object.entries(LANGUAGE_NAMES)) {
    if (names.some((name) => lowerText.includes(name))) {
      foundLanguages.push(code)
    }
  }

  return foundLanguages
}

function isLanguageRelated(title: string, description: string = ""): boolean {
  const combined = `${title} ${description}`.toLowerCase()
  return LANGUAGE_KEYWORDS.some((keyword) => combined.includes(keyword))
}

export const eventService = {
  /**
   * Find nearby language-related events
   */
  async findNearbyEvents(
    latitude: number,
    longitude: number,
    filters?: FindEventsFilters,
  ): Promise<LanguageEvent[]> {
    try {
      const supabase = createClient()

      // Use the database function if available
      const { data, error } = await supabase.rpc("find_nearby_events", {
        user_lat: latitude,
        user_lng: longitude,
        radius_km: filters?.radius_km ?? 50,
        event_languages: filters?.languages ?? null,
        start_after: filters?.start_after?.toISOString() ?? new Date().toISOString(),
        limit_count: filters?.limit ?? 50,
      })

      if (error) {
        const errorDetails = {
          message: error.message || "Unknown error",
          details: error.details || null,
          hint: error.hint || null,
          code: error.code || null,
        }
        console.warn("[eventService] RPC unavailable, using fallback:", errorDetails)
        return this.findNearbyEventsFallback(latitude, longitude, filters)
      }

      return (data ?? []).map(this.mapEventFromDb)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      const errorStack = error instanceof Error ? error.stack : undefined
      console.error("[eventService] findNearbyEvents error:", {
        message: errorMessage,
        stack: errorStack,
        error,
      })
      return this.findNearbyEventsFallback(latitude, longitude, filters)
    }
  },

  /**
   * Fallback method using direct query
   */
  async findNearbyEventsFallback(
    latitude: number,
    longitude: number,
    filters?: FindEventsFilters,
  ): Promise<LanguageEvent[]> {
    try {
      const supabase = createClient()
      
      // Check if supabase client is properly initialized
      if (!supabase) {
        console.warn("[eventService] Supabase client not initialized")
        return []
      }

      // Check if environment variables are set
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        console.warn("[eventService] Supabase environment variables not configured")
        return []
      }

      const radiusKm = filters?.radius_km ?? 50
      const startAfter = filters?.start_after ?? new Date()

      // Try a simple query first to check if table exists
      const testQuery = supabase.from("events").select("id").limit(1)
      const testResult = await testQuery

      // If table doesn't exist, return empty array gracefully
      if (testResult.error) {
        const errorCode = testResult.error.code
        const errorMessage = testResult.error.message || ""
        
        // Check for "relation does not exist" error (PostgreSQL error code 42P01)
        if (
          errorCode === "42P01" ||
          errorMessage.toLowerCase().includes("does not exist") ||
          errorMessage.toLowerCase().includes("relation") ||
          errorMessage.toLowerCase().includes("table")
        ) {
          console.info(
            "[eventService] Events table does not exist yet. " +
            "This is expected if you haven't run the database migration. " +
            "Events will be fetched from Eventbrite API instead. " +
            "To enable database storage, run: scripts/012_events_system.sql"
          )
          return []
        }
        
        // For other errors, log and return empty
        console.warn("[eventService] Error checking events table:", {
          code: errorCode,
          message: errorMessage,
          details: testResult.error.details,
          hint: testResult.error.hint,
        })
        return []
      }

      // Table exists, proceed with full query
      let query = supabase
        .from("events")
        .select("*")
        .eq("status", "active")
        .gte("start_time", startAfter.toISOString())
        .not("latitude", "is", null)
        .not("longitude", "is", null)

      if (filters?.languages?.length) {
        query = query.or(
          `languages.cs.{${filters.languages.join(",")}},primary_language.in.(${filters.languages.join(",")})`,
        )
      }

      if (filters?.event_type?.length) {
        query = query.in("event_type", filters.event_type)
      }

      if (filters?.city) {
        query = query.ilike("city", `%${filters.city}%`)
      }

      const result = await query
        .order("start_time", { ascending: true })
        .limit(filters?.limit ?? 50)
      
      if (result.error) {
        console.warn("[eventService] Error fetching events:", {
          code: result.error.code,
          message: result.error.message,
          details: result.error.details,
        })
        return []
      }

      // Calculate distance and filter by radius
      const eventsWithDistance = (result.data ?? [])
        .map((event: any) => {
          const distance = this.calculateDistance(
            latitude,
            longitude,
            event.latitude,
            event.longitude,
          )
          return { ...event, distance_km: distance }
        })
        .filter((event: any) => event.distance_km <= radiusKm)
        .sort((a: any, b: any) => a.distance_km - b.distance_km)

      return eventsWithDistance.map(this.mapEventFromDb)
    } catch (outerError) {
      // Catch any unexpected errors
      const errorMessage = outerError instanceof Error ? outerError.message : String(outerError)
      console.warn("[eventService] Unexpected error in findNearbyEventsFallback:", errorMessage)
      return []
    }
  },

  /**
   * Fetch events from Eventbrite API (free tier)
   * Note: Requires EVENTBRITE_API_KEY in environment
   */
  async fetchFromEventbrite(
    latitude: number,
    longitude: number,
    radiusKm: number = 50,
  ): Promise<LanguageEvent[]> {
    const apiKey = process.env.NEXT_PUBLIC_EVENTBRITE_API_KEY
    if (!apiKey) {
      console.warn("[eventService] Eventbrite API key not configured")
      return []
    }

    try {
      // Convert km to miles (Eventbrite uses miles)
      const radiusMiles = radiusKm * 0.621371

      // Search for events with language-related keywords
      const keywords = ["language exchange", "language practice", "polyglot", "tandem"]
      const allEvents: LanguageEvent[] = []

      for (const keyword of keywords) {
        // Eventbrite API uses private token as query parameter
        const response = await fetch(
          `https://www.eventbriteapi.com/v3/events/search/?` +
            `location.latitude=${latitude}&` +
            `location.longitude=${longitude}&` +
            `location.within=${radiusMiles}mi&` +
            `q=${encodeURIComponent(keyword)}&` +
            `start_date.range_start=${new Date().toISOString()}&` +
            `status=live&` +
            `order_by=start_asc&` +
            `expand=venue,organizer&` +
            `token=${apiKey}`,
        )

        if (!response.ok) {
          console.warn(`[eventService] Eventbrite API error for "${keyword}":`, response.statusText)
          continue
        }

        const data = await response.json()
        const events = (data.events ?? []).map((event: any) =>
          this.mapEventbriteEvent(event),
        )

        // Filter for language-related events
        const languageEvents = events.filter((e: LanguageEvent) =>
          isLanguageRelated(e.title, e.description),
        )

        allEvents.push(...languageEvents)
      }

      // Deduplicate by external_id
      const uniqueEvents = Array.from(
        new Map(allEvents.map((e) => [e.external_url, e])).values(),
      )

      return uniqueEvents
    } catch (error) {
      console.error("[eventService] fetchFromEventbrite error:", error)
      return []
    }
  },

  /**
   * Map Eventbrite event to our format
   */
  mapEventbriteEvent(event: any): LanguageEvent {
    const venue = event.venue
    const languages = extractLanguagesFromText(
      `${event.name?.text || ""} ${event.description?.text || ""}`,
    )

    return {
      id: `eventbrite-${event.id}`,
      title: event.name?.text || "Untitled Event",
      description: event.description?.text,
      event_type: "meetup",
      latitude: venue?.latitude ? parseFloat(venue.latitude) : undefined,
      longitude: venue?.longitude ? parseFloat(venue.longitude) : undefined,
      location_name: venue?.name,
      address: venue?.address?.localized_area_display,
      city: venue?.address?.city,
      languages: languages.length > 0 ? languages : ["en"],
      start_time: event.start?.utc || event.start?.local,
      end_time: event.end?.utc || event.end?.local,
      emoji: "📅",
      image_url: event.logo?.url,
      external_url: event.url,
      organizer_name: event.organizer?.name,
      attendees_count: 0,
      is_free: event.is_free || false,
      price: event.is_free ? "Free" : event.ticket_availability?.minimum_ticket_price?.display,
      source: "eventbrite",
      tags: [],
    }
  },

  /**
   * Sync events from external APIs and save to database
   */
  async syncExternalEvents(
    latitude: number,
    longitude: number,
    radiusKm: number = 50,
  ): Promise<number> {
    const supabase = createClient()
    let syncedCount = 0

    try {
      // Check if table exists first
      const testQuery = await supabase.from("events").select("id").limit(1)
      if (testQuery.error) {
        const errorCode = testQuery.error.code
        if (errorCode === "42P01" || testQuery.error.message?.toLowerCase().includes("does not exist")) {
          // Table doesn't exist - skip syncing to database
          // Events will still be fetched and displayed, just not stored
          return 0
        }
        // Other error - log and return
        console.warn("[eventService] Error checking events table for sync:", testQuery.error.message)
        return 0
      }

      // Fetch from Eventbrite
      const eventbriteEvents = await this.fetchFromEventbrite(latitude, longitude, radiusKm)

      for (const event of eventbriteEvents) {
        try {
          // Check if event already exists
          const { data: existing, error: checkError } = await supabase
            .from("events")
            .select("id")
            .eq("source", "eventbrite")
            .eq("external_id", event.id.replace("eventbrite-", ""))
            .maybeSingle()

          if (checkError && checkError.code !== "PGRST116") {
            // PGRST116 is "not found" which is fine, other errors are not
            console.warn("[eventService] Error checking existing event:", checkError.message)
            continue
          }

          if (existing) {
            // Update existing event
            const { error: updateError } = await supabase
              .from("events")
              .update({
                title: event.title,
                description: event.description,
                latitude: event.latitude,
                longitude: event.longitude,
                location_name: event.location_name,
                address: event.address,
                city: event.city,
                languages: event.languages,
                start_time: event.start_time,
                end_time: event.end_time,
                image_url: event.image_url,
                external_url: event.external_url,
                organizer_name: event.organizer_name,
                is_free: event.is_free,
                price: event.price,
                updated_at: new Date().toISOString(),
              })
              .eq("id", existing.id)

            if (updateError) {
              console.warn("[eventService] Error updating event:", updateError.message)
            }
          } else {
            // Insert new event
            const { error: insertError } = await supabase.from("events").insert({
              title: event.title,
              description: event.description,
              event_type: event.event_type,
              latitude: event.latitude,
              longitude: event.longitude,
              location_name: event.location_name,
              address: event.address,
              city: event.city,
              languages: event.languages,
              primary_language: event.languages[0],
              start_time: event.start_time,
              end_time: event.end_time,
              emoji: event.emoji,
              image_url: event.image_url,
              external_url: event.external_url,
              external_id: event.id.replace("eventbrite-", ""),
              organizer_name: event.organizer_name,
              is_free: event.is_free,
              price: event.price,
              source: "eventbrite",
              status: "active",
              tags: event.tags || [],
            })

            if (insertError) {
              console.warn("[eventService] Error inserting event:", insertError.message)
            } else {
              syncedCount++
            }
          }
        } catch (eventError) {
          // Skip this event and continue with others
          console.warn("[eventService] Error processing event:", eventError instanceof Error ? eventError.message : eventError)
          continue
        }
      }

      return syncedCount
    } catch (error) {
      // Don't log as error - syncing is optional
      console.warn("[eventService] syncExternalEvents error (non-critical):", error instanceof Error ? error.message : error)
      return syncedCount
    }
  },

  /**
   * Create a user-generated event
   */
  async createEvent(event: Omit<LanguageEvent, "id" | "source" | "attendees_count">): Promise<LanguageEvent | null> {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new Error("User must be authenticated to create events")
    }

    const { data, error } = await supabase
      .from("events")
      .insert({
        ...event,
        organizer_id: user.id,
        source: "user_created",
        status: "active",
      })
      .select()
      .single()

    if (error) {
      console.error("[eventService] createEvent error:", error)
      return null
    }

    return this.mapEventFromDb(data)
  },

  /**
   * RSVP to an event
   */
  async rsvpToEvent(eventId: string, status: "going" | "interested" | "not_going"): Promise<boolean> {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new Error("User must be authenticated to RSVP")
    }

    const { error } = await supabase.from("event_attendees").upsert(
      {
        event_id: eventId,
        user_id: user.id,
        status,
        rsvp_at: new Date().toISOString(),
      },
      {
        onConflict: "event_id,user_id",
      },
    )

    if (error) {
      console.error("[eventService] rsvpToEvent error:", error)
      return false
    }

    return true
  },

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371 // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1)
    const dLon = this.toRad(lon2 - lon1)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  },

  toRad(degrees: number): number {
    return degrees * (Math.PI / 180)
  },

  /**
   * Map database event to LanguageEvent format
   */
  mapEventFromDb(dbEvent: any): LanguageEvent {
    return {
      id: dbEvent.id,
      title: dbEvent.title,
      description: dbEvent.description,
      event_type: dbEvent.event_type,
      latitude: dbEvent.latitude ? parseFloat(dbEvent.latitude) : undefined,
      longitude: dbEvent.longitude ? parseFloat(dbEvent.longitude) : undefined,
      location_name: dbEvent.location_name,
      address: dbEvent.address,
      city: dbEvent.city,
      languages: dbEvent.languages || [],
      primary_language: dbEvent.primary_language,
      start_time: dbEvent.start_time,
      end_time: dbEvent.end_time,
      emoji: dbEvent.emoji || "📅",
      image_url: dbEvent.image_url,
      external_url: dbEvent.external_url,
      organizer_name: dbEvent.organizer_name,
      attendees_count: dbEvent.attendees_count || 0,
      is_free: dbEvent.is_free ?? true,
      price: dbEvent.price,
      source: dbEvent.source,
      distance_km: dbEvent.distance_km,
      tags: dbEvent.tags || [],
    }
  },
}

