# 📋 Backend Setup TODO List - Supabase Database

## 🎯 Complete Backend Setup Checklist

This document lists all backend tasks needed to make the Language Exchange app fully functional with Supabase.

---

## ✅ **PHASE 1: Database Setup & Schema**

### 1.1 Core Tables
- [ ] **Create `users` table** (if not exists)
  - [ ] Add columns: `full_name`, `email`, `avatar_url`, `bio`, `city`
  - [ ] Add location columns: `latitude`, `longitude`, `location_point` (PostGIS)
  - [ ] Add status columns: `account_status`, `availability_status`, `is_online`
  - [ ] Add privacy columns: `show_location`, `show_last_seen`, `show_activity`
  - [ ] Add timestamps: `last_active_at`, `location_updated_at`, `created_at`, `updated_at`
  - [ ] Add indexes: spatial index on `location_point`, index on `account_status`, `availability_status`

- [ ] **Create `languages` table**
  - [ ] Columns: `id`, `code` (ISO 639-1), `name`, `native_name`, `flag_emoji`, `is_active`
  - [ ] Add unique index on `code`
  - [ ] Seed with common languages (English, Spanish, French, German, Italian, etc.)

- [ ] **Create `user_languages` table**
  - [ ] Columns: `id`, `user_id`, `language_code`, `language_type` (native/learning), `proficiency_level`
  - [ ] Foreign keys to `users` and `languages`
  - [ ] Unique constraint on `(user_id, language_code, language_type)`

### 1.2 Chat & Messaging Tables
- [ ] **Create `conversations` table**
  - [ ] Columns: `id`, `user1_id`, `user2_id`, `created_at`, `updated_at`
  - [ ] Add columns: `unread_count_user1`, `unread_count_user2`
  - [ ] Add columns: `user1_typing`, `user2_typing`
  - [ ] Add columns: `user1_last_read_at`, `user2_last_read_at`
  - [ ] Foreign keys to `users` table
  - [ ] Unique constraint on `(user1_id, user2_id)`

- [ ] **Create `messages` table**
  - [ ] Columns: `id`, `conversation_id`, `sender_id`, `content`, `created_at`
  - [ ] Add columns: `message_type` (text/voice/image/system), `media_url`, `voice_duration`
  - [ ] Add columns: `is_read`, `is_deleted`, `deleted_at`, `reply_to_id`
  - [ ] Foreign keys to `conversations` and `users`
  - [ ] Index on `conversation_id`, `created_at`

- [ ] **Create `message_reactions` table** (optional)
  - [ ] Columns: `id`, `message_id`, `user_id`, `reaction_type`, `created_at`
  - [ ] Foreign keys to `messages` and `users`

### 1.3 Social Features Tables
- [ ] **Create `user_connections` table**
  - [ ] Columns: `id`, `user_id`, `connected_user_id`, `connection_type` (favorite/block/report/friend_request/friend)
  - [ ] Columns: `status` (pending/accepted/rejected), `created_at`, `updated_at`
  - [ ] Foreign keys to `users` table
  - [ ] Unique constraint on `(user_id, connected_user_id, connection_type)`

### 1.4 Notifications Table
- [ ] **Create `notifications` table**
  - [ ] Columns: `id`, `user_id`, `type` (message/friend_request/like/comment/achievement)
  - [ ] Columns: `title`, `message`, `data` (JSON), `is_read`, `created_at`
  - [ ] Foreign key to `users`
  - [ ] Index on `user_id`, `is_read`, `created_at`

### 1.5 Gamification Tables (Optional)
- [ ] **Create `user_gamification` table**
  - [ ] Columns: `id`, `user_id`, `xp_points`, `level`, `streak_count`, `total_sessions`
  - [ ] Foreign key to `users`

- [ ] **Create `achievements` table**
  - [ ] Columns: `id`, `code`, `name`, `description`, `icon`, `xp_reward`

- [ ] **Create `user_achievements` table**
  - [ ] Columns: `id`, `user_id`, `achievement_id`, `unlocked_at`
  - [ ] Foreign keys to `users` and `achievements`

### 1.6 Practice Sessions Table (Optional)
- [ ] **Create `practice_sessions` table**
  - [ ] Columns: `id`, `user1_id`, `user2_id`, `language_practiced`, `duration_minutes`, `rating`, `created_at`
  - [ ] Foreign keys to `users`

---

## ✅ **PHASE 2: PostGIS & Location Functions**

### 2.1 Enable PostGIS Extension
- [ ] **Enable PostGIS extension in Supabase**
  - [ ] Go to Database → Extensions
  - [ ] Enable "postgis" extension
  - [ ] Or run SQL: `CREATE EXTENSION IF NOT EXISTS postgis;`

### 2.2 Location Functions
- [ ] **Create `find_nearby_users()` RPC function**
  ```sql
  CREATE OR REPLACE FUNCTION find_nearby_users(
    user_lat DOUBLE PRECISION,
    user_lng DOUBLE PRECISION,
    radius_km DOUBLE PRECISION DEFAULT 50
  )
  RETURNS TABLE (
    id UUID,
    full_name TEXT,
    avatar_url TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    distance_km DOUBLE PRECISION,
    availability_status TEXT
  )
  ```
  - [ ] Uses `ST_DWithin` for spatial queries
  - [ ] Calculates distance in kilometers
  - [ ] Filters by `account_status = 'active'`
  - [ ] Respects privacy settings (`show_location = true`)

- [ ] **Create `update_user_location()` function**
  - [ ] Updates user location and `location_point`
  - [ ] Updates `location_updated_at` timestamp

---

## ✅ **PHASE 3: Row Level Security (RLS) Policies**

### 3.1 Users Table Policies
- [ ] **Enable RLS on `users` table**
- [ ] **Policy: Users can view own profile**
  ```sql
  CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);
  ```
- [ ] **Policy: Users can view nearby active users**
  ```sql
  CREATE POLICY "Users can view nearby active users"
  ON users FOR SELECT
  USING (
    account_status = 'active' AND
    show_location = true AND
    id != auth.uid()
  );
  ```
- [ ] **Policy: Users can update own profile**
  ```sql
  CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);
  ```

### 3.2 Conversations Table Policies
- [ ] **Enable RLS on `conversations` table**
- [ ] **Policy: Users can view own conversations**
  ```sql
  CREATE POLICY "Users can view own conversations"
  ON conversations FOR SELECT
  USING (
    auth.uid() = user1_id OR
    auth.uid() = user2_id
  );
  ```
- [ ] **Policy: Users can create conversations**
  ```sql
  CREATE POLICY "Users can create conversations"
  ON conversations FOR INSERT
  WITH CHECK (auth.uid() = user1_id);
  ```

### 3.3 Messages Table Policies
- [ ] **Enable RLS on `messages` table**
- [ ] **Policy: Users can view messages in their conversations**
  ```sql
  CREATE POLICY "Users can view own messages"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (conversations.user1_id = auth.uid() OR conversations.user2_id = auth.uid())
    )
  );
  ```
- [ ] **Policy: Users can send messages in their conversations**
  ```sql
  CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (conversations.user1_id = auth.uid() OR conversations.user2_id = auth.uid())
    )
  );
  ```

### 3.4 User Connections Table Policies
- [ ] **Enable RLS on `user_connections` table**
- [ ] **Policy: Users can view own connections**
  ```sql
  CREATE POLICY "Users can view own connections"
  ON user_connections FOR SELECT
  USING (auth.uid() = user_id);
  ```
- [ ] **Policy: Users can create connections**
  ```sql
  CREATE POLICY "Users can create connections"
  ON user_connections FOR INSERT
  WITH CHECK (auth.uid() = user_id);
  ```

### 3.5 Notifications Table Policies
- [ ] **Enable RLS on `notifications` table**
- [ ] **Policy: Users can view own notifications**
  ```sql
  CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);
  ```
- [ ] **Policy: Users can update own notifications**
  ```sql
  CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);
  ```

---

## ✅ **PHASE 4: Supabase Realtime Setup**

### 4.1 Enable Realtime on Tables
- [ ] **Enable Realtime on `messages` table**
  - [ ] Go to Database → Replication
  - [ ] Enable replication for `messages` table
  - [ ] Or run SQL: `ALTER PUBLICATION supabase_realtime ADD TABLE messages;`

- [ ] **Enable Realtime on `conversations` table**
  - [ ] Enable replication for `conversations` table

- [ ] **Enable Realtime on `users` table** (for status updates)
  - [ ] Enable replication for `users` table (only `is_online`, `availability_status` columns)

- [ ] **Enable Realtime on `notifications` table**
  - [ ] Enable replication for `notifications` table

### 4.2 Realtime Filters (Optional)
- [ ] **Configure Realtime filters for privacy**
  - [ ] Users only receive real-time updates for their own conversations
  - [ ] Users only receive notifications for themselves

---

## ✅ **PHASE 5: Supabase Storage Setup**

### 5.1 Create Storage Buckets
- [ ] **Create `avatars` bucket**
  - [ ] Go to Storage → Create bucket
  - [ ] Name: `avatars`
  - [ ] Public: Yes (for public URLs)
  - [ ] File size limit: 5MB
  - [ ] Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`

- [ ] **Create `chat-images` bucket**
  - [ ] Name: `chat-images`
  - [ ] Public: Yes
  - [ ] File size limit: 10MB
  - [ ] Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`

- [ ] **Create `voice-messages` bucket**
  - [ ] Name: `voice-messages`
  - [ ] Public: Yes
  - [ ] File size limit: 25MB
  - [ ] Allowed MIME types: `audio/m4a`, `audio/mp3`, `audio/wav`

### 5.2 Storage Policies
- [ ] **Avatar bucket policies**
  - [ ] Policy: Users can upload own avatar
    ```sql
    CREATE POLICY "Users can upload own avatar"
    ON storage.objects FOR INSERT
    WITH CHECK (
      bucket_id = 'avatars' AND
      auth.uid()::text = (storage.foldername(name))[1]
    );
    ```
  - [ ] Policy: Anyone can read avatars
    ```sql
    CREATE POLICY "Anyone can read avatars"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'avatars');
    ```

- [ ] **Chat images bucket policies**
  - [ ] Policy: Users can upload to conversations they're part of
  - [ ] Policy: Users can read images from their conversations

- [ ] **Voice messages bucket policies**
  - [ ] Policy: Users can upload to conversations they're part of
  - [ ] Policy: Users can read voice messages from their conversations

---

## ✅ **PHASE 6: Database Functions & Triggers**

### 6.1 Helper Functions
- [ ] **Create `update_user_online_status()` function**
  - [ ] Updates `is_online` and `last_active_at` when user logs in/out

- [ ] **Create `mark_conversation_as_read()` function**
  - [ ] Marks messages as read for a conversation
  - [ ] Updates `user1_last_read_at` or `user2_last_read_at`

- [ ] **Create `get_unread_count()` function**
  - [ ] Calculates unread message count for a user

### 6.2 Triggers
- [ ] **Create trigger: Auto-update `conversations.updated_at`**
  - [ ] When a new message is inserted, update conversation `updated_at`

- [ ] **Create trigger: Auto-create notification on new message**
  - [ ] When a message is inserted, create a notification for the recipient

- [ ] **Create trigger: Auto-expire availability**
  - [ ] Check and expire availability status after duration

---

## ✅ **PHASE 7: Seed Data (Optional)**

### 7.1 Seed Languages
- [ ] **Insert common languages into `languages` table**
  - [ ] English (en), Spanish (es), French (fr), German (de), Italian (it)
  - [ ] Portuguese (pt), Dutch (nl), Japanese (ja), Chinese (zh), Arabic (ar)
  - [ ] Include flag emojis and native names

### 7.2 Test Data (Development Only)
- [ ] **Create test users** (for development/testing)
  - [ ] 5-10 test users with different locations
  - [ ] Add languages to each user
  - [ ] Set some as available

---

## ✅ **PHASE 8: Environment Variables**

### 8.1 Supabase Configuration
- [ ] **Get Supabase URL**
  - [ ] Go to Project Settings → API
  - [ ] Copy "Project URL"

- [ ] **Get Supabase Anon Key**
  - [ ] Copy "anon/public" key from Project Settings → API

- [ ] **Add to mobile app**
  - [ ] Update `app.json` with `supabaseUrl` and `supabaseAnonKey` in `extra` section
  - [ ] Or create `.env` file with `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`

---

## ✅ **PHASE 9: Testing & Verification**

### 9.1 Test Database Queries
- [ ] **Test user creation**
  - [ ] Sign up a new user
  - [ ] Verify user is created in `users` table

- [ ] **Test location queries**
  - [ ] Update user location
  - [ ] Test `find_nearby_users()` function
  - [ ] Verify PostGIS spatial queries work

- [ ] **Test chat functionality**
  - [ ] Create a conversation
  - [ ] Send messages
  - [ ] Verify real-time updates work

### 9.2 Test RLS Policies
- [ ] **Test user can only see own profile**
- [ ] **Test user can only see own conversations**
- [ ] **Test user can only see own notifications**

### 9.3 Test Storage
- [ ] **Upload avatar image**
- [ ] **Verify public URL works**
- [ ] **Test chat image upload**

### 9.4 Test Real-time
- [ ] **Test message real-time updates**
- [ ] **Test user status real-time updates**
- [ ] **Test notification real-time updates**

---

## ✅ **PHASE 10: Performance Optimization**

### 10.1 Indexes
- [ ] **Verify all indexes are created**
  - [ ] Spatial index on `users.location_point`
  - [ ] Index on `messages.conversation_id`
  - [ ] Index on `notifications.user_id`
  - [ ] Index on `conversations.user1_id` and `user2_id`

### 10.2 Query Optimization
- [ ] **Test query performance**
  - [ ] Nearby users query should be < 100ms
  - [ ] Messages query should be < 50ms
  - [ ] Use EXPLAIN ANALYZE to optimize slow queries

---

## 📝 **Quick Setup Script Order**

If using SQL scripts, run in this order:

1. [ ] `scripts/003_complete_database_schema.sql` - Core tables
2. [ ] `scripts/006_postgis_location_discovery.sql` - Location functions
3. [ ] `scripts/005_realtime_chat_system.sql` - Chat system
4. [ ] Enable Realtime in Supabase Dashboard
5. [ ] Create Storage buckets
6. [ ] Set up RLS policies (if not in scripts)
7. [ ] Seed languages data
8. [ ] Test all functionality

---

## 🎯 **Priority Order**

### **Must Have (Core Features)**
1. ✅ Users table with location
2. ✅ Languages tables
3. ✅ Conversations & Messages tables
4. ✅ RLS policies
5. ✅ PostGIS location function
6. ✅ Realtime enabled
7. ✅ Storage buckets

### **Nice to Have (Advanced Features)**
8. ✅ Notifications table
9. ✅ User connections table
10. ✅ Gamification tables
11. ✅ Practice sessions table

---

## 📚 **Resources**

- **Supabase Dashboard**: https://app.supabase.com
- **PostGIS Documentation**: https://postgis.net/documentation/
- **Supabase Realtime**: https://supabase.com/docs/guides/realtime
- **Supabase Storage**: https://supabase.com/docs/guides/storage
- **RLS Policies Guide**: https://supabase.com/docs/guides/auth/row-level-security

---

## ✅ **Completion Checklist**

- [ ] All tables created
- [ ] All RLS policies enabled
- [ ] PostGIS extension enabled
- [ ] Location functions working
- [ ] Realtime enabled on key tables
- [ ] Storage buckets created
- [ ] Storage policies set
- [ ] Environment variables configured
- [ ] All features tested
- [ ] Performance optimized

---

**Once all items are checked, your backend will be fully ready for the mobile app!** 🚀

