/**
 * Overlay Template Service
 * Manages pre-built overlay templates for different sports scenarios
 */

import type { 
  OverlayTemplate, 
  OverlayElement, 
  OverlayPosition, 
  OverlayStyle,
  TeamAsset,
  SmartSuggestion 
} from '../../types/overlays';
import { teamAssetService } from './teamAssetService';

export class OverlayTemplateService {
  private templates: OverlayTemplate[] = [];
  private templatesLoaded = false;

  constructor() {
    this.initializeTemplates();
  }

  /**
   * Initialize default overlay templates
   */
  private initializeTemplates() {
    this.templates = [
      // Victory Templates
      {
        id: 'victory-championship',
        name: 'Championship Victory',
        category: 'victory',
        description: 'Celebrate your team\'s victory with championship style',
        preview: '🏆',
        teamDependent: true,
        defaultPosition: { x: 0.5, y: 0.3, width: 0.8, height: 0.4, rotation: 0, scale: 1 },
        elements: [
          {
            id: 'victory-bg',
            type: 'gradient',
            content: '',
            position: { x: 0, y: 0, width: 1, height: 1, rotation: 0, scale: 1 },
            style: {
              gradient: ['team-primary', 'team-accent'],
              borderRadius: 20,
              opacity: 0.9,
            },
          },
          {
            id: 'victory-text',
            type: 'text',
            content: 'CHAMPIONS!',
            position: { x: 0.5, y: 0.5, width: 0.8, height: 0.3, rotation: 0, scale: 1 },
            style: {
              fontSize: 36,
              fontWeight: 'heavy',
              color: '#FFFFFF',
              textAlign: 'center',
              textShadow: true,
              shadowColor: 'rgba(0,0,0,0.8)',
              shadowOffset: { x: 2, y: 2 },
              shadowRadius: 4,
            },
          },
          {
            id: 'victory-emoji',
            type: 'text',
            content: '🏆',
            position: { x: 0.5, y: 0.2, width: 0.2, height: 0.2, rotation: 0, scale: 1 },
            style: {
              fontSize: 48,
              textAlign: 'center',
            },
          },
        ],
      },
      
      // Game Day Templates
      {
        id: 'gameday-hype',
        name: 'Game Day Hype',
        category: 'gameday',
        description: 'Get pumped for game day with team colors',
        preview: '🔥',
        teamDependent: true,
        defaultPosition: { x: 0.5, y: 0.7, width: 0.9, height: 0.25, rotation: 0, scale: 1 },
        elements: [
          {
            id: 'gameday-frame',
            type: 'frame',
            content: '',
            position: { x: 0, y: 0, width: 1, height: 1, rotation: 0, scale: 1 },
            style: {
              borderColor: 'team-primary',
              borderWidth: 4,
              borderRadius: 15,
              backgroundColor: 'rgba(0,0,0,0.7)',
            },
          },
          {
            id: 'gameday-text',
            type: 'text',
            content: 'GAME DAY!',
            position: { x: 0.5, y: 0.5, width: 0.8, height: 0.6, rotation: 0, scale: 1 },
            style: {
              fontSize: 28,
              fontWeight: 'bold',
              color: 'team-primary',
              textAlign: 'center',
              textShadow: true,
            },
          },
        ],
      },

      // Team Pride Templates
      {
        id: 'pride-fan',
        name: 'Team Pride',
        category: 'pride',
        description: 'Show your team pride with style',
        preview: '💪',
        teamDependent: true,
        defaultPosition: { x: 0.1, y: 0.1, width: 0.4, height: 0.15, rotation: 0, scale: 1 },
        elements: [
          {
            id: 'pride-badge',
            type: 'badge',
            content: '',
            position: { x: 0, y: 0, width: 1, height: 1, rotation: 0, scale: 1 },
            style: {
              backgroundColor: 'team-primary',
              borderRadius: 25,
              borderColor: 'team-secondary',
              borderWidth: 2,
            },
          },
          {
            id: 'pride-text',
            type: 'text',
            content: 'FAN',
            position: { x: 0.5, y: 0.5, width: 0.8, height: 0.6, rotation: 0, scale: 1 },
            style: {
              fontSize: 16,
              fontWeight: 'bold',
              color: '#FFFFFF',
              textAlign: 'center',
            },
          },
        ],
      },

      // Rivalry Templates
      {
        id: 'rivalry-domination',
        name: 'Rivalry Domination',
        category: 'rivalry',
        description: 'Show dominance over rival teams',
        preview: '⚔️',
        teamDependent: true,
        defaultPosition: { x: 0.5, y: 0.4, width: 0.85, height: 0.3, rotation: -5, scale: 1 },
        elements: [
          {
            id: 'rivalry-bg',
            type: 'gradient',
            content: '',
            position: { x: 0, y: 0, width: 1, height: 1, rotation: 0, scale: 1 },
            style: {
              gradient: ['team-primary', '#FF4444'],
              borderRadius: 15,
              opacity: 0.95,
            },
          },
          {
            id: 'rivalry-text',
            type: 'text',
            content: 'DOMINATION',
            position: { x: 0.5, y: 0.5, width: 0.9, height: 0.6, rotation: 0, scale: 1 },
            style: {
              fontSize: 32,
              fontWeight: 'heavy',
              color: '#FFFFFF',
              textAlign: 'center',
              textShadow: true,
              shadowColor: 'rgba(0,0,0,0.9)',
            },
          },
        ],
      },

      // Seasonal Templates
      {
        id: 'seasonal-2024',
        name: '2024 Season',
        category: 'seasonal',
        description: 'Celebrate the current season',
        preview: '📅',
        teamDependent: true,
        defaultPosition: { x: 0.8, y: 0.8, width: 0.35, height: 0.15, rotation: 0, scale: 1 },
        elements: [
          {
            id: 'seasonal-bg',
            type: 'gradient',
            content: '',
            position: { x: 0, y: 0, width: 1, height: 1, rotation: 0, scale: 1 },
            style: {
              gradient: ['team-secondary', 'team-primary'],
              borderRadius: 20,
              opacity: 0.9,
            },
          },
          {
            id: 'seasonal-text',
            type: 'text',
            content: '2024',
            position: { x: 0.5, y: 0.5, width: 0.8, height: 0.6, rotation: 0, scale: 1 },
            style: {
              fontSize: 20,
              fontWeight: 'bold',
              color: '#FFFFFF',
              textAlign: 'center',
            },
          },
        ],
      },

      // Player Templates
      {
        id: 'player-mvp',
        name: 'Player MVP',
        category: 'player',
        description: 'Celebrate your favorite player',
        preview: '⭐',
        teamDependent: false,
        defaultPosition: { x: 0.5, y: 0.6, width: 0.7, height: 0.2, rotation: 0, scale: 1 },
        elements: [
          {
            id: 'player-frame',
            type: 'frame',
            content: '',
            position: { x: 0, y: 0, width: 1, height: 1, rotation: 0, scale: 1 },
            style: {
              borderColor: '#FFD700',
              borderWidth: 3,
              borderRadius: 25,
              backgroundColor: 'rgba(0,0,0,0.8)',
            },
          },
          {
            id: 'player-text',
            type: 'text',
            content: 'MVP!',
            position: { x: 0.5, y: 0.5, width: 0.8, height: 0.6, rotation: 0, scale: 1 },
            style: {
              fontSize: 24,
              fontWeight: 'bold',
              color: '#FFD700',
              textAlign: 'center',
              textShadow: true,
            },
          },
        ],
      },

      // Victory Templates
      {
        id: 'victory-celebration',
        name: 'Victory!',
        category: 'victory',
        description: 'Celebrate your team\'s victory',
        preview: '🎉',
        teamDependent: true,
        defaultPosition: { x: 0.5, y: 0.3, width: 0.8, height: 0.25, rotation: 0, scale: 1 },
        elements: [
          {
            id: 'victory-bg',
            type: 'gradient',
            content: '',
            position: { x: 0, y: 0, width: 1, height: 1, rotation: 0, scale: 1 },
            style: {
              gradient: ['team-primary', 'team-accent'],
              borderRadius: 20,
              opacity: 0.95,
            },
          },
          {
            id: 'victory-text',
            type: 'text',
            content: 'VICTORY!',
            position: { x: 0.5, y: 0.5, width: 0.9, height: 0.6, rotation: 0, scale: 1 },
            style: {
              fontSize: 36,
              fontWeight: 'heavy',
              color: '#FFFFFF',
              textAlign: 'center',
              textShadow: true,
              shadowColor: 'rgba(0,0,0,0.8)',
            },
          },
        ],
      },

      // Simple Test Template for debugging
      {
        id: 'test-simple',
        name: 'Test',
        category: 'victory',
        description: 'Simple test overlay',
        preview: '🧪',
        teamDependent: false,
        defaultPosition: { x: 0.5, y: 0.5, width: 0.6, height: 0.15, rotation: 0, scale: 1 },
        elements: [
          {
            id: 'test-bg',
            type: 'frame',
            content: '',
            position: { x: 0, y: 0, width: 1, height: 1, rotation: 0, scale: 1 },
            style: {
              backgroundColor: '#FF0000',
              borderRadius: 10,
              opacity: 0.9,
            },
          },
          {
            id: 'test-text',
            type: 'text',
            content: 'TEST OVERLAY',
            position: { x: 0.5, y: 0.5, width: 0.9, height: 0.6, rotation: 0, scale: 1 },
            style: {
              fontSize: 20,
              fontWeight: 'bold',
              color: '#FFFFFF',
              textAlign: 'center',
            },
          },
        ],
      },
    ];

    this.templatesLoaded = true;
  }

  /**
   * Get all available templates
   */
  getTemplates(): OverlayTemplate[] {
    return [...this.templates];
  }

  /**
   * Get templates by category
   */
  getTemplatesByCategory(category: string): OverlayTemplate[] {
    return this.templates.filter(template => template.category === category);
  }

  /**
   * Get template by ID
   */
  getTemplateById(templateId: string): OverlayTemplate | null {
    return this.templates.find(template => template.id === templateId) || null;
  }

  /**
   * Get smart template suggestions based on user's teams and context
   */
  async getSmartSuggestions(userTeams: TeamAsset[] = []): Promise<SmartSuggestion[]> {
    try {
      const suggestions: SmartSuggestion[] = [];
      
      // Current date for seasonal suggestions
      const now = new Date();
      const month = now.getMonth() + 1; // 1-12
      
      // Game day suggestions (contextual based on season)
      if (this.isGameSeason(month)) {
        const gamedayTemplates = this.getTemplatesByCategory('gameday');
        gamedayTemplates.forEach(template => {
          suggestions.push({
            template,
            relevance: 0.9,
            reason: 'game-today',
            teamId: userTeams[0]?.id,
          });
        });
      }

      // Victory suggestions (always relevant)
      const victoryTemplates = this.getTemplatesByCategory('victory');
      victoryTemplates.forEach(template => {
        suggestions.push({
          template,
          relevance: 0.8,
          reason: 'recent-victory',
          teamId: userTeams[0]?.id,
        });
      });

      // Team pride suggestions for user's teams
      if (userTeams.length > 0) {
        const prideTemplates = this.getTemplatesByCategory('pride');
        prideTemplates.forEach(template => {
          userTeams.slice(0, 3).forEach(team => { // Top 3 teams
            suggestions.push({
              template,
              relevance: 0.7,
              reason: 'favorite-team',
              teamId: team.id,
            });
          });
        });
      }

      // Seasonal suggestions
      const seasonalTemplates = this.getTemplatesByCategory('seasonal');
      seasonalTemplates.forEach(template => {
        suggestions.push({
          template,
          relevance: 0.6,
          reason: 'seasonal',
        });
      });

      // Sort by relevance
      suggestions.sort((a, b) => b.relevance - a.relevance);
      
      // Fallback: If no suggestions, provide basic templates
      if (suggestions.length === 0) {
        const fallbackTemplates = [
          this.getTemplatesByCategory('victory')[0],
          this.getTemplatesByCategory('gameday')[0],
          this.getTemplatesByCategory('pride')[0],
        ].filter(Boolean);
        
        fallbackTemplates.forEach(template => {
          suggestions.push({
            template,
            relevance: 0.5,
            reason: 'fallback',
            teamId: userTeams[0]?.id,
          });
        });
      }
      
      // Return top 6 suggestions
      return suggestions.slice(0, 6);
    } catch (error) {
      console.error('Error getting smart suggestions:', error);
      
      // Emergency fallback - return first template of each major category
      const emergencyTemplates = ['victory', 'gameday', 'pride'].map(category => {
        const templates = this.getTemplatesByCategory(category);
        return templates[0];
      }).filter(Boolean);
      
      return emergencyTemplates.map(template => ({
        template,
        relevance: 0.3,
        reason: 'emergency-fallback',
        teamId: userTeams[0]?.id,
      }));
    }
  }

  /**
   * Customize template with team data
   */
  async customizeTemplateForTeam(templateId: string, teamId: string): Promise<OverlayTemplate | null> {
    try {
      const template = this.getTemplateById(templateId);
      if (!template) return null;

      const teamAsset = await teamAssetService.getTeamAsset(teamId);
      if (!teamAsset) return template;

      // Clone template
      const customizedTemplate: OverlayTemplate = JSON.parse(JSON.stringify(template));
      
      // Get team-specific content
      const teamTexts = teamAssetService.getTeamTexts(teamAsset);
      const teamGradients = teamAssetService.getTeamGradients(teamAsset);
      
      // Customize elements
      customizedTemplate.elements = customizedTemplate.elements.map(element => {
        const customizedElement = { ...element };
        
        // Update text content
        if (element.type === 'text' && element.content) {
          const category = template.category;
          const categoryTexts = teamTexts[category] || [];
          if (categoryTexts.length > 0) {
            customizedElement.content = categoryTexts[Math.floor(Math.random() * categoryTexts.length)];
          }
        }
        
        // Update gradients
        if (element.style?.gradient && teamGradients[template.category]) {
          customizedElement.style = {
            ...element.style,
            gradient: teamGradients[template.category],
          };
        }
        
        // Update team colors
        if (element.style?.color === 'team-primary') {
          customizedElement.style = {
            ...element.style,
            color: teamAsset.colors.primary,
          };
        }
        
        if (element.style?.borderColor === 'team-primary') {
          customizedElement.style = {
            ...element.style,
            borderColor: teamAsset.colors.primary,
          };
        }
        
        return customizedElement;
      });
      
      return customizedTemplate;
    } catch (error) {
      console.error('Error customizing template for team:', error);
      return null;
    }
  }

  /**
   * Check if current month is game season for any sport
   */
  private isGameSeason(month: number): boolean {
    // NFL: Sep-Feb (9-2)
    // NBA: Oct-Jun (10-6)  
    // MLB: Mar-Oct (3-10)
    // NHL: Oct-Jun (10-6)
    
    return month >= 3 && month <= 10; // Most active sports months
  }

  /**
   * Create custom template
   */
  createCustomTemplate(
    name: string,
    category: string,
    elements: OverlayElement[]
  ): OverlayTemplate {
    const customTemplate: OverlayTemplate = {
      id: `custom-${Date.now()}`,
      name,
      category: category as any,
      description: 'Custom template',
      preview: '🎨',
      teamDependent: true,
      defaultPosition: { x: 0.5, y: 0.5, width: 0.8, height: 0.3, rotation: 0, scale: 1 },
      elements,
    };

    this.templates.push(customTemplate);
    return customTemplate;
  }

  /**
   * Get template categories
   */
  getCategories(): string[] {
    return ['victory', 'gameday', 'pride', 'rivalry', 'seasonal', 'player'];
  }
}

// Export singleton instance
export const overlayTemplateService = new OverlayTemplateService(); 