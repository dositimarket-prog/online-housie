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

// Test 3: Check number distribution across multiple tickets
console.log('\n\nTest 3: Check for duplicate numbers across first 6 tickets')
const sixTickets = generateTickets(6)
const numberCounts = {}

sixTickets.forEach((ticket, ticketIdx) => {
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 9; col++) {
      const num = ticket.numbers[row][col]
      if (num !== null) {
        if (!numberCounts[num]) {
          numberCounts[num] = []
        }
        numberCounts[num].push(ticketIdx + 1)
      }
    }
  }
})

const duplicates = Object.entries(numberCounts).filter(([num, tickets]) => tickets.length > 1)

if (duplicates.length === 0) {
  console.log('✅ No duplicate numbers across first 6 tickets (optimal!)')
} else {
  console.log(`⚠️  Found ${duplicates.length} numbers used in multiple tickets:`)
  duplicates.slice(0, 5).forEach(([num, tickets]) => {
    console.log(`   Number ${num} appears in tickets: ${tickets.join(', ')}`)
  })
  if (duplicates.length > 5) {
    console.log(`   ... and ${duplicates.length - 5} more`)
  }
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
