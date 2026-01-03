/**
 * CombinedSidebar — Accordion-style market list
 * "Click to expand, everything in one place!" — UX Master
 */

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import './CombinedSidebar.css'

// ═══════════════════════════════════════════════════════════════════════════
// LIVE BETTORS — Real TG community members!
// ═══════════════════════════════════════════════════════════════════════════
const TG_AVATARS = [
  { name: 'AzFlin', avatar: '/tg/AzFlin.jpg' },
  { name: 'biz', avatar: '/tg/biz.jpg' },
  { name: 'ferengi', avatar: '/tg/ferengi.jpg' },
  { name: 'frostyflakes', avatar: '/tg/frostyflakes.jpg' },
  { name: 'icobeast', avatar: '/tg/icobeast.jpg' },
  { name: 'jin', avatar: '/tg/jin.jpg' },
  { name: 'phanes', avatar: '/tg/phanes.jpg' },
  { name: 'pupul', avatar: '/tg/pupul.jpg' },
  { name: 'rekt', avatar: '/tg/rekt.jpg' },
  { name: 'rob', avatar: '/tg/rob.jpg' },
  { name: 'shinkiro14', avatar: '/tg/shinkiro14.jpg' },
  { name: 'skely', avatar: '/tg/skely.jpg' },
  { name: 'Tintin', avatar: '/tg/Tintin.jpg' },
  { name: 'ultra', avatar: '/tg/ultra.png' },
  { name: 'vn', avatar: '/tg/vn.jpg' },
]

// Seeded random for consistent fake data
function seededRandom(seed) {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

// ═══════════════════════════════════════════════════════════════════════════
// MINI LEADERBOARD — Compact version inside accordion
// ═══════════════════════════════════════════════════════════════════════════
function MiniLeaderboard({ market, marketId, userBet, userAvatar = '/tg/zac.jpg' }) {
  const bettors = useMemo(() => {
    if (!market?.options) return []
    const seed = marketId?.charCodeAt(0) || 0

    return TG_AVATARS.slice(0, 8).map((user, i) => {
      const userSeed = seed + i * 7
      const optionIndex = Math.floor(seededRandom(userSeed) * market.options.length)
      const option = market.options[optionIndex]
      const amount = Math.floor(5 + seededRandom(userSeed + 1) * seededRandom(userSeed + 2) * 495)
      const pnlPct = (seededRandom(userSeed + 3) * 1.2) - 0.4
      const pnl = Math.round(amount * pnlPct)
      return {
        id: user.name,
        name: user.name,
        avatar: user.avatar,
        amount,
        pnl,
        optionId: option.id,
        optionLabel: option.label,
        optionColor: option.color,
      }
    }).sort((a, b) => b.pnl - a.pnl)
  }, [market, marketId])

  if (!market) return null

  const userRank = userBet ? bettors.filter(b => b.amount > userBet.amount).length + 1 : null

  return (
    <div className="mini-leaderboard">
      <div className="mini-leaderboard-header">
        <span className="live-dot" />
        <span className="mini-leaderboard-title">LIVE</span>
        <span className="mini-leaderboard-count">{bettors.length + (userBet ? 1 : 0)}</span>
      </div>
      <div className="mini-leaderboard-list">
        {userBet && (
          <div className="mini-bettor you">
            <span className="mini-rank">#{userRank}</span>
            <img src={userAvatar} alt="You" className="mini-avatar" />
            <span className="mini-name">You</span>
            <span className="mini-pick" style={{ color: userBet.optionColor }}>
              {userBet.optionLabel?.split(' ')[0]}
            </span>
            <span className="mini-amount">${userBet.amount}</span>
          </div>
        )}
        {bettors.slice(0, 5).map((bettor, i) => (
          <div key={bettor.id} className="mini-bettor">
            <span className="mini-rank">#{userBet ? i + 2 : i + 1}</span>
            <img src={bettor.avatar} alt={bettor.name} className="mini-avatar" />
            <span className="mini-name">{bettor.name}</span>
            <span className={`mini-pnl ${bettor.pnl >= 0 ? 'profit' : 'loss'}`}>
              {bettor.pnl >= 0 ? '+' : ''}{bettor.pnl}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// ACCORDION BETTING — Compact betting UI inside accordion
// ═══════════════════════════════════════════════════════════════════════════
function AccordionBetting({ market, onBet, balance = 250, selectedOption, onOptionSelect, onPreviewZone, userAvatar = '/tg/zac.jpg', betAmount }) {
  const [amount, setAmount] = useState(10)
  const [isDragging, setIsDragging] = useState(false)
  const [chipPos, setChipPos] = useState({ x: 0, y: 0 })
  const [hoveredZone, setHoveredZone] = useState(null)
  const [pendingZone, setPendingZone] = useState(null)
  const [holdProgress, setHoldProgress] = useState(0)  // 0-100 for hold-to-lock
  const chipRef = useRef(null)
  const containerRef = useRef(null)
  const popupRef = useRef(null)
  const dragStartCursor = useRef({ x: 0, y: 0 })
  const dragStartChipPos = useRef({ x: 0, y: 0 })
  const holdIntervalRef = useRef(null)
  const holdStartTimeRef = useRef(null)

  useEffect(() => {
    const previewZone = hoveredZone || pendingZone
    onPreviewZone?.(previewZone)
  }, [hoveredZone, pendingZone, onPreviewZone])

  useEffect(() => {
    if (!pendingZone || isDragging) return
    const handleClickOutside = (e) => {
      const clickedPopup = popupRef.current?.contains(e.target)
      const clickedChip = chipRef.current?.contains(e.target)
      if (!clickedPopup && !clickedChip) {
        setPendingZone(null)
        setChipPos({ x: 0, y: 0 })
      }
    }
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

  // ═══ HOLD TO LOCK — 1 second hold with progress bar! ═══
  const HOLD_DURATION = 1000  // 1 second

  const handleHoldStart = useCallback((e) => {
    e.preventDefault()
    holdStartTimeRef.current = Date.now()
    setHoldProgress(0)

    // Update progress every 16ms (~60fps)
    holdIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - holdStartTimeRef.current
      const progress = Math.min(100, (elapsed / HOLD_DURATION) * 100)
      setHoldProgress(progress)

      // Lock in when complete!
      if (progress >= 100) {
        clearInterval(holdIntervalRef.current)
        holdIntervalRef.current = null
        if (pendingZone && amount > 0) {
          onOptionSelect?.(pendingZone)
          onBet?.(pendingZone, amount)
          setPendingZone(null)
          setChipPos({ x: 0, y: 0 })
          setHoldProgress(0)
        }
      }
    }, 16)
  }, [pendingZone, amount, onOptionSelect, onBet])

  const handleHoldEnd = useCallback(() => {
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current)
      holdIntervalRef.current = null
    }
    setHoldProgress(0)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (holdIntervalRef.current) {
        clearInterval(holdIntervalRef.current)
      }
    }
  }, [])

  const getZoneAtPoint = useCallback((clientX, clientY) => {
    const zones = containerRef.current?.querySelectorAll('.bet-zone')
    if (!zones) return null
    for (const zone of zones) {
      const rect = zone.getBoundingClientRect()
      const padding = 5
      if (clientX >= rect.left - padding && clientX <= rect.right + padding &&
          clientY >= rect.top - padding && clientY <= rect.bottom + padding) {
        return zone.dataset.optionId
      }
    }
    return null
  }, [])

  const handleDragStart = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    dragStartCursor.current = { x: clientX, y: clientY }
    dragStartChipPos.current = { x: chipPos.x, y: chipPos.y }
    setIsDragging(true)
  }, [chipPos])

  const handleDragMove = useCallback((e) => {
    if (!isDragging) return
    e.preventDefault()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    const deltaX = clientX - dragStartCursor.current.x
    const deltaY = clientY - dragStartCursor.current.y
    setChipPos({ x: dragStartChipPos.current.x + deltaX, y: dragStartChipPos.current.y + deltaY })
    setHoveredZone(getZoneAtPoint(clientX, clientY))
  }, [isDragging, getZoneAtPoint])

  const handleDragEnd = useCallback(() => {
    if (!isDragging) return
    setIsDragging(false)
    if (hoveredZone) {
      setPendingZone(hoveredZone)
    } else {
      setChipPos({ x: 0, y: 0 })
      setPendingZone(null)
    }
    setHoveredZone(null)
  }, [isDragging, hoveredZone])

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
    <div className="accordion-betting" ref={containerRef}>
      {/* Bet zones - compact grid */}
      <div className="accordion-zones">
        {market.options?.map(opt => (
          <div
            key={opt.id}
            className={`bet-zone compact ${selectedOption === opt.id ? 'selected' : ''} ${hoveredZone === opt.id ? 'hovered' : ''} ${pendingZone === opt.id ? 'pending' : ''}`}
            data-option-id={opt.id}
            style={{ '--zone-color': opt.color }}
          >
            <span className="zone-label">{opt.label?.split(' ')[0]?.slice(0, 5).toUpperCase()}</span>
            <span className="zone-price">{opt.pct}¢</span>
            {selectedOption === opt.id && (
              <div className="zone-chip-placed">
                <img src={userAvatar} alt="You" className="placed-avatar" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Chip + Lock state */}
      {!selectedOption ? (
        <div className="accordion-chip-area">
          <div className="chip-wrapper">
            {pendingZone && !isDragging && (
              <div ref={popupRef} className="chip-popup compact" style={{ '--zone-color': pendingOption?.color || '#ffd700' }}>
                <div className="popup-row">
                  <button className="popup-amount-btn" onClick={() => setAmount(Math.max(1, amount - 5))}>−</button>
                  <span className="popup-amount">${amount}</span>
                  <button className="popup-amount-btn" onClick={() => setAmount(Math.min(balance, amount + 5))}>+</button>
                  <span className="popup-divider">→</span>
                  <span className="popup-win">${Math.round(amount * (100 / pendingOption.pct))}</span>
                </div>
                {/* ═══ HOLD TO LOCK — Progress bar fills as you hold! ═══ */}
                <button
                  className={`popup-lock-btn hold-to-lock ${holdProgress > 0 ? 'holding' : ''}`}
                  style={{
                    '--zone-color': pendingOption?.color || '#ffd700',
                    '--hold-progress': `${holdProgress}%`,
                  }}
                  onMouseDown={handleHoldStart}
                  onMouseUp={handleHoldEnd}
                  onMouseLeave={handleHoldEnd}
                  onTouchStart={handleHoldStart}
                  onTouchEnd={handleHoldEnd}
                  onTouchCancel={handleHoldEnd}
                >
                  <span className="lock-btn-fill" />
                  <span className="lock-btn-text">
                    {holdProgress > 0 ? 'LOCKING...' : 'HOLD TO LOCK'}
                  </span>
                </button>
              </div>
            )}
            <div
              ref={chipRef}
              className={`betting-chip compact ${isDragging ? 'dragging' : ''} ${pendingZone ? 'on-zone' : ''}`}
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
      ) : (
        <div className="accordion-locked">
          <div className="locked-info">
            <span className="locked-badge" style={{ background: market.options?.find(o => o.id === selectedOption)?.color }}>
              🔒 {market.options?.find(o => o.id === selectedOption)?.label?.split(' ')[0]}
            </span>
            <span className="locked-amount" style={{ color: market.options?.find(o => o.id === selectedOption)?.color }}>
              ${betAmount || 0}
            </span>
          </div>
          <button className="unlock-btn" onClick={() => onOptionSelect?.(null)}>UNLOCK</button>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// MARKET ACCORDION — Expandable market card with all content inside!
// ═══════════════════════════════════════════════════════════════════════════
function MarketAccordion({
  market,
  isExpanded,
  onToggle,
  onBet,
  balance,
  selectedOption,
  onOptionSelect,
  onPreviewZone,
  userBet,
  userAvatar,
}) {
  const contentRef = useRef(null)
  const [contentHeight, setContentHeight] = useState(0)

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight)
    }
  }, [isExpanded, market])

  return (
    <div className={`market-accordion ${isExpanded ? 'expanded' : ''}`}>
      {/* Header - always visible */}
      <button className="accordion-header" onClick={onToggle}>
        <div className="accordion-title-row">
          <span className="accordion-arrow">{isExpanded ? '▼' : '▶'}</span>
          <span className="accordion-title">{market.name}</span>
        </div>
        <div className="accordion-meta">
          {userBet && (
            <span className="accordion-bet-badge" style={{ background: userBet.optionColor }}>
              ${userBet.amount}
            </span>
          )}
          <span className="accordion-volume">${market.volume || '12.4K'}</span>
        </div>
      </button>

      {/* Expandable content */}
      <div
        className="accordion-content"
        style={{ maxHeight: isExpanded ? `${contentHeight}px` : '0px' }}
      >
        <div ref={contentRef} className="accordion-inner">
          {/* Mini leaderboard — above betting! */}
          <MiniLeaderboard
            market={market}
            marketId={market.id}
            userBet={userBet ? {
              ...userBet,
              optionLabel: market.options?.find(o => o.id === userBet.optionId)?.label,
              optionColor: market.options?.find(o => o.id === userBet.optionId)?.color,
            } : null}
            userAvatar={userAvatar}
          />

          {/* Betting section — below leaderboard */}
          <AccordionBetting
            market={market}
            onBet={onBet}
            balance={balance}
            selectedOption={selectedOption}
            onOptionSelect={onOptionSelect}
            onPreviewZone={onPreviewZone}
            userAvatar={userAvatar}
            betAmount={userBet?.amount}
          />
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// MY BETS SUMMARY — See all your bets at a glance!
// ═══════════════════════════════════════════════════════════════════════════
function MyBetsSummary({ markets, allBets }) {
  const betsArray = useMemo(() => {
    return Object.entries(allBets)
      .filter(([_, bet]) => bet && bet.optionId)
      .map(([marketId, bet]) => {
        const market = markets.find(m => m.id === marketId)
        const option = market?.options?.find(o => o.id === bet.optionId)
        return {
          marketId,
          marketName: market?.name || 'Unknown',
          optionLabel: option?.label?.split(' ')[0] || 'Unknown',
          optionColor: option?.color || '#888',
          amount: bet.amount || 0,
          pct: option?.pct || 50,
          potentialWin: Math.round((bet.amount || 0) * (100 / (option?.pct || 50))),
        }
      })
  }, [markets, allBets])

  const totalBet = betsArray.reduce((sum, b) => sum + b.amount, 0)
  const totalPotential = betsArray.reduce((sum, b) => sum + b.potentialWin, 0)

  if (betsArray.length === 0) return null

  return (
    <div className="my-bets-summary">
      <div className="my-bets-header">
        <span className="my-bets-title">MY BETS</span>
        <span className="my-bets-count">{betsArray.length}</span>
      </div>
      <div className="my-bets-list">
        {betsArray.map(bet => (
          <div key={bet.marketId} className="my-bet-row">
            <div className="my-bet-pick" style={{ background: bet.optionColor }}>
              {bet.optionLabel}
            </div>
            <span className="my-bet-market">{bet.marketName?.slice(0, 20)}</span>
            <span className="my-bet-amount">${bet.amount}</span>
            <span className="my-bet-potential">→ ${bet.potentialWin}</span>
          </div>
        ))}
      </div>
      <div className="my-bets-totals">
        <div className="my-bets-total-row">
          <span>Total Bet</span>
          <span className="total-amount">${totalBet}</span>
        </div>
        <div className="my-bets-total-row potential">
          <span>Potential Win</span>
          <span className="total-potential">${totalPotential}</span>
        </div>
      </div>
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
  selectedBetOption,
  onBetOptionSelect,
  onPreviewZone,
  isFlexLayout = false,
  allBets = {},
  currentBetAmount,
}) {
  const [isMobile, setIsMobile] = useState(false)
  const [dragY, setDragY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const sheetRef = useRef(null)
  const startYRef = useRef(0)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleTouchStart = useCallback((e) => {
    if (!isMobile) return
    startYRef.current = e.touches[0].clientY
    setIsDragging(true)
  }, [isMobile])

  const handleTouchMove = useCallback((e) => {
    if (!isDragging || !isMobile) return
    const currentY = e.touches[0].clientY
    const deltaY = currentY - startYRef.current
    if ((isOpen && deltaY > 0) || (!isOpen && deltaY < 0)) {
      setDragY(deltaY)
    }
  }, [isDragging, isOpen, isMobile])

  const handleTouchEnd = useCallback(() => {
    if (!isMobile) return
    setIsDragging(false)
    if (Math.abs(dragY) > 50) {
      onToggle?.(!isOpen)
    }
    setDragY(0)
  }, [dragY, isOpen, onToggle, isMobile])

  // Handle accordion toggle
  const handleAccordionToggle = (marketId) => {
    onMarketSelect(selectedMarketId === marketId ? null : marketId)
  }

  // Render accordion list
  const renderAccordionList = () => (
    <div className="accordion-list">
      {markets.map(market => (
        <MarketAccordion
          key={market.id}
          market={market}
          isExpanded={market.id === selectedMarketId}
          onToggle={() => handleAccordionToggle(market.id)}
          onBet={(optionId, amount) => onBet?.(market.id, optionId, amount)}
          balance={balance}
          selectedOption={market.id === selectedMarketId ? selectedBetOption : allBets[market.id]?.optionId}
          onOptionSelect={market.id === selectedMarketId ? onBetOptionSelect : undefined}
          onPreviewZone={market.id === selectedMarketId ? onPreviewZone : undefined}
          userBet={allBets[market.id]}
          userAvatar="/tg/zac.jpg"
        />
      ))}
    </div>
  )

  // Check if user has any active bets
  const hasActiveBets = Object.keys(allBets).some(k => allBets[k]?.optionId)

  // Mobile bottom drawer — 50% height!
  if (isMobile) {
    // Drag offset for smooth gesture control
    const dragOffset = isDragging ? dragY : 0

    return (
      <div
        ref={sheetRef}
        className={`sidebar-mobile ${isOpen ? 'open' : ''} ${hasActiveBets ? 'has-bets' : ''}`}
        style={{
          transform: `translateY(${dragOffset}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drag handle */}
        <div className="sidebar-handle" onClick={() => onToggle?.(!isOpen)}>
          <div className="sidebar-handle-bar" />
        </div>

        {/* Peek header — always visible */}
        <div className="sidebar-peek">
          <span className="sidebar-balance">${balance}</span>
          <span className="sidebar-market-count">{markets.length} Markets</span>
        </div>

        {/* Scrollable market list */}
        <div className="sidebar-content">
          {renderAccordionList()}
          <MyBetsSummary markets={markets} allBets={allBets} />
        </div>
      </div>
    )
  }

  // Desktop sidebar
  return (
    <div className={`sidebar-desktop ${isFlexLayout ? 'flex-layout' : ''} ${hasActiveBets ? 'has-bets' : ''}`}>
      <div className="sidebar-header">
        <h2>MARKETS</h2>
        <span className="sidebar-balance">${balance}</span>
      </div>

      <div className="sidebar-market-list">
        {renderAccordionList()}
        <MyBetsSummary markets={markets} allBets={allBets} />
      </div>

      <div className="sidebar-footer">
        <span>Prediction Party</span>
      </div>
    </div>
  )
}
