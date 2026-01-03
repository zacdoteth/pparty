/**
 * ThreeDemo — GAME HUD LAYOUT
 * "The 3D scene IS the app. UI floats on top like a cockpit." — CTO
 *
 * Inspired by: Fortnite, Cyberpunk 2077, Destiny 2
 */

import React, { useState, useCallback, useEffect, useRef } from 'react'
import { playPickup, playHoverTick, playLand, playLockInSound } from './utils/sounds'

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

  // ═══ POKER CHIP DRAG STATE (Mobile) ═══
  const [isDragging, setIsDragging] = useState(false)
  const [hoveredZone, setHoveredZone] = useState(null)
  const [pendingZone, setPendingZone] = useState(null) // Zone chip is dropped on, waiting for confirm
  const [holdProgress, setHoldProgress] = useState(0)
  const chipRef = useRef(null)
  const zoneButtonsRef = useRef(null)
  const dragStartPos = useRef({ x: 0, y: 0 })
  const chipPosRef = useRef({ x: 0, y: 0 })
  const rafRef = useRef(null)
  const holdIntervalRef = useRef(null)

  // ═══ DESKTOP HOLD-TO-VOTE STATE ═══
  const [desktopHoldingId, setDesktopHoldingId] = useState(null)
  const [desktopHoldProgress, setDesktopHoldProgress] = useState(0)
  const [cancelHoldProgress, setCancelHoldProgress] = useState(0)
  const [isCanceling, setIsCanceling] = useState(false)
  const [hoveringBetButton, setHoveringBetButton] = useState(false)
  const desktopHoldRef = useRef(null)
  const cancelHoldRef = useRef(null)
  const DESKTOP_HOLD_DURATION = 600 // ms - snappy but intentional
  const CANCEL_HOLD_DURATION = 400 // ms - faster to cancel

  // ═══ BET AMOUNT STATE ═══
  const [betAmount, setBetAmount] = useState(10)
  const BET_AMOUNTS = [10, 25, 50] // Clean 3 + custom

  // ═══ CELEBRATION MODE — Lasers go crazy when bet is locked! ═══
  const [lockedInZone, setLockedInZone] = useState(null)
  const celebrationTimerRef = useRef(null)

  const selectedMarket = MARKETS.find(m => m.id === selectedMarketId) || MARKETS[0]
  const currentBet = bets[selectedMarketId]
  const selectedBetOption = currentBet?.optionId || null
  const activeZone = previewZone || selectedBetOption

  // ═══ POTENTIAL WIN CALCULATION ═══
  const hoveredOption = selectedMarket.options.find(o => o.id === activeZone)
  const potentialWin = hoveredOption && betAmount
    ? Math.round((betAmount * 100) / hoveredOption.pct)
    : null

  const handleTileClick = useCallback((optionId) => {
    // Direct tile click = preview that zone
    setPreviewZone(optionId)
  }, [])

  const handleMarketSelect = useCallback((marketId) => {
    setSelectedMarketId(marketId)
    setPreviewZone(null)
    setMarketMenuOpen(false)
    // Reset chip state when switching markets
    setPendingZone(null)
    setHoveredZone(null)
    setHoldProgress(0)
    if (chipRef.current) {
      chipRef.current.style.transform = 'translate(0px, 0px) scale(1)'
    }
    chipPosRef.current = { x: 0, y: 0 }
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
      // Reset all chip state after unlock
      setPreviewZone(null)
      setPendingZone(null)
      setHoveredZone(null)
      setHoldProgress(0)
      if (chipRef.current) {
        chipRef.current.style.transform = 'translate(0px, 0px) scale(1)'
      }
      chipPosRef.current = { x: 0, y: 0 }
    }
  }, [selectedMarketId, bets])

  // ═══ POKER CHIP DRAG HANDLERS ═══
  const getZoneAtPoint = useCallback((clientX, clientY) => {
    const buttons = zoneButtonsRef.current?.querySelectorAll('[data-zone-id]')
    if (!buttons) return null

    for (const btn of buttons) {
      const rect = btn.getBoundingClientRect()
      if (clientX >= rect.left && clientX <= rect.right &&
          clientY >= rect.top && clientY <= rect.bottom) {
        return btn.dataset.zoneId
      }
    }
    return null
  }, [])

  const handleChipDragStart = useCallback((e) => {
    if (currentBet) return // Already bet
    e.preventDefault()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    dragStartPos.current = { x: clientX, y: clientY }
    chipPosRef.current = { x: 0, y: 0 }
    setIsDragging(true)
    playPickup()
  }, [currentBet])

  const handleChipDragEnd = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)

    if (hoveredZone) {
      // Drop on zone — show hold-to-lock!
      playLand()
      setPendingZone(hoveredZone)
      setPreviewZone(hoveredZone)
    } else {
      // Dropped outside — reset
      if (chipRef.current) {
        chipRef.current.style.transform = 'translate(0px, 0px) scale(1)'
      }
      chipPosRef.current = { x: 0, y: 0 }
    }

    setHoveredZone(null)
    setIsDragging(false)
  }, [hoveredZone])

  // ═══ HOLD TO LOCK HANDLERS ═══
  const HOLD_DURATION = 800 // ms

  const handleHoldStart = useCallback(() => {
    if (!pendingZone) return
    setHoldProgress(0)

    const startTime = Date.now()
    holdIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(100, (elapsed / HOLD_DURATION) * 100)
      setHoldProgress(progress)

      if (progress >= 100) {
        clearInterval(holdIntervalRef.current)
        playLockInSound()
        handleBet(pendingZone, 25)
        setPendingZone(null)
        setHoldProgress(0)
        // Reset chip
        if (chipRef.current) {
          chipRef.current.style.transform = 'translate(0px, 0px) scale(1)'
        }
        chipPosRef.current = { x: 0, y: 0 }
      }
    }, 16)
  }, [pendingZone, handleBet])

  const handleHoldEnd = useCallback(() => {
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current)
    }
    setHoldProgress(0)
  }, [])

  const handleCancelPending = useCallback(() => {
    setPendingZone(null)
    setPreviewZone(null)
    setHoveredZone(null)
    setHoldProgress(0)
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current)
    }
    if (chipRef.current) {
      chipRef.current.style.transform = 'translate(0px, 0px) scale(1)'
    }
    chipPosRef.current = { x: 0, y: 0 }
  }, [])

  // ═══ DESKTOP HOLD-TO-VOTE HANDLERS ═══
  const handleDesktopHoldStart = useCallback((optionId) => {
    if (currentBet) return // Already bet
    setDesktopHoldingId(optionId)
    setDesktopHoldProgress(0)
    setPreviewZone(optionId)

    const startTime = Date.now()
    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(1, elapsed / DESKTOP_HOLD_DURATION)
      setDesktopHoldProgress(progress)

      if (progress >= 1) {
        // Success! Place the bet
        playLockInSound()
        handleBet(optionId, betAmount)
        setDesktopHoldingId(null)
        setDesktopHoldProgress(0)
        return
      }

      desktopHoldRef.current = requestAnimationFrame(animate)
    }
    desktopHoldRef.current = requestAnimationFrame(animate)
  }, [currentBet, handleBet, betAmount, DESKTOP_HOLD_DURATION])

  const handleDesktopHoldEnd = useCallback(() => {
    if (desktopHoldRef.current) {
      cancelAnimationFrame(desktopHoldRef.current)
    }
    setDesktopHoldingId(null)
    setDesktopHoldProgress(0)
  }, [])

  // ═══ HOLD-TO-CANCEL HANDLERS ═══
  const handleCancelHoldStart = useCallback(() => {
    if (!currentBet) return
    setIsCanceling(true)
    setCancelHoldProgress(0)

    const startTime = Date.now()
    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(1, elapsed / CANCEL_HOLD_DURATION)
      setCancelHoldProgress(progress)

      if (progress >= 1) {
        // Cancel complete!
        handleUnlock()
        setIsCanceling(false)
        setCancelHoldProgress(0)
        return
      }

      cancelHoldRef.current = requestAnimationFrame(animate)
    }
    cancelHoldRef.current = requestAnimationFrame(animate)
  }, [currentBet, handleUnlock, CANCEL_HOLD_DURATION])

  const handleCancelHoldEnd = useCallback(() => {
    if (cancelHoldRef.current) {
      cancelAnimationFrame(cancelHoldRef.current)
    }
    setIsCanceling(false)
    setCancelHoldProgress(0)
  }, [])

  // Global drag listeners — optimized with RAF
  useEffect(() => {
    if (!isDragging) return

    let lastZone = null

    const onMove = (e) => {
      e.preventDefault()
      const clientX = e.touches ? e.touches[0].clientX : e.clientX
      const clientY = e.touches ? e.touches[0].clientY : e.clientY

      // Update position via ref + direct DOM (no re-render!)
      const dx = clientX - dragStartPos.current.x
      const dy = clientY - dragStartPos.current.y
      chipPosRef.current = { x: dx, y: dy }

      if (chipRef.current) {
        chipRef.current.style.transform = `translate(${dx}px, ${dy}px) scale(1.15)`
      }

      // Throttle zone detection with RAF
      if (rafRef.current) return
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null
        const zone = getZoneAtPoint(clientX, clientY)
        if (zone !== lastZone) {
          lastZone = zone
          if (zone) {
            playHoverTick(660, 0.08)
            setPreviewZone(zone)
          }
          setHoveredZone(zone)
        }
      })
    }

    const onEnd = () => handleChipDragEnd()

    window.addEventListener('mousemove', onMove, { passive: false })
    window.addEventListener('mouseup', onEnd)
    window.addEventListener('touchmove', onMove, { passive: false })
    window.addEventListener('touchend', onEnd)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onEnd)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onEnd)
    }
  }, [isDragging, getZoneAtPoint, handleChipDragEnd])

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

        {/* ═══ TOP RIGHT: BET AMOUNT + BALANCE (Game HUD Style!) ═══ */}
        <div style={{
          position: 'absolute',
          top: isMobile ? 8 : 16,
          right: isMobile ? 8 : 16,
          display: 'flex',
          alignItems: 'center',
          gap: isMobile ? 8 : 12,
          pointerEvents: 'auto',
        }}>
          {/* Bet Amount Selector — 3 quick + dropdown */}
          <div style={{
            ...glassPanel,
            padding: isMobile ? '4px 6px' : '6px 8px',
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? 4 : 6,
          }}>
            {!isMobile && (
              <span style={{ ...glassText, fontSize: 10, opacity: 0.5, marginRight: 2 }}>BET</span>
            )}
            {BET_AMOUNTS.map((amt) => (
              <button
                key={amt}
                onClick={() => setBetAmount(amt)}
                style={{
                  width: isMobile ? 32 : 36,
                  height: isMobile ? 28 : 32,
                  borderRadius: 6,
                  fontSize: isMobile ? 11 : 12,
                  fontWeight: 800,
                  border: betAmount === amt ? '2px solid #FFD700' : '1px solid rgba(255,255,255,0.2)',
                  background: betAmount === amt
                    ? 'linear-gradient(180deg, #FFD700 0%, #CC9900 100%)'
                    : 'rgba(255,255,255,0.08)',
                  color: betAmount === amt ? '#000' : 'rgba(255,255,255,0.7)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  fontFamily: "'Space Grotesk', sans-serif",
                }}
              >
                ${amt}
              </button>
            ))}
            {/* More dropdown */}
            <select
              value={BET_AMOUNTS.includes(betAmount) ? '' : betAmount}
              onChange={(e) => e.target.value && setBetAmount(Number(e.target.value))}
              style={{
                width: isMobile ? 36 : 42,
                height: isMobile ? 28 : 32,
                borderRadius: 6,
                fontSize: isMobile ? 10 : 11,
                fontWeight: 800,
                border: !BET_AMOUNTS.includes(betAmount) ? '2px solid #FFD700' : '1px solid rgba(255,255,255,0.2)',
                background: !BET_AMOUNTS.includes(betAmount)
                  ? 'linear-gradient(180deg, #FFD700 0%, #CC9900 100%)'
                  : 'rgba(255,255,255,0.08)',
                color: !BET_AMOUNTS.includes(betAmount) ? '#000' : 'rgba(255,255,255,0.7)',
                cursor: 'pointer',
                fontFamily: "'Space Grotesk', sans-serif",
                appearance: 'none',
                textAlign: 'center',
                paddingLeft: 4,
              }}
            >
              <option value="" disabled>···</option>
              <option value="100">$100</option>
              <option value="200">$200</option>
              <option value="500">$500</option>
            </select>
          </div>

          {/* Potential Win — Shows when hovering an option */}
          {potentialWin && !currentBet && (
            <div style={{
              ...glassPanel,
              padding: isMobile ? '6px 10px' : '8px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              background: 'rgba(0, 200, 100, 0.15)',
              border: '1px solid rgba(0, 255, 100, 0.3)',
            }}>
              <span style={{ fontSize: isMobile ? 10 : 11, color: 'rgba(255,255,255,0.6)' }}>WIN</span>
              <span style={{
                fontSize: isMobile ? 14 : 16,
                fontWeight: 800,
                color: '#00FF88',
                textShadow: '0 0 12px rgba(0, 255, 136, 0.5)',
                fontFamily: "'Space Grotesk', sans-serif",
              }}>
                ${potentialWin}
              </span>
            </div>
          )}

          {/* Active Bet Badge — Shows when bet is locked */}
          {currentBet && (() => {
            const betOption = selectedMarket.options.find(o => o.id === currentBet.optionId)
            const winAmount = betOption ? Math.round((currentBet.amount * 100) / betOption.pct) : 0
            return (
              <div style={{
                ...glassPanel,
                padding: isMobile ? '6px 10px' : '8px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: `${betOption?.color}20`,
                border: `1px solid ${betOption?.color}60`,
              }}>
                <span style={{
                  fontSize: isMobile ? 11 : 12,
                  fontWeight: 800,
                  color: betOption?.color,
                }}>
                  🔒 {betOption?.label.split(' ')[0]}
                </span>
                <span style={{
                  fontSize: isMobile ? 10 : 11,
                  color: 'rgba(255,255,255,0.5)',
                }}>
                  ${currentBet.amount} →
                </span>
                <span style={{
                  fontSize: isMobile ? 12 : 13,
                  fontWeight: 800,
                  color: '#00FF88',
                }}>
                  ${winAmount}
                </span>
              </div>
            )
          })()}

          {/* Balance */}
          <div style={{
            ...glassPanel,
            ...glassText,
            padding: isMobile ? '6px 10px' : '8px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? 4 : 6,
          }}>
            {!isMobile && (
              <span style={{ fontSize: 10, opacity: 0.5 }}>BAL</span>
            )}
            <span style={{
              fontSize: isMobile ? 14 : 16,
              fontWeight: 700,
              color: '#FFD700',
              textShadow: '0 0 12px rgba(255, 215, 0, 0.4)',
            }}>
              ${balance}
            </span>
          </div>
        </div>

        {/* ═══ BOTTOM CENTER: BETTING UI ═══ */}
        {/* DESKTOP: Prediction Party style buttons */}
        {!isMobile && (
          <div style={{
            position: 'absolute',
            bottom: 'clamp(20px, 2vw, 40px)',
            left: '50%',
            transform: 'translateX(-50%)',
            pointerEvents: 'auto',
            maxWidth: 'clamp(700px, 70vw, 1200px)',
            width: '92vw',
          }}>
            {/* ═══ MILLIONAIRE-STYLE TITLE BAR ═══ */}
            <div style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(100,50,255,0.4) 20%, rgba(100,50,255,0.5) 50%, rgba(100,50,255,0.4) 80%, transparent 100%)',
              borderBottom: '3px solid rgba(255,215,0,0.6)',
              padding: 'clamp(14px, 1.5vw, 24px) clamp(32px, 4vw, 64px)',
              marginBottom: 'clamp(12px, 1.2vw, 20px)',
              clipPath: 'polygon(3% 0%, 97% 0%, 100% 100%, 0% 100%)',
            }}>
              <div style={{
                textAlign: 'center',
                fontSize: 'clamp(22px, 2.2vw, 40px)',
                fontWeight: 900,
                color: '#fff',
                textShadow: '0 0 30px rgba(255,215,0,0.6), 0 2px 8px rgba(0,0,0,0.9)',
                letterSpacing: '1px',
                fontFamily: "'Space Grotesk', sans-serif",
              }}>
                {selectedMarket.name}
              </div>
            </div>

            {/* ═══ ANSWER BUTTONS ═══ */}
            <div
              ref={!isMobile ? zoneButtonsRef : undefined}
              style={{
                display: 'grid',
                // Smart grid: 2 for binary, 3 for 3 options, 3 for 4-6, etc.
                gridTemplateColumns: (() => {
                  const len = selectedMarket.options.length
                  if (len <= 2) return 'repeat(2, minmax(140px, 280px))'  // Binary: scales up on 4K
                  if (len === 3) return 'repeat(3, 1fr)'
                  if (len === 4) return 'repeat(2, 1fr)'
                  return 'repeat(3, 1fr)'  // 5+ options: 3 columns for density
                })(),
                gap: 'clamp(8px, 0.8vw, 14px)',
                justifyContent: selectedMarket.options.length <= 2 ? 'center' : 'stretch',
              }}
            >
              {selectedMarket.options.map((option) => {
                const isSelected = activeZone === option.id || hoveredZone === option.id
                const isBet = selectedBetOption === option.id
                const isHolding = desktopHoldingId === option.id
                const holdPct = isHolding ? desktopHoldProgress * 100 : 0
                const cancelPct = isBet && isCanceling ? cancelHoldProgress * 100 : 0

                return (
                  <button
                    key={option.id}
                    data-zone-id={option.id}
                    onMouseDown={() => {
                      if (isBet) {
                        handleCancelHoldStart()
                      } else if (!currentBet) {
                        handleDesktopHoldStart(option.id)
                      }
                    }}
                    onMouseUp={() => {
                      handleDesktopHoldEnd()
                      handleCancelHoldEnd()
                    }}
                    onMouseLeave={() => {
                      handleDesktopHoldEnd()
                      handleCancelHoldEnd()
                      setHoveringBetButton(false)
                      if (!currentBet && !isHolding) setPreviewZone(null)
                    }}
                    onMouseEnter={() => {
                      if (isBet) setHoveringBetButton(true)
                      if (!currentBet) setPreviewZone(option.id)
                    }}
                    style={{
                      position: 'relative',
                      padding: selectedMarket.options.length >= 5
                        ? 'clamp(10px, 1vw, 16px) clamp(12px, 1.2vw, 20px)'
                        : 'clamp(14px, 1.4vw, 24px) clamp(18px, 1.8vw, 32px)',
                      background: isBet
                        ? `linear-gradient(180deg, ${option.color}DD 0%, ${option.color}99 100%)`
                        : 'linear-gradient(180deg, rgba(0, 0, 0, 0.75) 0%, rgba(0, 0, 0, 0.9) 100%)',
                      clipPath: 'polygon(4% 0%, 96% 0%, 100% 50%, 96% 100%, 4% 100%, 0% 50%)',
                      border: 'none',
                      color: '#fff',
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontWeight: 700,
                      fontSize: selectedMarket.options.length >= 5
                        ? 'clamp(13px, 1.3vw, 22px)'
                        : 'clamp(15px, 1.5vw, 26px)',
                      cursor: 'pointer',
                      transition: 'all 0.12s cubic-bezier(0.34, 1.56, 0.64, 1)',
                      transform: isHolding || (isBet && isCanceling) ? 'scale(0.97)' : isSelected ? 'scale(1.02)' : 'scale(1)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: selectedMarket.options.length >= 5 ? 'clamp(8px, 0.8vw, 14px)' : 'clamp(12px, 1.2vw, 20px)',
                      minHeight: selectedMarket.options.length >= 5
                        ? 'clamp(44px, 4.5vw, 70px)'
                        : 'clamp(50px, 5vw, 80px)',
                      textAlign: 'left',
                      overflow: 'hidden',
                      userSelect: 'none',
                    }}
                  >
                    {/* Hold progress bar — thin bar at bottom like percent bars */}
                    {!isBet && (
                      <div style={{
                        position: 'absolute',
                        left: '5%',
                        right: '5%',
                        bottom: 4,
                        height: 3,
                        background: 'rgba(255,255,255,0.15)',
                        borderRadius: 2,
                        overflow: 'hidden',
                        zIndex: 2,
                        opacity: isHolding ? 1 : 0,
                        transition: 'opacity 0.1s ease-out',
                      }}>
                        <div style={{
                          width: isHolding ? '100%' : '0%',
                          height: '100%',
                          background: option.color,
                          boxShadow: `0 0 8px ${option.color}`,
                          borderRadius: 2,
                          transition: isHolding
                            ? `width ${DESKTOP_HOLD_DURATION}ms linear`
                            : 'width 0.1s ease-out',
                        }} />
                      </div>
                    )}

                    {/* Cancel progress bar — shows on hover, fills when canceling */}
                    {isBet && (
                      <div style={{
                        position: 'absolute',
                        left: '5%',
                        right: '5%',
                        bottom: 4,
                        height: 3,
                        background: 'rgba(255,100,100,0.2)',
                        borderRadius: 2,
                        overflow: 'hidden',
                        zIndex: 2,
                        opacity: hoveringBetButton || isCanceling ? 1 : 0,
                        transition: 'opacity 0.15s ease-out',
                      }}>
                        <div style={{
                          width: isCanceling ? '100%' : '0%',
                          height: '100%',
                          background: '#ff4444',
                          boxShadow: '0 0 8px #ff4444',
                          borderRadius: 2,
                          transition: isCanceling
                            ? `width ${CANCEL_HOLD_DURATION}ms linear`
                            : 'width 0.1s ease-out',
                        }} />
                      </div>
                    )}

                    {/* Border glow */}
                    <div style={{
                      position: 'absolute',
                      inset: 1,
                      background: 'transparent',
                      clipPath: 'polygon(4% 0%, 96% 0%, 100% 50%, 96% 100%, 4% 100%, 0% 50%)',
                      border: `2px solid ${isBet ? '#fff' : option.color}`,
                      opacity: isSelected || isBet || isHolding ? 0.9 : 0.5,
                      pointerEvents: 'none',
                      boxShadow: isBet
                        ? `0 0 30px ${option.color}88, inset 0 0 25px ${option.color}33`
                        : isSelected || isHolding
                          ? `0 0 25px ${option.color}66, inset 0 0 20px ${option.color}22`
                          : 'none',
                      transition: 'all 0.15s ease-out',
                    }} />

                    {/* Checkmark for locked bet */}
                    {isBet && (
                      <span style={{
                        position: 'relative',
                        fontSize: 18,
                        zIndex: 1,
                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
                      }}>
                        ✓
                      </span>
                    )}

                    {/* Label */}
                    <span style={{
                      position: 'relative',
                      flex: 1,
                      letterSpacing: 0.5,
                      textShadow: '0 2px 4px rgba(0,0,0,0.9)',
                      zIndex: 1,
                    }}>
                      {option.label}
                    </span>

                    {/* Bet amount - prominent when locked */}
                    {isBet && (
                      <span style={{
                        position: 'relative',
                        fontSize: 14,
                        fontWeight: 800,
                        color: '#fff',
                        textShadow: '0 2px 8px rgba(0,0,0,0.8)',
                        zIndex: 1,
                        padding: '2px 8px',
                        background: 'rgba(0,0,0,0.3)',
                        borderRadius: 4,
                      }}>
                        ${currentBet.amount}
                      </span>
                    )}

                    {/* Percentage + Bar (hide when bet is locked) */}
                    {!isBet && (
                      <div style={{
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        zIndex: 1,
                      }}>
                        {/* Percentage bar */}
                        <div style={{
                          width: selectedMarket.options.length >= 5 ? 30 : 40,
                          height: 3,
                          background: 'rgba(255,255,255,0.15)',
                          borderRadius: 2,
                          overflow: 'hidden',
                        }}>
                          <div style={{
                            width: `${option.pct}%`,
                            height: '100%',
                            background: option.color,
                            boxShadow: `0 0 6px ${option.color}`,
                            transition: 'width 0.3s ease-out',
                          }} />
                        </div>
                        {/* Percentage text */}
                        <span style={{
                          fontSize: selectedMarket.options.length >= 5 ? 11 : 12,
                          fontWeight: 800,
                          color: option.color,
                          textShadow: `0 0 10px ${option.color}`,
                          minWidth: 30,
                          textAlign: 'right',
                        }}>
                          {option.pct}%
                        </span>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>


            {/* Hold instruction / Bet Status */}
            <div style={{
              textAlign: 'center',
              ...glassText,
              fontSize: 12,
              opacity: desktopHoldingId || isCanceling || hoveringBetButton ? 0.8 : 0.5,
              marginTop: 10,
              color: desktopHoldingId ? '#FFD700' : (isCanceling || hoveringBetButton) ? '#ff6666' : '#fff',
              transition: 'all 0.15s ease-out',
            }}>
              {desktopHoldingId
                ? `Hold to lock in $${betAmount}...`
                : isCanceling
                  ? 'Keep holding to cancel...'
                  : hoveringBetButton
                    ? '🔓 Hold to cancel bet'
                    : currentBet
                      ? '✓ Locked in!'
                      : 'Hold to vote'
              }
            </div>
          </div>
        )}

        {/* MOBILE: Poker Chip drag-to-vote */}
        {isMobile && (
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'linear-gradient(180deg, rgba(5,0,30,0.97) 0%, rgba(0,0,15,1) 100%)',
            borderTop: '3px solid #FFD700',
            borderRadius: 0,
            padding: 0,
            pointerEvents: 'auto',
          }}>
            {/* ═══ MILLIONAIRE-STYLE TITLE BAR (Mobile) ═══ */}
            <div style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(100,50,255,0.4) 20%, rgba(100,50,255,0.5) 50%, rgba(100,50,255,0.4) 80%, transparent 100%)',
              borderBottom: '2px solid rgba(255,215,0,0.5)',
              padding: '10px 16px',
            }}>
              <div style={{
                textAlign: 'center',
                fontSize: 16,
                fontWeight: 900,
                color: '#fff',
                textShadow: '0 0 20px rgba(255,215,0,0.5), 0 2px 4px rgba(0,0,0,0.8)',
                letterSpacing: '0.5px',
                fontFamily: "'Space Grotesk', sans-serif",
              }}>
                {selectedMarket.name}
              </div>
            </div>

            {/* Zone Buttons */}
            <div
              ref={isMobile ? zoneButtonsRef : undefined}
              style={{
                display: 'flex',
                gap: 8,
                padding: '12px 12px calc(env(safe-area-inset-bottom, 8px) + 12px)',
                flexWrap: 'wrap',
                justifyContent: 'center',
              }}
            >
              {selectedMarket.options.map(option => {
                const isSelected = activeZone === option.id || hoveredZone === option.id
                const isBet = selectedBetOption === option.id

                return (
                  <button
                    key={option.id}
                    data-zone-id={option.id}
                    onClick={() => {
                      if (isBet) {
                        handleUnlock()
                      } else if (!currentBet) {
                        handleBet(option.id, 25)
                      } else {
                        setPreviewZone(option.id)
                      }
                    }}
                    onMouseEnter={() => !currentBet && setPreviewZone(option.id)}
                    onMouseLeave={() => !currentBet && setPreviewZone(null)}
                    style={{
                      padding: '12px 20px',
                      background: isSelected
                        ? `linear-gradient(135deg, ${option.color} 0%, ${option.color}CC 100%)`
                        : `rgba(0,0,0,0.5)`,
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
                        ? `0 0 30px ${option.color}88, 0 0 60px ${option.color}44, inset 0 1px 0 rgba(255,255,255,0.2)`
                        : `0 0 15px ${option.color}44, 0 2px 8px rgba(0,0,0,0.4)`,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 4,
                      minWidth: 80,
                    }}
                  >
                    <span style={{
                      textShadow: `0 0 10px ${option.color}, 0 2px 4px rgba(0,0,0,0.8)`,
                      letterSpacing: '0.5px',
                    }}>{option.label}</span>
                    <span style={{
                      fontSize: 13,
                      fontWeight: 800,
                      color: option.color,
                      textShadow: `0 0 15px ${option.color}, 0 0 30px ${option.color}88, 0 2px 4px rgba(0,0,0,0.9)`,
                      WebkitTextStroke: '0.5px rgba(0,0,0,0.3)',
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

            {/* ═══ POKER CHIP — Drag to vote! ═══ */}
            {!currentBet && (() => {
              const activeOption = selectedMarket.options.find(o => o.id === (pendingZone || hoveredZone))
              const chipColor = activeOption?.color || '#FFD700'

              return (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 8,
                  position: 'relative',
                }}>
                  {/* Hold-to-Lock Popup */}
                  {pendingZone && !isDragging && (
                    <div style={{
                      position: 'absolute',
                      bottom: '100%',
                      marginBottom: 12,
                      background: 'rgba(0,0,0,0.9)',
                      border: `2px solid ${chipColor}`,
                      borderRadius: 12,
                      padding: '12px 16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10,
                      minWidth: 180,
                      boxShadow: `0 8px 32px rgba(0,0,0,0.6), 0 0 20px ${chipColor}44`,
                    }}>
                      <div style={{
                        textAlign: 'center',
                        color: '#fff',
                        fontSize: 14,
                        fontWeight: 700,
                      }}>
                        <span style={{ color: chipColor }}>{activeOption?.label}</span> · $25
                      </div>
                      <button
                        onMouseDown={handleHoldStart}
                        onMouseUp={handleHoldEnd}
                        onMouseLeave={handleHoldEnd}
                        onTouchStart={handleHoldStart}
                        onTouchEnd={handleHoldEnd}
                        style={{
                          position: 'relative',
                          padding: '10px 20px',
                          background: 'rgba(255,255,255,0.1)',
                          border: 'none',
                          borderRadius: 8,
                          color: '#fff',
                          fontWeight: 800,
                          fontSize: 12,
                          cursor: 'pointer',
                          overflow: 'hidden',
                        }}
                      >
                        <div style={{
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          bottom: 0,
                          width: `${holdProgress}%`,
                          background: chipColor,
                          transition: holdProgress > 0 ? 'none' : 'width 0.15s',
                        }} />
                        <span style={{ position: 'relative', zIndex: 1 }}>
                          {holdProgress > 0 ? '🔒 LOCKING...' : 'HOLD TO LOCK'}
                        </span>
                      </button>
                      <button
                        onClick={handleCancelPending}
                        style={{
                          padding: '6px',
                          background: 'transparent',
                          border: '1px solid rgba(255,255,255,0.2)',
                          borderRadius: 6,
                          color: 'rgba(255,255,255,0.5)',
                          fontSize: 11,
                          cursor: 'pointer',
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  )}

                  {/* The Chip */}
                  <div
                    ref={chipRef}
                    onMouseDown={!pendingZone ? handleChipDragStart : undefined}
                    onTouchStart={!pendingZone ? handleChipDragStart : undefined}
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: '50%',
                      background: `linear-gradient(135deg, ${chipColor} 0%, ${chipColor}CC 100%)`,
                      border: `3px solid #fff`,
                      boxShadow: isDragging || pendingZone
                        ? `0 8px 30px ${chipColor}88, 0 0 40px ${chipColor}66`
                        : '0 4px 15px rgba(0,0,0,0.4), 0 0 20px rgba(255,215,0,0.3)',
                      cursor: pendingZone ? 'default' : (isDragging ? 'grabbing' : 'grab'),
                      transition: isDragging ? 'none' : 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      zIndex: isDragging ? 1000 : 10,
                      position: 'relative',
                      touchAction: 'none',
                    }}
                  >
                    <img
                      src="/tg/zac.jpg"
                      alt="You"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        borderRadius: '50%',
                        pointerEvents: 'none',
                      }}
                    />
                  </div>
                  <span style={{
                    ...glassText,
                    fontSize: 11,
                    opacity: (isDragging || pendingZone) ? 0 : 0.6,
                    letterSpacing: 1,
                    textTransform: 'uppercase',
                    transition: 'opacity 0.2s',
                  }}>
                    Drag chip to vote
                  </span>
                </div>
              )
            })()}

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
        )}

      </div>
    </>
  )
}
