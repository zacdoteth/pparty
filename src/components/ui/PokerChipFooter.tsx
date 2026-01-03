/**
 * PokerChipFooter — Drag Your Chip to Bet!
 * "The most satisfying betting UX ever created" — CTO
 *
 * Features:
 * - Draggable poker chip with your avatar
 * - Horizontal zone tiles that glow on hover
 * - Preview of your avatar on the tile when hovering
 * - Hold-to-lock confirmation (1 second hold)
 * - Silky smooth animations
 */

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { playPickup, playHoverTick, playLand, playLockInSound } from '../../utils/sounds'

interface BetOption {
  id: string
  label: string
  pct: number
  color: string
}

interface PokerChipFooterProps {
  question: string
  options: BetOption[]
  onBet: (optionId: string, amount: number) => void
  disabled?: boolean
  userBalance?: number
  userAvatar?: string
  userName?: string
  lockedOption?: string | null
  lockedAmount?: number
}

const BET_AMOUNTS = [10, 25, 50, 100]

// ═══════════════════════════════════════════════════════════════════════════
// SMART WIDTH LOGIC — Dynamic button sizing based on option count
// ═══════════════════════════════════════════════════════════════════════════
function getButtonStyle(index: number, total: number): React.CSSProperties {
  // N=4: Perfect 2x2 box
  if (total === 4) {
    return { flexBasis: 'calc(50% - 4px)', maxWidth: 'calc(50% - 4px)' }
  }

  // N=5: Pyramid — 2 on top, 3 on bottom
  if (total === 5) {
    if (index < 2) {
      return { flexBasis: 'calc(50% - 4px)', maxWidth: 'calc(50% - 4px)' }
    }
    return { flexBasis: 'calc(33.333% - 5.33px)', maxWidth: 'calc(33.333% - 5.33px)' }
  }

  // N=6: Clean 3x2 grid
  if (total === 6) {
    return { flexBasis: 'calc(33.333% - 5.33px)', maxWidth: 'calc(33.333% - 5.33px)' }
  }

  // N=7: Mega Stack — 3 on top, 4 on bottom
  if (total === 7) {
    if (index < 3) {
      return { flexBasis: 'calc(33.333% - 5.33px)', maxWidth: 'calc(33.333% - 5.33px)' }
    }
    return { flexBasis: 'calc(25% - 6px)', maxWidth: 'calc(25% - 6px)' }
  }

  // N=8: Clean 4x2 grid
  if (total === 8) {
    return { flexBasis: 'calc(25% - 6px)', maxWidth: 'calc(25% - 6px)' }
  }

  // Default: Auto-fill evenly
  return { flex: 1, minWidth: '80px' }
}

// Dynamic text size based on column count
function getTextStyle(index: number, total: number): { labelSize: string; priceSize: string } {
  if (total >= 7 && index >= 3) {
    return { labelSize: '14px', priceSize: '12px' } // Row of 4 = smaller
  }
  if (total >= 5 && index >= 2) {
    return { labelSize: '16px', priceSize: '13px' } // Row of 3 = medium
  }
  return { labelSize: '18px', priceSize: '14px' } // Row of 2 = full size
}

export default function PokerChipFooter({
  question,
  options,
  onBet,
  disabled = false,
  userBalance = 250,
  userAvatar = '/tg/zac.jpg',
  userName = 'You',
  lockedOption = null,
  lockedAmount = 0,
}: PokerChipFooterProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [chipPos, setChipPos] = useState({ x: 0, y: 0 })
  const [hoveredZone, setHoveredZone] = useState<string | null>(null)
  const [pendingZone, setPendingZone] = useState<string | null>(null)
  const [selectedAmount, setSelectedAmount] = useState(25)
  const [holdProgress, setHoldProgress] = useState(0)

  const containerRef = useRef<HTMLDivElement>(null)
  const chipRef = useRef<HTMLDivElement>(null)
  const popupRef = useRef<HTMLDivElement>(null)
  const dragStartPos = useRef({ x: 0, y: 0 })
  const dragStartChipPos = useRef({ x: 0, y: 0 })
  const holdIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const holdStartTimeRef = useRef<number>(0)

  const HOLD_DURATION = 1000 // 1 second to lock

  // Get pending option details
  const pendingOption = useMemo(() =>
    options.find(o => o.id === pendingZone),
    [options, pendingZone]
  )

  // Calculate potential win
  const potentialWin = pendingOption
    ? Math.round((selectedAmount * 100) / pendingOption.pct)
    : 0

  // ═══ ZONE DETECTION ═══
  const getZoneAtPoint = useCallback((clientX: number, clientY: number): string | null => {
    const zones = containerRef.current?.querySelectorAll('.chip-zone')
    if (!zones) return null

    for (const zone of zones) {
      const rect = zone.getBoundingClientRect()
      const padding = 10
      if (
        clientX >= rect.left - padding &&
        clientX <= rect.right + padding &&
        clientY >= rect.top - padding &&
        clientY <= rect.bottom + padding
      ) {
        return (zone as HTMLElement).dataset.optionId || null
      }
    }
    return null
  }, [])

  // ═══ DRAG HANDLERS ═══
  const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (disabled || lockedOption) return
    e.preventDefault()
    e.stopPropagation()

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY

    dragStartPos.current = { x: clientX, y: clientY }
    dragStartChipPos.current = { x: chipPos.x, y: chipPos.y }
    setIsDragging(true)
    playPickup()
  }, [disabled, lockedOption, chipPos])

  const handleDragMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDragging) return
    e.preventDefault()

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY

    const deltaX = clientX - dragStartPos.current.x
    const deltaY = clientY - dragStartPos.current.y

    setChipPos({
      x: dragStartChipPos.current.x + deltaX,
      y: dragStartChipPos.current.y + deltaY,
    })

    const zone = getZoneAtPoint(clientX, clientY)
    if (zone && zone !== hoveredZone) {
      const opt = options.find(o => o.id === zone)
      playHoverTick(opt?.color === '#00F0FF' ? 880 : opt?.color === '#FF0055' ? 660 : 770, 0.1)
    }
    setHoveredZone(zone)
  }, [isDragging, hoveredZone, getZoneAtPoint, options])

  const handleDragEnd = useCallback(() => {
    if (!isDragging) return
    setIsDragging(false)

    if (hoveredZone) {
      setPendingZone(hoveredZone)
      playLand()
    } else {
      setChipPos({ x: 0, y: 0 })
      setPendingZone(null)
    }
    setHoveredZone(null)
  }, [isDragging, hoveredZone])

  // ═══ HOLD TO LOCK ═══
  const handleHoldStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    holdStartTimeRef.current = Date.now()
    setHoldProgress(0)

    holdIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - holdStartTimeRef.current
      const progress = Math.min(100, (elapsed / HOLD_DURATION) * 100)
      setHoldProgress(progress)

      if (progress >= 100) {
        if (holdIntervalRef.current) {
          clearInterval(holdIntervalRef.current)
          holdIntervalRef.current = null
        }
        if (pendingZone && selectedAmount > 0) {
          playLockInSound()
          onBet(pendingZone, selectedAmount)
          setPendingZone(null)
          setChipPos({ x: 0, y: 0 })
          setHoldProgress(0)
        }
      }
    }, 16)
  }, [pendingZone, selectedAmount, onBet])

  const handleHoldEnd = useCallback(() => {
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current)
      holdIntervalRef.current = null
    }
    setHoldProgress(0)
  }, [])

  // ═══ CLICK OUTSIDE TO DISMISS ═══
  useEffect(() => {
    if (!pendingZone || isDragging) return

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node
      const clickedPopup = popupRef.current?.contains(target)
      const clickedChip = chipRef.current?.contains(target)

      if (!clickedPopup && !clickedChip) {
        setPendingZone(null)
        setChipPos({ x: 0, y: 0 })
      }
    }

    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('touchstart', handleClickOutside)
    }, 100)

    return () => {
      clearTimeout(timer)
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [pendingZone, isDragging])

  // ═══ GLOBAL DRAG LISTENERS ═══
  useEffect(() => {
    if (!isDragging) return

    window.addEventListener('mousemove', handleDragMove)
    window.addEventListener('mouseup', handleDragEnd)
    window.addEventListener('touchmove', handleDragMove, { passive: false })
    window.addEventListener('touchend', handleDragEnd)
    window.addEventListener('touchcancel', handleDragEnd)

    return () => {
      window.removeEventListener('mousemove', handleDragMove)
      window.removeEventListener('mouseup', handleDragEnd)
      window.removeEventListener('touchmove', handleDragMove)
      window.removeEventListener('touchend', handleDragEnd)
      window.removeEventListener('touchcancel', handleDragEnd)
    }
  }, [isDragging, handleDragMove, handleDragEnd])

  // Cleanup hold interval
  useEffect(() => {
    return () => {
      if (holdIntervalRef.current) {
        clearInterval(holdIntervalRef.current)
      }
    }
  }, [])

  const lockedOptionData = lockedOption ? options.find(o => o.id === lockedOption) : null

  return (
    <div
      ref={containerRef}
      className="poker-chip-footer"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '220px',
        background: 'linear-gradient(180deg, rgba(5,0,30,0.97) 0%, rgba(0,0,15,1) 100%)',
        borderTop: '3px solid #FFD700',
        boxShadow: '0 -10px 60px rgba(100,50,255,0.4), 0 -5px 30px rgba(255,215,0,0.2)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        zIndex: 9000,
        display: 'flex',
        flexDirection: 'column',
        padding: '0',
        userSelect: 'none',
        touchAction: 'none',
      }}
    >
      {/* ═══ MILLIONAIRE-STYLE QUESTION BAR ═══ */}
      <div style={{
        background: 'linear-gradient(90deg, transparent 0%, rgba(100,50,255,0.3) 20%, rgba(100,50,255,0.4) 50%, rgba(100,50,255,0.3) 80%, transparent 100%)',
        borderBottom: '2px solid rgba(255,215,0,0.5)',
        padding: '12px 24px',
        textAlign: 'center',
      }}>
        <div style={{
          fontSize: '20px',
          fontWeight: 900,
          color: '#fff',
          textShadow: '0 0 20px rgba(255,215,0,0.5), 0 2px 4px rgba(0,0,0,0.8)',
          letterSpacing: '1px',
        }}>
          {question}
        </div>
      </div>

      {/* ═══ MAIN CONTENT AREA ═══ */}
      <div style={{
        flex: 1,
        display: 'flex',
        padding: '12px 16px 16px',
        gap: '16px',
      }}>
        {/* ═══ LEFT: ANSWER OPTIONS (Trivia Style!) ═══ */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          alignContent: 'center',
        }}>
        {options.map((opt) => {
          const isHovered = hoveredZone === opt.id
          const isPending = pendingZone === opt.id
          const isLocked = lockedOption === opt.id

          return (
            <div
              key={opt.id}
              className="chip-zone"
              data-option-id={opt.id}
              style={{
                flex: 1,
                maxWidth: '140px',
                background: isHovered || isPending || isLocked
                  ? `linear-gradient(135deg, ${opt.color}40 0%, ${opt.color}20 100%)`
                  : 'rgba(255,255,255,0.05)',
                border: isHovered || isPending || isLocked
                  ? `2px solid ${opt.color}`
                  : '2px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                transition: 'all 0.2s ease',
                boxShadow: isHovered || isPending
                  ? `0 0 30px ${opt.color}60, inset 0 0 20px ${opt.color}20`
                  : 'none',
              }}
            >
              {/* Preview avatar when hovering */}
              {(isHovered || isPending || isLocked) && (
                <div style={{
                  position: 'absolute',
                  top: '-20px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  border: `3px solid ${opt.color}`,
                  overflow: 'hidden',
                  boxShadow: `0 4px 20px ${opt.color}80`,
                  animation: isHovered && !isPending ? 'bounce 0.3s ease' : 'none',
                }}>
                  <img
                    src={userAvatar}
                    alt={userName}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                </div>
              )}

              <div style={{
                fontSize: '20px',
                fontWeight: 900,
                color: opt.color,
                textShadow: isHovered || isPending ? `0 0 20px ${opt.color}` : 'none',
                marginTop: isHovered || isPending || isLocked ? '8px' : '0',
              }}>
                {opt.label.split(' ')[0].toUpperCase()}
              </div>
              <div style={{
                fontSize: '14px',
                fontWeight: 700,
                color: `${opt.color}99`,
              }}>
                {opt.pct}¢
              </div>

              {/* Locked indicator */}
              {isLocked && (
                <div style={{
                  position: 'absolute',
                  bottom: '4px',
                  fontSize: '10px',
                  fontWeight: 800,
                  color: opt.color,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}>
                  🔒 ${lockedAmount}
                </div>
              )}
            </div>
          )
        })}
        </div>

        {/* ═══ RIGHT: BET CONTROLS (Bottom Right Corner!) ═══ */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          justifyContent: 'flex-end',
          gap: '8px',
          minWidth: '140px',
        }}>
          {/* Bet Amount Chips */}
          <div style={{
            display: 'flex',
            gap: '6px',
          }}>
            {BET_AMOUNTS.map((amt) => (
              <button
                key={amt}
                onClick={() => setSelectedAmount(amt)}
                disabled={amt > userBalance}
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  fontSize: '12px',
                  fontWeight: 900,
                  border: selectedAmount === amt
                    ? '3px solid #FFD700'
                    : '2px solid rgba(255,255,255,0.3)',
                  background: selectedAmount === amt
                    ? 'linear-gradient(135deg, #FFD700 0%, #FF8C00 100%)'
                    : 'rgba(255,255,255,0.1)',
                  color: selectedAmount === amt ? '#000' : 'rgba(255,255,255,0.7)',
                  cursor: amt > userBalance ? 'not-allowed' : 'pointer',
                  opacity: amt > userBalance ? 0.3 : 1,
                  transition: 'all 0.15s ease',
                  boxShadow: selectedAmount === amt
                    ? '0 4px 20px rgba(255,215,0,0.5)'
                    : 'none',
                }}
              >
                ${amt}
              </button>
            ))}
          </div>

          {/* Draggable Poker Chip + Lock Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Chip */}
            {!lockedOption && (
              <div
                ref={chipRef}
                onMouseDown={handleDragStart}
                onTouchStart={handleDragStart}
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: isDragging
                    ? 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)'
                    : 'linear-gradient(135deg, #FFD700 0%, #FF8C00 100%)',
                  border: pendingZone
                    ? `3px solid ${pendingOption?.color || '#fff'}`
                    : '3px solid #fff',
                  boxShadow: isDragging
                    ? '0 8px 30px rgba(255,215,0,0.6)'
                    : '0 4px 15px rgba(0,0,0,0.4)',
                  cursor: isDragging ? 'grabbing' : 'grab',
                  transform: `translate(${chipPos.x}px, ${chipPos.y}px) scale(${isDragging ? 1.15 : 1})`,
                  transition: isDragging ? 'none' : 'transform 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  zIndex: isDragging ? 1000 : 10,
                  position: 'relative',
                }}
              >
                <img
                  src={userAvatar}
                  alt={userName}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    borderRadius: '50%',
                    pointerEvents: 'none',
                  }}
                />
              </div>
            )}

            {/* HOLD TO LOCK — Only show when pending */}
            {pendingZone && !isDragging && !lockedOption && (
              <button
                ref={popupRef}
                onMouseDown={handleHoldStart}
                onMouseUp={handleHoldEnd}
                onMouseLeave={handleHoldEnd}
                onTouchStart={handleHoldStart}
                onTouchEnd={handleHoldEnd}
                onTouchCancel={handleHoldEnd}
                style={{
                  position: 'relative',
                  padding: '12px 20px',
                  fontSize: '13px',
                  fontWeight: 900,
                  letterSpacing: '0.5px',
                  borderRadius: '25px',
                  border: `2px solid ${pendingOption?.color || '#ffd700'}`,
                  background: 'rgba(0,0,0,0.6)',
                  color: '#fff',
                  cursor: 'pointer',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                }}
              >
                <div style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: `${holdProgress}%`,
                  background: pendingOption?.color,
                  transition: holdProgress > 0 ? 'none' : 'width 0.2s ease',
                }} />
                <span style={{ position: 'relative', zIndex: 1 }}>
                  {holdProgress > 0 ? '🔒 LOCKING...' : `LOCK $${selectedAmount} → $${potentialWin}`}
                </span>
              </button>
            )}

            {/* Locked State */}
            {lockedOption && lockedOptionData && (
              <div style={{
                padding: '8px 16px',
                background: `${lockedOptionData.color}30`,
                border: `2px solid ${lockedOptionData.color}`,
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: 900,
                color: lockedOptionData.color,
              }}>
                🔒 {lockedOptionData.label.split(' ')[0]} · ${lockedAmount}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Keyframe animations */}
      <style>{`
        @keyframes bounce-up {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(-5px); }
        }
        @keyframes bounce {
          0%, 100% { transform: translateX(-50%) scale(1); }
          50% { transform: translateX(-50%) scale(1.1); }
        }
      `}</style>
    </div>
  )
}
