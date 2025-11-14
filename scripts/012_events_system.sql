-- =====================================================
-- EVENTS SYSTEM
-- =====================================================
-- Table for storing language-related events from various sources
-- Supports both external API events and user-generated events
-- =====================================================

-- =====================================================
-- 1. EVENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Event details
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL CHECK (event_type IN ('meetup', 'class', 'workshop', 'social', 'online', 'other')),
  
  -- Location
  latitude NUMERIC(10, 8),
  longitude NUMERIC(11, 8),
  location_name TEXT, -- e.g., "Café Esperanto", "Central Park"
  address TEXT,
  city TEXT,
  country TEXT,
  
  -- Languages
  languages TEXT[] DEFAULT '{}', -- Array of language codes (e.g., ['en', 'es', 'fr'])
  primary_language TEXT, -- Main language for the event
  
  -- Timing
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  timezone TEXT DEFAULT 'UTC',
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_pattern TEXT, -- e.g., "weekly", "monthly", "first_saturday"
  
  -- Event metadata
  emoji TEXT DEFAULT '📅',
  image_url TEXT,
  external_url TEXT, -- Link to original event (Eventbrite, Meetup, etc.)
  external_id TEXT, -- ID from external source
  source TEXT NOT NULL CHECK (source IN ('eventbrite', 'google_places', 'user_created', 'manual', 'other')),
  
  -- Organizer info
  organizer_name TEXT,
  organizer_id UUID REFERENCES users(id) ON DELETE SET NULL, -- If created by a user
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'completed', 'postponed')),
  is_featured BOOLEAN DEFAULT FALSE,
  
  -- Engagement metrics
  attendees_count INTEGER DEFAULT 0,
  max_attendees INTEGER,
  is_free BOOLEAN DEFAULT TRUE,
  price TEXT, -- e.g., "Free", "$10", "€5-15"
  
  -- Metadata
  tags TEXT[] DEFAULT '{}', -- e.g., ['language-exchange', 'spanish', 'beginner-friendly']
  metadata JSONB DEFAULT '{}', -- Additional flexible data
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ -- When to remove from active listings
);

-- Indexes for fast queries
CREATE INDEX idx_events_location ON events USING GIST (
  ST_MakePoint(longitude::double precision, latitude::double precision)
) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

CREATE INDEX idx_events_start_time ON events(start_time DESC);
CREATE INDEX idx_events_status ON events(status, start_time DESC);
CREATE INDEX idx_events_languages ON events USING GIN(languages);
CREATE INDEX idx_events_source ON events(source, external_id);
CREATE INDEX idx_events_city ON events(city, start_time DESC);
CREATE INDEX idx_events_featured ON events(is_featured, start_time DESC) WHERE status = 'active';
CREATE INDEX idx_events_expires ON events(expires_at) WHERE expires_at IS NOT NULL;

-- =====================================================
-- 2. EVENT ATTENDEES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS event_attendees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'going' CHECK (status IN ('going', 'interested', 'not_going')),
  rsvp_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

CREATE INDEX idx_event_attendees_event ON event_attendees(event_id, status);
CREATE INDEX idx_event_attendees_user ON event_attendees(user_id, rsvp_at DESC);

-- =====================================================
-- 3. FUNCTIONS
-- =====================================================

-- Function: Find nearby events
CREATE OR REPLACE FUNCTION find_nearby_events(
  user_lat NUMERIC,
  user_lng NUMERIC,
  radius_km NUMERIC DEFAULT 50,
  event_languages TEXT[] DEFAULT NULL,
  start_after TIMESTAMPTZ DEFAULT NOW(),
  limit_count INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  event_type TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  location_name TEXT,
  address TEXT,
  city TEXT,
  languages TEXT[],
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  emoji TEXT,
  image_url TEXT,
  external_url TEXT,
  organizer_name TEXT,
  attendees_count INTEGER,
  is_free BOOLEAN,
  price TEXT,
  distance_km NUMERIC,
  source TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.title,
    e.description,
    e.event_type,
    e.latitude,
    e.longitude,
    e.location_name,
    e.address,
    e.city,
    e.languages,
    e.start_time,
    e.end_time,
    e.emoji,
    e.image_url,
    e.external_url,
    e.organizer_name,
    e.attendees_count,
    e.is_free,
    e.price,
    ST_Distance(
      ST_MakePoint(user_lng::double precision, user_lat::double precision)::geography,
      ST_MakePoint(e.longitude::double precision, e.latitude::double precision)::geography
    ) / 1000.0 AS distance_km,
    e.source
  FROM events e
  WHERE 
    e.status = 'active'
    AND e.latitude IS NOT NULL
    AND e.longitude IS NOT NULL
    AND e.start_time >= start_after
    AND (e.expires_at IS NULL OR e.expires_at > NOW())
    AND (
      event_languages IS NULL 
      OR e.languages && event_languages 
      OR e.primary_language = ANY(event_languages)
    )
    AND ST_Distance(
      ST_MakePoint(user_lng::double precision, user_lat::double precision)::geography,
      ST_MakePoint(e.longitude::double precision, e.latitude::double precision)::geography
    ) <= radius_km * 1000
  ORDER BY distance_km ASC, e.start_time ASC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function: Get event with attendee count
CREATE OR REPLACE FUNCTION get_event_with_stats(event_id UUID)
RETURNS TABLE (
  event JSONB,
  attendee_count BIGINT,
  going_count BIGINT,
  interested_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    row_to_json(e.*)::jsonb AS event,
    COUNT(DISTINCT ea.user_id) AS attendee_count,
    COUNT(DISTINCT CASE WHEN ea.status = 'going' THEN ea.user_id END) AS going_count,
    COUNT(DISTINCT CASE WHEN ea.status = 'interested' THEN ea.user_id END) AS interested_count
  FROM events e
  LEFT JOIN event_attendees ea ON ea.event_id = e.id
  WHERE e.id = event_id
  GROUP BY e.id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 4. TRIGGERS
-- =====================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_events_updated_at();

-- Update attendees count
CREATE OR REPLACE FUNCTION update_event_attendees_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE events
  SET attendees_count = (
    SELECT COUNT(*) FROM event_attendees 
    WHERE event_id = COALESCE(NEW.event_id, OLD.event_id) 
    AND status = 'going'
  )
  WHERE id = COALESCE(NEW.event_id, OLD.event_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_event_attendees_count
  AFTER INSERT OR UPDATE OR DELETE ON event_attendees
  FOR EACH ROW
  EXECUTE FUNCTION update_event_attendees_count();

-- =====================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_attendees ENABLE ROW LEVEL SECURITY;

-- Everyone can read active events
CREATE POLICY "Anyone can view active events"
  ON events FOR SELECT
  USING (status = 'active' AND (expires_at IS NULL OR expires_at > NOW()));

-- Users can create events
CREATE POLICY "Users can create events"
  ON events FOR INSERT
  WITH CHECK (true);

-- Users can update their own events
CREATE POLICY "Users can update own events"
  ON events FOR UPDATE
  USING (organizer_id = auth.uid());

-- Everyone can view attendees
CREATE POLICY "Anyone can view attendees"
  ON event_attendees FOR SELECT
  USING (true);

-- Users can RSVP to events
CREATE POLICY "Users can RSVP to events"
  ON event_attendees FOR ALL
  USING (auth.uid() = user_id);

