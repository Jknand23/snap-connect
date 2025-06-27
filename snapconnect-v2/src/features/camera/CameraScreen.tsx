/**
 * Camera Screen
 * Handles photo/video capture with sports-themed AR filters and effects
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
import { useAuthStore } from '../../stores/authStore';
import type { ChatWithDetails } from '../../services/messaging/messagingService';
import { supabase } from '../../services/database/supabase';
import { StoriesService } from '../../services/stories/storiesService';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface ARFilter {
  id: string;
  name: string;
  emoji: string;
  type: 'logo-overlay' | 'team-colors' | 'victory-celebration';
}

// Basic AR filters for Phase 2
const AR_FILTERS: ARFilter[] = [
  { id: 'none', name: 'None', emoji: '📷', type: 'logo-overlay' },
  { id: 'victory', name: 'Victory', emoji: '🎉', type: 'victory-celebration' },
  { id: 'sports', name: 'Sports', emoji: '⚽', type: 'logo-overlay' },
  { id: 'champion', name: 'Champion', emoji: '🏆', type: 'victory-celebration' },
];

interface CameraScreenProps {
  navigation: any;
}

/**
 * Camera Screen Component - Handles photo/video capture and sharing
 * Provides Snapchat-style camera interface with AR filters and chat sharing
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
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [flash, setFlash] = useState<FlashMode>('off');
  const [showChatSelection, setShowChatSelection] = useState(false);
  const [userChats, setUserChats] = useState<ChatWithDetails[]>([]);
  const [lastCapturedMedia, setLastCapturedMedia] = useState<{
    uri: string;
    type: 'photo' | 'video';
  } | null>(null);

  /**
   * Request media library permissions and load chats
   */
  useEffect(() => {
    (async () => {
      await MediaLibrary.requestPermissionsAsync();
      await loadUserChats();
    })();
  }, []);

  /**
   * Load user's chats for photo sharing
   */
  async function loadUserChats() {
    try {
      console.log('🔍 Loading user chats...');
      
      const chats = await messagingService.getUserChats();
      console.log('📱 Retrieved chats:', chats?.length || 0);

      if (chats && chats.length > 0) {
        setUserChats(chats);
        console.log('✅ Successfully loaded chats:', chats.map(c => ({ id: c.id, name: c.name, type: c.type })));
      } else {
        console.log('⚠️ No existing chats found, creating mock chats for testing...');
        await createMockChats();
      }
    } catch (error) {
      console.error('❌ Error loading chats:', error);
      // Fallback to mock chats on error
      await createMockChats();
    }
  }

  /**
   * Create mock chats for testing when no real chats exist
   */
  const createMockChats = async () => {
    try {
      console.log('🔨 Creating mock test chats...');
      
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
      console.log('✅ Created mock chats for testing:', mockChats.length);
    } catch (error) {
      console.error('❌ Error creating mock chats:', error);
      setUserChats([]);
    }
  };

  /**
   * Handle capture button press (photos only)
   */
  const handleCapturePress = async () => {
    if (!cameraRef.current || isRecording) return;

    try {
      console.log('📸 Taking photo with flash mode:', flash);
      
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });

      console.log('✅ Photo captured:', photo.uri);
      setLastCapturedMedia({ uri: photo.uri, type: 'photo' });
      setShowChatSelection(true);
    } catch (error) {
      console.error('❌ Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
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

      // Send message with media
      await messagingService.sendMessage({
        chatId: chat.id,
        content: `Shared a ${lastCapturedMedia.type}`,
        mediaUrl: mediaUrl,
        mediaType: lastCapturedMedia.type as 'photo' | 'video',
      });

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
          
          <View style={styles.filterContainer}>
            <FlatList
              horizontal
              data={AR_FILTERS}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.filterButton,
                    selectedFilter === item.id && styles.selectedFilter
                  ]}
                  onPress={() => setSelectedFilter(item.id)}
                >
                  <Text style={styles.filterButtonText}>{item.emoji}</Text>
                </TouchableOpacity>
              )}
            />
          </View>

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

        {/* AR Filter overlay on camera */}
        {selectedFilter && selectedFilter !== 'none' && (
          <View style={styles.filterOverlay}>
            <Text style={styles.filterEmoji}>{selectedFilter}</Text>
            <Text style={styles.filterText}>GO TEAM!</Text>
          </View>
        )}

        {/* Bottom controls */}
        <View style={styles.bottomControls}>
          {/* Flip camera button */}
          <TouchableOpacity onPress={switchCamera} style={styles.flipButton}>
            <Ionicons name="camera-reverse" size={30} color="white" />
          </TouchableOpacity>

          <View style={styles.captureContainer}>
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

          {/* Placeholder for symmetry */}
          <View style={styles.flipButton} />
        </View>
      </CameraView>
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
  filterContainer: {
    flex: 1,
    marginHorizontal: 20,
  },
  filterButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  selectedFilter: {
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderWidth: 2,
    borderColor: 'white',
  },
  filterButtonText: {
    fontSize: 20,
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
  filterOverlay: {
    position: 'absolute',
    top: '40%',
    left: '50%',
    transform: [{ translateX: -50 }, { translateY: -50 }],
    alignItems: 'center',
  },
  filterEmoji: {
    fontSize: 80,
    marginBottom: 10,
  },
  filterText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
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
  captureContainer: {
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
});