-- Enable Realtime for Online Housie tables
-- Run this SQL in your Supabase SQL Editor

-- Enable realtime on games table (for game status and called_numbers updates)
ALTER PUBLICATION supabase_realtime ADD TABLE games;

-- Enable realtime on players table (for player ready status and tickets_selected updates)
ALTER PUBLICATION supabase_realtime ADD TABLE players;

-- Enable realtime on prizes table (for prize claim updates)
ALTER PUBLICATION supabase_realtime ADD TABLE prizes;

-- Enable realtime on claim_requests table (for claim request submissions and approvals)
ALTER PUBLICATION supabase_realtime ADD TABLE claim_requests;

-- Enable realtime on tickets table (optional - for ticket selection updates)
ALTER PUBLICATION supabase_realtime ADD TABLE tickets;

-- Verify realtime is enabled
SELECT schemaname, tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;
