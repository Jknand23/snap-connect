/**
 * Database Types for SnapConnect V2
 * Generated from the Phase 2 database schema
 */

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
      profiles: {
        Row: {
          id: string;
          username: string;
          full_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          full_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_sports_preferences: {
        Row: {
          user_id: string;
          favorite_teams: string[];
          favorite_players: string[];
          preferred_leagues: string[];
          notification_preferences: any;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          favorite_teams?: string[];
          favorite_players?: string[];
          preferred_leagues?: string[];
          notification_preferences?: any;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          favorite_teams?: string[];
          favorite_players?: string[];
          preferred_leagues?: string[];
          notification_preferences?: any;
          updated_at?: string;
        };
      };
      teams: {
        Row: {
          id: string;
          name: string;
          abbreviation: string;
          league: 'NFL' | 'NBA' | 'MLB' | 'NHL';
          city: string;
          primary_color: string;
          secondary_color: string;
          logo_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          abbreviation: string;
          league: 'NFL' | 'NBA' | 'MLB' | 'NHL';
          city: string;
          primary_color: string;
          secondary_color: string;
          logo_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          abbreviation?: string;
          league?: 'NFL' | 'NBA' | 'MLB' | 'NHL';
          city?: string;
          primary_color?: string;
          secondary_color?: string;
          logo_url?: string | null;
          created_at?: string;
        };
      };
      stories: {
        Row: {
          id: string;
          user_id: string;
          media_url: string;
          media_type: 'photo' | 'video';
          thumbnail_url: string | null;
          caption: string | null;
          duration: number;
          expires_at: string;
          view_count: number;
          privacy_setting: 'public' | 'friends' | 'teams';
          team_filter: string[] | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          media_url: string;
          media_type: 'photo' | 'video';
          thumbnail_url?: string | null;
          caption?: string | null;
          duration?: number;
          expires_at?: string;
          view_count?: number;
          privacy_setting?: 'public' | 'friends' | 'teams';
          team_filter?: string[] | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          media_url?: string;
          media_type?: 'photo' | 'video';
          thumbnail_url?: string | null;
          caption?: string | null;
          duration?: number;
          expires_at?: string;
          view_count?: number;
          privacy_setting?: 'public' | 'friends' | 'teams';
          team_filter?: string[] | null;
          created_at?: string;
        };
      };
      story_views: {
        Row: {
          id: string;
          story_id: string;
          viewer_id: string;
          viewed_at: string;
        };
        Insert: {
          id?: string;
          story_id: string;
          viewer_id: string;
          viewed_at?: string;
        };
        Update: {
          id?: string;
          story_id?: string;
          viewer_id?: string;
          viewed_at?: string;
        };
      };
      chats: {
        Row: {
          id: string;
          name: string | null;
          description: string | null;
          type: 'direct' | 'group' | 'team';
          team_id: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name?: string | null;
          description?: string | null;
          type?: 'direct' | 'group' | 'team';
          team_id?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string | null;
          description?: string | null;
          type?: 'direct' | 'group' | 'team';
          team_id?: string | null;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      chat_participants: {
        Row: {
          id: string;
          chat_id: string;
          user_id: string;
          joined_at: string;
          role: 'admin' | 'member';
          last_read_at: string;
        };
        Insert: {
          id?: string;
          chat_id: string;
          user_id: string;
          joined_at?: string;
          role?: 'admin' | 'member';
          last_read_at?: string;
        };
        Update: {
          id?: string;
          chat_id?: string;
          user_id?: string;
          joined_at?: string;
          role?: 'admin' | 'member';
          last_read_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          chat_id: string;
          sender_id: string;
          content: string | null;
          media_url: string | null;
          media_type: 'text' | 'photo' | 'video' | 'story_share' | null;
          reply_to: string | null;
          expires_at: string | null;
          edited_at: string | null;
          created_at: string;
          is_disappearing: boolean;
          viewed_by_recipient: boolean;
          viewed_at: string | null;
          should_disappear: boolean;
        };
        Insert: {
          id?: string;
          chat_id: string;
          sender_id: string;
          content?: string | null;
          media_url?: string | null;
          media_type?: 'text' | 'photo' | 'video' | 'story_share' | null;
          reply_to?: string | null;
          expires_at?: string | null;
          edited_at?: string | null;
          created_at?: string;
          is_disappearing?: boolean;
          viewed_by_recipient?: boolean;
          viewed_at?: string | null;
          should_disappear?: boolean;
        };
        Update: {
          id?: string;
          chat_id?: string;
          sender_id?: string;
          content?: string | null;
          media_url?: string | null;
          media_type?: 'text' | 'photo' | 'video' | 'story_share' | null;
          reply_to?: string | null;
          expires_at?: string | null;
          edited_at?: string | null;
          created_at?: string;
          is_disappearing?: boolean;
          viewed_by_recipient?: boolean;
          viewed_at?: string | null;
          should_disappear?: boolean;
        };
      };
      message_reactions: {
        Row: {
          id: string;
          message_id: string;
          user_id: string;
          emoji: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          message_id: string;
          user_id: string;
          emoji: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          message_id?: string;
          user_id?: string;
          emoji?: string;
          created_at?: string;
        };
      };
      friendships: {
        Row: {
          id: string;
          requester_id: string;
          addressee_id: string;
          status: 'pending' | 'accepted' | 'blocked';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          requester_id: string;
          addressee_id: string;
          status?: 'pending' | 'accepted' | 'blocked';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          requester_id?: string;
          addressee_id?: string;
          status?: 'pending' | 'accepted' | 'blocked';
          created_at?: string;
          updated_at?: string;
        };
      };
      posts: {
        Row: {
          id: string;
          user_id: string;
          content: string | null;
          media_urls: string[] | null;
          media_type: 'photo' | 'video' | 'text' | null;
          tags: string[] | null;
          sports_context: any | null;
          privacy_setting: 'public' | 'friends' | 'teams';
          like_count: number;
          comment_count: number;
          share_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          content?: string | null;
          media_urls?: string[] | null;
          media_type?: 'photo' | 'video' | 'text' | null;
          tags?: string[] | null;
          sports_context?: any | null;
          privacy_setting?: 'public' | 'friends' | 'teams';
          like_count?: number;
          comment_count?: number;
          share_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          content?: string | null;
          media_urls?: string[] | null;
          media_type?: 'photo' | 'video' | 'text' | null;
          tags?: string[] | null;
          sports_context?: any | null;
          privacy_setting?: 'public' | 'friends' | 'teams';
          like_count?: number;
          comment_count?: number;
          share_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      post_interactions: {
        Row: {
          id: string;
          post_id: string;
          user_id: string;
          type: 'like' | 'share' | 'save';
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          user_id: string;
          type: 'like' | 'share' | 'save';
          created_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          user_id?: string;
          type?: 'like' | 'share' | 'save';
          created_at?: string;
        };
      };
      comments: {
        Row: {
          id: string;
          post_id: string;
          user_id: string;
          content: string;
          reply_to: string | null;
          like_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          user_id: string;
          content: string;
          reply_to?: string | null;
          like_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          user_id?: string;
          content?: string;
          reply_to?: string | null;
          like_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_blocks: {
        Row: {
          id: string;
          blocker_id: string;
          blocked_id: string;
          reason: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          blocker_id: string;
          blocked_id: string;
          reason?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          blocker_id?: string;
          blocked_id?: string;
          reason?: string | null;
          created_at?: string;
        };
      };
      communities: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          type: 'team' | 'league';
          team_id: string | null;
          league: 'NFL' | 'NBA' | 'MLB' | 'NHL';
          emoji: string;
          member_count: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          type: 'team' | 'league';
          team_id?: string | null;
          league: 'NFL' | 'NBA' | 'MLB' | 'NHL';
          emoji?: string;
          member_count?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          type?: 'team' | 'league';
          team_id?: string | null;
          league?: 'NFL' | 'NBA' | 'MLB' | 'NHL';
          emoji?: string;
          member_count?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      community_memberships: {
        Row: {
          id: string;
          community_id: string;
          user_id: string;
          role: 'admin' | 'moderator' | 'member';
          joined_at: string;
          last_read_at: string;
        };
        Insert: {
          id?: string;
          community_id: string;
          user_id: string;
          role?: 'admin' | 'moderator' | 'member';
          joined_at?: string;
          last_read_at?: string;
        };
        Update: {
          id?: string;
          community_id?: string;
          user_id?: string;
          role?: 'admin' | 'moderator' | 'member';
          joined_at?: string;
          last_read_at?: string;
        };
      };
      community_messages: {
        Row: {
          id: string;
          community_id: string;
          sender_id: string;
          content: string | null;
          media_url: string | null;
          media_type: 'text' | 'photo' | 'video' | 'story_share' | null;
          reply_to: string | null;
          expires_at: string;
          edited_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          community_id: string;
          sender_id: string;
          content?: string | null;
          media_url?: string | null;
          media_type?: 'text' | 'photo' | 'video' | 'story_share' | null;
          reply_to?: string | null;
          expires_at?: string;
          edited_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          community_id?: string;
          sender_id?: string;
          content?: string | null;
          media_url?: string | null;
          media_type?: 'text' | 'photo' | 'video' | 'story_share' | null;
          reply_to?: string | null;
          expires_at?: string;
          edited_at?: string | null;
          created_at?: string;
        };
      };
      community_message_reactions: {
        Row: {
          id: string;
          message_id: string;
          user_id: string;
          emoji: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          message_id: string;
          user_id: string;
          emoji: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          message_id?: string;
          user_id?: string;
          emoji?: string;
          created_at?: string;
        };
      };
      chat_presence: {
        Row: {
          id: string;
          chat_id: string;
          user_id: string;
          entered_at: string;
          last_activity: string;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          chat_id: string;
          user_id: string;
          entered_at?: string;
          last_activity?: string;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          chat_id?: string;
          user_id?: string;
          entered_at?: string;
          last_activity?: string;
          is_active?: boolean;
        };
      };
      message_views: {
        Row: {
          id: string;
          message_id: string;
          viewer_id: string;
          viewed_at: string;
        };
        Insert: {
          id?: string;
          message_id: string;
          viewer_id: string;
          viewed_at?: string;
        };
        Update: {
          id?: string;
          message_id?: string;
          viewer_id?: string;
          viewed_at?: string;
        };
      };
      // Phase 3C: Showcase Ready Tables
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
      }
      video_content_metadata: {
        Row: {
          ai_analysis: Json | null
          content_embedding_id: string | null
          created_at: string | null
          duration_seconds: number | null
          engagement_metrics: Json | null
          id: string
          processing_status: string | null
          thumbnail_url: string | null
          updated_at: string | null
          video_quality: string | null
          video_url: string
        }
        Insert: {
          ai_analysis?: Json | null
          content_embedding_id?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          engagement_metrics?: Json | null
          id?: string
          processing_status?: string | null
          thumbnail_url?: string | null
          updated_at?: string | null
          video_quality?: string | null
          video_url: string
        }
        Update: {
          ai_analysis?: Json | null
          content_embedding_id?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          engagement_metrics?: Json | null
          id?: string
          processing_status?: string | null
          thumbnail_url?: string | null
          updated_at?: string | null
          video_quality?: string | null
          video_url?: string
        }
      }
      user_game_subscriptions: {
        Row: {
          created_at: string | null
          expires_at: string | null
          game_id: string
          id: string
          notification_preferences: Json | null
          subscription_type: string | null
          team_focus: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          game_id: string
          id?: string
          notification_preferences?: Json | null
          subscription_type?: string | null
          team_focus?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          game_id?: string
          id?: string
          notification_preferences?: Json | null
          subscription_type?: string | null
          team_focus?: string | null
          user_id?: string | null
        }
      }
      pinecone_config: {
        Row: {
          api_key_hash: string | null
          created_at: string | null
          environment: string
          id: string
          index_name: string
          is_active: boolean | null
          metric_type: string | null
          migration_status: string | null
          performance_comparison: Json | null
          updated_at: string | null
          vector_dimension: number | null
        }
        Insert: {
          api_key_hash?: string | null
          created_at?: string | null
          environment?: string
          id?: string
          index_name?: string
          is_active?: boolean | null
          metric_type?: string | null
          migration_status?: string | null
          performance_comparison?: Json | null
          updated_at?: string | null
          vector_dimension?: number | null
        }
        Update: {
          api_key_hash?: string | null
          created_at?: string | null
          environment?: string
          id?: string
          index_name?: string
          is_active?: boolean | null
          metric_type?: string | null
          migration_status?: string | null
          performance_comparison?: Json | null
          updated_at?: string | null
          vector_dimension?: number | null
        }
      }
      highlight_generation_queue: {
        Row: {
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          game_event_id: string | null
          generated_content: string | null
          generation_time_ms: number | null
          highlight_type: string | null
          id: string
          priority: number | null
          processing_status: string | null
          started_at: string | null
          user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          game_event_id?: string | null
          generated_content?: string | null
          generation_time_ms?: number | null
          highlight_type?: string | null
          id?: string
          priority?: number | null
          processing_status?: string | null
          started_at?: string | null
          user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          game_event_id?: string | null
          generated_content?: string | null
          generation_time_ms?: number | null
          highlight_type?: string | null
          id?: string
          priority?: number | null
          processing_status?: string | null
          started_at?: string | null
          user_id?: string | null
        }
      }
      // Phase 3A & 3B: Core RAG Tables 
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
      }
      rag_content_cache: {
        Row: {
          ai_generated_content: string
          content_type: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          source_data: Json | null
          user_id: string | null
        }
        Insert: {
          ai_generated_content: string
          content_type?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          source_data?: Json | null
          user_id?: string | null
        }
        Update: {
          ai_generated_content?: string
          content_type?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          source_data?: Json | null
          user_id?: string | null
        }
      }
      user_personalization_profiles: {
        Row: {
          content_preferences: Json | null
          favorite_players: string[] | null
          favorite_teams: string[] | null
          id: string
          interaction_history: Json | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          content_preferences?: Json | null
          favorite_players?: string[] | null
          favorite_teams?: string[] | null
          id?: string
          interaction_history?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          content_preferences?: Json | null
          favorite_players?: string[] | null
          favorite_teams?: string[] | null
          id?: string
          interaction_history?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
      }
      rag_user_feedback: {
        Row: {
          content_id: string
          created_at: string | null
          feedback_type: string
          id: string
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          content_id: string
          created_at?: string | null
          feedback_type: string
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          content_id?: string
          created_at?: string | null
          feedback_type?: string
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
      }
      rag_performance_logs: {
        Row: {
          cache_hit: boolean | null
          created_at: string | null
          error_message: string | null
          id: string
          metadata: Json | null
          operation_type: string
          response_time_ms: number | null
          source_apis: string[] | null
          user_id: string | null
        }
        Insert: {
          cache_hit?: boolean | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          operation_type: string
          response_time_ms?: number | null
          source_apis?: string[] | null
          user_id?: string | null
        }
        Update: {
          cache_hit?: boolean | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          operation_type?: string
          response_time_ms?: number | null
          source_apis?: string[] | null
          user_id?: string | null
        }
      }
      api_usage_tracking: {
        Row: {
          api_name: string
          cost_estimate: number | null
          created_at: string | null
          id: string
          operation_type: string
          request_metadata: Json | null
          tokens_used: number | null
          user_id: string | null
        }
        Insert: {
          api_name: string
          cost_estimate?: number | null
          created_at?: string | null
          id?: string
          operation_type: string
          request_metadata?: Json | null
          tokens_used?: number | null
          user_id?: string | null
        }
        Update: {
          api_name?: string
          cost_estimate?: number | null
          created_at?: string | null
          id?: string
          operation_type?: string
          request_metadata?: Json | null
          tokens_used?: number | null
          user_id?: string | null
        }
      }
      content_sources: {
        Row: {
          content_hash: string
          created_at: string | null
          deduplication_score: number | null
          id: string
          merged_content: Json | null
          primary_source: string | null
          quality_score: number | null
          source_apis: string[]
          updated_at: string | null
        }
        Insert: {
          content_hash: string
          created_at?: string | null
          deduplication_score?: number | null
          id?: string
          merged_content?: Json | null
          primary_source?: string | null
          quality_score?: number | null
          source_apis: string[]
          updated_at?: string | null
        }
        Update: {
          content_hash?: string
          created_at?: string | null
          deduplication_score?: number | null
          id?: string
          merged_content?: Json | null
          primary_source?: string | null
          quality_score?: number | null
          source_apis?: string[]
          updated_at?: string | null
        }
      }
      content_interactions_v2: {
        Row: {
          content_id: string | null
          context_metadata: Json | null
          created_at: string | null
          engagement_duration: number | null
          id: string
          interaction_type: string
          source_api: string
          user_id: string | null
        }
        Insert: {
          content_id?: string | null
          context_metadata?: Json | null
          created_at?: string | null
          engagement_duration?: number | null
          id?: string
          interaction_type: string
          source_api: string
          user_id?: string | null
        }
        Update: {
          content_id?: string | null
          context_metadata?: Json | null
          created_at?: string | null
          engagement_duration?: number | null
          id?: string
          interaction_type?: string
          source_api?: string
          user_id?: string | null
        }
      }
      content_recommendations: {
        Row: {
          content_embedding_id: string | null
          created_at: string | null
          expires_at: string | null
          freshness_score: number | null
          id: string
          interaction_predicted: Json | null
          ranking_factors: Json | null
          recommendation_score: number
          source_diversity_bonus: number | null
          user_id: string | null
        }
        Insert: {
          content_embedding_id?: string | null
          created_at?: string | null
          expires_at?: string | null
          freshness_score?: number | null
          id?: string
          interaction_predicted?: Json | null
          ranking_factors?: Json | null
          recommendation_score: number
          source_diversity_bonus?: number | null
          user_id?: string | null
        }
        Update: {
          content_embedding_id?: string | null
          created_at?: string | null
          expires_at?: string | null
          freshness_score?: number | null
          id?: string
          interaction_predicted?: Json | null
          ranking_factors?: Json | null
          recommendation_score?: number
          source_diversity_bonus?: number | null
          user_id?: string | null
        }
      }
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      cleanup_expired_stories: {
        Args: Record<PropertyKey, never>;
        Returns: void;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    }
  };
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const 