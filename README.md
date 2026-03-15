# Online Housie

A real-time multiplayer housie/bingo game built with React, Vite, and Supabase.

## Features

- 🎮 **Multiplayer** - Play with friends in real-time
- 🎲 **No Sign-up Required** - Join games instantly with a game code
- 🏆 **Custom Prizes** - Set up your own prize structure
- 🔄 **Real-time Updates** - See called numbers and prize claims instantly
- 📱 **Responsive Design** - Play on any device

## Tech Stack

- **Frontend**: React 19, Vite 8, Tailwind CSS v4
- **Backend**: Supabase (PostgreSQL + Real-time)
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/dositimarket-prog/online-housie.git
cd online-housie
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and add your Supabase credentials:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Run the development server:
```bash
npm run dev
```

## Database Setup

Run the SQL migration script in your Supabase project:
```bash
# Copy contents of supabase-migration.sql to your Supabase SQL Editor
```

## Deployment

Deploy to Vercel:

1. Import your GitHub repository in Vercel
2. Add environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
3. Deploy!

## How to Play

1. **Create Game** - Host creates a game with custom settings
2. **Join Game** - Players join using the game code
3. **Select Tickets** - Each player selects their tickets
4. **Start Game** - Host starts when everyone is ready
5. **Play** - Host calls numbers, players mark their tickets
6. **Claim Prizes** - Players claim prizes as they complete patterns

## License

MIT
