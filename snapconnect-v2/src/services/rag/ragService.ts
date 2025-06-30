/**
 * RAG Service - Client-side interface for Personalized Content Generation
 * 
 * This service handles client-side interactions with the RAG-powered content system:
 * - Five-source content integration (NewsAPI, BallDontLie, API-Sports, YouTube, Reddit)
 * - User feedback collection and personalization learning
 * - Performance monitoring and cost optimization
 * - Cache management and fallback strategies
 * 
 * Phase 3C Features:
 * - Premium content quality with five diverse data sources
 * - Advanced user interaction tracking for personalization
 * - Showcase-ready performance metrics and monitoring
 * - Real-time content generation with intelligent caching
 */

import { supabase } from '../database/supabase';

// Types for RAG system
export interface RAGContent {
  id: string;
  summary: string;
  cached: boolean;
  sources_used?: string[];
  metadata?: {
    generation_time?: number;
    confidence_score?: number;
    personalization_score?: number;
  };
}

export interface RAGFeedbackData {
  content_id: string;
  feedback_type: 'helpful' | 'not_relevant' | 'poor_quality' | 'excellent';
  feedback_details?: string;
  user_context?: {
    time_spent_reading?: number;
    content_type_preference?: string;
    source_preference?: string[];
  };
}

export interface RAGPerformanceMetrics {
  response_time: number;
  cache_hit_rate: number;
  user_satisfaction: number;
  sources_active: number;
  phase: string;
  showcase_features: string[];
}

export interface ShowcaseReadiness {
  sources_active: number;
  sources_target: number; // Updated to 5 (ESPN removed)
  deduplication_effectiveness: number;
  avg_content_quality: number;
  showcase_ready: boolean;
  phase: string;
}

// Enhanced interface for Phase 3C showcase features
export interface RAGShowcaseFeatures {
  five_sources?: boolean; // Updated from six_sources
  llm_deduplication?: boolean;
  personalized_ranking?: boolean;
  premium_gpt4o?: boolean;
  showcase_ready?: boolean;
  pinecone_vector_db?: boolean;
  pgvector_db?: boolean;
}

class RAGService {
  constructor() {
    // Initialize the RAG service
  }

  /**
   * Check for cached RAG content for a user
   * 
   * @param userId - User ID to check for cached content
   * @returns Cached content if available, null otherwise
   */
  private async getCachedContent(userId: string): Promise<RAGContent | null> {
    try {
      const { data, error } = await supabase
        .from('rag_content_cache')
        .select('*')
        .eq('user_id', userId)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !data) {
        return null;
      }

      return {
        id: data.id,
        summary: data.ai_generated_content,
        cached: true,
        sources_used: data.source_data?.sources_used || [],
        metadata: {
          generation_time: new Date(data.created_at).getTime(),
          confidence_score: 0.85,
          personalization_score: 0.8
        }
      };
    } catch (error) {
      console.error('Error checking cached content:', error);
      return null;
    }
  }

  /**
   * Generate personalized sports content summary for a user
   * Uses the Phase 3C showcase RAG system with five data sources
   * 
   * @param userId - User ID for personalization
   * @param options - Generation options
   * @returns Personalized content summary
   */
  async generatePersonalizedSummary(
    userId: string, 
    options: {
      forceRefresh?: boolean;
      contentType?: string;
      maxArticles?: number;
    } = {}
  ): Promise<RAGContent> {
    const startTime = Date.now(); // Track start time for response calculation
    console.log(`🤖 RAG Service: Generating personalized summary for user ${userId}...`);

    try {
      // Check for cached content first (unless force refresh is requested)
      if (!options.forceRefresh) {
        const cached = await this.getCachedContent(userId);
        if (cached) {
          console.log('📦 Returning cached RAG content');
          return cached;
        }
      }

      // Get current session for authorization
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session) {
        console.error('RAG Service: No valid session found');
        throw new Error('Authentication required for RAG content generation');
      }

      const session = sessionData;

      // Call the enhanced Phase 3C Edge Function
      const { data, error } = await supabase.functions.invoke('rag_personalized_content', {
        body: { 
          user_id: userId,
          force_refresh: options.forceRefresh || false,
          content_type: options.contentType || 'personalized_summary',
          max_articles: options.maxArticles || 7
        },
        headers: {
          Authorization: `Bearer ${session.session.access_token}`,
        },
      });

      if (error) {
        console.error('RAG Service Error:', error);
        throw error;
      }

      if (!data) {
        console.warn('No data returned from RAG service');
        return {
          id: `fallback_${Date.now()}`,
          summary: 'Unable to generate personalized content at this time. Please try again later.',
          cached: false
        };
      }

      const responseTime = Date.now() - startTime; // Calculate actual response time

      // Track successful generation with proper response time
      await this.trackPerformanceMetrics({
        user_id: userId,
        operation_type: 'generation',
        success: true,
        response_time_ms: responseTime, // Use calculated response time instead of timestamp
        sources_used: data.sources_used || [],
        features_used: data.enhancement_features || [],
        cache_hit: false
      });

      const ragContent: RAGContent = {
        id: `rag_${userId}_${Date.now()}`,
        summary: data.summary || 'Content generation completed.',
        cached: data.cached || false,
        sources_used: data.sources_used || [],
        metadata: {
          generation_time: Date.now(),
          confidence_score: 0.85,
          personalization_score: 0.8
        }
      };

      console.log(`✅ RAG Service: Generated content using ${(data.sources_used || []).length} sources`);
      return ragContent;

    } catch (error) {
      console.error('RAG Service Error:', error);
      
      const responseTime = Date.now() - startTime; // Calculate response time even for errors

      // Track failed generation with proper error handling
      await this.trackPerformanceMetrics({
        user_id: userId,
        operation_type: 'generation',
        success: false,
        error_type: error instanceof Error ? error.constructor.name : 'unknown_error',
        error_message: error instanceof Error ? error.message : 'Unknown error occurred',
        response_time_ms: responseTime, // Use calculated response time
        cache_hit: false
      });

      // Return fallback content
      return {
        id: `fallback_${Date.now()}`,
        summary: 'Unable to generate personalized content. Our team is working to resolve this issue.',
        cached: false,
        metadata: {
          generation_time: Date.now(),
          confidence_score: 0.1,
          personalization_score: 0.0
        }
      };
    }
  }

  /**
   * Submit user feedback on RAG-generated content
   * This helps improve future personalization
   * 
   * @param userId - User providing feedback
   * @param feedback - Feedback data
   */
  async submitFeedback(userId: string, feedback: RAGFeedbackData): Promise<void> {
    try {
      const { error } = await supabase
        .from('rag_user_feedback')
        .insert({
          user_id: userId,
          content_id: feedback.content_id,
          feedback_type: feedback.feedback_type,
          metadata: {
            feedback_details: feedback.feedback_details,
            user_context: feedback.user_context,
            timestamp: new Date().toISOString()
          },
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error submitting RAG feedback:', error);
        return;
      }

      console.log(`📝 RAG Feedback submitted: ${feedback.feedback_type} for content ${feedback.content_id}`);
      
      // Track feedback for analytics
      await this.trackUserInteraction(userId, 'feedback', {
        feedback_type: feedback.feedback_type,
        content_id: feedback.content_id
      });

    } catch (error) {
      console.error('RAG feedback submission error:', error);
    }
  }

  /**
   * Get RAG system performance metrics for monitoring
   * 
   * @param userId - User ID (optional, for user-specific metrics)
   * @returns Performance metrics
   */
  async getPerformanceMetrics(userId?: string): Promise<RAGPerformanceMetrics> {
    try {
      let query = supabase
        .from('rag_performance_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(100);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching RAG metrics:', error);
        return this.getDefaultMetrics();
      }

      const metrics = data || [];
      const successfulOps = metrics.filter(m => m.metadata?.success !== false);
      const recentOps = metrics.filter(m => 
        new Date(m.timestamp).getTime() > Date.now() - (24 * 60 * 60 * 1000)
      );

      return {
        response_time: this.calculateAverageResponseTime(recentOps),
        cache_hit_rate: this.calculateCacheHitRate(recentOps),
        user_satisfaction: this.calculateUserSatisfaction(metrics),
        sources_active: this.getActiveSources(recentOps),
        phase: '3C',
        showcase_features: [
          'five_sources',
          'llm_deduplication', 
          'personalized_ranking',
          'premium_gpt4o',
          'showcase_ready'
        ]
      };

    } catch (error) {
      console.error('RAG metrics calculation error:', error);
      return this.getDefaultMetrics();
    }
  }

  /**
   * Check if the RAG system is ready for showcase/demo
   * 
   * @returns Showcase readiness assessment
   */
  async getShowcaseReadiness(): Promise<ShowcaseReadiness> {
    try {
      const { data, error } = await supabase
        .from('rag_performance_logs')
        .select('metadata')
        .order('timestamp', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !data?.metadata) {
        return {
          sources_active: 0,
          sources_target: 5, // Updated from 6 to 5 (ESPN removed)
          deduplication_effectiveness: 0,
          avg_content_quality: 0,
          showcase_ready: false,
          phase: '3C'
        };
      }

      const metadata = data.metadata;
      return {
        sources_active: metadata.sources_count || 0,
        sources_target: 5, // Updated from 6 to 5 (ESPN removed)
        deduplication_effectiveness: metadata.deduplication_effectiveness || 0,
        avg_content_quality: metadata.avg_content_quality || 0,
        showcase_ready: (metadata.sources_count || 0) >= 5 && 
                       (metadata.deduplication_effectiveness || 0) >= 0.15 &&
                       (metadata.avg_content_quality || 0) >= 0.7,
        phase: '3C'
      };

    } catch (error) {
      console.error('Showcase readiness check error:', error);
      return {
        sources_active: 0,
        sources_target: 5,
        deduplication_effectiveness: 0,
        avg_content_quality: 0,
        showcase_ready: false,
        phase: '3C'
      };
    }
  }

  /**
   * Track user interactions for personalization learning
   * 
   * @param userId - User ID
   * @param interactionType - Type of interaction
   * @param interactionData - Interaction details
   */
  private async trackUserInteraction(
    userId: string, 
    interactionType: string, 
    interactionData: any
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_content_interactions')
        .insert({
          user_id: userId,
          interaction_type: interactionType,
          interaction_value: interactionData,
          timestamp: new Date().toISOString()
        });

      if (error) {
        console.error('Error tracking user interaction:', error);
      }
    } catch (error) {
      console.error('User interaction tracking error:', error);
    }
  }

  /**
   * Track RAG system performance metrics
   * 
   * @param metricsData - Performance data to track
   */
  private async trackPerformanceMetrics(metricsData: any): Promise<void> {
    try {
      // Ensure response_time_ms is within reasonable bounds and properly formatted
      let responseTimeMs = null;
      if (typeof metricsData.response_time_ms === 'number') {
        // Ensure it's a reasonable response time (not a timestamp)
        responseTimeMs = metricsData.response_time_ms > 300000 ? null : metricsData.response_time_ms;
      } else if (typeof metricsData.response_time === 'number') {
        // Legacy support - convert if needed
        responseTimeMs = metricsData.response_time > 300000 ? null : metricsData.response_time;
      }

      // Map the incoming data to the correct database schema
      const dbRecord = {
        operation_type: metricsData.operation_type || 'unknown',
        user_id: metricsData.user_id || null,
        success: metricsData.success ?? true,
        error_type: metricsData.error_type || null,
        error_message: metricsData.error_message || null,
        response_time_ms: responseTimeMs, // Properly calculated response time in milliseconds
        sources_used: metricsData.sources_used || [],
        features_used: metricsData.features_used || [],
        source_apis: metricsData.source_apis || metricsData.sources_used || [],
        cache_hit: metricsData.cache_hit || metricsData.cached || false,
        metadata: {
          ...metricsData,
          tracked_at: new Date().toISOString(),
          phase: '3C',
          response_time_validated: responseTimeMs !== null
        },
        timestamp: new Date().toISOString()
      };

      const { error } = await supabase
        .from('rag_performance_logs')
        .insert(dbRecord);

      if (error) {
        console.error('Error tracking RAG performance:', error);
        // Don't throw here to avoid disrupting the main flow
      } else {
        console.log('📊 RAG performance metrics tracked successfully');
      }
    } catch (error) {
      console.error('RAG performance tracking error:', error);
      // Gracefully handle errors without disrupting main functionality
    }
  }

  // Helper methods for metrics calculation
  private calculateAverageResponseTime(operations: any[]): number {
    if (operations.length === 0) return 0;
    const responseTimes = operations
      .map(op => op.metadata?.response_time)
      .filter(time => typeof time === 'number');
    
    return responseTimes.length > 0 
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
      : 0;
  }

  private calculateCacheHitRate(operations: any[]): number {
    if (operations.length === 0) return 0;
    const cacheHits = operations.filter(op => op.metadata?.cached === true).length;
    return cacheHits / operations.length;
  }

  private calculateUserSatisfaction(operations: any[]): number {
    // This would be calculated from user feedback data
    // For now, return a placeholder based on successful operations
    const successfulOps = operations.filter(op => op.metadata?.success !== false);
    return operations.length > 0 ? successfulOps.length / operations.length : 0;
  }

  private getActiveSources(operations: any[]): number {
    if (operations.length === 0) return 0;
    const recentOp = operations[0];
    return recentOp?.metadata?.sources_count || 0;
  }

  private getDefaultMetrics(): RAGPerformanceMetrics {
    return {
      response_time: 0,
      cache_hit_rate: 0,
      user_satisfaction: 0,
      sources_active: 0,
      phase: '3C',
      showcase_features: ['five_sources', 'showcase_ready']
    };
  }
}

export const ragService = new RAGService(); 

// Export convenience functions for easier imports
export async function getPersonalizedSummary(
  userId: string, 
  options?: {
    forceRefresh?: boolean;
    contentType?: string;
    maxArticles?: number;
  }
): Promise<RAGContent> {
  return ragService.generatePersonalizedSummary(userId, options);
}

export async function submitRAGFeedback(
  feedbackData: {
    contentId: string;
    feedbackType: 'helpful' | 'not-relevant' | 'poor-quality' | 'excellent';
    sourceAttribution?: string[];
    contextMetadata?: {
      content_type?: string;
      position_in_feed?: number;
      source_api?: string;
    };
  }
): Promise<void> {
  // Get current user ID
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id;
  
  if (!userId) {
    throw new Error('No authenticated user found for feedback submission');
  }

  // Convert to internal RAGFeedbackData format
  const ragFeedback: RAGFeedbackData = {
    content_id: feedbackData.contentId,
    feedback_type: feedbackData.feedbackType === 'not-relevant' ? 'not_relevant' : 
                   feedbackData.feedbackType === 'poor-quality' ? 'poor_quality' : 
                   feedbackData.feedbackType as 'helpful' | 'excellent',
    feedback_details: feedbackData.sourceAttribution?.join(', '),
    user_context: {
      content_type_preference: feedbackData.contextMetadata?.content_type,
      source_preference: feedbackData.sourceAttribution
    }
  };

  return ragService.submitFeedback(userId, ragFeedback);
} 