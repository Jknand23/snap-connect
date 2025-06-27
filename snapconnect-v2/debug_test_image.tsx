/**
 * Test Image Component
 * 
 * Simple test to verify React Native Image component works with known good URLs
 */
import React from 'react';
import { View, Text, Image as RNImage } from 'react-native';

export function TestImageComponent() {
  return (
    <View style={{ padding: 20, backgroundColor: '#000' }}>
      <Text style={{ color: 'white', marginBottom: 10 }}>Testing React Native Image:</Text>
      
      {/* Test 1: Simple placeholder image */}
      <RNImage
        source={{ uri: 'https://via.placeholder.com/200x200/FF0000/FFFFFF?text=Test1' }}
        style={{ width: 200, height: 200, marginBottom: 10 }}
        onLoad={() => console.log('✅ Test image 1 loaded')}
        onError={(error) => console.error('❌ Test image 1 failed:', error)}
      />
      
      {/* Test 2: Picsum photo */}
      <RNImage
        source={{ uri: 'https://picsum.photos/200/200?random=1' }}
        style={{ width: 200, height: 200, marginBottom: 10 }}
        onLoad={() => console.log('✅ Test image 2 loaded')}
        onError={(error) => console.error('❌ Test image 2 failed:', error)}
      />
      
      {/* Test 3: Your Supabase image */}
      <RNImage
        source={{ uri: 'https://oqlcohxsnnguzfsfkayx.supabase.co/storage/v1/object/public/media/14243396-afe6-49b2-8854-e467e46513cc/chat-media/1750989343380-ixwbg7.jpg' }}
        style={{ width: 200, height: 200, marginBottom: 10 }}
        onLoad={() => console.log('✅ Supabase image loaded')}
        onError={(error) => console.error('❌ Supabase image failed:', error)}
      />
    </View>
  );
} 