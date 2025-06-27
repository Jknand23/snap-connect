/**
 * Debug Script: Image URL Test
 * 
 * Tests the specific failing image URL to diagnose the issue
 */

export async function debugImageTest() {
  console.log('🧪 Testing specific image URL...');
  
  const imageUrl = 'https://oqlcohxsnnguzfsfkayx.supabase.co/storage/v1/object/public/media/14243396-afe6-49b2-8854-e467e46513cc/chat-media/1750982972428-qn8hv.jpg';
  
  try {
    // Test 1: Basic fetch test
    console.log('\n1. Testing basic URL accessibility...');
    console.log('URL:', imageUrl);
    
    const response = await fetch(imageUrl, { method: 'HEAD' });
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      console.log('✅ URL is accessible via fetch');
      
      // Test 2: Get actual image data
      console.log('\n2. Testing image data download...');
      const imageResponse = await fetch(imageUrl);
      const blob = await imageResponse.blob();
      console.log('Image blob size:', blob.size, 'bytes');
      console.log('Image blob type:', blob.type);
      
      if (blob.size > 0) {
        console.log('✅ Image data downloaded successfully');
        
        // Test 3: Convert to base64 for React Native
        console.log('\n3. Testing base64 conversion...');
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result as string;
          console.log('✅ Base64 conversion successful');
          console.log('Base64 preview:', base64.substring(0, 100) + '...');
          
          // Test 4: Test in React Native Image component
          console.log('\n4. Alternative image loading strategies:');
          console.log('Strategy 1: Use base64 data URI');
          console.log('Strategy 2: Add cache-busting parameter');
          console.log('Strategy 3: Use different image library');
          
          console.log('\n💡 Recommendations:');
          console.log('1. The image URL is accessible and contains valid data');
          console.log('2. This is likely a React Native Image component issue');
          console.log('3. Try using react-native-fast-image for better image handling');
          console.log('4. Consider using expo-image as an alternative');
        };
        reader.readAsDataURL(blob);
      } else {
        console.error('❌ Image blob is empty');
      }
    } else {
      console.error('❌ URL not accessible:', response.status, response.statusText);
    }
    
  } catch (error) {
    console.error('❌ Image test failed:', error);
  }
}

// Test with cache-busting
export async function debugImageTestWithCacheBust() {
  console.log('🧪 Testing image URL with cache busting...');
  
  const baseUrl = 'https://oqlcohxsnnguzfsfkayx.supabase.co/storage/v1/object/public/media/14243396-afe6-49b2-8854-e467e46513cc/chat-media/1750982972428-qn8hv.jpg';
  const cacheBustUrl = baseUrl + '?t=' + Date.now();
  
  try {
    console.log('Cache-bust URL:', cacheBustUrl);
    
    const response = await fetch(cacheBustUrl);
    console.log('Cache-bust response status:', response.status);
    
    if (response.ok) {
      console.log('✅ Cache-bust URL works');
      const blob = await response.blob();
      console.log('Cache-bust blob size:', blob.size, 'bytes');
    } else {
      console.error('❌ Cache-bust URL failed:', response.status);
    }
  } catch (error) {
    console.error('❌ Cache-bust test failed:', error);
  }
}

// Make available globally
if (typeof global !== 'undefined') {
  (global as any).debugImageTest = debugImageTest;
  (global as any).debugImageTestWithCacheBust = debugImageTestWithCacheBust;
}

console.log('💡 To run image tests:');
console.log('  - debugImageTest()');
console.log('  - debugImageTestWithCacheBust()'); 