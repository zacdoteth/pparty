/**
 * ThreeDemo — Full Bleed 3D Experience with Spotify-style Sidebar
 * "Immersive prediction markets — turntable.fm meets Final Destination!" — Nintendo Art Director
 */

import React, { useState, useCallback } from 'react'
import DanceFloor, { createBinaryOptions, createMultiOptions } from './components/stage/DanceFloor.tsx'
import CombinedSidebar from './components/ui/CombinedSidebar'

// ═══════════════════════════════════════════════════════════════════════════
// MARKET DATA — Different market configurations
// ═══════════════════════════════════════════════════════════════════════════

const MARKETS = [
  {
    id: 'president-2028',
    name: 'Who wins 2028 Presidential Election?',
    icon: '🗳️',  // PREMOJI STYLE!
    volume: '847K',
    options: createMultiOptions([
      { id: 'jd', label: 'J.D. Vance', pct: 38, color: '#00FF00' },
      { id: 'gavin', label: 'Gavin Newsom', pct: 32, color: '#4DA6FF' },
      { id: 'aoc', label: 'AOC', pct: 30, color: '#BF00FF' },
    ]),
  },
  {
    id: 'super-bowl',
    name: 'Super Bowl Champion 2026',
    icon: '🏈',  // PREMOJI STYLE!
    volume: '234K',
    options: createMultiOptions([
      { id: 'chiefs', label: 'Chiefs', pct: 28, color: '#E31837' },
      { id: 'eagles', label: 'Eagles', pct: 22, color: '#004C54' },
      { id: 'lions', label: 'Lions', pct: 20, color: '#0076B6' },
      { id: 'bills', label: 'Bills', pct: 18, color: '#00338D' },
      { id: 'other', label: 'Other', pct: 12, color: '#888888' },
    ]),
  },
  {
    id: 'bitcoin-100k',
    name: 'Bitcoin above $100K by March?',
    icon: '₿',  // PREMOJI STYLE!
    volume: '156K',
    options: createBinaryOptions(62),
  },
  {
    id: 'ai-agi',
    name: 'AGI announced by 2026?',
    icon: '🤖',  // PREMOJI STYLE!
    volume: '89K',
    options: createBinaryOptions(35),
  },
  {
    id: 'oscar-best-picture',
    name: 'Oscar Best Picture 2025?',
    icon: '🏆',  // PREMOJI STYLE!
    volume: '45K',
    options: createMultiOptions([
      { id: 'anora', label: 'Anora', pct: 42, color: '#FFD700' },
      { id: 'conclave', label: 'Conclave', pct: 28, color: '#C0C0C0' },
      { id: 'brutalist', label: 'Brutalist', pct: 18, color: '#CD7F32' },
      { id: 'other', label: 'Other', pct: 12, color: '#888888' },
    ]),
  },
]

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
export default function ThreeDemo() {
  const [selectedMarketId, setSelectedMarketId] = useState(MARKETS[0].id)
  const [balance, setBalance] = useState(250)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selectedBetOption, setSelectedBetOption] = useState(null)

  const selectedMarket = MARKETS.find(m => m.id === selectedMarketId) || MARKETS[0]

  const handleTileClick = useCallback((optionId, col, row) => {
    console.log(`Clicked: ${optionId} at (${col}, ${row})`)
  }, [])

  const handleMarketSelect = useCallback((marketId) => {
    setSelectedMarketId(marketId)
    setSelectedBetOption(null)  // Reset bet selection when changing markets
  }, [])

  const handleBet = useCallback((optionId, amount) => {
    console.log(`Bet: $${amount} on ${optionId}`)
    // Demo: just reduce balance
    setBalance(prev => Math.max(0, prev - amount))
  }, [])

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: 'linear-gradient(180deg, #0a0815 0%, #1a0830 50%, #0f0620 100%)',
      overflow: 'hidden',
      position: 'relative',
    }}>
      {/* FULL BLEED THREE.JS SCENE — positioned absolutely to fill container */}
      <div style={{ position: 'absolute', inset: 0 }}>
        <DanceFloor
        key={selectedMarketId}
        options={selectedMarket.options}
        gridCols={24}
        gridRows={12}
        onTileClick={handleTileClick}
        dancersPerZone={7}
        marketQuestion={selectedMarket.name}
        marketIcon={selectedMarket.icon}
        selectedZone={selectedBetOption}
        />
      </div>

      {/* SPOTIFY-STYLE SIDEBAR */}
      <CombinedSidebar
        markets={MARKETS}
        selectedMarketId={selectedMarketId}
        onMarketSelect={handleMarketSelect}
        onBet={handleBet}
        balance={balance}
        isOpen={sidebarOpen}
        onToggle={setSidebarOpen}
        selectedBetOption={selectedBetOption}
        onBetOptionSelect={setSelectedBetOption}
      />
    </div>
  )
}
