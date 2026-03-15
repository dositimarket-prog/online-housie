-- Fix Row Level Security (RLS) policies for Realtime to work
-- Run this SQL in your Supabase SQL Editor

-- First, check current RLS status
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('games', 'players', 'prizes', 'claim_requests', 'tickets')
ORDER BY tablename;

-- Enable RLS on all tables (if not already enabled)
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE prizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE claim_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- Create permissive policies to allow anonymous reads for realtime
-- (These are needed for realtime subscriptions to work)

-- Games: Allow all reads
DROP POLICY IF EXISTS "Allow public read access" ON games;
CREATE POLICY "Allow public read access" ON games
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert" ON games;
CREATE POLICY "Allow public insert" ON games
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update" ON games;
CREATE POLICY "Allow public update" ON games
  FOR UPDATE USING (true);

-- Players: Allow all reads
DROP POLICY IF EXISTS "Allow public read access" ON players;
CREATE POLICY "Allow public read access" ON players
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert" ON players;
CREATE POLICY "Allow public insert" ON players
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update" ON players;
CREATE POLICY "Allow public update" ON players
  FOR UPDATE USING (true);

-- Prizes: Allow all reads
DROP POLICY IF EXISTS "Allow public read access" ON prizes;
CREATE POLICY "Allow public read access" ON prizes
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert" ON prizes;
CREATE POLICY "Allow public insert" ON prizes
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update" ON prizes;
CREATE POLICY "Allow public update" ON prizes
  FOR UPDATE USING (true);

-- Claim Requests: Allow all reads
DROP POLICY IF EXISTS "Allow public read access" ON claim_requests;
CREATE POLICY "Allow public read access" ON claim_requests
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert" ON claim_requests;
CREATE POLICY "Allow public insert" ON claim_requests
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update" ON claim_requests;
CREATE POLICY "Allow public update" ON claim_requests
  FOR UPDATE USING (true);

-- Tickets: Allow all reads
DROP POLICY IF EXISTS "Allow public read access" ON tickets;
CREATE POLICY "Allow public read access" ON tickets
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert" ON tickets;
CREATE POLICY "Allow public insert" ON tickets
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update" ON tickets;
CREATE POLICY "Allow public update" ON tickets
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public delete" ON tickets;
CREATE POLICY "Allow public delete" ON tickets
  FOR DELETE USING (true);

-- Verify policies are created
SELECT schemaname, tablename, policyname, permissive, cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('games', 'players', 'prizes', 'claim_requests', 'tickets')
ORDER BY tablename, policyname;
