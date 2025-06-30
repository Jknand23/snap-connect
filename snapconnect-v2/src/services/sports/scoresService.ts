/**
 * Sports Scores Service
 * 
 * Manages real-time sports scores and game data from multiple APIs.
 * Fetches live scores for user's preferred leagues with smart caching and error handling.
 */

import { supabase, DatabaseError, dbUtils } from '../database/supabase';
import { Database } from '../../types/database';

type UserSportsPreferences = Database['public']['Tables']['user_sports_preferences']['Row'];

/**
 * Standard game score interface across all leagues
 */
export interface GameScore {
  id: string;
  league: 'NBA' | 'NFL' | 'MLB' | 'NHL';
  homeTeam: {
    name: string;
    abbreviation: string;
    score: number;
  };
  awayTeam: {
    name: string;
    abbreviation: string;
    score: number;
  };
  status: 'scheduled' | 'live' | 'final' | 'postponed';
  gameTime?: string;
  quarter?: string;
  timeRemaining?: string;
  date: string;
  venue?: string;
}

/**
 * Scores summary for a league
 */
export interface LeagueScores {
  league: 'NBA' | 'NFL' | 'MLB' | 'NHL';
  games: GameScore[];
  lastUpdated: string;
  hasLiveGames: boolean;
}

class ScoresService {
  private lastFetchTime: Record<string, number> = {};
  private scoresCache: Record<string, LeagueScores> = {};
  private readonly CACHE_DURATION = 30 * 1000; // 30 seconds for live scores

  /**
   * Get real-time scores for user's preferred leagues
   * Uses Edge Function to access API keys securely
   */
  async getUserScores(): Promise<LeagueScores[]> {
    try {
      const userPreferences = await this.getUserSportsPreferences();
      
      if (!userPreferences?.preferred_leagues || userPreferences.preferred_leagues.length === 0) {
        return [];
      }

      // Get current user for authentication
      const { data: user } = await supabase.auth.getUser();
      if (!user?.user?.id) {
        console.log('❌ No authenticated user found');
        return [];
      }

      console.log(`🔄 Calling sports_scores Edge Function for leagues: ${userPreferences.preferred_leagues.join(', ')}`);

      // Call the Edge Function for sports scores
      const { data, error } = await supabase.functions.invoke('sports_scores', {
        body: {
          userId: user.user.id,
          leagues: userPreferences.preferred_leagues,
          timeframe: '24h'
        }
      });

      if (error) {
        console.error('❌ Sports scores Edge Function error:', error);
        return [];
      }

      if (!data?.success) {
        console.error('❌ Sports scores function returned error:', data?.error);
        return [];
      }

      // Convert Edge Function response to LeagueScores format
      const leagueScores: LeagueScores[] = userPreferences.preferred_leagues.map(league => {
        const leagueGames = data.data.games.filter((game: GameScore) => game.league === league);
        
        return {
          league: league as 'NBA' | 'NFL' | 'MLB' | 'NHL',
          games: leagueGames,
          lastUpdated: data.data.timestamp,
          hasLiveGames: leagueGames.some((game: GameScore) => game.status === 'live'),
        };
      });

      // Filter out leagues with no games
      const leaguesWithGames = leagueScores.filter(league => league.games.length > 0);

      console.log(`✅ Found games in ${leaguesWithGames.length} leagues via Edge Function`);
      console.log(`🔑 API Keys configured: BallDontLie: ${data.data.apiKeysConfigured.balldontlie}, API-Sports: ${data.data.apiKeysConfigured.apiSports}`);
      
      return leaguesWithGames;

    } catch (error) {
      console.error('❌ Failed to get user scores:', error);
      return [];
    }
  }

  /**
   * Get scores for a specific league
   */
  async getLeagueScores(league: 'NBA' | 'NFL' | 'MLB' | 'NHL'): Promise<LeagueScores> {
    const cacheKey = `${league}_scores`;
    const now = Date.now();

    // Return cached data if still fresh
    if (
      this.scoresCache[cacheKey] && 
      this.lastFetchTime[cacheKey] && 
      (now - this.lastFetchTime[cacheKey]) < this.CACHE_DURATION
    ) {
      return this.scoresCache[cacheKey];
    }

    try {
      let games: GameScore[] = [];

      switch (league) {
        case 'NBA':
          games = await this.fetchNBAScores();
          break;
        case 'NFL':
        case 'MLB':
        case 'NHL':
          games = await this.fetchApiSportsScores(league);
          break;
      }

      const leagueScores: LeagueScores = {
        league,
        games,
        lastUpdated: new Date().toISOString(),
        hasLiveGames: games.some(game => game.status === 'live'),
      };

      // Cache the results
      this.scoresCache[cacheKey] = leagueScores;
      this.lastFetchTime[cacheKey] = now;

      return leagueScores;
    } catch (error) {
      console.error(`❌ Failed to fetch ${league} scores:`, error);
      
      // Return cached data if available, even if stale
      if (this.scoresCache[cacheKey]) {
        return this.scoresCache[cacheKey];
      }

      // Return empty result
      return {
        league,
        games: [],
        lastUpdated: new Date().toISOString(),
        hasLiveGames: false,
      };
    }
  }

  /**
   * Fetch NBA scores from BallDontLie API (requires API key since 2024)
   * Falls back to mock data for demonstration purposes
   */
  private async fetchNBAScores(): Promise<GameScore[]> {
    try {
      console.log('🏀 Attempting to fetch NBA scores...');
      
      // Note: BallDontLie API now requires authentication
      // For production, you'd need to sign up at https://balldontlie.io
      // and add the API key to your environment variables
      
      const apiKey = process.env.BALLDONTLIE_API_KEY || null;
      
      if (!apiKey) {
        console.log('⚠️ BallDontLie API key not configured, using mock data');
        return this.getMockNBAScores();
      }

      const today = new Date().toISOString().split('T')[0];
      
      // Try the new BallDontLie API format
      const response = await fetch(`https://api.balldontlie.io/v1/games?dates[]=${today}`, {
        headers: {
          'Authorization': apiKey,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.log('🔑 BallDontLie API authentication failed, using mock data');
        } else {
          console.log('📡 BallDontLie API unavailable, using mock data');
        }
        return this.getMockNBAScores();
      }

      const data = await response.json();
      const games = data.data || [];

      return games.map((game: any): GameScore => {
        let status: GameScore['status'] = 'scheduled';
        if (game.status === 'Final') {
          status = 'final';
        } else if (game.period && game.period > 0) {
          status = 'live';
        }

        return {
          id: `nba_${game.id}`,
          league: 'NBA',
          homeTeam: {
            name: game.home_team.full_name,
            abbreviation: game.home_team.abbreviation,
            score: game.home_team_score || 0,
          },
          awayTeam: {
            name: game.visitor_team.full_name,
            abbreviation: game.visitor_team.abbreviation,
            score: game.visitor_team_score || 0,
          },
          status,
          quarter: game.period ? `Q${game.period}` : undefined,
          timeRemaining: game.time && game.period ? game.time : undefined,
          date: game.date,
        };
      });
    } catch (error) {
      console.error('❌ BallDontLie API error:', error);
      console.log('🔄 Falling back to mock NBA scores');
      return this.getMockNBAScores();
    }
  }

  /**
   * Mock NBA scores for demonstration when API is unavailable
   */
  private getMockNBAScores(): GameScore[] {
    const today = new Date().toISOString().split('T')[0];
    
    return [
      {
        id: 'nba_mock_1',
        league: 'NBA',
        homeTeam: {
          name: 'Los Angeles Lakers',
          abbreviation: 'LAL',
          score: 108,
        },
        awayTeam: {
          name: 'Golden State Warriors',
          abbreviation: 'GSW',
          score: 112,
        },
        status: 'final',
        quarter: 'Final',
        date: today,
        venue: 'Chase Center',
      },
      {
        id: 'nba_mock_2',
        league: 'NBA',
        homeTeam: {
          name: 'Boston Celtics',
          abbreviation: 'BOS',
          score: 95,
        },
        awayTeam: {
          name: 'Miami Heat',
          abbreviation: 'MIA',
          score: 89,
        },
        status: 'live',
        quarter: 'Q3',
        timeRemaining: '8:42',
        date: today,
        venue: 'TD Garden',
      },
      {
        id: 'nba_mock_3',
        league: 'NBA',
        homeTeam: {
          name: 'Dallas Mavericks',
          abbreviation: 'DAL',
          score: 0,
        },
        awayTeam: {
          name: 'Phoenix Suns',
          abbreviation: 'PHX',
          score: 0,
        },
        status: 'scheduled',
        gameTime: '9:00 PM ET',
        date: today,
        venue: 'American Airlines Center',
      },
    ];
  }

  /**
   * Fetch scores from API-Sports for NFL, MLB, NHL
   * Falls back to mock data for demonstration
   */
  private async fetchApiSportsScores(league: 'NFL' | 'MLB' | 'NHL'): Promise<GameScore[]> {
    try {
      console.log(`🏈 Attempting to fetch ${league} scores...`);
      
      // Note: API-Sports has different endpoints for different sports
      // and requires an API key with limited free tier (100 req/day)
      // For production implementation, sign up at https://www.api-sports.io
      
      const apiKey = process.env.API_SPORTS_API_KEY || null;
      
      if (!apiKey) {
        console.log(`⚠️ API-Sports key not configured for ${league}, using mock data`);
        return this.getMockScoresForLeague(league);
      }

      // In a real implementation, you'd make actual API calls here
      // For now, we'll use mock data since API setup requires configuration
      console.log(`📡 API-Sports configured but using mock data for ${league} demo`);
      return this.getMockScoresForLeague(league);
    } catch (error) {
      console.error(`❌ API-Sports ${league} error:`, error);
      console.log(`🔄 Falling back to mock ${league} scores`);
      return this.getMockScoresForLeague(league);
    }
  }

  /**
   * Generate mock scores for demonstration when APIs aren't available
   */
  private getMockScoresForLeague(league: 'NFL' | 'MLB' | 'NHL'): GameScore[] {
    const today = new Date().toISOString().split('T')[0];
    
    switch (league) {
      case 'NFL':
        return [
          {
            id: 'nfl_mock_1',
            league: 'NFL',
            homeTeam: {
              name: 'Dallas Cowboys',
              abbreviation: 'DAL',
              score: 24,
            },
            awayTeam: {
              name: 'Philadelphia Eagles',
              abbreviation: 'PHI',
              score: 21,
            },
            status: 'final',
            quarter: 'Final',
            date: today,
            venue: 'AT&T Stadium',
          },
          {
            id: 'nfl_mock_2',
            league: 'NFL',
            homeTeam: {
              name: 'Green Bay Packers',
              abbreviation: 'GB',
              score: 0,
            },
            awayTeam: {
              name: 'Chicago Bears',
              abbreviation: 'CHI',
              score: 0,
            },
            status: 'scheduled',
            gameTime: '1:00 PM ET',
            date: today,
            venue: 'Lambeau Field',
          },
        ];

      case 'MLB':
        return [
          {
            id: 'mlb_mock_1',
            league: 'MLB',
            homeTeam: {
              name: 'New York Yankees',
              abbreviation: 'NYY',
              score: 8,
            },
            awayTeam: {
              name: 'Boston Red Sox',
              abbreviation: 'BOS',
              score: 5,
            },
            status: 'final',
            quarter: 'Final',
            date: today,
            venue: 'Yankee Stadium',
          },
          {
            id: 'mlb_mock_2',
            league: 'MLB',
            homeTeam: {
              name: 'Los Angeles Dodgers',
              abbreviation: 'LAD',
              score: 3,
            },
            awayTeam: {
              name: 'San Francisco Giants',
              abbreviation: 'SF',
              score: 2,
            },
            status: 'live',
            quarter: '7th',
            timeRemaining: 'Top 7th',
            date: today,
            venue: 'Dodger Stadium',
          },
        ];

      case 'NHL':
        return [
          {
            id: 'nhl_mock_1',
            league: 'NHL',
            homeTeam: {
              name: 'Toronto Maple Leafs',
              abbreviation: 'TOR',
              score: 4,
            },
            awayTeam: {
              name: 'Montreal Canadiens',
              abbreviation: 'MTL',
              score: 2,
            },
            status: 'final',
            quarter: 'Final',
            date: today,
            venue: 'Scotiabank Arena',
          },
          {
            id: 'nhl_mock_2',
            league: 'NHL',
            homeTeam: {
              name: 'Vegas Golden Knights',
              abbreviation: 'VGK',
              score: 1,
            },
            awayTeam: {
              name: 'Colorado Avalanche',
              abbreviation: 'COL',
              score: 2,
            },
            status: 'live',
            quarter: '2nd',
            timeRemaining: '12:34',
            date: today,
            venue: 'T-Mobile Arena',
          },
        ];

      default:
        return [];
    }
  }

  /**
   * Get user's sports preferences
   */
  private async getUserSportsPreferences(): Promise<UserSportsPreferences | null> {
    try {
      const userId = await dbUtils.getCurrentUserId();

      const { data, error } = await supabase
        .from('user_sports_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // No preferences found
        }
        throw new DatabaseError('Failed to get user sports preferences', error);
      }

      return data;
    } catch (error) {
      console.error('❌ Failed to get user sports preferences:', error);
      return null;
    }
  }

  /**
   * Clear cache to force fresh data fetch
   */
  clearCache(): void {
    this.scoresCache = {};
    this.lastFetchTime = {};
  }

  /**
   * Get cache status for debugging
   */
  getCacheStatus(): Record<string, { lastFetch: number; hasData: boolean }> {
    const status: Record<string, { lastFetch: number; hasData: boolean }> = {};
    
    Object.keys(this.lastFetchTime).forEach(key => {
      status[key] = {
        lastFetch: this.lastFetchTime[key],
        hasData: !!this.scoresCache[key],
      };
    });

    return status;
  }
}

export const scoresService = new ScoresService(); 