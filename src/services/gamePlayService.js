import { supabase } from '../lib/supabase'
import { getSessionId } from '../utils/session'

/**
 * Fetch game data with prizes and tickets
 * @param {string} gameCode - Game code
 * @returns {Promise<Object>} Game data with prizes and all tickets
 */
export async function getGamePlayData(gameCode) {
  try {
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('*')
      .eq('game_code', gameCode)
      .single()

    if (gameError) throw gameError

    const { data: prizes, error: prizesError } = await supabase
      .from('prizes')
      .select('*')
      .eq('game_id', game.id)
      .order('order')

    if (prizesError) throw prizesError

    return {
      success: true,
      game: {
        ...game,
        prizes: prizes || []
      }
    }
  } catch (error) {
    console.error('Error fetching game play data:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Get current player's tickets
 * @param {string} gameId - Game ID
 * @returns {Promise<Object>} Player tickets
 */
export async function getMyTickets(gameId) {
  const sessionId = getSessionId()

  try {
    // First get player
    const { data: player, error: playerError } = await supabase
      .from('players')
      .select('*')
      .eq('game_id', gameId)
      .eq('session_id', sessionId)
      .single()

    if (playerError) throw playerError

    // Get player's tickets
    const { data: tickets, error: ticketsError } = await supabase
      .from('tickets')
      .select('*')
      .eq('player_id', player.id)
      .order('ticket_number')

    if (ticketsError) throw ticketsError

    return {
      success: true,
      player,
      tickets: tickets || []
    }
  } catch (error) {
    console.error('Error fetching my tickets:', error)
    return { success: false, error: error.message, tickets: [] }
  }
}

/**
 * Get all tickets for all players (host only)
 * @param {string} gameId - Game ID
 * @returns {Promise<Object>} All tickets grouped by player
 */
export async function getAllTickets(gameId) {
  try {
    // Get all tickets with player information
    const { data: tickets, error: ticketsError } = await supabase
      .from('tickets')
      .select(`
        *,
        player:players(id, player_name, is_host)
      `)
      .eq('game_id', gameId)
      .order('player_id')
      .order('ticket_number')

    if (ticketsError) throw ticketsError

    return {
      success: true,
      tickets: tickets || []
    }
  } catch (error) {
    console.error('Error fetching all tickets:', error)
    return { success: false, error: error.message, tickets: [] }
  }
}

/**
 * Call a number (host only)
 * @param {string} gameId - Game ID
 * @param {number} number - Number to call
 * @returns {Promise<Object>} Result
 */
export async function callNumber(gameId, number) {
  try {
    // Get current called numbers
    const { data: game, error: fetchError } = await supabase
      .from('games')
      .select('called_numbers')
      .eq('id', gameId)
      .single()

    if (fetchError) throw fetchError

    const calledNumbers = game.called_numbers || []

    // Check if number already called
    if (calledNumbers.includes(number)) {
      return { success: false, error: 'Number already called' }
    }

    // Add number to called numbers array
    const updatedNumbers = [...calledNumbers, number]

    const { error: updateError } = await supabase
      .from('games')
      .update({ called_numbers: updatedNumbers })
      .eq('id', gameId)

    if (updateError) throw updateError

    return { success: true }
  } catch (error) {
    console.error('Error calling number:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Submit a claim request for a prize (for host verification)
 * @param {string} gameId - Game ID
 * @param {string} playerId - Player ID
 * @param {string} prizeId - Prize ID
 * @param {string} ticketId - Ticket ID
 * @param {string} prizeType - Prize type (early5, top_line, middle_line, bottom_line, full_house)
 * @returns {Promise<Object>} Result
 */
export async function claimPrize(gameId, playerId, prizeId, ticketId, prizeType) {
  try {
    // Check if prize is already claimed
    const { data: prize, error: prizeError } = await supabase
      .from('prizes')
      .select('claimed')
      .eq('id', prizeId)
      .single()

    if (prizeError) throw prizeError

    if (prize.claimed) {
      return { success: false, error: 'Prize already claimed' }
    }

    // Check if player already has a pending claim for this prize
    const { data: existingClaim, error: checkError } = await supabase
      .from('claim_requests')
      .select('id')
      .eq('game_id', gameId)
      .eq('player_id', playerId)
      .eq('prize_id', prizeId)
      .eq('status', 'pending')
      .single()

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw checkError
    }

    if (existingClaim) {
      return { success: false, error: 'You already have a pending claim for this prize' }
    }

    // Insert claim request
    const { error: insertError } = await supabase
      .from('claim_requests')
      .insert({
        game_id: gameId,
        player_id: playerId,
        prize_id: prizeId,
        ticket_id: ticketId,
        status: 'pending'
      })

    if (insertError) throw insertError

    return { success: true }
  } catch (error) {
    console.error('Error submitting claim request:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Get pending claim requests for a game (host only)
 * @param {string} gameId - Game ID
 * @returns {Promise<Object>} Claim requests with player and prize info and all player tickets
 */
export async function getClaimRequests(gameId) {
  try {
    const { data: claims, error } = await supabase
      .from('claim_requests')
      .select(`
        *,
        player:players(id, player_name),
        prize:prizes(id, name),
        ticket:tickets(id, ticket_number, numbers)
      `)
      .eq('game_id', gameId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (error) throw error

    // Get all unique player IDs from claims
    const playerIds = [...new Set(claims.map(claim => claim.player?.id).filter(Boolean))]

    // Fetch all tickets for these players
    const { data: allTickets, error: ticketsError } = await supabase
      .from('tickets')
      .select('*')
      .eq('game_id', gameId)
      .in('player_id', playerIds)
      .order('ticket_number')

    if (ticketsError) throw ticketsError

    // Group tickets by player ID
    const ticketsByPlayer = (allTickets || []).reduce((acc, ticket) => {
      if (!acc[ticket.player_id]) {
        acc[ticket.player_id] = []
      }
      acc[ticket.player_id].push(ticket)
      return acc
    }, {})

    // Add all tickets to each claim's player data
    const claimsWithAllTickets = claims.map(claim => ({
      ...claim,
      player: {
        ...claim.player,
        allTickets: ticketsByPlayer[claim.player?.id] || []
      }
    }))

    return {
      success: true,
      claims: claimsWithAllTickets
    }
  } catch (error) {
    console.error('Error fetching claim requests:', error)
    return { success: false, error: error.message, claims: [] }
  }
}

/**
 * Approve a claim request (host only)
 * @param {string} claimId - Claim request ID
 * @param {string} prizeId - Prize ID
 * @param {string} playerId - Player ID
 * @returns {Promise<Object>} Result
 */
export async function approveClaim(claimId, prizeId, playerId) {
  try {
    // Update the prize to mark it as claimed
    const { error: prizeError } = await supabase
      .from('prizes')
      .update({
        claimed: true,
        claimed_by: playerId,
        claimed_at: new Date().toISOString()
      })
      .eq('id', prizeId)

    if (prizeError) throw prizeError

    // Update the claim request status to approved
    const { error: claimError } = await supabase
      .from('claim_requests')
      .update({
        status: 'approved',
        verified_at: new Date().toISOString()
      })
      .eq('id', claimId)

    if (claimError) throw claimError

    return { success: true }
  } catch (error) {
    console.error('Error approving claim:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Reject a claim request (host only)
 * @param {string} claimId - Claim request ID
 * @returns {Promise<Object>} Result
 */
export async function rejectClaim(claimId) {
  try {
    // Update the claim request status to rejected
    const { error } = await supabase
      .from('claim_requests')
      .update({
        status: 'rejected',
        verified_at: new Date().toISOString()
      })
      .eq('id', claimId)

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error('Error rejecting claim:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Subscribe to claim requests updates
 * @param {string} gameId - Game ID
 * @param {Function} callback - Callback function when claim requests change
 * @returns {Object} Subscription object
 */
export function subscribeToClaimRequests(gameId, callback) {
  console.log('[ClaimRequests] Setting up subscription for game:', gameId)

  const subscription = supabase
    .channel(`claim-requests-${gameId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'claim_requests',
        filter: `game_id=eq.${gameId}`
      },
      async (payload) => {
        console.log('[ClaimRequests] Change detected:', payload)
        // Fetch updated claim requests with full details
        const result = await getClaimRequests(gameId)
        if (result.success) {
          console.log('[ClaimRequests] Fetched updated claims:', result.claims.length)
          callback(result.claims)
        }
      }
    )
    .subscribe((status) => {
      console.log('[ClaimRequests] Subscription status:', status)
    })

  return subscription
}

/**
 * Subscribe to game updates (called numbers, status changes)
 * @param {string} gameId - Game ID
 * @param {Function} callback - Callback function when game changes
 * @returns {Object} Subscription object
 */
export function subscribeToGameUpdates(gameId, callback) {
  const subscription = supabase
    .channel(`game-updates-${gameId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'games',
        filter: `id=eq.${gameId}`
      },
      (payload) => {
        callback(payload.new)
      }
    )
    .subscribe()

  return subscription
}

/**
 * Subscribe to prize claims
 * @param {string} gameId - Game ID
 * @param {Function} callback - Callback function when prizes change
 * @returns {Object} Subscription object
 */
export function subscribeToPrizes(gameId, callback) {
  const subscription = supabase
    .channel(`prizes-${gameId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'prizes',
        filter: `game_id=eq.${gameId}`
      },
      async () => {
        // Fetch updated prizes with player info
        const { data: prizes, error } = await supabase
          .from('prizes')
          .select(`
            *,
            claimed_by_player:players!prizes_claimed_by_fkey(player_name)
          `)
          .eq('game_id', gameId)
          .order('order')

        if (!error && prizes) {
          callback(prizes)
        }
      }
    )
    .subscribe()

  return subscription
}

/**
 * End the game (update status to 'completed')
 * @param {string} gameId - Game ID
 * @returns {Promise<Object>} Result
 */
export async function endGame(gameId) {
  try {
    const { error } = await supabase
      .from('games')
      .update({
        status: 'completed',
        ended_at: new Date().toISOString()
      })
      .eq('id', gameId)

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error('Error ending game:', error)
    return { success: false, error: error.message }
  }
}
