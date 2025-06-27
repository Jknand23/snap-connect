/**
 * Debug Script: Storage Test
 * 
 * This script helps debug storage-related issues by testing:
 * 1. Storage bucket accessibility
 * 2. Upload permissions
 * 3. URL generation
 * 4. Image accessibility
 */

import { supabase } from './src/services/database/supabase';

export async function debugStorageTest() {
  console.log('🧪 Starting storage debug test...');
  
  try {
    // Test 0: Check authentication first
    console.log('\n0. Testing authentication...');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('❌ Authentication error:', userError);
      console.log('💡 Please sign in to test storage');
      return;
    }
    
    if (!user) {
      console.error('❌ Not authenticated - no user found');
      console.log('💡 Please sign in to test storage');
      return;
    }
    
    console.log('✅ Authenticated user:', { id: user.id, email: user.email });
    
    // Test 1: Check if media bucket exists
    console.log('\n1. Testing bucket existence...');
    console.log('Calling supabase.storage.listBuckets()...');
    
    const bucketsResult = await supabase.storage.listBuckets();
    console.log('Raw buckets result:', bucketsResult);
    
    const { data: buckets, error: bucketsError } = bucketsResult;
    console.log('Parsed buckets data:', buckets);
    console.log('Buckets error:', bucketsError);
    
    if (bucketsError) {
      console.error('❌ Error listing buckets:', bucketsError);
      console.log('💡 This might be a permissions issue. Check your RLS policies.');
      return;
    }
    
    if (!buckets || buckets.length === 0) {
      console.error('❌ No buckets found or access denied');
      console.log('💡 Possible causes:');
      console.log('  - Storage RLS policies are blocking access');
      console.log('  - User doesn\'t have permission to list buckets');
      console.log('  - Bucket doesn\'t exist');
      console.log('💡 Try accessing storage directly in Supabase Dashboard');
      return;
    }
    
    console.log('✅ Found buckets:', buckets.map(b => ({ id: b.id, public: b.public })));
    
    const mediaBucket = buckets?.find(bucket => bucket.id === 'media');
    if (mediaBucket) {
      console.log('✅ Media bucket exists:', {
        id: mediaBucket.id,
        public: mediaBucket.public,
        createdAt: mediaBucket.created_at
      });
    } else {
      console.error('❌ Media bucket not found. Available buckets:', buckets?.map(b => b.id));
      console.log('💡 Run the setup_storage.sql script in your Supabase SQL Editor');
      return;
    }
    
    // Test 2: Try to upload a test file
    console.log('\n2. Testing file upload...');
    const testData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    const testFileName = `${user.id}/test/debug-test-${Date.now()}.png`;
    
    // Convert base64 to blob
    const byteCharacters = atob(testData.split(',')[1]);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/png' });
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('media')
      .upload(testFileName, blob, {
        contentType: 'image/png',
        upsert: true
      });
    
    if (uploadError) {
      console.error('❌ Upload failed:', uploadError);
      console.log('💡 Check your storage policies in Supabase Dashboard > Storage > Policies');
      return;
    }
    
    console.log('✅ Upload successful:', uploadData);
    
    // Test 3: Generate and test public URL
    console.log('\n3. Testing public URL generation...');
    const { data: urlData } = supabase.storage
      .from('media')
      .getPublicUrl(testFileName);
    
    const publicUrl = urlData.publicUrl;
    console.log('✅ Public URL generated:', publicUrl);
    
    // Test 4: Test URL accessibility
    console.log('\n4. Testing URL accessibility...');
    try {
      const response = await fetch(publicUrl, { method: 'HEAD' });
      if (response.ok) {
        console.log('✅ URL is accessible:', response.status);
      } else {
        console.error('❌ URL not accessible:', response.status, response.statusText);
      }
    } catch (fetchError) {
      console.error('❌ Error testing URL:', fetchError);
    }
    
    // Test 5: Clean up test file
    console.log('\n5. Cleaning up test file...');
    const { error: deleteError } = await supabase.storage
      .from('media')
      .remove([testFileName]);
    
    if (deleteError) {
      console.warn('⚠️ Could not delete test file:', deleteError);
    } else {
      console.log('✅ Test file cleaned up');
    }
    
    console.log('\n🎉 Storage test completed successfully!');
    
  } catch (error) {
    console.error('❌ Storage test failed:', error);
  }
}

// Make it available globally for debugging in React Native
if (typeof global !== 'undefined') {
  (global as any).debugStorageTest = debugStorageTest;
}

console.log('💡 To run this test, call: debugStorageTest()'); 