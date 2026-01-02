/**
 * BettingSidebar — Place your bets in style!
 * "The crypto bookie's dream UI" — Design Lead
 */

import React, { useState } from 'react'
import './BettingSidebar.css'

const BET_AMOUNTS = [5, 10, 25, 50, 100]

export default function BettingSidebar({
  market,
  userBet,
  balance,
  onPlaceBet,
  onCancelBet,
}) {
  const [selectedZone, setSelectedZone] = useState(null)
  const [betAmount, setBetAmount] = useState(10)
  const [customAmount, setCustomAmount] = useState('')

  const isMulti = market?.type === 'multi'
  const hasBet = !!userBet

  // Get options based on market type
  const options = isMulti
    ? market.options.map(opt => ({
        id: opt.id,
        label: opt.label,
        pct: opt.pct,
        color: opt.color,
      }))
    : [
        { id: 'yes', label: 'YES', pct: market?.yesPct || 50, color: '#00F0FF' },
        { id: 'no', label: 'NO', pct: market?.noPct || 50, color: '#FF0055' },
      ]

  const handleSelectZone = (zoneId) => {
    if (hasBet) return // Already bet
    setSelectedZone(zoneId)
  }

  const handleAmountSelect = (amount) => {
    setBetAmount(amount)
    setCustomAmount('')
  }

  const handleCustomAmountChange = (e) => {
    const val = e.target.value.replace(/[^0-9]/g, '')
    setCustomAmount(val)
    if (val) setBetAmount(parseInt(val, 10))
  }

  const handlePlaceBet = () => {
    if (!selectedZone || betAmount <= 0 || betAmount > balance) return

    // Map zone id to the format expected by the app
    const side = isMulti
      ? `zone${options.findIndex(o => o.id === selectedZone) + 1}`
      : selectedZone

    onPlaceBet(side, betAmount)
    setSelectedZone(null)
    setBetAmount(10)
    setCustomAmount('')
  }

  const selectedOption = options.find(o => o.id === selectedZone)
  const potentialWin = selectedOption
    ? Math.round((betAmount * 100) / selectedOption.pct)
    : 0

  return (
    <div className="betting-sidebar">
      <div className="betting-header">
        <span className="betting-icon">🎰</span>
        <h3>PLACE YOUR BET</h3>
      </div>

      {/* ═══ OPTIONS TO BET ON ═══ */}
      <div className="betting-options">
        {options.map((opt) => {
          const isSelected = selectedZone === opt.id
          const isBetOn = hasBet && userBet?.side?.includes(opt.id)

          return (
            <button
              key={opt.id}
              className={`bet-option ${isSelected ? 'selected' : ''} ${isBetOn ? 'bet-placed' : ''}`}
              style={{
                '--option-color': opt.color,
                borderColor: isSelected || isBetOn ? opt.color : 'transparent',
              }}
              onClick={() => handleSelectZone(opt.id)}
              disabled={hasBet}
            >
              <span className="option-label">{opt.label}</span>
              <span className="option-odds" style={{ color: opt.color }}>
                {opt.pct}%
              </span>
              {isBetOn && (
                <span className="bet-badge">${userBet.amount}</span>
              )}
            </button>
          )
        })}
      </div>

      {/* ═══ BET AMOUNT SELECTION ═══ */}
      {!hasBet && selectedZone && (
        <div className="betting-amount-section">
          <div className="amount-label">BET AMOUNT</div>

          <div className="amount-buttons">
            {BET_AMOUNTS.map((amt) => (
              <button
                key={amt}
                className={`amount-btn ${betAmount === amt && !customAmount ? 'active' : ''}`}
                onClick={() => handleAmountSelect(amt)}
                disabled={amt > balance}
              >
                ${amt}
              </button>
            ))}
          </div>

          <div className="custom-amount">
            <span className="dollar-sign">$</span>
            <input
              type="text"
              placeholder="Custom"
              value={customAmount}
              onChange={handleCustomAmountChange}
              maxLength={5}
            />
          </div>

          {/* Potential Win Display */}
          <div className="potential-win">
            <span className="win-label">POTENTIAL WIN</span>
            <span className="win-amount" style={{ color: selectedOption?.color }}>
              ${potentialWin}
            </span>
          </div>

          {/* Place Bet Button */}
          <button
            className="place-bet-btn"
            onClick={handlePlaceBet}
            disabled={betAmount <= 0 || betAmount > balance}
            style={{ background: selectedOption?.color }}
          >
            BET ${betAmount} on {selectedOption?.label}
          </button>
        </div>
      )}

      {/* ═══ AFTER BETTING ═══ */}
      {hasBet && (
        <div className="bet-placed-section">
          <div className="bet-success">
            <span className="check-icon">✓</span>
            <span>BET PLACED!</span>
          </div>
          <div className="bet-details">
            <span className="detail-label">Amount:</span>
            <span className="detail-value">${userBet.amount}</span>
          </div>
          <button className="cancel-bet-btn" onClick={onCancelBet}>
            CANCEL BET
          </button>
        </div>
      )}

      {/* ═══ BALANCE ═══ */}
      <div className="sidebar-balance">
        <span className="bal-label">BALANCE</span>
        <span className="bal-value">${balance}</span>
      </div>
    </div>
  )
}
