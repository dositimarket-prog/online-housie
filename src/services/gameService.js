import { supabase } from '../lib/supabase'
import { getSessionId } from '../utils/session'

/**
 * Generate a unique game code
 * @returns {string} Game code in format HOUS-XXXX
 */
export function generateGameCode() {
  const randomNum = Math.floor(1000 + Math.random() * 9000)
  return `HOUS-${randomNum}`
}

/**
 * Create a new game with prizes and host player
 * @param {Object} gameData - Game configuration
 * @returns {Promise<Object>} Created game with code
 */
export async function createGame(gameData) {
  const { hostName, gameTitle, ticketsPerPlayer, maxPlayers, totalTickets, prizes } = gameData

  // Generate unique game code
  const gameCode = generateGameCode()
  const sessionId = getSessionId()

  try {
    // 1. Create game
    const { data: game, error: gameError } = await supabase
      .from('games')
      .insert({
        game_code: gameCode,
        host_name: hostName,
        game_title: gameTitle || null,
        tickets_per_player: ticketsPerPlayer,
        max_players: maxPlayers || null,
        total_tickets: totalTickets || 20,
        status: 'waiting',
        called_numbers: []
      })
      .select()
      .single()

    if (gameError) throw gameError

    // 2. Create prizes
    if (prizes && prizes.length > 0) {
      const prizesData = prizes.map((prize, index) => ({
        game_id: game.id,
        name: prize.name,
        amount: prize.amount || null,
        order: index + 1
      }))

      const { error: prizesError } = await supabase
        .from('prizes')
        .insert(prizesData)

      if (prizesError) throw prizesError
    }

    // 3. Add host as first player
    const { error: playerError } = await supabase
      .from('players')
      .insert({
        game_id: game.id,
        player_name: hostName,
        session_id: sessionId,
        is_host: true,
        is_ready: false,
        tickets_selected: 0
      })

    if (playerError) throw playerError

    return { success: true, gameCode, gameId: game.id }
  } catch (error) {
    console.error('Error creating game:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Check if a game code exists and is joinable
 * @param {string} gameCode - Game code to validate
 * @returns {Promise<Object>} Validation result
 */
export async function validateGameCode(gameCode) {
  try {
    const { data: game, error } = await supabase
      .from('games')
      .select('id, game_code, status, max_players, host_name, game_title')
      .eq('game_code', gameCode)
      .single()

    if (error || !game) {
      return { valid: false, error: 'Game code not found' }
    }

    if (game.status !== 'waiting') {
      return { valid: false, error: 'Game has already started' }
    }

    // Check if game is full
    if (game.max_players) {
      const { count } = await supabase
        .from('players')
        .select('*', { count: 'exact', head: true })
        .eq('game_id', game.id)

      if (count >= game.max_players) {
        return { valid: false, error: 'Game is full' }
      }
    }

    return {
      valid: true,
      gameId: game.id,
      hostName: game.host_name,
      gameTitle: game.game_title
    }
  } catch (error) {
    console.error('Error validating game code:', error)
    return { valid: false, error: error.message }
  }
}

/**
 * Join an existing game as a player
 * @param {string} gameCode - Game code to join
 * @param {string} playerName - Player's name
 * @returns {Promise<Object>} Join result
 */
export async function joinGame(gameCode, playerName) {
  const sessionId = getSessionId()

  try {
    // Validate game code
    const validation = await validateGameCode(gameCode)
    if (!validation.valid) {
      return { success: false, error: validation.error }
    }

    // Check if player already exists in this game (by session_id)
    const { data: existingPlayer } = await supabase
      .from('players')
      .select('id')
      .eq('game_id', validation.gameId)
      .eq('session_id', sessionId)
      .single()

    if (existingPlayer) {
      // Player already in game, just return success
      return { success: true, gameId: validation.gameId }
    }

    // Add player to game
    const { error: playerError } = await supabase
      .from('players')
      .insert({
        game_id: validation.gameId,
        player_name: playerName,
        session_id: sessionId,
        is_host: false,
        is_ready: false,
        tickets_selected: 0
      })

    if (playerError) throw playerError

    return { success: true, gameId: validation.gameId }
  } catch (error) {
    console.error('Error joining game:', error)
    return { success: false, error: error.message }
  }
}
