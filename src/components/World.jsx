import { useEffect, useRef, useState } from 'react'
import { CUE_BLINK_MS } from '../game/constants.js'
import { Game } from '../game/Game.js'
import ExitButton from './ExitButton.jsx'

const PORTAL_LABELS = [
  { id: 'about', text: 'ABOUT' },
  { id: 'experience', text: 'EXPERIENCE' },
  { id: 'projects', text: 'PROJECTS' },
]

const PORTAL_ARIA_NAMES = {
  about: 'About',
  experience: 'Experience',
  projects: 'Projects',
}

export default function World() {
  const canvasRef = useRef(null)
  const gameRef = useRef(null)
  const observerRef = useRef(null)
  const labelRefs = useRef({})
  const [proximityId, setProximityId] = useState(null)
  const [cueVisible, setCueVisible] = useState(true)
  const [enterFlash, setEnterFlash] = useState(null)
  const [reduceMotion] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  const [coarsePointer] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(pointer: coarse)').matches,
  )

  useEffect(() => {
    if (!proximityId || reduceMotion) {
      return undefined
    }
    const id = window.setInterval(() => {
      setCueVisible((v) => !v)
    }, CUE_BLINK_MS)
    return () => window.clearInterval(id)
  }, [proximityId, reduceMotion])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      return undefined
    }

    const game = new Game(canvas, {
      portalLabels: labelRefs.current,
      onProximity: (id) => {
        setProximityId(id)
        setCueVisible(true)
      },
      onEnter: (id) => {
        setEnterFlash(id)
        console.info(`[portal] enter: ${id}`)
      },
    })
    gameRef.current = game
    if (import.meta.env.DEV) {
      canvas.__portfolioGame = game
    }

    const ro = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) {
        game.resize()
        return
      }
      const cssW = entry.contentBoxSize?.[0]?.inlineSize ?? canvas.clientWidth
      const cssH = entry.contentBoxSize?.[0]?.blockSize ?? canvas.clientHeight
      const pixelBox = entry.devicePixelContentBoxSize?.[0]
      if (pixelBox) {
        game.resize(
          { bufferW: pixelBox.inlineSize, bufferH: pixelBox.blockSize },
          cssW,
          cssH,
        )
      } else {
        game.resize(null, cssW, cssH)
      }
    })

    try {
      ro.observe(canvas, { box: 'device-pixel-content-box' })
    } catch {
      ro.observe(canvas)
    }
    observerRef.current = ro

    game.start()
    canvas.focus({ preventScroll: true })

    return () => {
      ro.disconnect()
      observerRef.current = null
      game.destroy()
      gameRef.current = null
    }
  }, [])

  const cueText = (() => {
    if (!proximityId) {
      return ''
    }
    const name = PORTAL_ARIA_NAMES[proximityId] ?? proximityId
    const action = coarsePointer ? 'Tap jump' : 'Press Space'
    return `${name} portal. ${action} to enter.`
  })()

  const showCue = proximityId && !enterFlash && (reduceMotion || cueVisible)

  const statusText = enterFlash
    ? `Entered ${PORTAL_ARIA_NAMES[enterFlash] ?? enterFlash} (milestone 5 opens section).`
    : proximityId
      ? cueText
      : '\u00a0'

  return (
    <div className="world-shell fixed inset-0">
      <canvas
        ref={canvasRef}
        className="world-canvas relative z-0 block h-full w-full touch-none"
        width={1}
        height={1}
        tabIndex={0}
        aria-label="Desert game. Move with WASD or arrow keys. Press Space to jump into portals."
        onPointerDown={() => canvasRef.current?.focus({ preventScroll: true })}
      />
      <div
        className="portal-label-layer pointer-events-none absolute inset-0 z-10"
        aria-hidden
      >
        {PORTAL_LABELS.map(({ id, text }) => (
          <div
            key={id}
            ref={(node) => {
              labelRefs.current[id] = node
            }}
            className="portal-label font-display absolute left-0 top-0 whitespace-nowrap text-ink"
          >
            {text}
          </div>
        ))}
      </div>
      <p
        className="portal-cue font-display pointer-events-none absolute bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 z-10 w-[min(100%,22rem)] -translate-x-1/2 text-center text-base text-ink transition-none"
        style={{ opacity: showCue ? 1 : proximityId && !reduceMotion ? 0.15 : 1 }}
        aria-live="polite"
        role="status"
      >
        {statusText}
      </p>
      <ExitButton />
    </div>
  )
}