/**
 * Tests for Housie/Tambola ticket generator
 * Run with: node ticketGenerator.test.js
 */

import { generateTicket, generateTickets, validateTicket, hasNumber } from './ticketGenerator.js'

console.log('🎫 Testing Housie Ticket Generator\n')

// Test 1: Generate a single ticket and validate it
console.log('Test 1: Generate and validate a single ticket')
const singleTicket = generateTicket()
const validation = validateTicket(singleTicket)

console.log('Ticket:')
singleTicket.forEach((row, i) => {
  console.log(`Row ${i + 1}:`, row.map(n => n === null ? '__' : String(n).padStart(2, ' ')).join(' '))
})

console.log('\nValidation result:', validation.valid ? '✅ PASS' : '❌ FAIL')
if (!validation.valid) {
  console.log('Errors:', validation.errors)
}

// Test 2: Generate multiple tickets
console.log('\n\nTest 2: Generate 3 tickets')
const tickets = generateTickets(3)

tickets.forEach((ticket, idx) => {
  console.log(`\nTicket ${idx + 1}:`)
  ticket.numbers.forEach((row, i) => {
    console.log(`Row ${i + 1}:`, row.map(n => n === null ? '__' : String(n).padStart(2, ' ')).join(' '))
  })

  const val = validateTicket(ticket.numbers)
  console.log('Valid:', val.valid ? '✅' : '❌')
  if (!val.valid) {
    console.log('Errors:', val.errors)
  }
})

// Test 3: Check number distribution in consecutive odd-even pairs
console.log('\n\nTest 3: Check for duplicate numbers in consecutive odd-even pairs')
const sixTickets = generateTickets(6)

// Check pairs: 1&2, 3&4, 5&6
const pairs = [
  [0, 1], // Tickets 1 & 2
  [2, 3], // Tickets 3 & 4
  [4, 5]  // Tickets 5 & 6
]

let allPairsValid = true

pairs.forEach(([idx1, idx2]) => {
  const ticket1Numbers = new Set()
  const ticket2Numbers = new Set()

  // Collect numbers from ticket 1
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 9; col++) {
      const num = sixTickets[idx1].numbers[row][col]
      if (num !== null) ticket1Numbers.add(num)
    }
  }

  // Collect numbers from ticket 2
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 9; col++) {
      const num = sixTickets[idx2].numbers[row][col]
      if (num !== null) ticket2Numbers.add(num)
    }
  }

  // Find duplicates
  const duplicates = [...ticket1Numbers].filter(num => ticket2Numbers.has(num))

  if (duplicates.length === 0) {
    console.log(`✅ Tickets ${idx1 + 1} & ${idx2 + 1}: No duplicate numbers`)
  } else {
    console.log(`❌ Tickets ${idx1 + 1} & ${idx2 + 1}: Found ${duplicates.length} duplicates: ${duplicates.slice(0, 5).join(', ')}${duplicates.length > 5 ? '...' : ''}`)
    allPairsValid = false
  }
})

if (allPairsValid) {
  console.log('\n✅ All consecutive pairs have NO duplicate numbers!')
} else {
  console.log('\n❌ Some pairs have duplicates - needs fixing')
}

// Test 4: Test hasNumber function
console.log('\n\nTest 4: Test hasNumber function')
const testTicket = generateTicket()
const firstNumber = testTicket[0].find(n => n !== null)
const hasTen = hasNumber(testTicket, firstNumber)
const hasNegative = hasNumber(testTicket, -1)

console.log(`Ticket has ${firstNumber}:`, hasTen ? '✅' : '❌')
console.log(`Ticket has -1:`, hasNegative ? '❌ PASS' : '✅')

console.log('\n✅ All tests completed!')
