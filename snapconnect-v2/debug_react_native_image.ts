/**
 * Debug React Native Image Component
 * 
 * Test if the issue is specifically with React Native Image component
 * or with the image URLs themselves
 */

export async function debugReactNativeImage() {
  console.log('🧪 Testing React Native Image Component...');
  
  // Test URLs
  const testUrls = [
    // Your failing image
    'https://oqlcohxsnnguzfsfkayx.supabase.co/storage/v1/object/public/media/14243396-afe6-49b2-8854-e467e46513cc/chat-media/1750989343380-ixwbg7.jpg',
    // A known working image from the internet
    'https://picsum.photos/200/200',
    // Another test image
    'https://via.placeholder.com/200x200/FF0000/FFFFFF?text=Test'
  ];
  
  for (const url of testUrls) {
    console.log(`\n🔄 Testing URL: ${url}`);
    
    try {
      // Test 1: Fetch the URL
      const response = await fetch(url);
      console.log('📊 Fetch result:', {
        status: response.status,
        statusText: response.statusText,
        contentType: response.headers.get('content-type'),
        contentLength: response.headers.get('content-length')
      });
      
      if (!response.ok) {
        console.error('❌ Fetch failed');
        continue;
      }
      
      // Test 2: Check if it's a valid image
      const contentType = response.headers.get('content-type');
      if (!contentType?.startsWith('image/')) {
        console.error('❌ Not an image content type:', contentType);
        continue;
      }
      
      console.log('✅ URL is accessible and returns image content');
      
      // Test 3: Check response size
      const contentLength = response.headers.get('content-length');
      if (contentLength) {
        const sizeKB = parseInt(contentLength) / 1024;
        console.log(`📊 Image size: ${sizeKB.toFixed(2)} KB`);
        
        if (sizeKB > 5000) { // 5MB
          console.log('⚠️ Large image file - might cause React Native issues');
        }
      }
      
    } catch (error) {
      console.error('❌ Failed to fetch URL:', error);
    }
  }
  
  console.log('\n🔍 Checking React Native Image limitations...');
  console.log('Common React Native Image issues:');
  console.log('1. CORS headers missing from server');
  console.log('2. Image too large (>10MB can cause crashes)');
  console.log('3. Unsupported image format');
  console.log('4. Network security policy blocking HTTP (should use HTTPS)');
  console.log('5. Android network security config blocking certain domains');
  console.log('6. Image URL requires authentication headers');
  
  console.log('\n💡 Recommended solutions:');
  console.log('1. Check if images work in browser');
  console.log('2. Try smaller test images');
  console.log('3. Check Android network security config');
  console.log('4. Verify CORS headers on Supabase storage');
}

// Make available globally
(global as any).debugReactNativeImage = debugReactNativeImage; 