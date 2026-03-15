import { useState, useEffect } from 'react'
import Ticket from './Ticket'
import { generateTickets } from '../utils/ticketGenerator'

/**
 * TicketSelector - Modal for browsing and selecting tickets
 */
function TicketSelector({ isOpen, onClose, maxTickets, onConfirm, initialSelected = [] }) {
  const [availableTickets, setAvailableTickets] = useState([])
  const [selectedTickets, setSelectedTickets] = useState(initialSelected)

  useEffect(() => {
    // Generate pool of tickets to choose from (20 tickets)
    const tickets = generateTickets(20)
    setAvailableTickets(tickets)
  }, [])

  const handleTicketSelect = (ticket) => {
    if (selectedTickets.find(t => t.id === ticket.id)) {
      // Deselect
      setSelectedTickets(selectedTickets.filter(t => t.id !== ticket.id))
    } else if (selectedTickets.length < maxTickets) {
      // Select
      setSelectedTickets([...selectedTickets, ticket])
    }
  }

  const handleConfirm = () => {
    onConfirm(selectedTickets)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Select Your Tickets</h2>
              <p className="text-sm text-gray-600 mt-1">
                Choose up to {maxTickets} ticket{maxTickets > 1 ? 's' : ''} • {selectedTickets.length} / {maxTickets} selected
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tickets Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {availableTickets.map((ticket) => (
              <Ticket
                key={ticket.id}
                ticket={ticket.numbers}
                ticketNumber={ticket.id}
                selected={selectedTickets.find(t => t.id === ticket.id)}
                onSelect={() => handleTicketSelect(ticket)}
                size="small"
              />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-white text-gray-900 border-2 border-gray-200 rounded-lg font-medium hover:border-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={selectedTickets.length === 0}
              className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
                selectedTickets.length > 0
                  ? 'bg-gray-900 text-white hover:bg-gray-800'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              Confirm Selection ({selectedTickets.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TicketSelector
