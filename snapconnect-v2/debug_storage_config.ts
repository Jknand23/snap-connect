/**
 * Debug Storage Configuration
 * 
 * Comprehensive test of Supabase storage configuration and policies
 */

import { supabase } from './src/services/database/supabase';

export async function debugStorageConfig() {
  console.log('🧪 Starting Storage Configuration Debug...');
  
  try {
    // Check authentication first
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('❌ Authentication failed:', authError);
      return;
    }
    
    console.log('✅ User authenticated:', user.id);
    
    // Test 1: List all buckets
    console.log('\n📦 Testing bucket access...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Failed to list buckets:', bucketsError);
    } else {
      console.log('✅ Buckets found:', buckets?.length || 0);
      buckets?.forEach(bucket => {
        console.log(`  - ${bucket.name} (public: ${bucket.public}, created: ${bucket.created_at})`);
      });
    }
    
    // Test 2: Check media bucket specifically
    console.log('\n📂 Testing media bucket...');
    const { data: mediaFiles, error: mediaError } = await supabase.storage
      .from('media')
      .list('', { limit: 5 });
    
    if (mediaError) {
      console.error('❌ Failed to access media bucket:', mediaError);
    } else {
      console.log('✅ Media bucket accessible, files found:', mediaFiles?.length || 0);
      mediaFiles?.forEach(file => {
        console.log(`  - ${file.name} (${file.metadata?.size} bytes)`);
      });
    }
    
    // Test 3: Check user's specific folder
    console.log('\n👤 Testing user folder...');
    const userFolder = `${user.id}/chat-media`;
    const { data: userFiles, error: userError } = await supabase.storage
      .from('media')
      .list(userFolder, { limit: 10 });
    
    if (userError) {
      console.error('❌ Failed to access user folder:', userError);
    } else {
      console.log(`✅ User folder accessible (${userFolder}), files:`, userFiles?.length || 0);
      userFiles?.forEach(file => {
        console.log(`  - ${file.name} (${file.metadata?.size} bytes, updated: ${file.updated_at})`);
      });
    }
    
    // Test 4: Test specific image URL
    console.log('\n🖼️ Testing specific image URL...');
    const testImageUrl = 'https://oqlcohxsnnguzfsfkayx.supabase.co/storage/v1/object/public/media/14243396-afe6-49b2-8854-e467e46513cc/chat-media/1750989343380-ixwbg7.jpg';
    
    try {
      const response = await fetch(testImageUrl);
      console.log('📊 Image URL test result:', {
        status: response.status,
        statusText: response.statusText,
        contentType: response.headers.get('content-type'),
        contentLength: response.headers.get('content-length'),
        url: response.url
      });
      
      if (response.ok) {
        console.log('✅ Image URL is accessible via fetch');
      } else {
        console.error('❌ Image URL returned error status');
      }
    } catch (fetchError) {
      console.error('❌ Failed to fetch image URL:', fetchError);
    }
    
    // Test 5: Get public URL for a known file
    console.log('\n🔗 Testing public URL generation...');
    const { data: publicUrlData } = supabase.storage
      .from('media')
      .getPublicUrl('14243396-afe6-49b2-8854-e467e46513cc/chat-media/1750989343380-ixwbg7.jpg');
    
    console.log('📊 Generated public URL:', publicUrlData.publicUrl);
    
    // Test 6: Check storage policies
    console.log('\n🔒 Testing storage policies...');
    try {
      const { data: policies, error: policyError } = await supabase
        .from('storage.policies')
        .select('*')
        .eq('bucket_id', 'media');
      
      if (policyError) {
        console.error('❌ Failed to fetch storage policies:', policyError);
      } else {
        console.log('✅ Storage policies found:', policies?.length || 0);
        policies?.forEach(policy => {
          console.log(`  - ${policy.name}: ${policy.definition}`);
        });
      }
    } catch (policyError) {
      console.log('⚠️ Could not access storage policies table (this is normal)');
    }
    
    console.log('\n🏁 Storage configuration debug complete');
    
  } catch (error) {
    console.error('❌ Storage config debug failed:', error);
  }
}

// Make available globally
(global as any).debugStorageConfig = debugStorageConfig; 