# Rating & Review System Guide

Complete documentation for the rating and review system in the language exchange app.

## Overview

The rating system allows users to rate and review their language exchange partners after practice sessions. It includes validation, anti-abuse measures, caching, and analytics.

## Features

- 5-star rating system with optional written reviews
- Validation: minimum 10 minutes chat time required
- Anti-spam: one rating per user pair per day
- Cached statistics for performance
- Rating breakdown with percentages
- Recent reviews display
- Report inappropriate reviews
- Rating analytics and trends
- Achievement integration

## Database Tables

### `user_ratings`
Stores individual ratings between users.

### `rating_stats`
Cached aggregate statistics for each user (updated automatically).

### `rating_reports`
Reports of inappropriate reviews.

### `practice_sessions`
Tracks chat duration for rating eligibility.

## Usage Examples

### 1. Check if User Can Rate

\`\`\`typescript
import { canRateUser } from '@/lib/supabase/ratings'

const { canRate, reason } = await canRateUser(currentUserId, targetUserId)

if (!canRate) {
  alert(reason) // "Must chat for at least 10 minutes before rating"
}
\`\`\`

### 2. Add a Rating

\`\`\`typescript
import { addRating } from '@/lib/supabase/ratings'

const result = await addRating(
  currentUserId,
  targetUserId,
  5, // rating (1-5)
  'Great conversation partner!' // optional review
)

if (result.success) {
  console.log('Rating added:', result.ratingId)
} else {
  console.error(result.message)
}
\`\`\`

### 3. Display Rating Breakdown

\`\`\`typescript
import { getRatingBreakdown } from '@/lib/supabase/ratings'

const stats = await getRatingBreakdown(userId)

if (stats) {
  console.log(`Average: ${stats.average_rating} ⭐`)
  console.log(`Total: ${stats.total_ratings} reviews`)
  console.log(`5 stars: ${stats.five_stars} (${stats.five_stars_percent}%)`)
}
\`\`\`

### 4. Show Recent Reviews

\`\`\`typescript
import { getRecentReviews } from '@/lib/supabase/ratings'

const reviews = await getRecentReviews(userId, 10)

reviews.forEach(review => {
  console.log(`${review.rater_name}: ${review.rating} stars`)
  console.log(review.review)
})
\`\`\`

### 5. Track Practice Session

\`\`\`typescript
import { trackPracticeSession } from '@/lib/supabase/ratings'

// Call this when a chat session ends
await trackPracticeSession(
  conversationId,
  user1Id,
  user2Id,
  15 // duration in minutes
)
\`\`\`

### 6. Report Inappropriate Review

\`\`\`typescript
import { reportRating } from '@/lib/supabase/ratings'

const result = await reportRating(
  ratingId,
  reporterId,
  'Inappropriate language'
)
\`\`\`

### 7. Get Rating Analytics

\`\`\`typescript
import { getRatingAnalytics } from '@/lib/supabase/ratings'

const analytics = await getRatingAnalytics(userId)

if (analytics) {
  console.log(`Your average: ${analytics.user_average}`)
  console.log(`City average: ${analytics.city_average}`)
  console.log(`You're in the top ${100 - analytics.percentile}%`)
  console.log(`Trend: ${analytics.trend}`) // improving/declining/stable
}
\`\`\`

### 8. Real-time Rating Updates

\`\`\`typescript
import { subscribeToRatings } from '@/lib/supabase/ratings'

const unsubscribe = subscribeToRatings(userId, (newRating) => {
  console.log('New rating received:', newRating)
  // Update UI
})

// Clean up when component unmounts
return () => unsubscribe()
\`\`\`

## UI Component Example

\`\`\`tsx
import { useState, useEffect } from 'react'
import { getRatingBreakdown, getRecentReviews } from '@/lib/supabase/ratings'

export function UserRatings({ userId }: { userId: string }) {
  const [stats, setStats] = useState(null)
  const [reviews, setReviews] = useState([])

  useEffect(() => {
    async function loadRatings() {
      const [statsData, reviewsData] = await Promise.all([
        getRatingBreakdown(userId),
        getRecentReviews(userId, 10)
      ])
      setStats(statsData)
      setReviews(reviewsData)
    }
    loadRatings()
  }, [userId])

  if (!stats) return <div>Loading...</div>

  return (
    <div>
      <h2>{stats.average_rating} ⭐</h2>
      <p>Based on {stats.total_ratings} reviews</p>
      
      {/* Star breakdown */}
      <div>
        <div>5 stars: {stats.five_stars} ({stats.five_stars_percent}%)</div>
        <div>4 stars: {stats.four_stars} ({stats.four_stars_percent}%)</div>
        <div>3 stars: {stats.three_stars} ({stats.three_stars_percent}%)</div>
        <div>2 stars: {stats.two_stars} ({stats.two_stars_percent}%)</div>
        <div>1 star: {stats.one_star} ({stats.one_stars_percent}%)</div>
      </div>

      {/* Recent reviews */}
      <div>
        <h3>Recent Reviews</h3>
        {reviews.map(review => (
          <div key={review.rating_id}>
            <img src={review.rater_avatar || "/placeholder.svg"} alt={review.rater_name} />
            <div>
              <strong>{review.rater_name}</strong>
              <span>{review.rating} ⭐</span>
              <p>{review.review}</p>
              <small>{new Date(review.created_at).toLocaleDateString()}</small>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
\`\`\`

## Validation Rules

1. **Minimum Chat Time**: Users must chat for at least 10 minutes before rating
2. **Daily Limit**: One rating per user pair per day
3. **No Self-Rating**: Users cannot rate themselves
4. **Chat Verification**: Users must have an active conversation
5. **Review Length**: Maximum 500 characters

## Anti-Abuse Measures

- Rate limiting (one rating per day per pair)
- Chat duration verification
- Report system for inappropriate reviews
- Blocked users' reviews are hidden
- Suspicious rating patterns can be flagged

## Performance Optimization

- **Cached Statistics**: `rating_stats` table stores pre-calculated averages
- **Automatic Updates**: Triggers update cache on new ratings
- **Indexed Queries**: All common queries use indexes
- **Batch Calculations**: Analytics calculated efficiently

## Achievement Integration

The rating system integrates with the gamification system:

- **5-Star Teacher**: 50+ five-star ratings
- **Highly Rated**: Average 4.5+ with 20+ ratings  
- **Community Favorite**: Top 10% in city

These are automatically checked and awarded by the gamification system.

## SQL Functions Reference

- `can_rate_user(rater_id, rated_user_id)` - Check eligibility
- `add_rating(rater_id, rated_user_id, rating, review)` - Add new rating
- `calculate_rating_stats(user_id)` - Recalculate cached stats
- `get_rating_breakdown(user_id)` - Get star distribution
- `get_recent_reviews(user_id, limit, offset)` - Get reviews
- `report_rating(rating_id, reporter_id, reason)` - Report review
- `track_practice_session(...)` - Track chat duration
- `get_rating_analytics(user_id)` - Get analytics

## Testing

\`\`\`sql
-- Test adding a rating
SELECT * FROM add_rating(
  'user1-uuid',
  'user2-uuid',
  5,
  'Excellent teacher!'
);

-- Check if user can rate
SELECT * FROM can_rate_user('user1-uuid', 'user2-uuid');

-- Get rating breakdown
SELECT * FROM get_rating_breakdown('user2-uuid');

-- Get recent reviews
SELECT * FROM get_recent_reviews('user2-uuid', 10, 0);
\`\`\`

## Production Considerations

1. **Monitor Reports**: Regularly review `rating_reports` for abuse
2. **Cache Invalidation**: Stats are auto-updated but can be manually refreshed
3. **Backup**: Regular backups of ratings data
4. **Analytics**: Track rating trends for quality control
5. **Moderation**: Have a process for handling reported reviews

## Troubleshooting

**Issue**: User can't rate despite chatting
- Check `practice_sessions` table for duration
- Verify conversation exists in `conversations` table
- Check if already rated today

**Issue**: Stats not updating
- Trigger should auto-update, but can manually call `calculate_rating_stats(user_id)`

**Issue**: Reviews not showing
- Check RLS policies
- Verify user is not blocked

---

For more information, see the main database schema documentation.
