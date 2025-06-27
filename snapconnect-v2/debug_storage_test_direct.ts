/**
 * Debug Script: Direct Storage Test
 * 
 * Tests storage operations without relying on bucket listing
 * Focuses on actual upload/download functionality
 */

import { supabase } from './src/services/database/supabase';

export async function debugDirectStorageTest() {
  console.log('🧪 Starting direct storage test (bypassing bucket listing)...');
  
  try {
    // Test 0: Check authentication
    console.log('\n0. Testing authentication...');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('❌ Not authenticated:', userError);
      return;
    }
    
    console.log('✅ Authenticated user:', { id: user.id, email: user.email });
    
    // Test 1: Try direct upload to media bucket (this will tell us if bucket exists)
    console.log('\n1. Testing direct upload to media bucket...');
    const testData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    const testFileName = `${user.id}/debug-test/test-${Date.now()}.png`;
    
    // Convert base64 to blob
    const byteCharacters = atob(testData.split(',')[1]);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/png' });
    
    console.log('Attempting upload to path:', testFileName);
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('media')
      .upload(testFileName, blob, {
        contentType: 'image/png',
        upsert: true
      });
    
    if (uploadError) {
      console.error('❌ Upload failed:', uploadError);
      
      if (uploadError.message.includes('Bucket not found')) {
        console.log('💡 Bucket does not exist. Create it in Supabase Dashboard:');
        console.log('   1. Go to Storage in your Supabase dashboard');
        console.log('   2. Click "New bucket"');
        console.log('   3. Name: media, Public: true');
        return;
      } else if (uploadError.message.includes('policy')) {
        console.log('💡 RLS policy issue. Check storage policies in Dashboard.');
        return;
      } else {
        console.log('💡 Unknown upload error. Check your storage configuration.');
        return;
      }
    }
    
    console.log('✅ Upload successful:', uploadData);
    
    // Test 2: Generate public URL
    console.log('\n2. Testing public URL generation...');
    const { data: urlData } = supabase.storage
      .from('media')
      .getPublicUrl(testFileName);
    
    const publicUrl = urlData.publicUrl;
    console.log('✅ Public URL generated:', publicUrl);
    
    // Test 3: Test URL accessibility
    console.log('\n3. Testing URL accessibility...');
    try {
      const response = await fetch(publicUrl, { method: 'HEAD' });
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (response.ok) {
        console.log('✅ URL is accessible');
        
        // Test 4: Download the image data
        console.log('\n4. Testing image download...');
        const downloadResponse = await fetch(publicUrl);
        const downloadBlob = await downloadResponse.blob();
        console.log('Downloaded blob size:', downloadBlob.size, 'bytes');
        console.log('Downloaded blob type:', downloadBlob.type);
        
        if (downloadBlob.size > 0) {
          console.log('✅ Image download successful');
        } else {
          console.log('❌ Downloaded blob is empty');
        }
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
    
    console.log('\n🎉 Direct storage test completed successfully!');
    console.log('💡 Your storage is working correctly. The bucket listing issue is separate.');
    
  } catch (error) {
    console.error('❌ Direct storage test failed:', error);
  }
}

// Test existing image URL directly
export async function debugExistingImageTest() {
  console.log('🧪 Testing existing image URL...');
  
  const imageUrl = 'https://oqlcohxsnnguzfsfkayx.supabase.co/storage/v1/object/public/media/14243396-afe6-49b2-8854-e467e46513cc/chat-media/1750982972428-qn8hv.jpg';
  
  try {
    console.log('Testing URL:', imageUrl);
    
    const response = await fetch(imageUrl, { method: 'HEAD' });
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      console.log('✅ Existing image URL is accessible');
      
      // Get full image data
      const fullResponse = await fetch(imageUrl);
      const blob = await fullResponse.blob();
      console.log('Image size:', blob.size, 'bytes');
      console.log('Image type:', blob.type);
      
      if (blob.size > 0) {
        console.log('✅ Existing image data is valid');
        console.log('💡 The image exists and is accessible. The React Native Image component issue is separate.');
      }
    } else {
      console.error('❌ Existing image URL not accessible:', response.status);
    }
  } catch (error) {
    console.error('❌ Error testing existing image:', error);
  }
}

// Make available globally
if (typeof global !== 'undefined') {
  (global as any).debugDirectStorageTest = debugDirectStorageTest;
  (global as any).debugExistingImageTest = debugExistingImageTest;
}

console.log('💡 To run direct storage tests:');
console.log('  - debugDirectStorageTest() - Test storage without bucket listing');
console.log('  - debugExistingImageTest() - Test your specific failing image'); 