/*
  # Create admin management tables

  1. New Tables
    - `banned_users` - Track banned users
    - `admin_actions` - Log admin actions
    - `announcements` - Platform announcements

  2. Security
    - Enable RLS on all tables
    - Add admin-only policies
*/

-- Banned users table
CREATE TABLE IF NOT EXISTS banned_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  banned_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason text,
  banned_at timestamptz DEFAULT now(),
  expires_at timestamptz
);

ALTER TABLE banned_users ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_banned_users_user_id ON banned_users(user_id);

CREATE POLICY "Admins can view all banned users"
  ON banned_users
  FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can manage banned users"
  ON banned_users
  FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()));

-- Admin actions log
CREATE TABLE IF NOT EXISTS admin_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action_type text NOT NULL CHECK (action_type IN ('ban_user', 'unban_user', 'reject_skill', 'moderate_content', 'send_announcement')),
  target_user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  details jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_admin_actions_admin_user_id ON admin_actions(admin_user_id);
CREATE INDEX idx_admin_actions_action_type ON admin_actions(action_type);

CREATE POLICY "Admins can view all admin actions"
  ON admin_actions
  FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can create admin actions"
  ON admin_actions
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin(auth.uid()));

-- Announcements table
CREATE TABLE IF NOT EXISTS announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  created_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_announcements_is_active ON announcements(is_active);

CREATE POLICY "Everyone can view active announcements"
  ON announcements
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage announcements"
  ON announcements
  FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()));