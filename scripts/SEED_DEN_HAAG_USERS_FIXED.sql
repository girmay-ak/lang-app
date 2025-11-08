-- Seed Test Users in Den Haag (The Hague) - FIXED VERSION
-- This script creates auth users first, then updates the users table
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

-- Function to create test user with auth and profile
CREATE OR REPLACE FUNCTION create_test_user_with_auth(
  p_email TEXT,
  p_full_name TEXT,
  p_bio TEXT,
  p_latitude DOUBLE PRECISION,
  p_longitude DOUBLE PRECISION,
  p_city TEXT DEFAULT 'Den Haag',
  p_availability_status TEXT DEFAULT 'available',
  p_is_online BOOLEAN DEFAULT true,
  p_languages_speak TEXT[] DEFAULT ARRAY[]::TEXT[],
  p_languages_learn TEXT[] DEFAULT ARRAY[]::TEXT[],
  p_password TEXT DEFAULT 'TestUser123!'
) RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
  v_auth_user_id UUID;
BEGIN
  -- Check if auth user already exists
  SELECT id INTO v_auth_user_id FROM auth.users WHERE email = p_email;
  
  -- If user doesn't exist, create new auth user
  IF v_auth_user_id IS NULL THEN
    v_auth_user_id := gen_random_uuid();
    
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      recovery_sent_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    )
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_auth_user_id,
      'authenticated',
      'authenticated',
      p_email,
      crypt(p_password, gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      jsonb_build_object('full_name', p_full_name),
      NOW(),
      NOW(),
      '',
      '',
      '',
      ''
    );
  END IF;

  -- Now insert/update the public.users profile
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
    v_auth_user_id,
    p_email,
    p_full_name,
    p_bio,
    p_latitude,
    p_longitude,
    ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography,
    p_city,
    p_availability_status,
    p_is_online,
    p_languages_speak,
    p_languages_learn,
    NOW(),
    NOW(),
    true,
    'active',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    bio = EXCLUDED.bio,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    location_point = EXCLUDED.location_point,
    city = EXCLUDED.city,
    availability_status = EXCLUDED.availability_status,
    is_online = EXCLUDED.is_online,
    languages_speak = EXCLUDED.languages_speak,
    languages_learn = EXCLUDED.languages_learn,
    last_active_at = NOW(),
    location_updated_at = NOW(),
    updated_at = NOW()
  RETURNING id INTO v_user_id;
  
  -- If insert failed (user already exists), get the ID
  IF v_user_id IS NULL THEN
    SELECT id INTO v_user_id FROM users WHERE id = v_auth_user_id;
  END IF;

  -- Add languages to user_languages table
  DELETE FROM user_languages WHERE user_id = v_user_id;

  -- Insert native languages
  IF array_length(p_languages_speak, 1) > 0 THEN
    INSERT INTO user_languages (user_id, language_code, language_type, proficiency_level)
    SELECT v_user_id, unnest(p_languages_speak), 'native', 'native'
    ON CONFLICT (user_id, language_code, language_type) DO NOTHING;
  END IF;

  -- Insert learning languages
  IF array_length(p_languages_learn, 1) > 0 THEN
    INSERT INTO user_languages (user_id, language_code, language_type, proficiency_level)
    SELECT v_user_id, unnest(p_languages_learn), 'learning', 'intermediate'
    ON CONFLICT (user_id, language_code, language_type) DO NOTHING;
  END IF;

  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create 10 test users in different areas of Den Haag

-- 1. Emma - English speaker learning Dutch (City Center)
SELECT create_test_user_with_auth(
  'emma.english@test.com',
  'Emma',
  'British expat living in Den Haag. Love practicing Dutch over coffee! 🇬🇧🇳🇱',
  52.0795,
  4.3107,
  'Den Haag',
  'available',
  true,
  ARRAY['en']::TEXT[],
  ARRAY['nl']::TEXT[]
);

-- 2. Marco - Italian speaker learning Dutch (Scheveningen Beach)
SELECT create_test_user_with_auth(
  'marco.italian@test.com',
  'Marco',
  'Italian chef learning Dutch. Regular at Dutch Language Café! 🇮🇹🇳🇱',
  52.1085,
  4.2833,
  'Scheveningen',
  'available',
  true,
  ARRAY['it']::TEXT[],
  ARRAY['nl', 'en']::TEXT[]
);

-- 3. Sophie - French speaker learning Dutch (Bezuidenhout)
SELECT create_test_user_with_auth(
  'sophie.french@test.com',
  'Sophie',
  'French teacher helping with French, learning Dutch. Intermediate level! 🇫🇷🇳🇱',
  52.0885,
  4.3483,
  'Bezuidenhout',
  'available',
  true,
  ARRAY['fr']::TEXT[],
  ARRAY['nl', 'en']::TEXT[]
);

-- 4. Carlos - Spanish speaker learning Dutch (Laak)
SELECT create_test_user_with_auth(
  'carlos.spanish@test.com',
  'Carlos',
  'Spanish speaker learning Dutch at Dutch Language Café. Member since 2024! 🇪🇸🇳🇱',
  52.0525,
  4.3183,
  'Laak',
  'available',
  true,
  ARRAY['es']::TEXT[],
  ARRAY['nl', 'en']::TEXT[]
);

-- 5. Anna - German speaker learning Dutch (Escamp)
SELECT create_test_user_with_auth(
  'anna.german@test.com',
  'Anna',
  'German native teaching German, learning Dutch. Love language exchange! 🇩🇪🇳🇱',
  52.0525,
  4.2833,
  'Escamp',
  'available',
  true,
  ARRAY['de']::TEXT[],
  ARRAY['nl', 'en']::TEXT[]
);

-- 6. Yuki - Japanese speaker learning English (Centrum)
SELECT create_test_user_with_auth(
  'yuki.japanese@test.com',
  'Yuki',
  'Japanese speaker learning English and Dutch. Beginner level! 🇯🇵🇳🇱',
  52.0705,
  4.3007,
  'Den Haag Centrum',
  'available',
  true,
  ARRAY['ja']::TEXT[],
  ARRAY['en', 'nl']::TEXT[]
);

-- 7. Ahmed - Arabic speaker learning Dutch (Segbroek)
SELECT create_test_user_with_auth(
  'ahmed.arabic@test.com',
  'Ahmed',
  'Arabic speaker teaching Arabic, learning Dutch. Practice makes perfect! 🇸🇦🇳🇱',
  52.0705,
  4.2583,
  'Segbroek',
  'available',
  true,
  ARRAY['ar']::TEXT[],
  ARRAY['nl', 'en']::TEXT[]
);

-- 8. Lisa - Dutch native helping others (Loosduinen)
SELECT create_test_user_with_auth(
  'lisa.dutch@test.com',
  'Lisa',
  'Dutch native helping others learn Dutch. Volunteer at Dutch Language Café! 🇳🇱🇫🇷',
  52.0525,
  4.2583,
  'Loosduinen',
  'available',
  true,
  ARRAY['nl']::TEXT[],
  ARRAY['fr', 'es']::TEXT[]
);

-- 9. Maria - Portuguese speaker learning Dutch (Ypenburg)
SELECT create_test_user_with_auth(
  'maria.portuguese@test.com',
  'Maria',
  'Portuguese speaker learning Dutch. Pre-intermediate level! 🇵🇹🇳🇱',
  52.0425,
  4.3700,
  'Ypenburg',
  'available',
  true,
  ARRAY['pt']::TEXT[],
  ARRAY['nl', 'en']::TEXT[]
);

-- 10. Emma S. - Swedish speaker learning Spanish (Kijkduin)
SELECT create_test_user_with_auth(
  'emma.swedish@test.com',
  'Emma S.',
  'Swedish speaker teaching Swedish, learning Spanish. Intermediate level! 🇸🇪🇪🇸',
  52.0625,
  4.2200,
  'Kijkduin',
  'available',
  true,
  ARRAY['sv']::TEXT[],
  ARRAY['es', 'nl']::TEXT[]
);

-- Verify users were created
SELECT 
  u.id,
  u.email,
  u.full_name,
  u.city,
  u.latitude,
  u.longitude,
  u.availability_status,
  u.is_online,
  u.languages_speak,
  u.languages_learn,
  u.bio,
  CASE WHEN au.id IS NOT NULL THEN 'Auth user exists' ELSE 'No auth user' END as auth_status
FROM users u
LEFT JOIN auth.users au ON u.id = au.id
WHERE u.email LIKE '%@test.com'
ORDER BY u.full_name;

-- Show user languages
SELECT 
  u.full_name,
  u.email,
  ul.language_code,
  ul.language_type,
  ul.proficiency_level,
  l.name as language_name,
  l.flag_emoji
FROM users u
JOIN user_languages ul ON u.id = ul.user_id
JOIN languages l ON ul.language_code = l.code
WHERE u.email LIKE '%@test.com'
ORDER BY u.full_name, ul.language_type, ul.language_code;

