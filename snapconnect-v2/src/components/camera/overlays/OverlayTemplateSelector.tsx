/**
 * Overlay Template Selector Component
 * Allows users to browse and select sports overlay templates
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { overlayTemplateService } from '../../../services/overlays/overlayTemplateService';
import { teamAssetService } from '../../../services/overlays/teamAssetService';
import type { OverlayTemplate, SmartSuggestion, TeamAsset } from '../../../types/overlays';

interface OverlayTemplateSelectorProps {
  visible: boolean;
  onClose: () => void;
  onTemplateSelect: (template: OverlayTemplate, teamId?: string) => void;
  userTeams: TeamAsset[];
  onRemoveAll?: () => void;
}

/**
 * Overlay Template Selector - Browse and select overlay templates
 */
export function OverlayTemplateSelector({
  visible,
  onClose,
  onTemplateSelect,
  userTeams = [],
  onRemoveAll,
}: OverlayTemplateSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('suggested');
  const [templates, setTemplates] = useState<OverlayTemplate[]>([]);
  const [smartSuggestions, setSmartSuggestions] = useState<SmartSuggestion[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  const categories = [
    { id: 'suggested', name: 'Suggested', icon: '⭐' },
    { id: 'victory', name: 'Victory', icon: '🏆' },
    { id: 'gameday', name: 'Game Day', icon: '🔥' },
    { id: 'pride', name: 'Team Pride', icon: '💪' },
    { id: 'rivalry', name: 'Rivalry', icon: '⚔️' },
    { id: 'seasonal', name: 'Seasonal', icon: '📅' },
    { id: 'player', name: 'Player', icon: '⭐' },
  ];

  /**
   * Load templates and suggestions
   */
  useEffect(() => {
    if (visible) {
      loadTemplatesAndSuggestions();
      
      // Set default team if available
      if (userTeams.length > 0 && !selectedTeamId) {
        setSelectedTeamId(userTeams[0].id);
      }
    }
  }, [visible, selectedCategory, userTeams]);

  /**
   * Load templates and smart suggestions
   */
  const loadTemplatesAndSuggestions = async () => {
    try {
      console.log('📚 LOADING TEMPLATES:', {
        selectedCategory,
        userTeamsCount: userTeams.length,
        userTeams: userTeams.map(t => ({ id: t.id, name: t.name }))
      });

      if (selectedCategory === 'suggested') {
        console.log('📚 Loading smart suggestions...');
        const suggestions = await overlayTemplateService.getSmartSuggestions(userTeams);
        console.log('📚 Smart suggestions loaded:', {
          count: suggestions.length,
          suggestions: suggestions.map(s => ({ templateId: s.template.id, templateName: s.template.name, reason: s.reason }))
        });
        setSmartSuggestions(suggestions);
      } else {
        console.log('📚 Loading category templates for:', selectedCategory);
        const categoryTemplates = overlayTemplateService.getTemplatesByCategory(selectedCategory);
        console.log('📚 Category templates loaded:', {
          category: selectedCategory,
          count: categoryTemplates.length,
          templates: categoryTemplates.map(t => ({ id: t.id, name: t.name }))
        });
        setTemplates(categoryTemplates);
      }
    } catch (error) {
      console.error('❌ Error loading templates:', error);
    }
  };

  /**
   * Handle template selection
   */
  const handleTemplateSelect = async (template: OverlayTemplate, teamId?: string) => {
    try {
      console.log('🔴 MAIN HANDLER - Template selected in selector:', {
        templateId: template.id,
        templateName: template.name,
        teamId,
        selectedTeamId,
        finalTeamId: teamId || selectedTeamId || userTeams[0]?.id
      });

      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      // Use selected team or template's suggested team
      const finalTeamId = teamId || selectedTeamId || userTeams[0]?.id;
      
      console.log('🔴 MAIN HANDLER - Calling parent onTemplateSelect callback...');
      onTemplateSelect(template, finalTeamId);
      
      console.log('🔴 MAIN HANDLER - Closing selector...');
      onClose();
      
      console.log('🔴 MAIN HANDLER - All done!');
    } catch (error) {
      console.error('❌ Error in OverlayTemplateSelector.handleTemplateSelect:', error);
    }
  };

  /**
   * Handle category selection
   */
  const handleCategorySelect = async (categoryId: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCategory(categoryId);
  };

  /**
   * Handle team selection
   */
  const handleTeamSelect = async (teamId: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedTeamId(teamId);
  };

  if (!visible) return null;

  return (
    <View 
      className="absolute inset-0 bg-black/90 justify-end" 
      pointerEvents="auto"
      style={{
        zIndex: 9999,
        elevation: 9999,
      }}
    >
      {/* Header */}
      <View 
        className="bg-white rounded-t-3xl max-h-4/5" 
        pointerEvents="auto"
        style={{
          zIndex: 10000,
          elevation: 10000,
        }}
      >
        <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
          <Text className="text-xl font-bold text-gray-900">Sports Overlays</Text>
          <TouchableOpacity onPress={onClose} className="w-8 h-8 items-center justify-center">
            <Ionicons name="close" size={24} color="#374151" />
          </TouchableOpacity>
        </View>

        {/* Remove All Button */}
        {onRemoveAll && (
          <View className="p-4 border-b border-gray-100">
            <TouchableOpacity
              onPress={() => {
                onRemoveAll();
                onClose();
              }}
              className="bg-red-500 rounded-lg py-3 px-4 flex-row items-center justify-center"
            >
              <Ionicons name="trash" size={20} color="white" />
              <Text className="text-white font-semibold ml-2">Remove All Overlays</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Team Selector */}
        {userTeams.length > 0 && (
          <View className="p-4 border-b border-gray-100">
            <Text className="text-sm font-medium text-gray-700 mb-3">Select Team</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row space-x-3">
                {userTeams.map((team) => (
                  <TouchableOpacity
                    key={team.id}
                    onPress={() => handleTeamSelect(team.id)}
                    className={`px-4 py-2 rounded-full border-2 ${
                      selectedTeamId === team.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 bg-white'
                    }`}
                  >
                    <Text
                      className={`text-sm font-medium ${
                        selectedTeamId === team.id ? 'text-blue-700' : 'text-gray-700'
                      }`}
                    >
                      {team.abbreviation}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Category Tabs */}
        <View className="border-b border-gray-100">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4">
            <View className="flex-row space-x-1 py-3">
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  onPress={() => handleCategorySelect(category.id)}
                  className={`px-4 py-2 rounded-full ${
                    selectedCategory === category.id
                      ? 'bg-blue-500'
                      : 'bg-gray-100'
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${
                      selectedCategory === category.id ? 'text-white' : 'text-gray-700'
                    }`}
                  >
                    {category.icon} {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Template Grid */}
        <View 
          className="flex-1 p-4" 
          style={{
            zIndex: 10001,
            elevation: 10001,
          }}
          pointerEvents="auto"
        >
          {selectedCategory === 'suggested' ? (
            <SmartSuggestionsGrid
              suggestions={smartSuggestions}
              onTemplateSelect={handleTemplateSelect}
              selectedTeamId={selectedTeamId}
            />
          ) : (
            <TemplateGrid
              templates={templates}
              onTemplateSelect={handleTemplateSelect}
              selectedTeamId={selectedTeamId}
            />
          )}
        </View>
      </View>
    </View>
  );
}

interface SmartSuggestionsGridProps {
  suggestions: SmartSuggestion[];
  onTemplateSelect: (template: OverlayTemplate, teamId?: string) => void;
  selectedTeamId: string | null;
}

/**
 * Smart suggestions grid with contextual recommendations
 */
function SmartSuggestionsGrid({
  suggestions,
  onTemplateSelect,
  selectedTeamId,
}: SmartSuggestionsGridProps) {
  if (suggestions.length === 0) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-gray-500 text-lg">No suggestions available</Text>
        <Text className="text-gray-400 text-sm mt-2">Try selecting a category</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={suggestions}
      numColumns={2}
      keyExtractor={(item, index) => `${item.template.id}-${index}`}
      renderItem={({ item }) => (
        <SuggestionCard
          suggestion={item}
          onPress={() => onTemplateSelect(item.template, item.teamId || selectedTeamId || undefined)}
        />
      )}
      columnWrapperStyle={{ justifyContent: 'space-between' }}
      contentContainerStyle={{ 
        paddingBottom: 20,
        zIndex: 10002,
        elevation: 10002,
      }}
      showsVerticalScrollIndicator={false}
      pointerEvents="auto"
      style={{
        zIndex: 10002,
        elevation: 10002,
      }}
    />
  );
}

interface TemplateGridProps {
  templates: OverlayTemplate[];
  onTemplateSelect: (template: OverlayTemplate, teamId?: string) => void;
  selectedTeamId: string | null;
}

/**
 * Template grid for category browsing
 */
function TemplateGrid({
  templates,
  onTemplateSelect,
  selectedTeamId,
}: TemplateGridProps) {
  if (templates.length === 0) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-gray-500 text-lg">No templates found</Text>
        <Text className="text-gray-400 text-sm mt-2">Try a different category</Text>
      </View>
    );
  }

  // Create rows of 2 templates each
  const rows: OverlayTemplate[][] = [];
  for (let i = 0; i < templates.length; i += 2) {
    rows.push(templates.slice(i, i + 2));
  }

  return (
    <ScrollView 
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingBottom: 20 }}
      showsVerticalScrollIndicator={false}
      pointerEvents="auto"
    >
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
          {row.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onPress={() => {
                console.log('🔗 TEMPLATE GRID CALLBACK TRIGGERED:', template.name);
                console.log('🔗 About to call onTemplateSelect...');
                onTemplateSelect(template, selectedTeamId || undefined);
                console.log('🔗 onTemplateSelect call completed');
              }}
            />
          ))}
          {/* Add spacer if odd number of templates in row */}
          {row.length === 1 && <View style={{ width: '48%' }} />}
        </View>
      ))}
    </ScrollView>
  );
}

interface SuggestionCardProps {
  suggestion: SmartSuggestion;
  onPress: () => void;
}

/**
 * Smart suggestion card with relevance indicator
 */
function SuggestionCard({ suggestion, onPress }: SuggestionCardProps) {
  const { template, relevance, reason } = suggestion;

  const reasonLabels = {
    'favorite-team': 'Your Team',
    'game-today': 'Game Today',
    'recent-victory': 'Victory',
    'rivalry': 'Rivalry',
    'seasonal': 'Seasonal',
    'fallback': 'Popular',
    'emergency-fallback': 'Default',
  };

  const reasonColors = {
    'favorite-team': 'bg-blue-100 text-blue-800',
    'game-today': 'bg-green-100 text-green-800',
    'recent-victory': 'bg-yellow-100 text-yellow-800',
    'rivalry': 'bg-red-100 text-red-800',
    'seasonal': 'bg-purple-100 text-purple-800',
    'fallback': 'bg-gray-100 text-gray-800',
    'emergency-fallback': 'bg-orange-100 text-orange-800',
  };

  return (
    <TouchableOpacity
      onPress={() => {
        console.log('👆 SUGGESTION CARD TAPPED:', template.name);
        onPress();
      }}
      activeOpacity={0.7}
      className="bg-white rounded-xl border border-gray-200 p-4 mb-3 shadow-sm"
      style={{
        width: '48%',
        minHeight: 120,
        elevation: 10003,
        zIndex: 10003,
      }}
    >
      {/* Relevance and reason */}
      <View className="flex-row items-center justify-between mb-3">
        <View className={`px-2 py-1 rounded-full ${reasonColors[reason]}`}>
          <Text className="text-xs font-medium">{reasonLabels[reason]}</Text>
        </View>
        <View className="flex-row items-center">
          <Text className="text-xs text-gray-500 mr-1">
            {Math.round(relevance * 100)}%
          </Text>
          <View className="w-2 h-2 bg-blue-500 rounded-full" />
        </View>
      </View>

      {/* Template preview */}
      <View className="items-center mb-3">
        <Text className="text-3xl">{template.preview}</Text>
      </View>

      {/* Template info */}
      <Text className="text-sm font-medium text-gray-900 text-center mb-1">
        {template.name}
      </Text>
      <Text className="text-xs text-gray-500 text-center">
        {template.description}
      </Text>
    </TouchableOpacity>
  );
}

interface TemplateCardProps {
  template: OverlayTemplate;
  onPress: () => void;
}

/**
 * Template card for category browsing
 */
function TemplateCard({ template, onPress }: TemplateCardProps) {
  console.log('🎯 RENDERING TEMPLATE CARD:', template.name);
  
  return (
    <TouchableOpacity
      onPress={() => {
        console.log('🚨 TEMPLATE CARD ONPRESS TRIGGERED:', template.name);
        console.log('🚨 About to call onPress callback...');
        onPress();
        console.log('🚨 onPress callback completed');
      }}
      onPressIn={() => {
        console.log('👇 TEMPLATE CARD PRESS IN:', template.name);
      }}
      onPressOut={() => {
        console.log('👆 TEMPLATE CARD PRESS OUT:', template.name);
      }}
      activeOpacity={0.7}
      style={{
        position: 'absolute',
        backgroundColor: '#4CAF50', // Exact same green as working button
        padding: 15,
        borderRadius: 10,
        zIndex: 20000, // Same as working button
        elevation: 20000, // Same as working button
        alignItems: 'center',
        justifyContent: 'center',
        width: 120,
        height: 80,
        // Position them manually to avoid layout issues
        left: template.id.includes('victory') ? 20 : 160,
        top: 50,
      }}
    >
      <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold', textAlign: 'center' }}>
        {template.preview} {template.name}
      </Text>
    </TouchableOpacity>
  );
} 