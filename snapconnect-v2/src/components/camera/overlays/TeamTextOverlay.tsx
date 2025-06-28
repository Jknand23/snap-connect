/**
 * Team Text Overlay Component
 * Renders team-colored text overlays with gradients and effects
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import type { ActiveOverlay, TeamAsset, OverlayStyle } from '../../../types/overlays';

interface TeamTextOverlayProps {
  overlay: ActiveOverlay;
  teamAsset?: TeamAsset;
  screenWidth: number;
  screenHeight: number;
  style?: Partial<OverlayStyle>;
}

/**
 * Team Text Overlay - Renders text with team colors and effects
 */
export function TeamTextOverlay({ 
  overlay, 
  teamAsset, 
  screenWidth, 
  screenHeight, 
  style: customStyle 
}: TeamTextOverlayProps) {
  if (!overlay.isVisible) {
    return null;
  }

  const { position, customContent } = overlay;
  
  // Calculate absolute position from relative coordinates
  const absolutePosition = {
    left: position.x * screenWidth,
    top: position.y * screenHeight,
    width: position.width * screenWidth,
    height: position.height * screenHeight,
  };

  // Ensure overlay stays within screen bounds
  const constrainedPosition = {
    left: Math.max(0, Math.min(absolutePosition.left, screenWidth - absolutePosition.width)),
    top: Math.max(0, Math.min(absolutePosition.top, screenHeight - absolutePosition.height)),
    width: Math.min(absolutePosition.width, screenWidth),
    height: Math.min(absolutePosition.height, screenHeight),
  };

  // Get team colors
  const teamColors = teamAsset?.colors || {
    primary: '#0066FF',
    secondary: '#000000',
    accent: '#FFD700',
  };

  // Merge overlay style with custom style
  const mergedStyle = {
    ...overlay.style,
    ...customStyle,
  };

  // Create gradient colors array
  const gradientColors = mergedStyle?.gradient || [teamColors.primary, teamColors.accent];
  
  // Replace team color placeholders
  const processedGradient = gradientColors.map(color => {
    if (color === 'team-primary') return teamColors.primary;
    if (color === 'team-secondary') return teamColors.secondary;
    if (color === 'team-accent') return teamColors.accent;
    return color;
  });

  // Process text color
  const textColor = (() => {
    if (mergedStyle?.color === 'team-primary') return teamColors.primary;
    if (mergedStyle?.color === 'team-secondary') return teamColors.secondary;
    if (mergedStyle?.color === 'team-accent') return teamColors.accent;
    return mergedStyle?.color || '#FFFFFF';
  })();

  // Create text shadow style
  const textShadowStyle = mergedStyle?.textShadow ? {
    textShadowColor: mergedStyle.shadowColor || 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: mergedStyle.shadowRadius || 4,
  } : {};

  // Transform style
  const transformStyle = {
    transform: [
      { rotate: `${position.rotation}deg` },
      { scale: position.scale },
    ],
  };

  const textStyle = {
    fontSize: mergedStyle?.fontSize || 24,
    fontWeight: mergedStyle?.fontWeight || 'bold',
    color: textColor,
    textAlign: mergedStyle?.textAlign || 'center',
    ...textShadowStyle,
  };

  const containerStyle = [
    styles.container,
    {
      position: 'absolute' as const,
      ...constrainedPosition,
      ...transformStyle,
      opacity: mergedStyle?.opacity || 1,
      borderRadius: mergedStyle?.borderRadius || 10,
    }
  ];

  // Determine display text
  const displayText = customContent || overlay.templateId || 'GO TEAM!';

  return (
    <View style={containerStyle}>
      {/* Background with gradient or solid color */}
      {mergedStyle?.gradient ? (
        <LinearGradient
          colors={[processedGradient[0] || teamColors.primary, processedGradient[1] || teamColors.accent]}
          style={[styles.gradientBackground, { borderRadius: mergedStyle.borderRadius || 10 }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {mergedStyle?.blur ? (
            <BlurView 
              intensity={mergedStyle.blur} 
              style={styles.blurContainer}
            >
              <Text style={[styles.text, textStyle]}>
                {displayText.toUpperCase()}
              </Text>
            </BlurView>
          ) : (
            <Text style={[styles.text, textStyle]}>
              {displayText.toUpperCase()}
            </Text>
          )}
        </LinearGradient>
      ) : (
        <View 
          style={[
            styles.solidBackground, 
            { 
              backgroundColor: mergedStyle?.backgroundColor || 'rgba(0,0,0,0.7)',
              borderRadius: mergedStyle?.borderRadius || 10,
              borderWidth: mergedStyle?.borderWidth || 0,
              borderColor: mergedStyle?.borderColor === 'team-primary' 
                ? teamColors.primary 
                : mergedStyle?.borderColor || 'transparent',
            }
          ]}
        >
          {mergedStyle?.blur ? (
            <BlurView 
              intensity={mergedStyle.blur} 
              style={styles.blurContainer}
            >
              <Text style={[styles.text, textStyle]}>
                {displayText.toUpperCase()}
              </Text>
            </BlurView>
          ) : (
            <Text style={[styles.text, textStyle]}>
              {displayText.toUpperCase()}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 40,
  },
  gradientBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  solidBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  blurContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  text: {
    fontFamily: 'System',
    letterSpacing: 1,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});

/**
 * Victory Text Overlay - Specialized for victory celebrations
 */
export function VictoryTextOverlay({ 
  overlay, 
  teamAsset, 
  screenWidth, 
  screenHeight 
}: Omit<TeamTextOverlayProps, 'style'>) {
  const victoryStyle: Partial<OverlayStyle> = {
    fontSize: 36,
    fontWeight: 'heavy',
    gradient: [teamAsset?.colors.primary || '#FFD700', '#FFD700'],
    textShadow: true,
    shadowColor: 'rgba(0,0,0,0.9)',
    shadowOffset: { x: 3, y: 3 },
    shadowRadius: 6,
    borderRadius: 20,
  };

  return (
    <TeamTextOverlay
      overlay={overlay}
      teamAsset={teamAsset}
      screenWidth={screenWidth}
      screenHeight={screenHeight}
      style={victoryStyle}
    />
  );
}

/**
 * Game Day Text Overlay - Specialized for game day hype
 */
export function GameDayTextOverlay({ 
  overlay, 
  teamAsset, 
  screenWidth, 
  screenHeight 
}: Omit<TeamTextOverlayProps, 'style'>) {
  const gamedayStyle: Partial<OverlayStyle> = {
    fontSize: 28,
    fontWeight: 'bold',
    gradient: [teamAsset?.colors.secondary || '#000000', teamAsset?.colors.primary || '#0066FF'],
    borderWidth: 3,
    borderColor: teamAsset?.colors.primary || '#0066FF',
    borderRadius: 15,
    textShadow: true,
  };

  return (
    <TeamTextOverlay
      overlay={overlay}
      teamAsset={teamAsset}
      screenWidth={screenWidth}
      screenHeight={screenHeight}
      style={gamedayStyle}
    />
  );
}

/**
 * Pride Badge Overlay - Compact team pride badge
 */
export function PrideBadgeOverlay({ 
  overlay, 
  teamAsset, 
  screenWidth, 
  screenHeight 
}: Omit<TeamTextOverlayProps, 'style'>) {
  const prideStyle: Partial<OverlayStyle> = {
    fontSize: 16,
    fontWeight: 'bold',
    backgroundColor: teamAsset?.colors.primary || '#0066FF',
    borderWidth: 2,
    borderColor: teamAsset?.colors.secondary || '#FFFFFF',
    borderRadius: 25,
    textAlign: 'center',
  };

  return (
    <TeamTextOverlay
      overlay={overlay}
      teamAsset={teamAsset}
      screenWidth={screenWidth}
      screenHeight={screenHeight}
      style={prideStyle}
    />
  );
} 