/**
 * Chat Service
 * 
 * Handles direct messaging between friends including chat creation,
 * message sending, receiving, and real-time updates.
 * Enhanced with disappearing messages functionality.
 */
import { supabase, DatabaseError, dbUtils } from '../database/supabase';
import { disappearingMessagesService, EnhancedMessage } from './disappearingMessagesService';

export interface ChatMessage {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string | null;
  media_url: string | null;
  media_type: 'text' | 'photo' | 'video' | 'story_share' | null;
  created_at: string;
  sender_username: string;
  // Enhanced fields for disappearing messages
  is_disappearing?: boolean;
  viewed_by_recipient?: boolean;
  viewed_at?: string | null;
  should_disappear?: boolean;
  is_viewed_by_me?: boolean;
  can_be_viewed?: boolean;
}

export interface Chat {
  id: string;
  name: string | null;
  type: 'direct' | 'group' | 'team';
  created_at: string;
  updated_at: string;
  other_user?: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
  participant_count?: number;
  last_message?: {
    content: string;
    created_at: string;
    sender_username: string;
  };
  has_unread_messages?: boolean;
}

class ChatService {
  /**
   * Get or create a direct chat between two users
   */
  async getOrCreateDirectChat(friendId: string): Promise<string> {
    try {
      const currentUserId = await dbUtils.getCurrentUserId();
      
      // Check if a direct chat already exists between these users
      const { data: existingChats, error: searchError } = await supabase
        .from('chat_participants')
        .select(`
          chat_id,
          chats!inner(id, type)
        `)
        .eq('user_id', currentUserId);

      if (!searchError && existingChats) {
        for (const chatParticipant of existingChats) {
          const chat = Array.isArray(chatParticipant.chats) ? chatParticipant.chats[0] : chatParticipant.chats;
          if (chat && chat.type === 'direct') {
            // Check if the friend is also in this chat
            const { data: otherParticipants, error: otherError } = await supabase
              .from('chat_participants')
              .select('user_id')
              .eq('chat_id', chat.id)
              .neq('user_id', currentUserId);

            if (!otherError && otherParticipants) {
              const otherUserIds = otherParticipants.map(p => p.user_id);
                             if (otherUserIds.includes(friendId)) {
                 return chat.id;
               }
            }
          }
        }
      }

      // Create new chat if none exists
      const chatData = {
        type: 'direct',
        created_by: currentUserId,
        name: null, // Direct chats don't need names
        description: null,
      };
      
      const { data: newChat, error: createError } = await supabase
        .from('chats')
        .insert(chatData)
        .select('id')
        .single();

      if (createError) {
        throw new DatabaseError('Failed to create chat', createError);
      }

      if (!newChat || !newChat.id) {
        throw new DatabaseError('Chat created but no ID returned');
      }

      const chatId = newChat.id;

      // Add both participants to the chat
      const { error: participantsError } = await supabase
        .from('chat_participants')
        .insert([
          { 
            chat_id: chatId, 
            user_id: currentUserId,
            role: 'member',
            joined_at: new Date().toISOString(),
          },
          { 
            chat_id: chatId, 
            user_id: friendId,
            role: 'member', 
            joined_at: new Date().toISOString(),
          },
        ]);

      if (participantsError) {
        // Try to clean up the chat that was created
        await supabase.from('chats').delete().eq('id', chatId);
        throw new DatabaseError('Failed to add chat participants', participantsError);
      }
      return chatId;
    } catch (error) {
      console.error('Error getting or creating direct chat:', error);
      throw error instanceof DatabaseError ? error : new DatabaseError('Failed to get or create chat');
    }
  }

  /**
   * Get chat details with other participant info
   */
  async getChatDetails(chatId: string): Promise<Chat> {
    try {
      const currentUserId = await dbUtils.getCurrentUserId();

      const { data: chat, error: chatError } = await supabase
        .from('chats')
        .select('id, name, type, created_at, updated_at')
        .eq('id', chatId)
        .single();

      if (chatError) throw new DatabaseError('Failed to get chat details', chatError);

      // Get the other participant's profile for direct chats
      let otherUser = undefined;
      if (chat.type === 'direct') {
        const { data: participants, error: participantsError } = await supabase
          .from('chat_participants')
          .select(`
            user_id,
            profiles(id, username, avatar_url)
          `)
          .eq('chat_id', chatId)
          .neq('user_id', currentUserId)
          .single();

        if (!participantsError && participants && participants.profiles) {
          const profile = Array.isArray(participants.profiles) ? participants.profiles[0] : participants.profiles;
          otherUser = {
            id: participants.user_id,
            username: profile?.username || 'Unknown',
            avatar_url: profile?.avatar_url || null,
          };
        }
      }

      return {
        ...chat,
        other_user: otherUser,
      };
    } catch (error) {
      console.error('Error getting chat details:', error);
      throw error instanceof DatabaseError ? error : new DatabaseError('Failed to get chat details');
    }
  }

  /**
   * Get messages for a chat with enhanced disappearing message handling
   */
  async getChatMessages(chatId: string, limit = 50, before?: string): Promise<ChatMessage[]> {
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

      // Get chat type to determine if we need disappearing message handling
      const { data: chat } = await supabase
        .from('chats')
        .select('type')
        .eq('id', chatId)
        .single();

      const isDirectChat = chat?.type === 'direct';

      // For direct chats, use enhanced disappearing message service
      if (isDirectChat) {
        const enhancedMessages = await disappearingMessagesService.getEnhancedChatMessages(chatId, limit, before);
        
        // Convert enhanced messages to regular ChatMessage format
        return enhancedMessages.map(msg => ({
          ...msg,
          is_viewed_by_me: msg.is_viewed_by_me,
          sender_username: msg.sender_username || 'Unknown',
        }));
      }

      // For group chats, use regular message fetching
      let query = supabase
        .from('messages')
        .select(`
          *,
          profiles!inner(username, avatar_url)
        `)
        .eq('chat_id', chatId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (before) {
        query = query.lt('created_at', before);
      }

      const { data: messages, error } = await query;

      if (error) {
        throw new DatabaseError('Failed to get chat messages', error);
      }

      const chatMessages: ChatMessage[] = (messages || []).map((message: any) => {
        const profile = Array.isArray(message.profiles) ? message.profiles[0] : message.profiles;
        
        return {
          ...message,
          sender_username: profile?.username || 'Unknown',
          is_viewed_by_me: false, // Not relevant for group chats
          is_disappearing: false, // Group chats don't have disappearing messages
        };
      });

      return chatMessages.reverse(); // Return in chronological order
    } catch (error) {
      throw new DatabaseError('Failed to get chat messages', error);
    }
  }

  /**
   * Send a message with automatic disappearing message handling for direct chats
   */
  async sendMessage(
    chatId: string,
    content?: string,
    mediaUrl?: string,
    mediaType: 'text' | 'photo' | 'video' | 'story_share' = 'text'
  ): Promise<ChatMessage> {
    try {
      console.log('=== sendMessage: Starting ===');
      console.log('sendMessage: Parameters:', { chatId, content, mediaUrl, mediaType });
      
      const userId = await dbUtils.getCurrentUserId();
      console.log('sendMessage: Current user ID:', userId);

      if (!userId) {
        throw new DatabaseError('User not authenticated');
      }

      // Get chat type
      console.log('sendMessage: Getting chat type...');
      const { data: chat, error: chatError } = await supabase
        .from('chats')
        .select('type')
        .eq('id', chatId)
        .single();

      console.log('sendMessage: Chat query result:', { data: chat, error: chatError });

      if (chatError) {
        throw new DatabaseError('Failed to get chat details', chatError);
      }

      const isDirectChat = chat?.type === 'direct';
      console.log('sendMessage: Is direct chat:', isDirectChat);

      // Simplified approach - send regular message for all chat types
      // (Skip disappearing message service for now since we removed the functions)
      
      const insertData = {
        chat_id: chatId,
        sender_id: userId,
        content: content || null,
        media_url: mediaUrl || null,
        media_type: mediaType,
        is_disappearing: isDirectChat, // Mark as disappearing for direct chats
        viewed_by_recipient: false,
        should_disappear: false,
      };

      console.log('sendMessage: Insert data:', insertData);

      // Validate media URL if provided
      if (mediaUrl) {
        console.log('sendMessage: Validating media URL:', mediaUrl);
        if (!mediaUrl.startsWith('http')) {
          console.error('sendMessage: Invalid media URL format:', mediaUrl);
          throw new DatabaseError('Invalid media URL format');
        }
      }

      const { data: message, error: messageError } = await supabase
        .from('messages')
        .insert(insertData)
        .select(`*`)
        .single();

      console.log('sendMessage: Message insert result:', { data: message, error: messageError });

      if (messageError) {
        console.error('sendMessage: Message insert error details:', JSON.stringify({
          message: messageError.message,
          details: messageError.details,
          hint: messageError.hint,
          code: messageError.code,
          fullError: messageError
        }, null, 2));
        throw new DatabaseError('Failed to send message', messageError);
      }

      console.log('sendMessage: Message inserted successfully, updating chat timestamp...');

      // Update chat's updated_at timestamp
      const { error: updateError } = await supabase
        .from('chats')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', chatId);

      if (updateError) {
        console.warn('sendMessage: Failed to update chat timestamp:', updateError);
      }

      console.log('sendMessage: Getting sender profile...');

      // Get sender profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .eq('id', userId)
        .single();

      console.log('sendMessage: Profile query result:', { data: profile, error: profileError });

      const finalMessage = {
        ...message,
        sender_username: profile?.username || 'Unknown',
        is_viewed_by_me: false,
      };

      console.log('sendMessage: Returning final message:', finalMessage);
      return finalMessage;

    } catch (error) {
      console.error('sendMessage: Caught error:', {
        error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorName: error instanceof Error ? error.name : 'Unknown',
        errorStack: error instanceof Error ? error.stack : undefined
      });
      throw error instanceof DatabaseError ? error : new DatabaseError('Failed to send message', error);
    }
  }

  /**
   * Mark a message as viewed (for disappearing messages)
   */
  async markMessageAsViewed(messageId: string): Promise<void> {
    try {
      await disappearingMessagesService.markMessageAsViewed(messageId);
    } catch (error) {
      throw new DatabaseError('Failed to mark message as viewed', error);
    }
  }

  /**
   * Enter a chat (mark presence as active)
   */
  async enterChat(chatId: string): Promise<void> {
    try {
      await disappearingMessagesService.updateChatPresence(chatId, true);
    } catch (error) {
      console.warn('Failed to update chat presence on enter:', error);
    }
  }

  /**
   * Leave a chat (mark presence as inactive and trigger cleanup)
   */
  async leaveChat(chatId: string): Promise<void> {
    try {
      await disappearingMessagesService.leaveChatPresence(chatId);
    } catch (error) {
      console.warn('Failed to update chat presence on leave:', error);
    }
  }

  /**
   * Subscribe to real-time messages with disappearing message support
   */
  subscribeToMessages(chatId: string, onMessage: (message: ChatMessage) => void) {
    const channel = supabase
      .channel(`chat-${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`,
        },
        async (payload) => {
          try {
            // Fetch the complete message with sender profile
            const { data: message, error } = await supabase
              .from('messages')
              .select(`
                *,
                profiles(username, avatar_url)
              `)
              .eq('id', payload.new.id)
              .single();

            if (error) {
              console.error('Error fetching new message:', error);
              return;
            }
            
            const profile = Array.isArray(message.profiles) ? message.profiles[0] : message.profiles;
            const formattedMessage: ChatMessage = {
              id: message.id,
              chat_id: message.chat_id,
              sender_id: message.sender_id,
              content: message.content,
              media_url: message.media_url,
              media_type: message.media_type,
              created_at: message.created_at,
              sender_username: profile?.username || 'Unknown',
              is_disappearing: message.is_disappearing || false,
              viewed_by_recipient: message.viewed_by_recipient || false,
              viewed_at: message.viewed_at,
              should_disappear: message.should_disappear || false,
              can_be_viewed: true,
            };
            
            onMessage(formattedMessage);
          } catch (error) {
            console.error('Error processing real-time message:', error);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          // Handle message disappearing - could emit a special event or remove from UI
          console.log('Message disappeared:', payload.old.id);
        }
      )
      .subscribe();
    
    return channel;
  }

  /**
   * Get all chats for the current user (both direct and group chats)
   */
  async getUserChats(): Promise<Chat[]> {
    try {
      console.log('=== getUserChats: Starting ===');
      
      // Check authentication first
      const currentUserId = await dbUtils.getCurrentUserId();
      console.log('getUserChats: Current user ID:', currentUserId);
      
      if (!currentUserId) {
        console.error('getUserChats: No authenticated user found');
        throw new DatabaseError('User not authenticated');
      }

      // First, get all chat IDs where the user is a participant
      console.log('getUserChats: Querying chat_participants for user:', currentUserId);
      const { data: chatParticipants, error: participantsError } = await supabase
        .from('chat_participants')
        .select('chat_id')
        .eq('user_id', currentUserId);

      console.log('getUserChats: Chat participants query result:', {
        data: chatParticipants,
        error: participantsError,
        errorDetails: participantsError ? {
          message: participantsError.message,
          details: participantsError.details,
          hint: participantsError.hint,
          code: participantsError.code
        } : null
      });

      if (participantsError) {
        console.error('Error getting chat participants (detailed):', JSON.stringify({
          message: participantsError.message,
          details: participantsError.details,
          hint: participantsError.hint,
          code: participantsError.code,
          fullError: participantsError
        }, null, 2));
        throw new DatabaseError('Failed to get user chat participants', participantsError);
      }

      // If user has no chats, return empty array
      if (!chatParticipants || chatParticipants.length === 0) {
        console.log('getUserChats: User has no chats, returning empty array');
        return [];
      }

      const chatIds = chatParticipants.map(cp => cp.chat_id);
      console.log('getUserChats: Found chat IDs:', chatIds);

      // Get chat details for all user's chats
      const { data: userChats, error: chatsError } = await supabase
        .from('chats')
        .select('id, name, type, created_at, updated_at, created_by')
        .in('id', chatIds)
        .order('updated_at', { ascending: false });

      if (chatsError) {
        console.error('Error getting chats:', chatsError);
        throw new DatabaseError('Failed to get user chats', chatsError);
      }

      if (!userChats || userChats.length === 0) {
        console.log('getUserChats: No valid chats found');
        return [];
      }

      console.log('getUserChats: Found chats:', userChats.length);
      const chats: Chat[] = [];

      // Process each chat to add additional info
      for (const chat of userChats) {
        console.log(`getUserChats: Processing chat ${chat.id} (${chat.type})`);
        
        let chatInfo: Chat = {
          id: chat.id,
          name: chat.name,
          type: chat.type,
          created_at: chat.created_at,
          updated_at: chat.updated_at,
        };

        try {
          // For direct chats, get the other user's info
          if (chat.type === 'direct') {
            console.log(`Processing direct chat ${chat.id}, looking for other participant...`);
            
            // First get the other participant's user_id
            const { data: otherParticipantData, error: participantError } = await supabase
              .from('chat_participants')
              .select('user_id')
              .eq('chat_id', chat.id)
              .neq('user_id', currentUserId)
              .single();

            console.log(`Other participant query result:`, { 
              data: otherParticipantData, 
              error: participantError 
            });

            if (!participantError && otherParticipantData) {
              console.log(`Found other participant: ${otherParticipantData.user_id}, getting profile...`);
              
              // Then get their profile info
              const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('id, username, avatar_url')
                .eq('id', otherParticipantData.user_id)
                .single();

              console.log(`Profile query result:`, { 
                data: profileData, 
                error: profileError 
              });

              if (!profileError && profileData) {
                console.log(`Successfully got profile for ${profileData.username}`);
                
                chatInfo.other_user = {
                  id: profileData.id,
                  username: profileData.username || 'Unknown User',
                  avatar_url: profileData.avatar_url || null,
                };
                
                // For direct chats, use the other user's name as the chat name if no name is set
                if (!chatInfo.name || chatInfo.name === 'Test Chat' || chatInfo.name === 'Chat with Jane') {
                  chatInfo.name = profileData.username || 'Unknown User';
                  console.log(`Set chat name to: ${chatInfo.name}`);
                }
              } else {
                console.warn(`Could not get profile for user ${otherParticipantData.user_id}:`, profileError);
                chatInfo.other_user = {
                  id: otherParticipantData.user_id,
                  username: 'Unknown User',
                  avatar_url: null,
                };
                chatInfo.name = 'Unknown User';
              }
            } else {
              console.warn(`Could not find other participant for chat ${chat.id}:`, participantError);
              chatInfo.name = 'No Other Participant';
            }
            
            console.log(`Final chat info for ${chat.id}:`, {
              name: chatInfo.name,
              other_user: chatInfo.other_user
            });
          }

          // For group chats, get participant count
          if (chat.type === 'group') {
            const { count: participantCount, error: countError } = await supabase
              .from('chat_participants')
              .select('*', { count: 'exact', head: true })
              .eq('chat_id', chat.id);

            if (!countError) {
              chatInfo.participant_count = participantCount || 0;
            }
          }

          // Get the last message for this chat
          const { data: lastMessage, error: messageError } = await supabase
            .from('messages')
            .select(`
              content,
              created_at,
              sender_id,
              profiles!inner(username)
            `)
            .eq('chat_id', chat.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (!messageError && lastMessage && lastMessage.profiles) {
            const senderProfile = Array.isArray(lastMessage.profiles) 
              ? lastMessage.profiles[0] 
              : lastMessage.profiles;
            
            chatInfo.last_message = {
              content: lastMessage.content || 'Media message',
              created_at: lastMessage.created_at,
              sender_username: senderProfile?.username || 'Unknown',
            };
          }

          // TODO: Check for unread messages (would need a more complex query)
          chatInfo.has_unread_messages = false;

          chats.push(chatInfo);
        } catch (chatError) {
          console.warn(`Error processing chat ${chat.id}:`, chatError);
          // Still add the basic chat info even if additional details fail
          chats.push(chatInfo);
        }
      }

      console.log(`getUserChats: Successfully loaded ${chats.length} chats for user`);
      return chats;

    } catch (error) {
      console.error('getUserChats: Error getting user chats:', {
        error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorName: error instanceof Error ? error.name : 'Unknown',
        errorStack: error instanceof Error ? error.stack : undefined
      });
      throw error instanceof DatabaseError ? error : new DatabaseError('Failed to get user chats');
    }
  }
}

export const chatService = new ChatService();
export default chatService; 