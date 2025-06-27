/**
 * Debug Story Test
 * 
 * Test story creation functionality
 */

import { supabase } from './src/services/database/supabase';
import { StoriesService } from './src/services/stories/storiesService';

export async function debugStoryTest() {
  console.log('🧪 Testing Story Creation...');
  
  try {
    // Check authentication first
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('❌ Authentication failed:', authError);
      return;
    }
    
    console.log('✅ User authenticated:', user.id);
    
    // Test story creation with a placeholder image
    const storiesService = new StoriesService();
    
    console.log('📱 Creating test story...');
    
    const testStory = await storiesService.createStory({
      mediaUrl: 'https://via.placeholder.com/400x600/FF0000/FFFFFF?text=Test+Story',
      mediaType: 'photo',
      caption: 'Test story from debug function',
      privacySetting: 'friends'
    });
    
    console.log('✅ Story created successfully:', {
      id: testStory.id,
      mediaUrl: testStory.media_url,
      expiresAt: testStory.expires_at
    });
    
    // Test getting user stories
    console.log('📚 Getting user stories...');
    const userStories = await storiesService.getUserStories();
    console.log('✅ User stories retrieved:', userStories.length);
    
    userStories.forEach((story, index) => {
      console.log(`  ${index + 1}. ${story.id} - ${story.media_type} (expires: ${story.expires_at})`);
    });
    
    // Test getting stories feed
    console.log('📰 Getting stories feed...');
    const storiesFeed = await storiesService.getStoriesFeed();
    console.log('✅ Stories feed retrieved:', storiesFeed.length, 'users');
    
    storiesFeed.forEach((userFeed, index) => {
      console.log(`  ${index + 1}. ${userFeed.user.username} - ${userFeed.stories.length} stories (unviewed: ${userFeed.hasUnviewed})`);
    });
    
    console.log('🏁 Story test complete');
    
  } catch (error) {
    console.error('❌ Story test failed:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
  }
}

// Make available globally
(global as any).debugStoryTest = debugStoryTest; 