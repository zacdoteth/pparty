/**
 * ClubRoom — UNIFIED ISOMETRIC DANCE FLOOR
 * "One floor to rule them all. Binary or Multi, same magic." — Miyamoto
 *
 * ARCHITECTURE (Simplified):
 * - Single floor structure for both YES/NO and Multi-choice
 * - Sky podiums float above with billboard counter-rotation
 * - 3D "Cribs" walls around each zone perimeter
 * - The VIBE: Habbo Hotel meets Paper Mario
 */

import React, { forwardRef } from 'react'
import './ClubRoom.css'

// ═══════════════════════════════════════════════════════════════
// THREE.JS FORMULA — UNIFIED GRID WITH COLUMN PARTITIONING!
// "Same math as DanceFloor.tsx — one grid, dynamic zones" — Miyamoto
// ═══════════════════════════════════════════════════════════════
const GRID_COLS = 24  // Match Three.js!
const GRID_ROWS = 12
const TOTAL_TILES = GRID_COLS * GRID_ROWS

/**
 * Calculate column ranges — EXACT COPY from DanceFloor.tsx!
 * Distributes columns proportionally based on percentages
 */
function calculateColumnRanges(options, totalCols) {
  if (options.length === 0) return []

  const totalPct = options.reduce((sum, o) => sum + o.pct, 0)
  const normalized = options.map(o => ({
    ...o,
    pct: totalPct > 0 ? (o.pct / totalPct) * 100 : 100 / options.length,
  }))

  const minColsPerOption = 1
  const reservedCols = options.length * minColsPerOption
  const availableCols = Math.max(0, totalCols - reservedCols)

  let currentCol = 0
  return normalized.map((opt, idx) => {
    const isLast = idx === options.length - 1
    const proportional = Math.round((opt.pct / 100) * availableCols)
    const cols = minColsPerOption + proportional
    const colEnd = isLast ? totalCols : currentCol + cols

    const range = {
      optionId: opt.id,
      color: opt.color,
      label: opt.label,
      pct: opt.pct,
      colStart: currentCol,
      colEnd: colEnd,
    }

    currentCol = colEnd
    return range
  })
}

function getOptionForColumn(col, ranges) {
  for (const range of ranges) {
    if (col >= range.colStart && col < range.colEnd) {
      return range
    }
  }
  return ranges[ranges.length - 1] || null
}

/**
 * UnifiedGrid — ONE grid where tiles are colored by column range!
 * No separate zone grids — just like Three.js DanceFloor
 * Now with ACCORDION intro animation! Tiles stagger by column for wave effect
 */
function UnifiedGrid({ options }) {
  const ranges = calculateColumnRanges(options, GRID_COLS)

  return (
    <div className="unified-grid">
      {Array.from({ length: TOTAL_TILES }, (_, i) => {
        const row = Math.floor(i / GRID_COLS)
        const col = i % GRID_COLS
        const zone = getOptionForColumn(col, ranges)
        // Accordion delay: column-major order for wave effect (col * rows + row)
        const tileDelay = col * GRID_ROWS + row

        return (
          <div
            key={i}
            className="iso-tile"
            data-row={row % 8}
            data-col={col % 10}
            style={{
              '--zone-color': zone?.color || '#666',
              '--tile-delay': tileDelay,
            }}
          />
        )
      })}
    </div>
  )
}

// Legacy ImmutableGrid for backwards compatibility
function ImmutableGrid({ zoneClass = '', zoneColor = null }) {
  return (
    <div
      className={`immutable-grid ${zoneClass}`}
      style={zoneColor ? { '--zone-color': zoneColor } : undefined}
    >
      {Array.from({ length: TOTAL_TILES }, (_, i) => {
        const row = Math.floor(i / GRID_COLS)
        const col = i % GRID_COLS
        return (
          <div
            key={i}
            className="iso-tile"
            data-row={row % 8}
            data-col={col % 10}
          />
        )
      })}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// ZONE WALLS — THE CRIBS! VIP PIT WALLS!
// "Waist-high walls that say: You're in the club now" — Miyamoto
// ═══════════════════════════════════════════════════════════════
function ZoneWalls({ color }) {
  return (
    <>
      {/* FRONT WALL — Closest to camera */}
      <div className="zone-wall front" style={{ '--wall-color': color }}>
        <div className="zone-wall-panel" />
      </div>
      {/* BACK WALL — Farthest from camera */}
      <div className="zone-wall back" style={{ '--wall-color': color }}>
        <div className="zone-wall-panel" />
      </div>
      {/* LEFT WALL */}
      <div className="zone-wall left" style={{ '--wall-color': color }}>
        <div className="zone-wall-panel" />
      </div>
      {/* RIGHT WALL */}
      <div className="zone-wall right" style={{ '--wall-color': color }}>
        <div className="zone-wall-panel" />
      </div>
    </>
  )
}

// ═══════════════════════════════════════════════════════════════
// VOXEL PLATFORM — Floating stage in the void!
// "Cyberpunk club floating in space" — Miyamoto
// ═══════════════════════════════════════════════════════════════
function VoxelPlatform() {
  return (
    <>
      {/* BOTTOM DEPTH — The thick base underneath */}
      <div className="platform-depth" />
      {/* RIGHT SIDE DEPTH */}
      <div className="platform-depth-right" />
      {/* GLOWING EDGE STRIPS */}
      <div className="platform-edge-glow bottom" />
      <div className="platform-edge-glow right" />
    </>
  )
}

// ═══════════════════════════════════════════════════════════════
// SKY PODIUMS — Floating billboards above each zone!
// "Like stadium scoreboards, but in the sky" — Miyamoto
// Works for BOTH binary (2 zones) and multi (3 zones)!
// ═══════════════════════════════════════════════════════════════
const RANK_MEDALS = ['🥇', '🥈', '🥉']
const RANK_LABELS = ['1ST', '2ND', '3RD']

function SkyPodium({ label, pct, color, rank = 0, zoneClass = '' }) {
  return (
    <div
      className={`sky-podium ${zoneClass} ${rank === 0 ? 'rank-1' : rank === 1 ? 'rank-2' : 'rank-3'}`}
      style={{ '--podium-color': color }}
    >
      {rank < 3 && (
        <div className="podium-rank">
          <span className="rank-medal">{RANK_MEDALS[rank]}</span>
          <span>{RANK_LABELS[rank]}</span>
        </div>
      )}
      <div className="podium-name">{label}</div>
      <div className="podium-pct">{pct}%</div>
    </div>
  )
}

function BinaryPodiums({ yesPct, noPct }) {
  // Determine rank based on percentage
  const yesWinning = yesPct >= noPct

  return (
    <div className="sky-podiums binary">
      <SkyPodium
        label="YES"
        pct={yesPct}
        color="#00F0FF"
        rank={yesWinning ? 0 : 1}
        zoneClass="yes"
      />
      <SkyPodium
        label="NO"
        pct={noPct}
        color="#FF0055"
        rank={yesWinning ? 1 : 0}
        zoneClass="no"
      />
    </div>
  )
}

function MultiPodiums({ options = [] }) {
  if (options.length < 3) return null

  // Sort by percentage to determine ranks
  const ranked = [...options]
    .map((opt, originalIndex) => ({ ...opt, originalIndex }))
    .sort((a, b) => b.pct - a.pct)

  return (
    <div className="sky-podiums multi">
      {ranked.map((opt, rankIndex) => {
        const zoneClass = `zone${opt.originalIndex + 1}`
        return (
          <SkyPodium
            key={opt.id}
            label={opt.label.split(' ')[0]}
            pct={opt.pct}
            color={opt.color}
            rank={rankIndex}
            zoneClass={zoneClass}
          />
        )
      })}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// ZONE COLORS — Strict definitions, NO BLEEDING!
// ═══════════════════════════════════════════════════════════════
const ZONE_COLORS = {
  yes: '#00F0FF',
  no: '#FF0055',
  zone1: '#00FF00',  // PURE GREEN (user spec)
  zone2: '#4DA6FF',  // BLUE
  zone3: '#BF00FF',  // PURPLE
}

// ═══════════════════════════════════════════════════════════════
// THE CLUB ROOM — Unified isometric dance floor
// ═══════════════════════════════════════════════════════════════
const ClubRoom = forwardRef(function ClubRoom({
  yesPct = 50,
  noPct = 50,
  isMulti = false,
  options = [],
  children,
  djBooth = null,
}, ref) {
  // Calculate ratios with minimum viable dancefloor (20%)
  const yesRatio = Math.max(0.2, yesPct / 100)
  const noRatio = Math.max(0.2, noPct / 100)

  // Multi ratios
  const multiRatios = isMulti
    ? options.map(opt => Math.max(0.15, opt.pct / 100))
    : []

  // ═══════════════════════════════════════════════════════════════
  // MULTI-ANSWER FLOOR — NOW WITH UNIFIED GRID (Three.js formula!)
  // ═══════════════════════════════════════════════════════════════
  if (isMulti && options.length >= 2) {
    const ranges = calculateColumnRanges(options, GRID_COLS)

    return (
      <div ref={ref} className="floor-wrapper">
        <div className="iso-floor unified">
          {/* ═══ UNIFIED GRID — ONE seamless floor! ═══ */}
          <div className="floor-grid-layer unified">
            <UnifiedGrid options={options} />
            {/* Single perimeter wall around entire floor */}
            <div className="perimeter-walls">
              <div className="perimeter-wall front" />
              <div className="perimeter-wall back" />
              <div className="perimeter-wall left" />
              <div className="perimeter-wall right" />
            </div>
          </div>

          {/* ═══ VOLUMETRIC LIGHT BEAMS — One per zone ═══ */}
          <div className="volumetric-lights">
            {ranges.map((range, idx) => {
              const centerPct = ((range.colStart + range.colEnd) / 2 / GRID_COLS) * 100
              return (
                <div
                  key={range.optionId}
                  className="light-beam"
                  style={{ left: `${centerPct}%`, '--beam-color': range.color }}
                />
              )
            })}
          </div>

          {/* ═══ ZONE HIT AREAS — Dynamic based on column ranges ═══ */}
          {ranges.map(range => {
            const leftPct = (range.colStart / GRID_COLS) * 100
            const widthPct = ((range.colEnd - range.colStart) / GRID_COLS) * 100
            return (
              <div
                key={range.optionId}
                className="floor-zone dynamic"
                data-zone={range.optionId}
                style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
              />
            )
          })}

          {/* ═══ CROWD AREA — Avatars dance here ═══ */}
          <div className="crowd-area">
            {children}
          </div>

          {/* ═══ DJ BOOTH ═══ */}
          {djBooth}

          {/* ═══ VOXEL PLATFORM — Floating stage depth ═══ */}
          <VoxelPlatform />

          {/* ═══ SKY PODIUMS — Float above with billboard rotation ═══ */}
          <MultiPodiums options={options} />
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════
  // BINARY FLOOR — YES/NO (The original that works!)
  // ═══════════════════════════════════════════════════════════════
  return (
    <div ref={ref} className="floor-wrapper">
      <div
        className="iso-floor binary"
        style={{
          '--yes-ratio': yesRatio,
          '--no-ratio': noRatio,
        }}
      >
        {/* ═══ FLOOR GRID LAYER — Jelly tiles with WALLS! ═══ */}
        <div className="floor-grid-layer">
          <div className="floor-grid-zone yes" style={{ flex: yesRatio, '--wall-color': ZONE_COLORS.yes }}>
            <ImmutableGrid zoneClass="yes" />
            <ZoneWalls color={ZONE_COLORS.yes} />
          </div>
          <div className="floor-grid-zone no" style={{ flex: noRatio, '--wall-color': ZONE_COLORS.no }}>
            <ImmutableGrid zoneClass="no" />
            <ZoneWalls color={ZONE_COLORS.no} />
          </div>
        </div>

        {/* ═══ VOLUMETRIC LIGHT BEAMS ═══ */}
        <div className="volumetric-lights">
          <div className="light-beam cyan" />
          <div className="light-beam cyan-2" />
          <div className="light-beam pink" />
          <div className="light-beam pink-2" />
        </div>

        {/* ═══ ZONE HIT AREAS ═══ */}
        <div className="floor-zone yes" data-zone="yes" />
        <div className="floor-zone no" data-zone="no" />

        {/* ═══ CROWD AREA — Avatars dance here ═══ */}
        <div className="crowd-area">
          {children}
        </div>

        {/* ═══ DJ BOOTH ═══ */}
        {djBooth}

        {/* ═══ VOXEL PLATFORM — Floating stage depth ═══ */}
        <VoxelPlatform />

        {/* ═══ SKY PODIUMS — Float above with billboard rotation ═══ */}
        <BinaryPodiums yesPct={yesPct} noPct={noPct} />
      </div>
    </div>
  )
})

export default ClubRoom
