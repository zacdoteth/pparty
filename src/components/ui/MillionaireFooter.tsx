/**
 * MillionaireFooter — THE HIGH-STAKES CONTROL DECK
 * "Who Wants To Be A Millionaire" meets "Cyberpunk Pachinko"
 *
 * Design Philosophy:
 * - NO CLICKS. Press-and-hold to "arm the nuke"
 * - Hexagonal shapes only. Rectangles are for spreadsheets.
 * - Every millisecond of the hold must FEEL expensive
 *
 * The 600ms Hold Sequence:
 * 0-200ms:    "Contact" — Button compresses, border starts filling
 * 200-400ms: "Charging" — Screen dims, spotlight focuses
 * 400-550ms: "Critical" — Chromatic aberration, heartbeat pulse
 * 550-600ms: "Armed" — Freeze frame tension
 * 600ms:      "FIRE" — Flash, particles, haptic, locked in
 */

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence, useAnimation } from 'framer-motion'

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════
interface MillionaireFooterProps {
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
}

interface Particle {
  id: number
  x: number
  y: number
  angle: number
  speed: number
  size: number
  color: string
  life: number
}

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS — The Physics Bible
// ═══════════════════════════════════════════════════════════════════════════
const HOLD_DURATION = 600 // ms to complete the "arm"
const HOLD_PHASES = {
  CONTACT: 0.33,    // 0-200ms: Initial compression
  CHARGING: 0.66,   // 200-400ms: Screen dims
  CRITICAL: 0.92,   // 400-550ms: Chromatic aberration kicks in
  ARMED: 1.0,       // 550-600ms: Freeze frame
}

// Color Palette — Millionaire meets Cyberpunk
const COLORS = {
  yes: {
    primary: '#00FF88',
    secondary: '#00CCFF',
    glow: '#00FF8866',
    dark: '#003322',
  },
  no: {
    primary: '#FF0055',
    secondary: '#FF00AA',
    glow: '#FF005566',
    dark: '#330011',
  },
  glass: {
    bg: 'rgba(10, 15, 30, 0.95)',
    border: 'rgba(255, 255, 255, 0.1)',
    highlight: 'rgba(255, 255, 255, 0.05)',
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// HEXAGON CLIP PATH — The signature shape
// ═══════════════════════════════════════════════════════════════════════════
const HEXAGON_CLIP = 'polygon(5% 0%, 95% 0%, 100% 50%, 95% 100%, 5% 100%, 0% 50%)'
const TRAPEZOID_CLIP = 'polygon(3% 0%, 97% 0%, 100% 100%, 0% 100%)'

// ═══════════════════════════════════════════════════════════════════════════
// PARTICLE SYSTEM — Victory explosion
// ═══════════════════════════════════════════════════════════════════════════
function useParticles() {
  const [particles, setParticles] = useState<Particle[]>([])

  const emit = useCallback((x: number, y: number, color: string, count = 20) => {
    const newParticles: Particle[] = Array.from({ length: count }, (_, i) => ({
      id: Date.now() + i,
      x,
      y,
      angle: (i / count) * Math.PI * 2 + Math.random() * 0.5,
      speed: 3 + Math.random() * 5,
      size: 4 + Math.random() * 8,
      color,
      life: 1,
    }))
    setParticles(prev => [...prev, ...newParticles])
  }, [])

  useEffect(() => {
    if (particles.length === 0) return

    const interval = setInterval(() => {
      setParticles(prev =>
        prev
          .map(p => ({
            ...p,
            x: p.x + Math.cos(p.angle) * p.speed,
            y: p.y + Math.sin(p.angle) * p.speed,
            speed: p.speed * 0.95,
            life: p.life - 0.03,
          }))
          .filter(p => p.life > 0)
      )
    }, 16)

    return () => clearInterval(interval)
  }, [particles.length])

  return { particles, emit }
}

// ═══════════════════════════════════════════════════════════════════════════
// HEXAGON BUTTON — The "Arm the Nuke" component
// ═══════════════════════════════════════════════════════════════════════════
interface HexButtonProps {
  side: 'yes' | 'no'
  label: string
  pct: number
  odds: string
  colors: typeof COLORS.yes
  onComplete: () => void
  isOtherActive: boolean
  disabled?: boolean
}

function HexButton({ side, label, pct, odds, colors, onComplete, isOtherActive, disabled }: HexButtonProps) {
  const [holdProgress, setHoldProgress] = useState(0)
  const [isHolding, setIsHolding] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const holdStartRef = useRef<number | null>(null)
  const animationRef = useRef<number | null>(null)
  const buttonRef = useRef<HTMLDivElement>(null)
  const controls = useAnimation()
  const { particles, emit } = useParticles()

  // The Hold Loop — requestAnimationFrame for butter-smooth progress
  const updateHold = useCallback(() => {
    if (!holdStartRef.current) return

    const elapsed = Date.now() - holdStartRef.current
    const progress = Math.min(elapsed / HOLD_DURATION, 1)
    setHoldProgress(progress)

    if (progress >= 1) {
      // === COMPLETION === The moment of truth
      setIsCompleted(true)
      setIsHolding(false)
      holdStartRef.current = null

      // Haptic feedback (if available)
      if (navigator.vibrate) {
        navigator.vibrate([50, 30, 100]) // Heavy impact pattern
      }

      // Particle burst from button center
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect()
        emit(rect.width / 2, rect.height / 2, colors.primary, 30)
      }

      // Victory animation sequence
      controls.start({
        scale: [1.15, 1],
        transition: {
          type: 'spring',
          stiffness: 300,  // Snappy return
          damping: 8,      // Low damping = overshoot (the "boing")
        }
      })

      // Callback after the flash
      setTimeout(() => {
        onComplete()
      }, 100)

      return
    }

    animationRef.current = requestAnimationFrame(updateHold)
  }, [controls, emit, colors.primary, onComplete])

  // Pointer Down — Start the charge
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (disabled || isCompleted) return

    // Capture pointer for reliable tracking
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)

    holdStartRef.current = Date.now()
    setIsHolding(true)
    setHoldProgress(0)

    // Initial compression — stiff spring for immediate response
    controls.start({
      scale: 0.95,
      transition: {
        type: 'spring',
        stiffness: 400,  // Very stiff = instant response
        damping: 20,     // Moderate damping = controlled
      }
    })

    animationRef.current = requestAnimationFrame(updateHold)
  }, [disabled, isCompleted, controls, updateHold])

  // Pointer Up — Release or cancel
  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }

    if (!isCompleted) {
      // Cancel — drain the progress with a "whoosh"
      holdStartRef.current = null
      setIsHolding(false)

      // Animate progress draining (3x speed)
      const drainInterval = setInterval(() => {
        setHoldProgress(prev => {
          if (prev <= 0) {
            clearInterval(drainInterval)
            return 0
          }
          return prev - 0.05 // 3x faster than fill
        })
      }, 16)

      // Release spring
      controls.start({
        scale: 1,
        transition: {
          type: 'spring',
          stiffness: 300,
          damping: 15,
        }
      })
    }
  }, [isCompleted, controls])

  // Pointer Leave — Cancel if dragged off
  const handlePointerLeave = useCallback(() => {
    if (isHolding && !isCompleted) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      holdStartRef.current = null
      setIsHolding(false)
      setHoldProgress(0)

      controls.start({
        scale: 1,
        transition: { type: 'spring', stiffness: 300, damping: 15 }
      })
    }
  }, [isHolding, isCompleted, controls])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  // Phase-based effects
  const phase = holdProgress < HOLD_PHASES.CONTACT ? 'contact'
    : holdProgress < HOLD_PHASES.CHARGING ? 'charging'
    : holdProgress < HOLD_PHASES.CRITICAL ? 'critical'
    : 'armed'

  // Chromatic aberration intensity (kicks in at critical phase)
  const chromaticIntensity = phase === 'critical' || phase === 'armed'
    ? (holdProgress - HOLD_PHASES.CHARGING) / (1 - HOLD_PHASES.CHARGING) * 3
    : 0

  // Heartbeat pulse at critical phase
  const pulseScale = phase === 'critical' || phase === 'armed'
    ? 1 + Math.sin(Date.now() / 100) * 0.02 * holdProgress
    : 1

  return (
    <motion.div
      ref={buttonRef}
      className="relative flex-1 select-none touch-none"
      animate={controls}
      style={{
        opacity: isOtherActive ? 0.3 : 1,
        transition: 'opacity 0.2s ease',
      }}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      onPointerCancel={handlePointerUp}
    >
      {/* === GLOW LAYER === Expands during hold */}
      <motion.div
        className="absolute inset-0 blur-xl"
        style={{
          clipPath: HEXAGON_CLIP,
          background: colors.primary,
          opacity: 0.2 + holdProgress * 0.4,
          transform: `scale(${1 + holdProgress * 0.15})`,
        }}
      />

      {/* === MAIN HEXAGON === */}
      <div
        className="relative h-full overflow-hidden"
        style={{
          clipPath: HEXAGON_CLIP,
          background: `linear-gradient(180deg, ${colors.dark} 0%, rgba(0,0,0,0.9) 100%)`,
          transform: `scale(${pulseScale})`,
          // Chromatic aberration effect via text-shadow simulation
          filter: chromaticIntensity > 0
            ? `drop-shadow(${chromaticIntensity}px 0 0 rgba(255,0,0,0.5)) drop-shadow(-${chromaticIntensity}px 0 0 rgba(0,255,255,0.5))`
            : 'none',
        }}
      >
        {/* Border Progress — The charging ring */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id={`grad-${side}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={colors.primary} />
              <stop offset="100%" stopColor={colors.secondary} />
            </linearGradient>
          </defs>

          {/* Background border */}
          <polygon
            points="5,0 95,0 100,50 95,100 5,100 0,50"
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />

          {/* Progress border — fills clockwise */}
          <polygon
            points="5,0 95,0 100,50 95,100 5,100 0,50"
            fill="none"
            stroke={`url(#grad-${side})`}
            strokeWidth="3"
            vectorEffect="non-scaling-stroke"
            strokeDasharray="400"
            strokeDashoffset={400 - (holdProgress * 400)}
            style={{
              filter: `drop-shadow(0 0 ${4 + holdProgress * 8}px ${colors.primary})`,
              transition: 'stroke-dashoffset 0.05s linear',
            }}
          />
        </svg>

        {/* Inner content */}
        <div className="relative h-full flex flex-col items-center justify-center p-4 z-10">
          {/* Percentage */}
          <div
            className="text-5xl font-black tracking-tight"
            style={{
              color: colors.primary,
              textShadow: `0 0 30px ${colors.glow}, 0 0 60px ${colors.glow}`,
              fontFamily: "'DIN Condensed', 'Arial Narrow', sans-serif",
            }}
          >
            {pct}%
          </div>

          {/* Label */}
          <div
            className="text-2xl font-black tracking-widest mt-1"
            style={{
              color: '#fff',
              textShadow: '0 2px 10px rgba(0,0,0,0.8)',
            }}
          >
            {label}
          </div>

          {/* Odds */}
          <div
            className="text-sm font-medium mt-2 opacity-60"
            style={{ color: colors.primary }}
          >
            {odds}
          </div>

          {/* Hold instruction */}
          <AnimatePresence>
            {!isHolding && !isCompleted && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 0.5, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute bottom-4 text-xs font-medium tracking-wider text-white/50"
              >
                HOLD TO BET
              </motion.div>
            )}
          </AnimatePresence>

          {/* Charging indicator */}
          <AnimatePresence>
            {isHolding && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute bottom-4 text-xs font-black tracking-widest"
                style={{ color: colors.primary }}
              >
                {phase === 'armed' ? '>>> RELEASE <<<' : `CHARGING ${Math.round(holdProgress * 100)}%`}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Completion flash */}
          <AnimatePresence>
            {isCompleted && (
              <motion.div
                initial={{ opacity: 1 }}
                animate={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 bg-white z-20"
                style={{ clipPath: HEXAGON_CLIP }}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Glass highlight */}
        <div
          className="absolute inset-x-0 top-0 h-1/3 pointer-events-none"
          style={{
            background: 'linear-gradient(180deg, rgba(255,255,255,0.1) 0%, transparent 100%)',
          }}
        />
      </div>

      {/* === PARTICLES === */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ clipPath: HEXAGON_CLIP }}>
        {particles.map(p => (
          <motion.div
            key={p.id}
            className="absolute rounded-full"
            style={{
              left: p.x,
              top: p.y,
              width: p.size,
              height: p.size,
              background: p.color,
              opacity: p.life,
              boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
            }}
          />
        ))}
      </div>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT — The Millionaire Footer
// ═══════════════════════════════════════════════════════════════════════════
export default function MillionaireFooter({
  question,
  yesLabel = 'YES',
  noLabel = 'NO',
  yesPct = 65,
  noPct = 35,
  yesOdds = '1.5x payout',
  noOdds = '2.8x payout',
  onBet,
  betAmount = 20,
  disabled = false,
  userBalance = 250,
}: MillionaireFooterProps) {
  const [activeButton, setActiveButton] = useState<'yes' | 'no' | null>(null)
  const [showSpotlight, setShowSpotlight] = useState(false)

  const handleYesBet = useCallback(() => {
    onBet('yes', betAmount)
  }, [onBet, betAmount])

  const handleNoBet = useCallback(() => {
    onBet('no', betAmount)
  }, [onBet, betAmount])

  return (
    <>
      {/* === SPOTLIGHT OVERLAY === Dims the world during hold */}
      <AnimatePresence>
        {showSpotlight && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 z-40 pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* === THE FOOTER === */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50"
        style={{
          height: '35vh',
          minHeight: 280,
          maxHeight: 400,
        }}
      >
        {/* Background glass */}
        <div
          className="absolute inset-0"
          style={{
            background: COLORS.glass.bg,
            borderTop: `1px solid ${COLORS.glass.border}`,
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          }}
        />

        {/* Content */}
        <div className="relative h-full flex flex-col p-4">

          {/* === QUESTION BAR === Trapezoid header */}
          <div
            className="relative mb-4 py-3 px-6"
            style={{
              clipPath: TRAPEZOID_CLIP,
              background: 'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            {/* Glass highlight */}
            <div
              className="absolute inset-x-0 top-0 h-1/2"
              style={{
                background: 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, transparent 100%)',
              }}
            />

            <div className="relative text-center">
              <div className="text-xs font-medium tracking-widest text-white/40 mb-1">
                PREDICTION
              </div>
              <div
                className="text-lg font-black tracking-wide text-white"
                style={{
                  textShadow: '0 2px 20px rgba(0,0,0,0.5)',
                  fontFamily: "'DIN Condensed', 'Arial Narrow', sans-serif",
                }}
              >
                {question}
              </div>
            </div>

            {/* Balance indicator */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-right">
              <div className="text-xs text-white/40">BALANCE</div>
              <div className="text-sm font-bold text-white">${userBalance}</div>
            </div>
          </div>

          {/* === BET AMOUNT SELECTOR === */}
          <div className="flex justify-center gap-2 mb-4">
            {[10, 25, 50, 100].map((amt) => (
              <button
                key={amt}
                className={`
                  px-4 py-1.5 text-sm font-bold tracking-wide
                  transition-all duration-150
                  ${betAmount === amt
                    ? 'bg-white/20 text-white border-white/40'
                    : 'bg-white/5 text-white/50 border-white/10 hover:bg-white/10'
                  }
                `}
                style={{
                  clipPath: 'polygon(10% 0%, 90% 0%, 100% 50%, 90% 100%, 10% 100%, 0% 50%)',
                  border: '1px solid',
                }}
              >
                ${amt}
              </button>
            ))}
          </div>

          {/* === THE BUTTONS === Split 50/50 */}
          <div className="flex-1 flex gap-3">
            <HexButton
              side="yes"
              label={yesLabel}
              pct={yesPct}
              odds={yesOdds}
              colors={COLORS.yes}
              onComplete={handleYesBet}
              isOtherActive={activeButton === 'no'}
              disabled={disabled}
            />
            <HexButton
              side="no"
              label={noLabel}
              pct={noPct}
              odds={noOdds}
              colors={COLORS.no}
              onComplete={handleNoBet}
              isOtherActive={activeButton === 'yes'}
              disabled={disabled}
            />
          </div>

          {/* === FOOTER INFO === */}
          <div className="flex justify-between items-center mt-3 px-2 text-xs text-white/30">
            <span>Powered by Kalshi</span>
            <span>Hold 0.6s to confirm</span>
            <span>Settlement guaranteed</span>
          </div>
        </div>
      </div>
    </>
  )
}
