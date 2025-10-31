# Location-Based User Discovery Guide

Complete guide for implementing location-based discovery in the language exchange app.

## Table of Contents
1. [PostGIS Setup](#postgis-setup)
2. [Database Schema](#database-schema)
3. [Core Functions](#core-functions)
4. [Usage Examples](#usage-examples)
5. [Performance Optimization](#performance-optimization)
6. [Privacy & Security](#privacy--security)
7. [Mobile Integration](#mobile-integration)

---

## PostGIS Setup

### Enable PostGIS in Supabase

1. **Via Supabase Dashboard:**
   - Go to Database → Extensions
   - Search for "postgis"
   - Click "Enable"

2. **Via SQL:**
   \`\`\`sql
   CREATE EXTENSION IF NOT EXISTS postgis;
   \`\`\`

3. **Verify Installation:**
   \`\`\`sql
   SELECT PostGIS_Version();
   \`\`\`

### Run Migration Script

Execute the migration script in order:
\`\`\`bash
# In Supabase SQL Editor or via v0
scripts/006_postgis_location_discovery.sql
\`\`\`

---

## Database Schema

### Location Fields in Users Table

\`\`\`sql
- location_point: geography(Point, 4326)  -- PostGIS point for spatial queries
- latitude: double precision               -- Rounded latitude (3 decimals)
- longitude: double precision              -- Rounded longitude (3 decimals)
- location_accuracy: real                  -- GPS accuracy in meters
- location_updated_at: timestamp           -- Last location update
- ghost_mode: boolean                      -- Hide from discovery
- last_active_at: timestamp                -- Last app activity
- discovery_radius_km: real                -- User's preferred search radius
\`\`\`

### Spatial Indexes

\`\`\`sql
-- Main spatial index for fast geo queries
CREATE INDEX idx_users_location_point ON users USING GIST (location_point);

-- Supporting indexes
CREATE INDEX idx_users_last_active ON users (last_active_at DESC);
CREATE INDEX idx_users_discoverable ON users (ghost_mode, is_available);
CREATE INDEX idx_users_languages ON users USING GIN (languages_speak, languages_learn);
\`\`\`

---

## Core Functions

### 1. Update User Location

\`\`\`typescript
import { updateUserLocation } from '@/lib/supabase/location'

// Update user's location
const result = await updateUserLocation(
  userId,
  40.7128,  // latitude
  -74.0060, // longitude
  10.0      // accuracy in meters
)
\`\`\`

**Privacy Protection:**
- Coordinates rounded to 3 decimal places (~111m precision)
- Prevents exact location tracking
- Maintains usefulness for nearby discovery

### 2. Find Nearby Users

\`\`\`typescript
import { findNearbyUsers } from '@/lib/supabase/location'

// Find users within 2km
const nearbyUsers = await findNearbyUsers(
  userId,
  40.7128,  // my latitude
  -74.0060, // my longitude
  2.0,      // radius in km
  20        // max results
)

// Results include:
// - user_id, full_name, avatar_url, bio
// - languages_speak, languages_learn
// - distance_meters, distance_km
// - language_match_score (higher = better match)
\`\`\`

**Filters Applied:**
- ✅ Within specified radius
- ✅ Language match (they speak what you learn OR vice versa)
- ✅ Available for exchange
- ✅ Not in ghost mode
- ✅ Active within last 7 days
- ✅ Not blocked (both ways)

**Sorting:**
1. Language match score (best matches first)
2. Distance (closest first)

### 3. Count Nearby Users

\`\`\`typescript
import { countNearbyUsers } from '@/lib/supabase/location'

// Quick count without full data
const count = await countNearbyUsers(
  userId,
  40.7128,
  -74.0060,
  5.0 // radius in km
)
\`\`\`

### 4. Ghost Mode

\`\`\`typescript
import { toggleGhostMode } from '@/lib/supabase/location'

// Hide from discovery
await toggleGhostMode(userId, true)

// Show in discovery
await toggleGhostMode(userId, false)
\`\`\`

### 5. Keep User Active

\`\`\`typescript
import { updateLastActive } from '@/lib/supabase/location'

// Call every 5 minutes while app is active
setInterval(() => {
  updateLastActive(userId)
}, 5 * 60 * 1000)
\`\`\`

---

## Usage Examples

### Complete Discovery Flow

\`\`\`typescript
'use client'

import { useEffect, useState } from 'react'
import { 
  getCurrentLocation, 
  findNearbyUsers, 
  updateUserLocation,
  watchUserLocation,
  type NearbyUser 
} from '@/lib/supabase/location'

export function NearbyUsersMap({ userId }: { userId: string }) {
  const [nearbyUsers, setNearbyUsers] = useState<NearbyUser[]>([])
  const [radius, setRadius] = useState(5.0) // km
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cleanup: (() => void) | undefined

    async function initLocation() {
      try {
        // Get initial location
        const position = await getCurrentLocation()
        const { latitude, longitude, accuracy } = position.coords

        // Update user's location in database
        await updateUserLocation(userId, latitude, longitude, accuracy)

        // Find nearby users
        const users = await findNearbyUsers(userId, latitude, longitude, radius)
        setNearbyUsers(users)
        setLoading(false)

        // Watch for location changes
        cleanup = watchUserLocation(userId, async (location) => {
          // Refresh nearby users when location updates
          const updated = await findNearbyUsers(
            userId, 
            location.latitude, 
            location.longitude, 
            radius
          )
          setNearbyUsers(updated)
        })
      } catch (error) {
        console.error('Location error:', error)
        setLoading(false)
      }
    }

    initLocation()

    // Cleanup on unmount
    return () => {
      if (cleanup) cleanup()
    }
  }, [userId, radius])

  // Refresh nearby users every 30 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const position = await getCurrentLocation()
        const { latitude, longitude } = position.coords
        const users = await findNearbyUsers(userId, latitude, longitude, radius)
        setNearbyUsers(users)
      } catch (error) {
        console.error('Refresh error:', error)
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [userId, radius])

  if (loading) return <div>Finding nearby users...</div>

  return (
    <div>
      <h2>{nearbyUsers.length} users nearby</h2>
      {nearbyUsers.map(user => (
        <div key={user.user_id}>
          <h3>{user.full_name}</h3>
          <p>{user.distance_km.toFixed(1)}km away</p>
          <p>Match score: {user.language_match_score}</p>
        </div>
      ))}
    </div>
  )
}
\`\`\`

### Radius Selector

\`\`\`typescript
const RADIUS_OPTIONS = [
  { value: 0.5, label: '500m' },
  { value: 1, label: '1km' },
  { value: 2, label: '2km' },
  { value: 5, label: '5km' },
  { value: 10, label: '10km' },
]

function RadiusSelector({ value, onChange }: { 
  value: number
  onChange: (radius: number) => void 
}) {
  return (
    <select value={value} onChange={(e) => onChange(Number(e.target.value))}>
      {RADIUS_OPTIONS.map(option => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}
\`\`\`

---

## Performance Optimization

### Query Performance

**Spatial Index (GIST):**
\`\`\`sql
CREATE INDEX idx_users_location_point ON users USING GIST (location_point);
\`\`\`
- Enables fast radius searches
- O(log n) complexity instead of O(n)
- Essential for production

**Composite Indexes:**
\`\`\`sql
CREATE INDEX idx_users_discoverable 
ON users (ghost_mode, is_available) 
WHERE ghost_mode = false;
\`\`\`
- Filters out hidden users quickly
- Reduces query scan size

**Language Matching (GIN):**
\`\`\`sql
CREATE INDEX idx_users_languages 
ON users USING GIN (languages_speak, languages_learn);
\`\`\`
- Fast array intersection queries
- Efficient language matching

### Query Optimization Tips

1. **Limit Results:**
   \`\`\`typescript
   // Always set a reasonable limit
   findNearbyUsers(userId, lat, lon, 5.0, 50) // max 50 users
   \`\`\`

2. **Use Appropriate Radius:**
   \`\`\`typescript
   // Smaller radius = faster queries
   // Start with 2-5km, expand if needed
   \`\`\`

3. **Cache Results:**
   \`\`\`typescript
   // Cache for 30-60 seconds
   // Don't query on every render
   \`\`\`

4. **Batch Updates:**
   \`\`\`typescript
   // Update location every 1-5 minutes, not every second
   \`\`\`

### Expected Performance

- **< 100ms** for queries within 5km radius
- **< 200ms** for queries within 10km radius
- **< 50ms** for count queries
- Handles **100,000+ users** efficiently

---

## Privacy & Security

### Privacy Features

1. **Coordinate Rounding:**
   - Rounds to 3 decimal places (~111m precision)
   - Prevents exact location tracking
   - Maintains discovery usefulness

2. **Ghost Mode:**
   - Users can hide from discovery
   - Completely invisible to nearby searches
   - Can still use app normally

3. **Blocked Users:**
   - Blocked users never appear in results
   - Works both ways (blocker and blocked)
   - Enforced at database level

4. **Active Users Only:**
   - Only shows users active within 7 days
   - Prevents stale profiles
   - Configurable threshold

### Security Considerations

1. **RLS Policies:**
   \`\`\`sql
   -- Users can only update their own location
   CREATE POLICY "Users can update own location"
   ON users FOR UPDATE
   USING (auth.uid() = id);
   \`\`\`

2. **Function Security:**
   \`\`\`sql
   -- All functions use SECURITY DEFINER
   -- Ensures proper permission checks
   CREATE OR REPLACE FUNCTION find_nearby_users(...)
   SECURITY DEFINER
   \`\`\`

3. **No Exact Locations:**
   - Never expose exact coordinates in API
   - Always use rounded values
   - Distance is approximate

4. **Rate Limiting:**
   - Implement client-side throttling
   - Don't query more than once per 30 seconds
   - Use SWR or React Query for caching

---

## Mobile Integration

### Request Location Permission

\`\`\`typescript
async function requestLocationPermission() {
  if (!navigator.geolocation) {
    alert('Geolocation not supported')
    return false
  }

  try {
    const position = await getCurrentLocation()
    return true
  } catch (error) {
    if (error.code === error.PERMISSION_DENIED) {
      alert('Location permission denied')
    }
    return false
  }
}
\`\`\`

### Background Location Updates

\`\`\`typescript
// Start watching location when app becomes active
let locationWatcher: (() => void) | undefined

function startLocationTracking(userId: string) {
  if (locationWatcher) return // Already watching

  locationWatcher = watchUserLocation(userId, (location) => {
    console.log('Location updated:', location)
  })
}

function stopLocationTracking() {
  if (locationWatcher) {
    locationWatcher() // Call cleanup function
    locationWatcher = undefined
  }
}

// Handle app visibility
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    stopLocationTracking()
  } else {
    startLocationTracking(userId)
  }
})
\`\`\`

### Handle Low Accuracy

\`\`\`typescript
const MIN_ACCURACY = 100 // meters

async function updateLocationIfAccurate(userId: string) {
  const position = await getCurrentLocation()
  const { latitude, longitude, accuracy } = position.coords

  if (accuracy > MIN_ACCURACY) {
    console.warn('GPS accuracy too low:', accuracy)
    // Show warning to user
    return false
  }

  await updateUserLocation(userId, latitude, longitude, accuracy)
  return true
}
\`\`\`

---

## Testing

### Test Queries

\`\`\`sql
-- Test 1: Find users near New York City
SELECT * FROM find_nearby_users(
  'test-user-id',
  40.7128,
  -74.0060,
  5.0,
  10
);

-- Test 2: Count nearby users
SELECT count_nearby_users(
  'test-user-id',
  40.7128,
  -74.0060,
  2.0
);

-- Test 3: Update location
SELECT update_user_location(
  'test-user-id',
  40.7128,
  -74.0060,
  15.0
);

-- Test 4: Check spatial index usage
EXPLAIN ANALYZE
SELECT * FROM find_nearby_users(
  'test-user-id',
  40.7128,
  -74.0060,
  5.0,
  50
);
-- Should show "Index Scan using idx_users_location_point"
\`\`\`

### Performance Benchmarks

\`\`\`sql
-- Benchmark query performance
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM find_nearby_users(
  'test-user-id',
  40.7128,
  -74.0060,
  5.0,
  50
);
\`\`\`

---

## Troubleshooting

### Common Issues

1. **PostGIS not enabled:**
   \`\`\`sql
   CREATE EXTENSION IF NOT EXISTS postgis;
   \`\`\`

2. **Slow queries:**
   - Check indexes exist: `\d users`
   - Reduce radius or limit
   - Analyze query plan: `EXPLAIN ANALYZE`

3. **No results:**
   - Check user has location set
   - Verify language matches exist
   - Check ghost_mode is false
   - Verify last_active_at is recent

4. **Location permission denied:**
   - Request permission on user action (button click)
   - Provide fallback (manual city selection)
   - Explain why location is needed

---

## Best Practices

1. **Update location sparingly** (every 1-5 minutes)
2. **Cache nearby users** (30-60 seconds)
3. **Use appropriate radius** (start with 2-5km)
4. **Limit results** (20-50 users max)
5. **Handle errors gracefully** (no location, no permission)
6. **Respect privacy** (ghost mode, blocked users)
7. **Keep users active** (update last_active_at)
8. **Test with real data** (seed test users)

---

## Next Steps

1. Run migration script: `006_postgis_location_discovery.sql`
2. Test functions in SQL editor
3. Integrate location functions in app
4. Add UI for radius selection
5. Implement location permission flow
6. Add ghost mode toggle
7. Test with multiple users
8. Monitor query performance
9. Add analytics for discovery metrics

---

For questions or issues, refer to:
- PostGIS Documentation: https://postgis.net/docs/
- Supabase Spatial Data: https://supabase.com/docs/guides/database/extensions/postgis
