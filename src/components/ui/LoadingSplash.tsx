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
// PARTY LOGO — Sweet block of animated tiles!
// ═══════════════════════════════════════════════════════════════════════════

// Tile colors matching the cyberpunk palette
const TILE_COLORS = [
  '#00f0ff', // Cyan
  '#ff0055', // Hot pink
  '#8844ff', // Purple
  '#00ff88', // Green
  '#ffd700', // Gold
  '#ff6600', // Orange
  '#00f0ff', // Cyan
  '#ff0055', // Hot pink
  '#8844ff', // Purple
]

function PartyLogo() {
  return (
    <div className="party-logo">
      {/* 3x3 tile grid */}
      <div className="tile-grid">
        {TILE_COLORS.map((color, i) => (
          <div
            key={i}
            className="logo-tile"
            style={{
              '--tile-color': color,
              animationDelay: `${i * 0.08}s`,
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
