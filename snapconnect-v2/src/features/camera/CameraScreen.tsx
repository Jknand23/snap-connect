/**
 * Camera Screen
 * Handles photo/video capture with sports-themed overlays and effects
 */
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Modal,
  FlatList,
  Image,
  Pressable,
  Dimensions,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions, FlashMode } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import { useNavigation } from '@react-navigation/native';
import { messagingService } from '../../services/messaging/messagingService';
import { chatService } from '../../services/messaging/chatService';
import { useAuthStore } from '../../stores/authStore';
import type { ChatWithDetails } from '../../services/messaging/messagingService';
import { supabase } from '../../services/database/supabase';
import { StoriesService } from '../../services/stories/storiesService';

// Overlay system imports
import { overlayManager } from '../../services/overlays/overlayManager';
import { overlayRenderService } from '../../services/overlays/overlayRenderService';
import { overlayTemplateService } from '../../services/overlays/overlayTemplateService';
import { teamAssetService } from '../../services/overlays/teamAssetService';
import { TeamTextOverlay } from '../../components/camera/overlays/TeamTextOverlay';
// import { OverlayControls, OverlayPositioningGuide } from '../../components/camera/overlays/OverlayControls';
import { OverlayTemplateSelector } from '../../components/camera/overlays/OverlayTemplateSelector';
import type { ActiveOverlay, OverlayTemplate, TeamAsset } from '../../types/overlays';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface CameraScreenProps {
  navigation: any;
}

/**
 * Camera Screen Component - Handles photo/video capture and sharing
 * Provides Snapchat-style camera interface with sports overlays and chat sharing
 */
export function CameraScreen() {
  const navigation = useNavigation();
  const { user } = useAuthStore();
  
  const cameraRef = useRef<CameraView>(null);
  const storiesService = new StoriesService();
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingStartTime, setRecordingStartTime] = useState<Date | null>(null);

  const [flash, setFlash] = useState<FlashMode>('off');
  const [showChatSelection, setShowChatSelection] = useState(false);
  const [userChats, setUserChats] = useState<ChatWithDetails[]>([]);
  const [lastCapturedMedia, setLastCapturedMedia] = useState<{
    uri: string;
    type: 'photo' | 'video';
  } | null>(null);

  // Overlay system state
  const [activeOverlays, setActiveOverlays] = useState<ActiveOverlay[]>([]);
  const [selectedOverlayId, setSelectedOverlayId] = useState<string | null>(null);
  const [showOverlaySelector, setShowOverlaySelector] = useState(false);
  const [showPositioningGuide, setShowPositioningGuide] = useState(false);
  const [userTeams, setUserTeams] = useState<TeamAsset[]>([]);
  const [overlayMode, setOverlayMode] = useState(false);
  const captureViewRef = useRef<View>(null);

  /**
   * Request media library permissions and load chats
   */
  useEffect(() => {
    (async () => {
      console.log('🚀 CameraScreen useEffect started');
      
      await MediaLibrary.requestPermissionsAsync();
      await loadUserChats();
      await loadUserTeams();
      setupOverlayListeners();

      // Debug overlay templates
      console.log('🎭 Checking overlay templates...');
      const templates = overlayTemplateService.getTemplates();
      console.log('📋 Available templates:', templates.map((t: OverlayTemplate) => ({ id: t.id, name: t.name, category: t.category })));

      console.log('✅ CameraScreen initialization complete');
    })();

    return () => {
      // Cleanup disabled for debugging
      // overlayManager.cleanup();
    };
  }, []);

  /**
   * Load user's chats for photo sharing
   */
  async function loadUserChats() {
    try {
      const chats = await messagingService.getUserChats();

      if (chats && chats.length > 0) {
        setUserChats(chats);
      } else {
        await createMockChats();
      }
    } catch (error) {
      console.error('Error loading chats:', error);
      await createMockChats();
    }
  }

  /**
   * Create mock chats for testing when no real chats exist
   */
  const createMockChats = async () => {
    try {
      const mockChats: ChatWithDetails[] = [
        {
          id: 'demo-story',
          name: 'My Story',
          description: 'Share to your story',
          type: 'direct',
          team_id: null,
          created_by: user?.id || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          participants: [],
          unread_count: 0,
        },
        {
          id: 'demo-friend-1',
          name: null,
          description: null,
          type: 'direct',
          team_id: null,
          created_by: user?.id || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          participants: [
            {
              id: 'demo-participant-1',
              chat_id: 'demo-friend-1',
              user_id: 'demo-user-1',
              joined_at: new Date().toISOString(),
              role: 'member',
              last_read_at: new Date().toISOString(),
              profiles: {
                id: 'demo-user-1',
                username: 'Alex Chen',
                full_name: 'Alex Chen',
                avatar_url: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                bio: null,
              }
            }
          ],
          unread_count: 0,
        },
        {
          id: 'demo-friend-2',
          name: null,
          description: null,
          type: 'direct',
          team_id: null,
          created_by: user?.id || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          participants: [
            {
              id: 'demo-participant-2',
              chat_id: 'demo-friend-2',
              user_id: 'demo-user-2',
              joined_at: new Date().toISOString(),
              role: 'member',
              last_read_at: new Date().toISOString(),
              profiles: {
                id: 'demo-user-2',
                username: 'Sarah Johnson',
                full_name: 'Sarah Johnson',
                avatar_url: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                bio: null,
              }
            }
          ],
          unread_count: 0,
        }
      ];

      setUserChats(mockChats);
    } catch (error) {
      console.error('Error creating mock chats:', error);
      setUserChats([]);
    }
  };

  /**
   * Load user's teams for overlay customization
   */
  const loadUserTeams = async () => {
    try {
      console.log('🏈 Loading user teams...');
      const teams = await teamAssetService.getUserTeamAssets();
      console.log('🏈 User teams loaded:', teams.map(t => ({ id: t.id, name: t.name, abbreviation: t.abbreviation, colors: t.colors })));
      setUserTeams(teams);
    } catch (error) {
      console.error('❌ Error loading user teams:', error);
      setUserTeams([]);
    }
  };

  /**
   * Setup overlay system listeners
   */
  const setupOverlayListeners = () => {
    const updateOverlays = () => {
      const currentOverlays = overlayManager.getActiveOverlays();
      setActiveOverlays(currentOverlays);
    };

    // Set up listeners for overlay changes
    // Note: This would typically be event-based, but for now we'll use manual updates
  };

  /**
   * Handle template selection from overlay selector
   */
  const handleTemplateSelect = async (template: OverlayTemplate, teamId?: string) => {
    try {
      console.log('🎯 TEMPLATE SELECT STARTED:', {
        templateId: template.id,
        templateName: template.name,
        teamId,
        currentOverlaysCount: activeOverlays.length
      });

      const overlayId = await overlayManager.addOverlayFromTemplate(template, teamId);
      
      console.log('📦 OVERLAY MANAGER RESULT:', {
        overlayId,
        managerOverlaysCount: overlayManager.getOverlayCount(),
        managerOverlays: overlayManager.getActiveOverlays().map(o => ({
          id: o.id,
          templateId: o.templateId,
          position: o.position,
          isVisible: o.isVisible
        }))
      });

      if (overlayId) {
        const newOverlays = overlayManager.getActiveOverlays();
        console.log('🔄 UPDATING STATE:', {
          newOverlaysCount: newOverlays.length,
          overlays: newOverlays.map(o => ({
            id: o.id,
            templateId: o.templateId,
            position: o.position,
            isVisible: o.isVisible,
            style: o.style
          }))
        });

        setActiveOverlays(newOverlays);
        setSelectedOverlayId(overlayId);
        overlayManager.selectOverlay(overlayId);
        
        // Enable overlay mode and show positioning guide
        setOverlayMode(true);
        setShowPositioningGuide(true);
        
        // Close the template selector
        setShowOverlaySelector(false);

        console.log('✅ TEMPLATE SELECT COMPLETED - State should update now');
      } else {
        console.log('❌ OVERLAY ID IS NULL - overlay was not added');
        Alert.alert('Overlay Limit', 'Maximum number of overlays reached (5)');
      }
    } catch (error) {
      console.error('❌ Error in handleTemplateSelect:', error);
      Alert.alert('Error', 'Failed to add overlay');
    }
  };

  /**
   * Handle overlay updates (position, style, etc.)
   */
  const handleOverlayUpdate = (overlayId: string, updates: Partial<ActiveOverlay>) => {
    overlayManager.updateOverlay(overlayId, updates);
    setActiveOverlays(overlayManager.getActiveOverlays());
  };

  /**
   * Handle overlay selection
   */
  const handleOverlaySelect = (overlayId: string | null) => {
    overlayManager.selectOverlay(overlayId);
    setSelectedOverlayId(overlayId);
    setActiveOverlays(overlayManager.getActiveOverlays());
    
    // Show positioning guide when overlay is selected
    setShowPositioningGuide(overlayId !== null);
  };

  /**
   * Handle overlay deletion
   */
  const handleOverlayDelete = (overlayId: string) => {
    overlayManager.deleteOverlay(overlayId);
    setActiveOverlays(overlayManager.getActiveOverlays());
    setSelectedOverlayId(null);
    
    // Hide positioning guide if no overlays left
    if (overlayManager.getOverlayCount() === 0) {
      setShowPositioningGuide(false);
      setOverlayMode(false);
    }
  };

  /**
   * Handle overlay duplication
   */
  const handleOverlayDuplicate = (overlayId: string) => {
    const newOverlayId = overlayManager.duplicateOverlay(overlayId);
    if (newOverlayId) {
      setActiveOverlays(overlayManager.getActiveOverlays());
      setSelectedOverlayId(newOverlayId);
      overlayManager.selectOverlay(newOverlayId);
    } else {
      Alert.alert('Overlay Limit', 'Maximum number of overlays reached (5)');
    }
  };

  /**
   * Toggle overlay mode
   */
  const toggleOverlayMode = () => {
    const newMode = !overlayMode;
    setOverlayMode(newMode);
    
    if (!newMode) {
      // Exiting overlay mode
      setSelectedOverlayId(null);
      setShowPositioningGuide(false);
      overlayManager.selectOverlay(null);
    } else if (activeOverlays.length === 0) {
      // Entering overlay mode with no overlays - show selector
      setShowOverlaySelector(true);
    }
  };

  /**
   * Clear all overlays
   */
  const clearAllOverlays = () => {
    Alert.alert(
      'Clear All Overlays',
      'Are you sure you want to remove all overlays?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            overlayManager.clearAllOverlays();
            setActiveOverlays([]);
            setSelectedOverlayId(null);
            setShowPositioningGuide(false);
            setOverlayMode(false);
          },
        },
      ]
    );
  };

  /**
   * Remove all overlays without confirmation (for template selector)
   */
  const removeAllOverlays = () => {
    overlayManager.clearAllOverlays();
    setActiveOverlays([]);
    setSelectedOverlayId(null);
    setShowPositioningGuide(false);
    setOverlayMode(false);
  };

  /**
   * Handle capture button press (photos only)
   */
  const handleCapturePress = async () => {
    if (!cameraRef.current || isRecording) return;

    try {
      let capturedUri: string;

      if (activeOverlays.length > 0 && captureViewRef.current) {
        // Capture with overlays using view-shot
        
        // Temporarily hide overlay controls and positioning guide
        const originalGuideState = showPositioningGuide;
        setShowPositioningGuide(false);
        
        // Wait a frame for UI to update
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const overlayImageUri = await overlayRenderService.captureHighQuality(
          captureViewRef,
          activeOverlays
        );
        
        // Restore guide state
        setShowPositioningGuide(originalGuideState);
        
        if (overlayImageUri) {
          capturedUri = overlayImageUri;
        } else {
          throw new Error('Failed to capture with overlays');
        }
      } else {
        // Regular camera capture
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
        });
        
        if (!photo?.uri) {
          throw new Error('Failed to capture photo');
        }
        
        capturedUri = photo.uri;
      }

      setLastCapturedMedia({ uri: capturedUri, type: 'photo' });
      setShowChatSelection(true);

    } catch (error) {
      console.error('Error capturing photo:', error);
      Alert.alert('Capture Error', 'Failed to capture photo. Please try again.');
    }
  };

  /**
   * Start video recording on long press
   */
  const startRecording = async () => {
    if (!cameraRef.current || isRecording) return;

    try {
      console.log('🎥 Starting video recording...');
      setIsRecording(true);
      setRecordingStartTime(new Date());

      // Start recording immediately
      const video = await cameraRef.current.recordAsync({
        maxDuration: 30,
      });

      console.log('✅ Video recorded:', video?.uri);
      
      if (video?.uri) {
        setLastCapturedMedia({ uri: video.uri, type: 'video' });
        setShowChatSelection(true);
      } else {
        Alert.alert('Error', 'No video was recorded');
      }
    } catch (error) {
      console.error('❌ Error recording video:', error);
      Alert.alert('Error', 'Failed to record video. Please try again.');
    } finally {
      setIsRecording(false);
      setRecordingStartTime(null);
    }
  };

  /**
   * Stop video recording manually
   */
  const stopRecording = async () => {
    if (!cameraRef.current || !isRecording) return;

    try {
      console.log('⏹️ Manually stopping video recording...');
      await cameraRef.current.stopRecording();
    } catch (error) {
      console.error('❌ Error stopping recording:', error);
    }
  };

  /**
   * Switch camera (front/back)
   */
  function switchCamera() {
    setFacing(facing === 'back' ? 'front' : 'back');
  }

  /**
   * Toggle flash mode (off → on → auto → off)
   */
  function toggleFlash() {
    if (facing === 'front') {
      // Front camera typically doesn't support flash
      Alert.alert('Flash Not Available', 'Flash is not available on the front camera');
      return;
    }

    // Cycle through flash modes: off → on → auto → off
    if (flash === 'off') {
      setFlash('on');
    } else if (flash === 'on') {
      setFlash('auto');
    } else {
      setFlash('off');
    }
  }

  /**
   * Get flash icon based on current mode
   */
  function getFlashIcon(): "flash" | "flash-off" {
    if (facing === 'front') {
      return 'flash-off'; // Front camera doesn't support flash
    }
    
    switch (flash) {
      case 'on':
        return 'flash';
      case 'auto':
        return 'flash'; // Use same icon for auto, will differentiate by color
      case 'off':
      default:
        return 'flash-off';
    }
  }

  /**
   * Get flash button color based on mode
   */
  function getFlashButtonColor(): string {
    if (facing === 'front') return 'rgba(255,255,255,0.5)';
    
    switch (flash) {
      case 'on':
        return 'rgba(255,255,0,0.8)'; // Yellow for always on
      case 'auto':
        return 'rgba(255,165,0,0.8)'; // Orange for auto
      case 'off':
      default:
        return 'rgba(255,255,255,0.5)'; // Default
    }
  }

  /**
   * Get recording duration for display
   */
  const getRecordingDuration = () => {
    if (!recordingStartTime) return '0:00';
    const duration = Math.floor((Date.now() - recordingStartTime.getTime()) / 1000);
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  /**
   * Get avatar text for a chat (initials for direct chats, emoji for others)
   */
  function getChatAvatarText(chat: ChatWithDetails): string {
    if (chat.type === 'direct') {
      // For direct chats, show the other person's initials
      const otherParticipant = chat.participants?.find(p => p.user_id !== user?.id);
      if (otherParticipant?.profiles) {
        const profile = Array.isArray(otherParticipant.profiles) 
          ? otherParticipant.profiles[0] 
          : otherParticipant.profiles;
        const username = profile?.username || 'U';
        return username.charAt(0).toUpperCase();
      }
      return '👤';
    } else if (chat.type === 'group') {
      return '👥';
    } else {
      return '🏈'; // Team chat
    }
  }

  /**
   * Get display name for a chat (person name for direct chats, chat name for groups)
   */
  function getChatDisplayName(chat: ChatWithDetails): string {
    if (chat.type === 'direct') {
      // For direct chats, show the other person's name
      const otherParticipant = chat.participants?.find(p => p.user_id !== user?.id);
      if (otherParticipant?.profiles) {
        const profile = Array.isArray(otherParticipant.profiles) 
          ? otherParticipant.profiles[0] 
          : otherParticipant.profiles;
        return profile?.username || 'Unknown User';
      }
      return 'Direct Message';
    } else if (chat.type === 'group') {
      return chat.name || 'Group Chat';
    } else {
      return chat.name || 'Team Chat';
    }
  }

  /**
   * Get chat description for display
   */
  function getChatDescription(chat: ChatWithDetails): string {
    if (chat.type === 'direct') {
      return 'Direct message';
    } else if (chat.type === 'group') {
      const participantCount = chat.participants?.length || 0;
      return `${participantCount} members`;
    } else {
      return 'Team conversation';
    }
  }

  /**
   * Filter and sort chats for photo sharing
   */
  function getFilteredChats(): ChatWithDetails[] {
    return userChats
      .filter(chat => {
        // Only show chats with actual participants
        return chat.participants && chat.participants.length > 0;
      })
      .sort((a, b) => {
        // Sort by: 1) Direct chats first, 2) Most recent activity
        if (a.type === 'direct' && b.type !== 'direct') return -1;
        if (b.type === 'direct' && a.type !== 'direct') return 1;
        
        // Then by last activity
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      });
  }

  /**
   * Create a demo story with placeholder URL
   */
  const createDemoStory = async () => {
    // Create story with placeholder image URL for demo
    const placeholderUrl = 'https://via.placeholder.com/400x600/007AFF/ffffff?text=My+Story';
    
    await storiesService.createStory({
      mediaUrl: placeholderUrl,
      mediaType: lastCapturedMedia?.type || 'photo',
      caption: 'Posted from camera!',
      privacySetting: 'friends',
    });

    console.log('✅ Demo story created successfully');
    Alert.alert('Success!', 'Added to your story! (Demo mode)', [
      { text: 'OK', onPress: () => {
        setShowChatSelection(false);
        setLastCapturedMedia(null);
      }}
    ]);
  };

  /**
   * Post captured media to user's story
   */
  const postToStory = async () => {
    if (!lastCapturedMedia) return;

    try {
      console.log('📱 Posting to story...');
      
      // Show loading state
      Alert.alert('Posting...', 'Adding to your story...');

      // Upload media to Supabase Storage  
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${lastCapturedMedia.type === 'photo' ? 'jpg' : 'mp4'}`;
      const filePath = `${user?.id}/stories/${fileName}`;

      console.log('📤 Uploading file:', filePath);
      console.log('📱 Media URI:', lastCapturedMedia.uri);

      // **FIX: Validate file exists and has size before upload**
      console.log('📋 Validating file before upload...');
      const fileInfo = await FileSystem.getInfoAsync(lastCapturedMedia.uri);
      console.log('📊 File info:', fileInfo);
      
      if (!fileInfo.exists) {
        throw new Error('Captured file does not exist');
      }
      
      if (fileInfo.size === 0) {
        throw new Error('Captured file is empty (0 bytes)');
      }
      
      console.log('✅ File validation passed:', {
        exists: fileInfo.exists,
        size: `${(fileInfo.size / 1024).toFixed(2)} KB`,
        uri: lastCapturedMedia.uri
      });

      // **FIX: Use FormData for proper React Native file upload (same as chat messages)**
      console.log('📤 Creating FormData for story upload...');
      
      const formData = new FormData();
      formData.append('file', {
        uri: lastCapturedMedia.uri,
        type: lastCapturedMedia.type === 'photo' ? 'image/jpeg' : 'video/mp4',
        name: fileName,
      } as any);

      console.log('📤 Uploading story with FormData...');
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, formData, {
          contentType: lastCapturedMedia.type === 'photo' ? 'image/jpeg' : 'video/mp4',
          upsert: false
        });

      if (uploadError) {
        console.error('❌ Upload error details:', uploadError);
        console.error('❌ Upload error message:', uploadError.message);
        
        // **FIX: Better error detection and messaging**
        if (uploadError.message?.includes('row-level security') || 
            uploadError.message?.includes('policy')) {
          
          console.log('🔧 Storage permissions issue detected. Showing helpful error...');
          Alert.alert(
            'Storage Setup Required', 
            'Media upload requires storage policies to be configured in your Supabase project.\n\nPlease set up storage policies in the Supabase Dashboard under Storage > Policies.',
            [
              { text: 'OK', onPress: () => {
                setShowChatSelection(false);
                setLastCapturedMedia(null);
              }}
            ]
          );
          return;
        }
        
        // For other upload errors
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      console.log('✅ Upload successful:', uploadData);

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('media')
        .getPublicUrl(filePath);

      const mediaUrl = urlData.publicUrl;
      console.log('✅ Media uploaded to:', mediaUrl);

      // Validate the URL before sending
      if (!mediaUrl || mediaUrl.includes('undefined') || mediaUrl.includes('null')) {
        throw new Error(`Invalid media URL generated: ${mediaUrl}`);
      }

      // Test the URL accessibility
      try {
        const testResponse = await fetch(mediaUrl, { method: 'HEAD' });
        if (!testResponse.ok) {
          console.warn('⚠️ Media URL may not be accessible:', testResponse.status, testResponse.statusText);
        } else {
          console.log('✅ Media URL is accessible');
        }
      } catch (testError) {
        console.warn('⚠️ Could not test media URL accessibility:', testError);
      }

      // Create story
      await storiesService.createStory({
        mediaUrl: mediaUrl,
        mediaType: lastCapturedMedia.type,
        privacySetting: 'friends', // Default to friends
      });

      console.log('✅ Story posted successfully');
      Alert.alert('Success!', 'Added to your story!', [
        { text: 'OK', onPress: () => {
          setShowChatSelection(false);
          setLastCapturedMedia(null);
        }}
      ]);

    } catch (error) {
      console.error('❌ Error posting to story:', error);
      
      // **FIX: More specific error messages**
      let errorMessage = 'Failed to post to story. Please try again.';
      if (error instanceof Error) {
        if (error.message.includes('upload') || error.message.includes('storage')) {
          errorMessage = 'Storage error. Please check your Supabase storage configuration.';
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = 'Network error. Check your internet connection.';
        } else {
          errorMessage = `Error: ${error.message}`;
        }
      }
      
      Alert.alert('Error', errorMessage);
    }
  };

  /**
   * Send captured media to selected chat or story
   */
  const sendToChat = async (chat: ChatWithDetails) => {
    if (!lastCapturedMedia) return;

    try {
      console.log(`📤 Sending ${lastCapturedMedia.type} to chat:`, chat.name || chat.id);
      
      // Handle story posting
      if (chat.id === 'demo-story') {
        await postToStory();
        return;
      }
      
      // In demo mode, just show success message for other chats
      if (chat.id.startsWith('demo-')) {
        Alert.alert(
          'Demo Mode', 
          `${lastCapturedMedia.type === 'photo' ? 'Photo' : 'Video'} would be sent to "${getChatDisplayName(chat)}"!\n\nIn the full app, this would upload the media and send it to the real chat.`,
          [{ text: 'OK', onPress: () => setShowChatSelection(false) }]
        );
        return;
      }

      // Show loading state
      Alert.alert('Sending...', 'Uploading your photo...');

      // Upload media to Supabase Storage
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${lastCapturedMedia.type === 'photo' ? 'jpg' : 'mp4'}`;
      const filePath = `${user?.id}/chat-media/${fileName}`;

      console.log('📤 Uploading to path:', filePath);
      console.log('👤 User ID:', user?.id);

      // **FIX: Validate file exists and has size before upload**
      console.log('📋 Validating file before upload...');
      const fileInfo = await FileSystem.getInfoAsync(lastCapturedMedia.uri);
      console.log('📊 File info:', fileInfo);
      
      if (!fileInfo.exists) {
        throw new Error('Captured file does not exist');
      }
      
      if (fileInfo.size === 0) {
        throw new Error('Captured file is empty (0 bytes)');
      }
      
      console.log('✅ File validation passed:', {
        exists: fileInfo.exists,
        size: `${(fileInfo.size / 1024).toFixed(2)} KB`,
        uri: lastCapturedMedia.uri
      });

      // **FIX: Use FormData for proper React Native file upload**
      console.log('📤 Creating FormData for upload...');
      
      const formData = new FormData();
      formData.append('file', {
        uri: lastCapturedMedia.uri,
        type: lastCapturedMedia.type === 'photo' ? 'image/jpeg' : 'video/mp4',
        name: fileName,
      } as any);

      console.log('📤 Uploading with FormData...');
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, formData, {
          contentType: lastCapturedMedia.type === 'photo' ? 'image/jpeg' : 'video/mp4',
          upsert: false
        });

      if (uploadError) {
        // **FIX: Better error logging to see actual error details**
        console.error('❌ Upload error details:', JSON.stringify(uploadError, null, 2));
        console.error('❌ Upload error message:', uploadError.message);
        console.error('❌ Upload error name:', uploadError.name);
        
        // **FIX: Better error handling for storage policies**
        if (uploadError.message?.includes('row-level security') || 
            uploadError.message?.includes('policy') ||
            uploadError.message?.includes('permission')) {
          
          Alert.alert(
            'Storage Permission Error', 
            `Upload failed due to permissions.\n\nFile path: ${filePath}\nUser ID: ${user?.id}\n\nError: ${uploadError.message}`,
            [{ text: 'OK' }]
          );
          return;
        }
        
        throw new Error(`Failed to upload media: ${uploadError.message}`);
      }

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('media')
        .getPublicUrl(filePath);

      const mediaUrl = urlData.publicUrl;
      console.log('✅ Media uploaded to:', mediaUrl);

      // Validate the URL before sending
      if (!mediaUrl || mediaUrl.includes('undefined') || mediaUrl.includes('null')) {
        throw new Error(`Invalid media URL generated: ${mediaUrl}`);
      }

      // Test the URL accessibility
      try {
        const testResponse = await fetch(mediaUrl, { method: 'HEAD' });
        if (!testResponse.ok) {
          console.warn('⚠️ Media URL may not be accessible:', testResponse.status, testResponse.statusText);
        } else {
          console.log('✅ Media URL is accessible');
        }
      } catch (testError) {
        console.warn('⚠️ Could not test media URL accessibility:', testError);
      }

      // Send message with media using chatService for proper disappearing message support
      await chatService.sendMessage(
        chat.id,
        `Shared a ${lastCapturedMedia.type}`,
        mediaUrl,
        lastCapturedMedia.type as 'photo' | 'video'
      );

      console.log('✅ Message sent successfully');
      Alert.alert('Success!', `${lastCapturedMedia.type === 'photo' ? 'Photo' : 'Video'} sent to ${getChatDisplayName(chat)}!`);
      setShowChatSelection(false);
      setLastCapturedMedia(null);

    } catch (error) {
      console.error('❌ Error sending media:', error);
      
      // Provide specific error messages
      let errorMessage = 'Failed to send media. Please try again.';
      if (error instanceof Error) {
        if (error.message.includes('upload')) {
          errorMessage = 'Failed to upload media. Check your internet connection.';
        } else if (error.message.includes('storage')) {
          errorMessage = 'Storage error. Please try again.';
        }
      }
      
      Alert.alert('Error', errorMessage);
    }
  };

  /**
   * Go back to previous screen
   */
  function goBack() {
    navigation.goBack();
  }

  /**
   * Test function to manually trigger disappearing message flow for existing photo
   * Call this from console: testPhotoDisappear()
   */
  const testPhotoDisappear = async () => {
    console.log('🧪 Testing photo disappearing message flow...');
    
    try {
      const messageId = 'f4682c2f-4449-40a2-a8ec-12a1242f8ae9';
      const chatId = '9282a19b-8234-476f-87c3-6396f35e8ab2';
      const senderId = '1501af7a-9cb6-46af-971e-19707f0cc5b4'; // janedoe
      const recipientId = '14243396-afe6-49b2-8854-e467e46513cc'; // johndoe
      
      console.log('1. Photo message details:');
      console.log('   - Message ID:', messageId);
      console.log('   - Chat ID:', chatId);
      console.log('   - Sender (janedoe):', senderId);
      console.log('   - Recipient (johndoe):', recipientId);
      
      // Check current message state
      const { data: messageState } = await supabase
        .from('messages')
        .select('is_disappearing, viewed_by_recipient, should_disappear')
        .eq('id', messageId)
        .single();
      
      console.log('2. Current message state:', messageState);
      
      // Mark as viewed by recipient (simulate tapping the photo)
      console.log('3. Marking photo as viewed by recipient...');
      const { error: viewError } = await supabase.rpc('mark_message_viewed', {
        p_message_id: messageId,
        p_viewer_id: recipientId
      });
      
      if (viewError) {
        console.error('❌ Error marking photo as viewed:', viewError);
        return;
      }
      console.log('✅ Photo marked as viewed by recipient');
      
      // Check message state after viewing
      const { data: messageAfterView } = await supabase
        .from('messages')
        .select('viewed_by_recipient, should_disappear')
        .eq('id', messageId)
        .single();
      
      console.log('4. Message state after viewing:', messageAfterView);
      
      // Mark both users as inactive (simulate leaving chat)
      console.log('5. Marking both users as inactive...');
      await supabase.rpc('update_chat_presence', {
        p_chat_id: chatId,
        p_user_id: senderId,
        p_is_active: false
      });
      
      await supabase.rpc('update_chat_presence', {
        p_chat_id: chatId,
        p_user_id: recipientId,
        p_is_active: false
      });
      
      console.log('✅ Both users marked as inactive');
      
      // Check presence state
      const { data: presence } = await supabase
        .from('chat_presence')
        .select('user_id, is_active')
        .eq('chat_id', chatId);
      
      console.log('6. Presence state:', presence);
      
      // Wait a moment and trigger cleanup
      console.log('7. Waiting 2 seconds...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('8. Triggering cleanup...');
      const { data: cleanupResult } = await supabase.rpc('full_message_cleanup');
      console.log('✅ Cleanup result:', cleanupResult);
      
      // Check if message still exists
      console.log('9. Checking if photo message still exists...');
      const { data: messageCheck } = await supabase
        .from('messages')
        .select('id, should_disappear, viewed_by_recipient')
        .eq('id', messageId)
        .single();
      
      if (messageCheck) {
        console.log('📝 Photo message still exists:', messageCheck);
        
        if (messageCheck.should_disappear) {
          console.log('⚠️ Photo marked for deletion but not deleted yet');
        } else {
          console.log('❌ Photo NOT marked for deletion');
        }
      } else {
        console.log('💨 SUCCESS! Photo message disappeared!');
      }
      
    } catch (error) {
      console.error('❌ Test failed:', error);
    }
  };

  // Expose test function to global scope for debugging
  useEffect(() => {
    if (__DEV__) {
      (global as any).testPhotoDisappear = testPhotoDisappear;
    }
  }, []);

  if (!permission) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <Text style={{ color: 'white' }}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.button}>
          <Text style={styles.text}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Show chat selection overlay
  if (showChatSelection && lastCapturedMedia) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Share Photo</Text>
              <TouchableOpacity onPress={() => setShowChatSelection(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {lastCapturedMedia && (
              <View style={styles.mediaPreview}>
                <Image source={{ uri: lastCapturedMedia.uri }} style={styles.previewImage} />
                <Text style={styles.mediaType}>
                  {lastCapturedMedia.type === 'photo' ? '📸 Photo' : '🎥 Video'}
                </Text>
              </View>
            )}

            {/* My Story Section */}
            <TouchableOpacity
              style={styles.storyItem}
              onPress={() => postToStory()}
            >
              <View style={styles.storyAvatar}>
                <Text style={styles.storyAvatarText}>📱</Text>
              </View>
              <View style={styles.chatInfo}>
                <Text style={styles.storyName}>My Story</Text>
                <Text style={styles.chatDescription}>Share to your story</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#007AFF" />
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Chats Section */}
            <FlatList
              data={getFilteredChats().filter(chat => chat.id !== 'demo-story')}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.chatItem}
                  onPress={() => sendToChat(item)}
                >
                  <View style={styles.chatAvatar}>
                    <Text style={styles.chatAvatarText}>
                      {getChatAvatarText(item)}
                    </Text>
                  </View>
                  <View style={styles.chatInfo}>
                    <Text style={styles.chatName}>
                      {getChatDisplayName(item)}
                    </Text>
                    <Text style={styles.chatDescription}>
                      {getChatDescription(item)}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#999" />
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No chats available</Text>
                  <Text style={styles.emptySubtext}>Connect with friends to share media!</Text>
                </View>
              }
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View ref={captureViewRef} style={styles.captureContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={facing}
          flash={flash}
          mode="video"
        >
        {/* Top controls */}
        <View style={styles.topControls}>
          <TouchableOpacity onPress={goBack} style={styles.topButton}>
            <Ionicons name="close" size={30} color="white" />
          </TouchableOpacity>


          <TouchableOpacity 
            onPress={toggleFlash} 
            style={[
              styles.topButton,
              { backgroundColor: getFlashButtonColor() }
            ]}
          >
            <Ionicons name={getFlashIcon()} size={30} color="white" />
          </TouchableOpacity>
        </View>

        {/* Flash mode indicator */}
        {flash !== 'off' && facing === 'back' && (
          <View style={styles.flashIndicator}>
            <Text style={styles.flashIndicatorText}>
              {flash === 'on' ? '⚡ ON' : flash === 'auto' ? '⚡ AUTO' : ''}
            </Text>
          </View>
        )}

        {/* Recording indicator */}
        {isRecording && (
          <View style={styles.recordingIndicator}>
            <View style={styles.recordingDot} />
            <Text style={styles.recordingText}>Recording {getRecordingDuration()}</Text>
          </View>
        )}



        {/* Bottom controls */}
        <View style={styles.bottomControls}>
          {/* Flip camera button */}
          <TouchableOpacity onPress={switchCamera} style={styles.flipButton}>
            <Ionicons name="camera-reverse" size={30} color="white" />
          </TouchableOpacity>

          <View style={styles.captureArea}>
            <Text style={styles.instructionText}>
              {isRecording ? 'Release to stop recording' : 'Tap for photo • Hold for video'}
            </Text>
            
            <Pressable
              style={[styles.captureButton, isRecording && styles.recordingButton]}
              onPress={handleCapturePress}
              onLongPress={startRecording}
              onPressOut={isRecording ? stopRecording : undefined}
              delayLongPress={500}
            >
              <View style={[styles.captureInner, isRecording && styles.recordingInner]} />
            </Pressable>
          </View>

          {/* Overlay add button */}
          <TouchableOpacity 
            onPress={() => setShowOverlaySelector(true)}
            style={[
              styles.flipButton,
              !overlayManager.canAddOverlay() && styles.disabledButton
            ]}
            disabled={!overlayManager.canAddOverlay()}
          >
            <Ionicons 
              name="add" 
              size={30} 
              color={overlayManager.canAddOverlay() ? "white" : "#666"} 
            />
          </TouchableOpacity>
        </View>

        {/* Sports Overlays */}
        {activeOverlays.map((overlay) => {
          const teamAsset = userTeams.find(team => team.id === overlay.teamId);
          
          // Debug overlay positioning
          const overlayScreenPos = {
            left: overlay.position.x * screenWidth,
            top: overlay.position.y * screenHeight,
            width: overlay.position.width * screenWidth,
            height: overlay.position.height * screenHeight,
          };
          
          console.log(`🎯 OVERLAY POSITION DEBUG for "${overlay.customContent}":`, {
            relativePosition: overlay.position,
            screenDimensions: { screenWidth, screenHeight },
            absolutePosition: overlayScreenPos,
            isOnScreen: {
              horizontal: overlayScreenPos.left >= 0 && overlayScreenPos.left < screenWidth,
              vertical: overlayScreenPos.top >= 0 && overlayScreenPos.top < screenHeight,
              withinBounds: (overlayScreenPos.left + overlayScreenPos.width) <= screenWidth && 
                           (overlayScreenPos.top + overlayScreenPos.height) <= screenHeight
            }
          });
          
          return (
            <TeamTextOverlay
              key={overlay.id}
              overlay={overlay}
              teamAsset={teamAsset}
              screenWidth={screenWidth}
              screenHeight={screenHeight}
            />
          );
        })}



        {/* Overlay edit controls - only show when overlays exist */}
        {activeOverlays.length > 0 && (
          <View style={styles.overlayEditControls}>
            <TouchableOpacity
              onPress={toggleOverlayMode}
              style={[styles.editButton, overlayMode && styles.editButtonActive]}
            >
              <Ionicons 
                name="move" 
                size={20} 
                color={overlayMode ? "#fff" : "#007AFF"} 
              />
              <Text style={[styles.editButtonText, { 
                color: overlayMode ? "#fff" : "#007AFF" 
              }]}>
                {overlayMode ? 'Done' : 'Edit'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={clearAllOverlays}
              style={styles.editButton}
            >
              <Ionicons name="trash" size={20} color="#FF3B30" />
              <Text style={[styles.editButtonText, { color: "#FF3B30" }]}>
                Clear
              </Text>
            </TouchableOpacity>
          </View>
        )}

      </CameraView>
      </View>

      {/* DEBUG: Simple template buttons outside modal */}
      {showOverlaySelector && (
        <>
          {/* Victory Template */}
          <TouchableOpacity
            onPress={() => {
              console.log('🔥 VICTORY BUTTON PRESSED!');
              handleTemplateSelect(
                {
                  id: 'victory-simple',
                  name: 'Victory!',
                  description: 'Celebrate your teams victory',
                  category: 'victory',
                  preview: '🏆',
                  defaultPosition: { x: 0.1, y: 0.3, width: 0.8, height: 0.2, rotation: 0, scale: 1 },
                  teamDependent: true,
                  elements: [
                    {
                      id: 'victory-text',
                      type: 'text',
                      content: 'VICTORY!',
                      position: { x: 0, y: 0, width: 1, height: 1, rotation: 0, scale: 1 },
                      style: {
                        fontSize: 28,
                        fontWeight: 'bold',
                        color: '#FFD700',
                        textAlign: 'center',
                        textShadow: true,
                      },
                    }
                  ],
                },
                userTeams[0]?.id
              );
            }}
            style={{
              position: 'absolute',
              top: 200,
              left: 20,
              backgroundColor: '#FF6B35',
              padding: 15,
              borderRadius: 10,
              zIndex: 20000,
              elevation: 20000,
            }}
          >
            <Text style={{ color: 'white', fontSize: 14, fontWeight: 'bold' }}>
              🏆 VICTORY
            </Text>
          </TouchableOpacity>

          {/* Game Day Template */}
          <TouchableOpacity
            onPress={() => {
              console.log('🏈 GAME DAY BUTTON PRESSED!');
              handleTemplateSelect(
                {
                  id: 'gameday-simple',
                  name: 'Game Day Hype',
                  description: 'Get hyped for the game',
                  category: 'gameday',
                  preview: '🏈',
                  defaultPosition: { x: 0.1, y: 0.4, width: 0.8, height: 0.15, rotation: 0, scale: 1 },
                  teamDependent: true,
                  elements: [
                    {
                      id: 'gameday-text',
                      type: 'text',
                      content: 'GAME DAY!',
                      position: { x: 0, y: 0, width: 1, height: 1, rotation: 0, scale: 1 },
                      style: {
                        fontSize: 24,
                        fontWeight: 'bold',
                        color: '#FFFFFF',
                        textAlign: 'center',
                        textShadow: true,
                      },
                    }
                  ],
                },
                userTeams[0]?.id
              );
            }}
            style={{
              position: 'absolute',
              top: 200,
              right: 20,
              backgroundColor: '#2E8B57',
              padding: 15,
              borderRadius: 10,
              zIndex: 20000,
              elevation: 20000,
            }}
          >
            <Text style={{ color: 'white', fontSize: 14, fontWeight: 'bold' }}>
              🏈 GAME DAY
            </Text>
          </TouchableOpacity>

          {/* Original Test Button */}
          <TouchableOpacity
            onPress={() => {
              console.log('🟢 DEBUG BUTTON WORKING!');
              handleTemplateSelect(
                {
                  id: 'debug-test',
                  name: 'Debug Test',
                  description: 'Test overlay',
                  category: 'victory',
                  preview: '🚨',
                  defaultPosition: { x: 0.1, y: 0.3, width: 0.8, height: 0.2, rotation: 0, scale: 1 },
                  teamDependent: false,
                  elements: [
                    {
                      id: 'debug-text',
                      type: 'text',
                      content: 'DEBUG WORKING!',
                      position: { x: 0, y: 0, width: 1, height: 1, rotation: 0, scale: 1 },
                      style: {
                        fontSize: 32,
                        fontWeight: 'bold',
                        color: '#FF0000',
                        backgroundColor: '#FFFF00',
                        borderRadius: 8,
                        textAlign: 'center',
                        borderWidth: 2,
                        borderColor: '#000000',
                      },
                    }
                  ],
                },
                userTeams[0]?.id
              );
            }}
            style={{
              position: 'absolute',
              top: 100,
              right: 20,
              backgroundColor: '#4CAF50',
              padding: 15,
              borderRadius: 10,
              zIndex: 20000,
              elevation: 20000,
            }}
          >
            <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>
              🟢 TEST
            </Text>
          </TouchableOpacity>
        </>
      )}

      {/* Overlay selector modal - OUTSIDE camera view for proper layering */}
      <OverlayTemplateSelector
        visible={showOverlaySelector}
        onClose={() => setShowOverlaySelector(false)}
        onTemplateSelect={handleTemplateSelect}
        userTeams={userTeams}
        onRemoveAll={removeAllOverlays}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  topButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  recordingIndicator: {
    position: 'absolute',
    top: 80,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,0,0,0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'white',
    marginRight: 8,
  },
  recordingText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },

  bottomControls: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  flipButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureArea: {
    alignItems: 'center',
  },
  instructionText: {
    color: 'white',
    fontSize: 14,
    marginBottom: 15,
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  recordingButton: {
    borderColor: 'red',
  },
  captureInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
  },
  recordingInner: {
    backgroundColor: 'red',
    borderRadius: 8,
    width: 30,
    height: 30,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: screenWidth * 0.9,
    maxHeight: screenHeight * 0.8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  mediaPreview: {
    alignItems: 'center',
    marginBottom: 20,
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 10,
    marginBottom: 10,
  },
  mediaType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  chatAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  chatAvatarText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  chatInfo: {
    flex: 1,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  chatDescription: {
    fontSize: 14,
    color: '#666',
  },
  // Story styles
  storyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    marginBottom: 10,
  },
  storyAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  storyAvatarText: {
    fontSize: 20,
  },
  storyName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#007AFF',
    marginBottom: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E5EA',
    marginVertical: 10,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  // Permission styles
  message: {
    textAlign: 'center',
    paddingBottom: 10,
    color: 'white',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  text: {
    color: 'white',
    fontWeight: 'bold',
  },
  flashIndicator: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 5,
    borderRadius: 10,
  },
  flashIndicatorText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  captureContainer: {
    flex: 1,
  },
  overlayModeControls: {
    position: 'absolute',
    bottom: 120,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  overlayButton: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  overlayButtonActive: {
    backgroundColor: '#007AFF',
  },
  overlayButtonText: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  disabledButton: {
    opacity: 0.5,
  },
  overlayEditControls: {
    position: 'absolute',
    top: 80,
    right: 20,
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 8,
  },
  editButtonActive: {
    backgroundColor: '#007AFF',
  },
  editButtonText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
    color: 'white',
  },
});