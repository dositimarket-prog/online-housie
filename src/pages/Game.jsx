import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Ticket from '../components/Ticket'
import {
  getGamePlayData,
  getMyTickets,
  callNumber,
  claimPrize,
  subscribeToGameUpdates,
  subscribeToPrizes
} from '../services/gamePlayService'

function Game() {
  const navigate = useNavigate()
  const { gameCode } = useParams()

  // State
  const [gameData, setGameData] = useState(null)
  const [prizes, setPrizes] = useState([])
  const [currentPlayer, setCurrentPlayer] = useState(null)
  const [myTickets, setMyTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [calledNumbers, setCalledNumbers] = useState([])
  const [currentNumber, setCurrentNumber] = useState(null)
  const [currentPrize, setCurrentPrize] = useState(null)

  // Determine if user is host
  const isHost = currentPlayer?.is_host ?? false

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

          // Set current prize (first unclaimed)
          const firstUnclaimed = gameResult.game.prizes.find(p => !p.claimed)
          setCurrentPrize(firstUnclaimed || gameResult.game.prizes[0])

          // Fetch my tickets
          const ticketsResult = await getMyTickets(gameResult.game.id)
          if (ticketsResult.success) {
            setCurrentPlayer(ticketsResult.player)
            setMyTickets(ticketsResult.tickets)
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

      // Update current prize
      const firstUnclaimed = updatedPrizes.find(p => !p.claimed)
      setCurrentPrize(firstUnclaimed || updatedPrizes[0])
    })

    // Cleanup subscriptions
    return () => {
      gameSubscription?.unsubscribe()
      prizesSubscription?.unsubscribe()
    }
  }, [gameData?.id])

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

    // Claim prize in database
    const result = await claimPrize(
      gameData.id,
      currentPlayer.id,
      prizeId,
      ticketId,
      prize.prize_type
    )

    if (result.success) {
      alert(`You claimed ${prize.name}!`)
    } else {
      console.error('Error claiming prize:', result.error)
      alert('Failed to claim prize. It may have already been claimed.')
    }
    // Real-time subscription will update the prizes list
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Host Controls - Top Section */}
        {isHost && (
          <div className="mb-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">Host Controls</h3>
                  <p className="text-sm text-gray-600">
                    {calledNumbers.length} / 90 numbers called
                  </p>
                </div>
                <button
                  onClick={callNextNumber}
                  disabled={calledNumbers.length >= 90}
                  className={`px-8 py-4 rounded-lg font-medium text-lg transition-colors ${
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

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Number Board & Called Numbers */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Number */}
            {currentNumber && (
              <div className="bg-gradient-to-br from-gray-900 to-gray-700 rounded-xl p-8 text-center">
                <p className="text-white text-sm font-medium mb-2">Current Number</p>
                <div className="text-white text-8xl font-bold">{currentNumber}</div>
              </div>
            )}

            {/* Number Board (1-90) */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Number Board</h3>
              <div className="grid grid-cols-9 gap-2">
                {Array.from({ length: 90 }, (_, i) => i + 1).map((num) => {
                  const isCalled = calledNumbers.includes(num)
                  const isCurrent = num === currentNumber
                  return (
                    <div
                      key={num}
                      className={`
                        aspect-square flex items-center justify-center rounded-lg font-semibold text-sm
                        ${isCurrent
                          ? 'bg-gray-900 text-white ring-4 ring-gray-300'
                          : isCalled
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-100 text-gray-400'
                        }
                      `}
                    >
                      {num}
                    </div>
                  )
                })}
              </div>
              <p className="mt-4 text-sm text-gray-600 text-center">
                {calledNumbers.length} / 90 numbers called
              </p>
            </div>

            {/* Player Tickets */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">
                {isHost ? 'All Tickets' : 'My Tickets'}
              </h3>
              <div className="space-y-4">
                {myTickets.length > 0 ? (
                  myTickets.map((ticket) => (
                    <Ticket
                      key={ticket.id}
                      ticket={ticket.numbers}
                      ticketNumber={ticket.ticket_number}
                      markedNumbers={calledNumbers}
                      size="normal"
                    />
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-8">No tickets selected</p>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Controls & Info */}
          <div className="space-y-6">
            {/* Current Prize */}
            {currentPrize && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Current Prize</h3>
                <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg border-2 border-yellow-200">
                  <p className="text-2xl font-bold text-gray-900">{currentPrize.name}</p>
                  {currentPrize.amount && (
                    <p className="text-xl font-semibold text-orange-600 mt-1">{currentPrize.amount}</p>
                  )}
                </div>
              </div>
            )}

            {/* Player Claim Buttons */}
            {!isHost && currentPrize && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Claim Prize</h3>
                <div className="space-y-2">
                  {prizes.map((prize) => (
                    <button
                      key={prize.id}
                      onClick={() => handleClaim(prize.id)}
                      disabled={prize.claimed || prize.id !== currentPrize.id}
                      className={`w-full px-4 py-3 rounded-lg font-medium text-left transition-colors ${
                        prize.claimed
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : prize.id === currentPrize.id
                            ? 'bg-green-600 text-white hover:bg-green-700'
                            : 'bg-gray-100 text-gray-600 cursor-not-allowed'
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

            {/* Prizes Status */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
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

            {/* Called Numbers History */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
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
          </div>
        </div>
      </div>
    </div>
  )
}

export default Game
