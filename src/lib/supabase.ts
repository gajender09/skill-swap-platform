import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types
export interface Profile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
  skills_offered: string[];
  skills_wanted: string[];
  availability: string;
  is_public: boolean;
  rating_avg: number;
  rating_count: number;
  swap_count: number;
  created_at: string;
  updated_at: string;
}

export interface SwapRequest {
  id: string;
  from_user_id: string;
  to_user_id: string;
  my_skill: string;
  their_skill: string;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  swap_request_id?: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface Rating {
  id: string;
  swap_request_id: string;
  rater_id: string;
  rated_id: string;
  rating: number;
  feedback?: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  is_read: boolean;
  action_url?: string;
  created_at: string;
}

// Helper functions
export const getAvatarUrl = (profile: Profile) => {
  return profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=3b82f6&color=white`;
};

export const getStatusColor = (status: SwapRequest['status']) => {
  switch (status) {
    case 'pending': return 'badge-warning';
    case 'accepted': return 'badge-success';
    case 'rejected': return 'badge-error';
    case 'completed': return 'badge-success';
    case 'cancelled': return 'badge-error';
    default: return 'badge-primary';
  }
};