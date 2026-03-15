import { supabase } from '../lib/supabase'
import { getSessionId } from '../utils/session'

/**
 * Fetch complete game data including prizes
 * @param {string} gameCode - Game code
 * @returns {Promise<Object>} Game data with prizes
 */
export async function getGameData(gameCode) {
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
    console.error('Error fetching game data:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Fetch all players in a game
 * @param {string} gameId - Game ID
 * @returns {Promise<Array>} List of players
 */
export async function getPlayers(gameId) {
  try {
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('game_id', gameId)
      .order('joined_at')

    if (error) throw error

    return { success: true, players: data || [] }
  } catch (error) {
    console.error('Error fetching players:', error)
    return { success: false, error: error.message, players: [] }
  }
}

/**
 * Get current player's data
 * @param {string} gameId - Game ID
 * @returns {Promise<Object>} Current player data
 */
export async function getCurrentPlayer(gameId) {
  const sessionId = getSessionId()

  try {
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('game_id', gameId)
      .eq('session_id', sessionId)
      .single()

    if (error) throw error

    return { success: true, player: data }
  } catch (error) {
    console.error('Error fetching current player:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Save player tickets
 * @param {string} playerId - Player ID
 * @param {string} gameId - Game ID
 * @param {Array} tickets - Array of ticket objects
 * @returns {Promise<Object>} Result
 */
export async function savePlayerTickets(playerId, gameId, tickets) {
  try {
    // Delete existing tickets for this player
    await supabase
      .from('tickets')
      .delete()
      .eq('player_id', playerId)

    // Insert new tickets
    const ticketsData = tickets.map(ticket => ({
      game_id: gameId,
      player_id: playerId,
      ticket_number: ticket.id,
      numbers: ticket.numbers
    }))

    const { error: insertError } = await supabase
      .from('tickets')
      .insert(ticketsData)

    if (insertError) throw insertError

    // Update player's tickets_selected count
    const { error: updateError } = await supabase
      .from('players')
      .update({ tickets_selected: tickets.length })
      .eq('id', playerId)

    if (updateError) throw updateError

    return { success: true }
  } catch (error) {
    console.error('Error saving tickets:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Update player's ready status
 * @param {string} playerId - Player ID
 * @param {boolean} isReady - Ready status
 * @returns {Promise<Object>} Result
 */
export async function updatePlayerReady(playerId, isReady) {
  try {
    const { error } = await supabase
      .from('players')
      .update({ is_ready: isReady })
      .eq('id', playerId)

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error('Error updating ready status:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Start the game (update status to 'playing')
 * @param {string} gameId - Game ID
 * @returns {Promise<Object>} Result
 */
export async function startGame(gameId) {
  try {
    const { error } = await supabase
      .from('games')
      .update({
        status: 'playing',
        started_at: new Date().toISOString()
      })
      .eq('id', gameId)

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error('Error starting game:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Subscribe to players changes in real-time
 * @param {string} gameId - Game ID
 * @param {Function} callback - Callback function when players change
 * @returns {Object} Subscription object
 */
export function subscribeToPlayers(gameId, callback) {
  const subscription = supabase
    .channel(`players-${gameId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'players',
        filter: `game_id=eq.${gameId}`
      },
      async () => {
        // Fetch updated players list
        const result = await getPlayers(gameId)
        if (result.success) {
          callback(result.players)
        }
      }
    )
    .subscribe()

  return subscription
}

/**
 * Subscribe to game status changes
 * @param {string} gameId - Game ID
 * @param {Function} callback - Callback function when game changes
 * @returns {Object} Subscription object
 */
export function subscribeToGame(gameId, callback) {
  const subscription = supabase
    .channel(`game-${gameId}`)
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
