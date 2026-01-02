/**
 * DanceFloor — CYBERPUNK JELLY GLASS TILES
 * "Wet neon candy that glows from within" — Art Director Mode
 *
 * ARCHITECTURE:
 * ═══════════════════════════════════════════════════════════════════
 * - JELLY TILES: MeshPhysicalMaterial with transmission (gummy glass!)
 * - CYBERPUNK PALETTE: Cyan, Hot Pink, Electric Purple, Acid Green
 * - BILLIE JEAN: Hover = white-hot emissive explosion
 * - HABBO BOUNCE: Juicy scale animation on hover
 */

import React, { useRef, useState, useMemo, useEffect, Suspense, useCallback } from 'react'
import { Canvas, useFrame, useThree, ThreeEvent } from '@react-three/fiber'
import { Text, RoundedBox, useTexture, Environment, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { DancerGroup, AVATARS, type Dancer } from './StickFigures'

// ═══════════════════════════════════════════════════════════════════════════
// MOBILE DETECTION HOOK — "Mobile-first, always!" — Steve Jobs
// ═══════════════════════════════════════════════════════════════════════════
function useIsMobile(breakpoint = 768): boolean {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < breakpoint : false
  )

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < breakpoint)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [breakpoint])

  return isMobile
}

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════
export interface Option {
  id: string
  label: string
  pct: number       // 0-100
  color: string     // Hex color
}

export interface DanceFloorProps {
  options: Option[]
  gridCols?: number       // Default: 24
  gridRows?: number       // Default: 12
  onTileClick?: (optionId: string, col: number, row: number) => void
  onZoneSelect?: (optionId: string) => void  // Called when user selects a prediction zone
  dancers?: Dancer[]      // Optional list of dancers
  dancersPerZone?: number // Auto-generate N dancers per zone if no dancers provided
  userPrediction?: {      // The user's prediction — places their avatar in this zone!
    zoneId: string        // Which zone they selected
    avatar: string        // Path to avatar image
  }
  marketQuestion?: string // 3D floating title in sky (Smash Bros style!)
  selectedZone?: string   // Zone to illuminate (from sidebar bet selection!)
  children?: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS — "APPLE CHICLET" GRID SPEC
// ═══════════════════════════════════════════════════════════════════════════
const FLOOR = {
  tileSize: 0.96,      // Tight grid — visible but minimal gaps
  tileHeight: 0.16,    // Slightly thicker for keycap profile
  gridUnit: 1.0,       // Grid step
  wallHeight: 0.5,
  wallThickness: 0.12,
} as const

// ═══════════════════════════════════════════════════════════════════════════
// RESPONSIVE GRID — Desktop (Wide) vs Mobile (Runway)!
// "The stage shape-shifts to fit your device" — Mobile UX Architect
// ═══════════════════════════════════════════════════════════════════════════
const DESKTOP_GRID = {
  cols: 24,
  rows: 12,
  camera: {
    position: [0, 14, 16] as [number, number, number],
    fov: 48,
  },
} as const

const MOBILE_GRID = {
  cols: 10,
  rows: 24,
  camera: {
    position: [0, 18, 12] as [number, number, number],  // Higher, closer for vertical view
    fov: 55,
  },
} as const

// Legacy constant for backwards compatibility
const CAMERA = DESKTOP_GRID.camera

// ═══════════════════════════════════════════════════════════════════════════
// CYBERPUNK FESTIVAL PALETTE — High-Voltage Neon!
// "Not basic Red/Blue — we want TRON meets CYBERPUNK" — Art Director
// ═══════════════════════════════════════════════════════════════════════════
const CYBERPUNK_COLORS = [
  '#00F0FF',  // CYAN — "The Tron Look"
  '#FF0055',  // HOT PINK — "The Cyberpunk Look"
  '#BD00FF',  // ELECTRIC PURPLE — Multi-option 3
  '#39FF14',  // ACID GREEN — Multi-option 4
  '#FFD700',  // GOLD — Extra
  '#FF6600',  // ORANGE — Extra
  '#00CED1',  // TEAL — Extra
  '#FF1493',  // DEEP PINK — Extra
]

// Default color palette (now uses cyberpunk!)
const DEFAULT_COLORS = CYBERPUNK_COLORS

// ═══════════════════════════════════════════════════════════════════════════
// GRID PARTITIONING
// ═══════════════════════════════════════════════════════════════════════════

interface ColumnRange {
  optionId: string
  color: string
  label: string
  pct: number
  colStart: number
  colEnd: number
}

function calculateColumnRanges(options: Option[], totalCols: number): ColumnRange[] {
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
  const ranges: ColumnRange[] = normalized.map((opt, idx) => {
    const isLast = idx === options.length - 1
    const proportional = Math.round((opt.pct / 100) * availableCols)
    const cols = minColsPerOption + proportional
    const colEnd = isLast ? totalCols : currentCol + cols

    const range: ColumnRange = {
      optionId: opt.id,
      color: opt.color || DEFAULT_COLORS[idx % DEFAULT_COLORS.length],
      label: opt.label,
      pct: opt.pct,
      colStart: currentCol,
      colEnd: colEnd,
    }

    currentCol = colEnd
    return range
  })

  return ranges
}

function getOptionForColumn(col: number, ranges: ColumnRange[]): ColumnRange | null {
  for (const range of ranges) {
    if (col >= range.colStart && col < range.colEnd) {
      return range
    }
  }
  return ranges[ranges.length - 1] || null
}

// ═══════════════════════════════════════════════════════════════════════════
// MOBILE ROW RANGES — Vertical split for "Runway" layout!
// ═══════════════════════════════════════════════════════════════════════════
interface RowRange {
  optionId: string
  color: string
  label: string
  pct: number
  rowStart: number
  rowEnd: number
}

function calculateRowRanges(options: Option[], totalRows: number): RowRange[] {
  if (options.length === 0) return []

  const totalPct = options.reduce((sum, o) => sum + o.pct, 0)
  const normalized = options.map(o => ({
    ...o,
    pct: totalPct > 0 ? (o.pct / totalPct) * 100 : 100 / options.length,
  }))

  const minRowsPerOption = 2
  const reservedRows = options.length * minRowsPerOption
  const availableRows = Math.max(0, totalRows - reservedRows)

  let currentRow = 0
  const ranges: RowRange[] = normalized.map((opt, idx) => {
    const isLast = idx === options.length - 1
    const proportional = Math.round((opt.pct / 100) * availableRows)
    const rows = minRowsPerOption + proportional
    const rowEnd = isLast ? totalRows : currentRow + rows

    const range: RowRange = {
      optionId: opt.id,
      color: opt.color || DEFAULT_COLORS[idx % DEFAULT_COLORS.length],
      label: opt.label,
      pct: opt.pct,
      rowStart: currentRow,
      rowEnd: rowEnd,
    }

    currentRow = rowEnd
    return range
  })

  return ranges
}

function getOptionForRow(row: number, ranges: RowRange[]): RowRange | null {
  for (const range of ranges) {
    if (row >= range.rowStart && row < range.rowEnd) {
      return range
    }
  }
  return ranges[ranges.length - 1] || null
}

// ═══════════════════════════════════════════════════════════════════════════
// CANDY HIGHLIGHT — Static glossy shine (NO per-tile animation = FAST!)
// "That Apple app icon gleam" — Performance First
// ═══════════════════════════════════════════════════════════════════════════
interface CandyHighlightProps {
  tileWidth: number
  tileHeight: number
  tileDepth: number
  isHighlighted: boolean
}

function CandyHighlight({ tileWidth, tileHeight, tileDepth, isHighlighted }: CandyHighlightProps) {
  // Keycap divot dimensions — inset from edges
  const divotInset = 0.12  // How far in from edges
  const divotWidth = tileWidth * (1 - divotInset * 2)
  const divotDepth = tileDepth * (1 - divotInset * 2)

  return (
    <group position={[0, tileHeight * 0.51, 0]}>
      {/* ═══ KEYCAP DIVOT — Subtle concave dish effect ═══ */}
      {/* Dark center creates the illusion of depth */}
      <mesh
        position={[0, 0.005, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[divotWidth * 0.7, divotDepth * 0.7]} />
        <meshBasicMaterial
          color="#000000"
          transparent
          opacity={0.12}
          depthWrite={false}
        />
      </mesh>

      {/* Top edge highlight — light catching the rim */}
      <mesh
        position={[0, 0.008, -tileDepth * 0.35]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[divotWidth * 0.8, tileDepth * 0.06]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={isHighlighted ? 0.7 : 0.4}
          depthWrite={false}
        />
      </mesh>

      {/* Main shine streak — top-left corner like app icons */}
      <mesh
        position={[tileWidth * -0.22, 0.012, tileDepth * -0.22]}
        rotation={[-Math.PI / 2, 0, Math.PI / 4]}
      >
        <planeGeometry args={[tileWidth * 0.25, tileWidth * 0.06]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={isHighlighted ? 0.85 : 0.55}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Small sparkle dot */}
      <mesh position={[tileWidth * 0.12, 0.012, tileDepth * -0.22]}>
        <circleGeometry args={[tileWidth * 0.03, 8]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={isHighlighted ? 0.7 : 0.35}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// JELLY GLASS TILE — The expensive wet gummy look!
// "Glassy, translucent candy that begs to be eaten" — Material Wizard
// ═══════════════════════════════════════════════════════════════════════════
interface JellyTileProps {
  position: [number, number, number]
  color: string
  col: number
  row: number
  optionId: string
  onTileClick?: (optionId: string, col: number, row: number) => void
  isMobile: boolean
  lightShowActive?: boolean  // Arcade light show highlight!
  zoneSelected?: boolean     // This tile's zone is selected in sidebar!
}

function JellyTile({ position, color, col, row, optionId, onTileClick, isMobile, lightShowActive = false, zoneSelected = false }: JellyTileProps) {
  const meshRef = useRef<THREE.Mesh>(null!)
  const [hovered, setHovered] = useState(false)
  const [tapHighlight, setTapHighlight] = useState(false)  // MOBILE TAP FEEDBACK!
  const tapTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // ═══ JELLY KEYCAP GEOMETRY — All 4 corners rounded like Cherry MX caps! ═══
  const tileWidth = FLOOR.tileSize      // 0.96 — tight grid
  const tileHeight = FLOOR.tileHeight   // 0.16 — keycap thickness
  const tileDepth = FLOOR.tileSize      // 0.96 — square
  // CRITICAL: cornerRadius must be <= tileHeight/2 for proper 3D rounding!
  const cornerRadius = 0.07             // Rounded on ALL edges like a keycap

  // Combined highlight state (hover OR tap OR light show)
  const isHighlighted = hovered || tapHighlight
  const isLit = lightShowActive  // Separate state for subtler light show effect
  const isZoneSelected = zoneSelected  // Zone selected in sidebar — EPIC GLOW!

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (tapTimeoutRef.current) clearTimeout(tapTimeoutRef.current)
    }
  }, [])

  // HABBO BOUNCE — Scale animation on hover OR tap!
  useFrame(({ clock }) => {
    if (!meshRef.current) return

    if (isHighlighted) {
      // Juicy bounce — scale up with sine wave wobble
      const bounce = Math.sin(clock.elapsedTime * 8) * 0.02
      meshRef.current.scale.setScalar(1.08 + bounce)
      meshRef.current.position.y = position[1] + 0.08 + bounce * 0.5
    } else {
      // Settle back down smoothly
      meshRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.15)
      meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, position[1], 0.15)
    }
  })

  // SMART TAP HANDLER — Trigger highlight + callback!
  const handleTap = useCallback((e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()

    // Trigger tap highlight for feedback
    setTapHighlight(true)

    // Clear any existing timeout
    if (tapTimeoutRef.current) clearTimeout(tapTimeoutRef.current)

    // Auto-clear highlight after 300ms
    tapTimeoutRef.current = setTimeout(() => {
      setTapHighlight(false)
    }, 300)

    // Trigger the actual click callback
    onTileClick?.(optionId, col, row)
  }, [onTileClick, optionId, col, row])

  // JELLY COLORS — Checkerboard tint variation
  const { tileColor, emissiveColor } = useMemo(() => {
    const isLight = (col + row) % 2 === 0
    const c = new THREE.Color(color)
    const hsl = { h: 0, s: 0, l: 0 }
    c.getHSL(hsl)

    // Checkerboard: Slight luminance variation
    const main = new THREE.Color()
    main.setHSL(
      hsl.h,
      Math.min(1, hsl.s * 1.1),
      isLight ? 0.55 : 0.45
    )

    // Emissive — inner glow color
    const emissive = new THREE.Color()
    emissive.setHSL(hsl.h, Math.min(1, hsl.s * 1.2), 0.5)

    return { tileColor: main, emissiveColor: emissive }
  }, [color, col, row])

  return (
    <group position={position}>
      {/* ═══ THE JELLY CUBE — Wet glass candy! ═══ */}
      <mesh
        ref={meshRef}
        castShadow={!isMobile}
        receiveShadow
        onClick={handleTap}  // SMART TAP: R3F auto-ignores drags > 10px!
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer' }}
        onPointerOut={() => { setHovered(false); document.body.style.cursor = 'auto' }}
      >
        <RoundedBox
          args={[tileWidth, tileHeight, tileDepth]}
          radius={cornerRadius}
          smoothness={4}
        >
          {/* ═══ CANDY GLOSS MATERIAL — Fast + beautiful! ═══ */}
          <meshPhysicalMaterial
            color={tileColor}
            roughness={0.08}                // Glossy but not mirror
            clearcoat={1.0}                 // THE CANDY SHELL!
            clearcoatRoughness={0.1}
            emissive={emissiveColor}
            // Priority: Hover/tap (2.5) > Zone selected (1.5) > Light show (0.9) > Default (0.35)
            emissiveIntensity={isHighlighted ? 2.5 : isZoneSelected ? 1.5 : isLit ? 0.9 : 0.35}
            envMapIntensity={1.2}
            metalness={0}
            toneMapped={false}
          />
        </RoundedBox>
      </mesh>

      {/* ═══ CANDY GLOSS HIGHLIGHT — Static shine like app icons ═══ */}
      <CandyHighlight
        tileWidth={tileWidth}
        tileHeight={tileHeight}
        tileDepth={tileDepth}
        isHighlighted={isHighlighted}
      />
    </group>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// ARCADE LIGHT SHOW — Professional dance floor lighting sequences!
// Inspired by: DDR stages, Tron Legacy, Saturday Night Fever, Habbo disco
// "The floor should feel ALIVE" — Legendary Club Lighting Designer
// ═══════════════════════════════════════════════════════════════════════════

type LightPattern = 'wave' | 'ripple' | 'chase' | 'pulse' | 'sparkle' | 'diagonal' | 'breathe'

interface LightShowState {
  litTiles: Set<string>  // "col-row" keys
  pattern: LightPattern
  phase: number
}

function useLightShow(gridCols: number, gridRows: number, enabled: boolean = true): Set<string> {
  const [litTiles, setLitTiles] = useState<Set<string>>(new Set())
  const patternRef = useRef<LightPattern>('wave')
  const phaseRef = useRef(0)
  const patternTimeRef = useRef(0)
  const lastUpdateRef = useRef(0)

  // Pattern durations (how long before switching)
  const PATTERN_DURATION = 8000  // 8 seconds per pattern
  const UPDATE_INTERVAL = 80     // ~12fps for smooth but not crazy updates

  useFrame(({ clock }) => {
    if (!enabled) return

    const now = clock.elapsedTime * 1000
    const deltaTime = now - lastUpdateRef.current

    if (deltaTime < UPDATE_INTERVAL) return
    lastUpdateRef.current = now

    // Advance phase
    phaseRef.current += 1

    // Switch patterns periodically
    patternTimeRef.current += deltaTime
    if (patternTimeRef.current > PATTERN_DURATION) {
      patternTimeRef.current = 0
      const patterns: LightPattern[] = ['wave', 'ripple', 'diagonal', 'breathe', 'chase', 'sparkle']
      const currentIdx = patterns.indexOf(patternRef.current)
      patternRef.current = patterns[(currentIdx + 1) % patterns.length]
      phaseRef.current = 0
    }

    const newLit = new Set<string>()
    const phase = phaseRef.current
    const pattern = patternRef.current

    // ═══ PATTERN IMPLEMENTATIONS ═══

    if (pattern === 'wave') {
      // Horizontal wave sweeping across the floor
      const waveWidth = 3
      const wavePos = (phase * 0.5) % (gridCols + waveWidth * 2) - waveWidth
      for (let row = 0; row < gridRows; row++) {
        for (let col = 0; col < gridCols; col++) {
          const dist = Math.abs(col - wavePos)
          if (dist < waveWidth) {
            newLit.add(`${col}-${row}`)
          }
        }
      }
    }

    else if (pattern === 'diagonal') {
      // Diagonal wave (Saturday Night Fever style)
      const waveWidth = 4
      const wavePos = (phase * 0.4) % (gridCols + gridRows + waveWidth * 2) - waveWidth
      for (let row = 0; row < gridRows; row++) {
        for (let col = 0; col < gridCols; col++) {
          const diagPos = col + row
          const dist = Math.abs(diagPos - wavePos)
          if (dist < waveWidth) {
            newLit.add(`${col}-${row}`)
          }
        }
      }
    }

    else if (pattern === 'ripple') {
      // Circular ripple from center
      const centerX = gridCols / 2
      const centerY = gridRows / 2
      const rippleRadius = (phase * 0.3) % (Math.max(gridCols, gridRows) * 0.8)
      const rippleWidth = 2

      for (let row = 0; row < gridRows; row++) {
        for (let col = 0; col < gridCols; col++) {
          const dist = Math.sqrt((col - centerX) ** 2 + (row - centerY) ** 2)
          if (Math.abs(dist - rippleRadius) < rippleWidth) {
            newLit.add(`${col}-${row}`)
          }
        }
      }
    }

    else if (pattern === 'chase') {
      // Light chasing around the perimeter
      const perimeter = 2 * (gridCols + gridRows - 2)
      const chaseLength = 8
      const chasePos = (phase * 0.8) % perimeter

      for (let i = 0; i < chaseLength; i++) {
        let pos = (chasePos + i) % perimeter
        let col: number, row: number

        if (pos < gridCols) {
          col = pos; row = 0
        } else if (pos < gridCols + gridRows - 1) {
          col = gridCols - 1; row = pos - gridCols + 1
        } else if (pos < 2 * gridCols + gridRows - 2) {
          col = gridCols - 1 - (pos - gridCols - gridRows + 2); row = gridRows - 1
        } else {
          col = 0; row = gridRows - 1 - (pos - 2 * gridCols - gridRows + 3)
        }

        if (col >= 0 && col < gridCols && row >= 0 && row < gridRows) {
          newLit.add(`${col}-${row}`)
        }
      }
    }

    else if (pattern === 'breathe') {
      // Pulsing glow from center outward (zone-aware)
      const intensity = (Math.sin(phase * 0.15) + 1) / 2  // 0 to 1
      const maxRadius = Math.max(gridCols, gridRows) * 0.6 * intensity
      const centerX = gridCols / 2
      const centerY = gridRows / 2

      for (let row = 0; row < gridRows; row++) {
        for (let col = 0; col < gridCols; col++) {
          const dist = Math.sqrt((col - centerX) ** 2 + (row - centerY) ** 2)
          if (dist < maxRadius) {
            newLit.add(`${col}-${row}`)
          }
        }
      }
    }

    else if (pattern === 'sparkle') {
      // Random sparkles (like stars twinkling)
      const numSparkles = Math.floor(gridCols * gridRows * 0.08)  // 8% of tiles
      for (let i = 0; i < numSparkles; i++) {
        // Use deterministic "randomness" based on phase for consistency
        const seed = (phase * 7 + i * 13) % 1000
        const col = Math.floor((Math.sin(seed) * 0.5 + 0.5) * gridCols)
        const row = Math.floor((Math.cos(seed * 1.3) * 0.5 + 0.5) * gridRows)
        if (col >= 0 && col < gridCols && row >= 0 && row < gridRows) {
          newLit.add(`${col}-${row}`)
        }
      }
    }

    setLitTiles(newLit)
  })

  return litTiles
}

// ═══════════════════════════════════════════════════════════════════════════
// INSTANCED TILE FLOOR — Grid of Jelly Tiles!
// ═══════════════════════════════════════════════════════════════════════════
interface InstancedFloorProps {
  tiles: { pos: [number, number, number]; color: string; col: number; row: number; optionId: string }[]
  gridCols: number
  gridRows: number
  isMobile: boolean
  onTileClick?: (optionId: string, col: number, row: number) => void
  selectedZone?: string  // Zone selected in sidebar — ILLUMINATE!
}

function InstancedTileFloor({ tiles, gridCols, gridRows, isMobile, onTileClick, selectedZone }: InstancedFloorProps) {
  // ARCADE LIGHT SHOW!
  const litTiles = useLightShow(gridCols, gridRows, true)

  return (
    <group>
      {tiles.map((tile, i) => (
        <JellyTile
          key={i}
          position={tile.pos}
          color={tile.color}
          col={tile.col}
          row={tile.row}
          optionId={tile.optionId}
          onTileClick={onTileClick}
          isMobile={isMobile}
          lightShowActive={litTiles.has(`${tile.col}-${tile.row}`)}
          zoneSelected={tile.optionId === selectedZone}
        />
      ))}
    </group>
  )
}

// Legacy single tile for special cases (user avatar highlight, etc.)
interface TileProps {
  position: [number, number, number]
  color: string
  col: number
  row: number
  onClick?: () => void
}

function CandyTile({ position, color, col, row, onClick }: TileProps) {
  const size = FLOOR.tileSize
  const height = 0.14

  // Checkerboard
  const tileColor = useMemo(() => {
    const isLight = (col + row) % 2 === 0
    const c = new THREE.Color(color)
    return isLight ? c : c.multiplyScalar(0.7)
  }, [color, col, row])

  return (
    <group position={position} onClick={(e) => { e.stopPropagation(); onClick?.() }}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[size * 0.95, height, size * 0.95]} />
        <meshStandardMaterial color={tileColor} roughness={0.2} metalness={0.1} />
      </mesh>
      {/* Glow */}
      <mesh position={[0, height / 2 + 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[size * 0.3, 12]} />
        <meshBasicMaterial color={color} transparent opacity={0.5} depthWrite={false} />
      </mesh>
    </group>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// FLOATING ISLAND — "FINAL DESTINATION" MONOLITHIC BASE!
// "A fortress of ancient power, suspended in the void" — Sakurai x Miyamoto
// NOW WITH AAA TREATMENT: Deep base, rugged broken earth, energy cracks!
// ═══════════════════════════════════════════════════════════════════════════
interface FloatingIslandProps {
  width: number
  depth: number
  colors: string[]
}

function FloatingIsland({ width, depth, colors }: FloatingIslandProps) {
  const groupRef = useRef<THREE.Group>(null!)
  const crackRef = useRef<THREE.Group>(null!)
  const pulseRef = useRef<THREE.Group>(null!)

  const halfW = width / 2
  const halfD = depth / 2
  const baseDepth = 10  // MEGA DEEP! Final Destination scale!

  const glowColor = colors[0] || '#00f0ff'
  const secondaryColor = colors[1] || '#ff0055'
  const tertiaryColor = colors[2] || '#bd00ff'
  const mixedColor = useMemo(() => {
    const c1 = new THREE.Color(glowColor)
    const c2 = new THREE.Color(secondaryColor)
    return c1.lerp(c2, 0.5)
  }, [glowColor, secondaryColor])

  // Animate emissive cracks + pulsing energy
  useFrame(({ clock }) => {
    const time = clock.elapsedTime
    if (crackRef.current) {
      crackRef.current.children.forEach((child, i) => {
        if (child instanceof THREE.Mesh) {
          const mat = child.material as THREE.MeshBasicMaterial
          mat.opacity = 0.4 + Math.sin(time * 2.5 + i * 0.5) * 0.35
        }
      })
    }
    if (pulseRef.current) {
      pulseRef.current.children.forEach((child, i) => {
        if (child instanceof THREE.Mesh) {
          const mat = child.material as THREE.MeshBasicMaterial
          mat.opacity = 0.1 + Math.sin(time * 1.5 + i * 0.8) * 0.08
        }
      })
    }
  })

  // Generate MASSIVE rugged edge chunks — broken earth aesthetic!
  const edgeChunks = useMemo(() => {
    const chunks: { pos: [number, number, number]; scale: [number, number, number]; rot: number; type: 'dodeca' | 'icosa' | 'box' }[] = []
    const numChunks = 80  // DOUBLED for more density!

    for (let i = 0; i < numChunks; i++) {
      const angle = (i / numChunks) * Math.PI * 2
      const radiusVar = 0.85 + Math.random() * 0.35
      const radius = Math.max(halfW, halfD) * 1.08 * radiusVar
      const x = Math.cos(angle) * radius
      const z = Math.sin(angle) * radius
      // Stagger depth for organic broken look
      const y = -baseDepth * 0.2 - Math.random() * baseDepth * 0.7
      const scale: [number, number, number] = [
        0.6 + Math.random() * 2.0,
        1.0 + Math.random() * 4.5,  // Taller crystals!
        0.6 + Math.random() * 2.0
      ]
      // Mix geometry types for variety
      const type = i % 5 === 0 ? 'icosa' : i % 3 === 0 ? 'box' : 'dodeca'
      chunks.push({ pos: [x, y, z], scale, rot: Math.random() * Math.PI, type })
    }
    return chunks
  }, [halfW, halfD, baseDepth])

  // Secondary layer of smaller debris chunks
  const debrisChunks = useMemo(() => {
    const debris: { pos: [number, number, number]; size: number; rot: number }[] = []
    const numDebris = 50

    for (let i = 0; i < numDebris; i++) {
      const angle = Math.random() * Math.PI * 2
      const radius = Math.max(halfW, halfD) * (1.15 + Math.random() * 0.4)
      debris.push({
        pos: [
          Math.cos(angle) * radius,
          -baseDepth * 0.5 - Math.random() * baseDepth * 0.5,
          Math.sin(angle) * radius
        ],
        size: 0.2 + Math.random() * 0.5,
        rot: Math.random() * Math.PI * 2
      })
    }
    return debris
  }, [halfW, halfD, baseDepth])

  return (
    <group ref={groupRef}>
      {/* ═══ THE MONOLITHIC BASE — Dark ancient crystalline foundation ═══ */}
      <mesh position={[0, -baseDepth / 2 - 0.1, 0]} receiveShadow castShadow>
        <boxGeometry args={[width + 1.2, baseDepth, depth + 1.2]} />
        <meshStandardMaterial
          color="#06040a"
          roughness={0.92}
          metalness={0.15}
          emissive="#0a0515"
          emissiveIntensity={0.15}
        />
      </mesh>

      {/* ═══ LAYERED TIERS — Stepped pyramid effect like ancient temple ═══ */}
      <mesh position={[0, -baseDepth * 0.2, 0]} receiveShadow>
        <boxGeometry args={[width + 2.0, baseDepth * 0.15, depth + 2.0]} />
        <meshStandardMaterial color="#08060c" roughness={0.88} metalness={0.2} />
      </mesh>
      <mesh position={[0, -baseDepth * 0.35, 0]} receiveShadow>
        <boxGeometry args={[width + 2.8, baseDepth * 0.12, depth + 2.8]} />
        <meshStandardMaterial color="#0a0810" roughness={0.85} metalness={0.18} />
      </mesh>

      {/* ═══ INNER CORE GLOW — Pulsing energy within the rock ═══ */}
      <group ref={pulseRef}>
        <mesh position={[0, -baseDepth * 0.35, 0]}>
          <boxGeometry args={[width * 0.8, baseDepth * 0.5, depth * 0.8]} />
          <meshBasicMaterial color={mixedColor} transparent opacity={0.12} />
        </mesh>
        <mesh position={[0, -baseDepth * 0.5, 0]}>
          <boxGeometry args={[width * 0.5, baseDepth * 0.3, depth * 0.5]} />
          <meshBasicMaterial color={glowColor} transparent opacity={0.18} />
        </mesh>
        {/* Core energy sphere */}
        <mesh position={[0, -baseDepth * 0.4, 0]}>
          <sphereGeometry args={[Math.min(width, depth) * 0.25, 24, 24]} />
          <meshBasicMaterial color={tertiaryColor} transparent opacity={0.1} />
        </mesh>
      </group>

      {/* ═══ RUGGED BROKEN EARTH EDGES — Crystalline chunks! ═══ */}
      {edgeChunks.map((chunk, i) => (
        <mesh key={i} position={chunk.pos} rotation={[Math.random() * 0.6 - 0.3, chunk.rot, Math.random() * 0.6 - 0.3]}>
          {chunk.type === 'dodeca' && <dodecahedronGeometry args={[chunk.scale[1] * 0.35, 0]} />}
          {chunk.type === 'icosa' && <icosahedronGeometry args={[chunk.scale[1] * 0.4, 0]} />}
          {chunk.type === 'box' && <boxGeometry args={[chunk.scale[0] * 0.4, chunk.scale[1] * 0.6, chunk.scale[2] * 0.4]} />}
          <meshStandardMaterial
            color={i % 4 === 0 ? "#0c0618" : "#08040e"}
            roughness={0.92}
            metalness={0.12}
            emissive={i % 4 === 0 ? glowColor : i % 3 === 0 ? secondaryColor : tertiaryColor}
            emissiveIntensity={i % 6 === 0 ? 0.4 : 0.08}
          />
        </mesh>
      ))}

      {/* ═══ SMALLER DEBRIS — Floating rock fragments ═══ */}
      {debrisChunks.map((debris, i) => (
        <mesh key={`debris-${i}`} position={debris.pos} rotation={[debris.rot, debris.rot * 0.5, 0]}>
          <octahedronGeometry args={[debris.size, 0]} />
          <meshStandardMaterial
            color="#0a0612"
            roughness={0.9}
            metalness={0.1}
            emissive={i % 3 === 0 ? glowColor : secondaryColor}
            emissiveIntensity={0.15}
          />
        </mesh>
      ))}

      {/* ═══ EMISSIVE ENERGY CRACKS — Glowing fissures throughout! ═══ */}
      <group ref={crackRef}>
        {/* Vertical cracks on edges */}
        {[...Array(20)].map((_, i) => {
          const angle = (i / 20) * Math.PI * 2
          const r = Math.max(halfW, halfD) * 0.98
          return (
            <mesh key={i} position={[Math.cos(angle) * r, -baseDepth * 0.35, Math.sin(angle) * r]}>
              <boxGeometry args={[0.12, baseDepth * 0.9, 0.06]} />
              <meshBasicMaterial color={i % 3 === 0 ? glowColor : i % 2 === 0 ? secondaryColor : tertiaryColor} transparent opacity={0.7} />
            </mesh>
          )
        })}
        {/* Horizontal energy veins on the underside */}
        {[...Array(8)].map((_, i) => {
          const offset = (i - 3.5) * (width * 0.12)
          return (
            <mesh key={`h-${i}`} position={[offset, -baseDepth + 0.5, 0]}>
              <boxGeometry args={[0.08, 0.08, depth * 0.9]} />
              <meshBasicMaterial color={i % 2 === 0 ? glowColor : secondaryColor} transparent opacity={0.5} />
            </mesh>
          )
        })}
        {/* Cross veins */}
        {[...Array(6)].map((_, i) => {
          const offset = (i - 2.5) * (depth * 0.15)
          return (
            <mesh key={`v-${i}`} position={[0, -baseDepth + 0.5, offset]}>
              <boxGeometry args={[width * 0.85, 0.08, 0.08]} />
              <meshBasicMaterial color={tertiaryColor} transparent opacity={0.4} />
            </mesh>
          )
        })}
      </group>

      {/* ═══ EDGE RIM LIGHT — Thick neon border on top ═══ */}
      <mesh position={[0, 0.15, halfD + 0.45]}>
        <boxGeometry args={[width + 1.5, 0.1, 0.2]} />
        <meshBasicMaterial color={glowColor} />
      </mesh>
      <mesh position={[0, 0.15, -halfD - 0.45]}>
        <boxGeometry args={[width + 1.5, 0.1, 0.2]} />
        <meshBasicMaterial color={secondaryColor} />
      </mesh>
      <mesh position={[-halfW - 0.45, 0.15, 0]}>
        <boxGeometry args={[0.2, 0.1, depth + 1.0]} />
        <meshBasicMaterial color={glowColor} />
      </mesh>
      <mesh position={[halfW + 0.45, 0.15, 0]}>
        <boxGeometry args={[0.2, 0.1, depth + 1.0]} />
        <meshBasicMaterial color={secondaryColor} />
      </mesh>

      {/* ═══ CORNER CRYSTALS — Massive energy nodes! ═══ */}
      {[[-1, -1], [-1, 1], [1, -1], [1, 1]].map(([x, z], i) => (
        <group key={i} position={[x * (halfW + 0.6), 0.4, z * (halfD + 0.6)]}>
          {/* Main crystal */}
          <mesh rotation={[0, Math.PI / 4, 0]}>
            <octahedronGeometry args={[0.45, 0]} />
            <meshStandardMaterial
              color={i % 2 === 0 ? glowColor : secondaryColor}
              emissive={i % 2 === 0 ? glowColor : secondaryColor}
              emissiveIntensity={0.8}
              transparent
              opacity={0.9}
            />
          </mesh>
          {/* Inner glow core */}
          <mesh>
            <sphereGeometry args={[0.25, 16, 16]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.6} />
          </mesh>
          {/* Outer glow aura */}
          <mesh>
            <sphereGeometry args={[0.7, 16, 16]} />
            <meshBasicMaterial color={i % 2 === 0 ? glowColor : secondaryColor} transparent opacity={0.12} />
          </mesh>
          {/* Crystal spike cluster */}
          <mesh position={[0.15, 0.3, 0.15]} rotation={[0.3, 0, 0.3]}>
            <octahedronGeometry args={[0.18, 0]} />
            <meshBasicMaterial color={tertiaryColor} transparent opacity={0.8} />
          </mesh>
          <mesh position={[-0.12, 0.25, -0.1]} rotation={[-0.2, 0.5, -0.2]}>
            <octahedronGeometry args={[0.15, 0]} />
            <meshBasicMaterial color={glowColor} transparent opacity={0.7} />
          </mesh>
        </group>
      ))}

      {/* ═══ UNDERSIDE ENERGY CONDUITS — Glowing pipes beneath ═══ */}
      {[...Array(4)].map((_, i) => {
        const angle = (i / 4) * Math.PI * 2 + Math.PI / 4
        const r = Math.max(halfW, halfD) * 0.5
        return (
          <group key={`conduit-${i}`}>
            <mesh position={[Math.cos(angle) * r, -baseDepth + 0.3, Math.sin(angle) * r]}>
              <cylinderGeometry args={[0.15, 0.15, baseDepth * 0.8, 8]} />
              <meshBasicMaterial color={i % 2 === 0 ? glowColor : secondaryColor} transparent opacity={0.4} />
            </mesh>
          </group>
        )
      })}

      {/* ═══ CENTER UNDERSIDE PORTAL — Mysterious energy source ═══ */}
      <mesh position={[0, -baseDepth + 0.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.5, 2.5, 32]} />
        <meshBasicMaterial color={tertiaryColor} transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, -baseDepth + 0.15, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.5, 32]} />
        <meshBasicMaterial color={mixedColor} transparent opacity={0.2} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// VOLUMETRIC CLUB LIGHTS — Sweeping god rays like Daft Punk tour!
// "The void awakens with celestial searchlights" — Lighting Director
// ═══════════════════════════════════════════════════════════════════════════
interface VolumetricLightProps {
  position: [number, number, number]
  color: string
  rotationOffset: number
  sweepSpeed: number
  intensity: number
}

function VolumetricSpotlight({ position, color, rotationOffset, sweepSpeed, intensity }: VolumetricLightProps) {
  const coneRef = useRef<THREE.Mesh>(null!)
  const groupRef = useRef<THREE.Group>(null!)
  const spotRef = useRef<THREE.SpotLight>(null!)

  const coneHeight = 18
  const coneRadius = 5

  useFrame(({ clock }) => {
    if (!groupRef.current) return

    // Sweeping animation — slow, majestic panning
    const time = clock.elapsedTime * sweepSpeed
    const sweepX = Math.sin(time + rotationOffset) * 0.4
    const sweepZ = Math.cos(time * 0.7 + rotationOffset) * 0.3

    groupRef.current.rotation.x = sweepZ
    groupRef.current.rotation.z = sweepX

    // Pulse the cone opacity for that "living light" effect
    if (coneRef.current) {
      const mat = coneRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = 0.08 + Math.sin(time * 2 + rotationOffset) * 0.03
    }
  })

  return (
    <group position={position}>
      <group ref={groupRef}>
        {/* ACTUAL SPOTLIGHT — Illuminates the floor! */}
        <spotLight
          ref={spotRef}
          color={color}
          intensity={intensity * 50}
          distance={25}
          angle={0.5}
          penumbra={0.8}
          position={[0, 0, 0]}
          target-position={[0, -coneHeight, 0]}
          castShadow
        />

        {/* VOLUMETRIC CONE — The visible "god ray" beam! Wide end at top (light source) */}
        <mesh ref={coneRef} position={[0, -coneHeight / 2, 0]}>
          <coneGeometry args={[coneRadius, coneHeight, 32, 1, true]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.1}
            side={THREE.DoubleSide}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        {/* Inner bright core */}
        <mesh position={[0, -coneHeight / 2, 0]}>
          <coneGeometry args={[coneRadius * 0.3, coneHeight, 16, 1, true]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.15}
            side={THREE.DoubleSide}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        {/* Light source glow at top */}
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[0.4, 16, 16]} />
          <meshBasicMaterial color={color} />
        </mesh>
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[0.8, 16, 16]} />
          <meshBasicMaterial color={color} transparent opacity={0.3} />
        </mesh>
      </group>
    </group>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// CLUB LIGHT RIG — 6 sweeping spotlights around the stage!
// ═══════════════════════════════════════════════════════════════════════════
interface ClubLightRigProps {
  width: number
  depth: number
  colors: string[]
  isMobile?: boolean
}

function ClubLightRig({ width, depth, colors, isMobile = false }: ClubLightRigProps) {
  const halfW = width / 2
  const halfD = depth / 2
  const lightHeight = 16

  // Brand colors — Cyan, Magenta, Gold + Zone colors
  // Mobile: Fewer colors = fewer lights
  const lightColors = isMobile ? [
    '#00F0FF',  // Cyan
    '#FF00FF',  // Magenta
    colors[0] || '#00FF88',  // Zone 1
  ] : [
    '#00F0FF',  // Cyan
    '#FF00FF',  // Magenta
    '#FFD700',  // Gold
    colors[0] || '#00FF88',  // Zone 1
    colors[1] || '#4DA6FF',  // Zone 2
    colors[2] || '#BF00FF',  // Zone 3
  ]

  // Light positions — corners + mid-sides (fewer on mobile)
  const lightConfigs = isMobile ? [
    { pos: [-halfW - 2, lightHeight, -halfD - 2] as [number, number, number], offset: 0, speed: 0.3, intensity: 1.2 },
    { pos: [halfW + 2, lightHeight, halfD + 2] as [number, number, number], offset: Math.PI, speed: 0.32, intensity: 1.0 },
    { pos: [0, lightHeight, -halfD - 3] as [number, number, number], offset: Math.PI / 2, speed: 0.28, intensity: 0.9 },
  ] : [
    { pos: [-halfW - 2, lightHeight, -halfD - 2] as [number, number, number], offset: 0, speed: 0.3, intensity: 1.2 },
    { pos: [halfW + 2, lightHeight, -halfD - 2] as [number, number, number], offset: Math.PI / 3, speed: 0.35, intensity: 1.0 },
    { pos: [-halfW - 2, lightHeight, halfD + 2] as [number, number, number], offset: Math.PI * 2/3, speed: 0.25, intensity: 1.1 },
    { pos: [halfW + 2, lightHeight, halfD + 2] as [number, number, number], offset: Math.PI, speed: 0.4, intensity: 0.9 },
    { pos: [0, lightHeight + 3, -halfD - 3] as [number, number, number], offset: Math.PI * 4/3, speed: 0.28, intensity: 1.3 },
    { pos: [0, lightHeight + 3, halfD + 3] as [number, number, number], offset: Math.PI * 5/3, speed: 0.32, intensity: 1.1 },
  ]

  return (
    <group>
      {lightConfigs.map((config, i) => (
        <VolumetricSpotlight
          key={i}
          position={config.pos}
          color={lightColors[i % lightColors.length]}
          rotationOffset={config.offset}
          sweepSpeed={config.speed}
          intensity={config.intensity}
        />
      ))}
    </group>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// SKYNET LASER ARRAY — The "Electric Forest at 2AM" Rave Lasers!
// "Face-melting HDR beams cutting through fog" — Fortnite Festival Lead
// ═══════════════════════════════════════════════════════════════════════════
interface LaserBeamProps {
  position: [number, number, number]
  color: [number, number, number]  // HDR color values!
  rotationOffset: number
  speed: number
}

function LaserBeam({ position, color, rotationOffset, speed }: LaserBeamProps) {
  const meshRef = useRef<THREE.Mesh>(null!)
  const beamLength = 80  // LONG beams into the sky

  useFrame(({ clock }) => {
    if (!meshRef.current) return
    const time = clock.elapsedTime

    // Slow, calming sweeps — no dubstep drops!
    const searchX = Math.sin(time * speed * 0.2 + rotationOffset) * 0.3
    const searchZ = Math.cos(time * speed * 0.15 + rotationOffset * 1.3) * 0.25

    meshRef.current.rotation.x = -0.3 + searchX
    meshRef.current.rotation.z = searchZ

    // Gentle Y rotation for fan-out effect
    meshRef.current.rotation.y = Math.sin(time * speed * 0.08 + rotationOffset) * 0.08
  })

  return (
    <mesh ref={meshRef} position={position}>
      {/* Beam oriented upward — pivot from bottom */}
      <group position={[0, beamLength / 2, 0]}>
        <mesh>
          <cylinderGeometry args={[0.04, 0.04, beamLength, 8]} />
          <meshBasicMaterial
            color={color}
            toneMapped={false}  // CRITICAL: Don't clamp HDR values!
            transparent
            opacity={0.85}
          />
        </mesh>
        {/* Inner core — brighter! */}
        <mesh>
          <cylinderGeometry args={[0.015, 0.015, beamLength, 6]} />
          <meshBasicMaterial
            color={[color[0] * 1.5, color[1] * 1.5, color[2] * 1.5]}
            toneMapped={false}
          />
        </mesh>
      </group>
      {/* Laser source glow at base */}
      <mesh>
        <sphereGeometry args={[0.15, 12, 12]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
    </mesh>
  )
}

interface SkynetLaserArrayProps {
  width: number
  depth: number
  colors: string[]
  isMobile?: boolean
}

function SkynetLaserArray({ width, depth, colors, isMobile = false }: SkynetLaserArrayProps) {
  // Fewer lasers on mobile for performance + less visual clutter
  const numLasers = isMobile ? 6 : 14
  const radius = Math.max(width, depth) * 0.8 + 3  // Ring outside the floor

  // Generate HDR colors for lasers — zone colors boosted + RGB cycle
  const laserColors = useMemo(() => {
    const hdrColors: [number, number, number][] = []

    // Convert zone colors to HDR
    colors.forEach((hexColor) => {
      const c = new THREE.Color(hexColor)
      hdrColors.push([c.r * 8, c.g * 8, c.b * 8])  // Boost to HDR!
    })

    // Add neon classics
    hdrColors.push(
      [10, 2, 10],   // Neon Purple
      [2, 15, 5],    // Radioactive Green
      [15, 5, 2],    // Hot Red
      [2, 10, 15],   // Electric Blue
      [15, 10, 2],   // Golden
      [10, 2, 15],   // Magenta
    )

    return hdrColors
  }, [colors])

  // Generate laser positions in a ring
  const lasers = useMemo(() => {
    return Array.from({ length: numLasers }, (_, i) => {
      const angle = (i / numLasers) * Math.PI * 2
      return {
        position: [
          Math.cos(angle) * radius,
          0.5,  // Slightly above floor
          Math.sin(angle) * radius,
        ] as [number, number, number],
        color: laserColors[i % laserColors.length],
        rotationOffset: (i / numLasers) * Math.PI * 2,
        speed: 0.8 + Math.random() * 0.4,  // Vary speeds slightly
      }
    })
  }, [radius, laserColors, numLasers])

  return (
    <group>
      {lasers.map((laser, i) => (
        <LaserBeam
          key={i}
          position={laser.position}
          color={laser.color}
          rotationOffset={laser.rotationOffset}
          speed={laser.speed}
        />
      ))}
    </group>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// LASER SPIROGRAPH — "Break on Through" Sacred Geometry Lissajous!
// "Parametric curves that form cosmic flowers" — Laser God
// ═══════════════════════════════════════════════════════════════════════════
interface LaserSpirographProps {
  radius: number
  colors: string[]
  isMobile?: boolean
}

function LaserSpirograph({ radius, colors, isMobile = false }: LaserSpirographProps) {
  const lineRef = useRef<THREE.Line>(null!)
  const numPoints = isMobile ? 256 : 512
  const numCurves = isMobile ? 3 : 6

  // Generate Lissajous curves — NOW POSITIONED BEHIND THE STAGE!
  const curves = useMemo(() => {
    return Array.from({ length: numCurves }, (_, curveIndex) => {
      const positions = new Float32Array(numPoints * 3)
      // Lissajous parameters — different ratios create different patterns
      const freqA = 3 + curveIndex * 2  // 3, 5, 7, 9, 11, 13
      const freqB = 2 + curveIndex      // 2, 3, 4, 5, 6, 7
      const phaseOffset = (curveIndex / numCurves) * Math.PI

      for (let i = 0; i < numPoints; i++) {
        const t = (i / numPoints) * Math.PI * 2
        positions[i * 3] = radius * Math.sin(freqA * t + phaseOffset)
        positions[i * 3 + 1] = radius * Math.sin(freqB * t) * 0.5 + 6  // Elevated in sky
        positions[i * 3 + 2] = radius * Math.cos(freqA * t + phaseOffset) * 0.8
      }

      // HDR color for massive bloom — zone colors or neon classics
      const baseColor = colors[curveIndex % colors.length] || '#ff00ff'
      const c = new THREE.Color(baseColor)
      // Boost to HDR!
      const hdrColor: [number, number, number] = [c.r * 10, c.g * 8, c.b * 12]

      return { positions, hdrColor, phaseOffset }
    })
  }, [radius, colors, numPoints, numCurves])

  // Animate the spirograph rotation + morphing
  useFrame(({ clock }) => {
    if (!lineRef.current) return
    const time = clock.elapsedTime

    // Slow majestic rotation
    lineRef.current.rotation.y = time * 0.15
    lineRef.current.rotation.x = Math.sin(time * 0.2) * 0.1
    lineRef.current.rotation.z = Math.cos(time * 0.15) * 0.05
  })

  return (
    <group ref={lineRef} position={[0, 0, -18]}>
      {curves.map((curve, i) => (
        <line key={i}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={numPoints}
              array={curve.positions}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial
            color={curve.hdrColor}
            toneMapped={false}  // HDR bloom!
            transparent
            opacity={0.7}
            linewidth={2}
          />
        </line>
      ))}

      {/* Inner bright core spirograph — same curves, smaller */}
      {curves.slice(0, 3).map((curve, i) => {
        const innerPositions = new Float32Array(curve.positions.length)
        for (let j = 0; j < curve.positions.length; j++) {
          innerPositions[j] = curve.positions[j] * 0.6
        }
        return (
          <line key={`inner-${i}`}>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                count={numPoints}
                array={innerPositions}
                itemSize={3}
              />
            </bufferGeometry>
            <lineBasicMaterial
              color={[curve.hdrColor[0] * 1.5, curve.hdrColor[1] * 1.5, curve.hdrColor[2] * 1.5]}
              toneMapped={false}
              transparent
              opacity={0.9}
            />
          </line>
        )
      })}
    </group>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// PARTICLE SYSTEMS — PARTY CONFETTI + Energy + Cosmic dust!
// "It's not a party without confetti!" — Nintendo Physics Lead
// ═══════════════════════════════════════════════════════════════════════════
interface ParticleSystemProps {
  width: number
  depth: number
  colors: string[]
  isMobile?: boolean
}

// PARTY CONFETTI — Larger, colorful, floating with turbulence!
function PartyConfetti({ width, depth, colors, isMobile = false }: ParticleSystemProps) {
  const confettiRef = useRef<THREE.Points>(null!)
  const count = isMobile ? 50 : 180  // Much fewer on mobile!

  const { positions, velocities, rotations, colorArray, sizes } = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const vel = new Float32Array(count * 3) // x, y, z velocities
    const rot = new Float32Array(count)
    const col = new Float32Array(count * 3)
    const siz = new Float32Array(count)

    const partyColors = ['#FFD700', '#FF00FF', '#00F0FF', '#FF0055', '#00FF88', '#FF6600', '#FFFFFF', ...colors]

    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * width * 2
      pos[i * 3 + 1] = -2 + Math.random() * 20
      pos[i * 3 + 2] = (Math.random() - 0.5) * depth * 2

      // Velocities — mostly upward with drift
      vel[i * 3] = (Math.random() - 0.5) * 0.5     // x drift
      vel[i * 3 + 1] = 0.8 + Math.random() * 1.5   // y (upward)
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.5 // z drift

      rot[i] = Math.random() * Math.PI * 2
      siz[i] = 0.08 + Math.random() * 0.12  // Larger than dust!

      const color = new THREE.Color(partyColors[Math.floor(Math.random() * partyColors.length)])
      col[i * 3] = color.r
      col[i * 3 + 1] = color.g
      col[i * 3 + 2] = color.b
    }
    return { positions: pos, velocities: vel, rotations: rot, colorArray: col, sizes: siz }
  }, [width, depth, colors, count])

  useFrame(({ clock }, delta) => {
    if (!confettiRef.current) return
    const pos = confettiRef.current.geometry.attributes.position.array as Float32Array
    const time = clock.elapsedTime

    for (let i = 0; i < count; i++) {
      // Turbulent float with sine waves
      const turbX = Math.sin(time * 1.5 + i * 0.3) * 0.3
      const turbZ = Math.cos(time * 1.2 + i * 0.5) * 0.3

      pos[i * 3] += (velocities[i * 3] + turbX) * delta
      pos[i * 3 + 1] += velocities[i * 3 + 1] * delta
      pos[i * 3 + 2] += (velocities[i * 3 + 2] + turbZ) * delta

      // Reset when too high or drifted too far
      if (pos[i * 3 + 1] > 18 || Math.abs(pos[i * 3]) > width * 1.5) {
        pos[i * 3 + 1] = -2
        pos[i * 3] = (Math.random() - 0.5) * width * 2
        pos[i * 3 + 2] = (Math.random() - 0.5) * depth * 2
      }
    }
    confettiRef.current.geometry.attributes.position.needsUpdate = true

    // Slow rotation of entire system
    confettiRef.current.rotation.y = time * 0.03
  })

  return (
    <points ref={confettiRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={count} array={colorArray} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        size={0.15}
        vertexColors
        transparent
        opacity={0.9}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

function RisingEnergyParticles({ width, depth, colors, isMobile = false }: ParticleSystemProps) {
  const particlesRef = useRef<THREE.Points>(null!)
  const count = isMobile ? 60 : 250  // MORE particles for epic anti-gravity!

  const { positions, velocities, colorArray, sizes, spawnRadius } = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const vel = new Float32Array(count)
    const col = new Float32Array(count * 3)
    const siz = new Float32Array(count)
    const radius = Math.max(width, depth) * 0.6

    // Enhanced color palette for energy
    const energyColors = [...colors, '#ffffff', '#88ffff', '#ff88ff', '#8888ff']

    for (let i = 0; i < count; i++) {
      // Spawn in a ring/cylinder pattern around the island base
      const angle = Math.random() * Math.PI * 2
      const r = radius * (0.3 + Math.random() * 0.9)
      pos[i * 3] = Math.cos(angle) * r
      pos[i * 3 + 1] = -15 + Math.random() * 5  // Deep below island
      pos[i * 3 + 2] = Math.sin(angle) * r
      vel[i] = 0.8 + Math.random() * 2.5  // Faster rise!
      siz[i] = 0.08 + Math.random() * 0.15

      const color = new THREE.Color(energyColors[Math.floor(Math.random() * energyColors.length)])
      col[i * 3] = color.r
      col[i * 3 + 1] = color.g
      col[i * 3 + 2] = color.b
    }
    return { positions: pos, velocities: vel, colorArray: col, sizes: siz, spawnRadius: radius }
  }, [width, depth, colors, count])

  useFrame(({ clock }, delta) => {
    if (!particlesRef.current) return
    const pos = particlesRef.current.geometry.attributes.position.array as Float32Array
    const time = clock.elapsedTime

    for (let i = 0; i < count; i++) {
      // Rising motion with spiral drift
      pos[i * 3 + 1] += velocities[i] * delta * 2.5

      // Subtle spiral drift for organic feel
      const drift = Math.sin(time * 2 + i * 0.1) * 0.02
      pos[i * 3] += drift
      pos[i * 3 + 2] += Math.cos(time * 2 + i * 0.15) * 0.015

      // Reset when above the island
      if (pos[i * 3 + 1] > 3) {
        const angle = Math.random() * Math.PI * 2
        const r = spawnRadius * (0.3 + Math.random() * 0.9)
        pos[i * 3] = Math.cos(angle) * r
        pos[i * 3 + 1] = -15 + Math.random() * 3
        pos[i * 3 + 2] = Math.sin(angle) * r
      }
    }
    particlesRef.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={count} array={colorArray} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        size={0.15}
        vertexColors
        transparent
        opacity={0.85}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// ASCENDING ENERGY SPARKS — Larger, brighter motes rising from the abyss!
// "The void breathes life into the arena" — Visual Effects Lead
// ═══════════════════════════════════════════════════════════════════════════
function AscendingEnergySparks({ width, depth, colors, isMobile = false }: ParticleSystemProps) {
  const sparksRef = useRef<THREE.Group>(null!)
  const count = isMobile ? 15 : 40

  const sparkData = useMemo(() => {
    const data: { pos: [number, number, number]; speed: number; size: number; color: THREE.Color; phase: number }[] = []
    const radius = Math.max(width, depth) * 0.7

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const r = radius * (0.4 + Math.random() * 0.6)
      data.push({
        pos: [Math.cos(angle) * r, -12 + Math.random() * 4, Math.sin(angle) * r],
        speed: 1.5 + Math.random() * 2,
        size: 0.12 + Math.random() * 0.2,
        color: new THREE.Color(colors[Math.floor(Math.random() * colors.length)] || '#00f0ff'),
        phase: Math.random() * Math.PI * 2,
      })
    }
    return data
  }, [width, depth, colors, count])

  useFrame(({ clock }) => {
    if (!sparksRef.current) return
    const time = clock.elapsedTime

    sparksRef.current.children.forEach((spark, i) => {
      const data = sparkData[i]
      if (!data) return

      // Rise with pulsing intensity
      const y = ((time * data.speed + data.phase * 5) % 18) - 14

      spark.position.set(
        data.pos[0] + Math.sin(time * 1.5 + data.phase) * 0.3,
        y,
        data.pos[2] + Math.cos(time * 1.2 + data.phase) * 0.3
      )

      // Pulse size
      const pulse = 1 + Math.sin(time * 4 + data.phase) * 0.3
      spark.scale.setScalar(data.size * pulse)
    })
  })

  return (
    <group ref={sparksRef}>
      {sparkData.map((data, i) => (
        <mesh key={i} position={data.pos}>
          <sphereGeometry args={[1, 8, 8]} />
          <meshBasicMaterial color={data.color} transparent opacity={0.8} />
        </mesh>
      ))}
    </group>
  )
}

function CosmicDust({ width, depth, isMobile = false }: { width: number; depth: number; isMobile?: boolean }) {
  const dustRef = useRef<THREE.Points>(null!)
  const count = isMobile ? 60 : 200  // Fewer on mobile!

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * width * 2.5
      pos[i * 3 + 1] = -5 + Math.random() * 15
      pos[i * 3 + 2] = (Math.random() - 0.5) * depth * 2.5
    }
    return pos
  }, [width, depth, count])

  useFrame(({ clock }) => {
    if (dustRef.current) {
      dustRef.current.rotation.y = clock.elapsedTime * 0.02
    }
  })

  return (
    <points ref={dustRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.04} color="#8866aa" transparent opacity={0.4} sizeAttenuation />
    </points>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// SKY PODIUM — Dope floating signs like your CSS version!
// "Billboard scoreboard vibes" — Miyamoto
// ═══════════════════════════════════════════════════════════════════════════
interface PodiumProps {
  position: [number, number, number]
  label: string
  pct: number
  color: string
  rank: number
}

const MEDALS = ['🥇', '🥈', '🥉']
const RANK_LABELS = ['1ST', '2ND', '3RD']

function SkyPodium({ position, label, pct, color, rank }: PodiumProps) {
  const groupRef = useRef<THREE.Group>(null!)
  const glowRef = useRef<THREE.Mesh>(null!)
  const { camera } = useThree()

  // Billboard: always face camera
  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.lookAt(camera.position)
    }
    // Subtle pulse on edge glow
    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = 0.7 + Math.sin(clock.elapsedTime * 2) * 0.2
    }
  })

  const displayLabel = label.split(' ')[0].toUpperCase()
  const isWinner = rank === 0

  // Sleek horizontal dimensions — like reference image
  const panelWidth = 3.8
  const panelHeight = 0.75
  const cornerRadius = 0.15
  const edgeThickness = 0.08

  return (
    <group ref={groupRef} position={position}>
      {/* ═══ MAIN PANEL — Dark translucent background ═══ */}
      <RoundedBox
        args={[panelWidth, panelHeight, 0.06]}
        radius={cornerRadius}
        smoothness={4}
        position={[0, 0, -0.03]}
      >
        <meshStandardMaterial
          color="#080810"
          transparent
          opacity={0.92}
          roughness={0.8}
        />
      </RoundedBox>

      {/* ═══ NEON EDGE GLOW — Left side accent bar ═══ */}
      <mesh ref={glowRef} position={[-panelWidth / 2 + edgeThickness / 2 + 0.02, 0, 0.01]}>
        <boxGeometry args={[edgeThickness, panelHeight - 0.12, 0.02]} />
        <meshBasicMaterial color={color} transparent opacity={0.9} />
      </mesh>

      {/* ═══ BOTTOM EDGE GLOW — Subtle neon underline ═══ */}
      <mesh position={[0, -panelHeight / 2 + 0.03, 0.01]}>
        <boxGeometry args={[panelWidth - 0.2, 0.04, 0.02]} />
        <meshBasicMaterial color={color} transparent opacity={0.5} />
      </mesh>

      {/* ═══ OUTER GLOW HALO — Soft zone color aura ═══ */}
      <mesh position={[0, 0, -0.08]}>
        <planeGeometry args={[panelWidth + 0.3, panelHeight + 0.25]} />
        <meshBasicMaterial color={color} transparent opacity={0.12} />
      </mesh>

      {/* ═══ PERCENTAGE BAR — Color fill based on % (min 8% width so small values visible) ═══ */}
      {(() => {
        const barWidth = panelWidth - 0.16
        const fillPct = Math.max(8, pct) / 100  // Min 8% so tiny values still show
        const fillWidth = barWidth * fillPct
        return (
          <mesh position={[-barWidth / 2 + fillWidth / 2 + 0.08, 0, -0.02]}>
            <boxGeometry args={[fillWidth, panelHeight - 0.08, 0.02]} />
            <meshBasicMaterial color={color} transparent opacity={0.3} />
          </mesh>
        )
      })()}

      {/* ═══ MEDAL EMOJI ONLY — Left side ═══ */}
      {rank < 3 && (
        <Text
          position={[-panelWidth / 2 + 0.22, 0, 0.04]}
          fontSize={0.28}
          anchorX="left"
          anchorY="middle"
        >
          {MEDALS[rank]}
        </Text>
      )}

      {/* ═══ CANDIDATE NAME — After medal with padding ═══ */}
      <Text
        position={[-panelWidth / 2 + (rank < 3 ? 0.72 : 0.22), 0, 0.04]}
        fontSize={0.34}
        color="#ffffff"
        anchorX="left"
        anchorY="middle"
        fontWeight="bold"
        letterSpacing={0.06}
      >
        {displayLabel}
      </Text>

      {/* ═══ PERCENTAGE — Right side ═══ */}
      <Text
        position={[panelWidth / 2 - 0.18, 0, 0.04]}
        fontSize={0.38}
        color="#ffffff"
        anchorX="right"
        anchorY="middle"
        fontWeight="bold"
      >
        {Math.round(pct)}%
      </Text>

      {/* ═══ CORNER ACCENT DOTS — Winner bling ═══ */}
      {isWinner && (
        <>
          <mesh position={[panelWidth / 2 - 0.12, panelHeight / 2 - 0.12, 0.03]}>
            <circleGeometry args={[0.05, 12]} />
            <meshBasicMaterial color={color} />
          </mesh>
          <mesh position={[panelWidth / 2 - 0.12, -panelHeight / 2 + 0.12, 0.03]}>
            <circleGeometry args={[0.05, 12]} />
            <meshBasicMaterial color={color} />
          </mesh>
        </>
      )}
    </group>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// PLATFORM BASE — Floating stage
// ═══════════════════════════════════════════════════════════════════════════
interface PlatformProps {
  width: number
  depth: number
}

function Platform({ width, depth }: PlatformProps) {
  return (
    <group>
      {/* Main base */}
      <mesh position={[0, -0.25, 0]} receiveShadow>
        <boxGeometry args={[width + 0.5, 0.35, depth + 0.5]} />
        <meshStandardMaterial color="#0c0616" roughness={0.9} />
      </mesh>

      {/* Glow edge — front */}
      <mesh position={[0, -0.08, depth / 2 + 0.3]}>
        <boxGeometry args={[width + 0.6, 0.05, 0.08]} />
        <meshBasicMaterial color="#7744ee" />
      </mesh>

      {/* Glow edge — right */}
      <mesh position={[width / 2 + 0.3, -0.08, 0]}>
        <boxGeometry args={[0.08, 0.05, depth + 0.6]} />
        <meshBasicMaterial color="#7744ee" />
      </mesh>
    </group>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// SKY TEXT 3D — Smash Bros Final Destination style floating title!
// "Epic 3D text that floats above the battlefield" — Nintendo Art Director
// ═══════════════════════════════════════════════════════════════════════════
interface SkyText3DProps {
  question: string
  isMobile?: boolean
}

function SkyText3D({ question, isMobile = false }: SkyText3DProps) {
  const groupRef = useRef<THREE.Group>(null)

  // Subtle floating animation — very gentle bob
  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.position.y = 10 + Math.sin(clock.elapsedTime * 0.5) * 0.15
    }
  })

  // Use Inter from Google Fonts CDN (drei's default has issues sometimes)
  const fontUrl = 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff2'

  return (
    <group ref={groupRef} position={[0, 10, -6]}>
      {/* Main title — PERFORMANCE OPTIMIZED with meshBasicMaterial */}
      <Text
        font={fontUrl}
        fontSize={isMobile ? 0.9 : 1.4}
        letterSpacing={0.08}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        maxWidth={isMobile ? 12 : 22}
        textAlign="center"
        fontWeight={700}
      >
        {question.toUpperCase()}
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </Text>

      {/* Subtle glow behind text — meshBasicMaterial for performance */}
      <Text
        font={fontUrl}
        fontSize={isMobile ? 0.92 : 1.42}
        letterSpacing={0.08}
        color="#8844ff"
        anchorX="center"
        anchorY="middle"
        maxWidth={isMobile ? 12 : 22}
        textAlign="center"
        fontWeight={700}
        position={[0, 0, -0.1]}
      >
        {question.toUpperCase()}
        <meshBasicMaterial color="#8844ff" transparent opacity={0.5} toneMapped={false} />
      </Text>
    </group>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// DANCE FLOOR SCENE
// ═══════════════════════════════════════════════════════════════════════════
interface SceneProps {
  options: Option[]
  gridCols: number
  gridRows: number
  onTileClick?: (optionId: string, col: number, row: number) => void
  dancers?: Dancer[]
  isMobile?: boolean
  marketQuestion?: string
}

function DanceFloorScene({ options, gridCols, gridRows, onTileClick, dancers, isMobile = false, marketQuestion }: SceneProps) {
  const ranges = useMemo(() => calculateColumnRanges(options, gridCols), [options, gridCols])

  // ═══ GRID MATH — 1.0 unit step creates 0.08 gutter between 0.92 tiles ═══
  const unit = FLOOR.gridUnit  // 1.0 — the secret sauce for visible gutters!
  const floorWidth = gridCols * unit
  const floorDepth = gridRows * unit
  const halfW = floorWidth / 2
  const halfD = floorDepth / 2

  // Generate tiles — positioned at center of each grid cell
  const tiles = useMemo(() => {
    const list: { pos: [number, number, number]; color: string; optionId: string; col: number; row: number }[] = []

    for (let row = 0; row < gridRows; row++) {
      for (let col = 0; col < gridCols; col++) {
        const range = getOptionForColumn(col, ranges)
        if (!range) continue

        // Position at cell center: col * 1.0 leaves natural gaps between 0.92 tiles
        const x = (col + 0.5) * unit - halfW
        const z = (row + 0.5) * unit - halfD

        list.push({ pos: [x, FLOOR.tileHeight / 2, z], color: range.color, optionId: range.optionId, col, row })
      }
    }

    return list
  }, [ranges, gridCols, gridRows, unit, halfW, halfD])

  // Sort by percentage for ranking
  const ranked = useMemo(() => [...options].sort((a, b) => b.pct - a.pct), [options])

  // Podium positions — at the FRONT of the floor (like your CSS version!)
  const podiums = useMemo(() => {
    return ranges.map(range => {
      const centerCol = (range.colStart + range.colEnd) / 2
      const x = (centerCol * unit) - halfW
      const rank = ranked.findIndex(o => o.id === range.optionId)

      return {
        optionId: range.optionId,
        // Position at front of floor, slightly below (like CSS version)
        position: [x, 1.5, halfD + 2.2] as [number, number, number],
        label: range.label,
        pct: range.pct,
        color: range.color,
        rank,
      }
    })
  }, [ranges, ranked, unit, halfW, halfD])

  return (
    <>
      {/* ═══ ENVIRONMENT — Required for transmission/clearcoat! ═══ */}
      <Environment preset="night" environmentIntensity={0.6} />

      {/* ═══ LIGHTING — Optimized for JELLY GLASS reflections! ═══ */}
      <ambientLight intensity={0.25} color="#f8f0ff" />

      {/* KEY LIGHT — Angled to catch jelly cube highlights! */}
      <directionalLight
        position={[-10, 18, 14]}
        intensity={1.4}
        color="#ffffff"
        castShadow={!isMobile}
        shadow-mapSize={isMobile ? [512, 512] : [2048, 2048]}
      />

      {/* JELLY SHOWCASE SPOTS — These make the glass SHINE! */}
      <spotLight
        position={[-halfW * 0.7, 12, halfD * 0.5]}
        intensity={40}
        angle={0.6}
        penumbra={0.5}
        color="#ffffff"
        distance={30}
      />
      <spotLight
        position={[halfW * 0.7, 12, halfD * 0.5]}
        intensity={40}
        angle={0.6}
        penumbra={0.5}
        color="#ffffff"
        distance={30}
      />
      <spotLight
        position={[0, 14, -halfD * 0.3]}
        intensity={35}
        angle={0.5}
        penumbra={0.4}
        color="#ffffff"
        distance={28}
      />

      {/* SPECULAR HIGHLIGHT LIGHTS — Create those white edge glints! */}
      <pointLight
        position={[-halfW * 0.4, 5, halfD * 0.9]}
        intensity={12}
        color="#ffffff"
        distance={18}
      />
      <pointLight
        position={[halfW * 0.4, 5, halfD * 0.9]}
        intensity={12}
        color="#ffffff"
        distance={18}
      />
      <pointLight
        position={[0, 4, -halfD * 0.6]}
        intensity={10}
        color="#ffffff"
        distance={15}
      />

      {/* Desktop-only extra lights */}
      {!isMobile && (
        <>
          {/* Key light from front-left */}
          <directionalLight position={[-15, 10, 15]} intensity={0.6} color="#ffffff" />

          {/* Rim light from back — fresnel highlight */}
          <directionalLight position={[0, 8, -25]} intensity={0.5} color="#aaccff" />

          {/* ═══ DRAMATIC UNDER-LIGHTING — Catches the rugged edges! ═══ */}
          {/* Central core uplighting — THE POWER SOURCE! */}
          <pointLight position={[0, -12, 0]} intensity={8} color="#8800ff" distance={30} />
          <pointLight position={[0, -8, 0]} intensity={5} color="#4400ff" distance={25} />

          {/* Zone-colored under-lights — MASSIVE INTENSITY for rim lighting! */}
          <pointLight position={[-halfW * 0.8, -6, 0]} intensity={4} color={ranges[0]?.color || '#00f0ff'} distance={20} />
          <pointLight position={[halfW * 0.8, -6, 0]} intensity={4} color={ranges[ranges.length - 1]?.color || '#ff0055'} distance={20} />
          <pointLight position={[0, -6, -halfD * 0.8]} intensity={3.5} color="#bd00ff" distance={18} />
          <pointLight position={[0, -6, halfD * 0.8]} intensity={3.5} color="#00ff88" distance={18} />

          {/* Corner under-lights — catches the crystal nodes! */}
          <pointLight position={[-halfW, -4, -halfD]} intensity={2.5} color={ranges[0]?.color || '#00f0ff'} distance={15} />
          <pointLight position={[halfW, -4, -halfD]} intensity={2.5} color={ranges[1]?.color || '#ff0055'} distance={15} />
          <pointLight position={[-halfW, -4, halfD]} intensity={2.5} color="#bd00ff" distance={15} />
          <pointLight position={[halfW, -4, halfD]} intensity={2.5} color="#00ff88" distance={15} />

          {/* Deep abyss glow — mysterious bottom light */}
          <pointLight position={[0, -15, 0]} intensity={3} color="#220044" distance={35} />
        </>
      )}

      {/* Zone-colored spotlights from above — fewer on mobile */}
      {ranges.slice(0, isMobile ? 2 : ranges.length).map((range) => {
        const centerCol = (range.colStart + range.colEnd) / 2
        const x = (centerCol * unit) - halfW
        return (
          <pointLight key={range.optionId} position={[x, 8, 2]} intensity={isMobile ? 1.0 : 1.5} color={range.color} distance={18} />
        )
      })}

      {/* ═══ FLOOR BASE — Black reflective surface under jelly ═══ */}
      <mesh position={[0, -0.01, 0]} receiveShadow>
        <boxGeometry args={[floorWidth, 0.02, floorDepth]} />
        <meshStandardMaterial color="#080810" roughness={0.3} metalness={0.5} />
      </mesh>

      {/* ═══ JELLY TILE FLOOR — Glassy wet neon candy! ═══ */}
      <InstancedTileFloor
        tiles={tiles}
        gridCols={gridCols}
        gridRows={gridRows}
        isMobile={isMobile}
        onTileClick={onTileClick}
        selectedZone={selectedZone}
      />

      {/* ═══ FLOATING ISLAND — FINAL DESTINATION BASE! ═══ */}
      {!isMobile && <FloatingIsland width={floorWidth} depth={floorDepth} colors={ranges.map(r => r.color)} />}

      {/* ═══ CLUB LIGHT RIG — Sweeping volumetric god rays! (Desktop only) ═══ */}
      {!isMobile && <ClubLightRig width={floorWidth} depth={floorDepth} colors={ranges.map(r => r.color)} isMobile={isMobile} />}

      {/* ═══ SKYNET LASER ARRAY — Electric Forest 2AM vibes! ═══ */}
      <SkynetLaserArray width={floorWidth} depth={floorDepth} colors={ranges.map(r => r.color)} isMobile={isMobile} />

      {/* ═══ LASER SPIROGRAPH — Removed per user request ═══ */}

      {/* ═══ ALIEN FOREST ATMOSPHERE — Fog for laser visibility! ═══ */}
      <fogExp2 attach="fog" args={['#030208', isMobile ? 0.025 : 0.018]} />

      {/* ═══ PARTICLE SYSTEMS — Epic anti-gravity effects! ═══ */}
      <PartyConfetti width={floorWidth} depth={floorDepth} colors={ranges.map(r => r.color)} isMobile={isMobile} />
      <RisingEnergyParticles width={floorWidth} depth={floorDepth} colors={ranges.map(r => r.color)} isMobile={isMobile} />
      {!isMobile && <AscendingEnergySparks width={floorWidth} depth={floorDepth} colors={ranges.map(r => r.color)} isMobile={isMobile} />}
      {!isMobile && <CosmicDust width={floorWidth} depth={floorDepth} isMobile={isMobile} />}

      {/* ═══ PLATFORM BASE ═══ */}
      <Platform width={floorWidth} depth={floorDepth} />

      {/* ═══ SKY PODIUMS — Dope floating signs! ═══ */}
      {podiums.map(({ optionId, position, label, pct, color, rank }) => (
        <SkyPodium key={optionId} position={position} label={label} pct={pct} color={color} rank={rank} />
      ))}

      {/* ═══ SKY TEXT 3D — Smash Bros style floating market title! ═══ */}
      {marketQuestion && (
        <Suspense fallback={null}>
          <SkyText3D question={marketQuestion} isMobile={isMobile} />
        </Suspense>
      )}

      {/* ═══ DANCING STICK FIGURES! ═══ */}
      {dancers && dancers.length > 0 && (
        <Suspense fallback={null}>
          <DancerGroup
            dancers={dancers}
            zoneRanges={ranges}
            gridCols={gridCols}
            gridRows={gridRows}
            tileSize={FLOOR.tileSize}
            tileGap={FLOOR.gridUnit - FLOOR.tileSize}  // 1.0 - 0.92 = 0.08 gap
            isMobile={isMobile}
          />
        </Suspense>
      )}
    </>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// RESPONSIVE CAMERA — One epic view that scales to ANY screen!
// "Desktop layout everywhere, just zoom out on mobile" — Responsive Design
// ═══════════════════════════════════════════════════════════════════════════
interface CameraControllerProps {
  isMobile?: boolean
}

function CameraController({ isMobile = false }: CameraControllerProps) {
  const { camera, size } = useThree()

  React.useEffect(() => {
    // Dynamic zoom based on viewport aspect ratio
    // Narrow screens = pull camera back to fit the whole stage
    const aspect = size.width / size.height

    // ZOOMED OUT to see the FULL dance floor on load!
    const baseY = 18       // Higher up
    const baseZ = 22       // Further back

    // Scale factor: narrower aspect = zoom out more
    // Desktop (aspect ~1.8) = scale 1.0
    // Mobile portrait (aspect ~0.5) = scale ~1.6 (zoomed out)
    const scaleFactor = Math.max(1, 1.6 / Math.max(aspect, 0.5))

    camera.position.set(0, baseY * scaleFactor, baseZ * scaleFactor)
    camera.lookAt(0, 0, 0)
    camera.updateProjectionMatrix()
  }, [camera, size.width, size.height])

  return (
    <OrbitControls
      makeDefault
      enableDamping={true}
      dampingFactor={0.08}
      enableZoom={true}
      enableRotate={true}
      enablePan={false}
      minDistance={6}
      maxDistance={50}
      minPolarAngle={Math.PI / 6}
      maxPolarAngle={Math.PI / 2 - 0.08}
      rotateSpeed={isMobile ? 0.5 : 0.8}
      zoomSpeed={1.0}
      target={[0, 0.5, 0]}
      touches={{
        ONE: THREE.TOUCH.ROTATE,
        TWO: THREE.TOUCH.DOLLY_PAN,
      }}
    />
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
export default function DanceFloor({
  options,
  gridCols: propGridCols,
  gridRows: propGridRows,
  onTileClick,
  onZoneSelect,
  dancers: propDancers,
  dancersPerZone = 0,
  userPrediction,
  marketQuestion,
  selectedZone,
  children,
  className = '',
  style = {},
}: DanceFloorProps) {
  // ═══ MOBILE DETECTION (for performance optimizations only) ═══
  const isMobile = useIsMobile()

  // ALWAYS use desktop grid — camera zooms out on mobile to fit!
  const gridCols = propGridCols ?? DESKTOP_GRID.cols
  const gridRows = propGridRows ?? DESKTOP_GRID.rows
  const cameraConfig = DESKTOP_GRID.camera

  if (!options || options.length === 0) {
    console.warn('DanceFloor: No options provided')
    return null
  }

  const optionsWithColors = options.map((opt, idx) => ({
    ...opt,
    color: opt.color || DEFAULT_COLORS[idx % DEFAULT_COLORS.length],
  }))

  // Generate dancers if dancersPerZone is set and no dancers provided
  // Mobile: Generate fewer dancers for performance!
  const effectiveDancersPerZone = isMobile ? Math.min(dancersPerZone, 3) : dancersPerZone

  const dancers = useMemo(() => {
    const allDancers: Dancer[] = []

    // Add prop dancers
    if (propDancers && propDancers.length > 0) {
      const limitedDancers = isMobile ? propDancers.slice(0, 12) : propDancers
      allDancers.push(...limitedDancers)
    } else if (effectiveDancersPerZone > 0) {
      // Generate dancers
      let avatarIndex = 0
      optionsWithColors.forEach(opt => {
        for (let i = 0; i < effectiveDancersPerZone; i++) {
          allDancers.push({
            id: `${opt.id}-dancer-${i}`,
            avatar: AVATARS[avatarIndex % AVATARS.length],
            zoneId: opt.id,
            danceMove: Math.floor(Math.random() * 10),
          })
          avatarIndex++
        }
      })
    }

    // ═══ ADD USER'S AVATAR if they made a prediction! ═══
    if (userPrediction) {
      allDancers.push({
        id: 'user-prediction',
        avatar: userPrediction.avatar,
        zoneId: userPrediction.zoneId,
        danceMove: 0,  // Default dance for user
        speech: 'you 👆',  // Mark as the user!
      })
    }

    return allDancers
  }, [propDancers, effectiveDancersPerZone, optionsWithColors, isMobile, userPrediction])

  // Handle tile click — trigger zone selection
  const handleTileClick = (optionId: string, col: number, row: number) => {
    onTileClick?.(optionId, col, row)
    onZoneSelect?.(optionId)  // Also trigger zone selection!
  }

  return (
    <div
      className={className}
      style={{
        width: '100%',
        height: '100%',
        minHeight: isMobile ? '400px' : '500px',
        touchAction: 'none',  // CRITICAL: Prevents browser from hijacking touch events!
        ...style
      }}
    >
      <Canvas
        shadows={!isMobile}
        camera={{ position: cameraConfig.position, fov: cameraConfig.fov, near: 0.1, far: 100 }}
        gl={{ antialias: !isMobile, alpha: true, powerPreference: isMobile ? 'default' : 'high-performance' }}
        dpr={isMobile ? [1, 1.5] : [1, 2]}  // Lower DPR on mobile for performance
        style={{
          background: 'linear-gradient(180deg, #0a0812 0%, #150820 50%, #0a0610 100%)',
          touchAction: 'none',  // Also on canvas for full coverage
        }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping
          gl.toneMappingExposure = isMobile ? 1.0 : 1.2
        }}
      >
        <CameraController isMobile={isMobile} />
        <DanceFloorScene
          options={optionsWithColors}
          gridCols={gridCols}
          gridRows={gridRows}
          onTileClick={handleTileClick}
          dancers={dancers}
          isMobile={isMobile}
          marketQuestion={marketQuestion}
        />
      </Canvas>

      {children && (
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          {children}
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════
export function createBinaryOptions(yesPct: number): Option[] {
  return [
    { id: 'yes', label: 'Yes', pct: yesPct, color: '#00F0FF' },      // CYAN — Tron!
    { id: 'no', label: 'No', pct: 100 - yesPct, color: '#FF0055' },  // HOT PINK — Cyberpunk!
  ]
}

export function createMultiOptions(data: { id: string; label: string; pct: number; color?: string }[]): Option[] {
  return data.map((item, idx) => ({
    ...item,
    color: item.color || DEFAULT_COLORS[idx % DEFAULT_COLORS.length],
  }))
}

export { DanceFloorScene, calculateColumnRanges, getOptionForColumn, AVATARS }
export type { Option, DanceFloorProps, ColumnRange, Dancer }
