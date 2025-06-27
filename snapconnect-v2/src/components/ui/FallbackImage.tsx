/**
 * FallbackImage Component
 * 
 * A robust image component that handles React Native image loading issues
 * with fallback strategies and better error handling.
 * Uses Expo Image for better reliability.
 */
import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Image, ImageSource } from 'expo-image';

interface FallbackImageProps {
  uri: string;
  width?: number;
  height?: number;
  borderRadius?: number;
  fallbackText?: string;
  onImagePress?: () => void;
}

export function FallbackImage({
  uri,
  width = 200,
  height = 200,
  borderRadius = 12,
  fallbackText = "Image",
  onImagePress,
}: FallbackImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleImageError = (error: any) => {
    console.error('❌ FallbackImage error:', {
      uri,
      error
    });
    setHasError(true);
    setIsLoading(false);
  };

  const handleImageLoad = () => {
    console.log('✅ FallbackImage loaded:', uri);
    setHasError(false);
    setIsLoading(false);
  };

  const handleImageLoadStart = () => {
    console.log('🔄 FallbackImage loading:', uri);
    setIsLoading(true);
    setHasError(false);
  };

  const handleRetry = () => {
    console.log('🔄 Retrying image load:', uri);
    setHasError(false);
    setIsLoading(true);
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

  return (
    <Wrapper {...wrapperProps}>
      <View>
        <Image
          source={{ uri } as ImageSource}
          style={imageStyle}
          contentFit="cover"
          onError={handleImageError}
          onLoad={handleImageLoad}
          onLoadStart={handleImageLoadStart}
          cachePolicy="memory-disk"
          transition={200}
        />
        
        {/* Loading overlay */}
        {isLoading && (
          <View style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.3)',
            borderRadius,
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <Text className="text-white text-sm">Loading...</Text>
          </View>
        )}
      </View>
    </Wrapper>
  );
} 