import { useState, useEffect } from 'react'
import { useNavigate, useLocation, useParams } from 'react-router-dom'
import TicketSelector from '../components/TicketSelector'
import Ticket from '../components/Ticket'
import {
  getGameData,
  getPlayers,
  getCurrentPlayer,
  savePlayerTickets,
  updatePlayerReady,
  startGame,
  subscribeToPlayers,
  subscribeToGame
} from '../services/lobbyService'

function Lobby() {
  const navigate = useNavigate()
  const location = useLocation()
  const { gameCode } = useParams()

  // State
  const [gameData, setGameData] = useState(null)
  const [players, setPlayers] = useState([])
  const [currentPlayer, setCurrentPlayer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [showTicketSelector, setShowTicketSelector] = useState(false)
  const [selectedTickets, setSelectedTickets] = useState([])

  // Determine if user is host
  const isHost = currentPlayer?.is_host ?? false
  const isReady = currentPlayer?.is_ready ?? false

  // Fetch initial data
  useEffect(() => {
    async function loadData() {
      if (!gameCode) return

      try {
        // Fetch game data
        const gameResult = await getGameData(gameCode)
        if (gameResult.success) {
          setGameData(gameResult.game)

          // Fetch players
          const playersResult = await getPlayers(gameResult.game.id)
          if (playersResult.success) {
            setPlayers(playersResult.players)
          }

          // Get current player
          const playerResult = await getCurrentPlayer(gameResult.game.id)
          if (playerResult.success) {
            setCurrentPlayer(playerResult.player)
          }
        }
      } catch (error) {
        console.error('Error loading lobby data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [gameCode])

  // Set up real-time subscriptions
  useEffect(() => {
    if (!gameData?.id) return

    // Subscribe to players changes
    const playersSubscription = subscribeToPlayers(gameData.id, (updatedPlayers) => {
      setPlayers(updatedPlayers)
      // Update current player data
      const updated = updatedPlayers.find(p => p.id === currentPlayer?.id)
      if (updated) {
        setCurrentPlayer(updated)
      }
    })

    // Subscribe to game status changes
    const gameSubscription = subscribeToGame(gameData.id, (updatedGame) => {
      setGameData(prev => ({ ...prev, ...updatedGame }))
      // If game started, navigate to game page
      if (updatedGame.status === 'playing') {
        navigate(`/game/${gameCode}`)
      }
    })

    // Cleanup subscriptions
    return () => {
      playersSubscription?.unsubscribe()
      gameSubscription?.unsubscribe()
    }
  }, [gameData?.id, currentPlayer?.id, gameCode, navigate])

  const handleTicketsConfirm = async (tickets) => {
    if (!currentPlayer || !gameData) return

    setSelectedTickets(tickets)

    // Save tickets to database
    const result = await savePlayerTickets(currentPlayer.id, gameData.id, tickets)
    if (!result.success) {
      console.error('Error saving tickets:', result.error)
      alert('Failed to save tickets. Please try again.')
    }
  }

  const handleToggleReady = async () => {
    if (!currentPlayer) return

    if (selectedTickets.length === 0 && currentPlayer.tickets_selected === 0) {
      alert('Please select at least one ticket first!')
      return
    }

    // Toggle ready status
    const newReadyStatus = !isReady
    const result = await updatePlayerReady(currentPlayer.id, newReadyStatus)

    if (!result.success) {
      console.error('Error updating ready status:', result.error)
      alert('Failed to update status. Please try again.')
    }
  }

  const copyGameCode = () => {
    navigator.clipboard.writeText(gameData.game_code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareGame = () => {
    const shareText = `Join my Housie game!\nGame Code: ${gameData.game_code}\nTitle: ${gameData.game_title || 'Housie Game'}`

    if (navigator.share) {
      navigator.share({
        title: 'Join Housie Game',
        text: shareText,
      }).catch(() => {
        // Fallback to copy
        copyGameCode()
      })
    } else {
      copyGameCode()
    }
  }

  const allPlayersReady = players.every(p => p.is_ready && p.tickets_selected > 0)
  const canStartGame = isHost // Host can start anytime

  const handleStartGame = async () => {
    if (!gameData || !isHost) return

    // Update game status to 'playing'
    const result = await startGame(gameData.id)

    if (result.success) {
      // Real-time subscription will navigate when status changes
      // But navigate immediately for responsiveness
      navigate(`/game/${gameCode}`)
    } else {
      console.error('Error starting game:', result.error)
      alert('Failed to start game. Please try again.')
    }
  }

  // Show loading state
  if (loading || !gameData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl font-semibold text-gray-900 mb-2">Loading lobby...</div>
          <div className="text-gray-600">Please wait</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Leave
              </button>
            </div>
            <span className="text-2xl font-semibold text-gray-900">Housie</span>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Game Code Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {gameData.game_title || 'Waiting Room'}
            </h1>
            <p className="text-gray-600 mb-4">Share this code with players to join</p>

            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="bg-gray-900 text-white px-8 py-4 rounded-lg">
                <span className="text-3xl font-bold tracking-wider">{gameData.game_code}</span>
              </div>
            </div>

            <div className="flex gap-3 justify-center">
              <button
                onClick={copyGameCode}
                className="px-6 py-2 bg-gray-100 text-gray-900 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center gap-2"
              >
                {copied ? (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy Code
                  </>
                )}
              </button>
              <button
                onClick={shareGame}
                className="px-6 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Share
              </button>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Players List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Players ({players.length}{gameData.max_players ? `/${gameData.max_players}` : ''})
                  </h2>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="flex items-center gap-1 text-green-600">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>{players.filter(p => p.is_ready).length} Ready</span>
                    </div>
                    <span className="text-gray-400">•</span>
                    <div className="flex items-center gap-1 text-gray-600">
                      <span>{players.filter(p => !p.is_ready).length} Waiting</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="divide-y divide-gray-100">
                {players.map((player) => (
                  <div
                    key={player.id}
                    className="p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-900 text-white rounded-full flex items-center justify-center font-semibold">
                          {player.player_name?.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{player.player_name}</span>
                            {player.is_host && (
                              <span className="px-2 py-0.5 bg-gray-900 text-white text-xs rounded-full">
                                Host
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-600">
                            {player.tickets_selected > 0 ? (
                              `${player.tickets_selected} ticket${player.tickets_selected > 1 ? 's' : ''} selected`
                            ) : (
                              <span className="text-orange-600">No tickets selected</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {player.is_ready ? (
                          <div className="flex items-center gap-1 text-green-600">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span className="text-sm font-medium">Ready</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-gray-400">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                            </svg>
                            <span className="text-sm">Waiting</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {players.length === 0 && (
                <div className="p-12 text-center text-gray-500">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <p className="text-lg font-medium mb-1">Waiting for players</p>
                  <p className="text-sm">Share the game code to invite players</p>
                </div>
              )}
            </div>
          </div>

          {/* Game Info Sidebar */}
          <div className="space-y-6">
            {/* Game Settings */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Game Settings</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Host</span>
                  <span className="font-medium text-gray-900">{gameData.host_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tickets per player</span>
                  <span className="font-medium text-gray-900">{gameData.tickets_per_player}</span>
                </div>
                {gameData.max_players && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Max players</span>
                    <span className="font-medium text-gray-900">{gameData.max_players}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-gray-100">
                  <span className="text-gray-600 block mb-2">Game Mode</span>
                  <div className="space-y-1 text-xs text-gray-600">
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Private (Invite Only)
                    </div>
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                      </svg>
                      Manual Number Calling
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Prizes */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Prizes</h3>
              <div className="space-y-2">
                {gameData.prizes.map((prize) => (
                  <div
                    key={prize.id}
                    className="flex justify-between items-center text-sm"
                  >
                    <span className="text-gray-600">{prize.name}</span>
                    {prize.amount && (
                      <span className="font-medium text-gray-900">{prize.amount}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Host Controls */}
            {isHost && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Host Controls</h3>

                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    {players.length === 1 ? (
                      '👥 1 player in lobby'
                    ) : (
                      `👥 ${players.length} players in lobby • ${players.filter(p => p.is_ready).length} ready`
                    )}
                  </p>
                </div>

                <button
                  onClick={handleStartGame}
                  className="w-full px-6 py-3 rounded-lg font-medium transition-colors bg-gray-900 text-white hover:bg-gray-800"
                >
                  Start Game
                </button>
              </div>
            )}

            {/* My Tickets & Ready Section */}
            {!isHost && (
              <>
                {/* My Tickets */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-gray-900">My Tickets</h3>
                    <button
                      onClick={() => setShowTicketSelector(true)}
                      className="text-sm text-gray-900 hover:text-gray-700 font-medium"
                    >
                      {selectedTickets.length > 0 ? 'Change' : 'Select'}
                    </button>
                  </div>

                  {selectedTickets.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <svg className="w-16 h-16 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-sm font-medium mb-2">No tickets selected</p>
                      <button
                        onClick={() => setShowTicketSelector(true)}
                        className="text-sm text-gray-900 hover:underline"
                      >
                        Select your tickets →
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedTickets.map((ticket) => (
                        <Ticket
                          key={ticket.id}
                          ticket={ticket.numbers}
                          ticketNumber={ticket.id}
                          size="tiny"
                        />
                      ))}
                      <p className="text-xs text-gray-600 text-center">
                        {selectedTickets.length} / {gameData.tickets_per_player} selected
                      </p>
                    </div>
                  )}
                </div>

                {/* Ready Button */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <button
                    onClick={handleToggleReady}
                    disabled={selectedTickets.length === 0}
                    className={`w-full px-6 py-3 rounded-lg font-medium transition-colors ${
                      isReady
                        ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        : selectedTickets.length > 0
                          ? 'bg-green-600 text-white hover:bg-green-700'
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {isReady ? '✓ Ready' : 'Mark as Ready'}
                  </button>
                  {selectedTickets.length === 0 && (
                    <p className="text-xs text-gray-500 text-center mt-2">
                      Select tickets first
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Ticket Selector Modal */}
      <TicketSelector
        isOpen={showTicketSelector}
        onClose={() => setShowTicketSelector(false)}
        maxTickets={gameData.tickets_per_player}
        onConfirm={handleTicketsConfirm}
        initialSelected={selectedTickets}
      />
    </div>
  )
}

export default Lobby
