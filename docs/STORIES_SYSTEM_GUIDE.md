# Stories/Feed System Guide

Complete Instagram-like stories feature for the language exchange app.

## Features

### Story Posts
- **Content Types**: Text, images, voice notes
- **Language Tags**: Tag stories with languages being practiced
- **24-Hour Expiry**: Stories automatically delete after 24 hours
- **Limit**: Maximum 10 active stories per user
- **Privacy Levels**:
  - `everyone`: All users can see
  - `nearby`: Only users within discovery radius
  - `connections`: Only users you've chatted with
  - `custom`: Specific users from your privacy list

### Story Viewing
- View stories from nearby users, chat partners, and language matches
- Track who viewed each story
- Show view count to story creator
- Stories sorted by: unviewed → distance → recency

### Story Interactions
- **Reactions**: like, love, celebrate, laugh, wow, sad
- **Replies**: React to stories (can start a chat)
- **Reports**: Report inappropriate content

### Story Rings
Visual indicators around profile pictures:
- **New stories** (not viewed): Gradient ring
- **Viewed stories**: Gray ring
- **Your own stories**: Special color

## Database Schema

### Tables

#### stories
\`\`\`sql
- id: UUID (primary key)
- user_id: UUID (references users)
- content: TEXT
- media_url: TEXT (image/voice URL)
- voice_duration: INTEGER (seconds)
- story_type: TEXT (text/image/voice)
- language_tags: TEXT[]
- privacy_level: TEXT (everyone/nearby/connections/custom)
- created_at: TIMESTAMPTZ
- expires_at: TIMESTAMPTZ (created_at + 24 hours)
- view_count: INTEGER
\`\`\`

#### story_views
\`\`\`sql
- id: UUID (primary key)
- story_id: UUID (references stories)
- viewer_id: UUID (references users)
- viewed_at: TIMESTAMPTZ
- UNIQUE(story_id, viewer_id)
\`\`\`

#### story_reactions
\`\`\`sql
- id: UUID (primary key)
- story_id: UUID (references stories)
- user_id: UUID (references users)
- reaction_type: TEXT (like/love/celebrate/laugh/wow/sad)
- created_at: TIMESTAMPTZ
- UNIQUE(story_id, user_id)
\`\`\`

#### story_privacy_lists
\`\`\`sql
- id: UUID (primary key)
- user_id: UUID (story creator)
- allowed_user_id: UUID (user who can view)
- created_at: TIMESTAMPTZ
- UNIQUE(user_id, allowed_user_id)
\`\`\`

## SQL Functions

### create_story()
Create a new story with validation (max 10 stories).

\`\`\`sql
SELECT create_story(
  p_user_id := 'user-uuid',
  p_content := 'Learning Spanish today!',
  p_media_url := 'https://...',
  p_story_type := 'image',
  p_language_tags := ARRAY['Spanish', 'English'],
  p_privacy_level := 'nearby'
);
\`\`\`

### get_nearby_stories()
Get stories from nearby users with proper filtering and sorting.

\`\`\`sql
SELECT * FROM get_nearby_stories(
  p_user_id := 'viewer-uuid',
  p_limit := 50
);
\`\`\`

Returns stories sorted by:
1. Own stories first
2. Unviewed stories
3. Distance (closest first)
4. Recency

### get_story_ring_status()
Get story ring status for multiple users.

\`\`\`sql
SELECT * FROM get_story_ring_status(
  p_viewer_id := 'viewer-uuid',
  p_user_ids := ARRAY['user1-uuid', 'user2-uuid']
);
\`\`\`

Returns:
- `has_stories`: User has active stories
- `has_unviewed_stories`: User has stories you haven't seen
- `is_own_stories`: These are your own stories
- `story_count`: Number of active stories
- `latest_story_at`: Timestamp of most recent story

### get_users_with_story_status()
Get users sorted by story status and distance.

\`\`\`sql
SELECT * FROM get_users_with_story_status(
  p_viewer_id := 'viewer-uuid',
  p_limit := 50
);
\`\`\`

Sorting priority:
1. Users with unviewed stories
2. Distance (closest first)
3. Recent activity

### mark_story_viewed()
Mark a story as viewed (with privacy checks).

\`\`\`sql
SELECT mark_story_viewed(
  p_story_id := 'story-uuid',
  p_viewer_id := 'viewer-uuid'
);
\`\`\`

### has_viewed_story()
Check if user has viewed a story.

\`\`\`sql
SELECT has_viewed_story(
  p_story_id := 'story-uuid',
  p_viewer_id := 'viewer-uuid'
);
\`\`\`

### can_view_story()
Check if user can view a story based on privacy settings.

\`\`\`sql
SELECT can_view_story(
  p_story_id := 'story-uuid',
  p_viewer_id := 'viewer-uuid'
);
\`\`\`

### cleanup_expired_stories()
Delete expired stories (run via cron job).

\`\`\`sql
SELECT cleanup_expired_stories();
\`\`\`

## TypeScript Usage

### Create a Story

\`\`\`typescript
import { createStory } from '@/lib/supabase/stories'

const storyId = await createStory({
  content: 'Practicing Spanish at the café!',
  mediaUrl: 'https://...',
  storyType: 'image',
  languageTags: ['Spanish', 'English'],
  privacyLevel: 'nearby'
})
\`\`\`

### Get Nearby Stories

\`\`\`typescript
import { getNearbyStories } from '@/lib/supabase/stories'

const stories = await getNearbyStories(50)

stories.forEach(story => {
  console.log(story.full_name, story.has_viewed, story.distance_km)
})
\`\`\`

### Mark Story as Viewed

\`\`\`typescript
import { markStoryViewed } from '@/lib/supabase/stories'

await markStoryViewed(storyId)
\`\`\`

### Add Reaction

\`\`\`typescript
import { addStoryReaction } from '@/lib/supabase/stories'

await addStoryReaction(storyId, 'love')
\`\`\`

### Get Story Ring Status

\`\`\`typescript
import { getStoryRingStatus } from '@/lib/supabase/stories'

const userIds = ['user1-uuid', 'user2-uuid']
const ringStatuses = await getStoryRingStatus(userIds)

ringStatuses.forEach(status => {
  if (status.has_unviewed_stories) {
    // Show gradient ring
  } else if (status.has_stories) {
    // Show gray ring
  }
})
\`\`\`

### Get Users with Story Status

\`\`\`typescript
import { getUsersWithStoryStatus } from '@/lib/supabase/stories'

const users = await getUsersWithStoryStatus(50)

// Users are already sorted by:
// 1. Has unviewed stories
// 2. Distance
// 3. Recent activity
\`\`\`

### Real-time Subscriptions

\`\`\`typescript
import { subscribeToNearbyStories, subscribeToStoryViews } from '@/lib/supabase/stories'

// Subscribe to new stories
const channel = subscribeToNearbyStories((story) => {
  console.log('New story:', story)
})

// Subscribe to views on your story
const viewsChannel = subscribeToStoryViews(storyId, (view) => {
  console.log('New view:', view.viewer_name)
})

// Cleanup
channel.unsubscribe()
viewsChannel.unsubscribe()
\`\`\`

## Setup Instructions

### 1. Run SQL Script

\`\`\`bash
# In Supabase SQL Editor
# Run: scripts/010_stories_feed_system.sql
\`\`\`

### 2. Set Up Cron Job

In Supabase Dashboard → Database → Cron Jobs:

\`\`\`sql
SELECT cron.schedule(
  'cleanup-expired-stories',
  '0 * * * *', -- Every hour
  'SELECT cleanup_expired_stories()'
);
\`\`\`

### 3. Enable Realtime

In Supabase Dashboard → Database → Replication:
- Enable realtime for `stories` table
- Enable realtime for `story_views` table
- Enable realtime for `story_reactions` table

### 4. Set Up File Storage

For images and voice notes, set up Supabase Storage:

\`\`\`typescript
// Upload story image
const { data, error } = await supabase.storage
  .from('stories')
  .upload(`${userId}/${Date.now()}.jpg`, file)

// Get public URL
const { data: { publicUrl } } = supabase.storage
  .from('stories')
  .getPublicUrl(data.path)

// Use publicUrl as media_url when creating story
\`\`\`

## UI Implementation Tips

### Story Ring Component

\`\`\`typescript
function StoryRing({ userId, ringStatus }) {
  const getRingColor = () => {
    if (ringStatus.is_own_stories) return 'ring-purple-500'
    if (ringStatus.has_unviewed_stories) return 'ring-gradient'
    if (ringStatus.has_stories) return 'ring-gray-400'
    return 'ring-transparent'
  }
  
  return (
    <div className={`ring-2 ${getRingColor()} rounded-full p-1`}>
      <Avatar src={avatarUrl} />
    </div>
  )
}
\`\`\`

### Story Viewer

\`\`\`typescript
function StoryViewer({ stories }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const currentStory = stories[currentIndex]
  
  useEffect(() => {
    // Mark as viewed
    markStoryViewed(currentStory.id)
    
    // Auto-advance after 5 seconds
    const timer = setTimeout(() => {
      if (currentIndex < stories.length - 1) {
        setCurrentIndex(currentIndex + 1)
      }
    }, 5000)
    
    return () => clearTimeout(timer)
  }, [currentIndex])
  
  return (
    <div className="story-viewer">
      {/* Story content */}
      {/* Progress bars */}
      {/* Reactions */}
    </div>
  )
}
\`\`\`

## Performance Optimization

### Indexes
All necessary indexes are created automatically:
- `idx_stories_user_expires`: Fast user story lookup
- `idx_stories_language_tags`: Fast language filtering
- `idx_story_views_composite`: Fast view checks
- Spatial index on `location_point`: Fast distance queries

### Caching
Consider caching:
- Story ring status (5 minutes)
- Nearby stories list (1 minute)
- Story view counts (real-time via subscription)

## Privacy & Security

### RLS Policies
- Users can only view stories based on privacy settings
- Users can only create/delete their own stories
- Blocked users cannot see each other's stories
- Story views are only visible to story creator

### Validation
- Maximum 10 active stories per user
- Stories expire after 24 hours
- One reaction per user per story
- Privacy level validation

## Testing Checklist

- [ ] Create story with different types (text/image/voice)
- [ ] Test privacy levels (everyone/nearby/connections/custom)
- [ ] Verify 24-hour expiry
- [ ] Test story ring colors (new/viewed/own)
- [ ] Test reactions and replies
- [ ] Verify view tracking
- [ ] Test blocked user privacy
- [ ] Verify cleanup cron job
- [ ] Test real-time subscriptions
- [ ] Test maximum 10 stories limit

## Troubleshooting

### Stories not appearing
- Check privacy settings
- Verify user is within discovery radius
- Check if users are blocked
- Ensure story hasn't expired

### Story ring not updating
- Check real-time subscription
- Verify view was recorded
- Clear cache if using caching

### Performance issues
- Check indexes are created
- Monitor query execution time
- Consider pagination for large result sets
- Use caching for frequently accessed data
