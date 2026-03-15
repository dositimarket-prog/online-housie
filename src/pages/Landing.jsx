import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { validateGameCode, joinGame } from '../services/gameService'

function Landing() {
  const navigate = useNavigate()
  const [gameCode, setGameCode] = useState('')
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [playerName, setPlayerName] = useState('')
  const [errors, setErrors] = useState({})

  const handleJoinClick = async () => {
    if (!gameCode.trim()) {
      setErrors({ gameCode: 'Please enter a game code' })
      return
    }

    // Validate game code exists
    const validation = await validateGameCode(gameCode)
    if (!validation.valid) {
      setErrors({ gameCode: validation.error })
      return
    }

    setErrors({})
    setShowJoinModal(true)
  }

  const handleJoinGame = async (e) => {
    e.preventDefault()
    if (!playerName.trim()) {
      setErrors({ playerName: 'Please enter your name' })
      return
    }

    // Join game in Supabase
    const result = await joinGame(gameCode, playerName)

    if (result.success) {
      // Navigate to lobby as player
      navigate(`/lobby/${gameCode}`, { state: { isHost: false } })
    } else {
      setErrors({ playerName: result.error || 'Failed to join game. Please try again.' })
    }
  }

  const closeJoinModal = () => {
    setShowJoinModal(false)
    setPlayerName('')
    setErrors({})
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <span className="text-2xl font-semibold text-gray-900">Housie</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 tracking-tight">
            Play Housie
            <br />
            <span className="text-gray-500">With Friends Online</span>
          </h1>
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
            Create or join multiplayer housie games instantly. Play from anywhere, anytime.
          </p>

          {/* CTA */}
          <div className="flex justify-center">
            <button
              onClick={() => navigate('/create-game')}
              className="px-8 py-4 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors shadow-sm"
            >
              Create Game
            </button>
          </div>

          {/* Join Game Form */}
          <div className="mt-12 max-w-md mx-auto">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter game code (e.g., HOUS-1234)"
                value={gameCode}
                onChange={(e) => {
                  setGameCode(e.target.value.toUpperCase())
                  if (errors.gameCode) setErrors({})
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleJoinClick()}
                className={`flex-1 px-4 py-3 border ${errors.gameCode ? 'border-red-500' : 'border-gray-200'} rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent`}
              />
              <button
                onClick={handleJoinClick}
                className="px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
              >
                Join
              </button>
            </div>
            {errors.gameCode && (
              <p className="mt-2 text-sm text-red-500 text-left">{errors.gameCode}</p>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-600">
          <p>© 2026 Housie. All rights reserved.</p>
        </div>
      </footer>

      {/* Join Game Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Join Game</h2>
              <button
                onClick={closeJoinModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleJoinGame}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Game Code
                </label>
                <input
                  type="text"
                  value={gameCode}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 font-mono text-lg text-center"
                  placeholder="HOUS-1234"
                  readOnly
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Your Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => {
                    setPlayerName(e.target.value)
                    if (errors.playerName) setErrors({})
                  }}
                  className={`w-full px-4 py-3 border ${errors.playerName ? 'border-red-500' : 'border-gray-200'} rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent`}
                  placeholder="Enter your name"
                  autoFocus
                />
                {errors.playerName && (
                  <p className="mt-1 text-sm text-red-500">{errors.playerName}</p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={closeJoinModal}
                  className="flex-1 px-6 py-3 bg-white text-gray-900 border-2 border-gray-200 rounded-lg font-medium hover:border-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
                >
                  Join Game
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Landing
