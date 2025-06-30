/**
 * StoryCreatorScreen Component
 * 
 * Story creation interface with camera capture, editing tools, privacy settings,
 * and sports-themed filters. Provides comprehensive story creation workflow.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  Modal,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { StoriesService, CreateStoryData } from '../../services/stories/storiesService';
import { supabase } from '../../services/database/supabase';
import { Button } from '../../components/ui/Button';

interface StoryCreatorScreenProps {
  navigation: any;
  route?: {
    params?: {
      mediaUri?: string;
      mediaType?: 'photo' | 'video';
    };
  };
}

/**
 * Story creator screen with media selection and editing functionality
 */
export function StoryCreatorScreen({ navigation, route }: StoryCreatorScreenProps) {
  const [capturedMedia, setCapturedMedia] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'photo' | 'video'>('photo');
  const [caption, setCaption] = useState('');
  const [privacySetting, setPrivacySetting] = useState<'public' | 'friends' | 'teams'>('friends');
  const [isUploading, setIsUploading] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  const storiesService = new StoriesService();

  useEffect(() => {
    // If media was passed from camera screen
    if (route?.params?.mediaUri) {
      setCapturedMedia(route.params.mediaUri);
      setMediaType(route.params.mediaType || 'photo');
    } else {
      // Show camera options immediately
      showCameraOptions();
    }
  }, []);

  /**
   * Show camera options for capturing or selecting media
   */
  function showCameraOptions() {
    Alert.alert(
      'Create Story',
      'Choose how you want to create your story',
      [
        { text: 'Camera', onPress: takePhoto },
        { text: 'Photo Library', onPress: selectFromGallery },
        { text: 'Cancel', onPress: () => navigation.goBack(), style: 'cancel' },
      ]
    );
  }

  /**
   * Take photo using camera
   */
  async function takePhoto() {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Camera permission is required to take photos');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [9, 16],
        quality: 0.8,
        mediaTypes: ImagePicker.MediaTypeOptions.All,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setCapturedMedia(asset.uri);
        setMediaType(asset.type === 'video' ? 'video' : 'photo');
      } else {
        navigation.goBack();
      }
    } catch (error) {
      console.error('Failed to take photo:', error);
      Alert.alert('Error', 'Failed to take photo');
      navigation.goBack();
    }
  }

  /**
   * Select media from gallery
   */
  async function selectFromGallery() {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Media library permission is required to select photos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        aspect: [9, 16],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setCapturedMedia(asset.uri);
        setMediaType(asset.type === 'video' ? 'video' : 'photo');
      } else {
        navigation.goBack();
      }
    } catch (error) {
      console.error('Failed to select media:', error);
      Alert.alert('Error', 'Failed to select media');
      navigation.goBack();
    }
  }

  /**
   * Create and upload story
   */
  async function createStory() {
    if (!capturedMedia) {
      Alert.alert('Error', 'Please capture or select media first');
      return;
    }

    try {
      setIsUploading(true);

      console.log('📤 Uploading story media...');
      
      // Upload media to Supabase Storage first
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${mediaType === 'photo' ? 'jpg' : 'mp4'}`;
      const filePath = `story-uploads/${fileName}`;

      // Create FormData for upload
      const formData = new FormData();
      formData.append('file', {
        uri: capturedMedia,
        type: mediaType === 'photo' ? 'image/jpeg' : 'video/mp4',
        name: fileName,
      } as any);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, formData, {
          contentType: mediaType === 'photo' ? 'image/jpeg' : 'video/mp4',
          upsert: false
        });

      if (uploadError) {
        console.error('❌ Upload error:', uploadError);
        
        if (uploadError.message?.includes('row-level security') || 
            uploadError.message?.includes('policy')) {
          Alert.alert(
            'Storage Setup Required', 
            'Media upload requires storage policies to be configured. Please check your Supabase storage settings.',
            [{ text: 'OK' }]
          );
          return;
        }
        
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('media')
        .getPublicUrl(filePath);

      if (!urlData.publicUrl) {
        throw new Error('Failed to generate public URL for uploaded media');
      }

      console.log('✅ Media uploaded successfully:', urlData.publicUrl);

      // Create story with uploaded media URL
      const storyData: CreateStoryData = {
        mediaUrl: urlData.publicUrl,
        mediaType,
        caption: caption.trim() || undefined,
        privacySetting,
        thumbnailUrl: mediaType === 'video' ? undefined : urlData.publicUrl,
      };

      const createdStory = await storiesService.createStory(storyData);
      console.log('✅ Story created successfully:', createdStory.id);
      
      Alert.alert(
        'Success',
        'Your story has been posted!',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('❌ Failed to create story:', error);
      
      let errorMessage = 'Failed to post story. Please try again.';
      if (error instanceof Error) {
        if (error.message.includes('storage') || error.message.includes('upload')) {
          errorMessage = 'Storage error. Please check your internet connection and try again.';
        } else if (error.message.includes('row-level security')) {
          errorMessage = 'Permission error. Please contact support.';
        } else {
          errorMessage = `Error: ${error.message}`;
        }
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setIsUploading(false);
    }
  }

  /**
   * Render privacy settings modal
   */
  function renderPrivacyModal() {
    return (
      <Modal
        visible={showPrivacyModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowPrivacyModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-gray-900 rounded-t-3xl p-6">
            <Text className="text-white text-xl font-bold mb-6 text-center">
              Story Privacy
            </Text>
            
            <TouchableOpacity
              onPress={() => {
                setPrivacySetting('friends');
                setShowPrivacyModal(false);
              }}
              className={`p-4 rounded-lg mb-3 ${
                privacySetting === 'friends' ? 'bg-interactive' : 'bg-dark-bg-elevated'
              }`}
            >
              <Text className="text-white font-semibold">👥 Friends</Text>
              <Text className="text-gray-400 text-sm">Only your friends can see this story</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setPrivacySetting('public');
                setShowPrivacyModal(false);
              }}
              className={`p-4 rounded-lg mb-3 ${
                privacySetting === 'public' ? 'bg-interactive' : 'bg-dark-bg-elevated'
              }`}
            >
              <Text className="text-white font-semibold">🌍 Public</Text>
              <Text className="text-gray-400 text-sm">Anyone can see this story</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setPrivacySetting('teams');
                setShowPrivacyModal(false);
              }}
              className={`p-4 rounded-lg mb-6 ${
                privacySetting === 'teams' ? 'bg-interactive' : 'bg-dark-bg-elevated'
              }`}
            >
              <Text className="text-white font-semibold">🏀 Team Fans</Text>
              <Text className="text-gray-400 text-sm">Only fans of your teams can see this</Text>
            </TouchableOpacity>

            <Button
              title="Cancel"
              onPress={() => setShowPrivacyModal(false)}
              variant="secondary"
            />
          </View>
        </View>
      </Modal>
    );
  }

  if (!capturedMedia) {
    return (
      <SafeAreaView className="flex-1 bg-black justify-center items-center">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="text-white mt-4">Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-black">
      <View className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3">
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text className="text-white text-lg">←</Text>
          </TouchableOpacity>
          <Text className="text-white font-semibold">Create Story</Text>
          <TouchableOpacity onPress={showCameraOptions}>
                            <Text className="text-interactive">🔄</Text>
          </TouchableOpacity>
        </View>

        {/* Media Display */}
        <View className="flex-1 justify-center">
          {mediaType === 'video' ? (
            <View className="flex-1 justify-center items-center bg-gray-800">
              <Text className="text-white text-lg mb-4">📹 Video Selected</Text>
              <Text className="text-gray-400 text-sm">Video preview coming soon</Text>
            </View>
          ) : (
            <Image
              source={{ uri: capturedMedia }}
              className="w-full h-full"
              resizeMode="contain"
            />
          )}
        </View>

        {/* Caption Input */}
        <View className="px-4 py-2">
          <TextInput
            value={caption}
            onChangeText={setCaption}
            placeholder="Add a caption..."
            placeholderTextColor="#9CA3AF"
            className="text-white bg-gray-800 rounded-lg px-4 py-3 text-base"
            multiline
            maxLength={200}
          />
        </View>

        {/* Privacy and Share Controls */}
        <View className="px-4 pb-6">
          <TouchableOpacity
            onPress={() => setShowPrivacyModal(true)}
            className="flex-row items-center bg-gray-800 rounded-lg p-4 mb-4"
          >
            <Text className="text-white font-medium flex-1">
              Privacy: {privacySetting === 'friends' ? '👥 Friends' : 
                       privacySetting === 'public' ? '🌍 Public' : '🏀 Team Fans'}
            </Text>
            <Text className="text-gray-400">⚙️</Text>
          </TouchableOpacity>

          <Button
            title={isUploading ? "Posting..." : "Share to Story"}
            onPress={createStory}
            disabled={isUploading}
            isLoading={isUploading}
            variant="primary"
            fullWidth
          />
        </View>
      </View>

      {renderPrivacyModal()}
    </SafeAreaView>
  );
} 