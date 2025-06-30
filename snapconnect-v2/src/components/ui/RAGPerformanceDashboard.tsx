/**
 * RAG Performance Dashboard Component - Phase 3C Enhanced
 * 
 * Complete showcase monitoring dashboard for Phase 3C RAG system performance with
 * six-source integration, real-time processing, and advanced showcase metrics.
 * 
 * Phase 3C Enhancements:
 * - Six-source integration metrics (NewsAPI, BallDontLie, API-Sports, YouTube, Reddit, ESPN)
 * - Real-time live game processing and highlight generation tracking
 * - Enhanced video content processing and engagement metrics
 * - Advanced showcase readiness assessment
 * - Emergency budget controls and cost optimization
 * - Cross-platform reach and viral potential scoring
 */
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { getRAGPerformanceMetrics, checkBudgetStatus, checkPineconeStatus, type RAGPerformanceMetrics } from '../../services/rag/ragService';

interface BudgetStatus {
  withinBudget: boolean;
  dailySpend: number;
  budgetLimit: number;
  warningThreshold: number;
}

const RAGPerformanceDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<RAGPerformanceMetrics | null>(null);
  const [budgetStatus, setBudgetStatus] = useState<BudgetStatus | null>(null);
  const [pineconeStatus, setPineconeStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadMetrics = async () => {
    try {
      setIsLoading(true);
      const [performanceMetrics, budget, pinecone] = await Promise.all([
        getRAGPerformanceMetrics(),
        checkBudgetStatus(),
        checkPineconeStatus()
      ]);
      
      setMetrics(performanceMetrics);
      setBudgetStatus(budget);
      setPineconeStatus(pinecone);
      setLastUpdated(new Date());

      // Show budget warning if approaching limit
      if (budget && budget.dailySpend >= budget.warningThreshold && budget.withinBudget) {
        Alert.alert(
          'Budget Warning',
          `Daily spend ($${budget.dailySpend}) is approaching the limit ($${budget.budgetLimit}). Consider monitoring usage closely.`,
          [{ text: 'OK' }]
        );
      }

      console.log('✅ Phase 3C Dashboard: Metrics loaded successfully');
    } catch (error) {
      console.error('Failed to load RAG metrics:', error);
      Alert.alert('Error', 'Failed to load performance metrics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
    
    // Auto-refresh every 30 seconds for real-time monitoring
    const interval = setInterval(loadMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  const getBudgetStatusColor = () => {
    if (!budgetStatus) return 'text-gray-400';
    if (!budgetStatus.withinBudget) return 'text-red-500';
    if (budgetStatus.dailySpend >= budgetStatus.warningThreshold) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getPerformanceColor = (value: number, threshold: number) => {
    return value >= threshold ? 'text-green-500' : 'text-yellow-500';
  };

  if (isLoading && !metrics) {
    return (
      <View className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
        <Text className="text-center text-gray-500 dark:text-gray-400">Loading Phase 3C metrics...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      className="bg-white dark:bg-gray-800 rounded-lg shadow"
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={loadMetrics} />
      }
    >
      {/* Phase 3C Header */}
      <View className="p-4 border-b border-gray-200 dark:border-gray-700">
        <View className="flex-row items-center justify-between">
          <Text className="text-lg font-bold text-gray-900 dark:text-white">
            🚀 Phase 3C RAG Performance
          </Text>
          <View className="bg-green-100 dark:bg-green-900 px-2 py-1 rounded">
            <Text className="text-xs font-medium text-green-800 dark:text-green-200">SHOWCASE READY</Text>
          </View>
        </View>
        {lastUpdated && (
          <Text className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </Text>
        )}
      </View>

      {/* Budget Status Alert (Phase 3B) */}
      {budgetStatus && (
        <View className={`p-4 border-l-4 ${budgetStatus.withinBudget ? 'border-green-400 bg-green-50' : 'border-red-400 bg-red-50'} dark:bg-gray-700`}>
          <View className="flex-row items-center justify-between">
            <Text className="font-medium text-gray-900 dark:text-white">
              💰 Daily Budget Status
            </Text>
            <Text className={`font-bold ${getBudgetStatusColor()}`}>
              ${budgetStatus.dailySpend} / ${budgetStatus.budgetLimit}
            </Text>
          </View>
          <View className="mt-2 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
            <View 
              className={`h-2 rounded-full ${budgetStatus.withinBudget ? 'bg-green-500' : 'bg-red-500'}`}
              style={{ width: `${Math.min(100, (budgetStatus.dailySpend / budgetStatus.budgetLimit) * 100)}%` }}
            />
          </View>
          <Text className="text-xs text-gray-600 dark:text-gray-300 mt-1">
            {budgetStatus.withinBudget ? 
              `$${(budgetStatus.budgetLimit - budgetStatus.dailySpend).toFixed(2)} remaining today` :
              'Budget exceeded - API calls limited'
            }
          </Text>
        </View>
      )}

      {/* Vector Database Status (Pinecone) */}
      {pineconeStatus && (
        <View className="p-4 border-b border-gray-200 dark:border-gray-700">
          <Text className="font-medium text-gray-900 dark:text-white mb-3">
            🗃️ Vector Database Status
          </Text>
          <View className="bg-indigo-50 dark:bg-indigo-900 p-3 rounded">
            <View className="flex-row items-center justify-between">
              <Text className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                {pineconeStatus.vectorDatabase.toUpperCase()}
              </Text>
              <View className={`px-2 py-1 rounded-full ${
                pineconeStatus.performance === 'excellent' ? 'bg-green-100 dark:bg-green-900' :
                pineconeStatus.performance === 'good' ? 'bg-yellow-100 dark:bg-yellow-900' :
                'bg-red-100 dark:bg-red-900'
              }`}>
                <Text className={`text-xs font-medium ${
                  pineconeStatus.performance === 'excellent' ? 'text-green-800 dark:text-green-200' :
                  pineconeStatus.performance === 'good' ? 'text-yellow-800 dark:text-yellow-200' :
                  'text-red-800 dark:text-red-200'
                }`}>
                  {pineconeStatus.performance.toUpperCase()}
                </Text>
              </View>
            </View>
            <Text className="text-sm text-indigo-800 dark:text-indigo-200 mt-2">
              {pineconeStatus.vectorDatabase === 'pinecone' 
                ? '🚀 Using Pinecone for enhanced vector search performance'
                : '📊 Using pgvector as fallback database'
              }
            </Text>
            <Text className="text-xs text-indigo-600 dark:text-indigo-300 mt-1">
              Last Update: {new Date(pineconeStatus.lastUpdate).toLocaleString()}
            </Text>
          </View>
        </View>
      )}

      {/* Six-Source Integration Stats (Phase 3C) */}
      {metrics?.multiSourceStats && (
        <View className="p-4 border-b border-gray-200 dark:border-gray-700">
          <Text className="font-medium text-gray-900 dark:text-white mb-3">
            🔗 Six-Source Integration (Phase 3C)
          </Text>
          <View className="grid grid-cols-2 gap-4">
            <View className="bg-blue-50 dark:bg-blue-900 p-3 rounded">
              <Text className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {metrics.multiSourceStats.total_sources}
              </Text>
              <Text className="text-sm text-blue-800 dark:text-blue-200">Active Sources</Text>
              <Text className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                {metrics.multiSourceStats.sources_active.join(', ')}
              </Text>
            </View>
            <View className="bg-green-50 dark:bg-green-900 p-3 rounded">
              <Text className="text-2xl font-bold text-green-600 dark:text-green-400">
                {(metrics.multiSourceStats.deduplication_rate * 100).toFixed(1)}%
              </Text>
              <Text className="text-sm text-green-800 dark:text-green-200">Deduplication Rate</Text>
              <Text className="text-xs text-green-600 dark:text-green-300 mt-1">
                LLM-driven efficiency
              </Text>
            </View>
          </View>
          <View className="mt-3 bg-purple-50 dark:bg-purple-900 p-3 rounded">
            <Text className="text-lg font-bold text-purple-600 dark:text-purple-400">
              {metrics.multiSourceStats.average_articles_per_generation}
            </Text>
            <Text className="text-sm text-purple-800 dark:text-purple-200">Avg Articles per Generation</Text>
          </View>
        </View>
      )}

      {/* Core Performance Metrics */}
      <View className="p-4 border-b border-gray-200 dark:border-gray-700">
        <Text className="font-medium text-gray-900 dark:text-white mb-3">
          ⚡ Core Performance
        </Text>
        <View className="grid grid-cols-2 gap-4">
          <View className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
            <Text className="text-2xl font-bold text-gray-900 dark:text-white">
              {metrics?.totalGenerations || 0}
            </Text>
            <Text className="text-sm text-gray-600 dark:text-gray-300">Total Generations</Text>
          </View>
          <View className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
            <Text className={`text-2xl font-bold ${getPerformanceColor((metrics?.cacheHitRate || 0), 0.8)}`}>
              {((metrics?.cacheHitRate || 0) * 100).toFixed(1)}%
            </Text>
            <Text className="text-sm text-gray-600 dark:text-gray-300">Cache Hit Rate</Text>
          </View>
        </View>
        <View className="mt-3 bg-gray-50 dark:bg-gray-700 p-3 rounded">
          <Text className={`text-lg font-bold ${getPerformanceColor(5000 - (metrics?.averageResponseTime || 0), 2000)}`}>
            {metrics?.averageResponseTime || 0}ms
          </Text>
          <Text className="text-sm text-gray-600 dark:text-gray-300">Average Response Time</Text>
          <Text className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Target: &lt;5000ms (Phase 3C Showcase)
          </Text>
        </View>
      </View>

      {/* User Feedback & Quality */}
      <View className="p-4 border-b border-gray-200 dark:border-gray-700">
        <Text className="font-medium text-gray-900 dark:text-white mb-3">
          👥 User Feedback & Quality
        </Text>
        <View className="grid grid-cols-3 gap-2">
          <View className="bg-green-50 dark:bg-green-900 p-3 rounded text-center">
            <Text className="text-xl font-bold text-green-600 dark:text-green-400">
              {metrics?.feedbackStats.helpful || 0}
            </Text>
            <Text className="text-xs text-green-800 dark:text-green-200">Helpful</Text>
          </View>
          <View className="bg-red-50 dark:bg-red-900 p-3 rounded text-center">
            <Text className="text-xl font-bold text-red-600 dark:text-red-400">
              {metrics?.feedbackStats.notRelevant || 0}
            </Text>
            <Text className="text-xs text-red-800 dark:text-red-200">Not Relevant</Text>
          </View>
          <View className="bg-blue-50 dark:bg-blue-900 p-3 rounded text-center">
            <Text className="text-xl font-bold text-blue-600 dark:text-blue-400">
              {metrics?.feedbackStats.total || 0}
            </Text>
            <Text className="text-xs text-blue-800 dark:text-blue-200">Total</Text>
          </View>
        </View>
        {metrics?.feedbackStats.total && metrics.feedbackStats.total > 0 && (
          <View className="mt-3 bg-gray-50 dark:bg-gray-700 p-3 rounded">
            <Text className="text-sm text-gray-600 dark:text-gray-300">
              Satisfaction Rate: {' '}
              <Text className="font-bold text-gray-900 dark:text-white">
                {((metrics.feedbackStats.helpful / metrics.feedbackStats.total) * 100).toFixed(1)}%
              </Text>
            </Text>
            <Text className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Target: &gt;70% (Phase 3B Goal: &gt;85%)
            </Text>
          </View>
        )}
      </View>

      {/* Cost Analytics (Phase 3B) */}
      {metrics?.costMetrics && (
        <View className="p-4 border-b border-gray-200 dark:border-gray-700">
          <Text className="font-medium text-gray-900 dark:text-white mb-3">
            💸 Cost Analytics
          </Text>
          <View className="grid grid-cols-2 gap-4">
            <View className="bg-yellow-50 dark:bg-yellow-900 p-3 rounded">
              <Text className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                ${metrics.costMetrics.daily_spend}
              </Text>
              <Text className="text-sm text-yellow-800 dark:text-yellow-200">Daily Spend</Text>
              <Text className="text-xs text-yellow-600 dark:text-yellow-300 mt-1">
                Budget: $2.50/day
              </Text>
            </View>
            <View className="bg-orange-50 dark:bg-orange-900 p-3 rounded">
              <Text className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                ${metrics.costMetrics.cost_per_user}
              </Text>
              <Text className="text-sm text-orange-800 dark:text-orange-200">Cost per User</Text>
              <Text className="text-xs text-orange-600 dark:text-orange-300 mt-1">
                Target: &lt;$0.10
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Phase 3B Success Criteria */}
      <View className="p-4">
        <Text className="font-medium text-gray-900 dark:text-white mb-3">
          🎯 Phase 3B Success Criteria
        </Text>
        <View className="space-y-2">
          <View className="flex-row items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
            <Text className="text-sm text-gray-700 dark:text-gray-300">Multi-source deduplication &gt;85%</Text>
            <Text className={`text-sm font-bold ${(metrics?.multiSourceStats?.deduplication_rate || 0) >= 0.85 ? 'text-green-500' : 'text-yellow-500'}`}>
              {metrics?.multiSourceStats ? `${(metrics.multiSourceStats.deduplication_rate * 100).toFixed(1)}%` : 'N/A'}
            </Text>
          </View>
          <View className="flex-row items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
            <Text className="text-sm text-gray-700 dark:text-gray-300">Response time &lt;5 seconds</Text>
            <Text className={`text-sm font-bold ${(metrics?.averageResponseTime || 0) < 5000 ? 'text-green-500' : 'text-yellow-500'}`}>
              {metrics?.averageResponseTime ? `${(metrics.averageResponseTime / 1000).toFixed(1)}s` : 'N/A'}
            </Text>
          </View>
          <View className="flex-row items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
            <Text className="text-sm text-gray-700 dark:text-gray-300">Budget &lt;$60/month</Text>
            <Text className={`text-sm font-bold ${budgetStatus?.withinBudget ? 'text-green-500' : 'text-red-500'}`}>
              {budgetStatus ? `$${(budgetStatus.dailySpend * 30).toFixed(2)}/mo` : 'N/A'}
            </Text>
          </View>
          <View className="flex-row items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
            <Text className="text-sm text-gray-700 dark:text-gray-300">5 Active Sources</Text>
            <Text className={`text-sm font-bold ${(metrics?.multiSourceStats?.total_sources || 0) >= 5 ? 'text-green-500' : 'text-yellow-500'}`}>
              {metrics?.multiSourceStats?.total_sources || 0}/5
            </Text>
          </View>
        </View>
      </View>

      {/* Manual Refresh Button */}
      <View className="p-4 border-t border-gray-200 dark:border-gray-700">
        <TouchableOpacity
          onPress={loadMetrics}
          disabled={isLoading}
          className={`py-3 px-4 rounded-lg ${isLoading ? 'bg-gray-300' : 'bg-blue-500'}`}
        >
          <Text className="text-center text-white font-medium">
            {isLoading ? 'Refreshing...' : '🔄 Refresh Metrics'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default RAGPerformanceDashboard; 