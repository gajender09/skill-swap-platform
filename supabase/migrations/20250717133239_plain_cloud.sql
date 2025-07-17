/*
  # Create swap ratings table

  1. New Tables
    - `swap_ratings`
      - `id` (uuid, primary key)
      - `swap_request_id` (uuid, foreign key to swap_requests)
      - `rater_user_id` (uuid, foreign key to users)
      - `rated_user_id` (uuid, foreign key to users)
      - `rating` (integer, 1-5)
      - `feedback` (text, optional)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `swap_ratings` table
    - Add policies for rating management
*/

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

ALTER TABLE swap_ratings ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_swap_ratings_swap_request_id ON swap_ratings(swap_request_id);
CREATE INDEX idx_swap_ratings_rated_user_id ON swap_ratings(rated_user_id);

CREATE POLICY "Users can view ratings for their swaps"
  ON swap_ratings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = rater_user_id OR auth.uid() = rated_user_id);

CREATE POLICY "Users can create ratings for their completed swaps"
  ON swap_ratings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = rater_user_id AND
    EXISTS (
      SELECT 1 FROM swap_requests sr
      WHERE sr.id = swap_request_id 
      AND sr.status = 'accepted'
      AND (sr.from_user_id = auth.uid() OR sr.to_user_id = auth.uid())
    )
  );

-- Function to update profile rating when new rating is added
CREATE OR REPLACE FUNCTION update_profile_rating()
RETURNS trigger AS $$
BEGIN
  UPDATE profiles 
  SET 
    average_rating = (
      SELECT AVG(rating)::numeric(3,2) 
      FROM swap_ratings 
      WHERE rated_user_id = NEW.rated_user_id
    ),
    total_ratings = (
      SELECT COUNT(*) 
      FROM swap_ratings 
      WHERE rated_user_id = NEW.rated_user_id
    )
  WHERE user_id = NEW.rated_user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profile_rating_trigger
  AFTER INSERT ON swap_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_rating();