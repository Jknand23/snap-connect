/**
 * Sports Onboarding Screen
 * 
 * Guides new users through selecting their favorite teams, leagues,
 * and notification preferences to personalize their sports experience.
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { supabase } from '../../services/database/supabase';
import { useAuth } from '../../stores/authStore';
import { Database } from '../../types/database';

type Team = Database['public']['Tables']['teams']['Row'];

interface OnboardingStep {
  id: string;
  title: string;
  subtitle: string;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'leagues',
    title: 'Pick Your Leagues',
    subtitle: 'Select the sports leagues you follow',
  },
  {
    id: 'teams',
    title: 'Choose Your Teams',
    subtitle: 'Select your favorite teams',
  },
  {
    id: 'notifications',
    title: 'Notification Preferences',
    subtitle: 'How do you want to stay updated?',
  },
];

const LEAGUES = [
  { id: 'NFL', name: 'NFL', emoji: '🏈' },
  { id: 'NBA', name: 'NBA', emoji: '🏀' },
  { id: 'MLB', name: 'MLB', emoji: '⚾' },
  { id: 'NHL', name: 'NHL', emoji: '🏒' },
];

export function SportsOnboardingScreen() {
  const { completeSportsOnboarding, isLoading } = useAuth();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedLeagues, setSelectedLeagues] = useState<string[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [availableTeams, setAvailableTeams] = useState<Team[]>([]);
  const [notificationPreferences, setNotificationPreferences] = useState({
    gameAlerts: true,
    newsUpdates: true,
    friendActivity: true,
  });

  /**
   * Load teams based on selected leagues
   */
  useEffect(() => {
    if (selectedLeagues.length > 0) {
      loadTeams();
    }
  }, [selectedLeagues]);

  /**
   * Fetch teams from database for selected leagues
   */
  async function loadTeams() {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .in('league', selectedLeagues)
        .order('name');

      if (error) {
        console.error('Error loading teams:', error);
        return;
      }

      setAvailableTeams(data || []);
    } catch (error) {
      console.error('Error loading teams:', error);
    }
  }

  /**
   * Toggle league selection
   */
  function toggleLeague(leagueId: string) {
    setSelectedLeagues(prev => {
      if (prev.includes(leagueId)) {
        // Remove league and any teams from that league
        const newLeagues = prev.filter(id => id !== leagueId);
        setSelectedTeams(prevTeams => 
          prevTeams.filter(teamId => {
            const team = availableTeams.find(t => t.id === teamId);
            return team && newLeagues.includes(team.league);
          })
        );
        return newLeagues;
      } else {
        return [...prev, leagueId];
      }
    });
  }

  /**
   * Toggle team selection
   */
  function toggleTeam(teamId: string) {
    setSelectedTeams(prev => {
      if (prev.includes(teamId)) {
        return prev.filter(id => id !== teamId);
      } else {
        return [...prev, teamId];
      }
    });
  }

  /**
   * Go to next step
   */
  function nextStep() {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      completeOnboarding();
    }
  }

  /**
   * Go to previous step
   */
  function prevStep() {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }

  /**
   * Complete the onboarding process
   */
  async function completeOnboarding() {
    if (selectedLeagues.length === 0) {
      Alert.alert('Select Leagues', 'Please select at least one league to continue.');
      return;
    }

    if (selectedTeams.length === 0) {
      Alert.alert('Select Teams', 'Please select at least one team to continue.');
      return;
    }

    try {
      await completeSportsOnboarding({
        favoriteTeams: selectedTeams,
        favoritePlayers: [], // Phase 2: Keep empty, will be added in Phase 3
        preferredLeagues: selectedLeagues,
        notificationPreferences,
      });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to complete onboarding');
    }
  }

  /**
   * Check if current step can proceed
   */
  function canProceed() {
    switch (currentStep) {
      case 0: // Leagues
        return selectedLeagues.length > 0;
      case 1: // Teams
        return selectedTeams.length > 0;
      case 2: // Notifications
        return true;
      default:
        return false;
    }
  }

  /**
   * Render league selection step
   */
  function renderLeagueStep() {
    return (
      <View className="flex-1 p-6">
        <Text className="text-white text-2xl font-bold mb-2">Pick Your Leagues</Text>
        <Text className="text-gray-400 text-base mb-8">
          Select the sports leagues you follow to personalize your experience
        </Text>

        <View className="space-y-4">
          {LEAGUES.map((league) => (
            <TouchableOpacity
              key={league.id}
              onPress={() => toggleLeague(league.id)}
              className={`p-4 rounded-xl border-2 ${
                selectedLeagues.includes(league.id)
                  ? 'border-blue-500 bg-blue-500/20'
                  : 'border-gray-600 bg-gray-800/50'
              }`}
            >
              <View className="flex-row items-center">
                <Text className="text-3xl mr-4">{league.emoji}</Text>
                <Text className="text-white text-lg font-semibold">
                  {league.name}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  }

  /**
   * Render team selection step
   */
  function renderTeamStep() {
    const teamsByLeague = selectedLeagues.reduce((acc, league) => {
      acc[league] = availableTeams.filter(team => team.league === league);
      return acc;
    }, {} as Record<string, Team[]>);

    return (
      <View className="flex-1 p-6">
        <Text className="text-white text-2xl font-bold mb-2">Choose Your Teams</Text>
        <Text className="text-gray-400 text-base mb-6">
          Select your favorite teams from the leagues you follow
        </Text>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {selectedLeagues.map((league) => (
            <View key={league} className="mb-6">
              <Text className="text-white text-lg font-bold mb-3">
                {LEAGUES.find(l => l.id === league)?.emoji} {league}
              </Text>
              
              <View className="space-y-2">
                {teamsByLeague[league]?.map((team) => (
                  <TouchableOpacity
                    key={team.id}
                    onPress={() => toggleTeam(team.id)}
                    className={`p-3 rounded-lg border ${
                      selectedTeams.includes(team.id)
                        ? 'border-blue-500 bg-blue-500/20'
                        : 'border-gray-600 bg-gray-800/30'
                    }`}
                  >
                    <View className="flex-row items-center justify-between">
                      <View>
                        <Text className="text-white font-semibold">
                          {team.name}
                        </Text>
                        <Text className="text-gray-400 text-sm">
                          {team.city}
                        </Text>
                      </View>
                      <View 
                        className="w-4 h-4 rounded-full border-2"
                        style={{ backgroundColor: team.primary_color }}
                      />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  }

  /**
   * Render notifications step
   */
  function renderNotificationStep() {
    return (
      <View className="flex-1 p-6">
        <Text className="text-white text-2xl font-bold mb-2">Stay Updated</Text>
        <Text className="text-gray-400 text-base mb-8">
          Choose how you want to receive updates about your teams
        </Text>

        <View className="space-y-4">
          <TouchableOpacity
            onPress={() => setNotificationPreferences(prev => ({ 
              ...prev, 
              gameAlerts: !prev.gameAlerts 
            }))}
            className="p-4 rounded-xl bg-gray-800/50 border border-gray-600"
          >
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-white font-semibold text-base">
                  Game Alerts
                </Text>
                <Text className="text-gray-400 text-sm">
                  Get notified about game start times and scores
                </Text>
              </View>
              <View 
                className={`w-6 h-6 rounded border-2 ${
                  notificationPreferences.gameAlerts 
                    ? 'bg-blue-500 border-blue-500' 
                    : 'border-gray-400'
                }`}
              >
                {notificationPreferences.gameAlerts && (
                  <Text className="text-white text-center text-sm">✓</Text>
                )}
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setNotificationPreferences(prev => ({ 
              ...prev, 
              newsUpdates: !prev.newsUpdates 
            }))}
            className="p-4 rounded-xl bg-gray-800/50 border border-gray-600"
          >
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-white font-semibold text-base">
                  News Updates
                </Text>
                <Text className="text-gray-400 text-sm">
                  Breaking news and updates about your teams
                </Text>
              </View>
              <View 
                className={`w-6 h-6 rounded border-2 ${
                  notificationPreferences.newsUpdates 
                    ? 'bg-blue-500 border-blue-500' 
                    : 'border-gray-400'
                }`}
              >
                {notificationPreferences.newsUpdates && (
                  <Text className="text-white text-center text-sm">✓</Text>
                )}
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setNotificationPreferences(prev => ({ 
              ...prev, 
              friendActivity: !prev.friendActivity 
            }))}
            className="p-4 rounded-xl bg-gray-800/50 border border-gray-600"
          >
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-white font-semibold text-base">
                  Friend Activity
                </Text>
                <Text className="text-gray-400 text-sm">
                  When friends post stories or send messages
                </Text>
              </View>
              <View 
                className={`w-6 h-6 rounded border-2 ${
                  notificationPreferences.friendActivity 
                    ? 'bg-blue-500 border-blue-500' 
                    : 'border-gray-400'
                }`}
              >
                {notificationPreferences.friendActivity && (
                  <Text className="text-white text-center text-sm">✓</Text>
                )}
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  /**
   * Render current step content
   */
  function renderStepContent() {
    switch (currentStep) {
      case 0:
        return renderLeagueStep();
      case 1:
        return renderTeamStep();
      case 2:
        return renderNotificationStep();
      default:
        return null;
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-900">
      {/* Progress indicator */}
      <View className="flex-row items-center justify-center p-4 space-x-2">
        {ONBOARDING_STEPS.map((_, index) => (
          <View
            key={index}
            className={`h-2 flex-1 rounded-full ${
              index <= currentStep ? 'bg-blue-500' : 'bg-gray-600'
            }`}
          />
        ))}
      </View>

      {/* Step content */}
      {renderStepContent()}

      {/* Navigation buttons */}
      <View className="flex-row items-center justify-between p-6 border-t border-gray-700">
        <TouchableOpacity
          onPress={prevStep}
          className={`px-6 py-3 rounded-lg ${
            currentStep === 0 ? 'bg-gray-700' : 'bg-gray-600'
          }`}
          disabled={currentStep === 0}
        >
          <Text className={`font-semibold ${
            currentStep === 0 ? 'text-gray-500' : 'text-white'
          }`}>
            Back
          </Text>
        </TouchableOpacity>

        <Text className="text-gray-400 text-sm">
          {currentStep + 1} of {ONBOARDING_STEPS.length}
        </Text>

        <TouchableOpacity
          onPress={nextStep}
          className={`px-6 py-3 rounded-lg ${
            canProceed() ? 'bg-blue-600' : 'bg-gray-700'
          }`}
          disabled={!canProceed() || isLoading}
        >
          <Text className={`font-semibold ${
            canProceed() ? 'text-white' : 'text-gray-500'
          }`}>
            {currentStep === ONBOARDING_STEPS.length - 1 ? 'Complete' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
} 