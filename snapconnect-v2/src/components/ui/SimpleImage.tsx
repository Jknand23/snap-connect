/**
 * SimpleImage Component
 * 
 * A simplified image component that uses base64 conversion
 * to bypass React Native Image component issues
 */
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image as RNImage } from 'react-native';

interface SimpleImageProps {
  uri: string;
  width?: number;
  height?: number;
  borderRadius?: number;
  fallbackText?: string;
  onImagePress?: () => void;
}

export function SimpleImage({
  uri,
  width = 200,
  height = 200,
  borderRadius = 12,
  fallbackText = "Image",
  onImagePress,
}: SimpleImageProps) {
  const [base64Data, setBase64Data] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    convertToBase64();
  }, [uri]);

  const convertToBase64 = async () => {
    try {
      setIsLoading(true);
      setHasError(false);
      console.log('🔄 SimpleImage: Converting to base64:', uri);
      
      const response = await fetch(uri);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      // Get the image as array buffer
      const arrayBuffer = await response.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      
      // Convert to base64
      let binary = '';
      const chunkSize = 8192;
      for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.slice(i, i + chunkSize);
        binary += String.fromCharCode.apply(null, Array.from(chunk));
      }
      
      const base64 = btoa(binary);
      const mimeType = response.headers.get('content-type') || 'image/jpeg';
      const dataUri = `data:${mimeType};base64,${base64}`;
      
      console.log('✅ SimpleImage: Base64 conversion successful');
      setBase64Data(dataUri);
      setIsLoading(false);
      
    } catch (error) {
      console.error('❌ SimpleImage: Base64 conversion failed:', error);
      setHasError(true);
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    console.log('🔄 SimpleImage: Retrying conversion');
    convertToBase64();
  };

  const imageStyle = {
    width,
    height,
    borderRadius,
    backgroundColor: '#333'
  };

  const fallbackStyle = {
    width,
    height,
    borderRadius,
    backgroundColor: '#444',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  };

  const Wrapper = onImagePress ? TouchableOpacity : View;
  const wrapperProps = onImagePress ? { onPress: onImagePress, activeOpacity: 0.8 } : {};

  if (hasError) {
    return (
      <Wrapper {...wrapperProps}>
        <TouchableOpacity onPress={handleRetry} style={fallbackStyle}>
          <Text className="text-white text-2xl mb-2">🖼️</Text>
          <Text className="text-white text-sm">{fallbackText}</Text>
          <Text className="text-white text-xs opacity-70">Tap to retry</Text>
        </TouchableOpacity>
      </Wrapper>
    );
  }

  if (isLoading) {
    return (
      <Wrapper {...wrapperProps}>
        <View style={fallbackStyle}>
          <Text className="text-white text-sm">Converting...</Text>
        </View>
      </Wrapper>
    );
  }

  if (base64Data) {
    return (
      <Wrapper {...wrapperProps}>
        <RNImage
          source={{ uri: base64Data }}
          style={imageStyle}
          resizeMode="cover"
          onError={(error) => {
            console.error('❌ SimpleImage: Even base64 failed:', error);
            setHasError(true);
          }}
          onLoad={() => {
            console.log('✅ SimpleImage: Base64 image loaded successfully');
          }}
        />
      </Wrapper>
    );
  }

  return (
    <Wrapper {...wrapperProps}>
      <View style={fallbackStyle}>
        <Text className="text-white text-sm">No image data</Text>
      </View>
    </Wrapper>
  );
} 