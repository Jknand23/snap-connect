/**
 * Debug Script for Chat System
 * 
 * Run this to test chat functionality and identify issues.
 * Use: npx ts-node debug_chat_system.ts
 */

import { supabase } from './src/services/database/supabase';

async function debugChatSystem() {
  console.log('🔍 Starting chat system debug...');

  try {
    // Test authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('❌ Authentication failed:', authError);
      return;
    }
    console.log('✅ User authenticated:', user.id);

    // Test basic table access
    console.log('\n📋 Testing table access...');
    
    // Test profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (profileError) {
      console.error('❌ Profile query failed:', profileError);
    } else {
      console.log('✅ Profile found:', profile?.username);
    }

    // Test chat_participants table
    const { data: participants, error: participantsError } = await supabase
      .from('chat_participants')
      .select('chat_id')
      .eq('user_id', user.id);
    
    if (participantsError) {
      console.error('❌ Chat participants query failed:', participantsError);
    } else {
      console.log('✅ Chat participants found:', participants?.length || 0);
    }

    // Test chats table
    const { data: chats, error: chatsError } = await supabase
      .from('chats')
      .select('*')
      .eq('created_by', user.id);
    
    if (chatsError) {
      console.error('❌ Chats query failed:', chatsError);
    } else {
      console.log('✅ User created chats:', chats?.length || 0);
    }

    // Test the full getUserChats query
    console.log('\n🔄 Testing getUserChats flow...');
    
    const { data: participantData, error: participantError } = await supabase
      .from('chat_participants')
      .select('chat_id')
      .eq('user_id', user.id);

    if (participantError) {
      console.error('❌ Step 1 failed - get participant chat IDs:', participantError);
      return;
    }
    
    console.log('✅ Step 1 - Found participant entries:', participantData?.length || 0);

    if (participantData && participantData.length > 0) {
      const chatIds = participantData.map(p => p.chat_id);
      console.log('📱 Chat IDs to query:', chatIds);

      const { data: chatsData, error: chatsError } = await supabase
        .from('chats')
        .select('*')
        .in('id', chatIds);

      if (chatsError) {
        console.error('❌ Step 2 failed - get chat details:', chatsError);
      } else {
        console.log('✅ Step 2 - Retrieved chat details:', chatsData?.length || 0);
        chatsData?.forEach(chat => {
          console.log(`  - Chat: ${chat.name || 'Unnamed'} (${chat.type})`);
        });
      }
    }

    // Create a test chat if none exist
    if (!participantData || participantData.length === 0) {
      console.log('\n🔨 Creating test chat...');
      
      const { data: testChat, error: createError } = await supabase
        .from('chats')
        .insert({
          type: 'direct',
          created_by: user.id,
          name: 'Test Chat',
          description: 'Test chat for debugging'
        })
        .select()
        .single();

      if (createError) {
        console.error('❌ Failed to create test chat:', createError);
      } else {
        console.log('✅ Test chat created:', testChat.id);
        
        // Add user as participant
        const { error: participantError } = await supabase
          .from('chat_participants')
          .insert({
            chat_id: testChat.id,
            user_id: user.id,
            role: 'admin'
          });

        if (participantError) {
          console.error('❌ Failed to add user as participant:', participantError);
        } else {
          console.log('✅ User added as participant');
        }
      }
    }

    console.log('\n✅ Debug complete!');

  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

// Run the debug if this file is executed directly
if (require.main === module) {
  debugChatSystem();
}

export default debugChatSystem; 