import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please set up your Supabase project.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          user_id: string;
          name: string | null;
          location: string | null;
          avatar_url: string | null;
          bio: string | null;
          skills_offered: string[];
          skills_wanted: string[];
          availability: string;
          is_public: boolean;
          created_at: string;
          updated_at: string;
          average_rating: number;
          total_ratings: number;
          total_swaps: number;
        };
        Insert: {
          id?: string;
          user_id: string;
          name?: string | null;
          location?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          skills_offered?: string[];
          skills_wanted?: string[];
          availability?: string;
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
          average_rating?: number;
          total_ratings?: number;
          total_swaps?: number;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string | null;
          location?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          skills_offered?: string[];
          skills_wanted?: string[];
          availability?: string;
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
          average_rating?: number;
          total_ratings?: number;
          total_swaps?: number;
        };
      };
      user_roles: {
        Row: {
          id: string;
          user_id: string;
          role: string;
          assigned_at: string;
          assigned_by: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          role?: string;
          assigned_at?: string;
          assigned_by?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          role?: string;
          assigned_at?: string;
          assigned_by?: string | null;
        };
      };
      swap_requests: {
        Row: {
          id: string;
          from_user_id: string;
          to_user_id: string;
          my_skill: string;
          their_skill: string;
          message: string | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          from_user_id: string;
          to_user_id: string;
          my_skill: string;
          their_skill: string;
          message?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          from_user_id?: string;
          to_user_id?: string;
          my_skill?: string;
          their_skill?: string;
          message?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      swap_ratings: {
        Row: {
          id: string;
          swap_request_id: string;
          rater_user_id: string;
          rated_user_id: string;
          rating: number;
          feedback: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          swap_request_id: string;
          rater_user_id: string;
          rated_user_id: string;
          rating: number;
          feedback?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          swap_request_id?: string;
          rater_user_id?: string;
          rated_user_id?: string;
          rating?: number;
          feedback?: string | null;
          created_at?: string;
        };
      };
      banned_users: {
        Row: {
          id: string;
          user_id: string;
          banned_by: string;
          reason: string | null;
          banned_at: string;
          expires_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          banned_by: string;
          reason?: string | null;
          banned_at?: string;
          expires_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          banned_by?: string;
          reason?: string | null;
          banned_at?: string;
          expires_at?: string | null;
        };
      };
      admin_actions: {
        Row: {
          id: string;
          admin_user_id: string;
          action_type: string;
          target_user_id: string | null;
          details: any;
          created_at: string;
        };
        Insert: {
          id?: string;
          admin_user_id: string;
          action_type: string;
          target_user_id?: string | null;
          details?: any;
          created_at?: string;
        };
        Update: {
          id?: string;
          admin_user_id?: string;
          action_type?: string;
          target_user_id?: string | null;
          details?: any;
          created_at?: string;
        };
      };
      announcements: {
        Row: {
          id: string;
          title: string;
          content: string;
          created_by: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          content: string;
          created_by: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          content?: string;
          created_by?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type SwapRequest = Database['public']['Tables']['swap_requests']['Row'];
export type SwapRating = Database['public']['Tables']['swap_ratings']['Row'];
export type UserRole = Database['public']['Tables']['user_roles']['Row'];
export type BannedUser = Database['public']['Tables']['banned_users']['Row'];
export type AdminAction = Database['public']['Tables']['admin_actions']['Row'];
export type Announcement = Database['public']['Tables']['announcements']['Row'];