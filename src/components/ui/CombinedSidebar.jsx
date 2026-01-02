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
        {market.options?.slice(0, 3).map(opt => (
          <span
            key={opt.id}
            className="market-card-option"
            style={{ color: opt.color }}
          >
            {opt.label?.split(' ')[0]} {opt.pct}%
          </span>
        ))}
        {market.options?.length > 3 && (
          <span className="market-card-more">+{market.options.length - 3}</span>
        )}
      </div>
    </button>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// BETTING SECTION — Quick bet interface
// Now with ZONE ILLUMINATION callback!
// ═══════════════════════════════════════════════════════════════════════════
function BettingSection({ market, onBet, balance = 250, selectedOption, onOptionSelect }) {
  const [amount, setAmount] = useState(10)

  if (!market) return null

  const handleBet = () => {
    if (selectedOption && amount > 0) {
      onBet?.(selectedOption, amount)
    }
  }

  const handleOptionClick = (optionId) => {
    onOptionSelect?.(optionId)
  }

  return (
    <div className="betting-section">
      <h4 className="betting-title">PLACE YOUR BET</h4>

      <div className="betting-options">
        {market.options?.map(opt => (
          <button
            key={opt.id}
            className={`betting-option ${selectedOption === opt.id ? 'selected' : ''}`}
            style={{
              '--option-color': opt.color,
              borderColor: selectedOption === opt.id ? opt.color : 'transparent'
            }}
            onClick={() => handleOptionClick(opt.id)}
          >
            <span className="betting-option-label">{opt.label?.split(' ')[0]}</span>
            <span className="betting-option-pct">{opt.pct}%</span>
          </button>
        ))}
      </div>

      <div className="betting-amount">
        <label>Amount</label>
        <div className="betting-amount-controls">
          <button onClick={() => setAmount(Math.max(1, amount - 5))}>-</button>
          <span className="betting-amount-value">${amount}</span>
          <button onClick={() => setAmount(Math.min(balance, amount + 5))}>+</button>
        </div>
      </div>

      <button
        className="betting-confirm"
        disabled={!selectedOption}
        onClick={handleBet}
      >
        {selectedOption ? `BET $${amount} ON ${market.options?.find(o => o.id === selectedOption)?.label?.split(' ')[0]?.toUpperCase()}` : 'SELECT AN OPTION'}
      </button>
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
    <div className="sidebar-desktop">
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
      />

      {/* Footer */}
      <div className="sidebar-footer">
        <span>Prediction Party</span>
      </div>
    </div>
  )
}
