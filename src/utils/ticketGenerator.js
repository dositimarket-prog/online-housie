/**
 * Generates valid Housie/Tambola tickets following official rules:
 * - 3 rows × 9 columns = 27 cells
 * - Exactly 15 numbers per ticket (12 blanks)
 * - Each row has exactly 5 numbers and 4 blanks
 * - Each column has 1-3 numbers
 * - Numbers distributed by column: 1-9, 10-19, 20-29, ..., 80-90
 * - Numbers in each column are sorted in ascending order
 * - No duplicate numbers within a ticket
 * - Minimize duplicate numbers across multiple tickets in a game
 */

/**
 * Generates a single valid Housie ticket
 * @param {Set} usedNumbers - Optional set of numbers already used in other tickets
 * @returns {Array} 3x9 matrix representing the ticket
 */
export function generateTicket(usedNumbers = new Set()) {
  const ticket = Array(3).fill(null).map(() => Array(9).fill(null))

  // Step 1: Determine how many numbers each column will have
  // We need exactly 15 numbers distributed across 9 columns (1-3 per column)
  const columnCounts = distributeNumbersAcrossColumns()

  // Step 2: For each column, select random numbers from the column's range
  const columnNumbers = []
  for (let col = 0; col < 9; col++) {
    const minNum = col === 0 ? 1 : col * 10
    const maxNum = col === 8 ? 90 : (col + 1) * 10 - 1

    // Get available numbers for this column (not used in other tickets)
    const availableNumbers = []
    for (let num = minNum; num <= maxNum; num++) {
      if (!usedNumbers.has(num)) {
        availableNumbers.push(num)
      }
    }

    // If not enough available numbers, include used ones
    if (availableNumbers.length < columnCounts[col]) {
      for (let num = minNum; num <= maxNum; num++) {
        if (!availableNumbers.includes(num)) {
          availableNumbers.push(num)
        }
      }
    }

    // Select random numbers and sort them
    const selectedNumbers = shuffleArray(availableNumbers)
      .slice(0, columnCounts[col])
      .sort((a, b) => a - b)

    columnNumbers.push(selectedNumbers)

    // Mark these numbers as used
    selectedNumbers.forEach(num => usedNumbers.add(num))
  }

  // Step 3: Create a layout plan for which rows will have numbers in which columns
  // This ensures exactly 5 numbers per row and maintains sorting
  const layout = createTicketLayout(columnCounts)

  // Step 4: Place the sorted numbers according to the layout
  for (let col = 0; col < 9; col++) {
    const numbers = columnNumbers[col]
    const rowsForThisCol = layout[col]

    // Place numbers in rows (already sorted, so placement order = sorted order)
    for (let i = 0; i < numbers.length; i++) {
      ticket[rowsForThisCol[i]][col] = numbers[i]
    }
  }

  return ticket
}

/**
 * Creates a layout plan specifying which rows should have numbers in each column
 * Ensures each row has exactly 5 numbers total
 */
function createTicketLayout(columnCounts) {
  // Try multiple times to create a valid layout
  for (let attempt = 0; attempt < 100; attempt++) {
    const layout = tryCreateLayout(columnCounts)
    if (layout) return layout
  }

  // Fallback: force create a layout
  return forceCreateLayout(columnCounts)
}

function tryCreateLayout(columnCounts) {
  const layout = Array(9).fill(null).map(() => [])
  const rowCounts = [0, 0, 0]

  for (let col = 0; col < 9; col++) {
    const numbersInCol = columnCounts[col]

    // Get rows that can still accept numbers
    const availableRows = [0, 1, 2].filter(row => rowCounts[row] < 5)

    // Check if we can place all numbers for this column
    if (availableRows.length < numbersInCol) {
      return null // Can't create valid layout, try again
    }

    // Randomly select rows for this column
    const selectedRows = shuffleArray(availableRows)
      .slice(0, numbersInCol)
      .sort((a, b) => a - b)

    layout[col] = selectedRows
    selectedRows.forEach(row => rowCounts[row]++)
  }

  // Verify each row has exactly 5 numbers
  if (rowCounts.every(count => count === 5)) {
    return layout
  }

  return null // Invalid layout, try again
}

function forceCreateLayout(columnCounts) {
  // Create a simple valid layout when random attempts fail
  const layout = Array(9).fill(null).map(() => [])
  const rowCounts = [0, 0, 0]

  // First pass: place minimum numbers
  for (let col = 0; col < 9; col++) {
    const numbersInCol = columnCounts[col]
    const rows = []

    for (let i = 0; i < numbersInCol && i < 3; i++) {
      rows.push(i)
      rowCounts[i]++
    }

    layout[col] = rows.sort((a, b) => a - b)
  }

  // Second pass: balance rows to exactly 5 each
  for (let row = 0; row < 3; row++) {
    while (rowCounts[row] < 5) {
      // Find a column where we can add this row
      for (let col = 0; col < 9; col++) {
        if (layout[col].length < 3 && !layout[col].includes(row)) {
          layout[col].push(row)
          layout[col].sort((a, b) => a - b)
          rowCounts[row]++
          break
        }
      }
    }

    while (rowCounts[row] > 5) {
      // Find a column where we can remove this row
      for (let col = 0; col < 9; col++) {
        if (layout[col].length > 1 && layout[col].includes(row)) {
          const idx = layout[col].indexOf(row)
          layout[col].splice(idx, 1)
          rowCounts[row]--
          break
        }
      }
    }
  }

  return layout
}

/**
 * Distributes 15 numbers across 9 columns (1-3 numbers per column)
 * Ensures exactly 15 numbers total
 */
function distributeNumbersAcrossColumns() {
  const counts = Array(9).fill(1) // Start with 1 number per column (9 total)
  let remaining = 15 - 9 // Need to distribute 6 more numbers

  // Randomly add 1 more number to 6 columns (making them have 2)
  // This gives us 15 total: some columns with 1, some with 2, possibly some with 3
  const columnsToIncrease = shuffleArray([0, 1, 2, 3, 4, 5, 6, 7, 8])

  for (let i = 0; i < remaining; i++) {
    const col = columnsToIncrease[i % 9]
    if (counts[col] < 3) {
      counts[col]++
    }
  }

  return counts
}

function shuffleArray(array) {
  const newArray = [...array]
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]]
  }
  return newArray
}

/**
 * Generate multiple unique tickets with minimal number overlap
 * @param {number} count - Number of tickets to generate
 * @returns {Array} Array of ticket objects with id and numbers
 */
export function generateTickets(count) {
  const tickets = []
  const usedNumbers = new Set() // Track numbers across all tickets

  for (let i = 0; i < count; i++) {
    const ticket = generateTicket(usedNumbers)
    tickets.push({
      id: i + 1,
      numbers: ticket
    })

    // Reset usedNumbers every 6 tickets to allow number reuse
    // (6 tickets × 15 numbers = 90 numbers, which uses all available numbers)
    if ((i + 1) % 6 === 0) {
      usedNumbers.clear()
    }
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

/**
 * Validate that a ticket follows all Housie/Tambola rules
 * Useful for testing and debugging
 */
export function validateTicket(ticket) {
  const errors = []

  // Check grid size
  if (ticket.length !== 3) {
    errors.push('Ticket must have exactly 3 rows')
  }

  // Count total numbers and validate each row
  let totalNumbers = 0
  for (let row = 0; row < 3; row++) {
    if (ticket[row].length !== 9) {
      errors.push(`Row ${row} must have exactly 9 columns`)
      continue
    }

    const numbersInRow = ticket[row].filter(n => n !== null).length
    totalNumbers += numbersInRow

    if (numbersInRow !== 5) {
      errors.push(`Row ${row} has ${numbersInRow} numbers, should have exactly 5`)
    }
  }

  // Check total numbers
  if (totalNumbers !== 15) {
    errors.push(`Ticket has ${totalNumbers} numbers, should have exactly 15`)
  }

  // Validate each column
  const allNumbers = new Set()
  for (let col = 0; col < 9; col++) {
    const minNum = col === 0 ? 1 : col * 10
    const maxNum = col === 8 ? 90 : (col + 1) * 10 - 1

    const numbersInCol = []
    for (let row = 0; row < 3; row++) {
      const num = ticket[row][col]
      if (num !== null) {
        numbersInCol.push(num)

        // Check number is in valid range
        if (num < minNum || num > maxNum) {
          errors.push(`Number ${num} in column ${col} is outside valid range ${minNum}-${maxNum}`)
        }

        // Check for duplicates
        if (allNumbers.has(num)) {
          errors.push(`Duplicate number ${num} found in ticket`)
        }
        allNumbers.add(num)
      }
    }

    // Check column has at least 1 number
    if (numbersInCol.length === 0) {
      errors.push(`Column ${col} is empty, each column must have at least 1 number`)
    }

    // Check column has at most 3 numbers
    if (numbersInCol.length > 3) {
      errors.push(`Column ${col} has ${numbersInCol.length} numbers, maximum is 3`)
    }

    // Check numbers are sorted
    const sorted = [...numbersInCol].sort((a, b) => a - b)
    if (JSON.stringify(numbersInCol) !== JSON.stringify(sorted)) {
      errors.push(`Numbers in column ${col} are not sorted: [${numbersInCol}]`)
    }
  }

  return {
    valid: errors.length === 0,
    errors
  }
}
