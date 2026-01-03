/**
 * SlideFooter — Slide Your Coin to Bet!
 * "The most satisfying way to make a prediction" — UX Lead
 *
 * Horizontal swipe gesture at the bottom of the screen.
 * Drag your avatar/coin left (YES) or right (NO) to bet.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { playPickup, playHoverTick, playLand, playLockInSound } from '../../utils/sounds'

interface SlideFooterProps {
  question: string
  yesLabel?: string
  noLabel?: string
  yesPct?: number
  noPct?: number
  yesOdds?: string
  noOdds?: string
  onBet: (side: 'yes' | 'no', amount: number) => void
  betAmount?: number
  disabled?: boolean
  userBalance?: number
  userAvatar?: string
  userName?: string
}

const BET_AMOUNTS = [10, 25, 50, 100]

export default function SlideFooter({
  question,
  yesLabel = 'YES',
  noLabel = 'NO',
  yesPct = 50,
  noPct = 50,
  yesOdds = '2x',
  noOdds = '2x',
  onBet,
  betAmount: initialBetAmount = 25,
  disabled = false,
  userBalance = 250,
  userAvatar = '/tg/zac.jpg',
  userName = 'You'
}: SlideFooterProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [dragX, setDragX] = useState(0)
  const [hoveredZone, setHoveredZone] = useState<'yes' | 'no' | null>(null)
  const [selectedAmount, setSelectedAmount] = useState(initialBetAmount)
  const containerRef = useRef<HTMLDivElement>(null)
  const coinRef = useRef<HTMLDivElement>(null)
  const startXRef = useRef(0)

  // Zone thresholds (percentage of container width)
  const ZONE_THRESHOLD = 0.25 // 25% from edge = in zone

  const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (disabled) return
    e.preventDefault()
    setIsDragging(true)

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    startXRef.current = clientX

    playPickup()
  }, [disabled])

  const handleDragMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDragging || !containerRef.current) return

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const containerRect = containerRef.current.getBoundingClientRect()
    const containerWidth = containerRect.width

    // Calculate drag offset from start
    const deltaX = clientX - startXRef.current

    // Clamp to container bounds with some padding
    const maxDrag = containerWidth * 0.4
    const clampedX = Math.max(-maxDrag, Math.min(maxDrag, deltaX))

    setDragX(clampedX)

    // Determine which zone we're in
    const normalizedX = clampedX / containerWidth
    let newZone: 'yes' | 'no' | null = null

    if (normalizedX < -ZONE_THRESHOLD) {
      newZone = 'yes' // Left = YES
    } else if (normalizedX > ZONE_THRESHOLD) {
      newZone = 'no' // Right = NO
    }

    // Play sound when entering a new zone
    if (newZone && newZone !== hoveredZone) {
      playHoverTick(newZone === 'yes' ? 880 : 660, 0.1)
    }

    setHoveredZone(newZone)
  }, [isDragging, hoveredZone])

  const handleDragEnd = useCallback(() => {
    if (isDragging && hoveredZone) {
      // Success!
      playLand()
      playLockInSound()
      onBet(hoveredZone, selectedAmount)
    }

    setIsDragging(false)
    setDragX(0)
    setHoveredZone(null)
  }, [isDragging, hoveredZone, onBet, selectedAmount])

  // Global event listeners for drag
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDragMove)
      window.addEventListener('mouseup', handleDragEnd)
      window.addEventListener('touchmove', handleDragMove, { passive: false })
      window.addEventListener('touchend', handleDragEnd)
    }
    return () => {
      window.removeEventListener('mousemove', handleDragMove)
      window.removeEventListener('mouseup', handleDragEnd)
      window.removeEventListener('touchmove', handleDragMove)
      window.removeEventListener('touchend', handleDragEnd)
    }
  }, [isDragging, handleDragMove, handleDragEnd])

  // Calculate potential win
  const potentialWin = hoveredZone === 'yes'
    ? Math.round((selectedAmount * 100) / yesPct)
    : hoveredZone === 'no'
    ? Math.round((selectedAmount * 100) / noPct)
    : 0

  return (
    <div
      ref={containerRef}
      className="slide-footer"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '180px',
        background: 'linear-gradient(180deg, rgba(10,15,30,0.95) 0%, rgba(5,10,20,0.98) 100%)',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        padding: '12px 16px 20px',
        userSelect: 'none',
        touchAction: 'none',
      }}
    >
      {/* Question Bar */}
      <div style={{
        textAlign: 'center',
        marginBottom: '8px',
      }}>
        <div style={{
          fontSize: '10px',
          fontWeight: 600,
          letterSpacing: '2px',
          color: 'rgba(255,255,255,0.4)',
          marginBottom: '4px',
        }}>
          PREDICTION
        </div>
        <div style={{
          fontSize: '14px',
          fontWeight: 700,
          color: '#fff',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {question}
        </div>
      </div>

      {/* Bet Amount Selector */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '8px',
        marginBottom: '12px',
      }}>
        {BET_AMOUNTS.map((amt) => (
          <button
            key={amt}
            onClick={() => setSelectedAmount(amt)}
            disabled={amt > userBalance}
            style={{
              padding: '6px 14px',
              fontSize: '13px',
              fontWeight: 700,
              borderRadius: '20px',
              border: selectedAmount === amt ? '2px solid #fff' : '2px solid rgba(255,255,255,0.2)',
              background: selectedAmount === amt ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)',
              color: selectedAmount === amt ? '#fff' : 'rgba(255,255,255,0.5)',
              cursor: amt > userBalance ? 'not-allowed' : 'pointer',
              opacity: amt > userBalance ? 0.3 : 1,
              transition: 'all 0.15s ease',
            }}
          >
            ${amt}
          </button>
        ))}
      </div>

      {/* Slide Track */}
      <div style={{
        position: 'relative',
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {/* YES Zone (Left) */}
        <div style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: '30%',
          background: hoveredZone === 'yes'
            ? 'linear-gradient(90deg, rgba(0,240,255,0.3) 0%, transparent 100%)'
            : 'linear-gradient(90deg, rgba(0,240,255,0.1) 0%, transparent 100%)',
          borderRadius: '12px 0 0 12px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background 0.2s ease',
          border: hoveredZone === 'yes' ? '2px solid #00F0FF' : '2px solid transparent',
        }}>
          <div style={{
            fontSize: '24px',
            fontWeight: 900,
            color: '#00F0FF',
            textShadow: hoveredZone === 'yes' ? '0 0 20px #00F0FF' : 'none',
          }}>
            {yesLabel}
          </div>
          <div style={{
            fontSize: '14px',
            fontWeight: 600,
            color: 'rgba(0,240,255,0.7)',
          }}>
            {yesPct}%
          </div>
        </div>

        {/* NO Zone (Right) */}
        <div style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: '30%',
          background: hoveredZone === 'no'
            ? 'linear-gradient(-90deg, rgba(255,0,85,0.3) 0%, transparent 100%)'
            : 'linear-gradient(-90deg, rgba(255,0,85,0.1) 0%, transparent 100%)',
          borderRadius: '0 12px 12px 0',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background 0.2s ease',
          border: hoveredZone === 'no' ? '2px solid #FF0055' : '2px solid transparent',
        }}>
          <div style={{
            fontSize: '24px',
            fontWeight: 900,
            color: '#FF0055',
            textShadow: hoveredZone === 'no' ? '0 0 20px #FF0055' : 'none',
          }}>
            {noLabel}
          </div>
          <div style={{
            fontSize: '14px',
            fontWeight: 600,
            color: 'rgba(255,0,85,0.7)',
          }}>
            {noPct}%
          </div>
        </div>

        {/* Center Track Line */}
        <div style={{
          position: 'absolute',
          left: '30%',
          right: '30%',
          height: '4px',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '2px',
        }} />

        {/* Draggable Coin/Avatar */}
        <div
          ref={coinRef}
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
          style={{
            position: 'relative',
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: isDragging
              ? 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)'
              : 'linear-gradient(135deg, #FFD700 0%, #FF8C00 100%)',
            border: '3px solid #fff',
            boxShadow: isDragging
              ? '0 8px 30px rgba(255,215,0,0.6), 0 0 40px rgba(255,215,0,0.4)'
              : '0 4px 15px rgba(0,0,0,0.4)',
            cursor: isDragging ? 'grabbing' : 'grab',
            transform: `translateX(${dragX}px) scale(${isDragging ? 1.15 : 1})`,
            transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            zIndex: 10,
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

          {/* Drag indicator arrows */}
          {!isDragging && (
            <>
              <div style={{
                position: 'absolute',
                left: '-30px',
                fontSize: '16px',
                opacity: 0.6,
                animation: 'bounce-left 1s ease-in-out infinite',
              }}>
                ←
              </div>
              <div style={{
                position: 'absolute',
                right: '-30px',
                fontSize: '16px',
                opacity: 0.6,
                animation: 'bounce-right 1s ease-in-out infinite',
              }}>
                →
              </div>
            </>
          )}
        </div>

        {/* Potential Win Display */}
        {hoveredZone && (
          <div style={{
            position: 'absolute',
            bottom: '-24px',
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: '12px',
            fontWeight: 700,
            color: hoveredZone === 'yes' ? '#00F0FF' : '#FF0055',
            whiteSpace: 'nowrap',
          }}>
            Win ${potentialWin}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div style={{
        textAlign: 'center',
        fontSize: '11px',
        color: 'rgba(255,255,255,0.4)',
        marginTop: '8px',
      }}>
        ← Slide to {yesLabel} or {noLabel} →
      </div>

      {/* Inject keyframes */}
      <style>{`
        @keyframes bounce-left {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(-5px); }
        }
        @keyframes bounce-right {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(5px); }
        }
      `}</style>
    </div>
  )
}
