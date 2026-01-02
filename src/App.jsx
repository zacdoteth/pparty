/**
 * Prediction Party — EXACT PORT from vanilla.html
 * "The Turntable.fm for Crypto Prediction Markets"
 * Neo-Tokyo Underground Nightclub Aesthetic
 */

import React, { useState, useRef, useCallback } from 'react'
import IsoContainer from './components/stage/IsoContainer'
import ClubRoom from './components/stage/ClubRoom'
import StickFigure from './components/avatars/StickFigure'
import DraggableUser from './components/avatars/DraggableUser'
import MarqueeSign from './components/ui/MarqueeSign'
import HangingSign from './components/ui/HangingSign'
import BetConfirmationModal from './components/board/BetConfirmationModal'
import BettingSidebar from './components/ui/BettingSidebar'
import BettingModal from './components/ui/BettingModal'
import { playHoverTick, playSuccessChime } from './utils/sounds'
import './App.css'

// Current user (you!)
const CURRENT_USER = {
  id: 'zac',
  username: 'zac.eth',
  avatar: '/tg/zac.jpg',
}

// ═══════════════════════════════════════════════════════════════
// NINTENDO SPREAD ALGORITHM — Organic distribution with no overlap!
// "Like Animal Crossing villagers, but in a nightclub" — Miyamoto
// ═══════════════════════════════════════════════════════════════

/**
 * Hash a string to a number for seeded randomness
 */
function hashString(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash)
}

/**
 * Seeded random number generator (deterministic!)
 * Same seed = same positions every time
 */
function seededRandom(seed) {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

/**
 * Nintendo Spread — Distribute users organically within a zone
 *
 * @param {Array} users - Users to place
 * @param {Object} bounds - { xMin, xMax, yMin, yMax } as percentages
 * @param {Object} options - { minSpacing, seed }
 * @returns {Array} Users with x, y positions added
 */
function nintendoSpread(users, bounds, options = {}) {
  const { xMin, xMax, yMin, yMax } = bounds
  const { minSpacing = 12, seed = 'party' } = options

  const xRange = xMax - xMin
  const yRange = yMax - yMin

  // For very few users, use simple golden ratio spiral
  if (users.length <= 3) {
    return users.map((user, i) => {
      const angle = i * 2.4 // Golden angle
      const radius = 0.3 + (i / users.length) * 0.4
      const x = xMin + (xRange / 2) + Math.cos(angle) * radius * xRange * 0.4
      const y = yMin + (yRange / 2) + Math.sin(angle) * radius * yRange * 0.4
      return { ...user, x: Math.max(xMin, Math.min(xMax, x)), y: Math.max(yMin, Math.min(yMax, y)) }
    })
  }

  // For larger crowds: Poisson disk-ish sampling with seeded random
  const placed = []

  return users.map((user, i) => {
    const userSeed = hashString(`${seed}-${user.id}-${user.name}`)

    // Try to find a spot with good spacing
    let bestX = xMin + xRange * 0.5
    let bestY = yMin + yRange * 0.5
    let bestMinDist = 0

    // More attempts for earlier users, fewer for later (crowd gets tighter)
    const attempts = Math.max(20, 50 - i * 2)

    for (let attempt = 0; attempt < attempts; attempt++) {
      // Generate candidate position with seeded random
      const rx = seededRandom(userSeed + attempt * 7919)
      const ry = seededRandom(userSeed + attempt * 7919 + 1)

      // Add slight jitter based on attempt
      const jitterX = (seededRandom(userSeed + attempt * 13) - 0.5) * 0.1
      const jitterY = (seededRandom(userSeed + attempt * 17) - 0.5) * 0.1

      const candidateX = xMin + (rx + jitterX) * xRange
      const candidateY = yMin + (ry + jitterY) * yRange

      // Clamp to bounds
      const clampedX = Math.max(xMin + 2, Math.min(xMax - 2, candidateX))
      const clampedY = Math.max(yMin + 3, Math.min(yMax - 3, candidateY))

      // Find minimum distance to already placed users
      let minDist = Infinity
      for (const p of placed) {
        const dx = clampedX - p.x
        const dy = clampedY - p.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        minDist = Math.min(minDist, dist)
      }

      // If no one placed yet, or this is the best spot so far
      if (placed.length === 0 || minDist > bestMinDist) {
        bestX = clampedX
        bestY = clampedY
        bestMinDist = minDist

        // Good enough spacing? Stop searching
        const targetSpacing = Math.max(minSpacing - (users.length - 10) * 0.5, 6)
        if (minDist >= targetSpacing) break
      }
    }

    placed.push({ x: bestX, y: bestY })
    return { ...user, x: bestX, y: bestY }
  })
}

// ═══════════════════════════════════════════════════════════════
// MOCK MARKETS DATA
// ═══════════════════════════════════════════════════════════════

// COLOR PSYCHOLOGY for multi-answer markets:
// 🟢 Emerald Green (#00FF88) — Growth, winning, money, leading
// 🔵 Electric Blue (#4DA6FF) — Trust, stability, calm confidence
// 🟣 Royal Purple (#BF00FF) — Unique, special, dark horse

const MULTI_COLORS = {
  green: '#00FF88',   // Emerald — Leading candidate energy
  blue: '#4DA6FF',    // Electric Blue — Stable choice
  purple: '#BF00FF',  // Royal Purple — Underdog energy
}

const MARKETS = [
  // ═══ MULTI-ANSWER MARKET — 3 zones! ═══
  {
    id: 0,
    type: 'multi',
    question: "Next US President 2028?",
    options: [
      { id: 'vance', label: 'J.D. Vance', pct: 38, kalshiPct: 30, color: MULTI_COLORS.green },
      { id: 'newsom', label: 'Gavin Newsom', pct: 32, kalshiPct: 20, color: MULTI_COLORS.blue },
      { id: 'aoc', label: 'AOC', pct: 18, kalshiPct: 7, color: MULTI_COLORS.purple },
    ],
    volume: '$5.9M',
    partyCount: 89,
  },
  // ═══ BINARY MARKETS ═══
  {
    id: 1,
    type: 'binary',
    question: "Will BTC hit $100k by Dec 31?",
    yesPct: 72,           // Party crowd sentiment
    noPct: 28,
    kalshiYesPct: 65,     // Official Kalshi market odds
    kalshiNoPct: 35,
    volume: '$2.4M',
    partyCount: 74,
  },
  {
    id: 2,
    type: 'binary',
    question: "Will Elon visit Mars before 2030?",
    yesPct: 12,
    noPct: 88,
    kalshiYesPct: 6,
    kalshiNoPct: 94,
    volume: '$890K',
    partyCount: 39,
  },
  {
    id: 3,
    type: 'binary',
    question: "Will there be a US recession in 2025?",
    yesPct: 45,
    noPct: 55,
    kalshiYesPct: 38,
    kalshiNoPct: 62,
    volume: '$1.2M',
    partyCount: 47,
  },
  {
    id: 4,
    type: 'binary',
    question: "GPT-5 release by June 2025?",
    yesPct: 28,
    noPct: 72,
    kalshiYesPct: 31,
    kalshiNoPct: 69,
    volume: '$560K',
    partyCount: 28,
  },
]

// ═══════════════════════════════════════════════════════════════
// REAL USERS — Using actual avatar images from /tg folder!
// Username = filename (icobeast.jpg → "icobeast")
// ═══════════════════════════════════════════════════════════════

// Mock users for BINARY markets (yes/no) — EXPANDED TO ~30 for testing!
const BINARY_USERS = [
  // Original YES squad
  { id: 1, name: 'frostyflakes', side: 'yes', avatar: '/tg/frostyflakes.jpg' },
  { id: 3, name: 'rob', side: 'yes', avatar: '/tg/rob.jpg' },
  { id: 4, name: 'ferengi', side: 'yes', avatar: '/tg/ferengi.jpg' },
  { id: 6, name: 'rekt', side: 'yes', avatar: '/tg/rekt.jpg' },
  { id: 7, name: 'biz', side: 'yes', avatar: '/tg/biz.jpg' },
  { id: 9, name: 'phanes', side: 'yes', avatar: '/tg/phanes.jpg' },
  { id: 10, name: 'pupul', side: 'yes', avatar: '/tg/pupul.jpg' },
  { id: 12, name: 'AzFlin', side: 'yes', avatar: '/tg/AzFlin.jpg' },
  // Extended YES crew
  { id: 13, name: 'Tintin', side: 'yes', avatar: '/tg/Tintin.jpg' },
  { id: 14, name: 'shinkiro14', side: 'yes', avatar: '/tg/shinkiro14.jpg' },
  { id: 15, name: 'chad_alpha', side: 'yes', avatar: '/tg/frostyflakes.jpg' },
  { id: 16, name: 'moon_lord', side: 'yes', avatar: '/tg/biz.jpg' },
  { id: 17, name: 'wagmi_king', side: 'yes', avatar: '/tg/ferengi.jpg' },
  { id: 18, name: 'degen_dave', side: 'yes', avatar: '/tg/phanes.jpg' },
  { id: 19, name: 'ser_pump', side: 'yes', avatar: '/tg/rob.jpg' },
  { id: 20, name: 'ape_master', side: 'yes', avatar: '/tg/AzFlin.jpg' },
  // Original NO squad
  { id: 2, name: 'skely', side: 'no', avatar: '/tg/skely.jpg' },
  { id: 5, name: 'icobeast', side: 'no', avatar: '/tg/icobeast.jpg' },
  { id: 8, name: 'jin', side: 'no', avatar: '/tg/jin.jpg' },
  { id: 11, name: 'vn', side: 'no', avatar: '/tg/vn.jpg' },
  // Extended NO crew
  { id: 21, name: 'bear_lord', side: 'no', avatar: '/tg/skely.jpg' },
  { id: 22, name: 'ngmi_ned', side: 'no', avatar: '/tg/icobeast.jpg' },
  { id: 23, name: 'rekt_andy', side: 'no', avatar: '/tg/jin.jpg' },
  { id: 24, name: 'short_king', side: 'no', avatar: '/tg/vn.jpg' },
  { id: 25, name: 'doom_guy', side: 'no', avatar: '/tg/skely.jpg' },
  { id: 26, name: 'fud_master', side: 'no', avatar: '/tg/icobeast.jpg' },
  { id: 27, name: 'paper_hands', side: 'no', avatar: '/tg/jin.jpg' },
  { id: 28, name: 'rugpull_rick', side: 'no', avatar: '/tg/vn.jpg' },
]

// Mock users for MULTI markets (3+ options) — EXPANDED TO ~30 for testing!
const MULTI_USERS = [
  // Team Vance (Green) — 12 users
  { id: 101, name: 'shinkiro14', side: 'vance', avatar: '/tg/shinkiro14.jpg' },
  { id: 102, name: 'rekt', side: 'vance', avatar: '/tg/rekt.jpg' },
  { id: 103, name: 'ferengi', side: 'vance', avatar: '/tg/ferengi.jpg' },
  { id: 104, name: 'frostyflakes', side: 'vance', avatar: '/tg/frostyflakes.jpg' },
  { id: 105, name: 'phanes', side: 'vance', avatar: '/tg/phanes.jpg' },
  { id: 106, name: 'maga_mike', side: 'vance', avatar: '/tg/biz.jpg' },
  { id: 107, name: 'based_brad', side: 'vance', avatar: '/tg/AzFlin.jpg' },
  { id: 108, name: 'trump_tina', side: 'vance', avatar: '/tg/pupul.jpg' },
  { id: 109, name: 'red_wave', side: 'vance', avatar: '/tg/rob.jpg' },
  { id: 110, name: 'gop_greg', side: 'vance', avatar: '/tg/ferengi.jpg' },
  { id: 111, name: 'ohio_chad', side: 'vance', avatar: '/tg/rekt.jpg' },
  { id: 112, name: 'hillbilly', side: 'vance', avatar: '/tg/shinkiro14.jpg' },
  // Team Newsom (Blue) — 10 users
  { id: 201, name: 'jin', side: 'newsom', avatar: '/tg/jin.jpg' },
  { id: 202, name: 'biz', side: 'newsom', avatar: '/tg/biz.jpg' },
  { id: 203, name: 'Tintin', side: 'newsom', avatar: '/tg/Tintin.jpg' },
  { id: 204, name: 'pupul', side: 'newsom', avatar: '/tg/pupul.jpg' },
  { id: 205, name: 'cali_queen', side: 'newsom', avatar: '/tg/frostyflakes.jpg' },
  { id: 206, name: 'dem_dan', side: 'newsom', avatar: '/tg/phanes.jpg' },
  { id: 207, name: 'blue_wave', side: 'newsom', avatar: '/tg/jin.jpg' },
  { id: 208, name: 'west_coast', side: 'newsom', avatar: '/tg/Tintin.jpg' },
  { id: 209, name: 'sf_steve', side: 'newsom', avatar: '/tg/biz.jpg' },
  { id: 210, name: 'gavin_gang', side: 'newsom', avatar: '/tg/pupul.jpg' },
  // Team AOC (Purple) — 8 users
  { id: 301, name: 'skely', side: 'aoc', avatar: '/tg/skely.jpg' },
  { id: 302, name: 'icobeast', side: 'aoc', avatar: '/tg/icobeast.jpg' },
  { id: 303, name: 'rob', side: 'aoc', avatar: '/tg/rob.jpg' },
  { id: 304, name: 'vn', side: 'aoc', avatar: '/tg/vn.jpg' },
  { id: 305, name: 'squad_up', side: 'aoc', avatar: '/tg/skely.jpg' },
  { id: 306, name: 'bronx_betty', side: 'aoc', avatar: '/tg/icobeast.jpg' },
  { id: 307, name: 'gnd_gamer', side: 'aoc', avatar: '/tg/vn.jpg' },
  { id: 308, name: 'progressive', side: 'aoc', avatar: '/tg/rob.jpg' },
]

function App() {
  const [selectedMarket, setSelectedMarket] = useState(MARKETS[0])
  const clubRoomRef = useRef(null)  // For zone detection (the actual ClubRoom)

  // ═══ LOADING STATE — Show dancing character while switching markets! ═══
  const [isLoading, setIsLoading] = useState(false)

  // User bet state
  const [userBet, setUserBet] = useState(null) // { side: 'yes'|'no'|'zone1', amount: 20, marketId: 1 }
  const [showBetModal, setShowBetModal] = useState(false)
  const [showDragModal, setShowDragModal] = useState(false) // NEW drag-to-vote modal
  const [pendingZone, setPendingZone] = useState(null)
  const [userBalance, setUserBalance] = useState(250)

  // Handle zone hover (sound feedback)
  const handleZoneEnter = useCallback((zone) => {
    if (zone) {
      playHoverTick(600 + Math.random() * 200, 0.06)
    }
  }, [])

  // Handle zone drop (show modal)
  const handleZoneDrop = useCallback((zone) => {
    setPendingZone(zone)
    setShowBetModal(true)
  }, [])

  // Handle bet confirmation
  const handleBetConfirm = useCallback((amount) => {
    if (pendingZone) {
      playSuccessChime(0.1)
      setUserBet({
        side: pendingZone,
        amount,
        marketId: selectedMarket.id,
      })
      setUserBalance(prev => prev - amount)
      setShowBetModal(false)
      setPendingZone(null)
    }
  }, [pendingZone, selectedMarket.id])

  // Handle bet cancel
  const handleBetCancel = useCallback(() => {
    setShowBetModal(false)
    setPendingZone(null)
  }, [])

  // Handle bet from sidebar (direct click, no drag)
  const handleSidebarBet = useCallback((side, amount) => {
    playSuccessChime(0.1)
    setUserBet({
      side,
      amount,
      marketId: selectedMarket.id,
    })
    setUserBalance(prev => prev - amount)
  }, [selectedMarket.id])

  // Handle cancel bet from sidebar
  const handleCancelBet = useCallback(() => {
    if (userBet) {
      setUserBalance(prev => prev + userBet.amount)
      setUserBet(null)
    }
  }, [userBet])

  // Handle bet from drag modal
  const handleDragModalBet = useCallback((optionId) => {
    playSuccessChime(0.1)
    const defaultAmount = 20
    setUserBet({
      side: optionId,
      amount: defaultAmount,
      marketId: selectedMarket.id,
    })
    setUserBalance(prev => prev - defaultAmount)
    // Keep modal open to show confirmation, user will close it
  }, [selectedMarket.id])

  // Reset user bet when market changes — with dancing loader!
  const handleMarketChange = useCallback((market) => {
    // Show loading state with dancing character
    setIsLoading(true)
    setUserBet(null)
    setPendingZone(null)
    setShowBetModal(false)

    // Brief delay to let React breathe, then switch market
    setTimeout(() => {
      setSelectedMarket(market)
      // Hide loader after a moment to let new market render
      setTimeout(() => setIsLoading(false), 150)
    }, 100)
  }, [])

  // Check if user has bet on current market
  const hasUserBet = userBet?.marketId === selectedMarket.id

  // Get options formatted for the drag-to-bet modal
  const getModalOptions = () => {
    if (selectedMarket.type === 'binary') {
      return [
        { id: 'yes', label: 'YES', pct: selectedMarket.yesPct, color: '#00F0FF', price: `${selectedMarket.yesPct}¢` },
        { id: 'no', label: 'NO', pct: selectedMarket.noPct, color: '#FF0055', price: `${selectedMarket.noPct}¢` },
      ]
    }
    return selectedMarket.options.map(opt => ({
      id: opt.id,
      label: opt.label.split(' ')[0].toUpperCase(),
      pct: opt.pct,
      color: opt.color,
      price: `${opt.pct}¢`,
    }))
  }

  // Get zone info for modal
  const getZoneInfo = () => {
    if (!pendingZone) return null
    
    if (selectedMarket.type === 'binary') {
      return {
        id: pendingZone,
        label: pendingZone.toUpperCase(),
        color: pendingZone === 'yes' ? '#00F0FF' : '#FF0055',
        price: pendingZone === 'yes' ? selectedMarket.yesPct : selectedMarket.noPct,
        pct: pendingZone === 'yes' ? selectedMarket.yesPct : selectedMarket.noPct,
      }
    }
    
    // Multi market
    const zoneIndex = parseInt(pendingZone.replace('zone', '')) - 1
    const option = selectedMarket.options[zoneIndex]
    if (option) {
      return {
        id: pendingZone,
        label: option.label,
        color: option.color,
        price: option.pct,
        pct: option.pct,
      }
    }
    
    return null
  }

  // Pick users based on market type
  const users = selectedMarket.type === 'multi' ? MULTI_USERS : BINARY_USERS

  // For BINARY markets: split yes/no
  const yesUsers = users.filter(u => u.side === 'yes')
  const noUsers = users.filter(u => u.side === 'no')

  // For MULTI markets: split by option id
  const multiGroups = selectedMarket.type === 'multi'
    ? selectedMarket.options.map(opt => ({
        ...opt,
        users: users.filter(u => u.side === opt.id)
      }))
    : []

  // BINARY: Calculate zone boundaries based on market percentages
  const yesRatio = selectedMarket.type === 'binary' ? Math.max(0.2, selectedMarket.yesPct / 100) : 0.5
  const zoneBoundary = yesRatio * 100

  // YES zone: 5% to (boundary - 8%) with padding
  const yesMinX = 5
  const yesMaxX = Math.max(20, zoneBoundary - 8)
  const yesRangeX = yesMaxX - yesMinX

  // NO zone: (boundary + 8%) to 92% with padding
  const noMinX = Math.min(80, zoneBoundary + 8)
  const noMaxX = 92
  const noRangeX = noMaxX - noMinX

  // NOTE: Zone boundaries for multi markets are now calculated dynamically
  // using the nintendoSpread algorithm with column ranges from percentages

  return (
    <div className="app">
      {/* ═══ DANCING LOADER — zac vibing while market loads! ═══ */}
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-dancer">
            <img src={CURRENT_USER.avatar} alt="loading" className="loading-avatar" />
            <div className="loading-body" />
            <div className="loading-arm left" />
            <div className="loading-arm right" />
            <div className="loading-leg left" />
            <div className="loading-leg right" />
          </div>
          <div className="loading-text">switching vibes...</div>
        </div>
      )}

      {/* ═══ PARTY VIBES — Background effects ═══ */}
      <div className="home-party-vibes">
        <div className="home-haze" />
        <div className="home-spotlight cyan" />
        <div className="home-spotlight pink" />
        <div className="home-spotlight purple" />
        <div className="home-spotlight gold" />
        <div className="home-floor-glow" />
        <div className="home-disco-dots">
          <div className="disco-dot" />
          <div className="disco-dot" />
          <div className="disco-dot" />
          <div className="disco-dot" />
          <div className="disco-dot" />
          <div className="disco-dot" />
          <div className="disco-dot" />
          <div className="disco-dot" />
        </div>
      </div>

      {/* ═══ HANGING SIGN — Suspended from ceiling ═══ */}
      <HangingSign
        question={selectedMarket.question}
        isLive={true}
        countdown="2h 15m"
      />

      {/* ═══ SIDEBAR — Market List (Desktop) ═══ */}
      <div className="home-screen">
        <div className="sidebar-header">
          <div className="header-left">
            <span className="fire-emoji">🔥</span>
            <h1 className="sidebar-title">HOT RIGHT NOW</h1>
          </div>
          <button className="see-all-btn">SEE ALL</button>
        </div>

        <div className="market-list">
          {MARKETS.map((market, idx) => (
            <MarketCard
              key={market.id}
              market={market}
              isSelected={selectedMarket.id === market.id}
              onClick={() => handleMarketChange(market)}
              users={users}
              idx={idx}
            />
          ))}
        </div>
        
        {/* Balance indicator */}
        <div className="user-balance">
          <span className="balance-label">YOUR BALANCE</span>
          <span className="balance-amount">${userBalance}</span>
        </div>
      </div>

      {/* ═══ MAIN ARENA — The Nightclub ═══ */}
      <div className="arena-screen">
        {/* MARQUEE SIGN — Handles both binary and multi markets */}
        <MarqueeSign
          question={selectedMarket.question}
          marketType={selectedMarket.type}
          // Binary props
          yesPct={selectedMarket.yesPct}
          noPct={selectedMarket.noPct}
          kalshiYesPct={selectedMarket.kalshiYesPct}
          kalshiNoPct={selectedMarket.kalshiNoPct}
          // Multi props
          options={selectedMarket.options}
          volume={selectedMarket.volume}
        />

        {/* THE 3D ISOMETRIC WORLD */}
        <IsoContainer>
          {selectedMarket.type === 'binary' ? (
            /* ═══ BINARY MARKET — 2 Zones (YES/NO) ═══ */
            <ClubRoom
              ref={clubRoomRef}
              yesPct={selectedMarket.yesPct}
              noPct={selectedMarket.noPct}
            >
              {/* YES side dancers — NINTENDO SPREAD! */}
              {nintendoSpread(yesUsers, {
                xMin: yesMinX,
                xMax: yesMaxX,
                yMin: 15,
                yMax: 85,
              }, { minSpacing: 14, seed: 'yes-zone' }).map((user, i) => (
                <StickFigure
                  key={user.id}
                  username={user.name}
                  side="yes"
                  avatarUrl={user.avatar}
                  position={{ x: user.x, y: user.y }}
                  danceStyle={i % 12}
                  delay={i * 0.08}
                  usePercent
                />
              ))}
              {/* NO side dancers — NINTENDO SPREAD! */}
              {nintendoSpread(noUsers, {
                xMin: noMinX,
                xMax: noMaxX,
                yMin: 15,
                yMax: 85,
              }, { minSpacing: 14, seed: 'no-zone' }).map((user, i) => (
                <StickFigure
                  key={user.id}
                  username={user.name}
                  side="no"
                  avatarUrl={user.avatar}
                  position={{ x: user.x, y: user.y }}
                  danceStyle={(i + 5) % 12}
                  delay={i * 0.08 + 0.3}
                  usePercent
                />
              ))}
              
              {/* ═══ YOUR AVATAR (AFTER BETTING) — Now dancing on floor! ═══ */}
              {hasUserBet && (
                <StickFigure
                  username={CURRENT_USER.username}
                  side={userBet.side}
                  avatarUrl={CURRENT_USER.avatar}
                  position={{ 
                    x: userBet.side === 'yes' ? yesMinX + yesRangeX * 0.5 : noMinX + noRangeX * 0.5, 
                    y: 50 
                  }}
                  danceStyle={7}
                  delay={0}
                  usePercent
                />
              )}
            </ClubRoom>
          ) : (
            /* ═══ MULTI MARKET — 3 Zones (Green/Blue/Purple) ═══ */
            <ClubRoom
              ref={clubRoomRef}
              yesPct={50}
              noPct={50}
              isMulti={true}
              options={selectedMarket.options}
            >
              {/* ALL ZONES — Dynamic column-based distribution with NINTENDO SPREAD! */}
              {multiGroups.map((group, zoneIdx) => {
                // Calculate zone bounds based on percentage (same formula as ClubRoom)
                const GRID_COLS = 24
                const totalPct = selectedMarket.options.reduce((sum, o) => sum + o.pct, 0)
                const normalized = selectedMarket.options.map(o => ({
                  ...o,
                  pct: totalPct > 0 ? (o.pct / totalPct) * 100 : 100 / selectedMarket.options.length,
                }))

                // Calculate column ranges
                let currentCol = 0
                const ranges = normalized.map((opt, idx) => {
                  const minCols = 1
                  const reservedCols = selectedMarket.options.length * minCols
                  const availableCols = Math.max(0, GRID_COLS - reservedCols)
                  const proportional = Math.round((opt.pct / 100) * availableCols)
                  const cols = minCols + proportional
                  const colEnd = idx === selectedMarket.options.length - 1 ? GRID_COLS : currentCol + cols
                  const range = { colStart: currentCol, colEnd }
                  currentCol = colEnd
                  return range
                })

                const range = ranges[zoneIdx]
                if (!range) return null

                // Convert column range to percentage bounds (with padding)
                const xMin = (range.colStart / GRID_COLS) * 100 + 3
                const xMax = (range.colEnd / GRID_COLS) * 100 - 3

                return nintendoSpread(group.users, {
                  xMin,
                  xMax,
                  yMin: 15,
                  yMax: 85,
                }, { minSpacing: 12, seed: `zone-${zoneIdx}` }).map((user, i) => (
                  <StickFigure
                    key={user.id}
                    username={user.name}
                    side={`zone${zoneIdx + 1}`}
                    customColor={group.color}
                    avatarUrl={user.avatar}
                    position={{ x: user.x, y: user.y }}
                    danceStyle={(i + zoneIdx * 3) % 12}
                    delay={i * 0.08 + zoneIdx * 0.2}
                    usePercent
                    choiceLabel={group.label.split(' ')[0]}
                  />
                ))
              })}
              
              {/* ═══ YOUR AVATAR (AFTER BETTING) — Now dancing on floor! ═══ */}
              {hasUserBet && (() => {
                // Calculate zone center dynamically from column ranges
                const GRID_COLS = 24
                const zoneIdx = parseInt(userBet.side.replace('zone', '')) - 1
                const totalPct = selectedMarket.options.reduce((sum, o) => sum + o.pct, 0)
                const normalized = selectedMarket.options.map(o => ({
                  ...o,
                  pct: totalPct > 0 ? (o.pct / totalPct) * 100 : 100 / selectedMarket.options.length,
                }))
                let currentCol = 0
                let zoneXCenter = 50
                normalized.forEach((opt, idx) => {
                  const minCols = 1
                  const reservedCols = selectedMarket.options.length * minCols
                  const availableCols = Math.max(0, GRID_COLS - reservedCols)
                  const proportional = Math.round((opt.pct / 100) * availableCols)
                  const cols = minCols + proportional
                  const colEnd = idx === selectedMarket.options.length - 1 ? GRID_COLS : currentCol + cols
                  if (idx === zoneIdx) {
                    zoneXCenter = ((currentCol + colEnd) / 2 / GRID_COLS) * 100
                  }
                  currentCol = colEnd
                })
                return (
                  <StickFigure
                    username={CURRENT_USER.username}
                    side={userBet.side}
                    customColor={selectedMarket.options[zoneIdx]?.color || '#FFD700'}
                    avatarUrl={CURRENT_USER.avatar}
                    position={{ x: zoneXCenter, y: 50 }}
                    danceStyle={7}
                    delay={0}
                    usePercent
                    choiceLabel={selectedMarket.options[zoneIdx]?.label.split(' ')[0]}
                  />
                )
              })()}
            </ClubRoom>
          )}
        </IsoContainer>

        {/* ═══ FRONT STAGE — Your Avatar on Yellow Platform ═══ */}
        {/* IN FRONT of the dance floor, not on it! */}
        <div className="front-stage">
          {/* YOUR DRAGGABLE AVATAR — Before betting */}
          {!hasUserBet && (
            <DraggableUser
              username={CURRENT_USER.username}
              avatarUrl={CURRENT_USER.avatar}
              containerRef={clubRoomRef}
              onZoneEnter={handleZoneEnter}
              onZoneDrop={handleZoneDrop}
            />
          )}
        </div>
      </div>

      {/* ═══ BET CONFIRMATION MODAL ═══ */}
      <BetConfirmationModal
        isOpen={showBetModal}
        zone={getZoneInfo()}
        user={CURRENT_USER}
        marketQuestion={selectedMarket.question}
        onConfirm={handleBetConfirm}
        onCancel={handleBetCancel}
        balance={userBalance}
      />

      {/* ═══ BETTING SIDEBAR — Quick bet placement! ═══ */}
      <BettingSidebar
        market={selectedMarket}
        userBet={hasUserBet ? userBet : null}
        balance={userBalance}
        onPlaceBet={handleSidebarBet}
        onCancelBet={handleCancelBet}
      />

      {/* ═══ FLOATING BET BUTTON — Opens drag-to-vote modal! ═══ */}
      {!hasUserBet && (
        <button
          className="floating-bet-button"
          onClick={() => setShowDragModal(true)}
        >
          <img src={CURRENT_USER.avatar} alt="" className="bet-button-avatar" />
          <span>Make Prediction</span>
        </button>
      )}

      {/* ═══ DRAG-TO-VOTE MODAL — New immersive betting UX! ═══ */}
      <BettingModal
        options={getModalOptions()}
        isOpen={showDragModal}
        onClose={() => setShowDragModal(false)}
        onBet={handleDragModalBet}
        userAvatar={CURRENT_USER.avatar}
        userName={CURRENT_USER.username}
      />
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// MARKET CARD — Sidebar item (supports binary & multi-answer!)
// ═══════════════════════════════════════════════════════════════
function MarketCard({ market, isSelected, onClick, users, idx }) {
  const isMulti = market.type === 'multi'

  // BINARY: Calculate Party vs Kalshi diff for the badge
  const partyDiff = !isMulti ? market.yesPct - market.kalshiYesPct : 0
  const partyLabel = partyDiff > 0 ? `+${partyDiff}%` : `${partyDiff}%`

  // MULTI: Find the leader
  const leader = isMulti
    ? market.options.reduce((a, b) => a.pct > b.pct ? a : b)
    : null

  // Get 3 mini avatars for this card
  const miniAvatars = users.slice(idx * 3, idx * 3 + 3)

  return (
    <div
      onClick={onClick}
      className={`market-card ${isSelected ? 'selected' : ''} ${isMulti ? 'multi-market' : ''}`}
    >
      {/* QUESTION + PARTY BADGE on same row */}
      <div className="card-top-row">
        <span className="market-question">{market.question}</span>
        {isMulti ? (
          <div className="party-score leader" style={{ background: leader?.color }}>
            {leader?.label.split(' ')[0]}
          </div>
        ) : (
          <div className={`party-score ${partyDiff >= 0 ? 'bullish' : 'bearish'}`}>
            {partyLabel} YES
          </div>
        )}
      </div>

      {/* PROGRESS BARS — Binary (2 bars) or Multi (3 colored segments) */}
      <div className="card-scores">
        {isMulti ? (
          /* ═══ MULTI-ANSWER: 3 colored progress bars ═══ */
          <>
            {/* Kalshi Row — 3 segments */}
            <div className="card-score-row kalshi">
              <span className="card-source-label">KALSHI</span>
              <div className="card-progress-bar multi">
                {market.options.map(opt => (
                  <div
                    key={opt.id}
                    className="card-fill-multi"
                    style={{
                      width: `${opt.kalshiPct}%`,
                      background: opt.color,
                    }}
                  >
                    <span className="card-percent-mini">{opt.kalshiPct}%</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Party Row — 3 segments */}
            <div className="card-score-row party">
              <span className="card-source-label">PARTY</span>
              <div className="card-progress-bar multi">
                {market.options.map(opt => (
                  <div
                    key={opt.id}
                    className="card-fill-multi"
                    style={{
                      width: `${opt.pct}%`,
                      background: opt.color,
                    }}
                  >
                    <span className="card-percent-mini">{opt.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Legend — show option labels */}
            <div className="multi-legend">
              {market.options.map(opt => (
                <div key={opt.id} className="legend-item">
                  <span className="legend-dot" style={{ background: opt.color }} />
                  <span className="legend-label">{opt.label}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          /* ═══ BINARY: Standard YES/NO bars ═══ */
          <>
            {/* Kalshi Bar */}
            <div className="card-score-row kalshi">
              <span className="card-source-label">KALSHI</span>
              <div className="card-progress-bar">
                <div className="card-fill-yes" style={{ width: `${market.kalshiYesPct}%` }}>
                  <span className="card-percent">{market.kalshiYesPct}%</span>
                </div>
                <div className="card-fill-no">
                  <span className="card-percent">{market.kalshiNoPct}%</span>
                </div>
              </div>
            </div>
            {/* Party Bar */}
            <div className="card-score-row party">
              <span className="card-source-label">PARTY</span>
              <div className="card-progress-bar">
                <div className="card-fill-yes" style={{ width: `${market.yesPct}%` }}>
                  <span className="card-percent">{market.yesPct}%</span>
                </div>
                <div className="card-fill-no">
                  <span className="card-percent">{market.noPct}%</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* FOOTER — Crowd avatars + Volume */}
      <div className="market-footer">
        <div className="market-crowd">
          <div className="crowd-avatars">
            {miniAvatars.map(user => (
              <div
                key={user.id}
                className="mini-avatar"
                style={{ backgroundImage: `url(${user.avatar})` }}
              />
            ))}
          </div>
          <span className="crowd-count">{market.partyCount} in party</span>
        </div>
        <span className="market-volume">{market.volume} <span className="vol-label">VOL</span></span>
      </div>
    </div>
  )
}

export default App
