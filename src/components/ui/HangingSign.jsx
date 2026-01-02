/**
 * HangingSign — Suspended Broadway Marquee
 * "Industrial chains meet Vegas lights" — Toshiro
 *
 * Pinned to viewport ceiling, chains going up off-screen.
 * The moment you walk in, you know what tonight is about.
 */

import React from 'react'
import './HangingSign.css'

// 12 bulbs for the sign frame
function generateBulbs(count = 12) {
  return Array.from({ length: count }, (_, i) => <span key={i} />)
}

export default function HangingSign({
  question = "Will BTC hit $100k?",
  isLive = true,
  countdown = "2h 15m",
}) {
  return (
    <div className="hanging-sign-container">
      {/* CHAINS — Going up off-screen */}
      <div className="hanging-chains">
        <div className="chain chain-left">
          <div className="chain-link" />
          <div className="chain-link" />
          <div className="chain-link" />
          <div className="chain-link" />
        </div>
        <div className="chain chain-right">
          <div className="chain-link" />
          <div className="chain-link" />
          <div className="chain-link" />
          <div className="chain-link" />
        </div>
      </div>

      {/* THE SIGN — Broadway Marquee */}
      <div className="hanging-sign">
        <div className="sign-frame">
          {/* TOP BULBS */}
          <div className="sign-lights top">
            {generateBulbs(12)}
          </div>

          {/* CONTENT */}
          <div className="sign-content">
            {/* LIVE + COUNTDOWN */}
            <div className="sign-meta">
              {isLive && (
                <div className="sign-live">
                  <span className="live-dot" />
                  LIVE
                </div>
              )}
              {countdown && (
                <div className="sign-countdown">
                  <span className="countdown-icon">⏱</span>
                  {countdown}
                </div>
              )}
            </div>

            {/* THE QUESTION — Star of the show */}
            <div className="sign-question">
              {question}
            </div>
          </div>

          {/* BOTTOM BULBS */}
          <div className="sign-lights bottom">
            {generateBulbs(12)}
          </div>
        </div>
      </div>
    </div>
  )
}
