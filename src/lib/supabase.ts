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
  bio?: string;
  location?: string;
  skills_offered: string[];
  skills_wanted: string[];
  avatar_url?: string;
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
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  created_at: string;
  updated_at: string;
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

// Helper functions
export const getAvatarUrl = (profile: Profile) => {
  return profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=3b82f6&color=white`;
};

export const getStatusColor = (status: SwapRequest['status']) => {
  switch (status) {
    case 'pending': return 'text-yellow-600 bg-yellow-100';
    case 'accepted': return 'text-green-600 bg-green-100';
    case 'rejected': return 'text-red-600 bg-red-100';
    case 'completed': return 'text-blue-600 bg-blue-100';
    default: return 'text-gray-600 bg-gray-100';
  }
};