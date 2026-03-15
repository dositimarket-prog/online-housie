import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Ticket from '../components/Ticket'
import {
  getGamePlayData,
  getMyTickets,
  callNumber,
  claimPrize,
  getClaimRequests,
  approveClaim,
  rejectClaim,
  subscribeToGameUpdates,
  subscribeToPrizes,
  subscribeToClaimRequests
} from '../services/gamePlayService'

function Game() {
  const navigate = useNavigate()
  const { gameCode } = useParams()

  // State
  const [gameData, setGameData] = useState(null)
  const [prizes, setPrizes] = useState([])
  const [currentPlayer, setCurrentPlayer] = useState(null)
  const [myTickets, setMyTickets] = useState([])
  const [claimRequests, setClaimRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [calledNumbers, setCalledNumbers] = useState([])
  const [currentNumber, setCurrentNumber] = useState(null)
  const [manuallyMarkedNumbers, setManuallyMarkedNumbers] = useState([])

  // Determine if user is host
  const isHost = currentPlayer?.is_host ?? false

  // Toggle manual marking for players
  const toggleNumberMark = (number) => {
    if (isHost) return // Host doesn't manually mark

    setManuallyMarkedNumbers(prev => {
      if (prev.includes(number)) {
        return prev.filter(n => n !== number)
      } else {
        return [...prev, number]
      }
    })
  }

  // Fetch initial data
  useEffect(() => {
    async function loadData() {
      if (!gameCode) return

      try {
        // Fetch game data
        const gameResult = await getGamePlayData(gameCode)
        if (gameResult.success) {
          setGameData(gameResult.game)
          setPrizes(gameResult.game.prizes || [])
          setCalledNumbers(gameResult.game.called_numbers || [])

          // Fetch my tickets and player info
          const ticketsResult = await getMyTickets(gameResult.game.id)
          if (ticketsResult.success) {
            setCurrentPlayer(ticketsResult.player)
            setMyTickets(ticketsResult.tickets)

            // If host, also fetch claim requests
            if (ticketsResult.player.is_host) {
              const claimsResult = await getClaimRequests(gameResult.game.id)
              if (claimsResult.success) {
                setClaimRequests(claimsResult.claims)
              }
            }
          }
        }
      } catch (error) {
        console.error('Error loading game data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [gameCode])

  // Set up real-time subscriptions
  useEffect(() => {
    if (!gameData?.id) return

    // Subscribe to game updates (called numbers)
    const gameSubscription = subscribeToGameUpdates(gameData.id, (updatedGame) => {
      setCalledNumbers(updatedGame.called_numbers || [])

      // Set current number to the last called number
      const lastNumber = updatedGame.called_numbers?.[updatedGame.called_numbers.length - 1]
      setCurrentNumber(lastNumber || null)
    })

    // Subscribe to prize updates
    const prizesSubscription = subscribeToPrizes(gameData.id, (updatedPrizes) => {
      setPrizes(updatedPrizes)
    })

    // Subscribe to claim requests (host only)
    let claimsSubscription = null
    if (isHost) {
      claimsSubscription = subscribeToClaimRequests(gameData.id, (updatedClaims) => {
        setClaimRequests(updatedClaims)
      })
    }

    // Cleanup subscriptions
    return () => {
      gameSubscription?.unsubscribe()
      prizesSubscription?.unsubscribe()
      claimsSubscription?.unsubscribe()
    }
  }, [gameData?.id, isHost])

  // Generate next random number
  const callNextNumber = async () => {
    if (!gameData || !isHost) return

    const availableNumbers = Array.from({ length: 90 }, (_, i) => i + 1)
      .filter(num => !calledNumbers.includes(num))

    if (availableNumbers.length === 0) return

    const randomIndex = Math.floor(Math.random() * availableNumbers.length)
    const nextNumber = availableNumbers[randomIndex]

    // Call number in database
    const result = await callNumber(gameData.id, nextNumber)

    if (!result.success) {
      console.error('Error calling number:', result.error)
      alert('Failed to call number. Please try again.')
    }
    // Real-time subscription will update the UI
  }

  const handleClaim = async (prizeId) => {
    if (!currentPlayer || !gameData) return

    // Find the ticket to use for claim (use first ticket for now)
    const ticketId = myTickets[0]?.id
    if (!ticketId) {
      alert('No tickets found!')
      return
    }

    const prize = prizes.find(p => p.id === prizeId)
    if (!prize) return

    // Submit claim request to host
    const result = await claimPrize(
      gameData.id,
      currentPlayer.id,
      prizeId,
      ticketId,
      prize.prize_type
    )

    if (result.success) {
      alert(`Claim submitted for ${prize.name}!\nWaiting for host verification.`)
    } else {
      console.error('Error submitting claim:', result.error)
      if (result.error === 'Prize already claimed') {
        alert('This prize has already been claimed by another player.')
      } else if (result.error === 'You already have a pending claim for this prize') {
        alert('You already submitted a claim for this prize. Waiting for host verification.')
      } else {
        alert('Failed to submit claim. Please try again.')
      }
    }
  }

  const handleApproveClaim = async (claimId, prizeId, playerId) => {
    if (!isHost) return

    const result = await approveClaim(claimId, prizeId, playerId)

    if (result.success) {
      // Success - subscription will update the UI automatically
      console.log('Claim approved successfully')
    } else {
      console.error('Error approving claim:', result.error)
      alert('Failed to approve claim. Please try again.')
    }
  }

  const handleRejectClaim = async (claimId) => {
    if (!isHost) return

    const result = await rejectClaim(claimId)

    if (result.success) {
      // Success - subscription will update the UI automatically
      console.log('Claim rejected successfully')
    } else {
      console.error('Error rejecting claim:', result.error)
      alert('Failed to reject claim. Please try again.')
    }
  }

  // Show loading state
  if (loading || !gameData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl font-semibold text-gray-900 mb-2">Loading game...</div>
          <div className="text-gray-600">Please wait</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <span className="text-xl font-semibold text-gray-900">
                {gameData.game_title || 'Housie Game'}
              </span>
              <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm font-mono rounded">
                {gameData.game_code}
              </span>
            </div>
            <button
              onClick={() => navigate('/')}
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Exit Game
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Host Controls - Top Section */}
        {isHost && (
          <div className="mb-4 sm:mb-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">Host Controls</h3>
                  <p className="text-sm text-gray-600">
                    {calledNumbers.length} / 90 numbers called
                  </p>
                </div>
                <button
                  onClick={callNextNumber}
                  disabled={calledNumbers.length >= 90}
                  className={`w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-medium text-base sm:text-lg transition-colors ${
                    calledNumbers.length < 90
                      ? 'bg-gray-900 text-white hover:bg-gray-800'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {calledNumbers.length >= 90 ? 'All Numbers Called' : 'Call Next Number'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Left Column - Number Board & Called Numbers */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Number */}
            {currentNumber && (
              <div className="bg-gradient-to-br from-gray-900 to-gray-700 rounded-xl p-6 sm:p-8 text-center">
                <p className="text-white text-sm font-medium mb-2">Current Number</p>
                <div className="text-white text-6xl sm:text-8xl font-bold">{currentNumber}</div>
              </div>
            )}

            {/* Player Tickets */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
              <div className="mb-4">
                <h3 className="font-semibold text-gray-900">
                  {isHost ? 'Pending Claims' : 'My Tickets'}
                </h3>
                {!isHost && (
                  <p className="text-sm text-gray-600 mt-1">
                    Click on numbers to mark them when called
                  </p>
                )}
              </div>
              <div className="space-y-6 overflow-x-auto">
                {isHost ? (
                  // Host view - show all tickets grouped by player with claims
                  claimRequests.length > 0 ? (
                    (() => {
                      // Group claims by player
                      const claimsByPlayer = claimRequests.reduce((acc, claim) => {
                        const playerId = claim.player?.id
                        if (!acc[playerId]) {
                          acc[playerId] = {
                            playerName: claim.player?.player_name,
                            claims: [],
                            tickets: []
                          }
                        }
                        acc[playerId].claims.push(claim)
                        return acc
                      }, {})

                      return Object.values(claimsByPlayer).map((playerData, index) => (
                        <div key={index} className="border-2 border-orange-200 bg-orange-50 rounded-lg p-4">
                          {/* Player header with all their claims inline */}
                          <div className="mb-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-medium text-gray-900">{playerData.playerName}</h4>
                              <span className="text-sm text-gray-600">claiming:</span>
                              {playerData.claims.map((claim) => (
                                <span
                                  key={claim.id}
                                  className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full"
                                >
                                  {claim.prize?.name}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Show all tickets for this player */}
                          <div className="space-y-3 mb-3">
                            {playerData.claims[0]?.player?.allTickets?.map((ticket) => (
                              <Ticket
                                key={ticket.id}
                                ticket={ticket.numbers}
                                ticketNumber={ticket.ticket_number}
                                markedNumbers={calledNumbers}
                                size="normal"
                              />
                            ))}
                          </div>

                          {/* Approve/Reject buttons for each claim */}
                          <div className="space-y-2">
                            {playerData.claims.map((claim) => (
                              <div key={claim.id} className="flex gap-2">
                                <button
                                  className="flex-1 px-6 py-4 bg-green-600 text-white text-base rounded-lg font-medium hover:bg-green-700 transition-colors"
                                  onClick={() => handleApproveClaim(claim.id, claim.prize?.id, claim.player?.id)}
                                >
                                  Approve
                                </button>
                                <button
                                  className="flex-1 px-6 py-4 bg-red-600 text-white text-base rounded-lg font-medium hover:bg-red-700 transition-colors"
                                  onClick={() => handleRejectClaim(claim.id)}
                                >
                                  Reject
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                    })()
                  ) : (
                    <p className="text-center text-gray-500 py-8">No pending claims</p>
                  )
                ) : (
                  // Player view - show only their tickets with manual marking
                  myTickets.length > 0 ? (
                    myTickets.map((ticket) => (
                      <Ticket
                        key={ticket.id}
                        ticket={ticket.numbers}
                        ticketNumber={ticket.ticket_number}
                        markedNumbers={manuallyMarkedNumbers}
                        onCellClick={toggleNumberMark}
                        size="normal"
                      />
                    ))
                  ) : (
                    <p className="text-center text-gray-500 py-8">No tickets selected</p>
                  )
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Controls & Info */}
          <div className="space-y-6">
            {/* Player Claim Buttons */}
            {!isHost && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Claim Prize</h3>
                <div className="space-y-2">
                  {prizes.map((prize) => (
                    <button
                      key={prize.id}
                      onClick={() => handleClaim(prize.id)}
                      disabled={prize.claimed}
                      className={`w-full px-4 py-3 rounded-lg font-medium text-left transition-colors ${
                        prize.claimed
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span>{prize.name}</span>
                        {prize.claimed && <span className="text-sm">✓ Claimed</span>}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Prizes Status - Host only */}
            {isHost && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Prizes</h3>
                <div className="space-y-2">
                  {prizes.map((prize) => (
                    <div
                      key={prize.id}
                      className={`p-3 rounded-lg ${
                        prize.claimed ? 'bg-gray-50' : 'bg-white border border-gray-200'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className={`font-medium ${prize.claimed ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                            {prize.name}
                          </p>
                          {prize.claimed && prize.claimed_by_player?.player_name && (
                            <p className="text-xs text-gray-500">Won by {prize.claimed_by_player.player_name}</p>
                          )}
                        </div>
                        {prize.amount && (
                          <span className={`font-semibold ${prize.claimed ? 'text-gray-400' : 'text-gray-900'}`}>
                            {prize.amount}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Called Numbers History - Host only */}
            {isHost && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Called Numbers</h3>
                <div className="flex flex-wrap gap-2">
                  {calledNumbers.slice().reverse().map((num, index) => (
                    <span
                      key={num}
                      className={`px-3 py-1 rounded-full font-semibold text-sm ${
                        index === 0
                          ? 'bg-gray-900 text-white'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {num}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Game
