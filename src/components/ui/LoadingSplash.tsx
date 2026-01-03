/**
 * LoadingSplash — Branded loading screen with progress
 * "First impression is everything" — Nintendo Philosophy
 *
 * Shows while Three.js assets load, then fades out with style
 */

import React, { useEffect, useState, useRef, useMemo } from 'react'
import './LoadingSplash.css'

interface LoadingSplashProps {
  progress: number  // 0-100
  isLoaded: boolean
  onIntroComplete?: () => void
}

// ═══════════════════════════════════════════════════════════════════════════
// PARTY LOGO — Dance Floor Tiles Style!
// "Same jelly glass tiles from the 3D floor" — Art Director
// ═══════════════════════════════════════════════════════════════════════════

// CYBERPUNK COLORS — Exact match from DanceFloor.tsx!
const DANCE_FLOOR_COLORS = [
  '#00F0FF',  // CYAN — "The Tron Look"
  '#FF0055',  // HOT PINK — "The Cyberpunk Look"
  '#BD00FF',  // ELECTRIC PURPLE
  '#00F0FF',  // CYAN
  '#FFD700',  // GOLD — Center tile!
  '#FF0055',  // HOT PINK
  '#39FF14',  // ACID GREEN
  '#BD00FF',  // ELECTRIC PURPLE
  '#00F0FF',  // CYAN
]

interface PartyLogoProps {
  size?: 'small' | 'medium' | 'large'
  className?: string
}

export function PartyLogo({ size = 'medium', className = '' }: PartyLogoProps) {
  const sizeClasses = {
    small: 'party-logo party-logo-small',
    medium: 'party-logo',
    large: 'party-logo party-logo-large',
  }

  return (
    <div className={`${sizeClasses[size]} ${className}`}>
      {/* 3x3 jelly tile grid — matches dance floor! */}
      <div className="tile-grid">
        {DANCE_FLOOR_COLORS.map((color, i) => (
          <div
            key={i}
            className="logo-tile jelly"
            style={{
              '--tile-color': color,
              animationDelay: `${i * 0.1}s`,
            } as React.CSSProperties}
          />
        ))}
      </div>
      {/* Glow effect behind tiles */}
      <div className="tile-glow" />
    </div>
  )
}

export default function LoadingSplash({ progress, isLoaded, onIntroComplete }: LoadingSplashProps) {
  const [phase, setPhase] = useState<'loading' | 'ready' | 'revealing' | 'done'>('loading')

  // ═══ SMOOTH PROGRESS — Never go backwards! ═══
  const maxProgressRef = useRef(0)
  const smoothProgress = useMemo(() => {
    maxProgressRef.current = Math.max(maxProgressRef.current, progress)
    return maxProgressRef.current
  }, [progress])

  // Memoize particles BEFORE any early returns (React hooks rule!)
  const particles = useMemo(() =>
    Array.from({ length: 20 }).map(() => ({
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 3}s`,
      duration: `${2 + Math.random() * 3}s`,
    })), []
  )

  useEffect(() => {
    if (isLoaded && phase === 'loading') {
      // Brief "READY" flash
      setPhase('ready')
      setTimeout(() => {
        setPhase('revealing')
        // Notify parent to start intro animation
        setTimeout(() => {
          setPhase('done')
          onIntroComplete?.()
        }, 800) // Splash fade-out duration
      }, 400)
    }
  }, [isLoaded, phase, onIntroComplete])

  if (phase === 'done') return null

  return (
    <div className={`loading-splash ${phase}`}>
      {/* Background with animated gradient */}
      <div className="splash-bg">
        <div className="splash-gradient" />
        <div className="splash-particles">
          {particles.map((p, i) => (
            <div key={i} className="particle" style={{
              left: p.left,
              animationDelay: p.delay,
              animationDuration: p.duration,
            }} />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="splash-content">
        {/* Logo/Title */}
        <div className="splash-logo">
          <PartyLogo />
          <h1 className="logo-text">PREDICTION PARTY</h1>
          <p className="logo-tagline">WHERE FRIENDS BET ON THE FUTURE</p>
        </div>

        {/* Progress Bar */}
        <div className="splash-progress">
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${smoothProgress}%` }}
            />
            <div className="progress-glow" style={{ left: `${smoothProgress}%` }} />
          </div>
          <div className="progress-text">
            {phase === 'loading' && `LOADING ${Math.round(smoothProgress)}%`}
            {phase === 'ready' && 'READY'}
            {phase === 'revealing' && 'LET\'S GO'}
          </div>
        </div>

        {/* Animated dots */}
        <div className="splash-dots">
          <span className="dot" />
          <span className="dot" />
          <span className="dot" />
        </div>
      </div>
    </div>
  )
}
