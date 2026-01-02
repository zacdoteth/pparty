/**
 * StickFigures — Dancing Stick Figures with Epic Emotes!
 * "VIRAL EMOTE PACK — 10 dance moves!" — Miyamoto
 *
 * DANCE MOVES:
 * 0. The Turk / Fortnite Default — L-arm swing, hip thrust, head bob
 * 1. The Floss — Arms swing past hips, hips counter-rotate
 * 2. Orange Justice — Pump fists, swing arms low, leg stomps
 * 3. Take the L — L on forehead, bouncy bobbing
 * 4. The Dab — Arm across face, other extends up, lean
 * 5. Gangnam Style — Invisible lasso, galloping legs
 * 6. The Breakdance — Spin, leg kicks, windmill
 * 7. The Carlton — Arms swing side to side, hip sway
 * 8. The Matrix — Lean back dodge, frozen pose
 * 9. The Teabag — Repetitive crouch/stand
 */

import React, { useRef, useMemo, useState, useEffect } from 'react'
import { useFrame, useLoader, useThree } from '@react-three/fiber'
import { Billboard, Text } from '@react-three/drei'
import * as THREE from 'three'

// Simple hash for stable random positions
function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash)
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453
  return x - Math.floor(x)
}

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════
export interface Dancer {
  id: string
  avatar: string      // Path like '/tg/zac.jpg'
  zoneId: string      // Which option zone they're on
  danceMove?: number  // 0-9 for dance type, random if not set
  speech?: string     // Optional speech bubble text
}

interface StickFigureProps {
  position: [number, number, number]
  avatar: string
  danceMove: number
  speech?: string
  color: string        // Zone color for effects
  scale?: number
  showUsername?: boolean  // Show username under character
}

// ═══════════════════════════════════════════════════════════════════════════
// CRYPTO SLANG — The OG lowercase vibes with emojis!
// "📈📈 is peak crypto energy" — The Culture
// ═══════════════════════════════════════════════════════════════════════════
const CRYPTO_SLANG_YES = [
  '📈📈 moon soon',
  'lfg ser',
  'wagmi frens',
  'bullish af',
  'diamond hands 💎',
  'aping in rn',
  'send it 🚀',
  'ez money',
  'gm gm',
  'probably nothing 👀',
  'up only 📈',
  'gigabrain move',
  'trust the process',
  'we ball 🏀',
]

const CRYPTO_SLANG_NO = [
  'ngmi',
  'rekt incoming 💀',
  'bear szn',
  'shorting this',
  'fade it',
  'rug pull vibes',
  'sell sell sell',
  'paper hands 🧻',
  'top signal',
  'down bad fr',
  'exit liquidity',
  'gg no re',
]

const CRYPTO_SLANG_NEUTRAL = [
  'ser pls',
  'wen moon?',
  'dyor',
  'nfa',
  'iykyk',
  'based take',
  'no cap',
  'frfr',
  'lowkey bullish',
  'highkey rekt',
]

// ═══════════════════════════════════════════════════════════════════════════
// DANCE ANIMATIONS — The epic moves!
// ═══════════════════════════════════════════════════════════════════════════

type LimbAngles = {
  leftArm: { shoulder: number; elbow: number }
  rightArm: { shoulder: number; elbow: number }
  leftLeg: { hip: number; knee: number }
  rightLeg: { hip: number; knee: number }
  torso: { lean: number; twist: number; bob: number }
  head: { tilt: number; nod: number }
}

function getDanceFrame(danceMove: number, t: number): LimbAngles {
  // Base neutral pose
  const base: LimbAngles = {
    leftArm: { shoulder: 0, elbow: 0 },
    rightArm: { shoulder: 0, elbow: 0 },
    leftLeg: { hip: 0, knee: 0 },
    rightLeg: { hip: 0, knee: 0 },
    torso: { lean: 0, twist: 0, bob: 0 },
    head: { tilt: 0, nod: 0 },
  }

  const speed = 3.5 // Animation speed multiplier
  const time = t * speed

  switch (danceMove) {
    case 0: // THE TURK / FORTNITE DEFAULT
      return {
        leftArm: {
          shoulder: Math.sin(time) * 0.8,
          elbow: Math.sin(time + 1) * 0.5 - 0.3,
        },
        rightArm: {
          shoulder: Math.sin(time + Math.PI) * 0.8,
          elbow: Math.sin(time + Math.PI + 1) * 0.5 - 0.3,
        },
        leftLeg: {
          hip: Math.sin(time + Math.PI) * 0.2,
          knee: Math.abs(Math.sin(time + Math.PI)) * 0.3,
        },
        rightLeg: {
          hip: Math.sin(time) * 0.2,
          knee: Math.abs(Math.sin(time)) * 0.3,
        },
        torso: {
          lean: 0,
          twist: Math.sin(time * 2) * 0.15,
          bob: Math.abs(Math.sin(time * 2)) * 0.1,
        },
        head: {
          tilt: Math.sin(time) * 0.1,
          nod: Math.abs(Math.sin(time * 2)) * 0.15,
        },
      }

    case 1: // THE FLOSS
      return {
        leftArm: {
          shoulder: Math.sin(time * 2) * 1.2 + 0.3,
          elbow: 0.2,
        },
        rightArm: {
          shoulder: Math.sin(time * 2) * 1.2 - 0.3,
          elbow: 0.2,
        },
        leftLeg: {
          hip: 0,
          knee: 0,
        },
        rightLeg: {
          hip: 0,
          knee: 0,
        },
        torso: {
          lean: 0,
          twist: Math.sin(time * 2 + Math.PI) * 0.4,
          bob: 0,
        },
        head: {
          tilt: Math.sin(time * 2) * 0.1,
          nod: 0,
        },
      }

    case 2: // ORANGE JUSTICE
      const ojPhase = Math.sin(time * 1.5)
      return {
        leftArm: {
          shoulder: -0.5 + ojPhase * 0.6,
          elbow: -0.8,
        },
        rightArm: {
          shoulder: -0.5 - ojPhase * 0.6,
          elbow: -0.8,
        },
        leftLeg: {
          hip: ojPhase * 0.3,
          knee: Math.abs(ojPhase) * 0.4,
        },
        rightLeg: {
          hip: -ojPhase * 0.3,
          knee: Math.abs(-ojPhase) * 0.4,
        },
        torso: {
          lean: ojPhase * 0.15,
          twist: 0,
          bob: Math.abs(ojPhase) * 0.15,
        },
        head: {
          tilt: ojPhase * 0.2,
          nod: Math.abs(ojPhase) * 0.1,
        },
      }

    case 3: // TAKE THE L
      return {
        leftArm: {
          shoulder: -1.2,  // Up near face
          elbow: -1.5,     // L shape
        },
        rightArm: {
          shoulder: 0.3,
          elbow: 0,
        },
        leftLeg: {
          hip: 0,
          knee: Math.abs(Math.sin(time * 3)) * 0.3,
        },
        rightLeg: {
          hip: 0,
          knee: Math.abs(Math.sin(time * 3 + 1)) * 0.3,
        },
        torso: {
          lean: 0,
          twist: 0,
          bob: Math.abs(Math.sin(time * 3)) * 0.2,
        },
        head: {
          tilt: -0.1,
          nod: Math.abs(Math.sin(time * 3)) * 0.15,
        },
      }

    case 4: // THE DAB
      const dabPhase = (Math.sin(time * 0.8) + 1) / 2 // 0 to 1
      return {
        leftArm: {
          shoulder: -1.8 * dabPhase,   // Across face
          elbow: -0.5 * dabPhase,
        },
        rightArm: {
          shoulder: -2.5 * dabPhase,   // Extended up
          elbow: 0,
        },
        leftLeg: {
          hip: 0.1 * dabPhase,
          knee: 0,
        },
        rightLeg: {
          hip: -0.1 * dabPhase,
          knee: 0,
        },
        torso: {
          lean: -0.3 * dabPhase,       // Lean into it
          twist: -0.2 * dabPhase,
          bob: 0,
        },
        head: {
          tilt: 0.3 * dabPhase,        // Tucked
          nod: 0.2 * dabPhase,
        },
      }

    case 5: // GANGNAM STYLE
      const gsPhase = time * 1.2
      return {
        leftArm: {
          shoulder: -0.5 + Math.sin(gsPhase * 2) * 0.3,
          elbow: -0.5,
        },
        rightArm: {
          shoulder: -0.8,    // Lasso hand up
          elbow: Math.sin(gsPhase * 3) * 0.6 - 0.3,
        },
        leftLeg: {
          hip: Math.sin(gsPhase) * 0.4,      // Gallop
          knee: Math.abs(Math.sin(gsPhase)) * 0.5,
        },
        rightLeg: {
          hip: Math.sin(gsPhase + Math.PI) * 0.4,
          knee: Math.abs(Math.sin(gsPhase + Math.PI)) * 0.5,
        },
        torso: {
          lean: 0,
          twist: 0,
          bob: Math.abs(Math.sin(gsPhase)) * 0.25,
        },
        head: {
          tilt: Math.sin(gsPhase * 2) * 0.1,
          nod: 0,
        },
      }

    case 6: // THE BREAKDANCE (simplified windmill)
      const bdPhase = time * 2
      return {
        leftArm: {
          shoulder: Math.cos(bdPhase) * 1.5,
          elbow: 0,
        },
        rightArm: {
          shoulder: Math.cos(bdPhase + Math.PI) * 1.5,
          elbow: 0,
        },
        leftLeg: {
          hip: Math.sin(bdPhase) * 0.8,
          knee: 0.2,
        },
        rightLeg: {
          hip: Math.sin(bdPhase + Math.PI) * 0.8,
          knee: 0.2,
        },
        torso: {
          lean: Math.sin(bdPhase) * 0.4,
          twist: Math.cos(bdPhase) * 0.3,
          bob: 0,
        },
        head: {
          tilt: Math.sin(bdPhase) * 0.3,
          nod: 0,
        },
      }

    case 7: // THE CARLTON
      const cPhase = Math.sin(time * 2)
      return {
        leftArm: {
          shoulder: -0.6 + cPhase * 0.4,
          elbow: -0.3,
        },
        rightArm: {
          shoulder: -0.6 - cPhase * 0.4,
          elbow: -0.3,
        },
        leftLeg: {
          hip: cPhase * 0.15,
          knee: 0,
        },
        rightLeg: {
          hip: -cPhase * 0.15,
          knee: 0,
        },
        torso: {
          lean: 0,
          twist: cPhase * 0.25,
          bob: Math.abs(cPhase) * 0.08,
        },
        head: {
          tilt: cPhase * 0.15,
          nod: 0,
        },
      }

    case 8: // THE MATRIX
      const matrixLean = Math.sin(time * 0.5) * 0.5 + 0.3
      return {
        leftArm: {
          shoulder: 0.3,
          elbow: 0.2,
        },
        rightArm: {
          shoulder: 0.3,
          elbow: 0.2,
        },
        leftLeg: {
          hip: -0.4,
          knee: 0.5,
        },
        rightLeg: {
          hip: 0.2,
          knee: 0.1,
        },
        torso: {
          lean: -matrixLean,    // Lean WAAAY back
          twist: 0,
          bob: 0,
        },
        head: {
          tilt: 0,
          nod: -matrixLean * 0.5,  // Keep looking forward
        },
      }

    case 9: // THE TEABAG
      const tbPhase = Math.sin(time * 4)
      const crouch = (tbPhase + 1) / 2 // 0 to 1
      return {
        leftArm: {
          shoulder: 0,
          elbow: 0,
        },
        rightArm: {
          shoulder: 0,
          elbow: 0,
        },
        leftLeg: {
          hip: crouch * 0.5,
          knee: crouch * 1.2,
        },
        rightLeg: {
          hip: crouch * 0.5,
          knee: crouch * 1.2,
        },
        torso: {
          lean: 0,
          twist: 0,
          bob: -crouch * 0.4,
        },
        head: {
          tilt: 0,
          nod: 0,
        },
      }

    default:
      return base
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// FLAT LIMB — Paper Mario / Game & Watch style 2.5D!
// "A flat line with attitude" — Miyamoto
// ═══════════════════════════════════════════════════════════════════════════
interface LimbProps {
  length: number
  thickness: number
  color: string
  outlineColor?: string
  rotation: number
  position?: [number, number, number]
  children?: React.ReactNode
}

function Limb({ length, thickness, color, outlineColor = '#000000', rotation, position = [0, 0, 0], children }: LimbProps) {
  return (
    <group position={position} rotation={[0, 0, rotation]}>
      {/* OUTLINE — Thick black stroke behind */}
      <mesh position={[0, -length / 2, -0.01]}>
        <planeGeometry args={[thickness * 3.5, length + thickness * 2]} />
        <meshBasicMaterial color={outlineColor} side={THREE.DoubleSide} />
      </mesh>
      {/* FILL — Colored inner part */}
      <mesh position={[0, -length / 2, 0]}>
        <planeGeometry args={[thickness * 2, length]} />
        <meshBasicMaterial color={color} side={THREE.DoubleSide} />
      </mesh>
      {/* Joint for next segment */}
      {children && (
        <group position={[0, -length, 0]}>
          {children}
        </group>
      )}
    </group>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// DOPE SNEAKER — CHUNKY geometric kicks with ATTITUDE!
// "The soles must kiss the floor perfectly" — Nintendo Physics Lead
// NOW WITH: Thick platform sole, glowing accents, Nike Air vibes!
// ═══════════════════════════════════════════════════════════════════════════
interface SneakerProps {
  scale: number
  color: string
}

function DopeSneaker({ scale, color }: SneakerProps) {
  // Simpler boot that matches zone color — cleaner look!
  const { soleGeo, bootGeo } = useMemo(() => {
    const soleHeight = 0.025 * scale
    const bootHeight = 0.07 * scale

    // SOLE — thin dark base
    const sole = new THREE.BoxGeometry(0.09 * scale, soleHeight, 0.14 * scale)
    sole.translate(0, soleHeight / 2, 0)

    // BOOT — zone-colored upper
    const boot = new THREE.BoxGeometry(0.075 * scale, bootHeight, 0.11 * scale)
    boot.translate(0, soleHeight + bootHeight / 2, -0.01 * scale)

    return { soleGeo: sole, bootGeo: boot }
  }, [scale])

  return (
    <group>
      {/* Sole — dark with subtle zone glow */}
      <mesh geometry={soleGeo}>
        <meshBasicMaterial color="#111111" />
      </mesh>
      {/* Boot — matches body color! */}
      <mesh geometry={bootGeo}>
        <meshBasicMaterial color={color} />
      </mesh>
      {/* Black outline on boot */}
      <mesh position={[0, 0.025 * scale + 0.035 * scale, -0.01 * scale - 0.056 * scale]}>
        <planeGeometry args={[0.08 * scale, 0.072 * scale]} />
        <meshBasicMaterial color="#000000" side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// STICK FIGURE — FLAT 2.5D like Paper Mario / Game & Watch!
// "Every character should feel like a paper cutout dancing in 3D space" — Miyamoto
// 
// KEY DIFFERENCES from 3D version:
// 1. FLAT planes instead of 3D capsules/spheres
// 2. BLACK OUTLINE for that classic cartoon look
// 3. ZONE COLOR for body — matches the tile they're standing on!
// 4. BILLBOARD facing — always faces camera like Paper Mario
// 5. INTRO ANIMATION — Drop in from above with bounce!
// ═══════════════════════════════════════════════════════════════════════════
function StickFigure({ position, avatar, danceMove, speech, color, scale = 1.4, showUsername = true }: StickFigureProps) {
  const groupRef = useRef<THREE.Group>(null!)
  const { camera } = useThree()
  const [angles, setAngles] = useState<LimbAngles>(() => getDanceFrame(danceMove, 0))
  const [showSpeech, setShowSpeech] = useState(!!speech)

  // Pick from appropriate slang pool based on zone color (green = yes vibes, red = no vibes)
  const getRandomSlang = () => {
    const allSlang = [...CRYPTO_SLANG_YES, ...CRYPTO_SLANG_NO, ...CRYPTO_SLANG_NEUTRAL]
    return allSlang[Math.floor(Math.random() * allSlang.length)]
  }
  const [currentSpeech, setCurrentSpeech] = useState(speech || getRandomSlang())

  // ═══ EXTRACT USERNAME from avatar path! ═══
  // e.g., "/tg/zac.jpg" → "zac"
  const username = useMemo(() => {
    const match = avatar.match(/\/([^\/]+)\.[^.]+$/)
    return match ? match[1] : 'anon'
  }, [avatar])

  // ═══ INTRO ANIMATION STATE ═══
  const [introProgress, setIntroProgress] = useState(0)
  const spawnDelay = useMemo(() => Math.random() * 1.2, []) // Staggered spawn (wider range for more dancers)

  // ═══ NINTENDO GROUND FIX — Calculate exact height so feet KISS the floor! ═══
  // "The soles must touch the tiles perfectly" — Nintendo Physics Lead
  // NOW SIMPLIFIED: DopeSneaker has pivot at sole bottom, so no sneaker offset needed!
  const flatScale = scale * 1.2
  const thighLength = 0.32 * flatScale
  const shinLength = 0.32 * flatScale
  // Total leg length from hip to sneaker attachment point
  // The sneaker's origin is now at sole bottom, so we just need thigh + shin length
  const groundOffset = thighLength + shinLength  // Clean! Sneaker sits ON this point.

  // Load avatar texture with proper settings
  const texture = useLoader(THREE.TextureLoader, avatar)

  // Configure texture on first load
  useMemo(() => {
    if (texture) {
      texture.colorSpace = THREE.SRGBColorSpace
      texture.minFilter = THREE.LinearFilter
      texture.magFilter = THREE.LinearFilter
    }
  }, [texture])

  // Animate the dance + BILLBOARD FACING + INTRO + BOUNCY IDLE!
  useFrame(({ clock }, delta) => {
    if (!groupRef.current) return

    const time = clock.elapsedTime

    // ═══ INTRO ANIMATION — Drop in from above! ═══
    const introTime = Math.max(0, time - spawnDelay)
    const newIntroProgress = Math.min(1, introTime * 2.5) // ~0.4s to complete
    setIntroProgress(newIntroProgress)

    // Easing function for bouncy drop
    const easeOutBounce = (t: number) => {
      if (t < 0.5) return 4 * t * t * t
      return 1 - Math.pow(-2 * t + 2, 3) / 2
    }

    const easedProgress = easeOutBounce(newIntroProgress)

    // ═══ HABBO HOTEL BOUNCY IDLE — Squash & Stretch! ═══
    // Since DopeSneaker pivot is at sole bottom, this stretches UPWARD correctly!
    const bounceFreq = 8 + (danceMove % 4)  // Vary by dance move
    const bounceAmp = 0.06  // Subtle but visible
    const squashStretch = 1 + Math.sin(time * bounceFreq) * bounceAmp

    // Apply scales — intro + bouncy idle
    const baseScale = easedProgress * scale
    groupRef.current.scale.set(
      baseScale * (1 + (1 - squashStretch) * 0.3),  // X: inverse squash (wider when short)
      baseScale * squashStretch,                      // Y: main bounce
      baseScale                                       // Z: constant
    )

    // Drop from above (start 3 units high)
    const dropHeight = (1 - easedProgress) * 3

    // Dance animation
    const newAngles = getDanceFrame(danceMove, time)
    setAngles(newAngles)

    // Apply body bob + intro drop + GROUND OFFSET (soles kiss the floor!)
    groupRef.current.position.y = position[1] + groundOffset + newAngles.torso.bob * scale + dropHeight

    // BILLBOARD — Always face camera (Paper Mario style!)
    const cameraPos = camera.position.clone()
    cameraPos.y = groupRef.current.position.y
    groupRef.current.lookAt(cameraPos)

    // Slight rotation wobble during intro
    if (newIntroProgress < 1) {
      groupRef.current.rotation.z = Math.sin(introTime * 15) * (1 - newIntroProgress) * 0.3
    }
  })

  // Cycle speech bubbles with OG crypto slang
  useEffect(() => {
    if (!speech) {
      const interval = setInterval(() => {
        // Randomly show/hide speech
        const show = Math.random() > 0.6
        setShowSpeech(show)
        if (show) {
          setCurrentSpeech(getRandomSlang())
        }
      }, 3000 + Math.random() * 4000)
      return () => clearInterval(interval)
    }
  }, [speech])

  // ═══ ZONE COLOR for body! ═══
  const bodyColor = color  // Now matches the tile color!
  const outlineColor = '#000000'  // Black outline for Game & Watch look

  // Limb dimensions (flatScale, thighLength, shinLength already calculated above for ground offset)
  const limbThickness = 0.06 * flatScale
  const armLength = 0.32 * flatScale
  const forearmLength = 0.28 * flatScale
  const torsoHeight = 0.45 * flatScale
  const headSize = 0.26 * flatScale

  return (
    <group ref={groupRef} position={position}>
      {/* ═══ TORSO — Flat rectangle with outline! ═══ */}
      <group rotation={[angles.torso.lean, 0, angles.torso.twist * 0.3]}>
        {/* Torso outline */}
        <mesh position={[0, torsoHeight / 2, -0.02]}>
          <planeGeometry args={[limbThickness * 5, torsoHeight + limbThickness * 2]} />
          <meshBasicMaterial color={outlineColor} side={THREE.DoubleSide} />
        </mesh>
        {/* Torso fill — ZONE COLOR! */}
        <mesh position={[0, torsoHeight / 2, 0]}>
          <planeGeometry args={[limbThickness * 3, torsoHeight]} />
          <meshBasicMaterial color={bodyColor} side={THREE.DoubleSide} />
        </mesh>

        {/* ═══ HEAD — Circular with avatar photo! ═══ */}
        <group position={[0, torsoHeight + headSize * 0.9, 0]} rotation={[0, 0, angles.head.tilt]}>
          {/* Head outline circle */}
          <mesh position={[0, 0, -0.02]}>
            <circleGeometry args={[headSize * 1.15, 32]} />
            <meshBasicMaterial color={outlineColor} side={THREE.DoubleSide} />
          </mesh>
          {/* Head fill — ZONE COLOR! */}
          <mesh position={[0, 0, -0.01]}>
            <circleGeometry args={[headSize, 32]} />
            <meshBasicMaterial color={bodyColor} side={THREE.DoubleSide} />
          </mesh>
          {/* Avatar face (front) */}
          <mesh position={[0, 0, 0.01]}>
            <circleGeometry args={[headSize * 0.85, 32]} />
            <meshBasicMaterial map={texture} side={THREE.DoubleSide} />
          </mesh>
          {/* White ring border around face */}
          <mesh position={[0, 0, 0.02]}>
            <ringGeometry args={[headSize * 0.8, headSize * 0.9, 32]} />
            <meshBasicMaterial color="#ffffff" side={THREE.DoubleSide} />
          </mesh>
        </group>

        {/* ═══ SPEECH BUBBLE — Real chat bubble style! ═══ */}
        {showSpeech && (() => {
          // Single line: "name: message"
          const fullText = `${username}: ${currentSpeech}`
          const charWidth = 0.058
          const textWidth = fullText.length * charWidth
          const bubbleWidth = Math.max(0.8, Math.min(2.8, textWidth + 0.08))  // Tight padding
          const halfWidth = bubbleWidth / 2
          const bubbleHeight = 0.22  // Single line height

          return (
            <Billboard
              position={[headSize * 2.0, torsoHeight + headSize * 2.2, 0]}
              follow={true}
              lockX={false}
              lockY={false}
              lockZ={false}
            >
              {/* Border — zone colored */}
              <mesh position={[0, 0, -0.035]}>
                <planeGeometry args={[bubbleWidth + 0.025, bubbleHeight + 0.025]} />
                <meshBasicMaterial color={color} />
              </mesh>
              {/* Subtle glow */}
              <mesh position={[0, 0, -0.04]}>
                <planeGeometry args={[bubbleWidth + 0.06, bubbleHeight + 0.06]} />
                <meshBasicMaterial color={color} transparent opacity={0.15} />
              </mesh>
              {/* Dark background */}
              <mesh position={[0, 0, -0.02]}>
                <planeGeometry args={[bubbleWidth, bubbleHeight]} />
                <meshBasicMaterial color="#0a0a12" />
              </mesh>

              {/* Single line: "name: message" */}
              <Text
                position={[-halfWidth + 0.04, 0, 0]}
                fontSize={0.09}
                anchorX="left"
                anchorY="middle"
              >
                <meshBasicMaterial color={color} />
                {username}:
              </Text>
              <Text
                position={[-halfWidth + 0.04 + (username.length + 1) * 0.052, 0, 0.001]}
                fontSize={0.09}
                color="#ffffff"
                anchorX="left"
                anchorY="middle"
              >
                {currentSpeech}
              </Text>

              {/* Tail pointing down */}
              <mesh position={[-halfWidth + 0.1, -0.16, -0.03]} rotation={[0, 0, Math.PI / 4]}>
                <planeGeometry args={[0.07, 0.07]} />
                <meshBasicMaterial color={color} />
              </mesh>
              <mesh position={[-halfWidth + 0.1, -0.145, -0.02]} rotation={[0, 0, Math.PI / 4]}>
                <planeGeometry args={[0.045, 0.045]} />
                <meshBasicMaterial color="#0a0a12" />
              </mesh>
            </Billboard>
          )
        })()}
        
        {/* USERNAME TAG REMOVED — Now shown in speech bubble!
            "Less is more when UI tells the story" — Nintendo UX */}

        {/* ═══ LEFT ARM — Flat with outline! ═══ */}
        <group position={[-limbThickness * 2.5, torsoHeight - 0.03, 0]}>
          <Limb
            length={armLength}
            thickness={limbThickness}
            color={bodyColor}
            outlineColor={outlineColor}
            rotation={angles.leftArm.shoulder}
          >
            <Limb
              length={forearmLength}
              thickness={limbThickness * 0.85}
              color={bodyColor}
              outlineColor={outlineColor}
              rotation={angles.leftArm.elbow}
            />
          </Limb>
        </group>

        {/* ═══ RIGHT ARM — Flat with outline! ═══ */}
        <group position={[limbThickness * 2.5, torsoHeight - 0.03, 0]}>
          <Limb
            length={armLength}
            thickness={limbThickness}
            color={bodyColor}
            outlineColor={outlineColor}
            rotation={angles.rightArm.shoulder}
          >
            <Limb
              length={forearmLength}
              thickness={limbThickness * 0.85}
              color={bodyColor}
              outlineColor={outlineColor}
              rotation={angles.rightArm.elbow}
            />
          </Limb>
        </group>
      </group>

      {/* ═══ LEFT LEG — With DOPE SNEAKER (pivot at sole)! ═══ */}
      <group position={[-limbThickness * 1.2, 0, 0]}>
        <Limb
          length={thighLength}
          thickness={limbThickness}
          color={bodyColor}
          outlineColor={outlineColor}
          rotation={angles.leftLeg.hip}
        >
          <Limb
            length={shinLength}
            thickness={limbThickness * 0.85}
            color={bodyColor}
            outlineColor={outlineColor}
            rotation={angles.leftLeg.knee}
          >
            {/* DOPE SNEAKER — Pivot is now at SOLE BOTTOM! */}
            <group position={[0, 0, 0.02]}>
              <DopeSneaker scale={flatScale} color={bodyColor} />
            </group>
          </Limb>
        </Limb>
      </group>

      {/* ═══ RIGHT LEG — With DOPE SNEAKER (pivot at sole)! ═══ */}
      <group position={[limbThickness * 1.2, 0, 0]}>
        <Limb
          length={thighLength}
          thickness={limbThickness}
          color={bodyColor}
          outlineColor={outlineColor}
          rotation={angles.rightLeg.hip}
        >
          <Limb
            length={shinLength}
            thickness={limbThickness * 0.85}
            color={bodyColor}
            outlineColor={outlineColor}
            rotation={angles.rightLeg.knee}
          >
            {/* DOPE SNEAKER — Pivot is now at SOLE BOTTOM! */}
            <group position={[0, 0, 0.02]}>
              <DopeSneaker scale={flatScale} color={bodyColor} />
            </group>
          </Limb>
        </Limb>
      </group>

      {/* ═══ SHADOW — Flat oval ON the floor (negative groundOffset to stay at tile level!) ═══ */}
      <mesh position={[0, -groundOffset + 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[1, 0.55, 1]}>
        <circleGeometry args={[0.22 * flatScale, 16]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.4 * introProgress} />
      </mesh>

      {/* Zone glow under feet — slight elevation to avoid z-fighting */}
      <mesh position={[0, -groundOffset + 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.28 * flatScale, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.2} />
      </mesh>

      {/* ═══ SPAWN BURST — Glowing ring when landing! ═══ */}
      {introProgress > 0.7 && introProgress < 1 && (
        <mesh position={[0, -groundOffset + 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.3 * flatScale * (introProgress - 0.7) * 3, 0.5 * flatScale * (introProgress - 0.7) * 3, 32]} />
          <meshBasicMaterial color={color} transparent opacity={(1 - introProgress) * 3} depthWrite={false} />
        </mesh>
      )}
      
      {/* ═══ LANDING SPARKLES ═══ */}
      {introProgress > 0.85 && introProgress < 0.98 && (
        <>
          {[0, 1, 2, 3].map((i) => (
            <mesh
              key={i}
              position={[
                Math.cos(i * Math.PI / 2) * 0.35 * flatScale,
                -groundOffset + 0.15 + (introProgress - 0.85) * 2,
                Math.sin(i * Math.PI / 2) * 0.35 * flatScale
              ]}
            >
              <sphereGeometry args={[0.04 * (1 - (introProgress - 0.85) * 8), 8, 8]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
          ))}
        </>
      )}
    </group>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// DANCER GROUP — Manages multiple dancers on the floor
// ═══════════════════════════════════════════════════════════════════════════
interface DancerGroupProps {
  dancers: Dancer[]
  zoneRanges: { optionId: string; color: string; colStart: number; colEnd: number }[]
  gridCols: number
  gridRows: number
  tileSize: number
  tileGap: number
  isMobile?: boolean  // Mobile-first: smaller avatars!
}

export function DancerGroup({ dancers, zoneRanges, gridCols, gridRows, tileSize, tileGap, isMobile = false }: DancerGroupProps) {
  const unit = tileSize + tileGap
  const halfW = (gridCols * unit) / 2
  const halfD = (gridRows * unit) / 2

  // Calculate dancer positions with stable seeded random
  const dancerPositions = useMemo(() => {
    return dancers.map((dancer) => {
      // Find the zone this dancer belongs to
      const zone = zoneRanges.find(z => z.optionId === dancer.zoneId)
      if (!zone) return null

      // Stable random position based on dancer ID
      const seed = hashString(dancer.id)
      const zoneCols = zone.colEnd - zone.colStart
      const col = zone.colStart + Math.floor(seededRandom(seed) * zoneCols)
      const row = Math.floor(seededRandom(seed + 1) * gridRows)

      const x = (col + 0.5) * unit - halfW
      const z = (row + 0.5) * unit - halfD

      return {
        ...dancer,
        // Position at TOP of jelly tiles (tile center 0.25 + half height 0.25 = 0.50)
        // EXTRA LIFT to account for scale factor and sneaker platform height!
        // NINTENDO FIX: Feet must KISS the floor perfectly, not sink in!
        position: [x, 0.98, z] as [number, number, number],
        danceMove: dancer.danceMove ?? (seed % 10),
        color: zone.color,
      }
    }).filter(Boolean)
  }, [dancers, zoneRanges, gridCols, gridRows, unit, halfW, halfD])

  return (
    <group>
      {dancerPositions.map((dancer) => (
        dancer && (
          <StickFigure
            key={dancer.id}
            position={dancer.position}
            avatar={dancer.avatar}
            danceMove={dancer.danceMove}
            speech={dancer.speech}
            color={dancer.color}
            scale={isMobile ? 0.85 : 1.3}  // Smaller on mobile for better fit!
            showUsername={!isMobile}  // Hide usernames on mobile - less clutter
          />
        )
      ))}
    </group>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// AVATAR LIST — Available avatars from /tg/ folder
// ═══════════════════════════════════════════════════════════════════════════
export const AVATARS = [
  '/tg/zac.jpg',
  '/tg/biz.jpg',
  '/tg/rekt.jpg',
  '/tg/vn.jpg',
  '/tg/rob.jpg',
  '/tg/jin.jpg',
  '/tg/pupul.jpg',
  '/tg/skely.jpg',
  '/tg/ferengi.jpg',
  '/tg/phanes.jpg',
  '/tg/AzFlin.jpg',
  '/tg/Tintin.jpg',
  '/tg/icobeast.jpg',
  '/tg/ultra.png',
  '/tg/frostyflakes.jpg',
  '/tg/shinkiro14.jpg',
]

// ═══════════════════════════════════════════════════════════════════════════
// DANCE NAMES — For UI display
// ═══════════════════════════════════════════════════════════════════════════
export const DANCE_NAMES = [
  'The Turk',
  'The Floss',
  'Orange Justice',
  'Take the L',
  'The Dab',
  'Gangnam Style',
  'Breakdance',
  'The Carlton',
  'The Matrix',
  'The Teabag',
]

export { StickFigure }
export type { Dancer, StickFigureProps }
