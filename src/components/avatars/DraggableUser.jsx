/**
 * DraggableUser — YOUR AVATAR IN THE CLUB
 * "You're not watching the party. You're IN the party." — Nintendo DNA
 *
 * This is the CURRENT USER's avatar that can be dragged to a zone.
 * Once they pick a side and bet, they become a regular StickFigure.
 *
 * Works INSIDE the isometric ClubRoom scene.
 */

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { playHoverTick, playLockInSound, playWhoosh, playLand, playPickup } from '../../utils/sounds'
import './DraggableUser.css'

// Zone detection helper — searches the ENTIRE document for zones
const detectZone = (element, containerRef) => {
  if (!element) return null

  const rect = element.getBoundingClientRect()
  const centerX = rect.left + rect.width / 2
  const centerY = rect.top + rect.height / 2

  // Search entire document for zones (more reliable)
  const searchRoot = containerRef?.current || document

  // Find YES and NO zones (binary market)
  const yesZone = searchRoot.querySelector('.floor-zone.yes')
  const noZone = searchRoot.querySelector('.floor-zone.no')

  if (yesZone) {
    const yesRect = yesZone.getBoundingClientRect()
    if (centerX >= yesRect.left && centerX <= yesRect.right &&
        centerY >= yesRect.top && centerY <= yesRect.bottom) {
      return 'yes'
    }
  }

  if (noZone) {
    const noRect = noZone.getBoundingClientRect()
    if (centerX >= noRect.left && centerX <= noRect.right &&
        centerY >= noRect.top && centerY <= noRect.bottom) {
      return 'no'
    }
  }

  // Check for multi-choice zones (zone1, zone2, zone3)
  for (let i = 1; i <= 3; i++) {
    const zone = searchRoot.querySelector(`.floor-zone.zone${i}`)
    if (zone) {
      const zoneRect = zone.getBoundingClientRect()
      if (centerX >= zoneRect.left && centerX <= zoneRect.right &&
          centerY >= zoneRect.top && centerY <= zoneRect.bottom) {
        return `zone${i}`
      }
    }
  }

  return null
}

export default function DraggableUser({
  username = 'You',
  avatarUrl = '/tg/zac.jpg',
  color = '#FFD700', // Gold for "undecided"
  containerRef,      // For zone detection (falls back to document)
  onZoneEnter,
  onZoneDrop,
  hasBet = false, // If true, user already bet and shouldn't be draggable
  betSide = null, // Which side they bet on
}) {
  const [isDragging, setIsDragging] = useState(false)
  const [hoveredZone, setHoveredZone] = useState(null)
  const [justLanded, setJustLanded] = useState(false)
  const playerRef = useRef(null)
  const lastZoneRef = useRef(null)
  const velocityRef = useRef({ x: 0, y: 0 })

  // Motion values for drag
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  // NINTENDO SPRING — Snappy but with weight
  const springConfig = { stiffness: 600, damping: 35, mass: 0.8 }
  const springX = useSpring(x, springConfig)
  const springY = useSpring(y, springConfig)

  // SQUASH & STRETCH — Based on velocity
  const velocityX = useMotionValue(0)
  const velocityY = useMotionValue(0)

  // Transform velocity into squash/stretch
  const scaleX = useTransform(velocityX, [-1000, 0, 1000], [0.85, 1, 0.85])
  const scaleY = useTransform(velocityY, [-1000, 0, 1000], [1.15, 1, 0.85])

  // Current color based on hover state
  const currentColor = hoveredZone === 'yes' ? '#00F0FF'
    : hoveredZone === 'no' ? '#FF0055'
    : hoveredZone?.startsWith('zone') ? 'var(--zone-color)'
    : color

  // Handle drag — track velocity for squash/stretch
  const handleDrag = useCallback((event, info) => {
    // Update velocity for squash/stretch
    velocityX.set(info.velocity.x)
    velocityY.set(info.velocity.y)
    velocityRef.current = { x: info.velocity.x, y: info.velocity.y }

    if (!containerRef) return
    const zone = detectZone(playerRef.current, containerRef)

    // SOUND: Pop when entering a new zone
    if (zone !== lastZoneRef.current) {
      if (zone) {
        playHoverTick(zone === 'yes' ? 880 : zone === 'no' ? 660 : 770, 0.08)
      }
      lastZoneRef.current = zone
    }

    if (zone !== hoveredZone) {
      setHoveredZone(zone)
      onZoneEnter?.(zone)
    }
  }, [containerRef, hoveredZone, onZoneEnter, velocityX, velocityY])

  // Handle drag start — PICKUP SOUND
  const handleDragStart = useCallback(() => {
    setIsDragging(true)
    setJustLanded(false)
    playPickup()
  }, [])

  // Handle drag end — LAND with screen shake if dropping in zone
  const handleDragEnd = useCallback((event, info) => {
    setIsDragging(false)

    // Reset velocity smoothly
    velocityX.set(0)
    velocityY.set(0)

    if (hoveredZone) {
      // SOUND: Success chime
      playLand()
      playLockInSound()

      // SCREEN SHAKE — Nintendo impact!
      document.body.classList.add('screen-shake')
      setTimeout(() => document.body.classList.remove('screen-shake'), 300)

      // Landing squash
      setJustLanded(true)
      setTimeout(() => setJustLanded(false), 200)

      onZoneDrop?.(hoveredZone)
    } else {
      // Dropped outside — sad whoosh back
      playWhoosh()
    }

    setHoveredZone(null)
    lastZoneRef.current = null
  }, [hoveredZone, onZoneDrop, velocityX, velocityY])

  // Don't render if user already bet (they're now a StickFigure)
  if (hasBet) return null

  return (
    <motion.div
      ref={playerRef}
      className={`draggable-user ${isDragging ? 'dragging' : ''} ${hoveredZone ? `hovering-${hoveredZone}` : ''} ${justLanded ? 'landed' : ''}`}
      drag
      dragConstraints={{ top: -500, bottom: 100, left: -500, right: 500 }}
      dragElastic={0.15}
      dragMomentum={true}
      dragTransition={{ bounceStiffness: 300, bounceDamping: 20 }}
      onDragStart={handleDragStart}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      style={{
        x: springX,
        y: springY,
        scaleX: isDragging ? scaleX : 1,
        scaleY: isDragging ? scaleY : 1,
        '--user-color': currentColor,
      }}
      animate={{
        scale: justLanded ? [1, 1.2, 0.9, 1.05, 1] : isDragging ? 1.1 : hoveredZone ? 1.08 : 1,
        rotate: isDragging ? [0, -2, 2, -1, 1, 0] : 0,
      }}
      transition={{
        scale: justLanded
          ? { duration: 0.3, times: [0, 0.2, 0.5, 0.8, 1] }
          : { type: 'spring', stiffness: 500, damping: 25 },
        rotate: { duration: 0.5, repeat: isDragging ? Infinity : 0 }
      }}
      whileTap={{ scale: 0.92 }}
    >
      {/* Shadow on floor */}
      <div className="draggable-user-shadow" />

      {/* Speech bubble — EPIC GOLDEN STYLE! */}
      <motion.div
        className="drag-speech"
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {hoveredZone 
          ? `🎯 DROP FOR ${hoveredZone.toUpperCase().replace('ZONE', '')}!`
          : '👆 DRAG ME TO VOTE!'
        }
      </motion.div>

      {/* The sprite */}
      <div className="draggable-user-sprite">
        {/* Head with photo */}
        <div className="user-head">
          <img src={avatarUrl} alt={username} draggable={false} />
        </div>

        {/* Body */}
        <div className="user-body" />

        {/* Arms */}
        <div className="user-arms" />

        {/* Legs */}
        <div className="user-legs">
          <span className="leg-left" />
          <span className="leg-right" />
        </div>
      </div>

      {/* Username badge */}
      <div className="user-name-badge">{username}</div>

      {/* Glow ring when hovering zone */}
      {hoveredZone && (
        <motion.div
          className="hover-ring"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      )}
    </motion.div>
  )
}

