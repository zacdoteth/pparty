/**
 * Player — THE CHAMELEON AVATAR
 * "Your avatar doesn't just move. It TRANSFORMS." — Nintendo DNA
 *
 * Three States:
 * 1. NEUTRAL (Ghost) — Grayscale, faint white glow
 * 2. HOVER (Chameleon) — Takes on zone's color, pulses
 * 3. LOCKED (Bet) — Full color, snaps into place, particles explode
 */

import React, { useState, useRef, useEffect } from 'react'
import { motion, useMotionValue, useTransform, useSpring, animate } from 'framer-motion'
import ParticleBurst from './ParticleBurst'
import { playHoverTick, playLockInSound } from '../../utils/sounds'

// Player states
const STATES = {
  NEUTRAL: 'neutral',
  HOVER: 'hover',
  LOCKED: 'locked',
}

export default function Player({
  avatarUrl = '/tg/zac.jpg',
  username = 'You',
  activeZone = null,        // { id, color, label } or null
  onDragStart,
  onDrag,
  onDragEnd,
  onLockIn,                 // Called when player locks into a zone
  lockedZone = null,        // If set, player is locked into this zone
  dragConstraints,          // Ref to the board container
}) {
  const [state, setState] = useState(lockedZone ? STATES.LOCKED : STATES.NEUTRAL)
  const [showParticles, setShowParticles] = useState(false)
  const [particleColor, setParticleColor] = useState('#ffffff')
  const playerRef = useRef(null)

  // Motion values for smooth dragging
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  // Spring physics for that SNAP feel
  const springConfig = { stiffness: 500, damping: 30, mass: 1 }
  const springX = useSpring(x, springConfig)
  const springY = useSpring(y, springConfig)

  // Determine current color based on state
  const currentColor = activeZone?.color || lockedZone?.color || 'rgba(255,255,255,0.3)'

  // Track previous zone for sound effects
  const prevZoneRef = useRef(null)

  // Update state based on activeZone and lockedZone
  useEffect(() => {
    if (lockedZone) {
      setState(STATES.LOCKED)
    } else if (activeZone) {
      setState(STATES.HOVER)
      // Play hover tick when entering a NEW zone
      if (activeZone?.id !== prevZoneRef.current?.id) {
        playHoverTick(600 + Math.random() * 200, 0.08)
      }
    } else {
      setState(STATES.NEUTRAL)
    }
    prevZoneRef.current = activeZone
  }, [activeZone, lockedZone])

  // Handle drag start
  const handleDragStart = (event, info) => {
    setState(STATES.NEUTRAL)
    onDragStart?.(event, info)
  }

  // Handle drag
  const handleDrag = (event, info) => {
    onDrag?.(event, info, playerRef.current)
  }

  // Handle drag end — THE LOCK IN MOMENT
  const handleDragEnd = (event, info) => {
    if (activeZone) {
      // LOCKED IN! Trigger the celebration
      setState(STATES.LOCKED)
      setParticleColor(activeZone.color)
      setShowParticles(true)

      // Hide particles after animation
      setTimeout(() => setShowParticles(false), 1000)

      // Play lock-in sound effect (if available)
      try {
        const audio = new Audio('/tg/party1.wav')
        audio.volume = 0.3
        audio.play().catch(() => {})
      } catch {}

      onLockIn?.(activeZone)
    }
    onDragEnd?.(event, info)
  }

  // Visual styles based on state
  const getStateStyles = () => {
    switch (state) {
      case STATES.NEUTRAL:
        return {
          filter: 'grayscale(100%)',
          borderColor: 'rgba(255,255,255,0.3)',
          boxShadow: '0 0 15px rgba(255,255,255,0.2)',
          scale: 1,
        }
      case STATES.HOVER:
        return {
          filter: 'grayscale(50%)',
          borderColor: currentColor,
          boxShadow: `0 0 25px ${currentColor}, 0 0 50px ${currentColor}66`,
          scale: 1.1,
        }
      case STATES.LOCKED:
        return {
          filter: 'grayscale(0%)',
          borderColor: currentColor,
          boxShadow: `0 0 30px ${currentColor}, 0 0 60px ${currentColor}88, inset 0 0 20px ${currentColor}44`,
          scale: 1.05,
        }
      default:
        return {}
    }
  }

  const stateStyles = getStateStyles()

  return (
    <>
      {/* PARTICLE BURST — The celebration! */}
      {showParticles && (
        <ParticleBurst
          x={springX.get()}
          y={springY.get()}
          color={particleColor}
        />
      )}

      {/* THE PLAYER AVATAR */}
      <motion.div
        ref={playerRef}
        className="player-avatar"
        drag
        dragConstraints={dragConstraints}
        dragElastic={0.1}
        dragMomentum={false}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        style={{
          x: springX,
          y: springY,
          position: 'absolute',
          width: 70,
          height: 70,
          borderRadius: '50%',
          cursor: 'grab',
          zIndex: 100,
          touchAction: 'none',
        }}
        animate={{
          scale: stateStyles.scale,
          filter: stateStyles.filter,
          boxShadow: stateStyles.boxShadow,
          borderColor: stateStyles.borderColor,
        }}
        transition={{
          scale: { type: 'spring', stiffness: 400, damping: 25 },
          filter: { duration: 0.2 },
          boxShadow: { duration: 0.15 },
          borderColor: { duration: 0.1 },
        }}
        whileDrag={{ cursor: 'grabbing', scale: 1.15 }}
        whileTap={{ scale: 0.95 }}
      >
        {/* Avatar Image */}
        <motion.div
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            overflow: 'hidden',
            border: '3px solid',
            borderColor: 'inherit',
          }}
          animate={{
            borderColor: stateStyles.borderColor,
            borderWidth: state === STATES.LOCKED ? 4 : 3,
          }}
        >
          <img
            src={avatarUrl}
            alt={username}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              pointerEvents: 'none',
              userSelect: 'none',
            }}
            draggable={false}
          />
        </motion.div>

        {/* Username Label */}
        <motion.div
          style={{
            position: 'absolute',
            bottom: -24,
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: 12,
            fontWeight: 700,
            color: '#fff',
            textShadow: `0 0 10px ${currentColor}`,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
          }}
          animate={{
            color: state === STATES.NEUTRAL ? '#aaa' : '#fff',
            textShadow: state === STATES.NEUTRAL
              ? '0 0 5px rgba(255,255,255,0.3)'
              : `0 0 15px ${currentColor}`,
          }}
        >
          {username}
        </motion.div>

        {/* Lock-in indicator ring */}
        {state === STATES.LOCKED && (
          <motion.div
            style={{
              position: 'absolute',
              inset: -6,
              borderRadius: '50%',
              border: `2px solid ${currentColor}`,
              pointerEvents: 'none',
            }}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{
              scale: [1, 1.3, 1],
              opacity: [1, 0.5, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )}
      </motion.div>
    </>
  )
}
