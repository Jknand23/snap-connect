/**
 * Scores Service Test
 * 
 * Simple test functions to verify the scores service is working correctly.
 * Run these tests to debug and validate score fetching functionality.
 */

import { scoresService } from '../services/sports/scoresService';

/**
 * Test NBA scores fetching
 */
export async function testNBAScores() {
  console.log('🧪 Testing NBA scores...');
  
  try {
    const nbaScores = await scoresService.getLeagueScores('NBA');
    console.log('✅ NBA Scores Result:', {
      league: nbaScores.league,
      gamesCount: nbaScores.games.length,
      hasLiveGames: nbaScores.hasLiveGames,
      lastUpdated: nbaScores.lastUpdated,
      games: nbaScores.games.map(game => ({
        id: game.id,
        title: `${game.awayTeam.abbreviation} @ ${game.homeTeam.abbreviation}`,
        score: `${game.awayTeam.score} - ${game.homeTeam.score}`,
        status: game.status,
        date: game.date
      }))
    });
    
    return nbaScores;
  } catch (error) {
    console.error('❌ NBA Scores Test Failed:', error);
    throw error;
  }
}

/**
 * Test user scores based on preferences
 */
export async function testUserScores() {
  console.log('🧪 Testing user scores...');
  
  try {
    const userScores = await scoresService.getUserScores();
    console.log('✅ User Scores Result:', {
      leaguesCount: userScores.length,
      totalGames: userScores.reduce((sum, league) => sum + league.games.length, 0),
      leagues: userScores.map(league => ({
        league: league.league,
        gamesCount: league.games.length,
        hasLiveGames: league.hasLiveGames
      }))
    });
    
    return userScores;
  } catch (error) {
    console.error('❌ User Scores Test Failed:', error);
    throw error;
  }
}

/**
 * Test cache functionality
 */
export async function testCache() {
  console.log('🧪 Testing cache functionality...');
  
  try {
    // Clear cache first
    scoresService.clearCache();
    console.log('🗑️ Cache cleared');
    
    // First call should fetch fresh data
    const startTime = Date.now();
    await scoresService.getLeagueScores('NBA');
    const firstCallTime = Date.now() - startTime;
    console.log(`⏱️ First call took: ${firstCallTime}ms`);
    
    // Second call should use cache
    const secondStartTime = Date.now();
    await scoresService.getLeagueScores('NBA');
    const secondCallTime = Date.now() - secondStartTime;
    console.log(`⏱️ Second call took: ${secondCallTime}ms`);
    
    // Check cache status
    const cacheStatus = scoresService.getCacheStatus();
    console.log('📊 Cache Status:', cacheStatus);
    
    console.log('✅ Cache test completed');
  } catch (error) {
    console.error('❌ Cache Test Failed:', error);
    throw error;
  }
}

/**
 * Run all tests
 */
export async function runAllScoresTests() {
  console.log('🚀 Running all scores tests...');
  
  try {
    await testNBAScores();
    await testUserScores();
    await testCache();
    
    console.log('✅ All scores tests completed successfully!');
  } catch (error) {
    console.error('❌ Scores tests failed:', error);
  }
} 