/**
 * Debug Fix Image Upload
 * 
 * Test and fix the image upload process to ensure images have actual data
 */

import { supabase } from './src/services/database/supabase';
import * as FileSystem from 'expo-file-system';

export async function debugFixImageUpload() {
  console.log('🧪 Testing Image Upload Fix...');
  
  try {
    // Check authentication first
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('❌ Authentication failed:', authError);
      return;
    }
    
    console.log('✅ User authenticated:', user.id);
    
    // Create a test image (base64 data URI)
    const testImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
    
    console.log('🎨 Created test image (1x1 red pixel)');
    
    // Test upload methods
    await testUploadMethod1(user.id, testImageBase64);
    await testUploadMethod2(user.id, testImageBase64);
    await testUploadMethod3(user.id, testImageBase64);
    
  } catch (error) {
    console.error('❌ Debug fix failed:', error);
  }
}

/**
 * Method 1: Upload using fetch + blob (current broken method)
 */
async function testUploadMethod1(userId: string, imageData: string) {
  console.log('\n🔬 Testing Method 1: Fetch + Blob (current method)');
  
  try {
    const fileName = `test-method1-${Date.now()}.png`;
    const filePath = `${userId}/test-uploads/${fileName}`;
    
    // This is the current broken approach
    const response = await fetch(imageData);
    const blob = await response.blob();
    
    console.log('📊 Blob info:', {
      size: blob.size,
      type: blob.type
    });
    
    const { data, error } = await supabase.storage
      .from('media')
      .upload(filePath, blob, {
        contentType: 'image/png',
        upsert: false
      });
    
    if (error) {
      console.error('❌ Method 1 failed:', error);
    } else {
      console.log('✅ Method 1 success:', data);
      
      // Test the uploaded file
      const { data: urlData } = supabase.storage
        .from('media')
        .getPublicUrl(filePath);
      
      const testResponse = await fetch(urlData.publicUrl);
      console.log('📊 Uploaded file size:', testResponse.headers.get('content-length'));
    }
  } catch (error) {
    console.error('❌ Method 1 error:', error);
  }
}

/**
 * Method 2: Upload using FileSystem (recommended for React Native)
 */
async function testUploadMethod2(userId: string, imageData: string) {
  console.log('\n🔬 Testing Method 2: FileSystem (recommended)');
  
  try {
    const fileName = `test-method2-${Date.now()}.png`;
    const filePath = `${userId}/test-uploads/${fileName}`;
    
    // Convert base64 to file
    const base64Data = imageData.split(',')[1]; // Remove data:image/png;base64, prefix
    const tempFilePath = `${FileSystem.documentDirectory}temp_${fileName}`;
    
    await FileSystem.writeAsStringAsync(tempFilePath, base64Data, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    console.log('📄 Temp file created:', tempFilePath);
    
    // Get file info
    const fileInfo = await FileSystem.getInfoAsync(tempFilePath);
    console.log('📊 File info:', fileInfo);
    
    // Upload using file URI
    const { data, error } = await supabase.storage
      .from('media')
      .upload(filePath, {
        uri: tempFilePath,
        type: 'image/png',
        name: fileName,
      } as any, {
        contentType: 'image/png',
        upsert: false
      });
    
    if (error) {
      console.error('❌ Method 2 failed:', error);
    } else {
      console.log('✅ Method 2 success:', data);
      
      // Test the uploaded file
      const { data: urlData } = supabase.storage
        .from('media')
        .getPublicUrl(filePath);
      
      const testResponse = await fetch(urlData.publicUrl);
      console.log('📊 Uploaded file size:', testResponse.headers.get('content-length'));
    }
    
    // Clean up temp file
    await FileSystem.deleteAsync(tempFilePath, { idempotent: true });
    
  } catch (error) {
    console.error('❌ Method 2 error:', error);
  }
}

/**
 * Method 3: Upload using ArrayBuffer (alternative approach)
 */
async function testUploadMethod3(userId: string, imageData: string) {
  console.log('\n🔬 Testing Method 3: ArrayBuffer');
  
  try {
    const fileName = `test-method3-${Date.now()}.png`;
    const filePath = `${userId}/test-uploads/${fileName}`;
    
    // Convert base64 to ArrayBuffer
    const base64Data = imageData.split(',')[1];
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    console.log('📊 ArrayBuffer info:', {
      length: bytes.length,
      type: 'Uint8Array'
    });
    
    const { data, error } = await supabase.storage
      .from('media')
      .upload(filePath, bytes, {
        contentType: 'image/png',
        upsert: false
      });
    
    if (error) {
      console.error('❌ Method 3 failed:', error);
    } else {
      console.log('✅ Method 3 success:', data);
      
      // Test the uploaded file
      const { data: urlData } = supabase.storage
        .from('media')
        .getPublicUrl(filePath);
      
      const testResponse = await fetch(urlData.publicUrl);
      console.log('📊 Uploaded file size:', testResponse.headers.get('content-length'));
    }
  } catch (error) {
    console.error('❌ Method 3 error:', error);
  }
}

/**
 * Test uploading a real camera photo
 */
export async function testRealPhotoUpload(photoUri: string) {
  console.log('📸 Testing real photo upload:', photoUri);
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    
    // Get file info
    const fileInfo = await FileSystem.getInfoAsync(photoUri);
    console.log('📊 Photo file info:', fileInfo);
    
    if (!fileInfo.exists) {
      throw new Error('Photo file does not exist');
    }
    
    const fileName = `real-photo-${Date.now()}.jpg`;
    const filePath = `${user.id}/test-uploads/${fileName}`;
    
    // Method 1: Try with FormData (recommended for React Native)
    const formData = new FormData();
    formData.append('file', {
      uri: photoUri,
      type: 'image/jpeg',
      name: fileName,
    } as any);
    
    console.log('📤 Uploading real photo...');
    
    const { data, error } = await supabase.storage
      .from('media')
      .upload(filePath, formData, {
        contentType: 'image/jpeg',
        upsert: false
      });
    
    if (error) {
      console.error('❌ Real photo upload failed:', error);
    } else {
      console.log('✅ Real photo upload success:', data);
      
      // Test the uploaded file
      const { data: urlData } = supabase.storage
        .from('media')
        .getPublicUrl(filePath);
      
      const testResponse = await fetch(urlData.publicUrl);
      console.log('📊 Real photo uploaded size:', testResponse.headers.get('content-length'));
    }
    
  } catch (error) {
    console.error('❌ Real photo test failed:', error);
  }
}

// Make available globally
(global as any).debugFixImageUpload = debugFixImageUpload;
(global as any).testRealPhotoUpload = testRealPhotoUpload; 