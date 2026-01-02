/**
 * CombinedSidebar — Spotify-style market list + betting panel
 * "Desktop: fixed right sidebar. Mobile: swipe-up bottom sheet" — UX Architect
 */

import React, { useState, useRef, useCallback, useEffect } from 'react'
import './CombinedSidebar.css'

// ═══════════════════════════════════════════════════════════════════════════
// MARKET CARD — Individual market in the list
// ═══════════════════════════════════════════════════════════════════════════
function MarketCard({ market, isSelected, onSelect }) {
  return (
    <button
      className={`market-card ${isSelected ? 'selected' : ''}`}
      onClick={() => onSelect(market.id)}
    >
      <div className="market-card-header">
        <span className="market-card-live">LIVE</span>
        <span className="market-card-volume">${market.volume || '12.4K'}</span>
      </div>
      <h3 className="market-card-title">{market.name}</h3>
      <div className="market-card-options">
        {market.options?.slice(0, 4).map(opt => (
          <span
            key={opt.id}
            className="market-card-option"
            style={{ color: opt.color }}
          >
            {opt.label?.slice(0, 3)}{opt.pct}%
          </span>
        ))}
        {market.options?.length > 4 && (
          <span className="market-card-more">+{market.options.length - 4}</span>
        )}
      </div>
    </button>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// BETTING SECTION — Casino Roulette Style!
// "Drag your chip to place your bet, then lock it in!" — Vegas Baby!
// ═══════════════════════════════════════════════════════════════════════════
function BettingSection({ market, onBet, balance = 250, selectedOption, onOptionSelect, onPreviewZone, userAvatar = '/tg/zac.jpg' }) {
  const [amount, setAmount] = useState(10)
  const [isDragging, setIsDragging] = useState(false)
  const [chipPos, setChipPos] = useState({ x: 0, y: 0 })
  const [hoveredZone, setHoveredZone] = useState(null)
  const [pendingZone, setPendingZone] = useState(null)
  const chipRef = useRef(null)
  const containerRef = useRef(null)
  const popupRef = useRef(null)
  const dragStartCursor = useRef({ x: 0, y: 0 })
  const dragStartChipPos = useRef({ x: 0, y: 0 })

  // ═══ PREVIEW MODE — Tell parent about chip hover/placement! ═══
  useEffect(() => {
    // Priority: hovered zone (during drag) > pending zone (after drop)
    const previewZone = hoveredZone || pendingZone
    onPreviewZone?.(previewZone)
  }, [hoveredZone, pendingZone, onPreviewZone])

  // ═══ CLICK OUTSIDE — Dismiss popup when clicking elsewhere! ═══
  useEffect(() => {
    if (!pendingZone || isDragging) return

    const handleClickOutside = (e) => {
      // Check if clicking inside popup or chip
      const clickedPopup = popupRef.current?.contains(e.target)
      const clickedChip = chipRef.current?.contains(e.target)

      if (!clickedPopup && !clickedChip) {
        setPendingZone(null)
        setChipPos({ x: 0, y: 0 })
      }
    }

    // Small delay to prevent immediate dismissal
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('touchstart', handleClickOutside)
    }, 100)

    return () => {
      clearTimeout(timer)
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [pendingZone, isDragging])

  if (!market) return null

  const pendingOption = market.options?.find(o => o.id === pendingZone)

  // ═══ LOCK IN ═══
  const handleLockIn = () => {
    if (pendingZone && amount > 0) {
      onOptionSelect?.(pendingZone)
      onBet?.(pendingZone, amount)
      setPendingZone(null)
      setChipPos({ x: 0, y: 0 })
    }
  }

  // ═══ GET ZONE AT POINT ═══
  const getZoneAtPoint = useCallback((clientX, clientY) => {
    const zones = containerRef.current?.querySelectorAll('.bet-zone')
    if (!zones) return null

    for (const zone of zones) {
      const rect = zone.getBoundingClientRect()
      // Add some padding for easier drops
      const padding = 5
      if (clientX >= rect.left - padding &&
          clientX <= rect.right + padding &&
          clientY >= rect.top - padding &&
          clientY <= rect.bottom + padding) {
        return zone.dataset.optionId
      }
    }
    return null
  }, [])

  // ═══ DRAG START ═══
  const handleDragStart = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()

    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY

    // Store cursor start position and current chip position
    dragStartCursor.current = { x: clientX, y: clientY }
    dragStartChipPos.current = { x: chipPos.x, y: chipPos.y }

    setIsDragging(true)
  }, [chipPos])

  // ═══ DRAG MOVE ═══
  const handleDragMove = useCallback((e) => {
    if (!isDragging) return
    e.preventDefault()

    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY

    // Simple delta: how far cursor moved from start
    const deltaX = clientX - dragStartCursor.current.x
    const deltaY = clientY - dragStartCursor.current.y

    // New position = start position + delta
    const newX = dragStartChipPos.current.x + deltaX
    const newY = dragStartChipPos.current.y + deltaY

    setChipPos({ x: newX, y: newY })

    // Check which zone cursor is over
    const zone = getZoneAtPoint(clientX, clientY)
    setHoveredZone(zone)
  }, [isDragging, getZoneAtPoint])

  // ═══ DRAG END ═══
  const handleDragEnd = useCallback(() => {
    if (!isDragging) return
    setIsDragging(false)

    if (hoveredZone) {
      // Dropped on a zone - set pending, keep position
      setPendingZone(hoveredZone)
      // Don't snap - just stay where dropped
    } else {
      // Missed - spring back home
      setChipPos({ x: 0, y: 0 })
      setPendingZone(null)
    }

    setHoveredZone(null)
  }, [isDragging, hoveredZone])

  // ═══ GLOBAL LISTENERS ═══
  useEffect(() => {
    if (!isDragging) return

    const onMove = (e) => handleDragMove(e)
    const onEnd = () => handleDragEnd()

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onEnd)
    window.addEventListener('touchmove', onMove, { passive: false })
    window.addEventListener('touchend', onEnd)
    window.addEventListener('touchcancel', onEnd)

    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onEnd)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onEnd)
      window.removeEventListener('touchcancel', onEnd)
    }
  }, [isDragging, handleDragMove, handleDragEnd])

  return (
    <div className={`betting-section casino-style ${pendingZone && !isDragging ? 'has-pending' : ''}`} ref={containerRef}>
      {/* ═══ MARKET QUESTION — What are we betting on? ═══ */}
      <div className="betting-question">{market.name}</div>

      {/* ═══ DROP ZONES — Roulette table! ═══ */}
      <div className="bet-zones" title={!pendingZone && !selectedOption ? 'Drag chip here' : undefined}>
        {market.options?.map(opt => (
          <div
            key={opt.id}
            className={`bet-zone ${selectedOption === opt.id ? 'selected' : ''} ${hoveredZone === opt.id ? 'hovered' : ''} ${pendingZone === opt.id ? 'pending' : ''}`}
            data-option-id={opt.id}
            style={{ '--zone-color': opt.color }}
          >
            <span className="zone-label">{opt.label?.split(' ')[0]?.slice(0, 5).toUpperCase()}</span>
            <span className="zone-price">{opt.pct}¢</span>
            <span className="zone-chance">{opt.pct}% chance</span>
            {/* Show placed chip if selected (after lock-in) */}
            {selectedOption === opt.id && (
              <div className="zone-chip-placed">
                <img src={userAvatar} alt="You" className="placed-avatar" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ═══ DRAGGABLE CHIP — Your avatar! ═══ */}
      {!selectedOption && (
        <div className="chip-dock">
          <div className="chip-wrapper">
            {/* ═══ COMPACT POPUP — Pops out top of chip when placed! ═══ */}
            {pendingZone && !isDragging && (
              <div ref={popupRef} className="chip-popup" style={{ '--zone-color': pendingOption?.color || '#ffd700' }}>
                <div className="popup-row">
                  <button className="popup-amount-btn" onClick={() => setAmount(Math.max(1, amount - 5))}>−</button>
                  <span className="popup-amount">${amount}</span>
                  <button className="popup-amount-btn" onClick={() => setAmount(Math.min(balance, amount + 5))}>+</button>
                  <span className="popup-divider">→</span>
                  <span className="popup-win">${Math.round(amount * (100 / pendingOption.pct))}</span>
                </div>
                <button
                  className="popup-lock-btn"
                  style={{ background: pendingOption?.color || '#ffd700' }}
                  onClick={handleLockIn}
                >
                  🔒 LOCK IN {pendingOption.label?.split(' ')[0]?.toUpperCase()}
                </button>
              </div>
            )}
            <div
              ref={chipRef}
              className={`betting-chip ${isDragging ? 'dragging' : ''} ${pendingZone ? 'on-zone' : ''}`}
              style={{
                transform: `translate(${chipPos.x}px, ${chipPos.y}px) scale(${isDragging ? 1.15 : 1})`,
                transition: isDragging ? 'none' : 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
                '--pending-color': pendingOption?.color || '#ffd700',
              }}
              onMouseDown={handleDragStart}
              onTouchStart={handleDragStart}
            >
              <img src={userAvatar} alt="You" className="chip-avatar" />
            </div>
          </div>
          <span className="chip-label">DRAG TO BET</span>
        </div>
      )}

      {/* ═══ LOCKED STATE ═══ */}
      {selectedOption && (
        <div className="bet-locked-indicator">
          <span className="locked-text">🔒 LOCKED IN</span>
          <span className="locked-option" style={{ color: market.options?.find(o => o.id === selectedOption)?.color }}>
            {market.options?.find(o => o.id === selectedOption)?.label}
          </span>
          <button
            className="unlock-bet-btn"
            onClick={() => onOptionSelect?.(null)}
          >
            🔓 UNLOCK
          </button>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN SIDEBAR COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
export default function CombinedSidebar({
  markets = [],
  selectedMarketId,
  onMarketSelect,
  onBet,
  balance = 250,
  isOpen = false,
  onToggle,
  selectedBetOption,      // Which bet option is selected — illuminates zone!
  onBetOptionSelect,      // Callback when option selected
  onPreviewZone,          // Callback when chip hovers/placed on zone (preview mode!)
  isFlexLayout = false,   // When true, sidebar is part of flex container (not position:fixed)
}) {
  const [isMobile, setIsMobile] = useState(false)
  const [dragY, setDragY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const sheetRef = useRef(null)
  const startYRef = useRef(0)

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Get selected market
  const selectedMarket = markets.find(m => m.id === selectedMarketId) || markets[0]

  // Touch handlers for mobile bottom sheet
  const handleTouchStart = useCallback((e) => {
    if (!isMobile) return
    startYRef.current = e.touches[0].clientY
    setIsDragging(true)
  }, [isMobile])

  const handleTouchMove = useCallback((e) => {
    if (!isDragging || !isMobile) return
    const currentY = e.touches[0].clientY
    const deltaY = currentY - startYRef.current
    // Only allow dragging down when open, or up when closed
    if ((isOpen && deltaY > 0) || (!isOpen && deltaY < 0)) {
      setDragY(deltaY)
    }
  }, [isDragging, isOpen, isMobile])

  const handleTouchEnd = useCallback(() => {
    if (!isMobile) return
    setIsDragging(false)
    const threshold = 50
    if (Math.abs(dragY) > threshold) {
      onToggle?.(!isOpen)
    }
    setDragY(0)
  }, [dragY, isOpen, onToggle, isMobile])

  // Mobile bottom sheet
  if (isMobile) {
    const sheetTranslate = isOpen
      ? Math.max(0, dragY)
      : Math.min(0, dragY) + (window.innerHeight * 0.7)

    return (
      <div
        ref={sheetRef}
        className={`sidebar-mobile ${isOpen ? 'open' : ''}`}
        style={{
          transform: `translateY(${sheetTranslate}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s ease-out'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Handle bar */}
        <div className="sidebar-handle" onClick={() => onToggle?.(!isOpen)}>
          <div className="sidebar-handle-bar" />
        </div>

        {/* Peek content (always visible) */}
        <div className="sidebar-peek">
          <span className="sidebar-balance">Balance: ${balance}</span>
          <span className="sidebar-market-count">{markets.length} Markets</span>
        </div>

        {/* Full content */}
        <div className="sidebar-content">
          {/* Market List */}
          <div className="sidebar-markets">
            <h3 className="sidebar-section-title">HOT MARKETS</h3>
            <div className="sidebar-market-list">
              {markets.map(market => (
                <MarketCard
                  key={market.id}
                  market={market}
                  isSelected={market.id === selectedMarketId}
                  onSelect={onMarketSelect}
                />
              ))}
            </div>
          </div>

          {/* Betting Section */}
          <BettingSection
            market={selectedMarket}
            onBet={onBet}
            balance={balance}
            selectedOption={selectedBetOption}
            onOptionSelect={onBetOptionSelect}
            onPreviewZone={onPreviewZone}
          />
        </div>

        {/* Footer */}
        <div className="sidebar-footer">
          <span>Prediction Party</span>
        </div>
      </div>
    )
  }

  // Desktop sidebar
  return (
    <div className={`sidebar-desktop ${isFlexLayout ? 'flex-layout' : ''}`}>
      {/* Header */}
      <div className="sidebar-header">
        <h2>HOT MARKETS</h2>
        <span className="sidebar-balance">${balance}</span>
      </div>

      {/* Market List */}
      <div className="sidebar-market-list">
        {markets.map(market => (
          <MarketCard
            key={market.id}
            market={market}
            isSelected={market.id === selectedMarketId}
            onSelect={onMarketSelect}
          />
        ))}
      </div>

      {/* Divider */}
      <div className="sidebar-divider" />

      {/* Betting Section */}
      <BettingSection
        market={selectedMarket}
        onBet={onBet}
        balance={balance}
        selectedOption={selectedBetOption}
        onOptionSelect={onBetOptionSelect}
        onPreviewZone={onPreviewZone}
      />

      {/* Footer */}
      <div className="sidebar-footer">
        <span>Prediction Party</span>
      </div>
    </div>
  )
}
