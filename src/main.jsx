import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import BoardDemo from './BoardDemo'
import ArenaDemo from './ArenaDemo'
import ThreeDemo from './ThreeDemo'
import './index.css'

// Check URL for demo mode: ?demo=board or ?demo=arena or ?demo=three
const params = new URLSearchParams(window.location.search)
const demoMode = params.get('demo')

const DEMOS = {
  board: BoardDemo,
  arena: ArenaDemo,
  three: ThreeDemo,
}

const RootComponent = DEMOS[demoMode] || App

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RootComponent />
  </React.StrictMode>,
)
