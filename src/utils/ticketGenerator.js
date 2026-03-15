/**
 * Generates a valid Housie/Tambola ticket
 * Rules:
 * - 3 rows × 9 columns = 27 cells
 * - Each row has exactly 5 numbers and 4 blank spaces
 * - Numbers distributed by column: 1-9, 10-19, 20-29, ..., 80-90
 * - No column can be completely empty
 */

export function generateTicket() {
  const ticket = Array(3).fill(null).map(() => Array(9).fill(null))

  // For each column, determine which numbers to place
  for (let col = 0; col < 9; col++) {
    // Get available numbers for this column
    const minNum = col === 0 ? 1 : col * 10
    const maxNum = col === 8 ? 90 : (col + 1) * 10 - 1

    // Get random numbers for this column (1-3 numbers per column)
    const numbersInColumn = getRandomInt(1, 3)
    const availableNumbers = []
    for (let num = minNum; num <= maxNum; num++) {
      availableNumbers.push(num)
    }

    // Shuffle and pick random numbers
    const selectedNumbers = shuffleArray(availableNumbers).slice(0, numbersInColumn).sort((a, b) => a - b)

    // Distribute numbers across rows ensuring each row gets 5 numbers total
    const availableRows = [0, 1, 2]
    for (let i = 0; i < selectedNumbers.length; i++) {
      const rowIndex = availableRows[Math.floor(Math.random() * availableRows.length)]
      ticket[rowIndex][col] = selectedNumbers[i]

      // Remove row from available if it has 5 numbers already
      const numbersInRow = ticket[rowIndex].filter(n => n !== null).length
      if (numbersInRow >= 5) {
        const idx = availableRows.indexOf(rowIndex)
        if (idx > -1) availableRows.splice(idx, 1)
      }
    }
  }

  // Balance rows to ensure each has exactly 5 numbers
  balanceTicketRows(ticket)

  return ticket
}

function balanceTicketRows(ticket) {
  // Count numbers in each row
  for (let row = 0; row < 3; row++) {
    let numbersInRow = ticket[row].filter(n => n !== null).length

    // If row has more than 5, remove excess
    while (numbersInRow > 5) {
      const randomCol = Math.floor(Math.random() * 9)
      if (ticket[row][randomCol] !== null) {
        // Try to move to another row with space
        for (let otherRow = 0; otherRow < 3; otherRow++) {
          if (otherRow !== row) {
            const otherRowCount = ticket[otherRow].filter(n => n !== null).length
            if (otherRowCount < 5 && ticket[otherRow][randomCol] === null) {
              ticket[otherRow][randomCol] = ticket[row][randomCol]
              ticket[row][randomCol] = null
              break
            }
          }
        }
        if (ticket[row][randomCol] !== null) {
          ticket[row][randomCol] = null
        }
        numbersInRow = ticket[row].filter(n => n !== null).length
      }
    }

    // If row has less than 5, try to fill it
    while (numbersInRow < 5) {
      // Find a column with available space
      for (let col = 0; col < 9; col++) {
        if (ticket[row][col] === null) {
          // Try to move a number from another row
          for (let otherRow = 0; otherRow < 3; otherRow++) {
            if (otherRow !== row && ticket[otherRow][col] !== null) {
              const otherRowCount = ticket[otherRow].filter(n => n !== null).length
              if (otherRowCount > 5) {
                ticket[row][col] = ticket[otherRow][col]
                ticket[otherRow][col] = null
                numbersInRow++
                break
              }
            }
          }
        }
        if (numbersInRow >= 5) break
      }
      if (numbersInRow < 5) break // Can't balance further
    }
  }
}

function shuffleArray(array) {
  const newArray = [...array]
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]]
  }
  return newArray
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/**
 * Generate multiple unique tickets
 */
export function generateTickets(count) {
  const tickets = []
  for (let i = 0; i < count; i++) {
    tickets.push({
      id: i + 1,
      numbers: generateTicket()
    })
  }
  return tickets
}

/**
 * Check if a number is present in a ticket
 */
export function hasNumber(ticket, number) {
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 9; col++) {
      if (ticket[row][col] === number) {
        return true
      }
    }
  }
  return false
}
