import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import BoardDemo from './BoardDemo'
import ArenaDemo from './ArenaDemo'
import ThreeDemo from './ThreeDemo'
import './index.css'

// ═══════════════════════════════════════════════════════════════════════════
// ROUTE CONFIG — Three.js is the MAIN experience!
// Fallbacks: ?demo=css (old), ?demo=arena (isometric), ?demo=board (board)
// ═══════════════════════════════════════════════════════════════════════════
const params = new URLSearchParams(window.location.search)
const demoMode = params.get('demo')

const DEMOS = {
  css: App,           // Legacy CSS version — fallback
  board: BoardDemo,   // Board game prototype
  arena: ArenaDemo,   // Isometric CSS arena
}

// THREE.JS IS NOW THE DEFAULT!
const RootComponent = DEMOS[demoMode] || ThreeDemo

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RootComponent />
  </React.StrictMode>,
)
