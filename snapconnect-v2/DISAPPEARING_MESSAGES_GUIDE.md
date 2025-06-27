# Enhanced Disappearing Messages System

## Overview

This system implements sophisticated disappearing messages where messages disappear **after being viewed by the recipient AND when no one is active in the chat**. This is more nuanced than simple "view once" messages, providing a Snapchat-like experience with additional safety features.

## Key Features

### 1. **Smart Disappearing Logic**
- Messages only disappear from **direct chats** (not group or community chats)
- Senders can view their own messages **unlimited times** before recipient sees them
- Messages disappear only when **both conditions** are met:
  1. Recipient has viewed the message
  2. No one is currently active in the chat

### 2. **Presence-Aware System**
- Tracks when users enter/leave chats
- Messages won't disappear while someone is actively in the chat
- 30-second activity window to handle network delays

### 3. **Visual Indicators**
- **📨** - Sent but not viewed by recipient
- **👁️** - Viewed by recipient
- **"Disappearing"** label on sent messages
- **"Viewed"** label after recipient sees message

## Database Schema

### New Tables

#### `message_views`
Tracks who has viewed each message and when:
```sql
CREATE TABLE public.message_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE,
  viewer_id UUID REFERENCES public.profiles(id),
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, viewer_id)
);
```

#### `chat_presence`
Tracks user presence in chats:
```sql
CREATE TABLE public.chat_presence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id UUID REFERENCES public.chats(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id),
  entered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(chat_id, user_id)
);
```

### Enhanced Messages Table
Added columns to existing `messages` table:
```sql
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS is_disappearing BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS viewed_by_recipient BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS viewed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS should_disappear BOOLEAN DEFAULT FALSE;
```

## Core Functions

### 1. `mark_message_viewed(messageId, viewerId)`
- Records message view in `message_views` table
- Marks message as `viewed_by_recipient` if viewer isn't sender
- Only processes direct chat messages

### 2. `update_chat_presence(chatId, userId, isActive)`
- Updates user's presence status in chat
- Tracks last activity timestamp
- Used for enter/leave chat events

### 3. `cleanup_disappearing_messages()`
- Finds messages viewed by recipient
- Checks if anyone is active in the chat
- Marks eligible messages with `should_disappear = TRUE`

### 4. `delete_disappearing_messages()`
- Actually deletes messages marked for deletion
- Called after cleanup to remove messages from database

## User Flow

### Sending a Message
1. User types message in direct chat
2. Message is created with `is_disappearing = TRUE`
3. Message appears immediately for sender
4. Status shows **📨 Disappearing**

### Receiving a Message
1. Recipient sees new message in chat
2. When message becomes visible (auto-triggered), `mark_message_viewed()` is called
3. Message is marked as viewed in database
4. Sender sees status change to **👁️ Viewed**

### Message Disappearing
1. System periodically runs `cleanup_disappearing_messages()`
2. For viewed messages, checks if anyone is active in chat
3. If no one active for 30+ seconds, marks message for deletion
4. `delete_disappearing_messages()` removes marked messages
5. Real-time subscription notifies clients of deletion

## Implementation Details

### ChatService Integration
```typescript
// Enhanced ChatService methods
await chatService.enterChat(chatId);      // Mark presence as active
await chatService.leaveChat(chatId);      // Mark presence as inactive
await chatService.markMessageAsViewed(messageId); // Mark message viewed
```

### React Native Screen
```typescript
// Presence tracking with navigation
useFocusEffect(
  useCallback(() => {
    if (chatId) {
      chatService.enterChat(chatId);
    }
    return () => {
      if (chatId) {
        chatService.leaveChat(chatId);
      }
    };
  }, [chatId])
);
```

### Real-time Updates
```typescript
// Subscribe to both new messages and deletions
const subscription = chatService.subscribeToMessages(chatId, 
  (message) => {
    // Handle new message
    if (message.sender_id !== user?.id) {
      setTimeout(() => handleMessageView(message), 1000);
    }
  }
);
```

## Security & Privacy

### Row Level Security (RLS)
- All tables have RLS enabled
- Users can only view their own message views
- Chat participants can see presence for their chats
- Messages follow existing chat participant policies

### Data Protection
- Message views stored separately from message content
- Cleanup functions have controlled access
- Presence data automatically expires
- No sensitive data in logs

## Performance Considerations

### Indexing
```sql
-- Key indexes for performance
CREATE INDEX idx_message_views_message_id ON message_views(message_id);
CREATE INDEX idx_chat_presence_chat_id ON chat_presence(chat_id);
CREATE INDEX idx_messages_disappearing ON messages(is_disappearing, should_disappear);
```

### Cleanup Strategy
- Periodic cleanup every 5 minutes (configurable)
- Batch processing for multiple messages
- Presence cleanup for inactive records
- Message view cleanup for old records (30+ days)

### Optimization
- Views marked automatically when messages become visible
- Presence updates batched by user activity
- Cleanup only processes eligible messages
- Real-time subscriptions handle UI updates

## Troubleshooting

### Common Issues

**Messages not disappearing:**
- Check if someone is still active in chat
- Verify recipient has actually viewed message
- Run manual cleanup: `SELECT public.full_message_cleanup();`

**Presence not tracking:**
- Ensure `enterChat()` called on screen focus
- Verify `leaveChat()` called on screen blur
- Check for network connectivity issues

**View tracking not working:**
- Confirm message visibility triggers `markMessageAsViewed()`
- Check RLS policies for message_views table
- Verify user permissions for database functions

### Manual Cleanup
```sql
-- Force cleanup all eligible messages
SELECT public.full_message_cleanup();

-- Check message status
SELECT id, content, viewed_by_recipient, should_disappear 
FROM messages 
WHERE chat_id = 'your-chat-id' 
ORDER BY created_at DESC;

-- Check presence status
SELECT * FROM chat_presence WHERE chat_id = 'your-chat-id';
```

## Future Enhancements

### Potential Features
- **Read receipts with timestamps**
- **Message retention policies** (auto-delete after X days)
- **Selective disappearing** (toggle per message)
- **Disappearing media** with enhanced handling
- **Group chat disappearing** with complex view tracking

### Scalability
- **Edge function cleanup** for serverless processing
- **Background job scheduling** with pg_cron
- **Message archiving** before deletion
- **Analytics tracking** for usage patterns

## Migration Guide

### From Existing System
1. Run `enhanced_disappearing_messages.sql` migration
2. Update `database.ts` types
3. Replace `ChatService` imports
4. Update `ChatScreen` component
5. Test with direct chats only

### Rollback Process
1. Disable disappearing message features
2. Remove new columns (optional)
3. Revert to original ChatService
4. Clean up new tables if needed

This system provides a sophisticated, user-friendly disappearing message experience while maintaining data integrity and performance. 