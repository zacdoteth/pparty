/**
 * StickFigure — EXACT PORT from vanilla.html
 *
 * "Head: White circle. Body: Thick black lines. ATTITUDE." — Toshiro
 *
 * Features:
 * - Billboard counter-rotation (faces camera)
 * - Sky drop entrance animation
 * - 12 unique dance styles (exact from vanilla)
 * - Team-colored neon glow (cyan YES / pink NO)
 * - Mr. Game & Watch style thin lines
 * - FIXED: Speech bubbles rendered OUTSIDE 3D context!
 */

import React from 'react'
import ReactDOM from 'react-dom'
import './StickFigure.css'

// Team colors (exact from vanilla)
const COLORS = {
  yes: '#00F0FF',
  no: '#FF0055',
}

// 16 EPIC DANCE STYLES — "Every dance tells a story!" — Miyamoto
const DANCE_CLASSES = [
  'dance-bounce',      // Classic jump
  'dance-floss',       // Fortnite classic
  'dance-robot',       // Mechanical precision
  'dance-wave',        // Smooth body roll
  'dance-jumpjack',    // High energy
  'dance-headbang',    // Rock on!
  'dance-disco',       // Saturday Night Fever
  'dance-runman',      // Classic hip hop
  'dance-dab',         // Iconic move
  'dance-twist',       // Classic 60s
  'dance-shuffle',     // Melbourne shuffle
  'dance-orange',      // Orange Justice
  'dance-wacky',       // WACKY WAVING INFLATABLE ARM FLAILING TUBE MAN!!!
  'dance-sway',        // Chill sway
  'dance-twerk',       // Booty shake
  'dance-cartwheel',   // Spinning celebration
]

// Crypto slang for speech bubbles — ORIGINAL lowercase with emojis!
const CRYPTO_SLANG = {
  yes: ['📈📈 moon soon', 'lfg ser', 'wagmi frens', 'bullish af', 'diamond hands 💎', 'aping in rn', 'send it 🚀', 'ez money', 'gm gm', 'probably nothing 👀'],
  no: ['ngmi', 'rekt incoming 💀', 'bear szn', 'shorting this', 'fade it', 'rug pull vibes', 'sell sell sell', 'paper hands 🧻', 'top signal', 'down bad fr'],
}

// Multi-choice slang — cheering for your candidate! Uses {name} as placeholder
const MULTI_SLANG = [
  '{name} all day 🔥',
  'ez {name} W',
  '{name} or bust',
  'lfg {name}!! 🚀',
  '{name} szn',
  'called it. {name}.',
  '{name} gang 💪',
  'trust {name}',
  '{name} no cap',
  'based {name} pick',
  '{name} locked in 🔒',
  'ride or die {name}',
]

// Get or create the speech bubble container (outside 3D context!)
function getSpeechBubbleContainer() {
  let container = document.getElementById('speech-bubble-layer')
  if (!container) {
    container = document.createElement('div')
    container.id = 'speech-bubble-layer'
    container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 10000;
      overflow: hidden;
    `
    document.body.appendChild(container)
  }
  return container
}

// Speech Bubble Component — Rendered via Portal OUTSIDE 3D context!
function SpeechBubble({ username, slang, color, avatarRef, speechDelay, side }) {
  const [position, setPosition] = React.useState({ x: 0, y: 0, visible: false })

  React.useEffect(() => {
    const updatePosition = () => {
      if (avatarRef.current) {
        const rect = avatarRef.current.getBoundingClientRect()
        setPosition({
          x: rect.left + rect.width / 2,
          y: rect.top - 55, // MMO Nameplate style — HIGH above the avatar head!
          visible: true,
        })
      }
    }

    updatePosition()
    // Update on scroll/resize
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)

    // Update periodically for animations
    const interval = setInterval(updatePosition, 100)

    return () => {
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
      clearInterval(interval)
    }
  }, [avatarRef])

  if (!position.visible) return null

  const container = getSpeechBubbleContainer()

  return ReactDOM.createPortal(
    <div
      className="vote-bubble-portal"
      style={{
        '--speech-delay': `${speechDelay}s`,
        left: position.x,
        top: position.y,
      }}
    >
      <span
        className="bubble-username"
        style={{ color: color || (side === 'yes' ? '#0077AA' : '#CC0044') }}
      >
        {username}:
      </span>{' '}
      {slang}
    </div>,
    container
  )
}

export default function StickFigure({
  username,
  side = 'yes',
  avatarUrl,
  position = { x: 0, y: 0 },
  danceStyle = 0,
  delay = 0,
  customColor = null,
  usePercent = false,  // Use % instead of px for positioning
  choiceLabel = null,  // For multi-choice: the candidate/option name (e.g., "Vance", "AOC")
}) {
  const avatarRef = React.useRef(null)
  const color = customColor || COLORS[side] || '#FFD700'
  const danceClass = DANCE_CLASSES[danceStyle % DANCE_CLASSES.length]

  // Determine bet class — handles binary (yes/no) and multi-zone (zone1/zone2/zone3)
  const betClass = side === 'yes' ? 'bet-yes'
    : side === 'no' ? 'bet-no'
    : side === 'zone1' ? 'bet-zone1'
    : side === 'zone2' ? 'bet-zone2'
    : side === 'zone3' ? 'bet-zone3'
    : 'bet-yes'  // Default fallback

  // Random slang for this user — different for binary vs multi-choice!
  const slang = React.useMemo(() => {
    if (choiceLabel) {
      // Multi-choice: cheer for the candidate
      const template = MULTI_SLANG[Math.floor(Math.random() * MULTI_SLANG.length)]
      return template.replace('{name}', choiceLabel)
    } else {
      // Binary: yes/no crypto slang
      const slangOptions = side === 'yes' ? CRYPTO_SLANG.yes : CRYPTO_SLANG.no
      return slangOptions[Math.floor(Math.random() * slangOptions.length)]
    }
  }, [choiceLabel, side])

  // Random speech delay for staggered bubbles
  const speechDelay = React.useMemo(() =>
    (delay + Math.random() * 5).toFixed(1),
    [delay]
  )

  // Z-index based on Y position for isometric depth sorting
  const zIndex = 10 + Math.floor(position.y)

  return (
    <>
      {/* THE AVATAR — Inside 3D context */}
      <div
        ref={avatarRef}
        className={`iso-avatar sky-drop ${betClass} ${danceClass}`}
        style={{
          left: usePercent ? `${position.x}%` : position.x,
          top: usePercent ? `${position.y}%` : position.y,
          zIndex,
          '--color': color,
          animationDelay: `${delay}s`,
        }}
      >
        {/* SQUIRCLE SHADOW — Stays flat on floor */}
        <div className="iso-avatar-shadow" />

        {/* THE STICK FIGURE SPRITE */}
        <div className="iso-avatar-sprite">
          {/* HEAD — Circle with avatar photo */}
          <div className="stick-head" style={{ borderColor: color }}>
            {avatarUrl && (
              <img src={avatarUrl} alt={username} className="avatar-photo" />
            )}
          </div>

          {/* BODY — Thin neon line */}
          <div className="stick-body" style={{ background: color }} />

          {/* ARMS — Horizontal line */}
          <div className="stick-arms" style={{ background: color }} />

          {/* LEGS — V-shape connected */}
          <div className="stick-legs">
            <span className="leg-left" style={{ background: color }} />
            <span className="leg-right" style={{ background: color }} />
          </div>
        </div>
      </div>

      {/* SPEECH BUBBLE — Rendered via Portal OUTSIDE 3D context! */}
      <SpeechBubble
        username={username}
        slang={slang}
        color={customColor}
        side={side}
        avatarRef={avatarRef}
        speechDelay={speechDelay}
      />
    </>
  )
}
