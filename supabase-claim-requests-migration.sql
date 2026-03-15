-- Add Claim Requests Table for Prize Claims
-- Run this SQL in your Supabase SQL Editor

-- Claim Requests Table
CREATE TABLE claim_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  prize_id UUID NOT NULL REFERENCES prizes(id) ON DELETE CASCADE,
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  verified_at TIMESTAMP WITH TIME ZONE
);

-- Add foreign key constraint for claimed_by in prizes table
ALTER TABLE prizes
  ADD COLUMN claimed_by UUID REFERENCES players(id),
  ADD COLUMN claimed_ticket_id UUID REFERENCES tickets(id);

-- Indexes for better performance
CREATE INDEX idx_claim_requests_game_id ON claim_requests(game_id);
CREATE INDEX idx_claim_requests_player_id ON claim_requests(player_id);
CREATE INDEX idx_claim_requests_prize_id ON claim_requests(prize_id);
CREATE INDEX idx_claim_requests_status ON claim_requests(status);

-- Enable Row Level Security
ALTER TABLE claim_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Claim requests are viewable by everyone" ON claim_requests
  FOR SELECT USING (true);

CREATE POLICY "Anyone can create claim requests" ON claim_requests
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update claim requests" ON claim_requests
  FOR UPDATE USING (true);

-- Enable Realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE claim_requests;
