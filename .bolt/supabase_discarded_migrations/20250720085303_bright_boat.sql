/*
  # Initial Schema Setup

  1. New Tables
    - `users` - Core user authentication data
    - `profiles` - Extended user profile information
    - `user_roles` - User role management
    - `swap_requests` - Skill exchange requests
    - `swap_ratings` - Rating system for completed swaps
    - `banned_users` - User moderation
    - `admin_actions` - Admin activity logging
    - `announcements` - Platform announcements

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Create admin helper functions

  3. Functions & Triggers
    - Auto-create user records on auth signup
    - Update timestamps automatically
    - Calculate ratings and swap counts
*/

-- Create users table that syncs with auth.users
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  location text,
  avatar_url text,
  bio text,
  skills_offered text[] DEFAULT '{}',
  skills_wanted text[] DEFAULT '{}',
  availability text DEFAULT 'flexible',
  is_public boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  average_rating numeric(3,2) DEFAULT 0.00,
  total_ratings integer DEFAULT 0,
  total_swaps integer DEFAULT 0
);

-- Create user_roles table
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator')),
  assigned_at timestamptz DEFAULT now(),
  assigned_by uuid REFERENCES users(id),
  UNIQUE(user_id, role)
);

-- Create swap_requests table
CREATE TABLE IF NOT EXISTS swap_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  my_skill text NOT NULL,
  their_skill text NOT NULL,
  message text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create swap_ratings table
CREATE TABLE IF NOT EXISTS swap_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  swap_request_id uuid NOT NULL REFERENCES swap_requests(id) ON DELETE CASCADE,
  rater_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rated_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(swap_request_id, rater_user_id)
);

-- Create banned_users table
CREATE TABLE IF NOT EXISTS banned_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  banned_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason text,
  banned_at timestamptz DEFAULT now(),
  expires_at timestamptz
);

-- Create admin_actions table
CREATE TABLE IF NOT EXISTS admin_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action_type text NOT NULL CHECK (action_type IN ('ban_user', 'unban_user', 'reject_skill', 'moderate_content', 'send_announcement')),
  target_user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  details jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create announcements table
CREATE TABLE IF NOT EXISTS announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  created_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);
CREATE INDEX IF NOT EXISTS idx_swap_ratings_rated_user_id ON swap_ratings(rated_user_id);
CREATE INDEX IF NOT EXISTS idx_swap_ratings_swap_request_id ON swap_ratings(swap_request_id);
CREATE INDEX IF NOT EXISTS idx_banned_users_user_id ON banned_users(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_admin_user_id ON admin_actions(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_action_type ON admin_actions(action_type);
CREATE INDEX IF NOT EXISTS idx_announcements_is_active ON announcements(is_active);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_swap_requests_updated_at BEFORE UPDATE ON swap_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON announcements FOR EACH ROW EXECUTE FUNCTION update_announcements_updated_at_column();

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO users (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Trigger to automatically create user record on auth signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_uuid uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = user_uuid AND role = 'admin'
  );
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Function to increment swap count
CREATE OR REPLACE FUNCTION increment_swap_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'accepted' AND OLD.status != 'accepted' THEN
    UPDATE profiles 
    SET total_swaps = total_swaps + 1 
    WHERE user_id = NEW.from_user_id OR user_id = NEW.to_user_id;
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for swap count
CREATE TRIGGER increment_swap_count_trigger
  AFTER UPDATE ON swap_requests
  FOR EACH ROW EXECUTE FUNCTION increment_swap_count();

-- Function to update profile rating
CREATE OR REPLACE FUNCTION update_profile_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles 
  SET 
    total_ratings = (SELECT COUNT(*) FROM swap_ratings WHERE rated_user_id = NEW.rated_user_id),
    average_rating = (SELECT AVG(rating) FROM swap_ratings WHERE rated_user_id = NEW.rated_user_id)
  WHERE user_id = NEW.rated_user_id;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for rating updates
CREATE TRIGGER update_profile_rating_trigger
  AFTER INSERT ON swap_ratings
  FOR EACH ROW EXECUTE FUNCTION update_profile_rating();

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE swap_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE swap_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE banned_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can insert their own data" ON users FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own data" ON users FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can view their own data" ON users FOR SELECT TO authenticated USING (auth.uid() = id);

-- Profiles policies
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT TO authenticated USING (is_public = true OR auth.uid() = user_id);

-- User roles policies
CREATE POLICY "Users can view their own roles" ON user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all roles" ON user_roles FOR ALL TO authenticated USING (is_admin(auth.uid()));

-- Swap requests policies
CREATE POLICY "Users can create requests" ON swap_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = from_user_id);
CREATE POLICY "Users can view their own requests" ON swap_requests FOR SELECT TO authenticated USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);
CREATE POLICY "Users can update requests they received" ON swap_requests FOR UPDATE TO authenticated USING (auth.uid() = to_user_id);

-- Swap ratings policies
CREATE POLICY "Users can view ratings for their swaps" ON swap_ratings FOR SELECT TO authenticated USING (auth.uid() = rater_user_id OR auth.uid() = rated_user_id);
CREATE POLICY "Users can create ratings for their completed swaps" ON swap_ratings FOR INSERT TO authenticated WITH CHECK (
  auth.uid() = rater_user_id AND 
  EXISTS (
    SELECT 1 FROM swap_requests sr 
    WHERE sr.id = swap_request_id 
    AND sr.status = 'accepted' 
    AND (sr.from_user_id = auth.uid() OR sr.to_user_id = auth.uid())
  )
);

-- Banned users policies
CREATE POLICY "Admins can view all banned users" ON banned_users FOR SELECT TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Admins can manage banned users" ON banned_users FOR ALL TO authenticated USING (is_admin(auth.uid()));

-- Admin actions policies
CREATE POLICY "Admins can view all admin actions" ON admin_actions FOR SELECT TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Admins can create admin actions" ON admin_actions FOR INSERT TO authenticated WITH CHECK (is_admin(auth.uid()));

-- Announcements policies
CREATE POLICY "Everyone can view active announcements" ON announcements FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY "Admins can manage announcements" ON announcements FOR ALL TO authenticated USING (is_admin(auth.uid()));