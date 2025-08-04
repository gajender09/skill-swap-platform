/*
  # Initial Schema for SkillSwap Platform

  1. New Tables
    - `profiles` - User profiles with skills and preferences
    - `swap_requests` - Skill exchange requests between users
    - `messages` - Communication between users
    - `ratings` - User ratings and feedback
    - `notifications` - System notifications

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Secure data access patterns
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  avatar_url text,
  bio text,
  location text,
  skills_offered text[] DEFAULT '{}',
  skills_wanted text[] DEFAULT '{}',
  availability text DEFAULT 'flexible',
  is_public boolean DEFAULT true,
  rating_avg decimal(3,2) DEFAULT 0.00,
  rating_count integer DEFAULT 0,
  swap_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Create swap_requests table
CREATE TABLE IF NOT EXISTS swap_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  to_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  my_skill text NOT NULL,
  their_skill text NOT NULL,
  message text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'completed', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  swap_request_id uuid REFERENCES swap_requests(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  receiver_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create ratings table
CREATE TABLE IF NOT EXISTS ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  swap_request_id uuid REFERENCES swap_requests(id) ON DELETE CASCADE NOT NULL,
  rater_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rated_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rating integer CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  feedback text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(swap_request_id, rater_id)
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  is_read boolean DEFAULT false,
  action_url text,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE swap_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view public profiles" ON profiles
  FOR SELECT USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Swap requests policies
CREATE POLICY "Users can view own swap requests" ON swap_requests
  FOR SELECT USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

CREATE POLICY "Users can create swap requests" ON swap_requests
  FOR INSERT WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Users can update received requests" ON swap_requests
  FOR UPDATE USING (auth.uid() = to_user_id OR auth.uid() = from_user_id);

-- Messages policies
CREATE POLICY "Users can view own messages" ON messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages" ON messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update own messages" ON messages
  FOR UPDATE USING (auth.uid() = receiver_id);

-- Ratings policies
CREATE POLICY "Users can view ratings for public profiles" ON ratings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = ratings.rated_id 
      AND profiles.is_public = true
    )
  );

CREATE POLICY "Users can create ratings" ON ratings
  FOR INSERT WITH CHECK (auth.uid() = rater_id);

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Functions and triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_swap_requests_updated_at 
  BEFORE UPDATE ON swap_requests 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update user ratings
CREATE OR REPLACE FUNCTION update_user_rating()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the rated user's average rating and count
  UPDATE profiles SET
    rating_avg = (
      SELECT COALESCE(AVG(rating), 0)
      FROM ratings
      WHERE rated_id = NEW.rated_id
    ),
    rating_count = (
      SELECT COUNT(*)
      FROM ratings
      WHERE rated_id = NEW.rated_id
    )
  WHERE user_id = NEW.rated_id;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_rating_trigger
  AFTER INSERT ON ratings
  FOR EACH ROW EXECUTE FUNCTION update_user_rating();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (user_id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'New User'),
    NEW.email
  );
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_public ON profiles(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_swap_requests_users ON swap_requests(from_user_id, to_user_id);
CREATE INDEX IF NOT EXISTS idx_swap_requests_status ON swap_requests(status);
CREATE INDEX IF NOT EXISTS idx_messages_users ON messages(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_ratings_rated ON ratings(rated_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);