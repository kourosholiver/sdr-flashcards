// ── Game Audio Engine ─────────────────────────────────────────────────────────
// Web Audio API — no external dependencies, silent-fails on unsupported browsers

let introCtx = null
let introInterval = null
let introBarStart = 0
let introBarCount = 0

const BPM = 132
const BEAT = 60 / BPM          // 0.454 s
const BAR  = BEAT * 4          // 1.818 s
const STEP = BEAT / 2          // 8th note

// C major pentatonic arp
const ARP = [523.25, 659.25, 783.99, 880.00, 1046.5, 880.00, 783.99, 659.25]

function osc(ctx, freq, start, dur, type = 'sine', vol = 0.12) {
  const o = ctx.createOscillator()
  const g = ctx.createGain()
  o.type = type
  o.frequency.value = freq
  g.gain.setValueAtTime(0, start)
  g.gain.linearRampToValueAtTime(vol, start + 0.01)
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur)
  o.connect(g); g.connect(ctx.destination)
  o.start(start); o.stop(start + dur + 0.02)
}

function kick(ctx, t) {
  const o = ctx.createOscillator()
  const g = ctx.createGain()
  o.frequency.setValueAtTime(140, t)
  o.frequency.exponentialRampToValueAtTime(28, t + 0.18)
  g.gain.setValueAtTime(0.55, t)
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22)
  o.connect(g); g.connect(ctx.destination)
  o.start(t); o.stop(t + 0.25)
}

function snare(ctx, t) {
  const size = Math.floor(ctx.sampleRate * 0.12)
  const buf  = ctx.createBuffer(1, size, ctx.sampleRate)
  const d    = buf.getChannelData(0)
  for (let i = 0; i < size; i++) d[i] = Math.random() * 2 - 1
  const src  = ctx.createBufferSource()
  const filt = ctx.createBiquadFilter()
  const g    = ctx.createGain()
  filt.type = 'highpass'; filt.frequency.value = 900
  src.buffer = buf
  src.connect(filt); filt.connect(g); g.connect(ctx.destination)
  g.gain.setValueAtTime(0.22, t)
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.1)
  src.start(t)
}

function hat(ctx, t) {
  const size = Math.floor(ctx.sampleRate * 0.04)
  const buf  = ctx.createBuffer(1, size, ctx.sampleRate)
  const d    = buf.getChannelData(0)
  for (let i = 0; i < size; i++) d[i] = Math.random() * 2 - 1
  const src  = ctx.createBufferSource()
  const filt = ctx.createBiquadFilter()
  const g    = ctx.createGain()
  filt.type = 'highpass'; filt.frequency.value = 6000
  src.buffer = buf
  src.connect(filt); filt.connect(g); g.connect(ctx.destination)
  g.gain.setValueAtTime(0.06, t)
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.04)
  src.start(t)
}

function scheduleBar(ctx, barStart, idx) {
  // Kick: beats 1 & 3
  kick(ctx, barStart)
  kick(ctx, barStart + BEAT * 2)
  // Snare: beats 2 & 4
  snare(ctx, barStart + BEAT)
  snare(ctx, barStart + BEAT * 3)
  // Hi-hats: every 8th
  for (let i = 0; i < 8; i++) hat(ctx, barStart + i * STEP)
  // Synth arp (8th notes)
  for (let i = 0; i < 8; i++) {
    const freq = ARP[(idx * 8 + i) % ARP.length]
    osc(ctx, freq, barStart + i * STEP, STEP * 0.75, 'square', 0.07)
    // Bass on downbeats
    if (i % 4 === 0) osc(ctx, freq / 2, barStart + i * STEP, STEP * 1.8, 'sine', 0.14)
  }
}

export function startIntroMusic() {
  try {
    stopIntroMusic()
    introCtx     = new (window.AudioContext || window.webkitAudioContext)()
    introBarStart = introCtx.currentTime + 0.08
    introBarCount = 0

    const pump = () => {
      if (!introCtx) return
      while (introBarStart < introCtx.currentTime + 0.6) {
        scheduleBar(introCtx, introBarStart, introBarCount)
        introBarStart += BAR
        introBarCount++
      }
    }
    pump()
    introInterval = setInterval(pump, 200)
  } catch (_) { /* silent fail */ }
}

export function stopIntroMusic() {
  if (introInterval) { clearInterval(introInterval); introInterval = null }
  if (introCtx)      { introCtx.close().catch(() => {}); introCtx = null }
}

// ── Fanfare — plays when quiz starts ─────────────────────────────────────────
export function playFanfare() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const t   = ctx.currentTime

    // Ascending triad: C-E-G-C (up)
    const melody = [
      [523.25, 0.00, 0.14, 'square', 0.22],
      [659.25, 0.14, 0.14, 'square', 0.22],
      [783.99, 0.28, 0.14, 'square', 0.22],
      [1046.5, 0.42, 0.55, 'square', 0.28],
    ]
    melody.forEach(([f, s, d, tp, v]) => osc(ctx, f, t + s, d, tp, v))

    // Bass harmony
    osc(ctx, 130.81, t + 0.0,  0.9, 'sine', 0.18)  // C3
    osc(ctx, 196.00, t + 0.0,  0.9, 'sine', 0.12)  // G3

    // Drum hits on each note
    ;[0.0, 0.14, 0.28, 0.42].forEach(s => kick(ctx, t + s))
    snare(ctx, t + 0.42)

    setTimeout(() => ctx.close().catch(() => {}), 2500)
  } catch (_) { /* silent fail */ }
}

// ── Correct / Incorrect stings ───────────────────────────────────────────────
export function playCorrect() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const t   = ctx.currentTime
    osc(ctx, 783.99, t,        0.12, 'sine', 0.2)
    osc(ctx, 1046.5, t + 0.12, 0.25, 'sine', 0.22)
    setTimeout(() => ctx.close().catch(() => {}), 1000)
  } catch (_) {}
}

export function playIncorrect() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const t   = ctx.currentTime
    osc(ctx, 220, t,       0.18, 'sawtooth', 0.15)
    osc(ctx, 185, t + 0.18, 0.25, 'sawtooth', 0.12)
    setTimeout(() => ctx.close().catch(() => {}), 1000)
  } catch (_) {}
}
