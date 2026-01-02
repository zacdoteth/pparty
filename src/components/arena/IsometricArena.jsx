/**
 * IsometricArena — PREDICTION PARTY CLUB
 * ONE BIG FLOOR • Turntable.fm vibes • Nintendo charm
 */

import React, { useState, useRef, useCallback, useMemo } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import BettingModal from '../ui/BettingModal'
import './IsometricArena.css'

// ═══════════════════════════════════════════════════════════════
// PARTY PEOPLE
// ═══════════════════════════════════════════════════════════════
const PARTY_PEOPLE = [
  { id: 'azflin', name: 'MAGA_Mike', avatar: '/tg/AzFlin.jpg', side: 'yes', message: 'ride or die J.D.W' },
  { id: 'bandit', name: 'TrumpTrain', avatar: '/tg/bandit.jpg', side: 'yes', message: 'ride or die J.D.' },
  { id: 'biz', name: 'Pupul', avatar: '/tg/pupul.jpg', side: 'no', message: 'fading this' },
  { id: 'ferengi', name: 'RedPilled', avatar: '/tg/ferengi.jpg', side: 'yes', message: 'ez J.D. W' },
  { id: 'frosty', name: 'Frosty', avatar: '/tg/frostyflakes.jpg', side: 'no', message: 'short it' },
  { id: 'icobeast', name: 'BasedTom', avatar: '/tg/icobeast.jpg', side: 'yes', message: 'based J.D. pick' },
  { id: 'jin', name: 'GovFan', avatar: '/tg/jin.jpg', side: 'gavin', message: 'lfg Gavin!!' },
  { id: 'phanes', name: 'OhioVibes', avatar: '/tg/phanes.jpg', side: 'yes', message: 'J.D. no cap' },
  { id: 'rekt', name: 'CaliBear', avatar: '/tg/rekt.jpg', side: 'gavin', message: 'lfg Gavin!!' },
  { id: 'rob', name: 'WestCoast', avatar: '/tg/rob.jpg', side: 'gavin', message: 'trust Gavin' },
  { id: 'shinkiro', name: 'BlueWave', avatar: '/tg/shinkiro14.jpg', side: 'gavin', message: 'Gavin no cap' },
  { id: 'skely', name: 'SquadUp', avatar: '/tg/skely.jpg', side: 'aoc', message: 'AOC or bust' },
  { id: 'tintin', name: 'BronxBoss', avatar: '/tg/Tintin.jpg', side: 'aoc', message: 'AOC all day 🔥' },
  { id: 'ultra', name: 'NYCrew', avatar: '/tg/ultra.png', side: 'aoc', message: 'called it. AOC.' },
  { id: 'vn', name: 'VN', avatar: '/tg/vn.jpg', side: 'yes', message: 'locked 🔒' },
]

const SAMPLE_MARKETS = [
  { id: 1, question: 'Next US President 2028?', kalshi: 55, party: 50, volume: '$5.9M', people: 89, badge: 'J.D.', badgeColor: '#00FF00', isMulti: true, options: ['J.D. Vance', 'Gavin Newsom', 'AOC'] },
  { id: 2, question: 'Will BTC hit $100k by Dec 31?', kalshi: 65, party: 72, volume: '$2.4M', people: 74, change: '+7%', changePositive: true },
  { id: 3, question: 'Will Elon visit Mars before 2030?', kalshi: 6, party: 88, volume: '$890K', people: 39, change: '+6%', changePositive: true },
  { id: 4, question: 'Will there be a US recession in 2025?', kalshi: 38, party: 45, volume: '$1.2M', people: 47, change: '+7%', changePositive: true },
  { id: 5, question: 'GPT-5 release by June 2025?', kalshi: 31, party: 28, volume: '$560K', people: 28, change: '-3%', changePositive: false },
]

// ═══════════════════════════════════════════════════════════════
// MARKET CARD
// ═══════════════════════════════════════════════════════════════
function MarketCard({ market, isActive, onClick }) {
  return (
    <div className={`market-card ${isActive ? 'active' : ''}`} onClick={onClick}>
      <div className="market-card-header">
        <span className="market-question">{market.question}</span>
        {market.badge && <span className="market-badge" style={{ background: market.badgeColor }}>{market.badge}</span>}
        {market.change && <span className={`market-change ${market.changePositive ? 'positive' : 'negative'}`}>{market.change} YES</span>}
      </div>
      <div className="market-bars">
        <div className="bar-row"><span className="bar-label">KALSHI</span><div className="bar-track"><div className="bar-fill kalshi" style={{ width: `${market.kalshi}%` }} /></div><span className="bar-pct">{market.kalshi}%</span></div>
        <div className="bar-row"><span className="bar-label">PARTY</span><div className="bar-track"><div className="bar-fill party" style={{ width: `${market.party}%` }} /></div><span className="bar-pct">{market.party}%</span></div>
      </div>
      {market.isMulti && <div className="market-options">{market.options.map((opt, i) => <span key={i} className="option-dot">● {opt}</span>)}</div>}
      <div className="market-footer">
        <div className="market-avatars">{[...Array(3)].map((_, i) => <div key={i} className="mini-avatar" style={{ backgroundImage: `url(/tg/${['zac', 'bandit', 'ferengi'][i]}.jpg)` }} />)}</div>
        <span className="market-people">{market.people} in party</span>
        <span className="market-volume">{market.volume} VOL</span>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// DANCING FIGURE — Nintendo style!
// ═══════════════════════════════════════════════════════════════
function DancingFigure({ person, style, zoneColor, danceType = 0 }) {
  const dances = ['bounce', 'sway', 'pump', 'wave', 'groove', 'hop', 'rock', 'vibe']
  const dance = dances[danceType % dances.length]
  
  return (
    <div className={`dancer dance-${dance}`} style={{ ...style, '--color': zoneColor }}>
      <div className="dancer-bubble">
        <span className="bubble-name">{person.name}:</span> {person.message}
      </div>
      <div className="dancer-head">
        <img src={person.avatar} alt={person.name} />
      </div>
      <svg className="dancer-body" viewBox="0 0 40 55">
        <line x1="20" y1="0" x2="20" y2="22" className="limb torso" />
        <line x1="20" y1="5" x2="6" y2="18" className="limb arm-l" />
        <line x1="20" y1="5" x2="34" y2="18" className="limb arm-r" />
        <line x1="20" y1="22" x2="10" y2="45" className="limb leg-l" />
        <line x1="20" y1="22" x2="30" y2="45" className="limb leg-r" />
      </svg>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// ZONE SIGN — Floating above floor
// ═══════════════════════════════════════════════════════════════
function ZoneSign({ label, pct, color, style }) {
  return (
    <div className="zone-sign" style={{ ...style, '--color': color }}>
      <div className="sign-label">{label}</div>
      <div className="sign-pct">{pct}%</div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// DJ BOOTH
// ═══════════════════════════════════════════════════════════════
function DJBooth() {
  return (
    <div className="dj-booth">
      <div className="dj-avatar">
        <img src="/tg/ultra.png" alt="DJ" />
      </div>
      <div className="dj-deck">
        <div className="deck-circle" />
        <div className="deck-circle" />
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// DRAGGABLE USER
// ═══════════════════════════════════════════════════════════════
function DraggableUser({ user, containerRef, onZoneEnter, onZoneDrop, outcomes, isLocked }) {
  const [isDragging, setIsDragging] = useState(false)
  const [hoveredZone, setHoveredZone] = useState(null)
  const playerRef = useRef(null)

  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const springX = useSpring(x, { stiffness: 300, damping: 25 })
  const springY = useSpring(y, { stiffness: 300, damping: 25 })

  const detectZone = useCallback(() => {
    if (!playerRef.current || !containerRef?.current) return null
    const zones = containerRef.current.querySelectorAll('.floor-zone')
    const rect = playerRef.current.getBoundingClientRect()
    const center = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
    
    for (let i = 0; i < zones.length; i++) {
      const zoneRect = zones[i].getBoundingClientRect()
      if (center.x >= zoneRect.left && center.x <= zoneRect.right && center.y >= zoneRect.top && center.y <= zoneRect.bottom) {
        return outcomes[i]?.id
      }
    }
    return null
  }, [containerRef, outcomes])

  const glowColor = hoveredZone ? outcomes.find(o => o.id === hoveredZone)?.color || '#FFD700' : '#FFD700'
  const zoneName = hoveredZone ? outcomes.find(o => o.id === hoveredZone)?.label : null

  if (isLocked) return null

  return (
    <div className="user-dock">
      <motion.div
        ref={playerRef}
        className={`user-avatar-wrap ${isDragging ? 'dragging' : ''} ${hoveredZone ? 'hovering' : ''}`}
        style={{ x: springX, y: springY, '--glow': glowColor }}
        drag
        dragConstraints={containerRef}
        dragElastic={0.1}
        onDragStart={() => setIsDragging(true)}
        onDrag={() => {
          const zone = detectZone()
          if (zone !== hoveredZone) { setHoveredZone(zone); onZoneEnter?.(zone) }
        }}
        onDragEnd={() => { setIsDragging(false); if (hoveredZone) onZoneDrop?.(hoveredZone) }}
        whileDrag={{ scale: 1.05, zIndex: 1000 }}
      >
        <div className="user-speech">{zoneName ? `Drop for ${zoneName}!` : 'Drag me to vote!'}</div>
        <div className="user-head"><img src={user.avatar} alt={user.username} /></div>
        <svg className="user-body" viewBox="0 0 40 55">
          <line x1="20" y1="0" x2="20" y2="22" className="limb" />
          <line x1="20" y1="5" x2="6" y2="18" className="limb wave-l" />
          <line x1="20" y1="5" x2="34" y2="18" className="limb wave-r" />
          <line x1="20" y1="22" x2="10" y2="45" className="limb" />
          <line x1="20" y1="22" x2="30" y2="45" className="limb" />
        </svg>
        <div className="user-name">{user.username}</div>
        <div className="user-platform" />
      </motion.div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function IsometricArena({
  outcomes = [],
  currentUser = { username: 'zac.eth', avatar: '/tg/zac.jpg' },
  onZoneDrop,
  marketQuestion = 'Will BTC hit $100k by Dec 31?',
  people = PARTY_PEOPLE,
  markets = SAMPLE_MARKETS,
}) {
  const stageRef = useRef(null)
  const [hoveredZoneId, setHoveredZoneId] = useState(null)
  const [lockedZoneId, setLockedZoneId] = useState(null)
  const [activeMarketId, setActiveMarketId] = useState(2)
  const [userBalance] = useState(250)
  const [isBettingModalOpen, setIsBettingModalOpen] = useState(false)

  // Handle bet from modal
  const handleModalBet = useCallback((optionId) => {
    setLockedZoneId(optionId)
    onZoneDrop?.(optionId)
  }, [onZoneDrop])

  const zonePeople = useMemo(() => {
    if (outcomes.length === 2) return { [outcomes[0].id]: people.filter(p => p.side === 'yes'), [outcomes[1].id]: people.filter(p => p.side === 'no') }
    if (outcomes.length === 3) return { [outcomes[0].id]: people.filter(p => p.side === 'yes'), [outcomes[1].id]: people.filter(p => p.side === 'gavin'), [outcomes[2].id]: people.filter(p => p.side === 'aoc') }
    return {}
  }, [outcomes, people])

  // Calculate positions for people in each zone
  const getPositions = useCallback((zoneIndex, count, total) => {
    const positions = []
    const cols = Math.ceil(Math.sqrt(count + 1))
    const zoneWidth = 100 / total
    const startX = zoneIndex * zoneWidth
    
    for (let i = 0; i < count; i++) {
      const col = i % cols
      const row = Math.floor(i / cols)
      positions.push({
        left: `${startX + 8 + (col / cols) * (zoneWidth - 16)}%`,
        top: `${25 + row * 22}%`,
      })
    }
    return positions
  }, [])

  const activeMarket = markets.find(m => m.id === activeMarketId) || markets[0]

  return (
    <div className="club-app">
      {/* SIDEBAR */}
      <aside className="club-sidebar">
        <div className="sidebar-head"><span>🔥</span><span>HOT RIGHT NOW</span><button className="see-all">SEE ALL</button></div>
        <div className="sidebar-markets">{markets.map(m => <MarketCard key={m.id} market={m} isActive={m.id === activeMarketId} onClick={() => setActiveMarketId(m.id)} />)}</div>
        <div className="sidebar-balance"><span>YOUR BALANCE</span><span className="balance-amt">${userBalance}</span></div>
      </aside>

      {/* MAIN STAGE */}
      <main className="club-stage" ref={stageRef}>
        {/* Stage lights */}
        <div className="stage-lights">
          {[...Array(5)].map((_, i) => <div key={i} className="spotlight" style={{ '--i': i }} />)}
        </div>

        {/* Marquee */}
        <div className="marquee">
          <div className="marquee-bulbs">{[...Array(24)].map((_, i) => <span key={i} className="bulb" style={{ '--i': i }} />)}</div>
          <div className="marquee-content">
            <button className="vote-btn no" onClick={() => !lockedZoneId && setIsBettingModalOpen(true)}>✕</button>
            <div className="marquee-center">
              <div className="marquee-status"><span className="live-dot" /> LIVE <span className="time">⏱ 2h 15m</span></div>
              <h1>{marketQuestion}</h1>
              <div className="marquee-odds">
                <span className="yes">YES {activeMarket.party}%</span> • <span className="no">NO {100 - activeMarket.party}%</span> • <span>{activeMarket.volume} VOL</span>
              </div>
              <div className="marquee-bars">
                <div className="mbar"><span>KALSHI</span><div className="mbar-track"><div className="mbar-fill yes" style={{ width: `${activeMarket.kalshi}%` }} /><div className="mbar-fill no" style={{ width: `${100 - activeMarket.kalshi}%` }} /></div><span>{activeMarket.kalshi}%</span></div>
                <div className="mbar"><span>PARTY</span><div className="mbar-track"><div className="mbar-fill yes" style={{ width: `${activeMarket.party}%` }} /><div className="mbar-fill no" style={{ width: `${100 - activeMarket.party}%` }} /></div><span>{activeMarket.party}%</span></div>
              </div>
            </div>
            <button className="vote-btn yes" onClick={() => !lockedZoneId && setIsBettingModalOpen(true)}>✓</button>
          </div>
          <div className="marquee-bulbs">{[...Array(24)].map((_, i) => <span key={i} className="bulb" style={{ '--i': i }} />)}</div>
        </div>

        {/* THE BIG DANCE FLOOR */}
        <div className="dance-floor-container">
          <div className="dance-floor">
            {/* Zone backgrounds and grids */}
            {outcomes.map((outcome, i) => {
              const zoneWidth = 100 / outcomes.length
              const zonePeopleList = zonePeople[outcome.id] || []
              const positions = getPositions(i, zonePeopleList.length, outcomes.length)
              const allPeople = lockedZoneId === outcome.id 
                ? [...zonePeopleList, { ...currentUser, id: 'user', name: currentUser.username, avatar: currentUser.avatar, message: 'vibing 🎉' }]
                : zonePeopleList
              const allPositions = lockedZoneId === outcome.id 
                ? [...positions, { left: `${i * zoneWidth + zoneWidth / 2 - 5}%`, top: '60%' }]
                : positions

              return (
                <div 
                  key={outcome.id} 
                  className={`floor-zone ${hoveredZoneId === outcome.id ? 'hovered' : ''}`}
                  style={{ '--color': outcome.color, '--width': `${zoneWidth}%`, '--index': i }}
                >
                  {/* Grid tiles - 8x6 = 48 flush tiles */}
                  <div className="zone-grid" style={{ '--tile-color': outcome.color }}>
                    {[...Array(48)].map((_, j) => (
                      <div
                        key={j}
                        className="grid-tile"
                        style={{ '--index': j, '--tile-color': outcome.color }}
                      />
                    ))}
                  </div>
                  
                  {/* Zone sign */}
                  <ZoneSign label={outcome.label} pct={outcome.pct} color={outcome.color} />
                  
                  {/* Dancing people */}
                  {allPeople.map((person, j) => (
                    <DancingFigure
                      key={person.id}
                      person={person}
                      style={allPositions[j]}
                      zoneColor={outcome.color}
                      danceType={j}
                    />
                  ))}
                </div>
              )
            })}
          </div>
        </div>

        {/* DJ Booth */}
        <DJBooth />

        {/* User */}
        <DraggableUser
          user={currentUser}
          containerRef={stageRef}
          onZoneEnter={setHoveredZoneId}
          onZoneDrop={(id) => { setLockedZoneId(id); onZoneDrop?.(id) }}
          outcomes={outcomes}
          isLocked={!!lockedZoneId}
        />

        {/* Mobile balance */}
        <div className="mobile-balance"><span>YOUR BALANCE</span><span>${userBalance}</span></div>

        {/* Floating BET button — Mobile primary action */}
        {!lockedZoneId && (
          <button
            className="floating-bet-btn"
            onClick={() => setIsBettingModalOpen(true)}
          >
            <span className="bet-icon">🎯</span>
            <span>MAKE PREDICTION</span>
          </button>
        )}
      </main>

      {/* Betting Modal */}
      <BettingModal
        isOpen={isBettingModalOpen}
        onClose={() => setIsBettingModalOpen(false)}
        onBet={handleModalBet}
        options={outcomes.map(o => ({
          id: o.id,
          label: o.label,
          pct: o.pct,
          color: o.color,
          price: `${o.pct}¢`
        }))}
        userAvatar={currentUser.avatar}
        userName={currentUser.username}
      />
    </div>
  )
}
