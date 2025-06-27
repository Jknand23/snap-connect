# Phase 2: MVP - Core Sports Snapchat Features

## Overview
Build the essential Snapchat-style functionality with basic sports integration. This phase delivers a minimal viable product where users can capture and share sports content, connect with other fans, and experience core social features. The app becomes fully usable for basic sports fan interactions.

**Duration**: 3-4 weeks  
**Goal**: Functional sports-focused social media app with core Snapchat features

## ✅ **Authentication Setup Complete**
**Status**: Supabase authentication is now working correctly with signup/signin functionality. Database schema has been successfully migrated with all required tables (profiles, user_sports_preferences, teams, stories, messages, etc.). Email confirmation has been configured and user registration flow is operational.

## ✅ **Profile Navigation & Sign Out Complete**
**Status**: Profile screen has been successfully integrated into the navigation system. Users can now access their profile from the Messages screen header button and sign out functionality is fully implemented with confirmation dialog.

## Deliverables

### 1. ✅ User Profile & Authentication Management
**Objective**: Complete user profile system with sign out functionality

**Implementation Complete**:
- ✅ ProfileScreen displays user information (username, email, avatar)
- ✅ Profile accessible via Messages screen header button
- ✅ Sign out functionality with confirmation dialog
- ✅ User stats display (Stories, Friends, Teams counts)
- ✅ Settings sections for profile management
- ✅ Sports-themed styling consistent with app design

**Navigation Flow**:
- Messages Screen → Profile Button (top-left) → ProfileScreen
- ProfileScreen → Sign Out → Confirmation Dialog → Auth Screen

**Acceptance Criteria** ✅:
- Profile button navigates to ProfileScreen correctly
- Sign out feature works with confirmation dialog
- User profile displays current user information
- Profile stats show placeholder data for future features
- Settings buttons prepared for future implementation

### 2. Camera & Content Creation System
**Objective**: Enable users to capture and create sports-themed content

**Steps**:
1. Implement Expo Camera with photo/video capture functionality
2. Create camera interface with sports-themed AR filters (team logos, colors)
3. Build content editor with text overlays, stickers, and basic effects
4. Add content preview and sharing options interface
5. Implement media compression and optimization for storage

**Acceptance Criteria**:
- Users can capture photos and videos with camera
- Basic AR filters display team logos and colors correctly
- Content can be edited with text and visual elements
- Media files are properly compressed before storage
- Camera permissions handled gracefully

### 3. Stories & Content Sharing
**Objective**: Core Snapchat-style content sharing functionality

**Steps**:
1. Create user stories system with 24-hour expiration
2. Implement inline story viewing modal within Discovery screen
3. Build direct message sharing for disappearing content
4. Add story privacy controls (public, friends, specific teams)
5. Create content reporting and moderation system

**Acceptance Criteria**:
- Users can post content to their stories
- Stories expire automatically after 24 hours
- Story viewing interface shows in modal overlay within Discovery tab
- Users return to Discovery feed after viewing stories
- Content can be shared privately between users
- Privacy settings control story visibility appropriately

### 4. Real-Time Messaging System
**Objective**: Enable private and group conversations between sports fans with ephemeral messaging

**Steps**:
1. Implement real-time messaging using Supabase Realtime
2. Create chat interface with sports-themed message bubbles
3. Build group chat functionality for team-based discussions with group disappearing messages
4. Add message reactions with sports emojis and team icons
5. Implement sophisticated disappearing messages system

**Ephemeral Messaging Features**:
- **Direct Messages**: Messages disappear after recipient views them AND when no users are actively in the chat
- **Group Messages**: Messages disappear only after ALL group members have viewed the message
- **View Tracking**: Sophisticated system tracks who has viewed each message
- **Presence Awareness**: Chat presence tracking ensures messages don't disappear while users are active
- **Real-time Updates**: Message disappearance triggers real-time notifications to all participants

**Acceptance Criteria**:
- Messages send and receive in real-time
- **Private messages disappear after recipient views them (when both users leave chat)**
- **Group messages disappear only after every member has viewed them**
- Group chats support multiple participants with member-specific view tracking
- Message reactions work with sports-themed emojis
- Chat history loads efficiently while respecting disappearing message state
- View status indicators show which group members have seen each message

### 5. Sports Onboarding & User Preferences
**Objective**: Personalize app experience based on user's sports interests

**Steps**:
1. Create sports onboarding flow for team/player selection
2. Build user profile system with sports preferences
3. Implement team following and unfollowing functionality
4. Add favorite players selection and management
5. Create preference-based friend suggestions

**Acceptance Criteria**:
- New users complete sports preference setup
- User profiles display favorite teams and players
- Team following affects content recommendations
- Friend suggestions based on shared team interests
- Preferences can be updated from settings screen

### 6. Basic Social Graph & Friend System
**Objective**: Enable connections between sports fans

**Steps**:
1. Implement user search functionality by username/team interest
2. Create friend request and acceptance system
3. Build friends list with online status indicators
4. Add mutual friend suggestions based on team preferences
5. Implement block and report functionality for user safety

**Acceptance Criteria**:
- Users can search and find other fans by shared interests
- Friend requests send notifications and require approval
- Friends list shows current online/offline status
- Mutual connections suggested based on sports preferences
- User safety features prevent harassment

### 7. Discovery Feed & Content Discovery
**Objective**: Display relevant sports content with tabbed sections for different content types

**Steps**:
1. Create persistent Stories section at top of Discovery tab (always visible)
2. Implement tabbed navigation with "Scores", "Highlights", "News", and "For You" sections
3. Build "For You" tab as default with personalized content algorithm based on sports preferences
4. Add "Scores" tab with live game scores and standings for user's followed teams
5. Create "Highlights" tab with video highlights and key moments from recent games
6. Implement "News" tab with latest sports news articles and breaking updates
7. Add insider information section in "For You" tab (press conferences, practice reports)
8. Implement pull-to-refresh and infinite scroll functionality for each tab
9. Build content interaction system (likes, comments, shares) across all tabs
10. Create search functionality for users and sports-related content

**Acceptance Criteria**:
- Stories section remains visible at top of Discovery tab at all times
- Four content tabs are accessible via horizontal button navigation below Stories
- "For You" tab is the default selected tab on app launch
- "For You" tab displays personalized content based on user's followed teams and players
- "For You" tab includes insider information like press conferences and practice updates
- "Scores" tab shows real-time scores and standings for user's teams
- "Highlights" tab displays video content and key game moments
- "News" tab shows latest sports news and breaking updates
- Users can seamlessly switch between tabs without losing scroll position
- Each tab refreshes properly and loads more content on scroll
- Content interaction features work consistently across all tabs
- Search functionality works across all content types

## Technical Implementation Details

### Camera Integration
```typescript
// Using Expo Camera for MVP phase
import { Camera } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';

// Team-based AR filter system
interface ARFilter {
  id: string;
  teamId: string;
  type: 'logo-overlay' | 'team-colors' | 'victory-celebration';
  config: FilterConfig;
}
```

### Real-Time Architecture
```typescript
// Supabase Realtime for messaging
const subscribeToMessages = (chatId: string) => {
  return supabase
    .channel(`chat-${chatId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `chat_id=eq.${chatId}`,
    }, handleNewMessage)
    .subscribe();
};
```

### Sports Data Integration
```typescript
// Basic sports reference data
interface Team {
  id: string;
  name: string;
  league: 'NFL' | 'NBA' | 'MLB';
  colors: { primary: string; secondary: string };
  logoUrl: string;
}

interface UserSportsProfile {
  userId: string;
  favoriteTeams: string[];
  favoritePlayers: string[];
  preferences: SportsPreferences;
}
```

## Database Schema Updates

### New Tables
```sql
-- Stories table
CREATE TABLE stories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  media_url TEXT NOT NULL,
  media_type TEXT CHECK (media_type IN ('photo', 'video')),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id UUID NOT NULL,
  sender_id UUID REFERENCES auth.users(id),
  content TEXT,
  media_url TEXT,
  message_type TEXT CHECK (message_type IN ('text', 'photo', 'video')),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User sports preferences
CREATE TABLE user_sports_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  favorite_teams TEXT[] DEFAULT '{}',
  favorite_players TEXT[] DEFAULT '{}',
  preferred_leagues TEXT[] DEFAULT '{}',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Performance Requirements
- **Story loading**: Under 2 seconds for story feed
- **Message delivery**: Real-time (< 1 second latency)
- **Camera capture**: Instant shutter response
- **Feed refresh**: Under 3 seconds for content loading
- **Search results**: Under 1 second for user/content search

## Success Metrics
- [ ] Users can capture and share sports-themed content
- [ ] Stories post and expire correctly within 24 hours
- [ ] Real-time messages work between all users
- [x] **Private messages disappear after recipient views them (when both users leave chat)** ✅
- [x] **Group messages disappear only after every member has viewed them** ✅
- [x] **View tracking shows which group members have seen each message** ✅
- [ ] Sports onboarding collects user preferences
- [ ] Friend connections based on sports interests
- [ ] Content feed displays relevant sports content
- [ ] Camera AR filters apply team branding correctly
- [ ] App handles 100+ concurrent users without performance issues
- [x] **Profile navigation and sign out functionality works** ✅
- [x] **Group messaging with coordinated ephemeral behavior implemented** ✅

## User Acceptance Criteria
- **New User Journey**: User completes registration → sports onboarding → captures first content → shares to story → connects with sports friends
- **Daily Usage**: User opens app on Camera tab → captures game reaction → navigates to Discovery tab → views Stories at top → switches to "Scores" tab for live updates → moves to "Highlights" tab for video content → navigates to Messages tab → sends to group chat
- **Social Interaction**: User finds other fans in Discovery "For You" tab → sends friend request → joins team-based group chat → shares exclusive content from "Highlights" or "News" tabs
- **Navigation Flow**: User navigates between Discovery (with persistent Stories and tabbed content), Camera (capture), and Messages (conversations) tabs seamlessly
- **Content Discovery Flow**: User starts in "For You" tab (default) → switches to "Scores" for game updates → moves to "Highlights" for video content → checks "News" for articles → returns to "For You" for personalized content
- **Profile Management** ✅: User accesses profile from Messages header → views profile information → signs out with confirmation → returns to auth flow

## Known Limitations
- Basic AR filters only (no advanced effects)
- Limited sports data (no live scores or news yet)
- No AI-powered content recommendations
- Basic search functionality
- No community features yet
- Limited content moderation

## Risk Mitigation
- **Performance**: Implement image compression and lazy loading
- **Storage Costs**: Automatic cleanup of expired stories and messages  
- **User Safety**: Basic reporting and blocking functionality
- **Sports Data**: Use static team/player data to avoid API dependencies
- **Scalability**: Design database schema for future AI features

## Next Phase Preview
Phase 3 will add AI-powered personalization, live sports data integration, and enhanced community features to transform the basic social app into an intelligent sports companion. 