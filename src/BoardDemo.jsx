/**
 * BoardDemo — Test the Chameleon Board
 * "Tap → Slide → Pick Side" — The Nintendo Prediction Market Experience
 */

import React, { useState } from 'react'
import { Board } from './components/board'

// Example outcome configurations with KALSHI-STYLE PRICING
const OUTCOME_CONFIGS = {
  binary: {
    name: 'Will BTC hit $100k by Dec 31?',
    question: 'Will Bitcoin reach $100,000 USD before December 31, 2025?',
    outcomes: [
      { id: 'yes', color: '#00FF9D', label: 'YES', pct: 72, price: 72 },
      { id: 'no', color: '#FF0055', label: 'NO', pct: 28, price: 28 },
    ],
    volume: '$2.4M',
  },
  election: {
    name: 'Next US President 2028?',
    question: 'Who will win the 2028 US Presidential Election?',
    outcomes: [
      { id: 'jd', color: '#22c55e', label: 'J.D. VANCE', pct: 30, price: 30 },
      { id: 'gavin', color: '#3b82f6', label: 'NEWSOM', pct: 21, price: 21 },
      { id: 'aoc', color: '#a855f7', label: 'AOC', pct: 7, price: 7 },
    ],
    volume: '$5.9M',
  },
  fourWay: {
    name: 'Best Performing Crypto 2025?',
    question: 'Which cryptocurrency will have the highest returns in 2025?',
    outcomes: [
      { id: 'btc', color: '#F7931A', label: 'BTC', pct: 45, price: 45 },
      { id: 'eth', color: '#627EEA', label: 'ETH', pct: 30, price: 30 },
      { id: 'sol', color: '#14F195', label: 'SOL', pct: 15, price: 15 },
      { id: 'other', color: '#888888', label: 'OTHER', pct: 10, price: 10 },
    ],
    volume: '$890K',
  },
}

export default function BoardDemo() {
  const [activeConfig, setActiveConfig] = useState('election')
  const [lastBet, setLastBet] = useState(null)
  const [balance, setBalance] = useState(250)

  const config = OUTCOME_CONFIGS[activeConfig]

  const handleVote = (zone) => {
    console.log('🎯 Voted for:', zone.label)
  }

  const handleBetConfirm = (zone, amount) => {
    console.log(`💰 Bet confirmed: $${amount} on ${zone.label}`)
    setLastBet({ zone, amount })
    setBalance(prev => prev - amount)
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #0a0612 0%, #1a0a2e 50%, #0f0f23 100%)',
        padding: '30px 20px',
        fontFamily: "'Space Grotesk', system-ui, sans-serif",
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Party vibes background */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(ellipse at 30% 20%, rgba(191,0,255,0.15) 0%, transparent 50%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(ellipse at 70% 80%, rgba(0,255,157,0.1) 0%, transparent 40%)',
        pointerEvents: 'none',
      }} />

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 24, position: 'relative', zIndex: 1 }}>
        <div style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: 8, 
          marginBottom: 8,
          padding: '6px 14px',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: 20,
          border: '1px solid rgba(255,255,255,0.1)',
        }}>
          <span style={{ fontSize: 18 }}>🎉</span>
          <span style={{ 
            fontSize: 12, 
            fontWeight: 700, 
            color: 'rgba(255,255,255,0.7)',
            letterSpacing: 2,
          }}>
            PREDICTION PARTY
          </span>
        </div>
        
        <h1 style={{
          fontSize: 28,
          fontWeight: 900,
          color: '#fff',
          marginBottom: 6,
          letterSpacing: -0.5,
        }}>
          {config.name}
        </h1>
        
        <p style={{ 
          color: 'rgba(255,255,255,0.4)', 
          fontSize: 13,
          marginBottom: 16,
        }}>
          {config.volume} volume • Drag your avatar to pick a side
        </p>

        {/* Config switcher */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
          {Object.entries(OUTCOME_CONFIGS).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => {
                setActiveConfig(key)
                setLastBet(null)
              }}
              style={{
                padding: '8px 16px',
                borderRadius: 10,
                border: activeConfig === key 
                  ? '2px solid #00FF9D' 
                  : '2px solid rgba(255,255,255,0.15)',
                background: activeConfig === key 
                  ? 'rgba(0,255,157,0.15)' 
                  : 'rgba(255,255,255,0.05)',
                color: activeConfig === key ? '#00FF9D' : 'rgba(255,255,255,0.6)',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {cfg.outcomes.length === 2 ? '🎯 YES/NO' : cfg.outcomes.length === 3 ? '🗳️ 3-WAY' : '🔥 4-WAY'}
            </button>
          ))}
        </div>
      </div>

      {/* Balance indicator */}
      <div style={{
        position: 'absolute',
        top: 20,
        right: 20,
        padding: '10px 16px',
        background: 'rgba(0,0,0,0.4)',
        borderRadius: 12,
        border: '1px solid rgba(255,255,255,0.1)',
        zIndex: 10,
      }}>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 2 }}>BALANCE</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#00FF9D' }}>${balance}</div>
      </div>

      {/* The Board */}
      <Board
        key={activeConfig}
        outcomes={config.outcomes}
        marketQuestion={config.question}
        userBalance={balance}
        currentUser={{
          id: 'zac',
          username: 'zac.eth',
          avatar: '/tg/zac.jpg',
        }}
        onVote={handleVote}
        onBetConfirm={handleBetConfirm}
      />

      {/* Bet confirmation feedback */}
      {lastBet && (
        <div
          style={{
            textAlign: 'center',
            marginTop: 24,
            padding: 16,
            background: `linear-gradient(90deg, transparent, ${lastBet.zone.color}22, transparent)`,
            borderRadius: 12,
            border: `1px solid ${lastBet.zone.color}33`,
          }}
        >
          <span style={{ color: lastBet.zone.color, fontWeight: 700, fontSize: 16 }}>
            ✓ Bet ${lastBet.amount} on {lastBet.zone.label}
          </span>
          <div style={{ 
            color: 'rgba(255,255,255,0.5)', 
            fontSize: 12, 
            marginTop: 4 
          }}>
            Potential payout: ${(lastBet.amount / (lastBet.zone.price / 100)).toFixed(2)}
          </div>
        </div>
      )}
    </div>
  )
}
