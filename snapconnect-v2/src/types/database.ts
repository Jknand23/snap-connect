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

export interface Database {
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
  };
} 