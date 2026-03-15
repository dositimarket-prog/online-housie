import { useState, useEffect } from 'react'
import Ticket from './Ticket'
import { generateTickets } from '../utils/ticketGenerator'

/**
 * TicketSelector - Modal for browsing and selecting tickets
 */
function TicketSelector({ isOpen, onClose, maxTickets, totalTickets = 20, onConfirm, initialSelected = [] }) {
  const [availableTickets, setAvailableTickets] = useState([])
  const [selectedTickets, setSelectedTickets] = useState(initialSelected)

  useEffect(() => {
    // Generate pool of tickets to choose from
    const tickets = generateTickets(totalTickets)
    setAvailableTickets(tickets)
  }, [totalTickets])

  const handleTicketSelect = (ticket) => {
    // Find the pair partner for this ticket (1&2, 3&4, 5&6, etc.)
    const getPairPartnerId = (id) => {
      // If odd (1, 3, 5...), partner is id + 1
      // If even (2, 4, 6...), partner is id - 1
      return id % 2 === 1 ? id + 1 : id - 1
    }

    const partnerId = getPairPartnerId(ticket.id)
    const partnerTicket = availableTickets.find(t => t.id === partnerId)

    const isCurrentlySelected = selectedTickets.find(t => t.id === ticket.id)

    if (isCurrentlySelected) {
      // Deselect both this ticket and its pair partner
      setSelectedTickets(selectedTickets.filter(t => t.id !== ticket.id && t.id !== partnerId))
    } else {
      // Check if we have room for both tickets
      const partnerAlreadySelected = selectedTickets.find(t => t.id === partnerId)
      const ticketsToAdd = partnerAlreadySelected ? 1 : 2 // If partner is already selected, only add 1

      if (selectedTickets.length + ticketsToAdd <= maxTickets) {
        // Select both this ticket and its pair partner (if not already selected)
        const newSelection = [...selectedTickets, ticket]
        if (partnerTicket && !partnerAlreadySelected) {
          newSelection.push(partnerTicket)
        }
        setSelectedTickets(newSelection)
      }
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
              <p className="text-xs text-blue-600 mt-1">
                💡 Tickets are paired (1&2, 3&4, etc.) - selecting one automatically selects its pair
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
            {availableTickets.map((ticket) => {
              // Determine if this is the first ticket in a pair (odd ID)
              const isFirstInPair = ticket.id % 2 === 1
              const partnerId = ticket.id % 2 === 1 ? ticket.id + 1 : ticket.id - 1

              return (
                <div key={ticket.id} className="relative">
                  {isFirstInPair && (
                    <div className="absolute -top-2 -left-2 bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full font-medium z-10">
                      Pair {Math.ceil(ticket.id / 2)}
                    </div>
                  )}
                  <Ticket
                    ticket={ticket.numbers}
                    ticketNumber={ticket.id}
                    selected={selectedTickets.find(t => t.id === ticket.id)}
                    onSelect={() => handleTicketSelect(ticket)}
                    size="small"
                  />
                </div>
              )
            })}
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
