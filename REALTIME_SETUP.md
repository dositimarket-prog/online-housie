# Supabase Realtime Setup

## Issue
The app requires manual page refreshes to see updates because Supabase Realtime is not enabled on the database tables.

## What is Realtime?
Supabase Realtime allows your app to receive instant updates when data changes in the database, without needing to refresh the page. This is essential for:
- Players seeing when others join the lobby
- Players seeing when the host calls a new number
- Host seeing when players submit prize claims
- Everyone seeing when prizes are claimed

## Solution

### Option 1: Enable via SQL (Recommended)
1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Run the SQL file: `supabase-enable-realtime.sql`
4. This will enable realtime on all necessary tables:
   - `games` - for game status and called numbers
   - `players` - for player ready status and ticket selection
   - `prizes` - for prize claims
   - `claim_requests` - for claim submissions and approvals
   - `tickets` - for ticket selection updates

### Option 2: Enable via Dashboard
1. Open your Supabase project dashboard
2. Go to **Database** → **Replication**
3. Find each of these tables and toggle **Enable Realtime**:
   - `games`
   - `players`
   - `prizes`
   - `claim_requests`
   - `tickets`

## Verification

After enabling realtime, you can verify it's working by:

1. **Test in Lobby:**
   - Open the lobby in two browser windows (or one normal + one incognito)
   - Join as a player in one window
   - The other window should immediately show the new player without refreshing

2. **Test in Game:**
   - Have host call a number
   - Players should see the number appear immediately
   - Have a player submit a claim
   - Host should see the claim appear immediately

3. **Check Browser Console:**
   - Open browser DevTools (F12)
   - Go to Console tab
   - Look for messages like:
     ```
     [ClaimRequests] Subscription status: SUBSCRIBED
     [ClaimRequests] Change detected: ...
     ```
   - These indicate successful realtime connections

## Troubleshooting

If realtime still doesn't work after enabling:

1. **Check RLS Policies:**
   - Ensure Row Level Security policies allow reads for the tables
   - The app uses anonymous access, so policies should allow public reads

2. **Check Supabase Project Status:**
   - Go to your Supabase dashboard
   - Check if the project is paused or has any issues

3. **Clear Browser Cache:**
   - Sometimes cached connections can cause issues
   - Try a hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

4. **Check Browser Console for Errors:**
   - Look for WebSocket connection errors
   - Look for Supabase subscription errors

## Technical Details

The app uses Supabase's real-time subscriptions via channels:
- `players-{gameId}` - listens to all player changes
- `game-{gameId}` - listens to game status updates
- `game-updates-{gameId}` - listens to called numbers updates
- `prizes-{gameId}` - listens to prize claim updates
- `claim-requests-{gameId}` - listens to claim request changes

These are configured in:
- `src/services/lobbyService.js` - lobby subscriptions
- `src/services/gamePlayService.js` - game subscriptions
