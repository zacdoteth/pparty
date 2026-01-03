/**
 * StickFigures — PAPER MARIO "Living Sticker" Style!
 * "It's not 3D. It's Art." — Intelligent Systems
 *
 * VISUAL TECH STACK:
 * - FLAT planeGeometry for limbs (2D cutout look!)
 * - circleGeometry for heads (flat disc with PFP texture)
 * - MeshBasicMaterial ONLY (100% unlit, NO SHADING, NO MUD!)
 * - <Outlines> with screenspace={true} (thick constant ink lines)
 * - High contrast zone colors — characters POP like UI elements!
 *
 * References: Paper Mario: TTYD, Game & Watch, WarioWare
 */

import React, { useRef, useMemo, useState, useEffect } from 'react'
import { useFrame, useLoader, useThree } from '@react-three/fiber'
import { Billboard, Text, Outlines } from '@react-three/drei'
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
  isUser?: boolean    // Is this the current user? Shows glow!
}

interface StickFigureProps {
  position: [number, number, number]
  avatar: string
  danceMove: number
  speech?: string
  color: string        // Zone color — FLAT, BRIGHT, NO MUD!
  scale?: number
  showUsername?: boolean
  isUser?: boolean
}

// ═══════════════════════════════════════════════════════════════════════════
// CRYPTO SLANG — The OG lowercase vibes with emojis!
// ═══════════════════════════════════════════════════════════════════════════
const CRYPTO_SLANG_YES = [
  'moon soon',
  'lfg ser',
  'wagmi frens',
  'bullish af',
  'diamond hands',
  'aping in rn',
  'send it',
  'ez money',
  'gm gm',
  'probably nothing',
  'up only',
  'gigabrain move',
  'trust the process',
  'we ball',
]

const CRYPTO_SLANG_NO = [
  'ngmi',
  'rekt incoming',
  'bear szn',
  'shorting this',
  'fade it',
  'rug pull vibes',
  'sell sell sell',
  'paper hands',
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
// DANCE ANIMATIONS
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
  const base: LimbAngles = {
    leftArm: { shoulder: 0, elbow: 0 },
    rightArm: { shoulder: 0, elbow: 0 },
    leftLeg: { hip: 0, knee: 0 },
    rightLeg: { hip: 0, knee: 0 },
    torso: { lean: 0, twist: 0, bob: 0 },
    head: { tilt: 0, nod: 0 },
  }

  const speed = 3.5
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
        leftLeg: { hip: 0, knee: 0 },
        rightLeg: { hip: 0, knee: 0 },
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
        leftArm: { shoulder: -0.5 + ojPhase * 0.6, elbow: -0.8 },
        rightArm: { shoulder: -0.5 - ojPhase * 0.6, elbow: -0.8 },
        leftLeg: { hip: ojPhase * 0.3, knee: Math.abs(ojPhase) * 0.4 },
        rightLeg: { hip: -ojPhase * 0.3, knee: Math.abs(-ojPhase) * 0.4 },
        torso: { lean: ojPhase * 0.15, twist: 0, bob: Math.abs(ojPhase) * 0.15 },
        head: { tilt: ojPhase * 0.2, nod: Math.abs(ojPhase) * 0.1 },
      }

    case 3: // TAKE THE L
      return {
        leftArm: { shoulder: -1.2, elbow: -1.5 },
        rightArm: { shoulder: 0.3, elbow: 0 },
        leftLeg: { hip: 0, knee: Math.abs(Math.sin(time * 3)) * 0.3 },
        rightLeg: { hip: 0, knee: Math.abs(Math.sin(time * 3 + 1)) * 0.3 },
        torso: { lean: 0, twist: 0, bob: Math.abs(Math.sin(time * 3)) * 0.2 },
        head: { tilt: -0.1, nod: Math.abs(Math.sin(time * 3)) * 0.15 },
      }

    case 4: // THE DAB
      const dabPhase = (Math.sin(time * 0.8) + 1) / 2
      return {
        leftArm: { shoulder: -1.8 * dabPhase, elbow: -0.5 * dabPhase },
        rightArm: { shoulder: -2.5 * dabPhase, elbow: 0 },
        leftLeg: { hip: 0.1 * dabPhase, knee: 0 },
        rightLeg: { hip: -0.1 * dabPhase, knee: 0 },
        torso: { lean: -0.3 * dabPhase, twist: -0.2 * dabPhase, bob: 0 },
        head: { tilt: 0.3 * dabPhase, nod: 0.2 * dabPhase },
      }

    case 5: // GANGNAM STYLE
      const gsPhase = time * 1.2
      return {
        leftArm: { shoulder: -0.5 + Math.sin(gsPhase * 2) * 0.3, elbow: -0.5 },
        rightArm: { shoulder: -0.8, elbow: Math.sin(gsPhase * 3) * 0.6 - 0.3 },
        leftLeg: { hip: Math.sin(gsPhase) * 0.4, knee: Math.abs(Math.sin(gsPhase)) * 0.5 },
        rightLeg: { hip: Math.sin(gsPhase + Math.PI) * 0.4, knee: Math.abs(Math.sin(gsPhase + Math.PI)) * 0.5 },
        torso: { lean: 0, twist: 0, bob: Math.abs(Math.sin(gsPhase)) * 0.25 },
        head: { tilt: Math.sin(gsPhase * 2) * 0.1, nod: 0 },
      }

    case 6: // THE BREAKDANCE
      const bdPhase = time * 2
      return {
        leftArm: { shoulder: Math.cos(bdPhase) * 1.5, elbow: 0 },
        rightArm: { shoulder: Math.cos(bdPhase + Math.PI) * 1.5, elbow: 0 },
        leftLeg: { hip: Math.sin(bdPhase) * 0.8, knee: 0.2 },
        rightLeg: { hip: Math.sin(bdPhase + Math.PI) * 0.8, knee: 0.2 },
        torso: { lean: Math.sin(bdPhase) * 0.4, twist: Math.cos(bdPhase) * 0.3, bob: 0 },
        head: { tilt: Math.sin(bdPhase) * 0.3, nod: 0 },
      }

    case 7: // THE CARLTON
      const cPhase = Math.sin(time * 2)
      return {
        leftArm: { shoulder: -0.6 + cPhase * 0.4, elbow: -0.3 },
        rightArm: { shoulder: -0.6 - cPhase * 0.4, elbow: -0.3 },
        leftLeg: { hip: cPhase * 0.15, knee: 0 },
        rightLeg: { hip: -cPhase * 0.15, knee: 0 },
        torso: { lean: 0, twist: cPhase * 0.25, bob: Math.abs(cPhase) * 0.08 },
        head: { tilt: cPhase * 0.15, nod: 0 },
      }

    case 8: // THE MATRIX
      const matrixLean = Math.sin(time * 0.5) * 0.5 + 0.3
      return {
        leftArm: { shoulder: 0.3, elbow: 0.2 },
        rightArm: { shoulder: 0.3, elbow: 0.2 },
        leftLeg: { hip: -0.4, knee: 0.5 },
        rightLeg: { hip: 0.2, knee: 0.1 },
        torso: { lean: -matrixLean, twist: 0, bob: 0 },
        head: { tilt: 0, nod: -matrixLean * 0.5 },
      }

    case 9: // THE TEABAG
      const tbPhase = Math.sin(time * 4)
      const crouch = (tbPhase + 1) / 2
      return {
        leftArm: { shoulder: 0, elbow: 0 },
        rightArm: { shoulder: 0, elbow: 0 },
        leftLeg: { hip: crouch * 0.5, knee: crouch * 1.2 },
        rightLeg: { hip: crouch * 0.5, knee: crouch * 1.2 },
        torso: { lean: 0, twist: 0, bob: -crouch * 0.4 },
        head: { tilt: 0, nod: 0 },
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
      {/* FILL — Zone colored inner part */}
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
// PAPER SNEAKER — FLAT 2D cutout style!
// "The soles must kiss the floor perfectly" — Nintendo Physics Lead
// ═══════════════════════════════════════════════════════════════════════════
interface SneakerProps {
  scale: number
  color: string
}

function PaperSneaker({ scale, color }: SneakerProps) {
  const platformHeight = 0.035 * scale
  const midsoleHeight = 0.025 * scale
  const upperHeight = 0.055 * scale
  const shoeWidth = 0.11 * scale
  const shoeLength = 0.18 * scale

  return (
    <group>
      {/* PLATFORM OUTSOLE — Dark base with outline */}
      <mesh position={[0, platformHeight / 2, 0]}>
        <boxGeometry args={[shoeWidth, platformHeight, shoeLength]} />
        <meshBasicMaterial color="#1a1a1a" />
        <Outlines thickness={0.06} color="#000000" screenspace={true} angle={0} />
      </mesh>

      {/* MIDSOLE — Bright white foam */}
      <mesh position={[0, platformHeight + midsoleHeight / 2, 0]}>
        <boxGeometry args={[shoeWidth * 0.9, midsoleHeight, shoeLength * 0.9]} />
        <meshBasicMaterial color="#ffffff" />
        <Outlines thickness={0.04} color="#000000" screenspace={true} angle={0} />
      </mesh>

      {/* UPPER — Zone colored! */}
      <mesh position={[0, platformHeight + midsoleHeight + upperHeight / 2, -0.01 * scale]}>
        <boxGeometry args={[shoeWidth * 0.8, upperHeight, shoeLength * 0.75]} />
        <meshBasicMaterial color={color} />
        <Outlines thickness={0.06} color="#000000" screenspace={true} angle={0} />
      </mesh>

      {/* TOE CAP — White accent */}
      <mesh position={[0, platformHeight + midsoleHeight * 0.8, shoeLength * 0.38]}>
        <boxGeometry args={[shoeWidth * 0.7, upperHeight * 0.5, 0.03 * scale]} />
        <meshBasicMaterial color="#ffffff" />
        <Outlines thickness={0.04} color="#000000" screenspace={true} angle={0} />
      </mesh>
    </group>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// USER SPOTLIGHT — Epic animated glow for YOUR character!
// ═══════════════════════════════════════════════════════════════════════════
interface UserSpotlightProps {
  groundOffset: number
  flatScale: number
  color: string
}

function UserSpotlight({ groundOffset, flatScale, color }: UserSpotlightProps) {
  const ringRef = useRef<THREE.Mesh>(null!)
  const outerRingRef = useRef<THREE.Mesh>(null!)
  const beamRef = useRef<THREE.Mesh>(null!)
  const glowRef = useRef<THREE.Mesh>(null!)

  useFrame((state) => {
    const t = state.clock.elapsedTime

    if (ringRef.current) {
      const pulse = 0.5 + Math.sin(t * 3) * 0.3
      ;(ringRef.current.material as THREE.MeshBasicMaterial).opacity = pulse
      ringRef.current.scale.setScalar(1 + Math.sin(t * 2) * 0.1)
    }

    if (outerRingRef.current) {
      outerRingRef.current.rotation.z = t * 0.5
      ;(outerRingRef.current.material as THREE.MeshBasicMaterial).opacity = 0.4 + Math.sin(t * 4) * 0.2
    }

    if (beamRef.current) {
      ;(beamRef.current.material as THREE.MeshBasicMaterial).opacity = 0.1 + Math.sin(t * 2) * 0.08
      beamRef.current.scale.x = 1 + Math.sin(t * 3) * 0.15
      beamRef.current.scale.z = 1 + Math.sin(t * 3) * 0.15
    }

    if (glowRef.current) {
      ;(glowRef.current.material as THREE.MeshBasicMaterial).opacity = 0.25 + Math.sin(t * 2.5) * 0.15
      glowRef.current.scale.setScalar(1 + Math.sin(t * 1.5) * 0.12)
    }
  })

  return (
    <>
      {/* Inner pulsing ring — gold! */}
      <mesh ref={ringRef} position={[0, -groundOffset + 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.35 * flatScale, 0.5 * flatScale, 32]} />
        <meshBasicMaterial color="#FFD700" transparent opacity={0.6} depthWrite={false} />
      </mesh>

      {/* Outer rotating ring — zone colored! */}
      <mesh ref={outerRingRef} position={[0, -groundOffset + 0.035, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.55 * flatScale, 0.75 * flatScale, 6]} />
        <meshBasicMaterial color={color} transparent opacity={0.5} depthWrite={false} />
      </mesh>

      {/* Ground glow */}
      <mesh ref={glowRef} position={[0, -groundOffset + 0.025, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.6 * flatScale, 24]} />
        <meshBasicMaterial color="#FFD700" transparent opacity={0.3} depthWrite={false} />
      </mesh>

      {/* Vertical spotlight beam */}
      <mesh ref={beamRef} position={[0, 1.2, 0]}>
        <cylinderGeometry args={[0.03, 0.25, 4, 12, 1, true]} />
        <meshBasicMaterial color="#FFD700" transparent opacity={0.12} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>

      {/* Sparkle particles */}
      <SpotlightSparkles flatScale={flatScale} color={color} />
    </>
  )
}

function SpotlightSparkles({ flatScale, color }: { flatScale: number, color: string }) {
  const particlesRef = useRef<THREE.Group>(null!)

  const sparkles = useMemo(() =>
    Array.from({ length: 8 }).map((_, i) => ({
      angle: (i / 8) * Math.PI * 2,
      radius: 0.4 + Math.random() * 0.3,
      speed: 0.5 + Math.random() * 1,
      yOffset: Math.random() * 0.8,
      size: 0.02 + Math.random() * 0.02,
    })), []
  )

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (particlesRef.current) {
      particlesRef.current.children.forEach((child, i) => {
        const s = sparkles[i]
        const angle = s.angle + t * s.speed
        child.position.x = Math.cos(angle) * s.radius * flatScale
        child.position.z = Math.sin(angle) * s.radius * flatScale
        child.position.y = s.yOffset + Math.sin(t * 2 + i) * 0.15
        ;((child as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = 0.4 + Math.sin(t * 4 + i * 2) * 0.4
      })
    }
  })

  return (
    <group ref={particlesRef}>
      {sparkles.map((s, i) => (
        <mesh key={i} position={[0, s.yOffset, 0]}>
          <circleGeometry args={[s.size, 8]} />
          <meshBasicMaterial
            color={i % 2 === 0 ? '#FFD700' : color}
            transparent
            opacity={0.6}
          />
        </mesh>
      ))}
    </group>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// STICK FIGURE — FLAT 2.5D like Paper Mario / Game & Watch!
// "Every character should feel like a paper cutout dancing in 3D space" — Miyamoto
//
// KEY FEATURES:
// 1. FLAT planeGeometry for limbs — 2D cutouts!
// 2. circleGeometry for head with PFP texture
// 3. MeshBasicMaterial ONLY — NO shading, NO mud!
// 4. Thick black outlines for that sticker look
// 5. Billboard facing — always faces camera!
// ═══════════════════════════════════════════════════════════════════════════
function StickFigure({ position, avatar, danceMove, speech, color, scale = 1.4, showUsername = true, isUser = false }: StickFigureProps) {
  const groupRef = useRef<THREE.Group>(null!)
  const headRef = useRef<THREE.Group>(null!)
  const { camera } = useThree()
  const [angles, setAngles] = useState<LimbAngles>(() => getDanceFrame(danceMove, 0))
  const [showSpeech, setShowSpeech] = useState(isUser ? false : !!speech)
  const [headLookUp, setHeadLookUp] = useState(0)
  const [introProgress, setIntroProgress] = useState(0)

  const getRandomSlang = () => {
    const allSlang = [...CRYPTO_SLANG_YES, ...CRYPTO_SLANG_NO, ...CRYPTO_SLANG_NEUTRAL]
    return allSlang[Math.floor(Math.random() * allSlang.length)]
  }
  const [currentSpeech, setCurrentSpeech] = useState(speech || getRandomSlang())

  // Extract username from avatar path
  const username = useMemo(() => {
    const match = avatar.match(/\/([^\/]+)\.[^.]+$/)
    return match ? match[1] : 'anon'
  }, [avatar])

  // Intro animation stagger
  const spawnDelay = useMemo(() => Math.random() * 0.4, [])

  // Calculate ground offset for proper floor placement
  const flatScale = scale * 1.2
  const thighLength = 0.32 * flatScale
  const shinLength = 0.32 * flatScale
  const groundOffset = thighLength + shinLength

  // Load avatar texture
  const texture = useLoader(THREE.TextureLoader, avatar)

  useMemo(() => {
    if (texture) {
      texture.colorSpace = THREE.SRGBColorSpace
      texture.minFilter = THREE.LinearFilter
      texture.magFilter = THREE.LinearFilter
    }
  }, [texture])

  // Animate dance + billboard facing + intro
  useFrame(({ clock }) => {
    if (!groupRef.current) return

    const time = clock.elapsedTime

    // Intro animation
    const introTime = Math.max(0, time - spawnDelay)
    const newIntroProgress = Math.min(1, introTime * 2.5)
    setIntroProgress(newIntroProgress)

    const easeOutBounce = (t: number) => {
      if (t < 0.5) return 4 * t * t * t
      return 1 - Math.pow(-2 * t + 2, 3) / 2
    }

    const easedProgress = easeOutBounce(newIntroProgress)

    // Bouncy idle animation
    const bounceFreq = 8 + (danceMove % 4)
    const bounceAmp = 0.06
    const squashStretch = 1 + Math.sin(time * bounceFreq) * bounceAmp

    const baseScale = easedProgress * scale
    groupRef.current.scale.set(
      baseScale * (1 + (1 - squashStretch) * 0.3),
      baseScale * squashStretch,
      baseScale
    )

    const dropHeight = (1 - easedProgress) * 3

    // Dance animation
    const newAngles = getDanceFrame(danceMove, time)
    setAngles(newAngles)

    groupRef.current.position.y = position[1] + groundOffset + newAngles.torso.bob * scale + dropHeight

    // Billboard facing
    const cameraPos = camera.position.clone()
    cameraPos.y = groupRef.current.position.y
    groupRef.current.lookAt(cameraPos)

    // Head tilt toward camera
    const charWorldPos = new THREE.Vector3(position[0], groupRef.current.position.y, position[2])
    const toCam = camera.position.clone().sub(charWorldPos)
    const horizontalDist = Math.sqrt(toCam.x * toCam.x + toCam.z * toCam.z)
    const verticalDist = toCam.y

    const lookUpAngle = Math.atan2(verticalDist, horizontalDist)
    const targetTilt = Math.min(0.6, Math.max(0, lookUpAngle * 0.7))
    setHeadLookUp(prev => prev + (targetTilt - prev) * 0.1)

    // Intro wobble
    if (newIntroProgress < 1) {
      groupRef.current.rotation.z = Math.sin(introTime * 15) * (1 - newIntroProgress) * 0.3
    }
  })

  // Cycle speech bubbles
  useEffect(() => {
    if (isUser) return

    if (!speech) {
      const interval = setInterval(() => {
        const show = Math.random() > 0.6
        setShowSpeech(show)
        if (show) {
          setCurrentSpeech(getRandomSlang())
        }
      }, 3000 + Math.random() * 4000)
      return () => clearInterval(interval)
    }
  }, [speech, isUser])

  // PAPER MARIO PROPORTIONS — Flat & stylized!
  const bodyColor = color
  const outlineColor = '#000000'
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
        <group
          ref={headRef}
          position={[0, torsoHeight + headSize * 0.9, 0]}
          rotation={[-headLookUp, 0, angles.head.tilt]}
        >
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

        {/* ═══ SPEECH BUBBLE ═══ */}
        {showSpeech && (() => {
          const fullText = `${username}: ${currentSpeech}`
          const charWidth = 0.085
          const textWidth = fullText.length * charWidth
          const bubbleWidth = Math.max(1.0, Math.min(3.5, textWidth + 0.12))
          const halfWidth = bubbleWidth / 2
          const bubbleHeight = 0.32

          return (
            <Billboard
              position={[headSize * 2.0, torsoHeight + headSize * 2.4, 0]}
              follow={true}
              lockX={false}
              lockY={false}
              lockZ={false}
            >
              {/* Border — zone colored */}
              <mesh position={[0, 0, -0.035]}>
                <planeGeometry args={[bubbleWidth + 0.03, bubbleHeight + 0.03]} />
                <meshBasicMaterial color={color} />
              </mesh>
              {/* Glow */}
              <mesh position={[0, 0, -0.04]}>
                <planeGeometry args={[bubbleWidth + 0.08, bubbleHeight + 0.08]} />
                <meshBasicMaterial color={color} transparent opacity={0.15} />
              </mesh>
              {/* Dark background */}
              <mesh position={[0, 0, -0.02]}>
                <planeGeometry args={[bubbleWidth, bubbleHeight]} />
                <meshBasicMaterial color="#0a0a12" />
              </mesh>

              {/* Name: message */}
              <Text
                position={[-halfWidth + 0.06, 0, 0]}
                fontSize={0.14}
                anchorX="left"
                anchorY="middle"
              >
                <meshBasicMaterial color={color} />
                {username}:
              </Text>
              <Text
                position={[-halfWidth + 0.06 + (username.length + 1) * 0.078, 0, 0.001]}
                fontSize={0.14}
                color="#ffffff"
                anchorX="left"
                anchorY="middle"
              >
                {currentSpeech}
              </Text>

              {/* Tail */}
              <mesh position={[-halfWidth + 0.12, -0.22, -0.03]} rotation={[0, 0, Math.PI / 4]}>
                <planeGeometry args={[0.09, 0.09]} />
                <meshBasicMaterial color={color} />
              </mesh>
              <mesh position={[-halfWidth + 0.12, -0.20, -0.02]} rotation={[0, 0, Math.PI / 4]}>
                <planeGeometry args={[0.06, 0.06]} />
                <meshBasicMaterial color="#0a0a12" />
              </mesh>
            </Billboard>
          )
        })()}

        {/* ═══ LEFT ARM ═══ */}
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

        {/* ═══ RIGHT ARM ═══ */}
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

      {/* ═══ LEFT LEG ═══ */}
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
            <group position={[0, 0, 0.02]}>
              <PaperSneaker scale={flatScale} color={bodyColor} />
            </group>
          </Limb>
        </Limb>
      </group>

      {/* ═══ RIGHT LEG ═══ */}
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
            <group position={[0, 0, 0.02]}>
              <PaperSneaker scale={flatScale} color={bodyColor} />
            </group>
          </Limb>
        </Limb>
      </group>

      {/* ═══ SHADOW ═══ */}
      <mesh position={[0, -groundOffset + 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[1, 0.55, 1]}>
        <circleGeometry args={[0.22 * flatScale, 16]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.4 * introProgress} />
      </mesh>

      {/* Zone glow under feet */}
      <mesh position={[0, -groundOffset + 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.28 * flatScale, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.25} />
      </mesh>

      {/* ═══ USER SPOTLIGHT ═══ */}
      {isUser && <UserSpotlight groundOffset={groundOffset} flatScale={flatScale} color={color} />}

      {/* ═══ SPAWN BURST ═══ */}
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
              <circleGeometry args={[0.04 * (1 - (introProgress - 0.85) * 8), 8]} />
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
  isMobile?: boolean
  dropIn?: boolean
}

export function DancerGroup({ dancers, zoneRanges, gridCols, gridRows, tileSize, tileGap, isMobile = false, dropIn = false }: DancerGroupProps) {
  const unit = tileSize + tileGap
  const halfW = (gridCols * unit) / 2
  const halfD = (gridRows * unit) / 2
  const groupRef = useRef<THREE.Group>(null)
  const animProgress = useRef(1)
  const wasDropIn = useRef(false)
  const targetScale = useRef(1)

  useFrame((_, delta) => {
    if (!groupRef.current) return

    if (dropIn && !wasDropIn.current) {
      animProgress.current = 0
      wasDropIn.current = true
    } else if (!dropIn) {
      wasDropIn.current = false
    }

    if (animProgress.current < 1) {
      animProgress.current = Math.min(1, animProgress.current + delta * 2.5)
      const t = animProgress.current
      const elasticOut = 1 - Math.pow(1 - t, 2.5) * Math.cos(t * Math.PI * 1.2)
      targetScale.current = Math.min(1.08, elasticOut)
    } else {
      targetScale.current = 1
    }

    const currentScale = groupRef.current.scale.x
    const newScale = currentScale + (targetScale.current - currentScale) * 0.15
    groupRef.current.scale.setScalar(newScale)
  })

  const dancerPositions = useMemo(() => {
    return dancers.map((dancer) => {
      const zone = zoneRanges.find(z => z.optionId === dancer.zoneId)
      if (!zone) return null

      const seed = hashString(dancer.id)
      const zoneCols = zone.colEnd - zone.colStart
      const col = zone.colStart + Math.floor(seededRandom(seed) * zoneCols)
      const row = Math.floor(seededRandom(seed + 1) * gridRows)

      const x = (col + 0.5) * unit - halfW
      const z = (row + 0.5) * unit - halfD

      return {
        ...dancer,
        position: [x, 0.98, z] as [number, number, number],
        danceMove: dancer.danceMove ?? (seed % 10),
        color: zone.color,
      }
    }).filter(Boolean)
  }, [dancers, zoneRanges, gridCols, gridRows, unit, halfW, halfD])

  return (
    <group ref={groupRef}>
      {dancerPositions.map((dancer) => {
        const baseScale = isMobile ? 0.85 : 1.3
        const userScale = dancer.isUser ? baseScale * 1.5 : baseScale

        return dancer && (
          <StickFigure
            key={dancer.id}
            position={dancer.position}
            avatar={dancer.avatar}
            danceMove={dancer.danceMove}
            speech={dancer.speech}
            color={dancer.color}
            scale={userScale}
            showUsername={!isMobile}
            isUser={dancer.isUser}
          />
        )
      })}
    </group>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
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
