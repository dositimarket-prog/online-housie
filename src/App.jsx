import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import GameSetup from './pages/GameSetup'
import Lobby from './pages/Lobby'
import Game from './pages/Game'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/create-game" element={<GameSetup />} />
        <Route path="/lobby/:gameCode" element={<Lobby />} />
        <Route path="/game/:gameCode" element={<Game />} />
      </Routes>
    </Router>
  )
}

export default App
