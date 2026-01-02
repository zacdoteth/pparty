/**
 * ArenaDemo — Test the Holographic Stage
 * "Cyberpunk Tabletop Game for Prediction Markets"
 */

import React, { useState } from 'react'
import IsometricArena from './components/arena/IsometricArena'

// Example outcomes
const DEMO_OUTCOMES = {
  binary: [
    { id: 'yes', color: '#00F0FF', label: 'YES', pct: 72 },
    { id: 'no', color: '#FF0055', label: 'NO', pct: 28 },
  ],
  election: [
    { id: 'vance', color: '#00FF88', label: 'VANCE', pct: 38 },
    { id: 'newsom', color: '#4DA6FF', label: 'NEWSOM', pct: 32 },
    { id: 'aoc', color: '#BF00FF', label: 'AOC', pct: 18 },
  ],
}

export default function ArenaDemo() {
  const [mode, setMode] = useState('binary')
  const [lastDrop, setLastDrop] = useState(null)

  const outcomes = DEMO_OUTCOMES[mode]
  const question = mode === 'binary'
    ? 'Will BTC hit $100k by Dec 31?'
    : 'Next US President 2028?'

  const handleZoneDrop = (zoneId) => {
    setLastDrop(zoneId)
    console.log('Dropped on zone:', zoneId)
  }

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: '#0a0612',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Controls */}
      <div style={{
        display: 'flex',
        gap: '12px',
        padding: '16px',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.5)',
        borderBottom: '1px solid rgba(0,255,255,0.2)',
      }}>
        <button
          onClick={() => setMode('binary')}
          style={{
            padding: '8px 20px',
            background: mode === 'binary' ? '#00F0FF' : 'transparent',
            color: mode === 'binary' ? '#000' : '#00F0FF',
            border: '2px solid #00F0FF',
            borderRadius: '8px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          BINARY (YES/NO)
        </button>
        <button
          onClick={() => setMode('election')}
          style={{
            padding: '8px 20px',
            background: mode === 'election' ? '#BF00FF' : 'transparent',
            color: mode === 'election' ? '#000' : '#BF00FF',
            border: '2px solid #BF00FF',
            borderRadius: '8px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          3-WAY (ELECTION)
        </button>

        {lastDrop && (
          <div style={{
            padding: '8px 16px',
            background: 'rgba(0,255,0,0.2)',
            border: '1px solid #0f0',
            borderRadius: '8px',
            color: '#0f0',
            fontWeight: 700,
          }}>
            Last drop: {lastDrop.toUpperCase()}
          </div>
        )}
      </div>

      {/* Arena */}
      <div style={{ flex: 1 }}>
        <IsometricArena
          outcomes={outcomes}
          currentUser={{ username: 'zac.eth', avatar: '/tg/zac.jpg' }}
          onZoneDrop={handleZoneDrop}
          marketQuestion={question}
        />
      </div>
    </div>
  )
}





