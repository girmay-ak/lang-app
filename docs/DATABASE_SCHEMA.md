# Language Exchange App - Database Schema Documentation

## Overview

This database schema is designed for a production-ready language exchange application with the following key features:

- **User Management**: Profiles, authentication, privacy settings
- **Social Features**: Connections, favorites, blocks, friend requests
- **Real-time Chat**: One-on-one messaging with reactions and media
- **Gamification**: XP, levels, streaks, achievements, leaderboards
- **Location-based Discovery**: Find nearby language partners
- **Practice Tracking**: Log and track language practice sessions
- **Stories**: 24-hour expiring content
- **Notifications**: Push notifications and in-app alerts

## Database Tables

### Core User Tables

#### `users`
Main user profile table with authentication and location data.

**Key Features:**
- Location tracking with PostGIS for efficient spatial queries
- Privacy settings (show_location, show_last_seen, show_activity)
- Account status management (active, banned, deleted, suspended)
- Availability status (available, busy, offline)

**Indexes:**
- Spatial index on location for fast nearby user queries
- Index on account_status, availability_status, last_active_at

#### `languages`
Master list of all supported languages.

**Columns:**
- `code`: ISO 639-1 language code (e.g., 'en', 'es')
- `name`: English name
- `native_name`: Name in native script
- `flag_emoji`: Flag emoji for UI

#### `user_languages`
Junction table linking users to their languages with proficiency levels.

**Proficiency Levels:**
- beginner
- elementary
- intermediate
- advanced
- native

**Language Types:**
- native (languages user speaks)
- learning (languages user wants to learn)

### Social Features

#### `user_connections`
Manages all types of user relationships.

**Connection Types:**
- `favorite`: User favorited another user
- `block`: User blocked another user
- `report`: User reported another user
- `friend_request`: Pending friend request
- `friend`: Mutual friendship

**Status:**
- `active`: Connection is active
- `pending`: Awaiting response (for friend requests)
- `resolved`: Issue resolved (for reports)

### Chat & Messaging

#### `conversations`
One-on-one chat conversations between users.

**Features:**
- Unread message counts for both users
- Typing indicators
- Last read timestamps
- Last message preview

#### `messages`
Individual messages within conversations.

**Message Types:**
- `text`: Regular text message
- `voice`: Voice message with media_url
- `image`: Image message with media_url
- `system`: System-generated message

**Features:**
- Read/unread status
- Soft delete support
- Media attachment support

#### `message_reactions`
Reactions/likes on messages (emoji reactions).

### Gamification

#### `user_gamification`
Tracks user's game progress and stats.

**Metrics:**
- `level`: Current level
- `xp_points`: Total XP earned
- `current_streak`: Consecutive days active
- `longest_streak`: Best streak achieved
- `total_practice_minutes`: Total practice time
- `total_messages_sent`: Message count
- `total_connections`: Connection count

#### `achievements`
Master list of all available achievements.

**Categories:**
- social: Social interactions
- practice: Practice-related
- streak: Streak-related
- learning: Language learning milestones

#### `user_achievements`
Achievements earned by users.

#### `points_history`
Detailed log of all XP earned with reasons.

**Reference Types:**
- message
- practice_session
- achievement
- daily_challenge
- etc.

### Practice & Learning

#### `practice_sessions`
Logs of language practice sessions.

**Session Types:**
- chat
- video
- voice

**Features:**
- Duration tracking
- Partner tracking
- Language practiced
- Optional rating

#### `user_ratings`
5-star ratings between users after practice sessions.

### Stories & Content

#### `stories`
24-hour expiring posts (like Instagram Stories).

**Features:**
- Auto-expiry after 24 hours
- View count tracking
- Media support (image, video, text)

#### `story_views`
Tracks who viewed each story.

### Challenges

#### `daily_challenges`
Master list of daily challenge definitions.

**Challenge Types:**
- message_count
- practice_time
- connection_count
- etc.

#### `user_challenges`
User's progress on daily challenges.

### Notifications

#### `notifications`
In-app notification history.

**Notification Types:**
- message
- friend_request
- achievement
- challenge_completed
- etc.

#### `push_tokens`
Device tokens for push notifications.

**Device Types:**
- ios
- android
- web

### Location

#### `location_history`
Optional location tracking for analytics.

## Key Queries & Performance

### Finding Nearby Users

\`\`\`sql
SELECT * FROM find_nearby_users(
  user_lat := 40.7128,
  user_lng := -74.0060,
  radius_km := 50,
  limit_count := 20
);
\`\`\`

This function uses PostGIS spatial indexes for fast location-based queries.

### Leaderboards

**Global Leaderboard:**
\`\`\`sql
SELECT * FROM leaderboard_global LIMIT 100;
\`\`\`

**City Leaderboard:**
\`\`\`sql
SELECT * FROM leaderboard_by_city
WHERE city = 'New York'
LIMIT 100;
\`\`\`

### User's Average Rating

\`\`\`sql
SELECT get_user_average_rating('user-uuid-here');
\`\`\`

## Security (RLS Policies)

All tables have Row Level Security (RLS) enabled with appropriate policies:

- **Users can only modify their own data**
- **Users can only view non-blocked users**
- **Messages are only visible to conversation participants**
- **Stories are only visible if not expired and user not blocked**
- **Notifications are private to each user**

## Triggers & Automation

### Automatic Updates

- `updated_at` columns auto-update on row changes
- Conversation `last_message_at` updates on new messages
- Unread counts increment automatically
- Story view counts increment on views
- User `last_active_at` updates on activity

### User Creation

- Gamification record created automatically for new users

## Indexes

All tables have appropriate indexes for:
- Foreign key relationships
- Frequently queried columns
- Sorting and filtering
- Full-text search (using pg_trgm)
- Spatial queries (using PostGIS)

## Relationships Diagram

\`\`\`
users
  ├── user_languages (1:many)
  ├── user_connections (1:many)
  ├── conversations (many:many via user1_id, user2_id)
  ├── messages (1:many via sender_id)
  ├── message_reactions (1:many)
  ├── user_gamification (1:1)
  ├── user_achievements (1:many)
  ├── points_history (1:many)
  ├── practice_sessions (1:many)
  ├── user_ratings (1:many as rater and rated)
  ├── stories (1:many)
  ├── story_views (1:many)
  ├── user_challenges (1:many)
  ├── notifications (1:many)
  ├── push_tokens (1:many)
  └── location_history (1:many)

languages
  └── user_languages (1:many)

achievements
  └── user_achievements (1:many)

daily_challenges
  └── user_challenges (1:many)

conversations
  └── messages (1:many)

messages
  └── message_reactions (1:many)

stories
  └── story_views (1:many)

practice_sessions
  └── user_ratings (1:many)
\`\`\`

## Migration Guide

1. **Run the main schema script:**
   \`\`\`bash
   psql -f scripts/003_complete_database_schema.sql
   \`\`\`

2. **Optional: Clean up old tables:**
   \`\`\`bash
   psql -f scripts/004_cleanup_old_tables.sql
   \`\`\`

3. **Verify the schema:**
   - Check that all tables exist
   - Verify RLS policies are enabled
   - Test the helper functions
   - Verify seed data is loaded

## Next Steps

After running the schema:

1. **Update your application code** to use the new tables
2. **Migrate existing data** if you have any
3. **Test all queries** for performance
4. **Set up monitoring** for slow queries
5. **Configure backups** for production

## Performance Tips

- Use the `find_nearby_users()` function for location queries
- Use the leaderboard views instead of complex joins
- Index any additional columns you frequently query
- Use connection pooling (already configured with Supabase)
- Monitor slow queries and add indexes as needed
