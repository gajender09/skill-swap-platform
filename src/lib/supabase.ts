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
          name: string;
          location: string | null;
          avatar_url: string | null;
          bio: string | null;
          skills_offered: string[];
          skills_wanted: string[];
          availability: string;
          is_public: boolean;
          average_rating: number;
          total_ratings: number;
          total_swaps: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          location?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          skills_offered?: string[];
          skills_wanted?: string[];
          availability?: string;
          is_public?: boolean;
          average_rating?: number;
          total_ratings?: number;
          total_swaps?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          location?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          skills_offered?: string[];
          skills_wanted?: string[];
          availability?: string;
          is_public?: boolean;
          average_rating?: number;
          total_ratings?: number;
          total_swaps?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      skill_categories: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          icon: string | null;
          color: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          icon?: string | null;
          color?: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          icon?: string | null;
          color?: string;
          is_active?: boolean;
          created_at?: string;
        };
      };
      user_roles: {
        Row: {
          id: string;
          user_id: string;
          role: string;
          assigned_at: string;
          assigned_by: string | null;
          expires_at: string | null;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          user_id: string;
          role?: string;
          assigned_at?: string;
          assigned_by?: string | null;
          expires_at?: string | null;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          user_id?: string;
          role?: string;
          assigned_at?: string;
          assigned_by?: string | null;
          expires_at?: string | null;
          is_active?: boolean;
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
          proposed_duration: string | null;
          proposed_format: string;
          proposed_schedule: any;
          priority: string;
          expires_at: string;
          accepted_at: string | null;
          completed_at: string | null;
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
          proposed_duration?: string | null;
          proposed_format?: string;
          proposed_schedule?: any;
          priority?: string;
          expires_at?: string;
          accepted_at?: string | null;
          completed_at?: string | null;
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
          proposed_duration?: string | null;
          proposed_format?: string;
          proposed_schedule?: any;
          priority?: string;
          expires_at?: string;
          accepted_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          swap_request_id: string | null;
          sender_id: string;
          receiver_id: string;
          content: string;
          message_type: string;
          file_url: string | null;
          file_name: string | null;
          file_size: number | null;
          is_read: boolean;
          read_at: string | null;
          is_deleted: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          swap_request_id?: string | null;
          sender_id: string;
          receiver_id: string;
          content: string;
          message_type?: string;
          file_url?: string | null;
          file_name?: string | null;
          file_size?: number | null;
          is_read?: boolean;
          read_at?: string | null;
          is_deleted?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          swap_request_id?: string | null;
          sender_id?: string;
          receiver_id?: string;
          content?: string;
          message_type?: string;
          file_url?: string | null;
          file_name?: string | null;
          file_size?: number | null;
          is_read?: boolean;
          read_at?: string | null;
          is_deleted?: boolean;
          created_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          message: string;
          type: string;
          data: any;
          is_read: boolean;
          read_at: string | null;
          action_url: string | null;
          expires_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          message: string;
          type: string;
          data?: any;
          is_read?: boolean;
          read_at?: string | null;
          action_url?: string | null;
          expires_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          message?: string;
          type?: string;
          data?: any;
          is_read?: boolean;
          read_at?: string | null;
          action_url?: string | null;
          expires_at?: string | null;
          created_at?: string;
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
          skills_rating: any;
          would_recommend: boolean;
          is_public: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          swap_request_id: string;
          rater_user_id: string;
          rated_user_id: string;
          rating: number;
          feedback?: string | null;
          skills_rating?: any;
          would_recommend?: boolean;
          is_public?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          swap_request_id?: string;
          rater_user_id?: string;
          rated_user_id?: string;
          rating?: number;
          feedback?: string | null;
          skills_rating?: any;
          would_recommend?: boolean;
          is_public?: boolean;
          created_at?: string;
        };
      };
      skill_endorsements: {
        Row: {
          id: string;
          endorser_id: string;
          endorsed_id: string;
          skill: string;
          message: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          endorser_id: string;
          endorsed_id: string;
          skill: string;
          message?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          endorser_id?: string;
          endorsed_id?: string;
          skill?: string;
          message?: string | null;
          created_at?: string;
        };
      };
      banned_users: {
        Row: {
          id: string;
          user_id: string;
          banned_by: string;
          reason: string | null;
          ban_type: string;
          banned_at: string;
          expires_at: string | null;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          user_id: string;
          banned_by: string;
          reason?: string | null;
          ban_type?: string;
          banned_at?: string;
          expires_at?: string | null;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          user_id?: string;
          banned_by?: string;
          reason?: string | null;
          ban_type?: string;
          banned_at?: string;
          expires_at?: string | null;
          is_active?: boolean;
        };
      };
      admin_actions: {
        Row: {
          id: string;
          admin_user_id: string;
          action_type: string;
          target_user_id: string | null;
          target_content_id: string | null;
          details: any;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          admin_user_id: string;
          action_type: string;
          target_user_id?: string | null;
          target_content_id?: string | null;
          details?: any;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          admin_user_id?: string;
          action_type?: string;
          target_user_id?: string | null;
          target_content_id?: string | null;
          details?: any;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
      };
      announcements: {
        Row: {
          id: string;
          title: string;
          content: string;
          type: string;
          priority: string;
          target_audience: string;
          created_by: string;
          is_active: boolean;
          is_pinned: boolean;
          starts_at: string;
          ends_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          content: string;
          type?: string;
          priority?: string;
          target_audience?: string;
          created_by: string;
          is_active?: boolean;
          is_pinned?: boolean;
          starts_at?: string;
          ends_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          content?: string;
          type?: string;
          priority?: string;
          target_audience?: string;
          created_by?: string;
          is_active?: boolean;
          is_pinned?: boolean;
          starts_at?: string;
          ends_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_sessions: {
        Row: {
          id: string;
          user_id: string;
          session_token: string;
          ip_address: string | null;
          user_agent: string | null;
          device_info: any;
          location_info: any;
          is_active: boolean;
          last_activity: string;
          expires_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          session_token: string;
          ip_address?: string | null;
          user_agent?: string | null;
          device_info?: any;
          location_info?: any;
          is_active?: boolean;
          last_activity?: string;
          expires_at: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          session_token?: string;
          ip_address?: string | null;
          user_agent?: string | null;
          device_info?: any;
          location_info?: any;
          is_active?: boolean;
          last_activity?: string;
          expires_at?: string;
          created_at?: string;
        };
      };
    };
    Functions: {
      is_admin: {
        Args: { user_uuid: string };
        Returns: boolean;
      };
      create_notification: {
        Args: {
          p_user_id: string;
          p_title: string;
          p_message: string;
          p_type: string;
          p_data?: any;
          p_action_url?: string;
        };
        Returns: string;
      };
    };
  };
}

// Export types for easier use
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type SwapRequest = Database['public']['Tables']['swap_requests']['Row'];
export type SwapRating = Database['public']['Tables']['swap_ratings']['Row'];
export type UserRole = Database['public']['Tables']['user_roles']['Row'];
export type BannedUser = Database['public']['Tables']['banned_users']['Row'];
export type AdminAction = Database['public']['Tables']['admin_actions']['Row'];
export type Announcement = Database['public']['Tables']['announcements']['Row'];
export type Message = Database['public']['Tables']['messages']['Row'];
export type Notification = Database['public']['Tables']['notifications']['Row'];
export type SkillCategory = Database['public']['Tables']['skill_categories']['Row'];
export type SkillEndorsement = Database['public']['Tables']['skill_endorsements']['Row'];
export type UserSession = Database['public']['Tables']['user_sessions']['Row'];

// Helper functions for common operations
export const profileHelpers = {
  getFullName: (profile: Profile) => profile.name,
  getDisplayName: (profile: Profile) => profile.username || profile.name,
  getAvatarUrl: (profile: Profile) => 
    profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=3b82f6&color=white`,
  isVerified: (profile: Profile) => profile.is_verified,
  isMentor: (profile: Profile) => profile.is_mentor,
  getSkillsCount: (profile: Profile) => ({
    offered: profile.skills_offered?.length || 0,
    wanted: profile.skills_wanted?.length || 0
  }),
  getRatingDisplay: (profile: Profile) => ({
    average: profile.average_rating || 0,
    total: profile.total_ratings || 0,
    display: profile.average_rating > 0 ? profile.average_rating.toFixed(1) : '--'
  })
};

export const swapHelpers = {
  getStatusColor: (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'accepted': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      case 'cancelled': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  },
  getPriorityColor: (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'normal': return 'bg-blue-100 text-blue-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  },
  isExpired: (swap: SwapRequest) => new Date(swap.expires_at) < new Date(),
  canRate: (swap: SwapRequest) => swap.status === 'completed',
  canCancel: (swap: SwapRequest, userId: string) => 
    swap.status === 'pending' && swap.from_user_id === userId,
  canAccept: (swap: SwapRequest, userId: string) => 
    swap.status === 'pending' && swap.to_user_id === userId
};

export const notificationHelpers = {
  getTypeIcon: (type: string) => {
    switch (type) {
      case 'swap_request': return '🤝';
      case 'swap_accepted': return '✅';
      case 'swap_rejected': return '❌';
      case 'swap_completed': return '🎉';
      case 'message': return '💬';
      case 'rating': return '⭐';
      case 'system': return '🔔';
      case 'announcement': return '📢';
      default: return '📬';
    }
  },
  getTypeColor: (type: string) => {
    switch (type) {
      case 'swap_request': return 'bg-blue-100 text-blue-800';
      case 'swap_accepted': return 'bg-green-100 text-green-800';
      case 'swap_rejected': return 'bg-red-100 text-red-800';
      case 'swap_completed': return 'bg-purple-100 text-purple-800';
      case 'message': return 'bg-indigo-100 text-indigo-800';
      case 'rating': return 'bg-yellow-100 text-yellow-800';
      case 'system': return 'bg-gray-100 text-gray-800';
      case 'announcement': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
};