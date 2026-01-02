/**
 * ThreeDemo — Universal DanceFloor Showcase
 * "Test the universal grid with 2, 3, and 5 options!" — Miyamoto
 */

import React, { useState } from 'react'
import DanceFloor, { createBinaryOptions, createMultiOptions } from './components/stage/DanceFloor.tsx'

// ═══════════════════════════════════════════════════════════════════════════
// TEST DATA — Different market configurations
// ═══════════════════════════════════════════════════════════════════════════

// Binary (Yes/No)
const BINARY_OPTIONS = createBinaryOptions(62)

// 3 Options (Presidential)
const THREE_OPTIONS = createMultiOptions([
  { id: 'jd', label: 'J.D. Vance', pct: 38, color: '#00FF00' },
  { id: 'gavin', label: 'Gavin Newsom', pct: 32, color: '#4DA6FF' },
  { id: 'aoc', label: 'AOC', pct: 30, color: '#BF00FF' },
])

// 5 Options (Multi-candidate)
const FIVE_OPTIONS = createMultiOptions([
  { id: 'jd', label: 'J.D. Vance', pct: 35, color: '#00FF00' },
  { id: 'gavin', label: 'Gavin Newsom', pct: 28, color: '#4DA6FF' },
  { id: 'aoc', label: 'AOC', pct: 18, color: '#BF00FF' },
  { id: 'desantis', label: 'DeSantis', pct: 12, color: '#FF6600' },
  { id: 'other', label: 'Other', pct: 7, color: '#888888' },
])

// 7 Options (Stress test)
const SEVEN_OPTIONS = createMultiOptions([
  { id: 'a', label: 'Alpha', pct: 25 },
  { id: 'b', label: 'Beta', pct: 20 },
  { id: 'c', label: 'Gamma', pct: 18 },
  { id: 'd', label: 'Delta', pct: 15 },
  { id: 'e', label: 'Epsilon', pct: 10 },
  { id: 'f', label: 'Zeta', pct: 7 },
  { id: 'g', label: 'Eta', pct: 5 },
])

const PRESETS = {
  binary: { name: 'Binary (Yes/No)', options: BINARY_OPTIONS },
  three: { name: '3 Options', options: THREE_OPTIONS },
  five: { name: '5 Options', options: FIVE_OPTIONS },
  seven: { name: '7 Options', options: SEVEN_OPTIONS },
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN DEMO COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
export default function ThreeDemo() {
  const [preset, setPreset] = useState('three')
  const currentPreset = PRESETS[preset]

  const handleTileClick = (optionId, col, row) => {
    console.log(`Clicked: ${optionId} at (${col}, ${row})`)
  }

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: 'linear-gradient(180deg, #0a0815 0%, #1a0830 50%, #0f0620 100%)',
      overflow: 'hidden',
      position: 'relative',
    }}>
      {/* Header */}
      <div style={{
        position: 'absolute',
        top: 20,
        left: 0,
        right: 0,
        textAlign: 'center',
        zIndex: 100,
        pointerEvents: 'none',
      }}>
        <div style={{
          display: 'inline-block',
          background: 'rgba(0,0,0,0.9)',
          border: '3px solid #ffd700',
          borderRadius: '12px',
          padding: '12px 32px',
          boxShadow: '0 0 40px rgba(255, 215, 0, 0.3)',
        }}>
          <div style={{
            color: '#ff4444',
            fontSize: '12px',
            fontWeight: 600,
            letterSpacing: '2px',
            marginBottom: '4px',
          }}>
            🔴 LIVE — UNIVERSAL DANCEFLOOR
          </div>
          <h1 style={{
            color: '#fff',
            fontSize: '20px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '3px',
            margin: 0,
          }}>
            {currentPreset.name}
          </h1>
          <div style={{
            marginTop: '8px',
            display: 'flex',
            justifyContent: 'center',
            gap: '12px',
            fontSize: '13px',
            fontWeight: 600,
            flexWrap: 'wrap',
          }}>
            {currentPreset.options.map(opt => (
              <span key={opt.id} style={{ color: opt.color }}>
                {opt.label.split(' ')[0]} {opt.pct}%
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Preset Selector */}
      <div style={{
        position: 'absolute',
        top: 20,
        right: 20,
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}>
        {Object.entries(PRESETS).map(([key, { name }]) => (
          <button
            key={key}
            onClick={() => setPreset(key)}
            style={{
              padding: '10px 16px',
              background: preset === key ? '#ffd700' : 'rgba(0,0,0,0.8)',
              color: preset === key ? '#000' : '#fff',
              border: preset === key ? 'none' : '2px solid #444',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '13px',
              transition: 'all 0.2s',
            }}
          >
            {name}
          </button>
        ))}
      </div>

      {/* THE UNIVERSAL DANCEFLOOR */}
      <div style={{
        width: '100%',
        height: '100%',
        paddingTop: '80px',
      }}>
        <DanceFloor
          key={preset} // Force remount on preset change
          options={currentPreset.options}
          gridCols={24}
          gridRows={12}
          onTileClick={handleTileClick}
          dancersPerZone={7} // 7 dancers per zone — TG group vibes!
        />
      </div>

      {/* Footer */}
      <div style={{
        position: 'absolute',
        bottom: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(0,0,0,0.8)',
        padding: '10px 24px',
        borderRadius: '20px',
        border: '1px solid #333',
        zIndex: 100,
      }}>
        <span style={{ color: '#888', fontSize: '13px' }}>
          Universal DanceFloor — ONE component for ANY number of options
        </span>
      </div>
    </div>
  )
}
