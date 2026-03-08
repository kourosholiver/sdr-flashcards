import { useEffect, useState } from 'react'
import { SDRS } from '../data/sdrs'
import { startIntroMusic, stopIntroMusic, playFanfare } from '../utils/gameAudio'
import './StandupIntro.css'

// Positions each avatar flies in from (off-screen corners → final grid slot)
const POSITIONS = [
  { from: 'top-left',     label: 'top-left' },
  { from: 'top-right',    label: 'top-right' },
  { from: 'bottom-left',  label: 'bottom-left' },
  { from: 'bottom-right', label: 'bottom-right' },
]

// Absurd game-show one-liners shown randomly at the bottom
const TAGLINES = [
  'May the best pitch win.',
  'No gatekeeper can save you now.',
  '"I went to Cambridge." — someone, probably.',
  'Objection handling or elimination. Your choice.',
  "Today's quiz. Tomorrow's commission.",
  'Warwick has been training for this. Allegedly.',
  'Ben has already written his LinkedIn post about winning.',
  "Gayatri has a plan. She hasn't told us what it is.",
  'Kiye is legally required to win three times in a row.',
]

export default function StandupIntro({ onStart }) {
  const [ready, setReady] = useState(false)   // avatars have landed
  const [launching, setLaunching] = useState(false) // start button pressed
  const [musicStarted, setMusicStarted] = useState(false)

  // Music starts on first meaningful interaction (avoids autoplay block)
  const ensureMusic = () => {
    if (!musicStarted) {
      startIntroMusic()
      setMusicStarted(true)
    }
  }

  // Auto-try music after brief delay (works if user already interacted with page)
  useEffect(() => {
    const t = setTimeout(() => {
      try { startIntroMusic(); setMusicStarted(true) } catch (_) {}
    }, 400)
    return () => clearTimeout(t)
  }, [])

  // Mark avatars as "landed" after animation completes
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 1600)
    return () => clearTimeout(t)
  }, [])

  const handleStart = () => {
    ensureMusic()
    stopIntroMusic()
    playFanfare()
    setLaunching(true)
    setTimeout(onStart, 900)
  }

  return (
    <div className={`intro ${launching ? 'intro--out' : ''}`} onMouseMove={ensureMusic}>
      {/* Starfield */}
      <div className="intro-stars" aria-hidden>
        {Array.from({ length: 60 }, (_, i) => (
          <div
            key={i}
            className="intro-star"
            style={{
              left:              `${Math.random() * 100}%`,
              top:               `${Math.random() * 100}%`,
              animationDelay:    `${Math.random() * 3}s`,
              animationDuration: `${1.5 + Math.random() * 2.5}s`,
              width:             `${1 + Math.random() * 3}px`,
              height:            `${1 + Math.random() * 3}px`,
            }}
          />
        ))}
      </div>

      {/* Title */}
      <div className="intro-title">
        <span className="intro-title-trophy">🏆</span>
        <div>
          <h1 className="intro-heading">SDR QUIZ</h1>
          <h1 className="intro-heading intro-heading--glow">SHOWDOWN</h1>
        </div>
        <span className="intro-title-trophy">🏆</span>
      </div>

      <p className="intro-subtitle">Who will be today's SDR champion?</p>

      {/* Avatars — 2×2 grid, each flies in from its corner */}
      <div className="intro-avatars">
        {SDRS.map((sdr, i) => (
          <div
            key={sdr.name}
            className={`intro-av intro-av--${POSITIONS[i].from}`}
            style={{ '--sdr-color': sdr.color, '--sdr-bg': sdr.bg }}
          >
            <div className="intro-av-ring">
              <img src={sdr.avatar} alt={sdr.name} className="intro-av-img" />
            </div>
            <span className="intro-av-name">{sdr.name}</span>
            <span className="intro-av-title">{sdr.title}</span>
          </div>
        ))}
      </div>

      {/* Big start button */}
      <button
        className={`intro-start ${ready ? 'intro-start--ready' : ''}`}
        onClick={handleStart}
        disabled={launching}
      >
        <span className="intro-start-icon">🎮</span>
        <span>LET'S GO</span>
      </button>

      <p className="intro-hint">Press when everyone's ready</p>
    </div>
  )
}
