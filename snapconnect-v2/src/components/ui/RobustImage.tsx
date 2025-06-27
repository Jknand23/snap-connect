/**
 * RobustImage Component
 * 
 * An extremely robust image component that tries multiple strategies:
 * 1. Expo Image (most reliable)
 * 2. Base64 conversion fallback
 * 3. React Native Image fallback
 * 4. Manual retry with cache busting
 */
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image as RNImage } from 'react-native';
import { Image as ExpoImage, ImageSource } from 'expo-image';

interface RobustImageProps {
  uri: string;
  width?: number;
  height?: number;
  borderRadius?: number;
  fallbackText?: string;
  onImagePress?: () => void;
}

type LoadingStrategy = 'expo' | 'base64' | 'react-native' | 'failed';

export function RobustImage({
  uri,
  width = 200,
  height = 200,
  borderRadius = 12,
  fallbackText = "Image",
  onImagePress,
}: RobustImageProps) {
  const [currentStrategy, setCurrentStrategy] = useState<LoadingStrategy>('expo');
  const [isLoading, setIsLoading] = useState(true);
  const [base64Data, setBase64Data] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

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

  // Convert image to base64 as fallback
  const convertToBase64 = async (imageUri: string): Promise<string | null> => {
    try {
      console.log('🔄 Converting image to base64:', imageUri);
      const response = await fetch(imageUri);
      
      if (!response.ok) {
        console.error('❌ Fetch failed:', response.status, response.statusText);
        return null;
      }
      
      const blob = await response.blob();
      console.log('✅ Blob created, size:', blob.size, 'type:', blob.type);
      
      // Use a different approach for React Native
      if (typeof FileReader !== 'undefined') {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            console.log('✅ Base64 conversion successful');
            resolve(reader.result as string);
          };
          reader.onerror = (error) => {
            console.error('❌ FileReader error:', error);
            reject(error);
          };
          reader.readAsDataURL(blob);
        });
      } else {
        // Fallback for environments without FileReader
        console.log('⚠️ FileReader not available, using alternative approach');
        
        // Try to use the response directly as arrayBuffer and convert
        const arrayBuffer = await response.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        
        // Convert to base64 manually (simplified approach)
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        
        const base64 = btoa(binary);
        const mimeType = response.headers.get('content-type') || 'image/jpeg';
        const dataUri = `data:${mimeType};base64,${base64}`;
        
        console.log('✅ Manual base64 conversion successful');
        return dataUri;
      }
    } catch (error) {
      console.error('❌ Base64 conversion failed:', error);
      return null;
    }
  };

  const handleExpoImageError = async (error: any) => {
    console.error('❌ Expo Image failed:', { uri, error });
    
    // Try base64 conversion
    setCurrentStrategy('base64');
    setIsLoading(true);
    
    const base64 = await convertToBase64(uri);
    if (base64) {
      setBase64Data(base64);
      setIsLoading(false);
    } else {
      // Fall back to React Native Image
      setCurrentStrategy('react-native');
    }
  };

  const handleRNImageError = (error: any) => {
    console.error('❌ React Native Image failed:', { uri, error });
    setCurrentStrategy('failed');
    setIsLoading(false);
  };

  const handleImageLoad = () => {
    console.log('✅ Image loaded successfully with strategy:', currentStrategy);
    setIsLoading(false);
  };

  const handleRetry = () => {
    console.log('🔄 Retrying image load, attempt:', retryCount + 1);
    setRetryCount(prev => prev + 1);
    setCurrentStrategy('expo');
    setIsLoading(true);
    setBase64Data(null);
  };

  const Wrapper = onImagePress ? TouchableOpacity : View;
  const wrapperProps = onImagePress ? { onPress: onImagePress, activeOpacity: 0.8 } : {};

  // Add cache busting for retries
  const imageUri = retryCount > 0 ? `${uri}?retry=${retryCount}` : uri;

  if (currentStrategy === 'failed') {
    return (
      <Wrapper {...wrapperProps}>
        <TouchableOpacity onPress={handleRetry} style={fallbackStyle}>
          <Text className="text-white text-2xl mb-2">🖼️</Text>
          <Text className="text-white text-sm">{fallbackText}</Text>
          <Text className="text-white text-xs opacity-70">Tap to retry</Text>
          {retryCount > 0 && (
            <Text className="text-white text-xs opacity-50 mt-1">
              Attempt {retryCount + 1}
            </Text>
          )}
        </TouchableOpacity>
      </Wrapper>
    );
  }

  return (
    <Wrapper {...wrapperProps}>
      <View>
        {currentStrategy === 'expo' && (
          <ExpoImage
            source={{ uri: imageUri } as ImageSource}
            style={imageStyle}
            contentFit="cover"
            onError={handleExpoImageError}
            onLoad={handleImageLoad}
            cachePolicy="memory-disk"
            transition={200}
          />
        )}
        
        {currentStrategy === 'base64' && base64Data && (
          <RNImage
            source={{ uri: base64Data }}
            style={imageStyle}
            resizeMode="cover"
            onError={handleRNImageError}
            onLoad={handleImageLoad}
          />
        )}
        
        {currentStrategy === 'react-native' && (
          <RNImage
            source={{ uri: imageUri }}
            style={imageStyle}
            resizeMode="cover"
            onError={handleRNImageError}
            onLoad={handleImageLoad}
          />
        )}
        
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
            <Text className="text-white text-sm">
              Loading... ({currentStrategy})
            </Text>
          </View>
        )}
      </View>
    </Wrapper>
  );
} 