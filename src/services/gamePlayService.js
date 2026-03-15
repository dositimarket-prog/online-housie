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
 * Claim a prize
 * @param {string} gameId - Game ID
 * @param {string} playerId - Player ID
 * @param {string} prizeId - Prize ID
 * @param {string} ticketId - Ticket ID
 * @param {string} prizeType - Prize type (early5, top_line, middle_line, bottom_line, full_house)
 * @returns {Promise<Object>} Result
 */
export async function claimPrize(gameId, playerId, prizeId, ticketId, prizeType) {
  try {
    // Update the prize with winner info
    const { error: updateError } = await supabase
      .from('prizes')
      .update({
        claimed: true,
        claimed_by: playerId,
        claimed_ticket_id: ticketId,
        claimed_at: new Date().toISOString()
      })
      .eq('id', prizeId)
      .eq('game_id', gameId)
      .eq('claimed', false) // Only update if not already claimed

    if (updateError) throw updateError

    return { success: true }
  } catch (error) {
    console.error('Error claiming prize:', error)
    return { success: false, error: error.message }
  }
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
