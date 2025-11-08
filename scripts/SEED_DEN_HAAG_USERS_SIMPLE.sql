-- Simple version: Insert test users directly (without auth.users)
-- This creates users that can be found on the map
-- Run this in Supabase SQL Editor

-- First ensure languages exist
INSERT INTO languages (code, name, native_name, flag_emoji, is_active)
VALUES 
  ('en', 'English', 'English', '🇬🇧', true),
  ('nl', 'Dutch', 'Nederlands', '🇳🇱', true),
  ('es', 'Spanish', 'Español', '🇪🇸', true),
  ('fr', 'French', 'Français', '🇫🇷', true),
  ('de', 'German', 'Deutsch', '🇩🇪', true),
  ('it', 'Italian', 'Italiano', '🇮🇹', true),
  ('pt', 'Portuguese', 'Português', '🇵🇹', true),
  ('ar', 'Arabic', 'العربية', '🇸🇦', true),
  ('ja', 'Japanese', '日本語', '🇯🇵', true),
  ('sv', 'Swedish', 'Svenska', '🇸🇪', true)
ON CONFLICT (code) DO NOTHING;

-- Create test users in Den Haag
-- Note: These will use generated UUIDs. To use with auth, create auth users first and use their IDs.

-- 1. Emma - English speaker learning Dutch (City Center)
INSERT INTO users (
  id,
  email,
  full_name,
  bio,
  latitude,
  longitude,
  location_point,
  city,
  availability_status,
  is_online,
  languages_speak,
  languages_learn,
  last_active_at,
  location_updated_at,
  show_location,
  account_status,
  created_at,
  updated_at
)
VALUES (
  gen_random_uuid(),
  'emma.english@test.com',
  'Emma',
  'British expat living in Den Haag. Love practicing Dutch over coffee! 🇬🇧🇳🇱',
  52.0795,
  4.3107,
  ST_SetSRID(ST_MakePoint(4.3107, 52.0795), 4326)::geography,
  'Den Haag',
  'available',
  true,
  ARRAY['en']::TEXT[],
  ARRAY['nl']::TEXT[],
  NOW(),
  NOW(),
  true,
  'active',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  bio = EXCLUDED.bio,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  location_point = EXCLUDED.location_point,
  availability_status = EXCLUDED.availability_status,
  is_online = EXCLUDED.is_online,
  languages_speak = EXCLUDED.languages_speak,
  languages_learn = EXCLUDED.languages_learn,
  last_active_at = NOW(),
  location_updated_at = NOW();

-- 2. Marco - Italian speaker learning Dutch (Scheveningen Beach)
INSERT INTO users (
  id, email, full_name, bio, latitude, longitude, location_point, city,
  availability_status, is_online, languages_speak, languages_learn,
  last_active_at, location_updated_at, show_location, account_status, created_at, updated_at
)
VALUES (
  gen_random_uuid(), 'marco.italian@test.com', 'Marco',
  'Italian chef learning Dutch. Regular at Dutch Language Café! 🇮🇹🇳🇱',
  52.1085, 4.2833, ST_SetSRID(ST_MakePoint(4.2833, 52.1085), 4326)::geography, 'Scheveningen',
  'available', true, ARRAY['it']::TEXT[], ARRAY['nl', 'en']::TEXT[],
  NOW(), NOW(), true, 'active', NOW(), NOW()
)
ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name, bio = EXCLUDED.bio,
  latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude,
  location_point = EXCLUDED.location_point, availability_status = EXCLUDED.availability_status,
  is_online = EXCLUDED.is_online, languages_speak = EXCLUDED.languages_speak,
  languages_learn = EXCLUDED.languages_learn, last_active_at = NOW(), location_updated_at = NOW();

-- 3. Sophie - French speaker learning Dutch (Bezuidenhout)
INSERT INTO users (
  id, email, full_name, bio, latitude, longitude, location_point, city,
  availability_status, is_online, languages_speak, languages_learn,
  last_active_at, location_updated_at, show_location, account_status, created_at, updated_at
)
VALUES (
  gen_random_uuid(), 'sophie.french@test.com', 'Sophie',
  'French teacher helping with French, learning Dutch. Intermediate level! 🇫🇷🇳🇱',
  52.0885, 4.3483, ST_SetSRID(ST_MakePoint(4.3483, 52.0885), 4326)::geography, 'Bezuidenhout',
  'available', true, ARRAY['fr']::TEXT[], ARRAY['nl', 'en']::TEXT[],
  NOW(), NOW(), true, 'active', NOW(), NOW()
)
ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name, bio = EXCLUDED.bio,
  latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude,
  location_point = EXCLUDED.location_point, availability_status = EXCLUDED.availability_status,
  is_online = EXCLUDED.is_online, languages_speak = EXCLUDED.languages_speak,
  languages_learn = EXCLUDED.languages_learn, last_active_at = NOW(), location_updated_at = NOW();

-- 4. Carlos - Spanish speaker learning Dutch (Laak)
INSERT INTO users (
  id, email, full_name, bio, latitude, longitude, location_point, city,
  availability_status, is_online, languages_speak, languages_learn,
  last_active_at, location_updated_at, show_location, account_status, created_at, updated_at
)
VALUES (
  gen_random_uuid(), 'carlos.spanish@test.com', 'Carlos',
  'Spanish speaker learning Dutch at Dutch Language Café. Member since 2024! 🇪🇸🇳🇱',
  52.0525, 4.3183, ST_SetSRID(ST_MakePoint(4.3183, 52.0525), 4326)::geography, 'Laak',
  'available', true, ARRAY['es']::TEXT[], ARRAY['nl', 'en']::TEXT[],
  NOW(), NOW(), true, 'active', NOW(), NOW()
)
ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name, bio = EXCLUDED.bio,
  latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude,
  location_point = EXCLUDED.location_point, availability_status = EXCLUDED.availability_status,
  is_online = EXCLUDED.is_online, languages_speak = EXCLUDED.languages_speak,
  languages_learn = EXCLUDED.languages_learn, last_active_at = NOW(), location_updated_at = NOW();

-- 5. Anna - German speaker learning Dutch (Escamp)
INSERT INTO users (
  id, email, full_name, bio, latitude, longitude, location_point, city,
  availability_status, is_online, languages_speak, languages_learn,
  last_active_at, location_updated_at, show_location, account_status, created_at, updated_at
)
VALUES (
  gen_random_uuid(), 'anna.german@test.com', 'Anna',
  'German native teaching German, learning Dutch. Love language exchange! 🇩🇪🇳🇱',
  52.0525, 4.2833, ST_SetSRID(ST_MakePoint(4.2833, 52.0525), 4326)::geography, 'Escamp',
  'available', true, ARRAY['de']::TEXT[], ARRAY['nl', 'en']::TEXT[],
  NOW(), NOW(), true, 'active', NOW(), NOW()
)
ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name, bio = EXCLUDED.bio,
  latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude,
  location_point = EXCLUDED.location_point, availability_status = EXCLUDED.availability_status,
  is_online = EXCLUDED.is_online, languages_speak = EXCLUDED.languages_speak,
  languages_learn = EXCLUDED.languages_learn, last_active_at = NOW(), location_updated_at = NOW();

-- 6. Yuki - Japanese speaker learning English (Centrum)
INSERT INTO users (
  id, email, full_name, bio, latitude, longitude, location_point, city,
  availability_status, is_online, languages_speak, languages_learn,
  last_active_at, location_updated_at, show_location, account_status, created_at, updated_at
)
VALUES (
  gen_random_uuid(), 'yuki.japanese@test.com', 'Yuki',
  'Japanese speaker learning English and Dutch. Beginner level! 🇯🇵🇳🇱',
  52.0705, 4.3007, ST_SetSRID(ST_MakePoint(4.3007, 52.0705), 4326)::geography, 'Den Haag Centrum',
  'available', true, ARRAY['ja']::TEXT[], ARRAY['en', 'nl']::TEXT[],
  NOW(), NOW(), true, 'active', NOW(), NOW()
)
ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name, bio = EXCLUDED.bio,
  latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude,
  location_point = EXCLUDED.location_point, availability_status = EXCLUDED.availability_status,
  is_online = EXCLUDED.is_online, languages_speak = EXCLUDED.languages_speak,
  languages_learn = EXCLUDED.languages_learn, last_active_at = NOW(), location_updated_at = NOW();

-- 7. Ahmed - Arabic speaker learning Dutch (Segbroek)
INSERT INTO users (
  id, email, full_name, bio, latitude, longitude, location_point, city,
  availability_status, is_online, languages_speak, languages_learn,
  last_active_at, location_updated_at, show_location, account_status, created_at, updated_at
)
VALUES (
  gen_random_uuid(), 'ahmed.arabic@test.com', 'Ahmed',
  'Arabic speaker teaching Arabic, learning Dutch. Practice makes perfect! 🇸🇦🇳🇱',
  52.0705, 4.2583, ST_SetSRID(ST_MakePoint(4.2583, 52.0705), 4326)::geography, 'Segbroek',
  'available', true, ARRAY['ar']::TEXT[], ARRAY['nl', 'en']::TEXT[],
  NOW(), NOW(), true, 'active', NOW(), NOW()
)
ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name, bio = EXCLUDED.bio,
  latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude,
  location_point = EXCLUDED.location_point, availability_status = EXCLUDED.availability_status,
  is_online = EXCLUDED.is_online, languages_speak = EXCLUDED.languages_speak,
  languages_learn = EXCLUDED.languages_learn, last_active_at = NOW(), location_updated_at = NOW();

-- 8. Lisa - Dutch native helping others (Loosduinen)
INSERT INTO users (
  id, email, full_name, bio, latitude, longitude, location_point, city,
  availability_status, is_online, languages_speak, languages_learn,
  last_active_at, location_updated_at, show_location, account_status, created_at, updated_at
)
VALUES (
  gen_random_uuid(), 'lisa.dutch@test.com', 'Lisa',
  'Dutch native helping others learn Dutch. Volunteer at Dutch Language Café! 🇳🇱🇫🇷',
  52.0525, 4.2583, ST_SetSRID(ST_MakePoint(4.2583, 52.0525), 4326)::geography, 'Loosduinen',
  'available', true, ARRAY['nl']::TEXT[], ARRAY['fr', 'es']::TEXT[],
  NOW(), NOW(), true, 'active', NOW(), NOW()
)
ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name, bio = EXCLUDED.bio,
  latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude,
  location_point = EXCLUDED.location_point, availability_status = EXCLUDED.availability_status,
  is_online = EXCLUDED.is_online, languages_speak = EXCLUDED.languages_speak,
  languages_learn = EXCLUDED.languages_learn, last_active_at = NOW(), location_updated_at = NOW();

-- 9. Maria - Portuguese speaker learning Dutch (Ypenburg)
INSERT INTO users (
  id, email, full_name, bio, latitude, longitude, location_point, city,
  availability_status, is_online, languages_speak, languages_learn,
  last_active_at, location_updated_at, show_location, account_status, created_at, updated_at
)
VALUES (
  gen_random_uuid(), 'maria.portuguese@test.com', 'Maria',
  'Portuguese speaker learning Dutch. Pre-intermediate level! 🇵🇹🇳🇱',
  52.0425, 4.3700, ST_SetSRID(ST_MakePoint(4.3700, 52.0425), 4326)::geography, 'Ypenburg',
  'available', true, ARRAY['pt']::TEXT[], ARRAY['nl', 'en']::TEXT[],
  NOW(), NOW(), true, 'active', NOW(), NOW()
)
ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name, bio = EXCLUDED.bio,
  latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude,
  location_point = EXCLUDED.location_point, availability_status = EXCLUDED.availability_status,
  is_online = EXCLUDED.is_online, languages_speak = EXCLUDED.languages_speak,
  languages_learn = EXCLUDED.languages_learn, last_active_at = NOW(), location_updated_at = NOW();

-- 10. Emma S. - Swedish speaker learning Spanish (Kijkduin)
INSERT INTO users (
  id, email, full_name, bio, latitude, longitude, location_point, city,
  availability_status, is_online, languages_speak, languages_learn,
  last_active_at, location_updated_at, show_location, account_status, created_at, updated_at
)
VALUES (
  gen_random_uuid(), 'emma.swedish@test.com', 'Emma S.',
  'Swedish speaker teaching Swedish, learning Spanish. Intermediate level! 🇸🇪🇪🇸',
  52.0625, 4.2200, ST_SetSRID(ST_MakePoint(4.2200, 52.0625), 4326)::geography, 'Kijkduin',
  'available', true, ARRAY['sv']::TEXT[], ARRAY['es', 'nl']::TEXT[],
  NOW(), NOW(), true, 'active', NOW(), NOW()
)
ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name, bio = EXCLUDED.bio,
  latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude,
  location_point = EXCLUDED.location_point, availability_status = EXCLUDED.availability_status,
  is_online = EXCLUDED.is_online, languages_speak = EXCLUDED.languages_speak,
  languages_learn = EXCLUDED.languages_learn, last_active_at = NOW(), location_updated_at = NOW();

-- Now add user_languages entries
-- Delete existing and insert fresh
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN SELECT id, languages_speak, languages_learn FROM users WHERE email LIKE '%@test.com' LOOP
    -- Delete existing
    DELETE FROM user_languages WHERE user_id = user_record.id;
    
    -- Insert native languages
    IF user_record.languages_speak IS NOT NULL THEN
      INSERT INTO user_languages (user_id, language_code, language_type, proficiency_level)
      SELECT user_record.id, unnest(user_record.languages_speak), 'native', 'native';
    END IF;
    
    -- Insert learning languages
    IF user_record.languages_learn IS NOT NULL THEN
      INSERT INTO user_languages (user_id, language_code, language_type, proficiency_level)
      SELECT user_record.id, unnest(user_record.languages_learn), 'learning', 'intermediate';
    END IF;
  END LOOP;
END $$;

-- Verify users were created
SELECT 
  email,
  full_name,
  city,
  latitude,
  longitude,
  availability_status,
  is_online,
  languages_speak,
  languages_learn,
  bio
FROM users
WHERE email LIKE '%@test.com'
ORDER BY full_name;

