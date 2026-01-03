/**
 * ThreeDemo — Full Bleed 3D Experience with Spotify-style Sidebar
 * "Immersive prediction markets — turntable.fm meets Final Destination!" — Nintendo Art Director
 */

import React, { useState, useCallback } from 'react'
import DanceFloor, { createBinaryOptions, createMultiOptions } from './components/stage/DanceFloor.tsx'
import CombinedSidebar from './components/ui/CombinedSidebar'
import LoadingSplash, { PartyLogo } from './components/ui/LoadingSplash'

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
  const [bets, setBets] = useState({})  // { [marketId]: { optionId, amount } }
  const [previewZone, setPreviewZone] = useState(null)  // Preview when chip hovers/placed!

  // ═══ LOADING & INTRO STATE ═══
  const [loadProgress, setLoadProgress] = useState(0)
  const [isLoaded, setIsLoaded] = useState(false)
  const [showIntro, setShowIntro] = useState(true)
  const [introComplete, setIntroComplete] = useState(false)

  const selectedMarket = MARKETS.find(m => m.id === selectedMarketId) || MARKETS[0]

  // Current market's bet
  const currentBet = bets[selectedMarketId]
  const selectedBetOption = currentBet?.optionId || null

  // ═══ ACTIVE ZONE — Preview OR locked-in bet ═══
  const activeZone = previewZone || selectedBetOption

  const handleTileClick = useCallback((optionId, col, row) => {
    console.log(`Clicked: ${optionId} at (${col}, ${row})`)
  }, [])

  const handleMarketSelect = useCallback((marketId) => {
    setSelectedMarketId(marketId)
    setPreviewZone(null)  // Reset preview when switching markets
  }, [])

  const handleBet = useCallback((optionId, amount) => {
    console.log(`Bet: $${amount} on ${optionId} for market ${selectedMarketId}`)
    // Save bet for this market
    setBets(prev => ({
      ...prev,
      [selectedMarketId]: { optionId, amount }
    }))
    // Reduce balance
    setBalance(prev => Math.max(0, prev - amount))
  }, [selectedMarketId])

  const handleBetOptionSelect = useCallback((optionId) => {
    if (optionId === null) {
      // Unlock bet — refund and remove
      const existingBet = bets[selectedMarketId]
      if (existingBet) {
        setBalance(prev => prev + existingBet.amount)
        setBets(prev => {
          const newBets = { ...prev }
          delete newBets[selectedMarketId]
          return newBets
        })
      }
    }
  }, [selectedMarketId, bets])

  const handlePreviewZone = useCallback((zoneId) => {
    setPreviewZone(zoneId)
  }, [])

  // Sidebar width constant — single source of truth
  const SIDEBAR_WIDTH = 300

  return (
    <div style={{
      display: 'flex',
      width: '100vw',
      height: '100vh',
      background: 'linear-gradient(180deg, #0a0815 0%, #1a0830 50%, #0f0620 100%)',
      overflow: 'hidden',
    }}>
      {/* LOADING SPLASH — Shows while assets load (covers everything) */}
      <LoadingSplash
        progress={loadProgress}
        isLoaded={isLoaded}
        onIntroComplete={() => {
          setShowIntro(true)
          setIntroComplete(true)  // Sidebar fades in when intro complete!
        }}
      />

      {/* ═══ LEFT: MAIN VIEWPORT (Canvas lives here) ═══ */}
      <div style={{
        flex: 1,
        position: 'relative',
        height: '100%',
        minWidth: 0, // Critical for flex shrinking!
      }}>
        {/* ═══ TOP LEFT: PARTY LOGO — Brand presence! ═══ */}
        <div style={{
          position: 'absolute',
          top: 'min(16px, 2vw)',
          left: 'min(16px, 2vw)',
          zIndex: 100,
          opacity: introComplete ? 1 : 0,
          transform: introComplete ? 'translateY(0)' : 'translateY(-20px)',
          transition: 'opacity 0.5s ease-out, transform 0.5s ease-out',
          pointerEvents: 'none',
          width: 'min(40px, 8vw)',  // Responsive: max 40px
          height: 'min(40px, 8vw)',
        }}>
          <PartyLogo size="small" className="responsive-logo" />
        </div>

        <DanceFloor
          // NO KEY! Keep Canvas alive for instant market switching
          options={selectedMarket.options}
          gridCols={24}
          gridRows={12}
          onTileClick={handleTileClick}
          dancersPerZone={7}
          marketQuestion={selectedMarket.name}
          marketIcon={selectedMarket.icon}
          selectedZone={activeZone}  // Preview OR locked-in!
          // ═══ USER'S AVATAR — Appears when they preview or lock in! ═══
          userPrediction={activeZone ? {
            zoneId: activeZone,
            avatar: '/tg/zac.jpg',  // User's avatar
          } : undefined}
          // ═══ INTRO ANIMATION ═══
          showIntro={showIntro && !introComplete}
          onLoadProgress={setLoadProgress}
          onLoadComplete={() => setIsLoaded(true)}
          onIntroComplete={() => setIntroComplete(true)}
        />
      </div>

      {/* ═══ RIGHT: SIDEBAR (Fixed width, part of flex flow) ═══ */}
      <div style={{
        width: SIDEBAR_WIDTH,
        height: '100%',
        flexShrink: 0,
        // Nintendo-style slide in from right!
        transform: introComplete ? 'translateX(0)' : 'translateX(100%)',
        opacity: introComplete ? 1 : 0,
        transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease-out',
        pointerEvents: introComplete ? 'auto' : 'none',
      }}>
        <CombinedSidebar
          markets={MARKETS}
          selectedMarketId={selectedMarketId}
          onMarketSelect={handleMarketSelect}
          onBet={handleBet}
          balance={balance}
          isOpen={sidebarOpen}
          onToggle={setSidebarOpen}
          selectedBetOption={selectedBetOption}
          onBetOptionSelect={handleBetOptionSelect}
          onPreviewZone={handlePreviewZone}  // Dance floor preview!
          isFlexLayout={true}  // Tell sidebar it's in flex layout!
          allBets={bets}  // All bets across markets!
          currentBetAmount={currentBet?.amount}  // Amount for locked indicator
        />
      </div>
    </div>
  )
}
