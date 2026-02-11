-- Add columns for detailed stats per time control
-- Run this in your Supabase SQL Editor

ALTER TABLE profiles
ADD COLUMN bullet_rating integer DEFAULT 1200,
ADD COLUMN blitz_rating integer DEFAULT 1200,
ADD COLUMN rapid_rating integer DEFAULT 1200,
ADD COLUMN classical_rating integer DEFAULT 1200,

ADD COLUMN bullet_wins integer DEFAULT 0,
ADD COLUMN bullet_losses integer DEFAULT 0,
ADD COLUMN bullet_draws integer DEFAULT 0,

ADD COLUMN blitz_wins integer DEFAULT 0,
ADD COLUMN blitz_losses integer DEFAULT 0,
ADD COLUMN blitz_draws integer DEFAULT 0,

ADD COLUMN rapid_wins integer DEFAULT 0,
ADD COLUMN rapid_losses integer DEFAULT 0,
ADD COLUMN rapid_draws integer DEFAULT 0,

ADD COLUMN classical_wins integer DEFAULT 0,
ADD COLUMN classical_losses integer DEFAULT 0,
ADD COLUMN classical_draws integer DEFAULT 0;
