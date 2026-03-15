# Housie/Tambola Ticket Generation Rules

This document explains the official rules for generating valid Housie (Tambola/Bingo) tickets, as implemented in `src/utils/ticketGenerator.js`.

## Ticket Structure

### Grid Layout
- **Size**: 3 rows × 9 columns = 27 cells total
- **Numbers**: Exactly 15 numbers per ticket
- **Blanks**: Exactly 12 blank cells per ticket

### Row Requirements
- Each row must have **exactly 5 numbers** and **4 blanks**
- Numbers can be in any columns, as long as total per row = 5

### Column Requirements
- Each column must have **1 to 3 numbers** (cannot be empty)
- Total across all columns must equal 15 numbers

### Column Number Ranges
Each column is assigned a specific range of numbers:

| Column | Number Range | Example Numbers |
|--------|--------------|-----------------|
| 0      | 1-9          | 1, 5, 9         |
| 1      | 10-19        | 10, 15, 19      |
| 2      | 20-29        | 20, 25, 29      |
| 3      | 30-39        | 30, 35, 39      |
| 4      | 40-49        | 40, 45, 49      |
| 5      | 50-59        | 50, 55, 59      |
| 6      | 60-69        | 60, 65, 69      |
| 7      | 70-79        | 70, 75, 79      |
| 8      | 80-90        | 80, 85, 90      |

### Sorting Requirement
- **Within each column**, numbers must be in **ascending order** from top to bottom
- Example: If column 3 has numbers 35, 32, 39, they must appear as:
  - Row 1: 32
  - Row 2: 35
  - Row 3: 39

### No Duplicates
- Within a single ticket: **all 15 numbers must be unique**
- Across multiple tickets in a game: **minimize repetition** to avoid double-counting

## Example Valid Ticket

```
     1   10  20  30  40  50  60  70  80
   +---+---+---+---+---+---+---+---+---+
 1 | __ | 11| __ | __ | 44| 50| __ | 70| 85|  (5 numbers)
   +---+---+---+---+---+---+---+---+---+
 2 |  5| __ | 20| 34| 48| 56| __ | __ | __|  (5 numbers)
   +---+---+---+---+---+---+---+---+---+
 3 |  8| 16| __ | __ | __ | __ | 61| 78| 88|  (5 numbers)
   +---+---+---+---+---+---+---+---+---+
     2   2   1   1   2   2   1   2   2    (numbers per column)
```

### Validation Checklist:
- ✅ Total numbers: 15
- ✅ Row 1: 5 numbers (11, 44, 50, 70, 85)
- ✅ Row 2: 5 numbers (5, 20, 34, 48, 56)
- ✅ Row 3: 5 numbers (8, 16, 61, 78, 88)
- ✅ Column 0: 2 numbers (5, 8) - sorted ✓
- ✅ Column 1: 2 numbers (11, 16) - sorted ✓
- ✅ Column 2: 1 number (20)
- ✅ Column 3: 1 number (34)
- ✅ Column 4: 2 numbers (44, 48) - sorted ✓
- ✅ Column 5: 2 numbers (50, 56) - sorted ✓
- ✅ Column 6: 1 number (61)
- ✅ Column 7: 2 numbers (70, 78) - sorted ✓
- ✅ Column 8: 2 numbers (85, 88) - sorted ✓

## Multiple Tickets in a Game

### Consecutive Pair Rule (CRITICAL)
**IMPORTANT**: Consecutive odd-even ticket pairs must have NO duplicate numbers:
- Tickets 1 & 2: Must share zero numbers
- Tickets 3 & 4: Must share zero numbers
- Tickets 5 & 6: Must share zero numbers
- And so on...

This ensures fair play and prevents conflicts during prize claims.

### Number Distribution Strategy

1. **Odd-even pairs**: Each pair (1&2, 3&4, 5&6, etc.) uses completely different numbers
   - Each ticket has 15 numbers
   - Each pair uses up to 30 numbers total
   - No overlap between tickets in the same pair

2. **Across different pairs**: Numbers may repeat
   - Ticket 1 and Ticket 3 may share numbers (different pairs)
   - Ticket 2 and Ticket 4 may share numbers (different pairs)
   - Only consecutive pairs must have unique numbers

3. **Game setup limit**: Maximum 2 tickets per player
   - Prevents excessive number conflicts
   - Ensures better game balance

## Implementation

The ticket generator (`src/utils/ticketGenerator.js`) provides:

- `generateTicket(usedNumbers)` - Generate a single valid ticket
- `generateTickets(count)` - Generate multiple tickets with minimal overlap
- `validateTicket(ticket)` - Verify a ticket follows all rules
- `hasNumber(ticket, number)` - Check if a ticket contains a specific number

## Testing

Run the test suite to verify tickets are valid:

```bash
node src/utils/ticketGenerator.test.js
```

## References

Based on official Housie/Tambola rules:
- [Housie Ticket Generator using Python - DEV Community](https://dev.to/jamesshah/housie-tambola-ticket-generator-using-python-31m1)
- [Generating tickets for tambola - Artful Dev](https://journal.artful.dev/generating-tickets-for-tambola-or-bingo-or-housie-or-whatever/)
- [Tambola Rules - Junglee Tambola](http://www.jungleetambola.com/tambola-rules/)
