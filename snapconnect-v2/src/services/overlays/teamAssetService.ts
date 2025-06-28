/**
 * Team Asset Service
 * Manages team logos, colors, fonts, and other assets for overlay generation
 */

import { TeamsService } from '../database/teamsService';
import { getTeamColors } from '../theme/teamColorService';
import type { TeamAsset, TeamColors } from '../../types/overlays';
import type { Database } from '../../types/database';

type Team = Database['public']['Tables']['teams']['Row'];

export class TeamAssetService {
  private teamsService: TeamsService;
  private teamAssetsCache: Map<string, TeamAsset> = new Map();

  constructor() {
    this.teamsService = new TeamsService();
  }

  /**
   * Get team asset by team ID
   */
  async getTeamAsset(teamId: string): Promise<TeamAsset | null> {
    try {
      // Check cache first
      if (this.teamAssetsCache.has(teamId)) {
        return this.teamAssetsCache.get(teamId)!;
      }

      // Fetch from database
      const team = await this.teamsService.getTeamById(teamId);
      if (!team) return null;

      const teamAsset = await this.convertTeamToAsset(team);
      
      // Cache the result
      this.teamAssetsCache.set(teamId, teamAsset);
      
      return teamAsset;
    } catch (error) {
      console.error('Error getting team asset:', error);
      return null;
    }
  }

  /**
   * Get team assets for user's favorite teams
   */
  async getUserTeamAssets(): Promise<TeamAsset[]> {
    try {
      const favoriteTeams = await this.teamsService.getUserFavoriteTeams();
      const teamAssets: TeamAsset[] = [];

      for (const team of favoriteTeams) {
        const asset = await this.convertTeamToAsset(team);
        teamAssets.push(asset);
        
        // Cache each asset
        this.teamAssetsCache.set(team.id, asset);
      }

      return teamAssets;
    } catch (error) {
      console.error('Error getting user team assets:', error);
      return [];
    }
  }

  /**
   * Get team assets by league
   */
  async getTeamAssetsByLeague(league: string): Promise<TeamAsset[]> {
    try {
      const teams = await this.teamsService.getTeamsByLeague(league);
      const teamAssets: TeamAsset[] = [];

      for (const team of teams) {
        const asset = await this.convertTeamToAsset(team);
        teamAssets.push(asset);
        
        // Cache each asset
        this.teamAssetsCache.set(team.id, asset);
      }

      return teamAssets;
    } catch (error) {
      console.error('Error getting team assets by league:', error);
      return [];
    }
  }

  /**
   * Convert database team to team asset
   */
  private async convertTeamToAsset(team: Team): Promise<TeamAsset> {
    // Get enhanced team colors from theme service
    const teamColors = getTeamColors(team.abbreviation, team.league);
    
    const colors: TeamColors = teamColors || {
      primary: team.primary_color,
      secondary: team.secondary_color,
      accent: team.primary_color,
    };

    return {
      id: team.id,
      teamId: team.id,
      league: team.league as 'NFL' | 'NBA' | 'MLB' | 'NHL',
      name: team.name,
      abbreviation: team.abbreviation,
      city: team.city,
      colors,
      logoUrl: team.logo_url || undefined,
    };
  }

  /**
   * Get team color gradients for overlays
   */
  getTeamGradients(teamAsset: TeamAsset): Record<string, string[]> {
    const { colors } = teamAsset;
    
    return {
      primary: [colors.primary, colors.accent],
      secondary: [colors.secondary, colors.primary],
      victory: [colors.primary, '#FFD700'], // Gold accent for victories
      gameday: [colors.secondary, colors.primary],
      pride: [colors.primary, 'rgba(255,255,255,0.2)'],
      rivalry: [colors.primary, '#FF4444'], // Red accent for rivalries
      championship: [colors.primary, colors.accent, '#FFD700'],
    };
  }

  /**
   * Get team-specific overlay text variations
   */
  getTeamTexts(teamAsset: TeamAsset): Record<string, string[]> {
    const { name, city, abbreviation } = teamAsset;
    
    return {
      victory: [
        `${abbreviation} WINS!`,
        `GO ${abbreviation}!`,
        `${city.toUpperCase()} CHAMPIONS!`,
        `${name.toUpperCase()} VICTORY!`,
        'CHAMPIONS!',
        'WE WON!',
      ],
      gameday: [
        `${abbreviation} GAME DAY!`,
        `GO ${abbreviation}!`,
        `${city.toUpperCase()} READY!`,
        `${name.toUpperCase()} TIME!`,
        'GAME DAY!',
        'LET\'S GO!',
      ],
      pride: [
        `${abbreviation} FAN`,
        `${city.toUpperCase()} PROUD`,
        `${name.toUpperCase()} FOREVER`,
        `#${abbreviation}Nation`,
        `${abbreviation} 4 LIFE`,
      ],
      seasonal: [
        `${abbreviation} 2024`,
        `${city.toUpperCase()} SEASON`,
        `${name.toUpperCase()} 2024`,
        'NEW SEASON',
        'READY TO WIN',
      ],
      rivalry: [
        `BEAT THE COMPETITION`,
        `${abbreviation} DOMINANCE`,
        `${city.toUpperCase()} SUPERIORITY`,
        'RIVALRY GAME',
        'SHOW NO MERCY',
      ],
    };
  }

  /**
   * Get team font preferences
   */
  getTeamFontStyle(teamAsset: TeamAsset): {
    fontFamily: string;
    fontWeight: 'normal' | 'bold' | 'heavy';
    textTransform: 'uppercase' | 'lowercase' | 'capitalize';
  } {
    // Different leagues have different typography styles
    switch (teamAsset.league) {
      case 'NFL':
        return {
          fontFamily: 'System',
          fontWeight: 'heavy',
          textTransform: 'uppercase',
        };
      case 'NBA':
        return {
          fontFamily: 'System',
          fontWeight: 'bold',
          textTransform: 'uppercase',
        };
      case 'MLB':
        return {
          fontFamily: 'System',
          fontWeight: 'bold',
          textTransform: 'capitalize',
        };
      case 'NHL':
        return {
          fontFamily: 'System',
          fontWeight: 'heavy',
          textTransform: 'uppercase',
        };
      default:
        return {
          fontFamily: 'System',
          fontWeight: 'bold',
          textTransform: 'uppercase',
        };
    }
  }

  /**
   * Get league-specific styling
   */
  getLeagueStyle(league: string): {
    defaultColors: TeamColors;
    typography: any;
    iconStyle: string;
  } {
    const leagueStyles = {
      NFL: {
        defaultColors: { primary: '#FF0000', secondary: '#000000', accent: '#FFD700' },
        typography: { fontSize: 24, fontWeight: 'heavy' },
        iconStyle: 'bold-angular',
      },
      NBA: {
        defaultColors: { primary: '#FF6B00', secondary: '#000000', accent: '#FFFFFF' },
        typography: { fontSize: 22, fontWeight: 'bold' },
        iconStyle: 'modern-sleek',
      },
      MLB: {
        defaultColors: { primary: '#0066FF', secondary: '#FFFFFF', accent: '#FF0000' },
        typography: { fontSize: 20, fontWeight: 'bold' },
        iconStyle: 'classic-serif',
      },
      NHL: {
        defaultColors: { primary: '#00CCFF', secondary: '#000000', accent: '#FFFFFF' },
        typography: { fontSize: 24, fontWeight: 'heavy' },
        iconStyle: 'ice-sharp',
      },
    };

    return leagueStyles[league as keyof typeof leagueStyles] || leagueStyles.NFL;
  }

  /**
   * Clear team assets cache
   */
  clearCache(): void {
    this.teamAssetsCache.clear();
  }

  /**
   * Preload team assets for better performance
   */
  async preloadTeamAssets(teamIds: string[]): Promise<void> {
    try {
      const teams = await this.teamsService.getTeamsByIds(teamIds);
      
      for (const team of teams) {
        const asset = await this.convertTeamToAsset(team);
        this.teamAssetsCache.set(team.id, asset);
      }
    } catch (error) {
      console.error('Error preloading team assets:', error);
    }
  }
}

// Export singleton instance
export const teamAssetService = new TeamAssetService(); 