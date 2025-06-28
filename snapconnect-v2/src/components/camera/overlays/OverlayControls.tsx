/**
 * Overlay Controls Component
 * Handles positioning, selection, and interaction with overlays
 */

import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { PanGestureHandler, PinchGestureHandler, State } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  runOnJS,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import type { ActiveOverlay, OverlayPosition } from '../../../types/overlays';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface OverlayControlsProps {
  overlays: ActiveOverlay[];
  selectedOverlayId: string | null;
  onOverlaySelect: (overlayId: string | null) => void;
  onOverlayUpdate: (overlayId: string, updates: Partial<ActiveOverlay>) => void;
  onOverlayDelete: (overlayId: string) => void;
  onOverlayDuplicate: (overlayId: string) => void;
  disabled?: boolean;
}

/**
 * Overlay Controls - Provides interactive controls for overlay manipulation
 */
export function OverlayControls({
  overlays,
  selectedOverlayId,
  onOverlaySelect,
  onOverlayUpdate,
  onOverlayDelete,
  onOverlayDuplicate,
  disabled = false,
}: OverlayControlsProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isPinching, setIsPinching] = useState(false);

  // Get selected overlay
  const selectedOverlay = overlays.find(o => o.id === selectedOverlayId);

  if (disabled || overlays.length === 0) return null;

  /**
   * Handle overlay selection
   */
  const handleOverlayPress = async (overlayId: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onOverlaySelect(overlayId === selectedOverlayId ? null : overlayId);
  };

  /**
   * Handle overlay deletion with confirmation
   */
  const handleDeleteOverlay = (overlayId: string) => {
    Alert.alert(
      'Delete Overlay',
      'Are you sure you want to delete this overlay?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onOverlayDelete(overlayId);
          }
        },
      ]
    );
  };

  /**
   * Handle overlay duplication
   */
  const handleDuplicateOverlay = async (overlayId: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onOverlayDuplicate(overlayId);
  };

  return (
    <View className="absolute inset-0 pointer-events-none">
      {/* Render overlay selection areas */}
      {overlays.map((overlay) => (
        <OverlayInteractionArea
          key={overlay.id}
          overlay={overlay}
          isSelected={overlay.id === selectedOverlayId}
          onPress={() => handleOverlayPress(overlay.id)}
          onUpdate={(updates) => onOverlayUpdate(overlay.id, updates)}
          isDragging={isDragging}
          setIsDragging={setIsDragging}
          isPinching={isPinching}
          setIsPinching={setIsPinching}
        />
      ))}

      {/* Selection controls for selected overlay */}
      {selectedOverlay && (
        <OverlaySelectionControls
          overlay={selectedOverlay}
          onDelete={() => handleDeleteOverlay(selectedOverlay.id)}
          onDuplicate={() => handleDuplicateOverlay(selectedOverlay.id)}
          onDeselect={() => onOverlaySelect(null)}
        />
      )}
    </View>
  );
}

interface OverlayInteractionAreaProps {
  overlay: ActiveOverlay;
  isSelected: boolean;
  onPress: () => void;
  onUpdate: (updates: Partial<ActiveOverlay>) => void;
  isDragging: boolean;
  setIsDragging: (dragging: boolean) => void;
  isPinching: boolean;
  setIsPinching: (pinching: boolean) => void;
}

/**
 * Individual overlay interaction area for gestures
 */
function OverlayInteractionArea({
  overlay,
  isSelected,
  onPress,
  onUpdate,
  isDragging,
  setIsDragging,
  isPinching,
  setIsPinching,
}: OverlayInteractionAreaProps) {
  const { position } = overlay;
  const panRef = useRef<any>(null);
  const pinchRef = useRef<any>(null);

  // Animated values
  const translateX = useSharedValue(position.x * screenWidth);
  const translateY = useSharedValue(position.y * screenHeight);
  const scale = useSharedValue(position.scale);
  const rotation = useSharedValue(position.rotation);

  // Calculate absolute position
  const absolutePosition = {
    left: position.x * screenWidth,
    top: position.y * screenHeight,
    width: position.width * screenWidth,
    height: position.height * screenHeight,
  };

  /**
   * Pan gesture handler for dragging
   */
  const panGestureHandler = useAnimatedGestureHandler({
         onStart: () => {
       runOnJS(setIsDragging)(true);
     },
    onActive: (event) => {
      translateX.value = Math.max(
        0,
        Math.min(screenWidth - absolutePosition.width, event.translationX + position.x * screenWidth)
      );
      translateY.value = Math.max(
        0,
        Math.min(screenHeight - absolutePosition.height, event.translationY + position.y * screenHeight)
      );
    },
    onEnd: () => {
      runOnJS(setIsDragging)(false);
      
      // Update overlay position
      const newPosition: OverlayPosition = {
        ...position,
        x: translateX.value / screenWidth,
        y: translateY.value / screenHeight,
      };

             runOnJS(onUpdate)({
         position: newPosition,
       });
    },
  });

  /**
   * Pinch gesture handler for scaling
   */
  const pinchGestureHandler = useAnimatedGestureHandler({
    onStart: () => {
      runOnJS(setIsPinching)(true);
    },
    onActive: (event: any) => {
      scale.value = Math.max(0.5, Math.min(3, (event.scale || 1) * position.scale));
    },
    onEnd: () => {
      runOnJS(setIsPinching)(false);
      
      // Update overlay scale
      const newPosition: OverlayPosition = {
        ...position,
        scale: scale.value,
      };

      runOnJS(onUpdate)({
        position: newPosition,
      });
    },
  });

  /**
   * Animated style for the overlay interaction area
   */
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
        { rotate: `${rotation.value}deg` },
      ],
    };
  });

  return (
    <PanGestureHandler
      ref={panRef}
      onGestureEvent={panGestureHandler}
      simultaneousHandlers={pinchRef}
      enabled={isSelected && !isPinching}
    >
      <Animated.View
        style={[
          {
            position: 'absolute',
            left: -absolutePosition.width / 2,
            top: -absolutePosition.height / 2,
            width: absolutePosition.width,
            height: absolutePosition.height,
          },
          animatedStyle,
        ]}
      >
        <PinchGestureHandler
          ref={pinchRef}
          onGestureEvent={pinchGestureHandler}
          simultaneousHandlers={panRef}
          enabled={isSelected && !isDragging}
        >
          <Animated.View className="flex-1">
            <TouchableOpacity
              className={`flex-1 ${isSelected ? 'border-2 border-blue-500 border-dashed' : ''}`}
              onPress={onPress}
              style={{
                backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                borderRadius: 8,
              }}
              activeOpacity={0.7}
            >
              {/* Selection indicator */}
              {isSelected && (
                <View className="absolute -top-2 -left-2 w-4 h-4 bg-blue-500 rounded-full border-2 border-white" />
              )}
            </TouchableOpacity>
          </Animated.View>
        </PinchGestureHandler>
      </Animated.View>
    </PanGestureHandler>
  );
}

interface OverlaySelectionControlsProps {
  overlay: ActiveOverlay;
  onDelete: () => void;
  onDuplicate: () => void;
  onDeselect: () => void;
}

/**
 * Selection controls toolbar for selected overlay
 */
function OverlaySelectionControls({
  overlay,
  onDelete,
  onDuplicate,
  onDeselect,
}: OverlaySelectionControlsProps) {
  const { position } = overlay;
  
  // Position toolbar near the overlay
  const toolbarPosition = {
    left: Math.max(20, Math.min(screenWidth - 200, position.x * screenWidth)),
    top: Math.max(100, position.y * screenHeight - 60),
  };

  return (
    <View
      className="absolute bg-black/80 rounded-xl p-2 flex-row space-x-2 pointer-events-auto"
      style={toolbarPosition}
    >
      {/* Duplicate button */}
      <TouchableOpacity
        className="w-10 h-10 bg-blue-500/20 rounded-lg items-center justify-center"
        onPress={onDuplicate}
        activeOpacity={0.7}
      >
        <Ionicons name="copy-outline" size={18} color="#3B82F6" />
      </TouchableOpacity>

      {/* Delete button */}
      <TouchableOpacity
        className="w-10 h-10 bg-red-500/20 rounded-lg items-center justify-center"
        onPress={onDelete}
        activeOpacity={0.7}
      >
        <Ionicons name="trash-outline" size={18} color="#EF4444" />
      </TouchableOpacity>

      {/* Deselect button */}
      <TouchableOpacity
        className="w-10 h-10 bg-gray-500/20 rounded-lg items-center justify-center"
        onPress={onDeselect}
        activeOpacity={0.7}
      >
        <Ionicons name="close" size={18} color="#9CA3AF" />
      </TouchableOpacity>
    </View>
  );
}

/**
 * Overlay positioning guide
 */
export function OverlayPositioningGuide({ visible }: { visible: boolean }) {
  if (!visible) return null;

  return (
    <View className="absolute inset-0 pointer-events-none">
      {/* Grid lines */}
      <View className="absolute inset-0">
        {/* Vertical thirds */}
        <View className="absolute left-1/3 top-0 bottom-0 w-px bg-white/20" />
        <View className="absolute left-2/3 top-0 bottom-0 w-px bg-white/20" />
        
        {/* Horizontal thirds */}
        <View className="absolute top-1/3 left-0 right-0 h-px bg-white/20" />
        <View className="absolute top-2/3 left-0 right-0 h-px bg-white/20" />
        
        {/* Center lines */}
        <View className="absolute left-1/2 top-0 bottom-0 w-px bg-white/30" />
        <View className="absolute top-1/2 left-0 right-0 h-px bg-white/30" />
      </View>

      {/* Corner indicators */}
      <View className="absolute top-4 left-4 w-6 h-6 border-l-2 border-t-2 border-white/40" />
      <View className="absolute top-4 right-4 w-6 h-6 border-r-2 border-t-2 border-white/40" />
      <View className="absolute bottom-4 left-4 w-6 h-6 border-l-2 border-b-2 border-white/40" />
      <View className="absolute bottom-4 right-4 w-6 h-6 border-r-2 border-b-2 border-white/40" />
    </View>
  );
} 