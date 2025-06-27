/**
 * Teams Service
 * 
 * Manages sports teams data including fetching teams by league,
 * getting team details, and managing user's favorite teams.
 */
import { supabase, DatabaseError, dbUtils } from './supabase';
import { Database } from '../../types/database';

type Team = Database['public']['Tables']['teams']['Row'];
type TeamInsert = Database['public']['Tables']['teams']['Insert'];

export interface TeamWithColors {
  id: string;
  name: string;
  abbreviation: string;
  league: string;
  city: string;
  colors: {
    primary: string;
    secondary: string;
  };
  logoUrl?: string;
}

/**
 * Teams service for managing sports teams data
 */
export class TeamsService {
  /**
   * Get all teams
   */
  async getAllTeams(): Promise<Team[]> {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .order('name');

      if (error) {
        throw new DatabaseError('Failed to fetch teams', error);
      }

      return data || [];
    } catch (error) {
      throw new DatabaseError('Failed to get teams', error);
    }
  }

  /**
   * Get teams by league
   */
  async getTeamsByLeague(league: string): Promise<Team[]> {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .eq('league', league)
        .order('name');

      if (error) {
        throw new DatabaseError('Failed to fetch teams by league', error);
      }

      return data || [];
    } catch (error) {
      throw new DatabaseError('Failed to get teams by league', error);
    }
  }

  /**
   * Get teams by multiple leagues
   */
  async getTeamsByLeagues(leagues: string[]): Promise<Team[]> {
    try {
      if (leagues.length === 0) {
        return [];
      }

      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .in('league', leagues)
        .order('league, name');

      if (error) {
        throw new DatabaseError('Failed to fetch teams by leagues', error);
      }

      return data || [];
    } catch (error) {
      throw new DatabaseError('Failed to get teams by leagues', error);
    }
  }

  /**
   * Get team by ID
   */
  async getTeamById(teamId: string): Promise<Team | null> {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .eq('id', teamId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Team not found
        }
        throw new DatabaseError('Failed to fetch team', error);
      }

      return data;
    } catch (error) {
      throw new DatabaseError('Failed to get team by ID', error);
    }
  }

  /**
   * Get multiple teams by IDs
   */
  async getTeamsByIds(teamIds: string[]): Promise<Team[]> {
    try {
      if (teamIds.length === 0) {
        return [];
      }

      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .in('id', teamIds)
        .order('name');

      if (error) {
        throw new DatabaseError('Failed to fetch teams by IDs', error);
      }

      return data || [];
    } catch (error) {
      throw new DatabaseError('Failed to get teams by IDs', error);
    }
  }

  /**
   * Get user's favorite teams
   */
  async getUserFavoriteTeams(): Promise<Team[]> {
    try {
      const userId = await dbUtils.getCurrentUserId();

      const { data: preferences, error: prefsError } = await supabase
        .from('user_sports_preferences')
        .select('favorite_teams')
        .eq('user_id', userId)
        .single();

      if (prefsError) {
        if (prefsError.code === 'PGRST116') {
          return []; // No preferences found
        }
        throw new DatabaseError('Failed to get user preferences', prefsError);
      }

      if (!preferences?.favorite_teams || preferences.favorite_teams.length === 0) {
        return [];
      }

      return await this.getTeamsByIds(preferences.favorite_teams);
    } catch (error) {
      throw new DatabaseError('Failed to get user favorite teams', error);
    }
  }

  /**
   * Convert team to TeamWithColors format
   */
  toTeamWithColors(team: Team): TeamWithColors {
    return {
      id: team.id,
      name: team.name,
      abbreviation: team.abbreviation,
      league: team.league,
      city: team.city,
      colors: {
        primary: team.primary_color,
        secondary: team.secondary_color,
      },
      logoUrl: team.logo_url || undefined,
    };
  }

  /**
   * Get available leagues
   */
  async getAvailableLeagues(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('league')
        .neq('league', null);

      if (error) {
        throw new DatabaseError('Failed to fetch leagues', error);
      }

      // Get unique leagues
      const leagues = [...new Set(data?.map(item => item.league).filter(Boolean))];
      return leagues.sort();
    } catch (error) {
      throw new DatabaseError('Failed to get available leagues', error);
    }
  }

  /**
   * Search teams by name or city
   */
  async searchTeams(query: string): Promise<Team[]> {
    try {
      if (!query.trim()) {
        return [];
      }

      const searchQuery = `%${query.trim().toLowerCase()}%`;

      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .or(`name.ilike.${searchQuery},city.ilike.${searchQuery},abbreviation.ilike.${searchQuery}`)
        .order('name')
        .limit(20);

      if (error) {
        throw new DatabaseError('Failed to search teams', error);
      }

      return data || [];
    } catch (error) {
      throw new DatabaseError('Failed to search teams', error);
    }
  }

  /**
   * Add new team (admin function)
   */
  async addTeam(teamData: TeamInsert): Promise<Team> {
    try {
      const { data, error } = await supabase
        .from('teams')
        .insert(teamData)
        .select()
        .single();

      if (error) {
        throw new DatabaseError('Failed to add team', error);
      }

      return data;
    } catch (error) {
      throw new DatabaseError('Failed to add team', error);
    }
  }

  /**
   * Update team information (admin function)
   */
  async updateTeam(teamId: string, updates: Partial<TeamInsert>): Promise<Team> {
    try {
      const { data, error } = await supabase
        .from('teams')
        .update(updates)
        .eq('id', teamId)
        .select()
        .single();

      if (error) {
        throw new DatabaseError('Failed to update team', error);
      }

      return data;
    } catch (error) {
      throw new DatabaseError('Failed to update team', error);
    }
  }
}

// Export singleton instance
export const teamsService = new TeamsService(); 