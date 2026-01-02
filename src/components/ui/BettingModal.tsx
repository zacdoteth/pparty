/**
 * BettingModal — Drag Your Avatar to Vote!
 * "The most satisfying way to make a prediction" — UX Lead
 */

import React, { useState, useRef, useEffect } from 'react'
import { playPickup, playHoverTick, playLand, playLockInSound, playChaChing } from '../../utils/sounds'
import './BettingModal.css'

interface Option {
  id: string
  label: string
  pct: number
  color: string
  price?: string  // e.g., "45¢"
}

interface BettingModalProps {
  options: Option[]
  isOpen: boolean
  onClose: () => void
  onBet: (optionId: string) => void
  userAvatar?: string
  userName?: string
}

export default function BettingModal({
  options,
  isOpen,
  onClose,
  onBet,
  userAvatar = '/tg/zac.jpg',
  userName = 'zac.eth'
}: BettingModalProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 })
  const [hoveredOption, setHoveredOption] = useState<string | null>(null)
  const [hasPlacedBet, setHasPlacedBet] = useState(false)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const avatarRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const optionRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setHasPlacedBet(false)
      setSelectedOption(null)
      setDragPosition({ x: 0, y: 0 })
    }
  }, [isOpen])

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    setIsDragging(true)
    playPickup()
  }

  const handleDragMove = (e: MouseEvent | TouchEvent) => {
    if (!isDragging || !containerRef.current) return

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY

    const rect = containerRef.current.getBoundingClientRect()
    const x = clientX - rect.left - rect.width / 2
    const y = clientY - rect.top - rect.height + 80

    setDragPosition({ x, y })

    // Check which option we're hovering over
    let foundOption: string | null = null
    optionRefs.current.forEach((element, optionId) => {
      const optRect = element.getBoundingClientRect()
      if (
        clientX >= optRect.left &&
        clientX <= optRect.right &&
        clientY >= optRect.top &&
        clientY <= optRect.bottom
      ) {
        foundOption = optionId
      }
    })
    // Play sound when entering a new option
    if (foundOption && foundOption !== hoveredOption) {
      playHoverTick(foundOption === 'yes' ? 880 : 660, 0.1)
    }
    setHoveredOption(foundOption)
  }

  const handleDragEnd = () => {
    if (isDragging && hoveredOption) {
      // Success sounds!
      playLand()
      playLockInSound()
      setSelectedOption(hoveredOption)
      setHasPlacedBet(true)
      onBet(hoveredOption)
    }
    setIsDragging(false)
    setDragPosition({ x: 0, y: 0 })
    setHoveredOption(null)
  }

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDragMove)
      window.addEventListener('mouseup', handleDragEnd)
      window.addEventListener('touchmove', handleDragMove)
      window.addEventListener('touchend', handleDragEnd)
    }
    return () => {
      window.removeEventListener('mousemove', handleDragMove)
      window.removeEventListener('mouseup', handleDragEnd)
      window.removeEventListener('touchmove', handleDragMove)
      window.removeEventListener('touchend', handleDragEnd)
    }
  }, [isDragging, hoveredOption])

  if (!isOpen) return null

  return (
    <div className="betting-modal-overlay" onClick={onClose}>
      <div
        ref={containerRef}
        className="betting-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="betting-modal-header">
          <h2>Make Your Prediction</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {/* Options Grid */}
        <div className="betting-options">
          {options.map((option) => (
            <div
              key={option.id}
              ref={(el) => {
                if (el) optionRefs.current.set(option.id, el)
              }}
              className={`betting-option ${hoveredOption === option.id ? 'hovered' : ''} ${selectedOption === option.id ? 'selected' : ''}`}
              style={{
                '--option-color': option.color,
                borderColor: hoveredOption === option.id ? option.color : 'rgba(255,255,255,0.15)'
              } as React.CSSProperties}
            >
              <div className="option-label" style={{ color: option.color }}>
                {option.label}
              </div>
              <div className="option-price" style={{ color: option.color }}>
                {option.price || `${option.pct}¢`}
              </div>
              <div className="option-chance">
                {option.pct}% chance
              </div>
              {selectedOption === option.id && (
                <div className="selected-indicator">
                  <img src={userAvatar} alt={userName} className="selected-avatar" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Draggable Avatar */}
        {!hasPlacedBet && (
          <div className="avatar-dock">
            <div
              ref={avatarRef}
              className={`draggable-avatar ${isDragging ? 'dragging' : ''}`}
              style={{
                transform: isDragging
                  ? `translate(${dragPosition.x}px, ${dragPosition.y}px) scale(1.1)`
                  : 'translate(0, 0) scale(1)'
              }}
              onMouseDown={handleDragStart}
              onTouchStart={handleDragStart}
            >
              <img src={userAvatar} alt={userName} />
              <span className="avatar-cursor">👆</span>
            </div>
            <div className="avatar-name">{userName}</div>
          </div>
        )}

        {/* Instructions */}
        <div className="betting-instructions">
          {hasPlacedBet ? (
            <span className="bet-placed">
              ✓ You're betting on <strong style={{ color: options.find(o => o.id === selectedOption)?.color }}>
                {options.find(o => o.id === selectedOption)?.label}
              </strong>!
            </span>
          ) : (
            <span>👆 Drag your avatar to vote</span>
          )}
        </div>

        {/* Confirm Button */}
        {hasPlacedBet && (
          <button className="confirm-bet-btn" onClick={() => { playChaChing(); onClose(); }}>
            Confirm Prediction
          </button>
        )}
      </div>
    </div>
  )
}
