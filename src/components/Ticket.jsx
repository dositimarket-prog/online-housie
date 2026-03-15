/**
 * Ticket component - Displays a housie/tambola ticket
 */
function Ticket({ ticket, ticketNumber, selected, onSelect, size = 'normal', markedNumbers = [] }) {
  const isSmall = size === 'small'
  const isTiny = size === 'tiny'

  return (
    <div
      onClick={onSelect}
      className={`
        bg-white rounded-lg border-2 transition-all
        ${selected ? 'border-gray-900 shadow-lg' : 'border-gray-200 hover:border-gray-400'}
        ${onSelect ? 'cursor-pointer' : ''}
        ${isSmall ? 'p-2' : isTiny ? 'p-1' : 'p-4'}
      `}
    >
      {ticketNumber && (
        <div className={`text-center font-semibold text-gray-900 ${isSmall ? 'text-xs mb-1' : isTiny ? 'text-xs mb-0.5' : 'text-sm mb-2'}`}>
          Ticket #{ticketNumber}
        </div>
      )}

      <div className={`grid grid-cols-9 ${isSmall ? 'gap-0.5' : isTiny ? 'gap-0' : 'gap-1'}`}>
        {ticket.map((row, rowIndex) =>
          row.map((cell, colIndex) => {
            const isMarked = markedNumbers && markedNumbers.includes(cell)
            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={`
                  ${isSmall ? 'h-6 w-6 text-xs' : isTiny ? 'h-4 w-4 text-[10px]' : 'h-10 w-10 text-sm'}
                  flex items-center justify-center font-semibold rounded
                  ${cell === null
                    ? 'bg-gray-50'
                    : isMarked
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }
                  ${cell !== null && !isMarked ? 'border border-gray-200' : ''}
                `}
              >
                {cell !== null && cell}
              </div>
            )
          })
        )}
      </div>

      {selected && (
        <div className="mt-2 text-center">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-900 text-white">
            ✓ Selected
          </span>
        </div>
      )}
    </div>
  )
}

export default Ticket
