/**
 * ParticleBurst — THE CELEBRATION EXPLOSION
 * "When you lock in, the universe celebrates with you." — Nintendo DNA
 *
 * Creates an explosion of particles in the zone's color when player locks in.
 */

import React, { useMemo } from 'react'
import { motion } from 'framer-motion'

export default function ParticleBurst({
  x = 0,
  y = 0,
  color = '#00FF9D',
  particleCount = 16,
}) {
  // Generate particles with random trajectories
  const particles = useMemo(() => {
    return Array.from({ length: particleCount }, (_, i) => {
      const angle = (i / particleCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.5
      const velocity = 80 + Math.random() * 120
      const size = 4 + Math.random() * 8
      const duration = 0.6 + Math.random() * 0.4

      return {
        id: i,
        angle,
        velocity,
        size,
        duration,
        // Calculate end position
        endX: Math.cos(angle) * velocity,
        endY: Math.sin(angle) * velocity,
      }
    })
  }, [particleCount])

  return (
    <div
      style={{
        position: 'absolute',
        left: x + 35, // Center on player (half of 70px)
        top: y + 35,
        pointerEvents: 'none',
        zIndex: 200,
      }}
    >
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          style={{
            position: 'absolute',
            width: particle.size,
            height: particle.size,
            borderRadius: '50%',
            backgroundColor: color,
            boxShadow: `0 0 ${particle.size * 2}px ${color}`,
          }}
          initial={{
            x: 0,
            y: 0,
            scale: 1,
            opacity: 1,
          }}
          animate={{
            x: particle.endX,
            y: particle.endY,
            scale: 0,
            opacity: 0,
          }}
          transition={{
            duration: particle.duration,
            ease: 'easeOut',
          }}
        />
      ))}

      {/* Central flash */}
      <motion.div
        style={{
          position: 'absolute',
          width: 80,
          height: 80,
          left: -40,
          top: -40,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${color}88 0%, transparent 70%)`,
        }}
        initial={{ scale: 0.5, opacity: 1 }}
        animate={{ scale: 2.5, opacity: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      />

      {/* Ring burst */}
      <motion.div
        style={{
          position: 'absolute',
          width: 60,
          height: 60,
          left: -30,
          top: -30,
          borderRadius: '50%',
          border: `3px solid ${color}`,
        }}
        initial={{ scale: 0.5, opacity: 1 }}
        animate={{ scale: 3, opacity: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      />
    </div>
  )
}
