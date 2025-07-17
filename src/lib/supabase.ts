import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Profile {
  id: string;
  name: string;
  location?: string;
  avatar_url?: string;
  bio?: string;
  availability: string[];
  is_public: boolean;
  is_banned: boolean;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

export interface Skill {
  id: string;
  name: string;
  category: string;
  is_approved: boolean;
  created_at: string;
}

export interface UserSkillOffered {
  id: string;
  user_id: string;
  skill_id: string;
  proficiency_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  description?: string;
  created_at: string;
  skill?: Skill;
}

export interface UserSkillWanted {
  id: string;
  user_id: string;
  skill_id: string;
  urgency_level: 'low' | 'medium' | 'high';
  description?: string;
  created_at: string;
  skill?: Skill;
}

export interface SwapRequest {
  id: string;
  requester_id: string;
  provider_id: string;
  offered_skill_id: string;
  requested_skill_id: string;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
  requester?: Profile;
  provider?: Profile;
  offered_skill?: Skill;
  requested_skill?: Skill;
}

export interface Rating {
  id: string;
  swap_request_id: string;
  rater_id: string;
  rated_id: string;
  rating: number;
  feedback?: string;
  created_at: string;
  rater?: Profile;
  rated?: Profile;
}

export interface AdminMessage {
  id: string;
  admin_id: string;
  title: string;
  message: string;
  is_active: boolean;
  created_at: string;
  admin?: Profile;
}