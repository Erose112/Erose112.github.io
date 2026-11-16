import { useEffect, useRef, useState } from 'react'
import { CUE_BLINK_MS } from '../game/constants.js'
import { Game } from '../game/Game.js'

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

/**
 * @param {{
 *   mode: 'world' | 'transition' | 'section' | 'plain',
 *   wipe: 'none' | 'enter' | 'exit',
 *   onGameReady: (game: import('../game/Game.js').Game) => void,
 *   onPortalEnter: (id: 'about' | 'experience' | 'projects', game: import('../game/Game.js').Game) => void,
 * }} props
 */
export default function World({ mode, wipe, onGameReady, onPortalEnter }) {
  const canvasRef = useRef(null)
  const gameRef = useRef(null)
  const observerRef = useRef(null)
  const labelRefs = useRef({})
  const modeRef = useRef(mode)
  const [proximityId, setProximityId] = useState(null)
  const [cueVisible, setCueVisible] = useState(true)
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

  const onGameReadyRef = useRef(onGameReady)
  const onPortalEnterRef = useRef(onPortalEnter)

  useEffect(() => {
    modeRef.current = mode
    onGameReadyRef.current = onGameReady
    onPortalEnterRef.current = onPortalEnter
  }, [mode, onGameReady, onPortalEnter])

  useEffect(() => {
    if (!proximityId || reduceMotion || mode !== 'world') {
      return undefined
    }
    const id = window.setInterval(() => {
      setCueVisible((v) => !v)
    }, CUE_BLINK_MS)
    return () => window.clearInterval(id)
  }, [proximityId, reduceMotion, mode])

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
        if (modeRef.current !== 'world') {
          return
        }
        onPortalEnterRef.current(id, game)
      },
    })
    gameRef.current = game
    if (import.meta.env.DEV) {
      canvas.__portfolioGame = game
    }
    onGameReadyRef.current(game)

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

  useEffect(() => {
    const game = gameRef.current
    if (!game) {
      return
    }
    if (mode === 'world' || mode === 'transition') {
      game.setLoopMode(mode)
    } else if (mode === 'section') {
      game.setLoopMode('section')
    } else if (mode === 'plain') {
      game.setLoopMode('plain')
    }
  }, [mode])

  const cueText = (() => {
    if (!proximityId) {
      return ''
    }
    const name = PORTAL_ARIA_NAMES[proximityId] ?? proximityId
    const action = coarsePointer ? 'Tap jump' : 'Press Space'
    return `${name} portal. ${action} to enter.`
  })()

  const showCue =
    mode === 'world' && proximityId && (reduceMotion || cueVisible)

  const shellClass = [
    'world-shell fixed inset-0',
    wipe === 'enter' && !reduceMotion ? 'world-shell--wipe-enter' : '',
    wipe === 'exit' && !reduceMotion ? 'world-shell--wipe-exit' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={shellClass}>
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
        style={{
          opacity: showCue ? 1 : proximityId && mode === 'world' && !reduceMotion ? 0.15 : 1,
        }}
        aria-live="polite"
        role="status"
      >
        {mode === 'world' ? (proximityId ? cueText : '\u00a0') : '\u00a0'}
      </p>
    </div>
  )
}