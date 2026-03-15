-- Add total_tickets column to games table
-- Run this SQL in your Supabase SQL Editor

ALTER TABLE games
  ADD COLUMN total_tickets INTEGER NOT NULL DEFAULT 20;

-- Add check constraint to ensure it's an even number and at least 2
ALTER TABLE games
  ADD CONSTRAINT total_tickets_even_check CHECK (total_tickets >= 2 AND total_tickets % 2 = 0);

COMMENT ON COLUMN games.total_tickets IS 'Total number of tickets to generate for this game (must be even, minimum 2)';
