/**
 * Story Upload Debug & Fix Script
 * 
 * This script will test story upload functionality and provide fixes for common issues
 */

import { supabase } from './src/services/database/supabase';
import { StoriesService } from './src/services/stories/storiesService';

export async function debugStoryUpload() {
  console.log('🔍 Starting Story Upload Debug...\n');
  
  try {
    // 1. Check authentication
    console.log('1️⃣ Checking Authentication...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('❌ Authentication failed:', authError);
      return;
    }
    console.log('✅ User authenticated:', user.id);
    console.log('📧 User email:', user.email);

    // 2. Check if stories table exists and is accessible
    console.log('\n2️⃣ Checking Stories Table Access...');
    const { data: storiesCheck, error: storiesError } = await supabase
      .from('stories')
      .select('count(*)')
      .limit(1);
    
    if (storiesError) {
      console.error('❌ Stories table access error:', storiesError);
      console.log('💡 This might be a Row Level Security (RLS) policy issue');
    } else {
      console.log('✅ Stories table accessible');
    }

    // 3. Check storage bucket access
    console.log('\n3️⃣ Checking Storage Bucket Access...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Storage buckets error:', bucketsError);
    } else {
      console.log('✅ Storage buckets accessible:');
      buckets?.forEach(bucket => {
        console.log(`   - ${bucket.name} (${bucket.public ? 'public' : 'private'})`);
      });
    }

    // 4. Test story creation with simple data
    console.log('\n4️⃣ Testing Story Creation...');
    const storiesService = new StoriesService();
    
    try {
      const testStory = await storiesService.createStory({
        mediaUrl: 'https://via.placeholder.com/400x600/0066FF/FFFFFF?text=DEBUG+TEST',
        mediaType: 'photo',
        caption: 'Debug test story - please ignore',
        privacySetting: 'friends'
      });
      console.log('✅ Story created successfully:', testStory.id);
      
      // 5. Test getting user stories
      console.log('\n5️⃣ Testing Story Retrieval...');
      const userStories = await storiesService.getUserStories();
      console.log(`✅ Retrieved ${userStories.length} user stories`);
      
      // 6. Test stories feed
      console.log('\n6️⃣ Testing Stories Feed...');
      const storiesFeed = await storiesService.getStoriesFeed();
      console.log(`✅ Retrieved stories feed: ${storiesFeed.length} users with stories`);
      
      storiesFeed.forEach((feed, index) => {
        console.log(`   ${index + 1}. ${feed.user.username}: ${feed.stories.length} stories (${feed.hasUnviewed ? 'has unviewed' : 'all viewed'})`);
      });

    } catch (storyError) {
      console.error('❌ Story creation failed:', storyError);
      
      if (storyError instanceof Error) {
        if (storyError.message.includes('row-level security')) {
          console.log('\n🔧 RLS POLICY ISSUE DETECTED');
          console.log('   The stories table has Row Level Security enabled but no policies allow your user to insert/select stories.');
          console.log('   Solution: Add RLS policies for the stories table in your Supabase dashboard.');
        }
      }
    }

    // 7. Test file upload to storage (if media bucket exists)
    console.log('\n7️⃣ Testing File Upload...');
    const mediaExists = buckets?.some(b => b.name === 'media');
    
    if (mediaExists) {
      try {
        // Create a simple test file
        const testBlob = new Blob(['test-image-data'], { type: 'image/jpeg' });
        const testFileName = `debug-test-${Date.now()}.jpg`;
        const testPath = `${user.id}/stories/${testFileName}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('media')
          .upload(testPath, testBlob, {
            contentType: 'image/jpeg',
            upsert: false
          });

        if (uploadError) {
          console.error('❌ File upload failed:', uploadError);
          
          if (uploadError.message.includes('row-level security')) {
            console.log('\n🔧 STORAGE RLS POLICY ISSUE DETECTED');
            console.log('   The media bucket has Row Level Security enabled but no policies allow your user to upload files.');
            console.log('   Solution: Add storage policies for the media bucket in your Supabase dashboard.');
          }
        } else {
          console.log('✅ Test file uploaded successfully:', uploadData.path);
          
          // Test public URL generation
          const { data: urlData } = supabase.storage
            .from('media')
            .getPublicUrl(testPath);
          console.log('✅ Public URL generated:', urlData.publicUrl);
          
          // Clean up test file
          await supabase.storage.from('media').remove([testPath]);
          console.log('✅ Test file cleaned up');
        }
        
      } catch (uploadTestError) {
        console.error('❌ Upload test error:', uploadTestError);
      }
    } else {
      console.log('⚠️ Media bucket not found. You may need to create it in Supabase Storage.');
    }

    console.log('\n🎯 DEBUG SUMMARY:');
    console.log('================');
    console.log('If you see any ❌ errors above, those are the issues preventing story uploads.');
    console.log('Most common fixes:');
    console.log('1. Add RLS policies for stories table');
    console.log('2. Add storage policies for media bucket');
    console.log('3. Ensure media bucket exists and is properly configured');

  } catch (error) {
    console.error('💥 Debug script failed:', error);
  }
}

// Also provide the SQL to fix common RLS issues
export const REQUIRED_POLICIES = `
-- Stories table policies (add these in Supabase Dashboard > Authentication > Policies)

-- Allow users to insert their own stories
CREATE POLICY "Users can insert their own stories" ON public.stories
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow users to view public stories and their own stories
CREATE POLICY "Users can view stories" ON public.stories
FOR SELECT USING (
  privacy_setting = 'public' 
  OR user_id = auth.uid()
  OR privacy_setting = 'friends' -- Will need friend filtering later
);

-- Allow users to update their own stories
CREATE POLICY "Users can update their own stories" ON public.stories
FOR UPDATE USING (auth.uid() = user_id);

-- Allow users to delete their own stories
CREATE POLICY "Users can delete their own stories" ON public.stories
FOR DELETE USING (auth.uid() = user_id);

-- Story views policies
CREATE POLICY "Users can insert story views" ON public.story_views
FOR INSERT WITH CHECK (auth.uid() = viewer_id);

CREATE POLICY "Users can view story views for their stories" ON public.story_views
FOR SELECT USING (
  viewer_id = auth.uid() 
  OR EXISTS (
    SELECT 1 FROM public.stories 
    WHERE stories.id = story_views.story_id 
    AND stories.user_id = auth.uid()
  )
);

-- Storage policies (add these in Supabase Dashboard > Storage > Policies)

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload to their own stories folder" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'media' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to view public files
CREATE POLICY "Anyone can view media files" ON storage.objects
FOR SELECT USING (bucket_id = 'media');

-- Allow users to delete their own files
CREATE POLICY "Users can delete their own files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'media' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
`;

// Run the debug if this file is executed directly
if (require.main === module) {
  debugStoryUpload();
} 