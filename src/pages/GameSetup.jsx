import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createGame } from '../services/gameService'

function GameSetup() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    hostName: '',
    gameTitle: '',
    ticketsPerPlayer: 3,
    maxPlayers: '',
  })

  const [prizes, setPrizes] = useState([
    { id: 1, name: 'Early 5', amount: '', enabled: true, editing: false },
    { id: 2, name: 'Top Line', amount: '', enabled: true, editing: false },
    { id: 3, name: 'Middle Line', amount: '', enabled: true, editing: false },
    { id: 4, name: 'Bottom Line', amount: '', enabled: true, editing: false },
    { id: 5, name: 'Full House', amount: '', enabled: true, editing: false },
  ])

  const [errors, setErrors] = useState({})
  const [nextPrizeId, setNextPrizeId] = useState(6)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handlePrizeToggle = (id) => {
    setPrizes(prev => prev.map(prize =>
      prize.id === id ? { ...prize, enabled: !prize.enabled } : prize
    ))
  }

  const handlePrizeAmountChange = (id, amount) => {
    setPrizes(prev => prev.map(prize =>
      prize.id === id ? { ...prize, amount } : prize
    ))
  }

  const handlePrizeEdit = (id) => {
    setPrizes(prev => prev.map(prize =>
      prize.id === id ? { ...prize, editing: true } : prize
    ))
  }

  const handlePrizeSave = (id) => {
    setPrizes(prev => prev.map(prize =>
      prize.id === id ? { ...prize, editing: false } : prize
    ))
  }

  const handlePrizeNameChange = (id, name) => {
    setPrizes(prev => prev.map(prize =>
      prize.id === id ? { ...prize, name } : prize
    ))
  }

  const handlePrizeDelete = (id) => {
    setPrizes(prev => prev.filter(prize => prize.id !== id))
  }

  const handleAddPrize = () => {
    const newPrize = {
      id: nextPrizeId,
      name: '',
      amount: '',
      enabled: true,
      editing: true
    }
    setPrizes(prev => [...prev, newPrize])
    setNextPrizeId(prev => prev + 1)
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.hostName.trim()) {
      newErrors.hostName = 'Host name is required'
    }

    if (formData.maxPlayers && (formData.maxPlayers < 2 || formData.maxPlayers > 100)) {
      newErrors.maxPlayers = 'Max players must be between 2 and 100'
    }

    const enabledPrizes = prizes.filter(p => p.enabled).length
    if (enabledPrizes === 0) {
      newErrors.prizes = 'Enable at least one prize type'
    }

    const invalidPrizes = prizes.filter(p => p.enabled && !p.name.trim())
    if (invalidPrizes.length > 0) {
      newErrors.prizes = 'All enabled prizes must have a name'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (validateForm()) {
      const gameData = {
        hostName: formData.hostName,
        gameTitle: formData.gameTitle,
        ticketsPerPlayer: formData.ticketsPerPlayer,
        maxPlayers: formData.maxPlayers ? parseInt(formData.maxPlayers) : null,
        prizes: prizes.filter(p => p.enabled).map(({ name, amount }) => ({
          name,
          amount: amount || null
        }))
      }

      // Create game in Supabase
      const result = await createGame(gameData)

      if (result.success) {
        // Navigate to lobby as host
        navigate(`/lobby/${result.gameCode}`, { state: { isHost: true } })
      } else {
        // Show error
        setErrors({ submit: result.error || 'Failed to create game. Please try again.' })
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button
              onClick={() => navigate('/')}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Home
            </button>
            <span className="text-2xl font-semibold text-gray-900">Housie</span>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Create Your Game
          </h1>
          <p className="text-lg text-gray-600">
            Configure your housie game settings and invite players
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          {/* Host Information */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Host Information</h2>

            <div className="space-y-6">
              {/* Host Name */}
              <div>
                <label htmlFor="hostName" className="block text-sm font-medium text-gray-900 mb-2">
                  Your Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="hostName"
                  name="hostName"
                  value={formData.hostName}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border ${errors.hostName ? 'border-red-500' : 'border-gray-200'} rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent`}
                  placeholder="Enter your name"
                />
                {errors.hostName && (
                  <p className="mt-1 text-sm text-red-500">{errors.hostName}</p>
                )}
              </div>

              {/* Game Title */}
              <div>
                <label htmlFor="gameTitle" className="block text-sm font-medium text-gray-900 mb-2">
                  Game Title <span className="text-gray-400">(Optional)</span>
                </label>
                <input
                  type="text"
                  id="gameTitle"
                  name="gameTitle"
                  value={formData.gameTitle}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  placeholder="e.g., Friday Night Housie"
                />
              </div>
            </div>
          </div>

          {/* Game Settings */}
          <div className="mb-8 pt-8 border-t border-gray-100">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Game Settings</h2>

            <div className="space-y-6">
              {/* Tickets Per Player */}
              <div>
                <label htmlFor="ticketsPerPlayer" className="block text-sm font-medium text-gray-900 mb-2">
                  Tickets Per Player
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    id="ticketsPerPlayer"
                    name="ticketsPerPlayer"
                    min="1"
                    max="6"
                    value={formData.ticketsPerPlayer}
                    onChange={handleInputChange}
                    className="flex-1"
                  />
                  <span className="text-2xl font-semibold text-gray-900 w-12 text-center">
                    {formData.ticketsPerPlayer}
                  </span>
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  Each player can select up to {formData.ticketsPerPlayer} ticket{formData.ticketsPerPlayer > 1 ? 's' : ''}
                </p>
              </div>

              {/* Max Players */}
              <div>
                <label htmlFor="maxPlayers" className="block text-sm font-medium text-gray-900 mb-2">
                  Maximum Players <span className="text-gray-400">(Optional)</span>
                </label>
                <input
                  type="number"
                  id="maxPlayers"
                  name="maxPlayers"
                  value={formData.maxPlayers}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border ${errors.maxPlayers ? 'border-red-500' : 'border-gray-200'} rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent`}
                  placeholder="Leave empty for unlimited"
                  min="2"
                  max="100"
                />
                {errors.maxPlayers && (
                  <p className="mt-1 text-sm text-red-500">{errors.maxPlayers}</p>
                )}
              </div>

              {/* Prize Types */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-900">
                    Prize Types <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleAddPrize}
                    className="text-sm text-gray-900 hover:text-gray-700 font-medium flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Prize Type
                  </button>
                </div>

                <div className="space-y-3">
                  {prizes.map((prize) => (
                    <div
                      key={prize.id}
                      className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={prize.enabled}
                        onChange={() => handlePrizeToggle(prize.id)}
                        className="h-4 w-4 text-gray-900 focus:ring-gray-900 border-gray-300 rounded"
                      />

                      {/* Prize Details */}
                      <div className="flex-1 min-w-0">
                        {prize.editing ? (
                          <input
                            type="text"
                            value={prize.name}
                            onChange={(e) => handlePrizeNameChange(prize.id, e.target.value)}
                            placeholder="Prize name"
                            className="w-full px-3 py-1.5 text-sm font-medium border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-gray-900"
                          />
                        ) : (
                          <div className="text-sm font-medium text-gray-900">{prize.name}</div>
                        )}
                      </div>

                      {/* Prize Amount */}
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={prize.amount}
                          onChange={(e) => handlePrizeAmountChange(prize.id, e.target.value)}
                          placeholder="Amount"
                          className="w-24 px-3 py-1.5 text-sm text-right border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-gray-900"
                        />
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-1">
                        {prize.editing ? (
                          <button
                            type="button"
                            onClick={() => handlePrizeSave(prize.id)}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                            title="Save"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handlePrizeEdit(prize.id)}
                            className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                            title="Edit"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handlePrizeDelete(prize.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {errors.prizes && (
                  <p className="mt-2 text-sm text-red-500">{errors.prizes}</p>
                )}

                <p className="mt-3 text-sm text-gray-600">
                  Enable prizes, set amounts (optional), and customize names as needed
                </p>
              </div>
            </div>
          </div>

          {/* Game Info */}
          <div className="mb-8 pt-8 border-t border-gray-100">
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Game Mode</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Private Game (Invite Only)
                </div>
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                  </svg>
                  Manual Number Calling (Host Controlled)
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex-1 px-8 py-4 bg-white text-gray-900 border-2 border-gray-200 rounded-lg font-medium hover:border-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-8 py-4 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors shadow-sm"
            >
              Create Room
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default GameSetup
