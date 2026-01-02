/**
 * MarqueeSign — EXACT PORT from vanilla.html
 * "Broadway Marquee with Vegas-style chasing bulb lights" — Toshiro
 */

import React from 'react'
import './MarqueeSign.css'

// Generate 14 bulbs for marquee lights
function generateBulbs() {
  return Array.from({ length: 14 }, (_, i) => <span key={i} />)
}

export default function MarqueeSign({
  question = "Will BTC hit $100k?",
  marketType = 'binary',  // 'binary' or 'multi'
  yesPct = 50,            // Party crowd sentiment (binary)
  noPct = 50,
  kalshiYesPct = 55,      // Official Kalshi market odds (binary)
  kalshiNoPct = 45,
  options = [],           // Multi-choice options [{id, label, pct, kalshiPct, color}]
  volume = "$1.2M",
  isLive = true,
  countdown = "2h 15m",
}) {
  const isMulti = marketType === 'multi' && options.length > 0

  return (
    <div className="marquee-sign">
      <div className="marquee-frame">
        {/* TOP MARQUEE LIGHTS — Vegas chase! */}
        <div className="marquee-lights">
          {generateBulbs()}
        </div>

        {/* CONTENT */}
        <div className="marquee-content">
          {/* CENTER — Question + Stats */}
          <div className="marquee-center">
            {/* LIVE badge + Countdown */}
            <div className="marquee-live-row">
              {isLive && (
                <div className="marquee-live">
                  <span className="live-dot" />
                  LIVE
                </div>
              )}
              {countdown && (
                <div className="marquee-countdown">
                  <span className="countdown-icon">⏱</span>
                  {countdown}
                </div>
              )}
            </div>

            {/* QUESTION */}
            <div className="marquee-question">{question}</div>

            {/* STATS — Different for binary vs multi */}
            <div className="marquee-stats">
              {isMulti ? (
                // MULTI-CHOICE: Show top options
                <>
                  {options.slice(0, 3).map((opt, i) => (
                    <React.Fragment key={opt.id}>
                      {i > 0 && <span className="marquee-stat">•</span>}
                      <span className="marquee-stat" style={{ color: opt.color }}>
                        {opt.label.split(' ')[0]} <span className="stat-pct">{opt.pct}%</span>
                      </span>
                    </React.Fragment>
                  ))}
                  <span className="marquee-stat">•</span>
                  <span className="marquee-stat">{volume} VOL</span>
                </>
              ) : (
                // BINARY: YES/NO
                <>
                  <span className="marquee-stat yes">
                    YES <span className="stat-pct">{yesPct}%</span>
                  </span>
                  <span className="marquee-stat">•</span>
                  <span className="marquee-stat no">
                    NO <span className="stat-pct">{noPct}%</span>
                  </span>
                  <span className="marquee-stat">•</span>
                  <span className="marquee-stat">{volume} VOL</span>
                </>
              )}
            </div>

            {/* PROGRESS BARS — Different for binary vs multi */}
            <div className="marquee-bars">
              {isMulti ? (
                // MULTI-CHOICE: Colored segments
                <>
                  <div className="marquee-bar-row kalshi">
                    <span className="marquee-bar-label">KALSHI</span>
                    <div className="marquee-bar-container">
                      {options.map(opt => (
                        <div
                          key={opt.id}
                          className="marquee-bar"
                          style={{
                            width: `${opt.kalshiPct}%`,
                            background: opt.color,
                            boxShadow: `0 0 8px ${opt.color}`,
                          }}
                        >
                          <span className="marquee-pct">{opt.kalshiPct}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="marquee-bar-row party">
                    <span className="marquee-bar-label">PARTY</span>
                    <div className="marquee-bar-container">
                      {options.map(opt => (
                        <div
                          key={opt.id}
                          className="marquee-bar"
                          style={{
                            width: `${opt.pct}%`,
                            background: opt.color,
                            boxShadow: `0 0 8px ${opt.color}`,
                          }}
                        >
                          <span className="marquee-pct">{opt.pct}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                // BINARY: Cyan/Pink bars
                <>
                  <div className="marquee-bar-row kalshi">
                    <span className="marquee-bar-label">KALSHI</span>
                    <div className="marquee-bar-container">
                      <div className="marquee-bar kalshi-yes" style={{ width: `${kalshiYesPct}%` }}>
                        <span className="marquee-pct">{kalshiYesPct}%</span>
                      </div>
                      <div className="marquee-bar kalshi-no">
                        <span className="marquee-pct">{kalshiNoPct}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="marquee-bar-row party">
                    <span className="marquee-bar-label">PARTY</span>
                    <div className="marquee-bar-container">
                      <div className="marquee-bar yes" style={{ width: `${yesPct}%` }}>
                        <span className="marquee-pct">{yesPct}%</span>
                      </div>
                      <div className="marquee-bar no">
                        <span className="marquee-pct">{noPct}%</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* BOTTOM MARQUEE LIGHTS — Reverse chase! */}
        <div className="marquee-lights bottom">
          {generateBulbs()}
        </div>
      </div>
    </div>
  )
}
