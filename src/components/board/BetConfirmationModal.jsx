/**
 * BetConfirmationModal — THE MOMENT OF COMMITMENT
 * "This isn't a form. It's the moment before you roll dice with friends." — Nintendo DNA
 *
 * Key Principles:
 * - Feel like a celebration, not a financial form
 * - Payout should animate UP as you slide (dopamine hit)
 * - One-handed operation on mobile
 * - Escape is easy, confirm is satisfying
 */

import React, { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { playButtonPop, playSuccessChime } from '../../utils/sounds'

// Preset bet amounts (Nintendo-style chunky options)
const BET_PRESETS = [5, 10, 25, 50, 100]

export default function BetConfirmationModal({
  isOpen,
  zone,                    // { id, color, label, price, pct }
  user,                    // { username, avatar }
  marketQuestion,
  onConfirm,               // (amount) => void
  onCancel,
  balance = 100,           // User's available balance
}) {
  const [amount, setAmount] = useState(10)
  const [isConfirming, setIsConfirming] = useState(false)

  // Calculate payout based on Kalshi-style pricing
  // Price is in cents (e.g., 30 = 30¢), payout is $1 per share if wins
  const price = zone?.price || 50
  const shares = amount / (price / 100)  // How many shares you get
  const payout = shares * 1               // Each share pays $1 if wins
  const profit = payout - amount

  // Reset amount when modal opens
  useEffect(() => {
    if (isOpen) {
      setAmount(10)
      setIsConfirming(false)
    }
  }, [isOpen])

  // Handle preset click with haptic-like feedback
  const handlePresetClick = useCallback((preset) => {
    setAmount(Math.min(preset, balance))
    playButtonPop(0.06)
  }, [balance])

  // Handle slider change
  const handleSliderChange = useCallback((e) => {
    setAmount(parseInt(e.target.value, 10))
  }, [])

  // Handle confirm with animation
  const handleConfirm = useCallback(async () => {
    setIsConfirming(true)
    playSuccessChime(0.1)
    // Small delay for the satisfying animation
    await new Promise(resolve => setTimeout(resolve, 400))
    onConfirm?.(amount)
  }, [amount, onConfirm])

  // Keyboard escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel?.()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onCancel])

  if (!zone) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="bet-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.85)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              zIndex: 1000,
            }}
          />

          {/* Modal */}
          <motion.div
            className="bet-modal"
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            style={{
              position: 'fixed',
              bottom: 20,
              left: 20,
              right: 20,
              maxWidth: 420,
              margin: '0 auto',
              background: `linear-gradient(180deg, #1a1a2e 0%, #0f0f1a 100%)`,
              borderRadius: 24,
              border: `2px solid ${zone.color}`,
              boxShadow: `0 0 60px ${zone.color}33, 0 20px 60px rgba(0,0,0,0.5)`,
              padding: 24,
              zIndex: 1001,
              overflow: 'hidden',
            }}
          >
            {/* Glow effect at top */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 100,
                background: `linear-gradient(180deg, ${zone.color}22 0%, transparent 100%)`,
                pointerEvents: 'none',
              }}
            />

            {/* Header — Avatar + Zone */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
              {/* User Avatar */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.1 }}
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  border: `3px solid ${zone.color}`,
                  overflow: 'hidden',
                  boxShadow: `0 0 20px ${zone.color}`,
                }}
              >
                <img
                  src={user?.avatar || '/tg/zac.jpg'}
                  alt={user?.username}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </motion.div>

              {/* Zone Info */}
              <div style={{ flex: 1 }}>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 }}
                  style={{
                    fontSize: 14,
                    color: 'rgba(255,255,255,0.6)',
                    marginBottom: 4,
                  }}
                >
                  {user?.username || 'You'} betting on
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  style={{
                    fontSize: 28,
                    fontWeight: 900,
                    color: zone.color,
                    textShadow: `0 0 30px ${zone.color}`,
                    letterSpacing: 1,
                  }}
                >
                  {zone.label}
                </motion.div>
              </div>

              {/* Price Badge */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.25 }}
                style={{
                  padding: '8px 14px',
                  background: `${zone.color}22`,
                  border: `1px solid ${zone.color}`,
                  borderRadius: 12,
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginBottom: 2 }}>
                  PRICE
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: zone.color }}>
                  {price}¢
                </div>
              </motion.div>
            </div>

            {/* Market Question */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              style={{
                fontSize: 13,
                color: 'rgba(255,255,255,0.5)',
                marginBottom: 24,
                padding: '10px 14px',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: 10,
                textAlign: 'center',
              }}
            >
              {marketQuestion}
            </motion.div>

            {/* Amount Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              style={{ marginBottom: 20 }}
            >
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: 12,
              }}>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>
                  BET AMOUNT
                </span>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                  Balance: ${balance}
                </span>
              </div>

              {/* Big Amount Display */}
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <motion.span
                  key={amount}
                  initial={{ scale: 1.2, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  style={{
                    fontSize: 48,
                    fontWeight: 900,
                    color: '#fff',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  ${amount}
                </motion.span>
              </div>

              {/* Preset Buttons */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                {BET_PRESETS.filter(p => p <= balance).map((preset) => (
                  <motion.button
                    key={preset}
                    onClick={() => handlePresetClick(preset)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                      flex: 1,
                      padding: '10px 0',
                      background: amount === preset 
                        ? `linear-gradient(180deg, ${zone.color}44 0%, ${zone.color}22 100%)`
                        : 'rgba(255,255,255,0.08)',
                      border: amount === preset 
                        ? `2px solid ${zone.color}` 
                        : '2px solid rgba(255,255,255,0.1)',
                      borderRadius: 10,
                      color: amount === preset ? zone.color : 'rgba(255,255,255,0.7)',
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    ${preset}
                  </motion.button>
                ))}
              </div>

              {/* Slider */}
              <div style={{ position: 'relative', height: 40 }}>
                <input
                  type="range"
                  min={1}
                  max={balance}
                  value={amount}
                  onChange={handleSliderChange}
                  style={{
                    width: '100%',
                    height: 8,
                    appearance: 'none',
                    WebkitAppearance: 'none',
                    background: `linear-gradient(90deg, ${zone.color} 0%, ${zone.color} ${(amount / balance) * 100}%, rgba(255,255,255,0.1) ${(amount / balance) * 100}%, rgba(255,255,255,0.1) 100%)`,
                    borderRadius: 4,
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                />
              </div>
            </motion.div>

            {/* Payout Preview — THE DOPAMINE HIT */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              style={{
                background: 'rgba(0,0,0,0.3)',
                borderRadius: 16,
                padding: 20,
                marginBottom: 20,
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 4, fontWeight: 600 }}>
                    IF {zone.label.toUpperCase()} WINS
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                    You get
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <motion.div
                    key={payout.toFixed(2)}
                    initial={{ scale: 1.1, color: '#00FF9D' }}
                    animate={{ scale: 1, color: '#fff' }}
                    style={{
                      fontSize: 36,
                      fontWeight: 900,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    ${payout.toFixed(2)}
                  </motion.div>
                  <motion.div
                    key={profit.toFixed(2)}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: '#00FF9D',
                    }}
                  >
                    +${profit.toFixed(2)} profit
                  </motion.div>
                </div>
              </div>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              style={{ display: 'flex', gap: 12 }}
            >
              {/* Cancel */}
              <motion.button
                onClick={onCancel}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  flex: 1,
                  padding: '16px 0',
                  background: 'rgba(255,255,255,0.08)',
                  border: '2px solid rgba(255,255,255,0.15)',
                  borderRadius: 14,
                  color: 'rgba(255,255,255,0.7)',
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                BACK
              </motion.button>

              {/* Confirm — THE BIG BUTTON */}
              <motion.button
                onClick={handleConfirm}
                disabled={isConfirming}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  flex: 2,
                  padding: '16px 0',
                  background: isConfirming
                    ? zone.color
                    : `linear-gradient(180deg, ${zone.color} 0%, ${zone.color}cc 100%)`,
                  border: 'none',
                  borderRadius: 14,
                  color: '#000',
                  fontSize: 16,
                  fontWeight: 900,
                  cursor: isConfirming ? 'default' : 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: `0 0 30px ${zone.color}66`,
                  letterSpacing: 1,
                }}
              >
                {isConfirming ? (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    ✓ LOCKED IN!
                  </motion.span>
                ) : (
                  `BET $${amount} ON ${zone.label.toUpperCase()}`
                )}
              </motion.button>
            </motion.div>

            {/* Fine print */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              style={{
                textAlign: 'center',
                marginTop: 16,
                fontSize: 10,
                color: 'rgba(255,255,255,0.3)',
              }}
            >
              Powered by Kalshi • Settlement guaranteed
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

