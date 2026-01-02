/**
 * Sound System — THE AUDIO FEEDBACK LAYER
 * "Every interaction should have a voice." — Nintendo DNA
 * 
 * We use Web Audio API for instant, low-latency feedback.
 * No external files needed for hover sounds — we synthesize them.
 */

// Create audio context lazily (required for mobile browsers)
let audioContext = null

const getAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)()
  }
  return audioContext
}

/**
 * Play a soft "tick" sound when hovering over a zone
 * Nintendo-style — short, satisfying, not annoying
 */
export const playHoverTick = (frequency = 800, volume = 0.1) => {
  try {
    const ctx = getAudioContext()
    if (ctx.state === 'suspended') {
      ctx.resume()
    }

    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime)

    // Quick attack, quick decay — "tick" feel
    gainNode.gain.setValueAtTime(0, ctx.currentTime)
    gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.01)
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08)

    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.1)
  } catch (e) {
    // Silently fail — sound is enhancement, not critical
  }
}

/**
 * Play a "confirmation" sound when locking into a zone
 * Two-tone ascending — feels like success
 */
export const playLockInSound = (color = '#00FF9D', volume = 0.15) => {
  try {
    const ctx = getAudioContext()
    if (ctx.state === 'suspended') {
      ctx.resume()
    }

    // Map color hue to frequency for a fun effect
    const baseFreq = 400

    // First tone
    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    osc1.connect(gain1)
    gain1.connect(ctx.destination)
    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(baseFreq, ctx.currentTime)
    gain1.gain.setValueAtTime(0, ctx.currentTime)
    gain1.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.02)
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)
    osc1.start(ctx.currentTime)
    osc1.stop(ctx.currentTime + 0.2)

    // Second tone (higher, delayed)
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.connect(gain2)
    gain2.connect(ctx.destination)
    osc2.type = 'sine'
    osc2.frequency.setValueAtTime(baseFreq * 1.5, ctx.currentTime + 0.08)
    gain2.gain.setValueAtTime(0, ctx.currentTime + 0.08)
    gain2.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.1)
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25)
    osc2.start(ctx.currentTime + 0.08)
    osc2.stop(ctx.currentTime + 0.3)
  } catch (e) {
    // Silently fail
  }
}

/**
 * Play a soft "pop" for button presses
 */
export const playButtonPop = (volume = 0.08) => {
  try {
    const ctx = getAudioContext()
    if (ctx.state === 'suspended') {
      ctx.resume()
    }

    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(600, ctx.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.1)

    gainNode.gain.setValueAtTime(volume, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1)

    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.15)
  } catch (e) {
    // Silently fail
  }
}

/**
 * Play a success chime for bet confirmation
 */
export const playSuccessChime = (volume = 0.12) => {
  try {
    const ctx = getAudioContext()
    if (ctx.state === 'suspended') {
      ctx.resume()
    }

    const notes = [523.25, 659.25, 783.99] // C5, E5, G5 - major chord
    const delay = 0.08

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'

      const startTime = ctx.currentTime + i * delay
      osc.frequency.setValueAtTime(freq, startTime)
      gain.gain.setValueAtTime(0, startTime)
      gain.gain.linearRampToValueAtTime(volume, startTime + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3)

      osc.start(startTime)
      osc.stop(startTime + 0.35)
    })
  } catch (e) {
    // Silently fail
  }
}

/**
 * NINTENDO JUICE SOUNDS
 * "Every interaction should feel like unwrapping a present" — Miyamoto
 */

/**
 * Pickup sound — Light ascending "bwip" when grabbing avatar
 */
export const playPickup = (volume = 0.1) => {
  try {
    const ctx = getAudioContext()
    if (ctx.state === 'suspended') ctx.resume()

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.type = 'sine'
    // Quick ascending pitch — "bwip!"
    osc.frequency.setValueAtTime(300, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.08)

    gain.gain.setValueAtTime(0, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1)

    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.12)
  } catch (e) {}
}

/**
 * Land sound — Satisfying "thump" with a tiny bounce
 */
export const playLand = (volume = 0.15) => {
  try {
    const ctx = getAudioContext()
    if (ctx.state === 'suspended') ctx.resume()

    // Low thump
    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    osc1.connect(gain1)
    gain1.connect(ctx.destination)

    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(150, ctx.currentTime)
    osc1.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.1)

    gain1.gain.setValueAtTime(volume, ctx.currentTime)
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)

    osc1.start(ctx.currentTime)
    osc1.stop(ctx.currentTime + 0.2)

    // High "ting" overtone
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.connect(gain2)
    gain2.connect(ctx.destination)

    osc2.type = 'triangle'
    osc2.frequency.setValueAtTime(800, ctx.currentTime)

    gain2.gain.setValueAtTime(volume * 0.3, ctx.currentTime)
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08)

    osc2.start(ctx.currentTime)
    osc2.stop(ctx.currentTime + 0.1)
  } catch (e) {}
}

/**
 * Whoosh sound — Quick descending sweep for movement/miss
 */
export const playWhoosh = (volume = 0.08) => {
  try {
    const ctx = getAudioContext()
    if (ctx.state === 'suspended') ctx.resume()

    // White noise burst filtered
    const bufferSize = ctx.sampleRate * 0.15
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize)
    }

    const noise = ctx.createBufferSource()
    noise.buffer = buffer

    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.setValueAtTime(2000, ctx.currentTime)
    filter.frequency.exponentialRampToValueAtTime(500, ctx.currentTime + 0.1)
    filter.Q.value = 1

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(volume, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)

    noise.connect(filter)
    filter.connect(gain)
    gain.connect(ctx.destination)

    noise.start(ctx.currentTime)
  } catch (e) {}
}

/**
 * Coin/cha-ching sound — For successful bet placement
 */
export const playChaChing = (volume = 0.12) => {
  try {
    const ctx = getAudioContext()
    if (ctx.state === 'suspended') ctx.resume()

    // Coin clink sequence
    const notes = [1318.51, 1567.98, 2093.00] // E6, G6, C7

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.type = 'triangle'
      const startTime = ctx.currentTime + i * 0.06

      osc.frequency.setValueAtTime(freq, startTime)
      gain.gain.setValueAtTime(0, startTime)
      gain.gain.linearRampToValueAtTime(volume, startTime + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.2)

      osc.start(startTime)
      osc.stop(startTime + 0.25)
    })
  } catch (e) {}
}

/**
 * Tile ripple sound — Soft blip for tile hover effects
 */
export const playTileBlip = (pitch = 1, volume = 0.04) => {
  try {
    const ctx = getAudioContext()
    if (ctx.state === 'suspended') ctx.resume()

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.type = 'sine'
    osc.frequency.setValueAtTime(400 * pitch, ctx.currentTime)

    gain.gain.setValueAtTime(volume, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05)

    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.06)
  } catch (e) {}
}





