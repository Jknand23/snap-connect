export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      api_performance_metrics: {
        Row: {
          api_source: string
          avg_response_time_ms: number | null
          cost_estimate: number | null
          created_at: string | null
          failed_requests: number | null
          id: string
          metadata: Json | null
          metric_date: string
          rate_limit_hits: number | null
          showcase_readiness_score: number | null
          successful_requests: number | null
          total_requests: number | null
          uptime_percentage: number | null
        }
        Insert: {
          api_source: string
          avg_response_time_ms?: number | null
          cost_estimate?: number | null
          created_at?: string | null
          failed_requests?: number | null
          id?: string
          metadata?: Json | null
          metric_date?: string
          rate_limit_hits?: number | null
          showcase_readiness_score?: number | null
          successful_requests?: number | null
          total_requests?: number | null
          uptime_percentage?: number | null
        }
        Update: {
          api_source?: string
          avg_response_time_ms?: number | null
          cost_estimate?: number | null
          created_at?: string | null
          failed_requests?: number | null
          id?: string
          metadata?: Json | null
          metric_date?: string
          rate_limit_hits?: number | null
          showcase_readiness_score?: number | null
          successful_requests?: number | null
          total_requests?: number | null
          uptime_percentage?: number | null
        }
        Relationships: []
      }
      content_embeddings: {
        Row: {
          author: string | null
          content_hash: string | null
          content_quality_score: number | null
          content_text: string
          content_type: string
          created_at: string | null
          deduplication_cluster_id: string | null
          embedding: string | null
          engagement_metrics: Json | null
          expires_at: string | null
          id: string
          metadata: Json | null
          players: string[] | null
          source_api: string | null
          source_name: string | null
          source_url: string | null
          teams: string[] | null
          title: string
        }
        Insert: {
          author?: string | null
          content_hash?: string | null
          content_quality_score?: number | null
          content_text: string
          content_type: string
          created_at?: string | null
          deduplication_cluster_id?: string | null
          embedding?: string | null
          engagement_metrics?: Json | null
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          players?: string[] | null
          source_api?: string | null
          source_name?: string | null
          source_url?: string | null
          teams?: string[] | null
          title: string
        }
        Update: {
          author?: string | null
          content_hash?: string | null
          content_quality_score?: number | null
          content_text?: string
          content_type?: string
          created_at?: string | null
          deduplication_cluster_id?: string | null
          embedding?: string | null
          engagement_metrics?: Json | null
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          players?: string[] | null
          source_api?: string | null
          source_name?: string | null
          source_url?: string | null
          teams?: string[] | null
          title?: string
        }
        Relationships: []
      }
      live_game_events: {
        Row: {
          created_at: string | null
          event_description: string
          event_type: string
          game_id: string
          game_time: string | null
          highlight_generated: boolean | null
          id: string
          impact_score: number | null
          players_involved: string[] | null
          processed_at: string | null
          processed_for_users: string[] | null
          teams_involved: string[] | null
        }
        Insert: {
          created_at?: string | null
          event_description: string
          event_type: string
          game_id: string
          game_time?: string | null
          highlight_generated?: boolean | null
          id?: string
          impact_score?: number | null
          players_involved?: string[] | null
          processed_at?: string | null
          processed_for_users?: string[] | null
          teams_involved?: string[] | null
        }
        Update: {
          created_at?: string | null
          event_description?: string
          event_type?: string
          game_id?: string
          game_time?: string | null
          highlight_generated?: boolean | null
          id?: string
          impact_score?: number | null
          players_involved?: string[] | null
          processed_at?: string | null
          processed_for_users?: string[] | null
          teams_involved?: string[] | null
        }
        Relationships: []
      }
      // ... other RAG tables exist and working
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          full_name: string | null
          id: string
          updated_at: string | null
          username: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
          username: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
          username?: string
        }
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}
