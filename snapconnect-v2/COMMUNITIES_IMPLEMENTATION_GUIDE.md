# Communities Implementation Guide

## Overview
This guide covers the implementation of the communities feature in SnapConnect V2, which provides team-specific and league-wide chat communities with 1-hour message expiration.

## Features Implemented

### 🏟️ Community Types
1. **Team Communities**: One community per professional team (124 total across NFL, NBA, MLB, NHL)
2. **League Communities**: Four league-wide discussions (NFL, NBA, MLB, NHL)

### ⏰ Message Expiration
- **Community messages**: Expire after exactly 1 hour from creation time
- **Different from private/group chats**: Private chats use view-based expiration, communities use time-based expiration
- **Automatic cleanup**: Messages are filtered out both in the database and client-side

### 🔐 Access Control
- **Team communities**: Only available to users who have that team in their `favorite_teams`
- **League communities**: Only available to users who have that league in their `preferred_leagues`
- **Automatic membership**: Users are automatically joined when they update their sports preferences

## Database Schema

### Tables Created
```sql
-- Communities table
public.communities (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  type 'team' | 'league',
  team_id UUID (references teams),
  league 'NFL' | 'NBA' | 'MLB' | 'NHL',
  emoji TEXT,
  member_count INTEGER,
  is_active BOOLEAN
)

-- Community memberships
public.community_memberships (
  id UUID PRIMARY KEY,
  community_id UUID,
  user_id UUID,
  role 'admin' | 'moderator' | 'member',
  joined_at TIMESTAMP,
  last_read_at TIMESTAMP
)

-- Community messages (separate from regular messages)
public.community_messages (
  id UUID PRIMARY KEY,
  community_id UUID,
  sender_id UUID,
  content TEXT,
  media_url TEXT,
  media_type 'text' | 'photo' | 'video' | 'story_share',
  expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '1 hour'),
  created_at TIMESTAMP
)

-- Community message reactions
public.community_message_reactions (
  id UUID PRIMARY KEY,
  message_id UUID,
  user_id UUID,
  emoji TEXT
)
```

### Row Level Security (RLS)
- **Communities**: Users can only see communities for teams/leagues they follow
- **Memberships**: Users can only manage their own memberships
- **Messages**: Users can only see messages in communities they're members of, and only non-expired messages
- **Reactions**: Users can only manage their own reactions

## Code Architecture

### Services
- `communitiesService.ts`: Main service for community operations
  - `getUserCommunities()`: Get communities user is a member of
  - `getAvailableCommunities()`: Get communities user can join
  - `joinCommunity()`: Join a community
  - `getCommunityMessages()`: Get messages with expiration filtering
  - `sendCommunityMessage()`: Send message with 1-hour expiration
  - `subscribeToMessages()`: Real-time message subscription

### Components
- `CommunitiesScreen.tsx`: Main communities listing screen
  - Tabs: My Communities, Live Now, Discover
  - Real communities integration
  - Join/leave functionality
  
- `CommunityChatScreen.tsx`: Individual community chat
  - 1-hour expiration indicators
  - Real-time messaging
  - Message reactions
  - Auto-cleanup of expired messages

### Navigation
- Added to `MessagesStackParamList` in `MainNavigator.tsx`
- Accessible from Messages screen Communities tab
- Deep linking support for community chats

## Database Migration

### Apply Migration
```bash
# The migration file is created at:
snapconnect-v2/database/communities_migration.sql

# To apply in your Supabase project:
1. Copy the SQL from communities_migration.sql
2. Run in Supabase SQL Editor
3. Creates all tables, indexes, RLS policies, and functions
```

### Functions Created
- `create_league_communities()`: Creates the 4 league communities
- `create_team_community()`: Helper for creating team communities
- `cleanup_expired_community_messages()`: Cleanup function for cron jobs
- `auto_join_user_communities()`: Auto-joins users based on preferences

## Type Updates

Updated `database.ts` to include new table types:
- `communities`
- `community_memberships` 
- `community_messages`
- `community_message_reactions`

## Key Implementation Details

### Message Expiration Logic
```typescript
// Server-side: Messages created with 1-hour expiration
expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString()

// Client-side: Filter expired messages
.filter(msg => new Date(msg.expires_at) > new Date())

// Real-time cleanup every minute
setInterval(() => {
  setMessages(prev => 
    prev.filter(msg => new Date(msg.expires_at) > new Date())
  );
}, 60000);
```

### Automatic Community Creation
Communities are automatically created for all existing teams and the 4 major leagues when the migration runs.

### User Experience
- **Visual expiration indicators**: Messages show time remaining
- **Color coding**: Messages turning red in final 10 minutes
- **Seamless navigation**: Integrated into existing Messages workflow
- **Real-time updates**: Live message updates and reactions

## Testing

### Test Scenarios
1. **Community Access**: Verify users only see communities for their teams/leagues
2. **Message Expiration**: Verify messages disappear after exactly 1 hour
3. **Auto-join**: Verify users join communities when they select new teams
4. **Real-time**: Verify messages appear immediately for all community members
5. **Reactions**: Verify reaction system works correctly

### Edge Cases Handled
- **Expired message cleanup**: Both database and client-side filtering
- **Permission checks**: Comprehensive RLS policies
- **Error handling**: Graceful fallbacks for network issues
- **Memory management**: Proper subscription cleanup

## Performance Considerations

### Optimizations
- **Indexed queries**: Proper database indexes on community_id, expires_at, etc.
- **Efficient subscriptions**: Separate channels per community
- **Message pagination**: Load messages in batches of 50
- **Automatic cleanup**: Regular removal of expired messages

### Scaling
- **Member limits**: Can handle thousands of members per community
- **Message volume**: Efficient expiration reduces storage needs
- **Real-time**: Supabase Realtime scales automatically

## Future Enhancements

### Phase 3 Possibilities
- **Community moderation**: Ban/mute users, delete messages
- **Rich media**: Image and video sharing in communities
- **Threading**: Reply threads for popular messages
- **Community stats**: Activity metrics and leaderboards
- **Push notifications**: Community-specific notification settings

## Troubleshooting

### Common Issues
1. **Users not seeing communities**: Check `user_sports_preferences` table
2. **Messages not expiring**: Verify database triggers and client cleanup
3. **Permission errors**: Check RLS policies and user authentication
4. **Real-time not working**: Verify Supabase subscription setup

### Debug Steps
1. Check user's `favorite_teams` and `preferred_leagues`
2. Verify community membership in `community_memberships`
3. Test message expiration logic manually
4. Check Supabase logs for RLS policy issues

## Conclusion

The communities feature is now fully implemented and provides a robust, scalable foundation for team and league-based discussions. The 1-hour message expiration creates an ephemeral, live-discussion feel while the automatic membership system ensures users are connected to relevant communities based on their sports preferences. 