-- Housie Game Database Migration
-- Run this SQL in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Games Table
CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_code TEXT UNIQUE NOT NULL,
  host_name TEXT NOT NULL,
  game_title TEXT,
  tickets_per_player INTEGER NOT NULL DEFAULT 3,
  max_players INTEGER,
  status TEXT NOT NULL DEFAULT 'waiting', -- 'waiting', 'playing', 'finished'
  current_number INTEGER,
  called_numbers JSONB DEFAULT '[]'::jsonb, -- Array of {number, sequence, timestamp}
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE
);

-- Prizes Table
CREATE TABLE prizes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount TEXT,
  "order" INTEGER NOT NULL,
  claimed BOOLEAN DEFAULT FALSE,
  winner_player_id UUID,
  winner_name TEXT,
  claimed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Players Table
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  player_name TEXT NOT NULL,
  session_id TEXT NOT NULL,
  is_host BOOLEAN DEFAULT FALSE,
  is_ready BOOLEAN DEFAULT FALSE,
  tickets_selected INTEGER DEFAULT 0,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tickets Table
CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  ticket_number INTEGER NOT NULL,
  numbers JSONB NOT NULL, -- 3x9 grid as JSON array
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX idx_games_game_code ON games(game_code);
CREATE INDEX idx_games_status ON games(status);
CREATE INDEX idx_prizes_game_id ON prizes(game_id);
CREATE INDEX idx_players_game_id ON players(game_id);
CREATE INDEX idx_players_session_id ON players(session_id);
CREATE INDEX idx_tickets_game_id ON tickets(game_id);
CREATE INDEX idx_tickets_player_id ON tickets(player_id);

-- Enable Row Level Security (RLS)
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE prizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Allow all operations for now (guest access)
-- You can customize these later for more security

-- Games: Anyone can read, insert, and update
CREATE POLICY "Games are viewable by everyone" ON games
  FOR SELECT USING (true);

CREATE POLICY "Anyone can create games" ON games
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update games" ON games
  FOR UPDATE USING (true);

-- Prizes: Anyone can read and update
CREATE POLICY "Prizes are viewable by everyone" ON prizes
  FOR SELECT USING (true);

CREATE POLICY "Anyone can create prizes" ON prizes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update prizes" ON prizes
  FOR UPDATE USING (true);

-- Players: Anyone can read, insert, and update
CREATE POLICY "Players are viewable by everyone" ON players
  FOR SELECT USING (true);

CREATE POLICY "Anyone can join games" ON players
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update players" ON players
  FOR UPDATE USING (true);

-- Tickets: Anyone can read and insert
CREATE POLICY "Tickets are viewable by everyone" ON tickets
  FOR SELECT USING (true);

CREATE POLICY "Anyone can create tickets" ON tickets
  FOR INSERT WITH CHECK (true);

-- Enable Realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE games;
ALTER PUBLICATION supabase_realtime ADD TABLE prizes;
ALTER PUBLICATION supabase_realtime ADD TABLE players;
ALTER PUBLICATION supabase_realtime ADD TABLE tickets;
