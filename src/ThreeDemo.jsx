/**
 * ThreeDemo — GAME HUD LAYOUT
 * "The 3D scene IS the app. UI floats on top like a cockpit." — CTO
 *
 * Inspired by: Fortnite, Cyberpunk 2077, Destiny 2
 */

import React, { useState, useCallback, useEffect } from 'react'

// ═══════════════════════════════════════════════════════════════════════════
// MOBILE DETECTION HOOK
// ═══════════════════════════════════════════════════════════════════════════

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < breakpoint : false
  )

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < breakpoint)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [breakpoint])

  return isMobile
}
import DanceFloor, { createBinaryOptions, createMultiOptions } from './components/stage/DanceFloor.tsx'
import LoadingSplash, { PartyLogo } from './components/ui/LoadingSplash'

// ═══════════════════════════════════════════════════════════════════════════
// MARKET DATA — Different market configurations
// ═══════════════════════════════════════════════════════════════════════════

const MARKETS = [
  {
    id: 'president-2028',
    name: 'Who wins 2028 Presidential Election?',
    icon: '🗳️',
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
    icon: '🏈',
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
    icon: '₿',
    volume: '156K',
    options: createBinaryOptions(62),
  },
  {
    id: 'ai-agi',
    name: 'AGI announced by 2026?',
    icon: '🤖',
    volume: '89K',
    options: createBinaryOptions(35),
  },
  {
    id: 'oscar-best-picture',
    name: 'Oscar Best Picture 2025?',
    icon: '🏆',
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
// GLASS PANEL STYLES — Reusable HUD aesthetic
// ═══════════════════════════════════════════════════════════════════════════

const glassPanel = {
  background: 'rgba(0, 0, 0, 0.6)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '16px',
}

const glassText = {
  color: '#fff',
  fontFamily: "'Space Grotesk', -apple-system, sans-serif",
  textShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function ThreeDemo() {
  const isMobile = useIsMobile()
  const [selectedMarketId, setSelectedMarketId] = useState(MARKETS[0].id)
  const [balance, setBalance] = useState(250)
  const [bets, setBets] = useState({})
  const [previewZone, setPreviewZone] = useState(null)
  const [marketMenuOpen, setMarketMenuOpen] = useState(false)

  // ═══ LOADING & INTRO STATE ═══
  const [loadProgress, setLoadProgress] = useState(0)
  const [isLoaded, setIsLoaded] = useState(false)
  const [showIntro, setShowIntro] = useState(true)
  const [introComplete, setIntroComplete] = useState(false)

  const selectedMarket = MARKETS.find(m => m.id === selectedMarketId) || MARKETS[0]
  const currentBet = bets[selectedMarketId]
  const selectedBetOption = currentBet?.optionId || null
  const activeZone = previewZone || selectedBetOption

  const handleTileClick = useCallback((optionId) => {
    // Direct tile click = preview that zone
    setPreviewZone(optionId)
  }, [])

  const handleMarketSelect = useCallback((marketId) => {
    setSelectedMarketId(marketId)
    setPreviewZone(null)
    setMarketMenuOpen(false)
  }, [])

  const handleBet = useCallback((optionId, amount) => {
    setBets(prev => ({
      ...prev,
      [selectedMarketId]: { optionId, amount }
    }))
    setBalance(prev => Math.max(0, prev - amount))
    setPreviewZone(null)
  }, [selectedMarketId])

  const handleUnlock = useCallback(() => {
    const existingBet = bets[selectedMarketId]
    if (existingBet) {
      setBalance(prev => prev + existingBet.amount)
      setBets(prev => {
        const newBets = { ...prev }
        delete newBets[selectedMarketId]
        return newBets
      })
    }
  }, [selectedMarketId, bets])

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER — THE COCKPIT
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <>
      {/* ═══ LOADING SPLASH (z-50) ═══ */}
      <LoadingSplash
        progress={loadProgress}
        isLoaded={isLoaded}
        onIntroComplete={() => {
          setShowIntro(true)
          setIntroComplete(true)
        }}
      />

      {/* ═══ LAYER 0: FULL-SCREEN 3D CANVAS ═══ */}
      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
      }}>
        <DanceFloor
          options={selectedMarket.options}
          gridCols={24}
          gridRows={12}
          onTileClick={handleTileClick}
          dancersPerZone={7}
          marketQuestion={selectedMarket.name}
          marketIcon={selectedMarket.icon}
          selectedZone={activeZone}
          userPrediction={activeZone ? {
            zoneId: activeZone,
            avatar: '/tg/zac.jpg',
          } : undefined}
          showIntro={showIntro && !introComplete}
          onLoadProgress={setLoadProgress}
          onLoadComplete={() => setIsLoaded(true)}
          onIntroComplete={() => setIntroComplete(true)}
        />
      </div>

      {/* ═══ LAYER 10: HUD OVERLAY ═══ */}
      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10,
        pointerEvents: 'none', // Allow clicks through to canvas
        opacity: introComplete ? 1 : 0,
        transition: 'opacity 0.5s ease-out',
      }}>

        {/* ═══ TOP LEFT: THE QUEST (Market Question) ═══ */}
        <div style={{
          position: 'absolute',
          top: isMobile ? 8 : 16,
          left: isMobile ? 8 : 16,
          right: isMobile ? 60 : 'auto', // Leave room for balance badge
          display: 'flex',
          alignItems: 'flex-start',
          gap: isMobile ? 8 : 12,
          pointerEvents: 'auto',
        }}>
          {/* Party Logo */}
          <div style={{ width: isMobile ? 32 : 40, height: isMobile ? 32 : 40, flexShrink: 0 }}>
            <PartyLogo size="small" className="responsive-logo" />
          </div>

          {/* Market Selector */}
          <div style={{ position: 'relative', flex: isMobile ? 1 : 'none', minWidth: 0 }}>
            <button
              onClick={() => setMarketMenuOpen(!marketMenuOpen)}
              style={{
                ...glassPanel,
                ...glassText,
                padding: isMobile ? '8px 12px' : '12px 16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                maxWidth: isMobile ? '100%' : 320,
                width: isMobile ? '100%' : 'auto',
              }}
            >
              <span style={{ fontSize: 20 }}>{selectedMarket.icon}</span>
              <span style={{
                fontSize: 14,
                fontWeight: 600,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {selectedMarket.name}
              </span>
              <span style={{
                marginLeft: 'auto',
                opacity: 0.5,
                transform: marketMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s',
              }}>
                ▼
              </span>
            </button>

            {/* Market Dropdown */}
            {marketMenuOpen && (
              <div style={{
                ...glassPanel,
                position: 'absolute',
                top: '100%',
                left: 0,
                marginTop: 8,
                padding: 8,
                minWidth: 280,
                maxHeight: 320,
                overflowY: 'auto',
              }}>
                {MARKETS.map(market => (
                  <button
                    key={market.id}
                    onClick={() => handleMarketSelect(market.id)}
                    style={{
                      ...glassText,
                      width: '100%',
                      padding: '10px 12px',
                      background: market.id === selectedMarketId
                        ? 'rgba(255, 215, 0, 0.2)'
                        : 'transparent',
                      border: 'none',
                      borderRadius: 8,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      textAlign: 'left',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => e.target.style.background = 'rgba(255, 255, 255, 0.1)'}
                    onMouseLeave={e => e.target.style.background = market.id === selectedMarketId ? 'rgba(255, 215, 0, 0.2)' : 'transparent'}
                  >
                    <span style={{ fontSize: 18 }}>{market.icon}</span>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{market.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ═══ TOP RIGHT: THE LOOT (Balance) ═══ */}
        <div style={{
          position: 'absolute',
          top: isMobile ? 8 : 16,
          right: isMobile ? 8 : 16,
          ...glassPanel,
          ...glassText,
          padding: isMobile ? '6px 10px' : '10px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: isMobile ? 4 : 8,
          pointerEvents: 'auto',
        }}>
          {!isMobile && (
            <span style={{ fontSize: 12, opacity: 0.6, textTransform: 'uppercase', letterSpacing: 1 }}>
              Balance
            </span>
          )}
          <span style={{
            fontSize: isMobile ? 14 : 18,
            fontWeight: 700,
            color: '#FFD700',
            textShadow: '0 0 12px rgba(255, 215, 0, 0.4)',
          }}>
            ${balance}
          </span>
        </div>

        {/* ═══ BOTTOM CENTER: THE COMMAND DECK (Betting UI) ═══ */}
        <div style={{
          position: 'absolute',
          bottom: isMobile ? 0 : 24,
          left: isMobile ? 0 : '50%',
          right: isMobile ? 0 : 'auto',
          transform: isMobile ? 'none' : 'translateX(-50%)',
          ...glassPanel,
          borderRadius: isMobile ? '16px 16px 0 0' : 16,
          padding: isMobile ? '16px 12px calc(env(safe-area-inset-bottom, 8px) + 12px)' : 16,
          pointerEvents: 'auto',
          minWidth: isMobile ? 'auto' : 320,
          maxWidth: isMobile ? 'none' : 600,
        }}>
          {/* Zone Buttons */}
          <div style={{
            display: 'flex',
            gap: 8,
            marginBottom: currentBet ? 12 : 0,
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}>
            {selectedMarket.options.map(option => {
              const isSelected = activeZone === option.id
              const isBet = selectedBetOption === option.id

              return (
                <button
                  key={option.id}
                  onClick={() => {
                    if (isBet) {
                      // Already bet here — unlock
                      handleUnlock()
                    } else if (!currentBet) {
                      // No bet yet — place one
                      handleBet(option.id, 25)
                    } else {
                      // Has bet elsewhere — just preview
                      setPreviewZone(option.id)
                    }
                  }}
                  onMouseEnter={() => !currentBet && setPreviewZone(option.id)}
                  onMouseLeave={() => !currentBet && setPreviewZone(null)}
                  style={{
                    padding: '12px 20px',
                    background: isSelected
                      ? option.color
                      : `${option.color}33`,
                    border: `2px solid ${option.color}`,
                    borderRadius: 12,
                    color: '#fff',
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease-out',
                    transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                    boxShadow: isSelected
                      ? `0 0 20px ${option.color}66, 0 4px 12px rgba(0,0,0,0.3)`
                      : '0 2px 8px rgba(0,0,0,0.2)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 4,
                    minWidth: 80,
                  }}
                >
                  <span>{option.label}</span>
                  <span style={{
                    fontSize: 12,
                    opacity: 0.8,
                    fontWeight: 500,
                  }}>
                    {option.pct}%
                  </span>
                  {isBet && (
                    <span style={{
                      fontSize: 10,
                      background: 'rgba(0,0,0,0.4)',
                      padding: '2px 8px',
                      borderRadius: 4,
                      marginTop: 2,
                    }}>
                      ${currentBet.amount} BET
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Bet Status */}
          {currentBet && (
            <div style={{
              textAlign: 'center',
              ...glassText,
              fontSize: 12,
              opacity: 0.7,
            }}>
              Tap your bet to unlock • Tap another to switch
            </div>
          )}
        </div>

      </div>
    </>
  )
}
