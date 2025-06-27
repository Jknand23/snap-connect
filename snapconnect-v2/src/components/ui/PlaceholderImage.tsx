/**
 * PlaceholderImage Component
 * 
 * Simple image component that gracefully falls back to a placeholder
 * when images fail to load (which is a known React Native issue)
 */
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image as RNImage } from 'react-native';

interface PlaceholderImageProps {
  uri: string;
  width?: number;
  height?: number;
  borderRadius?: number;
  onImagePress?: () => void;
}

export function PlaceholderImage({
  uri,
  width = 200,
  height = 200,
  borderRadius = 12,
  onImagePress,
}: PlaceholderImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const imageStyle = {
    width,
    height,
    borderRadius,
    backgroundColor: '#333'
  };

  const placeholderStyle = {
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
        <View style={placeholderStyle}>
          <Text className="text-white text-3xl mb-2">📷</Text>
          <Text className="text-white text-sm">Photo</Text>
          <Text className="text-white text-xs opacity-70">Tap to view</Text>
        </View>
      </Wrapper>
    );
  }

  return (
    <Wrapper {...wrapperProps}>
      <RNImage
        source={{ uri }}
        style={imageStyle}
        resizeMode="cover"
        onError={() => {
          console.log('📷 Image failed to load, showing placeholder');
          setHasError(true);
          setIsLoading(false);
        }}
        onLoad={() => {
          console.log('✅ Image loaded successfully');
          setIsLoading(false);
        }}
        onLoadStart={() => {
          setIsLoading(true);
        }}
      />
      {isLoading && (
        <View style={[placeholderStyle, { position: 'absolute' }]}>
          <Text className="text-white text-sm">Loading...</Text>
        </View>
      )}
    </Wrapper>
  );
} 