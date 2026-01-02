/**
 * Board — THE CHAMELEON STAGE
 * "The board breathes. It responds. It LIVES." — Nintendo DNA
 *
 * Dynamic zone rendering based on outcomes array.
 * Handles zone detection for the Player's chameleon effect.
 */

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Player from './Player'
import BetConfirmationModal from './BetConfirmationModal'
import './Board.css'

export default function Board({
  outcomes = [],
  currentUser = { id: 'user', username: 'zac.eth', avatar: '/tg/zac.jpg' },
  marketQuestion = 'Will this happen?',
  userBalance = 100,
  onVote,
  onBetConfirm,
}) {
  const boardRef = useRef(null)
  const zoneRefs = useRef({})
  const [activeZone, setActiveZone] = useState(null)
  const [lockedZone, setLockedZone] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  
  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [pendingZone, setPendingZone] = useState(null)

  // Detect which zone the player is hovering over
  const detectZone = useCallback((playerElement) => {
    if (!playerElement || !boardRef.current) return null

    const playerRect = playerElement.getBoundingClientRect()
    const playerCenterX = playerRect.left + playerRect.width / 2
    const playerCenterY = playerRect.top + playerRect.height / 2

    // Check each zone
    for (const outcome of outcomes) {
      const zoneEl = zoneRefs.current[outcome.id]
      if (!zoneEl) continue

      const zoneRect = zoneEl.getBoundingClientRect()

      // Is player center inside this zone?
      if (
        playerCenterX >= zoneRect.left &&
        playerCenterX <= zoneRect.right &&
        playerCenterY >= zoneRect.top &&
        playerCenterY <= zoneRect.bottom
      ) {
        return outcome
      }
    }

    return null
  }, [outcomes])

  // Handle player drag
  const handleDrag = useCallback((event, info, playerElement) => {
    const zone = detectZone(playerElement)
    setActiveZone(zone)
  }, [detectZone])

  // Handle drag start
  const handleDragStart = useCallback(() => {
    setIsDragging(true)
    setLockedZone(null) // Unlock when starting to drag again
  }, [])

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Handle lock in — Show modal instead of immediate lock
  const handleLockIn = useCallback((zone) => {
    // Don't immediately lock — show the modal first
    setPendingZone(zone)
    setShowModal(true)
    // Keep the zone active while modal is open
  }, [])

  // Handle modal confirm
  const handleBetConfirm = useCallback((amount) => {
    if (pendingZone) {
      setLockedZone(pendingZone)
      setActiveZone(null)
      setShowModal(false)
      onVote?.(pendingZone)
      onBetConfirm?.(pendingZone, amount)
      setPendingZone(null)
    }
  }, [pendingZone, onVote, onBetConfirm])

  // Handle modal cancel
  const handleBetCancel = useCallback(() => {
    setShowModal(false)
    setPendingZone(null)
    setActiveZone(null)
  }, [])

  // Store zone ref
  const setZoneRef = useCallback((id) => (el) => {
    zoneRefs.current[id] = el
  }, [])

  return (
    <div className="chameleon-board-wrapper">
      {/* THE BOARD */}
      <motion.div
        ref={boardRef}
        className="chameleon-board"
        style={{
          '--zone-count': outcomes.length,
        }}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        {/* ZONES — Dynamically rendered */}
        <div className="zones-container">
          <AnimatePresence>
            {outcomes.map((outcome, index) => (
              <Zone
                key={outcome.id}
                outcome={outcome}
                index={index}
                total={outcomes.length}
                isActive={activeZone?.id === outcome.id}
                isLocked={lockedZone?.id === outcome.id}
                isDragging={isDragging}
                ref={setZoneRef(outcome.id)}
              />
            ))}
          </AnimatePresence>
        </div>

        {/* LOBBY — Bottom area where player starts */}
        <div className="lobby-area">
          <Player
            avatarUrl={currentUser.avatar}
            username={currentUser.username}
            activeZone={activeZone}
            lockedZone={lockedZone}
            onDragStart={handleDragStart}
            onDrag={handleDrag}
            onDragEnd={handleDragEnd}
            onLockIn={handleLockIn}
            dragConstraints={boardRef}
          />
        </div>
      </motion.div>

      {/* INSTRUCTIONS */}
      <motion.div
        className="board-instructions"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        {lockedZone ? (
          <span style={{ color: lockedZone.color }}>
            ✓ Locked in on <strong>{lockedZone.label}</strong>! Drag to change.
          </span>
        ) : isDragging ? (
          <span>Drop on a zone to pick your side!</span>
        ) : (
          <span>👆 Drag your avatar to vote</span>
        )}
      </motion.div>

      {/* BET CONFIRMATION MODAL */}
      <BetConfirmationModal
        isOpen={showModal}
        zone={pendingZone}
        user={currentUser}
        marketQuestion={marketQuestion}
        balance={userBalance}
        onConfirm={handleBetConfirm}
        onCancel={handleBetCancel}
      />
    </div>
  )
}

/**
 * Zone — Individual voting zone
 * "The zone should INVITE you in. Like a spotlight at a concert." — Miyamoto wisdom
 */
const Zone = motion.create(
  function ZoneInner({ outcome, index, total, isActive, isLocked, isDragging }, ref) {
    const { id, color, label, pct = 0, price } = outcome

    return (
      <motion.div
        ref={ref}
        className={`zone ${isActive ? 'active' : ''} ${isLocked ? 'locked' : ''}`}
        style={{
          '--zone-color': color,
          '--zone-index': index,
        }}
        initial={{ flex: 0, opacity: 0 }}
        animate={{
          flex: 1,
          opacity: 1,
          scale: isActive ? 1.02 : 1,
          borderColor: isActive || isLocked ? color : 'rgba(255,255,255,0.1)',
        }}
        exit={{ flex: 0, opacity: 0 }}
        transition={{
          flex: { duration: 0.6, ease: [0.4, 0, 0.2, 1], delay: index * 0.1 },
          opacity: { duration: 0.4, delay: index * 0.1 },
          scale: { type: 'spring', stiffness: 300, damping: 20 },
          borderColor: { duration: 0.15 },
        }}
      >
        {/* ═══ SPOTLIGHT BEAM — The dramatic top-down light ═══ */}
        <div className="zone-spotlight" />

        {/* ═══ FLOOR GLOW — Light pooling at ground level ═══ */}
        <div className="zone-floor-glow" />

        {/* ═══ GRID PATTERN — Dance floor lights up ═══ */}
        <div className="zone-grid" />

        {/* ═══ RIPPLE RINGS — Expanding circles ═══ */}
        <div className="zone-ripple" />
        <div className="zone-ripple" />
        <div className="zone-ripple" />

        {/* Zone glow overlay */}
        <motion.div
          className="zone-glow"
          animate={{
            opacity: isActive ? 0.4 : isLocked ? 0.25 : 0.05,
          }}
          transition={{ duration: 0.15 }}
        />

        {/* Zone content */}
        <div className="zone-content">
          <motion.span
            className="zone-label"
            animate={{
              scale: isActive ? 1.15 : 1,
              y: isActive ? -5 : 0,
              textShadow: isActive
                ? `0 0 40px ${color}, 0 0 80px ${color}, 0 0 120px ${color}`
                : isLocked
                ? `0 0 30px ${color}, 0 0 60px ${color}`
                : `0 0 10px ${color}`,
            }}
            transition={{
              scale: { type: 'spring', stiffness: 400, damping: 20 },
              y: { type: 'spring', stiffness: 400, damping: 25 },
            }}
          >
            {label}
          </motion.span>

          {/* Price indicator (Kalshi-style cents) */}
          {price !== undefined && (
            <motion.span
              className="zone-price"
              animate={{
                scale: isActive ? 1.1 : 1,
                opacity: isActive ? 1 : 0.8,
              }}
            >
              {price}¢
            </motion.span>
          )}

          {pct > 0 && (
            <motion.span
              className="zone-pct"
              animate={{
                opacity: isActive ? 1 : 0.6,
                scale: isActive ? 1.05 : 1,
              }}
            >
              {pct}% chance
            </motion.span>
          )}
        </div>

        {/* Locked indicator */}
        {isLocked && (
          <motion.div
            className="locked-indicator"
            initial={{ scale: 0, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
          >
            ✓ YOUR PICK
          </motion.div>
        )}

        {/* INVITE TEXT — Shows when hovering */}
        {isActive && !isLocked && (
          <motion.div
            className="zone-invite"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            Drop to bet {label}
          </motion.div>
        )}

        {/* Pulse ring when active */}
        {isActive && (
          <motion.div
            className="zone-pulse"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{
              scale: [1, 1.03, 1],
              opacity: [0.4, 0.6, 0.4],
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )}
      </motion.div>
    )
  },
  { forwardRef: true }
)
