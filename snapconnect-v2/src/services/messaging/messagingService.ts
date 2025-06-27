/**
 * Messaging Service
 * 
 * Handles real-time messaging, chat management, and friend connections.
 * Supports direct messages, group chats, team-based discussions, and message reactions.
 */
import { supabase, DatabaseError, dbUtils } from '../database/supabase';
import { Database } from '../../types/database';

type Chat = Database['public']['Tables']['chats']['Row'];
type ChatInsert = Database['public']['Tables']['chats']['Insert'];
type Message = Database['public']['Tables']['messages']['Row'];
type MessageInsert = Database['public']['Tables']['messages']['Insert'];
type MessageReaction = Database['public']['Tables']['message_reactions']['Row'];
type ChatParticipant = Database['public']['Tables']['chat_participants']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];
type Friendship = Database['public']['Tables']['friendships']['Row'];

export interface MessageWithProfile extends Message {
  sender: Profile;
  reactions: MessageReaction[];
  reply_to_message?: MessageWithProfile;
}

export interface ChatWithDetails extends Chat {
  participants: (ChatParticipant & { profiles: Profile })[];
  last_message?: MessageWithProfile;
  unread_count: number;
}

export interface CreateChatData {
  name?: string;
  description?: string;
  type: 'direct' | 'group' | 'team';
  participantIds: string[];
  teamId?: string;
}

export interface SendMessageData {
  chatId: string;
  content?: string;
  mediaUrl?: string;
  mediaType?: 'text' | 'photo' | 'video' | 'story_share';
  replyToMessageId?: string;
  expiresAt?: Date;
}

/**
 * Messaging service for real-time communication
 */
export class MessagingService {
  /**
   * Create a new chat
   */
  async createChat(chatData: CreateChatData): Promise<ChatWithDetails> {
    try {
      const userId = await dbUtils.getCurrentUserId();

      // For direct messages, ensure only 2 participants
      if (chatData.type === 'direct' && chatData.participantIds.length !== 1) {
        throw new DatabaseError('Direct messages must have exactly 1 other participant');
      }

      // Check if direct chat already exists
      if (chatData.type === 'direct') {
        const existingChat = await this.findDirectChat(chatData.participantIds[0]);
        if (existingChat) {
          return existingChat;
        }
      }

      // Check if group chat with same participants already exists
      if (chatData.type === 'group') {
        const existingGroupChat = await this.findGroupChatWithParticipants([userId, ...chatData.participantIds]);
        if (existingGroupChat) {
          return existingGroupChat;
        }
      }

      // Create the chat
      const insertData: ChatInsert = {
        name: chatData.name || null,
        description: chatData.description || null,
        type: chatData.type,
        team_id: chatData.teamId || null,
        created_by: userId,
      };

      const { data: chat, error: chatError } = await supabase
    .from('chats')
        .insert(insertData)
        .select()
    .single();

      if (chatError) {
        throw new DatabaseError('Failed to create chat', chatError);
      }

      // Add participants (including creator)
      const allParticipantIds = [userId, ...chatData.participantIds];
      const participants = allParticipantIds.map(participantId => ({
        chat_id: chat.id,
        user_id: participantId,
        role: participantId === userId ? 'admin' as const : 'member' as const,
  }));

  const { error: participantsError } = await supabase
    .from('chat_participants')
    .insert(participants);

      if (participantsError) {
        throw new DatabaseError('Failed to add chat participants', participantsError);
      }

      return await this.getChatById(chat.id);
    } catch (error) {
      throw new DatabaseError('Failed to create chat', error);
    }
  }

  /**
   * Find existing direct chat between two users
   */
  async findDirectChat(otherUserId: string): Promise<ChatWithDetails | null> {
    try {
      const userId = await dbUtils.getCurrentUserId();

      const { data, error } = await supabase
        .from('chats')
        .select(`
          *,
          chat_participants!inner(user_id)
        `)
        .eq('type', 'direct')
        .filter('chat_participants.user_id', 'in', `(${userId},${otherUserId})`);

      if (error) {
        throw new DatabaseError('Failed to find direct chat', error);
      }

      // Find chat with exactly these two participants
      for (const chat of data || []) {
        const { count } = await supabase
          .from('chat_participants')
          .select('*', { count: 'exact', head: true })
          .eq('chat_id', chat.id);

        if (count === 2) {
          return await this.getChatById(chat.id);
        }
      }

      return null;
    } catch (error) {
      throw new DatabaseError('Failed to find direct chat', error);
    }
  }

  /**
   * Find existing group chat with the same set of participants
   */
  async findGroupChatWithParticipants(participantIds: string[]): Promise<ChatWithDetails | null> {
    try {
      console.log('🔍 Looking for existing group chat with participants:', participantIds);
      
      // Sort participant IDs for consistent comparison
      const sortedParticipantIds = [...participantIds].sort();
      
      // Get all group chats the current user is in
      const { data: userGroupChats, error } = await supabase
        .from('chat_participants')
        .select(`
          chat_id,
          chats!inner(id, type)
        `)
        .eq('user_id', participantIds[0]) // Current user
        .eq('chats.type', 'group');

      if (error) {
        throw new DatabaseError('Failed to find group chats', error);
      }

      if (!userGroupChats || userGroupChats.length === 0) {
        console.log('🔍 No group chats found for user');
        return null;
      }

      // Check each group chat to see if it has the exact same participants
      for (const userChat of userGroupChats) {
        const chatId = userChat.chat_id;
        
        // Get all participants for this chat
        const { data: chatParticipants, error: participantsError } = await supabase
          .from('chat_participants')
          .select('user_id')
          .eq('chat_id', chatId);

        if (participantsError) {
          console.warn('Error getting participants for chat', chatId, participantsError);
          continue;
        }

        if (!chatParticipants) continue;

        // Sort the participant IDs from this chat
        const chatParticipantIds = chatParticipants.map(p => p.user_id).sort();
        
        console.log('🔍 Comparing participants:', {
          requested: sortedParticipantIds,
          existing: chatParticipantIds,
          match: JSON.stringify(sortedParticipantIds) === JSON.stringify(chatParticipantIds)
        });

        // Check if the participant sets are identical
        if (JSON.stringify(sortedParticipantIds) === JSON.stringify(chatParticipantIds)) {
          console.log('✅ Found existing group chat with same participants:', chatId);
          return await this.getChatById(chatId);
        }
      }

      console.log('🔍 No existing group chat found with same participants');
      return null;
    } catch (error) {
      console.error('Error finding group chat with participants:', error);
      throw new DatabaseError('Failed to find group chat with participants', error);
    }
  }

  /**
   * Get chat by ID with full details
   */
  async getChatById(chatId: string): Promise<ChatWithDetails> {
    try {
      const userId = await dbUtils.getCurrentUserId();

      // Verify user is participant
      const { data: participant } = await supabase
        .from('chat_participants')
        .select('*')
        .eq('chat_id', chatId)
        .eq('user_id', userId)
        .single();

      if (!participant) {
        throw new DatabaseError('Not authorized to access this chat');
      }

      // Get chat details
      const { data: chat, error: chatError } = await supabase
        .from('chats')
        .select('*')
        .eq('id', chatId)
        .single();

      if (chatError) {
        throw new DatabaseError('Failed to get chat', chatError);
      }

      // Get participants
      const { data: participants, error: participantsError } = await supabase
        .from('chat_participants')
        .select(`
          *,
          profiles!inner(*)
        `)
        .eq('chat_id', chatId);

      if (participantsError) {
        throw new DatabaseError('Failed to get chat participants', participantsError);
      }

      // Get last message
      const { data: lastMessage } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(*),
          message_reactions(*)
        `)
        .eq('chat_id', chatId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      // Get unread count
      const userParticipant = participants?.find(p => p.user_id === userId);
      const lastReadAt = userParticipant?.last_read_at || new Date(0).toISOString();

      const { count: unreadCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('chat_id', chatId)
        .gt('created_at', lastReadAt)
        .neq('sender_id', userId);

      return {
        ...chat,
        participants: participants || [],
        last_message: lastMessage ? {
          ...lastMessage,
          sender: lastMessage.sender,
          reactions: lastMessage.message_reactions || [],
        } : undefined,
        unread_count: unreadCount || 0,
      };
    } catch (error) {
      throw new DatabaseError('Failed to get chat by ID', error);
    }
}

/**
 * Get user's chats
 */
async getUserChats(): Promise<ChatWithDetails[]> {
  try {
    const userId = await dbUtils.getCurrentUserId();
    console.log('🔍 Getting user chats for user:', userId);

    // First, get the chat IDs where user is a participant
    const { data: participantData, error: participantError } = await supabase
      .from('chat_participants')
      .select('chat_id')
      .eq('user_id', userId);

    if (participantError) {
      console.error('❌ Error getting chat participants:', {
        message: participantError.message,
        details: participantError.details,
        hint: participantError.hint,
        code: participantError.code,
        full_error: participantError
      });
      throw new DatabaseError('Failed to get user chat participants', participantError);
    }

    if (!participantData || participantData.length === 0) {
      console.log('⚠️ No chat participants found for user');
      return [];
    }

    const chatIds = participantData.map(p => p.chat_id);
    console.log('📱 Found chat IDs:', chatIds);

    // Now get the actual chat details
    const { data: chatsData, error: chatsError } = await supabase
      .from('chats')
      .select('*')
      .in('id', chatIds)
      .order('updated_at', { ascending: false });

    if (chatsError) {
      console.error('❌ Error getting chats:', {
        message: chatsError.message,
        details: chatsError.details,
        hint: chatsError.hint,
        code: chatsError.code,
        full_error: chatsError
      });
      throw new DatabaseError('Failed to get chats', chatsError);
    }

    if (!chatsData || chatsData.length === 0) {
      console.log('⚠️ No chats found');
      return [];
    }

    console.log('✅ Retrieved chats:', chatsData.length);

    // Build the detailed chat objects with participants and messages
    const detailedChats: ChatWithDetails[] = [];

    for (const chat of chatsData) {
      try {
        // Get participants for this chat
        const { data: participants, error: participantsError } = await supabase
          .from('chat_participants')
          .select(`
            *,
            profiles!inner(*)
          `)
          .eq('chat_id', chat.id);

        if (participantsError) {
          console.warn(`⚠️ Could not get participants for chat ${chat.id}:`, participantsError);
          // Continue with empty participants rather than failing completely
        }

        // Get last message for this chat
        const { data: lastMessage } = await supabase
          .from('messages')
          .select(`
            *,
            sender:profiles!messages_sender_id_fkey(*),
            message_reactions(*)
          `)
          .eq('chat_id', chat.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        // Get unread count
        const userParticipant = participants?.find(p => p.user_id === userId);
        const lastReadAt = userParticipant?.last_read_at || new Date(0).toISOString();

        const { count: unreadCount } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('chat_id', chat.id)
          .gt('created_at', lastReadAt)
          .neq('sender_id', userId);

        detailedChats.push({
          ...chat,
          participants: participants || [],
          last_message: lastMessage ? {
            ...lastMessage,
            sender: lastMessage.sender,
            reactions: lastMessage.message_reactions || [],
          } : undefined,
          unread_count: unreadCount || 0,
        });
      } catch (chatError) {
        console.warn(`⚠️ Error processing chat ${chat.id}:`, chatError);
        // Continue with next chat rather than failing completely
      }
    }

    // DEDUPLICATION: Remove duplicate direct chats between same users
    const deduplicatedChats = this.deduplicateDirectChats(detailedChats, userId);

    console.log('✅ Successfully processed chats:', detailedChats.length);
    console.log('✅ After deduplication:', deduplicatedChats.length);
    return deduplicatedChats;

  } catch (error) {
    console.error('❌ Error in getUserChats:', error);
    throw new DatabaseError('Failed to get user chats', error);
  }
}

/**
 * Remove duplicate direct chats between the same users
 */
private deduplicateDirectChats(chats: ChatWithDetails[], currentUserId: string): ChatWithDetails[] {
  const directChatMap = new Map<string, ChatWithDetails>();
  const nonDirectChats: ChatWithDetails[] = [];

  for (const chat of chats) {
    if (chat.type !== 'direct') {
      nonDirectChats.push(chat);
      continue;
    }

    // For direct chats, create a key based on participant user IDs
    const participantIds = chat.participants
      ?.map(p => p.user_id)
      .filter(id => id !== currentUserId)
      .sort()
      .join('-') || 'unknown';

    // Only keep the most recent chat for each user pair
    const existing = directChatMap.get(participantIds);
    if (!existing || new Date(chat.updated_at) > new Date(existing.updated_at)) {
      directChatMap.set(participantIds, chat);
    }
  }

  // Combine deduplicated direct chats with non-direct chats
  return [...Array.from(directChatMap.values()), ...nonDirectChats];
}

  /**
   * Send a message
   */
  async sendMessage(messageData: SendMessageData): Promise<MessageWithProfile> {
    try {
      const userId = await dbUtils.getCurrentUserId();

      // Verify user is participant in chat
      const { data: participant } = await supabase
        .from('chat_participants')
        .select('*')
        .eq('chat_id', messageData.chatId)
        .eq('user_id', userId)
        .single();

      if (!participant) {
        throw new DatabaseError('Not authorized to send message to this chat');
      }

      const insertData: MessageInsert = {
        chat_id: messageData.chatId,
        sender_id: userId,
        content: messageData.content || null,
        media_url: messageData.mediaUrl || null,
        media_type: messageData.mediaType || 'text',
        reply_to: messageData.replyToMessageId || null,
        expires_at: messageData.expiresAt?.toISOString() || null,
      };

      const { data: message, error: messageError } = await supabase
        .from('messages')
        .insert(insertData)
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(*),
          message_reactions(*)
        `)
        .single();

      if (messageError) {
        throw new DatabaseError('Failed to send message', messageError);
      }

      // Update chat's updated_at timestamp
      await supabase
        .from('chats')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', messageData.chatId);

      return {
        ...message,
        sender: message.sender,
        reactions: message.message_reactions || [],
      };
    } catch (error) {
      throw new DatabaseError('Failed to send message', error);
    }
  }

  /**
   * Get messages for a chat
   */
  async getChatMessages(chatId: string, limit = 50, before?: string): Promise<MessageWithProfile[]> {
    try {
      const userId = await dbUtils.getCurrentUserId();

      // Verify user is participant
      const { data: participant } = await supabase
        .from('chat_participants')
        .select('*')
        .eq('chat_id', chatId)
        .eq('user_id', userId)
        .single();

      if (!participant) {
        throw new DatabaseError('Not authorized to view chat messages');
      }

      let query = supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(*),
          message_reactions(*),
          reply_to_message:messages!messages_reply_to_fkey(
            *,
            sender:profiles!messages_sender_id_fkey(*)
          )
        `)
        .eq('chat_id', chatId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (before) {
        query = query.lt('created_at', before);
      }

      const { data, error } = await query;

      if (error) {
        throw new DatabaseError('Failed to get chat messages', error);
      }

      return (data || []).map((message: any) => ({
        ...message,
        sender: message.sender,
        reactions: message.message_reactions || [],
        reply_to_message: message.reply_to_message,
      }));
    } catch (error) {
      throw new DatabaseError('Failed to get chat messages', error);
    }
  }

  /**
   * Add reaction to message
   */
  async addMessageReaction(messageId: string, emoji: string): Promise<MessageReaction> {
    try {
      const userId = await dbUtils.getCurrentUserId();

  const { data, error } = await supabase
    .from('message_reactions')
    .upsert({
      message_id: messageId,
      user_id: userId,
      emoji,
    })
        .select()
    .single();

      if (error) {
        throw new DatabaseError('Failed to add message reaction', error);
      }

  return data;
    } catch (error) {
      throw new DatabaseError('Failed to add message reaction', error);
    }
  }

  /**
   * Remove reaction from message
   */
  async removeMessageReaction(messageId: string, emoji: string): Promise<void> {
    try {
      const userId = await dbUtils.getCurrentUserId();

  const { error } = await supabase
    .from('message_reactions')
    .delete()
    .eq('message_id', messageId)
    .eq('user_id', userId)
    .eq('emoji', emoji);

      if (error) {
        throw new DatabaseError('Failed to remove message reaction', error);
      }
    } catch (error) {
      throw new DatabaseError('Failed to remove message reaction', error);
    }
  }

  /**
   * Mark chat as read
   */
  async markChatAsRead(chatId: string): Promise<void> {
    try {
      const userId = await dbUtils.getCurrentUserId();

  const { error } = await supabase
    .from('chat_participants')
    .update({ last_read_at: new Date().toISOString() })
    .eq('chat_id', chatId)
    .eq('user_id', userId);

      if (error) {
        throw new DatabaseError('Failed to mark chat as read', error);
      }
    } catch (error) {
      throw new DatabaseError('Failed to mark chat as read', error);
    }
  }

  /**
   * Leave a chat
   */
  async leaveChat(chatId: string): Promise<void> {
    try {
      const userId = await dbUtils.getCurrentUserId();

      const { error } = await supabase
        .from('chat_participants')
        .delete()
        .eq('chat_id', chatId)
        .eq('user_id', userId);

      if (error) {
        throw new DatabaseError('Failed to leave chat', error);
      }
    } catch (error) {
      throw new DatabaseError('Failed to leave chat', error);
    }
  }

  /**
   * Add participant to chat
   */
  async addChatParticipant(chatId: string, userId: string): Promise<ChatParticipant> {
    try {
      const currentUserId = await dbUtils.getCurrentUserId();

      // Verify current user is admin of the chat
      const { data: participant } = await supabase
        .from('chat_participants')
        .select('role')
        .eq('chat_id', chatId)
        .eq('user_id', currentUserId)
        .single();

      if (!participant || participant.role !== 'admin') {
        throw new DatabaseError('Not authorized to add participants');
      }

      const { data, error } = await supabase
        .from('chat_participants')
        .insert({
          chat_id: chatId,
          user_id: userId,
          role: 'member',
        })
        .select()
        .single();

      if (error) {
        throw new DatabaseError('Failed to add chat participant', error);
      }

      return data;
    } catch (error) {
      throw new DatabaseError('Failed to add chat participant', error);
    }
  }

  /**
   * Send friend request
   */
  async sendFriendRequest(addresseeId: string): Promise<Friendship> {
    try {
      const userId = await dbUtils.getCurrentUserId();

      if (userId === addresseeId) {
        throw new DatabaseError('Cannot send friend request to yourself');
      }

      // Check if friendship already exists
      const { data: existing } = await supabase
        .from('friendships')
        .select('*')
        .or(`and(requester_id.eq.${userId},addressee_id.eq.${addresseeId}),and(requester_id.eq.${addresseeId},addressee_id.eq.${userId})`)
        .single();

      if (existing) {
        throw new DatabaseError('Friendship already exists or pending');
      }

      const { data, error } = await supabase
        .from('friendships')
        .insert({
          requester_id: userId,
          addressee_id: addresseeId,
          status: 'pending',
        })
        .select()
        .single();

      if (error) {
        throw new DatabaseError('Failed to send friend request', error);
      }

      return data;
    } catch (error) {
      throw new DatabaseError('Failed to send friend request', error);
    }
  }

  /**
   * Accept friend request
   */
  async acceptFriendRequest(friendshipId: string): Promise<Friendship> {
    try {
      const userId = await dbUtils.getCurrentUserId();

      const { data, error } = await supabase
        .from('friendships')
        .update({ 
          status: 'accepted',
          updated_at: new Date().toISOString(),
        })
        .eq('id', friendshipId)
        .eq('addressee_id', userId) // Only addressee can accept
        .eq('status', 'pending')
        .select()
        .single();

      if (error) {
        throw new DatabaseError('Failed to accept friend request', error);
      }

      return data;
    } catch (error) {
      throw new DatabaseError('Failed to accept friend request', error);
    }
  }

  /**
   * Get user's friends
   */
  async getFriends(): Promise<Profile[]> {
    try {
      const userId = await dbUtils.getCurrentUserId();

  const { data, error } = await supabase
        .from('friendships')
    .select(`
          requester:profiles!friendships_requester_id_fkey(*),
          addressee:profiles!friendships_addressee_id_fkey(*)
        `)
        .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
        .eq('status', 'accepted');

      if (error) {
        throw new DatabaseError('Failed to get friends', error);
      }

      // Extract friend profiles
      const friends = (data || []).map((friendship: any) => {
        return friendship.requester.id === userId 
          ? friendship.addressee 
          : friendship.requester;
      });

      return friends;
    } catch (error) {
      throw new DatabaseError('Failed to get friends', error);
    }
  }

  /**
   * Subscribe to new messages in a chat
   */
  subscribeToChat(chatId: string, callback: (message: Message) => void) {
    const subscription = supabase
      .channel(`chat-${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          callback(payload.new as Message);
        }
      )
      .subscribe();

    return subscription;
  }

  /**
   * Subscribe to message reactions
   */
  subscribeToReactions(messageId: string, callback: (reaction: MessageReaction) => void) {
    const subscription = supabase
      .channel(`reactions-${messageId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'message_reactions',
          filter: `message_id=eq.${messageId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            callback(payload.new as MessageReaction);
          }
        }
      )
      .subscribe();

    return subscription;
  }

  /**
   * Test basic database connectivity and policies
   */
  async testDatabaseAccess(): Promise<void> {
    try {
      const userId = await dbUtils.getCurrentUserId();
      console.log('🧪 Testing database access for user:', userId);

      // Test 1: Can we access profiles table?
      console.log('🔍 Test 1: Profiles table access...');
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, username')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('❌ Profiles table error:', profileError);
      } else {
        console.log('✅ Profiles table OK:', profile?.username);
      }

      // Test 2: Can we access chat_participants table?
      console.log('🔍 Test 2: Chat participants table access...');
      const { data: participants, error: participantsError } = await supabase
        .from('chat_participants')
        .select('id, chat_id, user_id, role')
        .eq('user_id', userId)
        .limit(5);

      if (participantsError) {
        console.error('❌ Chat participants table error:', {
          message: participantsError.message,
          details: participantsError.details,
          hint: participantsError.hint,
          code: participantsError.code
        });
      } else {
        console.log('✅ Chat participants table OK, found:', participants?.length || 0);
      }

      // Test 3: Can we access chats table?
      console.log('🔍 Test 3: Chats table access...');
      const { data: chats, error: chatsError } = await supabase
        .from('chats')
        .select('id, name, type, created_by')
        .eq('created_by', userId)
        .limit(5);

      if (chatsError) {
        console.error('❌ Chats table error:', {
          message: chatsError.message,
          details: chatsError.details,
          hint: chatsError.hint,
          code: chatsError.code
        });
      } else {
        console.log('✅ Chats table OK, found:', chats?.length || 0);
      }

      // Test 4: Check if any RLS policies are blocking
      console.log('🔍 Test 4: Check general table access...');
      const { data: allParticipants, error: allParticipantsError } = await supabase
        .from('chat_participants')
        .select('id')
        .limit(1);

      if (allParticipantsError) {
        console.error('❌ RLS might be blocking access:', allParticipantsError);
      } else {
        console.log('✅ General table access OK');
      }

      console.log('🧪 Database access test complete');

    } catch (error) {
      console.error('❌ Database test failed:', error);
    }
  }
}

// Export singleton instance
export const messagingService = new MessagingService(); 