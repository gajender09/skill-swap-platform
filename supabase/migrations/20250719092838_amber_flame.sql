/*
  # Complete SkillSwap Platform Database Schema

  1. New Tables
    - `users` - User authentication data
    - `profiles` - User profile information
    - `user_roles` - User role management (admin, moderator, user)
    - `skill_categories` - Skill categorization system
    - `swap_requests` - Skill exchange requests
    - `swap_ratings` - Rating and feedback system
    - `messages` - Direct messaging between users
    - `notifications` - User notification system
    - `banned_users` - User moderation system
    - `admin_actions` - Admin activity logging
    - `announcements` - Platform announcements
    - `user_sessions` - Session tracking
    - `skill_endorsements` - Skill validation system

  2. Security
    - Enable RLS on all tables
    - Add comprehensive policies for data access
    - Implement proper foreign key constraints

  3. Functions & Triggers
    - Auto-create profile on user signup
    - Update rating calculations
    - Notification triggers
    - Session management
*/

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create updated_at function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Users table (extends auth.users)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_seen timestamptz DEFAULT now(),
  is_active boolean DEFAULT true
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own data"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own data"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Skill categories table
CREATE TABLE IF NOT EXISTS skill_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  icon text,
  color text DEFAULT '#3B82F6',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE skill_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active categories"
  ON skill_categories FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Insert default skill categories
INSERT INTO skill_categories (name, description, icon, color) VALUES
('Technology', 'Programming, web development, software engineering', '💻', '#3B82F6'),
('Design', 'UI/UX, graphic design, visual arts', '🎨', '#8B5CF6'),
('Business', 'Marketing, sales, entrepreneurship', '💼', '#10B981'),
('Languages', 'Foreign languages, communication', '🗣️', '#F59E0B'),
('Creative', 'Music, writing, photography', '🎭', '#EF4444'),
('Health', 'Fitness, nutrition, wellness', '🏃', '#06B6D4'),
('Education', 'Teaching, tutoring, training', '📚', '#84CC16'),
('Crafts', 'DIY, woodworking, crafting', '🔨', '#F97316')
ON CONFLICT (name) DO NOTHING;

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  username text UNIQUE,
  bio text,
  location text,
  avatar_url text,
  cover_url text,
  website text,
  linkedin_url text,
  github_url text,
  twitter_url text,
  skills_offered text[] DEFAULT '{}',
  skills_wanted text[] DEFAULT '{}',
  availability text DEFAULT 'flexible',
  timezone text DEFAULT 'UTC',
  languages text[] DEFAULT '{}',
  experience_level text DEFAULT 'intermediate',
  is_public boolean DEFAULT true,
  is_verified boolean DEFAULT false,
  is_mentor boolean DEFAULT false,
  hourly_rate numeric(10,2),
  currency text DEFAULT 'USD',
  total_swaps integer DEFAULT 0,
  total_ratings integer DEFAULT 0,
  average_rating numeric(3,2) DEFAULT 0.00,
  response_rate numeric(3,2) DEFAULT 0.00,
  response_time_hours integer DEFAULT 24,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  TO authenticated
  USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- User roles table
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'user',
  assigned_at timestamptz DEFAULT now(),
  assigned_by uuid REFERENCES users(id),
  expires_at timestamptz,
  is_active boolean DEFAULT true,
  UNIQUE(user_id, role)
);

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own roles"
  ON user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admin function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_uuid uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = user_uuid 
    AND role = 'admin' 
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > now())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE POLICY "Admins can manage all roles"
  ON user_roles FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()));

-- Swap requests table
CREATE TABLE IF NOT EXISTS swap_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  my_skill text NOT NULL,
  their_skill text NOT NULL,
  message text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'completed', 'cancelled')),
  proposed_duration text,
  proposed_format text DEFAULT 'online' CHECK (proposed_format IN ('online', 'in-person', 'hybrid')),
  proposed_schedule jsonb,
  priority text DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  expires_at timestamptz DEFAULT (now() + interval '30 days'),
  accepted_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE swap_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own requests"
  ON swap_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

CREATE POLICY "Users can create requests"
  ON swap_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Users can update requests they received"
  ON swap_requests FOR UPDATE
  TO authenticated
  USING (auth.uid() = to_user_id OR auth.uid() = from_user_id);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  swap_request_id uuid REFERENCES swap_requests(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content text NOT NULL,
  message_type text DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
  file_url text,
  file_name text,
  file_size integer,
  is_read boolean DEFAULT false,
  read_at timestamptz,
  is_deleted boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own messages"
  ON messages FOR SELECT
  TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their received messages"
  ON messages FOR UPDATE
  TO authenticated
  USING (auth.uid() = receiver_id);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL CHECK (type IN ('swap_request', 'swap_accepted', 'swap_rejected', 'swap_completed', 'message', 'rating', 'system', 'announcement')),
  data jsonb,
  is_read boolean DEFAULT false,
  read_at timestamptz,
  action_url text,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Swap ratings table
CREATE TABLE IF NOT EXISTS swap_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  swap_request_id uuid NOT NULL REFERENCES swap_requests(id) ON DELETE CASCADE,
  rater_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rated_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback text,
  skills_rating jsonb, -- {"communication": 5, "expertise": 4, "reliability": 5}
  would_recommend boolean DEFAULT true,
  is_public boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(swap_request_id, rater_user_id)
);

ALTER TABLE swap_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view public ratings"
  ON swap_ratings FOR SELECT
  TO authenticated
  USING (is_public = true OR auth.uid() = rater_user_id OR auth.uid() = rated_user_id);

CREATE POLICY "Users can create ratings for their completed swaps"
  ON swap_ratings FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = rater_user_id AND
    EXISTS (
      SELECT 1 FROM swap_requests sr
      WHERE sr.id = swap_ratings.swap_request_id
      AND sr.status = 'completed'
      AND (sr.from_user_id = auth.uid() OR sr.to_user_id = auth.uid())
    )
  );

-- Skill endorsements table
CREATE TABLE IF NOT EXISTS skill_endorsements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  endorser_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endorsed_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill text NOT NULL,
  message text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(endorser_id, endorsed_id, skill)
);

ALTER TABLE skill_endorsements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view endorsements"
  ON skill_endorsements FOR SELECT
  TO authenticated;

CREATE POLICY "Users can create endorsements"
  ON skill_endorsements FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = endorser_id AND endorser_id != endorsed_id);

-- Banned users table
CREATE TABLE IF NOT EXISTS banned_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  banned_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason text,
  ban_type text DEFAULT 'temporary' CHECK (ban_type IN ('temporary', 'permanent')),
  banned_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  is_active boolean DEFAULT true
);

ALTER TABLE banned_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage banned users"
  ON banned_users FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()));

-- Admin actions table
CREATE TABLE IF NOT EXISTS admin_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action_type text NOT NULL CHECK (action_type IN ('ban_user', 'unban_user', 'verify_user', 'reject_skill', 'moderate_content', 'send_announcement', 'delete_content')),
  target_user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  target_content_id uuid,
  details jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all admin actions"
  ON admin_actions FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can create admin actions"
  ON admin_actions FOR INSERT
  TO authenticated
  WITH CHECK (is_admin(auth.uid()));

-- Announcements table
CREATE TABLE IF NOT EXISTS announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  type text DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'error')),
  priority text DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'critical')),
  target_audience text DEFAULT 'all' CHECK (target_audience IN ('all', 'users', 'mentors', 'admins')),
  created_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_active boolean DEFAULT true,
  is_pinned boolean DEFAULT false,
  starts_at timestamptz DEFAULT now(),
  ends_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view active announcements"
  ON announcements FOR SELECT
  TO authenticated
  USING (is_active = true AND (starts_at IS NULL OR starts_at <= now()) AND (ends_at IS NULL OR ends_at > now()));

CREATE POLICY "Admins can manage announcements"
  ON announcements FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()));

-- User sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_token text UNIQUE NOT NULL,
  ip_address inet,
  user_agent text,
  device_info jsonb,
  location_info jsonb,
  is_active boolean DEFAULT true,
  last_activity timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sessions"
  ON user_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_is_public ON profiles(is_public);
CREATE INDEX IF NOT EXISTS idx_profiles_skills_offered ON profiles USING GIN(skills_offered);
CREATE INDEX IF NOT EXISTS idx_profiles_skills_wanted ON profiles USING GIN(skills_wanted);
CREATE INDEX IF NOT EXISTS idx_swap_requests_from_user ON swap_requests(from_user_id);
CREATE INDEX IF NOT EXISTS idx_swap_requests_to_user ON swap_requests(to_user_id);
CREATE INDEX IF NOT EXISTS idx_swap_requests_status ON swap_requests(status);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_swap_request ON messages(swap_request_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_swap_ratings_rated_user ON swap_ratings(rated_user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_swap_requests_updated_at
  BEFORE UPDATE ON swap_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_announcements_updated_at
  BEFORE UPDATE ON announcements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO users (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to update profile rating
CREATE OR REPLACE FUNCTION update_profile_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles SET
    total_ratings = (
      SELECT COUNT(*) FROM swap_ratings 
      WHERE rated_user_id = NEW.rated_user_id
    ),
    average_rating = (
      SELECT ROUND(AVG(rating)::numeric, 2) FROM swap_ratings 
      WHERE rated_user_id = NEW.rated_user_id
    )
  WHERE user_id = NEW.rated_user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for rating updates
CREATE TRIGGER update_profile_rating_trigger
  AFTER INSERT ON swap_ratings
  FOR EACH ROW EXECUTE FUNCTION update_profile_rating();

-- Function to increment swap count
CREATE OR REPLACE FUNCTION increment_swap_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE profiles SET total_swaps = total_swaps + 1 
    WHERE user_id = NEW.from_user_id OR user_id = NEW.to_user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for swap completion
CREATE TRIGGER increment_swap_count_trigger
  AFTER UPDATE ON swap_requests
  FOR EACH ROW EXECUTE FUNCTION increment_swap_count();

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id uuid,
  p_title text,
  p_message text,
  p_type text,
  p_data jsonb DEFAULT NULL,
  p_action_url text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  notification_id uuid;
BEGIN
  INSERT INTO notifications (user_id, title, message, type, data, action_url)
  VALUES (p_user_id, p_title, p_message, p_type, p_data, p_action_url)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle swap request notifications
CREATE OR REPLACE FUNCTION handle_swap_request_notification()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM create_notification(
      NEW.to_user_id,
      'New Skill Swap Request',
      'You have received a new skill swap request',
      'swap_request',
      jsonb_build_object('swap_request_id', NEW.id),
      '/swaps'
    );
  ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    IF NEW.status = 'accepted' THEN
      PERFORM create_notification(
        NEW.from_user_id,
        'Swap Request Accepted',
        'Your skill swap request has been accepted',
        'swap_accepted',
        jsonb_build_object('swap_request_id', NEW.id),
        '/swaps'
      );
    ELSIF NEW.status = 'rejected' THEN
      PERFORM create_notification(
        NEW.from_user_id,
        'Swap Request Declined',
        'Your skill swap request has been declined',
        'swap_rejected',
        jsonb_build_object('swap_request_id', NEW.id),
        '/swaps'
      );
    ELSIF NEW.status = 'completed' THEN
      PERFORM create_notification(
        NEW.from_user_id,
        'Swap Completed',
        'Your skill swap has been completed. Please rate your experience!',
        'swap_completed',
        jsonb_build_object('swap_request_id', NEW.id),
        '/swaps'
      );
      PERFORM create_notification(
        NEW.to_user_id,
        'Swap Completed',
        'Your skill swap has been completed. Please rate your experience!',
        'swap_completed',
        jsonb_build_object('swap_request_id', NEW.id),
        '/swaps'
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for swap request notifications
CREATE TRIGGER swap_request_notification_trigger
  AFTER INSERT OR UPDATE ON swap_requests
  FOR EACH ROW EXECUTE FUNCTION handle_swap_request_notification();