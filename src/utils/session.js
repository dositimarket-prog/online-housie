/**
 * Session management utility for guest users
 * Uses sessionStorage to persist user session across page refreshes
 */

const SESSION_KEY = 'housie_session_id'

/**
 * Get or create a session ID for the current user
 * @returns {string} UUID session identifier
 */
export function getSessionId() {
  // Check if session ID already exists
  let sessionId = sessionStorage.getItem(SESSION_KEY)

  if (!sessionId) {
    // Generate new UUID v4
    sessionId = crypto.randomUUID()
    sessionStorage.setItem(SESSION_KEY, sessionId)
  }

  return sessionId
}

/**
 * Clear the current session ID
 * Useful when user wants to join as a different player
 */
export function clearSession() {
  sessionStorage.removeItem(SESSION_KEY)
}

/**
 * Check if user has an active session
 * @returns {boolean}
 */
export function hasSession() {
  return sessionStorage.getItem(SESSION_KEY) !== null
}
