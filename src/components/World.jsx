import { useEffect, useRef, useState } from 'react'
import { CUE_BLINK_MS, WELCOME_BLINK_MS, WELCOME_DISMISS_MS } from '../game/constants.js'
import { Game } from '../game/Game.js'
import {
  formatHiLabel,
  readHiScore,
  readSlowMode,
} from '../game/runner/storage.js'
import Hud from './Hud.jsx'
import RunnerOverlay from './RunnerOverlay.jsx'
import TouchControls from './TouchControls.jsx'

const PORTAL_LABELS = [
  { id: 'about', text: 'ABOUT' },
  { id: 'experience', text: 'EXPERIENCE' },
  { id: 'projects', text: 'PROJECTS' },
]

const PORTAL_ARIA_NAMES = {
  about: 'About',
  experience: 'Experience',
  projects: 'Projects',
  dino: 'Dino Run',
}

/**
 * @param {{
 *   mode: 'world' | 'transition' | 'section' | 'plain' | 'runner',
 *   wipe: 'none' | 'enter' | 'exit',
 *   visited: Set<string>,
 *   onSkip: () => void,
 *   worldCanvasRef?: import('react').RefObject<HTMLCanvasElement | null>,
 *   exitAnnouncement?: string,
 *   onGameReady: (game: import('../game/Game.js').Game) => void,
 *   onPortalEnter: (id: 'about' | 'experience' | 'projects' | 'dino', game: import('../game/Game.js').Game) => void,
 *   onRunnerBack?: () => void,
 * }} props
 */
export default function World({
  mode,
  wipe,
  visited,
  onSkip,
  worldCanvasRef,
  exitAnnouncement = '',
  onGameReady,
  onPortalEnter,
  onRunnerBack,
}) {
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
  const [gameInput, setGameInput] = useState(
    /** @type {import('../game/input.js').GameInput | null} */ (null),
  )
  const [welcomeOpen, setWelcomeOpen] = useState(true)
  const [welcomeBlink, setWelcomeBlink] = useState(true)
  const [welcomeAnchor, setWelcomeAnchor] = useState(
    /** @type {{ x: number, y: number } | null} */ (null),
  )
  const [runnerPhase, setRunnerPhase] = useState(
    /** @type {'ready' | 'playing' | 'paused' | 'over'} */ ('ready'),
  )
  const [runnerAnnounce, setRunnerAnnounce] = useState('')
  const [runnerMuted, setRunnerMuted] = useState(true)
  const [runnerSlow, setRunnerSlow] = useState(() =>
    typeof window !== 'undefined' ? readSlowMode() : false,
  )
  const [runnerRmNoteDismissed, setRunnerRmNoteDismissed] = useState(false)
  const [dinoHiLabel, setDinoHiLabel] = useState(() => formatHiLabel(readHiScore()))
  const runnerRestartRef = useRef(/** @type {HTMLButtonElement | null} */ (null))

  const onGameReadyRef = useRef(onGameReady)
  const onPortalEnterRef = useRef(onPortalEnter)
  const onRunnerBackRef = useRef(onRunnerBack)

  useEffect(() => {
    modeRef.current = mode
    onGameReadyRef.current = onGameReady
    onPortalEnterRef.current = onPortalEnter
    onRunnerBackRef.current = onRunnerBack
  }, [mode, onGameReady, onPortalEnter, onRunnerBack])

  useEffect(() => {
    if (!welcomeOpen || reduceMotion) {
      return undefined
    }
    const id = window.setInterval(() => {
      setWelcomeBlink((v) => !v)
    }, WELCOME_BLINK_MS)
    return () => window.clearInterval(id)
  }, [welcomeOpen, reduceMotion])

  useEffect(() => {
    if (!welcomeOpen) {
      return undefined
    }
    const id = window.setTimeout(() => setWelcomeOpen(false), WELCOME_DISMISS_MS)
    return () => window.clearTimeout(id)
  }, [welcomeOpen])

  useEffect(() => {
    if (!welcomeOpen || mode !== 'world') {
      return undefined
    }
    let raf = 0
    const tick = () => {
      const game = gameRef.current
      if (game) {
        const head = game.getDinoScreenHead()
        setWelcomeAnchor({ x: head.x, y: head.y - 56 })
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [welcomeOpen, mode])

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
      onFirstMovement: () => setWelcomeOpen(false),
    })
    gameRef.current = game
    if (worldCanvasRef) {
      worldCanvasRef.current = canvas
    }
    if (import.meta.env.DEV) {
      canvas.__portfolioGame = game
    }
    game.onRunnerGameOver = () => {
      requestAnimationFrame(() => {
        runnerRestartRef.current?.focus({ preventScroll: true })
      })
    }
    game.onRunnerExit = () => onRunnerBackRef.current?.()
    game.onRunnerAnnounce = (message) => setRunnerAnnounce(message)
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

    let cancelled = false
    let phaseRaf = 0
    const pollRunnerPhase = () => {
      const runner = game.runner
      if (runner && !runner.disposed) {
        setRunnerPhase(runner.phase)
      }
      phaseRaf = requestAnimationFrame(pollRunnerPhase)
    }
    ;(async () => {
      await game.start()
      if (cancelled) {
        return
      }
      setGameInput(game.input)
      canvas.focus({ preventScroll: true })
      phaseRaf = requestAnimationFrame(pollRunnerPhase)
    })()

    return () => {
      cancelled = true
      cancelAnimationFrame(phaseRaf)
      ro.disconnect()
      observerRef.current = null
      game.destroy()
      gameRef.current = null
      setGameInput(null)
    }
  }, [worldCanvasRef])

  useEffect(() => {
    if (mode === 'world') {
      setDinoHiLabel(formatHiLabel(readHiScore()))
    }
  }, [mode])

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
    } else if (mode === 'runner') {
      game.setLoopMode('runner')
      game.startRunner()
      setRunnerPhase(game.runner?.phase ?? 'ready')
      setRunnerSlow(game.runner?.slowMode ?? readSlowMode())
      setRunnerMuted(game.runner?.isMuted() ?? true)
      setRunnerAnnounce('')
    }
  }, [mode])

  useEffect(() => {
    if (mode === 'runner' && runnerPhase === 'over') {
      runnerRestartRef.current?.focus({ preventScroll: true })
    }
  }, [mode, runnerPhase])

  const handleRunnerRestart = () => {
    const game = gameRef.current
    game?.runner?.restartAfterCrash()
    canvasRef.current?.focus({ preventScroll: true })
  }

  const handleRunnerResume = () => {
    gameRef.current?.runner?.resumeFromPause()
    canvasRef.current?.focus({ preventScroll: true })
  }

  const handleRunnerToggleMute = () => {
    const muted = gameRef.current?.runner?.toggleMute()
    if (typeof muted === 'boolean') {
      setRunnerMuted(muted)
    }
  }

  const handleRunnerSlowChange = (slow) => {
    setRunnerSlow(slow)
    gameRef.current?.runner?.setSlowMode(slow)
  }

  const runnerAriaLabel = (() => {
    const base =
      'Dino Run side scroller. Move up and down with arrow keys, W and S, or the vertical touch stick.'
    if (runnerPhase === 'ready') {
      return `${base} Press Space to start or tap the playfield. Escape leaves.`
    }
    if (runnerPhase === 'playing') {
      return `${base} Escape pauses. M toggles sound.`
    }
    if (runnerPhase === 'paused') {
      return `${base} Escape or Resume continues. Back returns to the desert.`
    }
    return `${base} Restart or Back to world. Escape leaves.`
  })()

  const cueText = (() => {
    if (!proximityId) {
      return ''
    }
    if (proximityId === 'dino') {
      return coarsePointer
        ? 'Dino Run. Tap jump to enter.'
        : 'Dino Run. Press Space to enter.'
    }
    const name = PORTAL_ARIA_NAMES[proximityId] ?? proximityId
    const action = coarsePointer ? 'Tap jump' : 'Press Space'
    return `${name} portal. ${action} to enter.`
  })()

  const showCue =
    mode === 'world' && proximityId && (reduceMotion || cueVisible)

  const showHud = mode === 'world' || mode === 'transition'
  const showTouch =
    coarsePointer &&
    (mode === 'world' || mode === 'transition' || mode === 'runner')
  const touchAxisLock = mode === 'runner' ? 'vertical' : 'plane'
  const touchHideJump = mode === 'runner'
  const showRunnerChrome = mode === 'runner'

  const preventGameDefault = () => {
    const game = gameRef.current
    if (!game) {
      return false
    }
    if (game.loopMode === 'runner') {
      return game.runner?.wantsKeyboardCapture() ?? false
    }
    return game.loopMode === 'world' || game.loopMode === 'transition'
  }

  const welcomeLines = coarsePointer
    ? {
        title: 'EXPLORE THE WORLD',
        body: 'USE THE STICK TO WALK. TAP JUMP TO ENTER.',
      }
    : {
        title: 'EXPLORE THE WORLD',
        body: 'WALK TO A GATE. PRESS SPACE TO JUMP IN.',
      }

  const shellClass = [
    'world-shell fixed inset-0',
    wipe === 'enter' && !reduceMotion ? 'world-shell--wipe-enter' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={shellClass}>
      <p className="sr-only" aria-live="polite">
        {exitAnnouncement}
      </p>
      <Hud onSkip={onSkip} show={showHud} />
      <TouchControls
        input={gameInput}
        show={showTouch}
        shouldPreventDefault={preventGameDefault}
        axisLock={touchAxisLock}
        hideJump={touchHideJump}
      />
      <canvas
        ref={(node) => {
          canvasRef.current = node
          if (worldCanvasRef) {
            worldCanvasRef.current = node
          }
        }}
        className="world-canvas relative z-0 block h-full w-full touch-none"
        width={1}
        height={1}
        tabIndex={0}
        aria-label={mode === 'runner' ? runnerAriaLabel : 'Desert game. Move with WASD or arrow keys. Press Space to jump into portals.'}
        onPointerDown={() => {
          canvasRef.current?.focus({ preventScroll: true })
          if (mode === 'runner' && coarsePointer) {
            gameInput?.queueTouchJump()
          }
        }}
        onPointerUp={() => {
          if (mode === 'runner') {
            gameInput?.releaseTouchJump()
          }
        }}
        onPointerCancel={() => {
          if (mode === 'runner') {
            gameInput?.releaseTouchJump()
          }
        }}
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
            className={[
              'portal-label font-display absolute left-0 top-0 whitespace-nowrap',
              visited.has(id) ? 'portal-label--visited' : 'text-ink',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {text}
          </div>
        ))}
        <div
          ref={(node) => {
            labelRefs.current.dino = node
          }}
          className="portal-label portal-label--dino font-display absolute left-0 top-0 text-center text-ink"
        >
          <span className="block whitespace-nowrap">DINO RUN</span>
          <span className="mt-1 block whitespace-nowrap text-[0.85em]">{dinoHiLabel}</span>
        </div>
      </div>
      <p className="sr-only" aria-live="polite">
        {runnerAnnounce}
      </p>
      {showRunnerChrome && onRunnerBack ? (
        <RunnerOverlay
          onBack={onRunnerBack}
          onRestart={handleRunnerRestart}
          onResume={handleRunnerResume}
          onToggleMute={handleRunnerToggleMute}
          onSlowChange={handleRunnerSlowChange}
          coarsePointer={coarsePointer}
          phase={runnerPhase}
          muted={runnerMuted}
          slowMode={runnerSlow}
          reduceMotion={reduceMotion}
          reducedMotionNoteDismissed={runnerRmNoteDismissed}
          onDismissReducedMotionNote={() => setRunnerRmNoteDismissed(true)}
          restartRef={runnerRestartRef}
        />
      ) : null}
      {welcomeOpen && mode === 'world' && welcomeAnchor ? (
        <WelcomeBanner
          reduceMotion={reduceMotion}
          welcomeBlink={welcomeBlink}
          title={welcomeLines.title}
          body={welcomeLines.body}
          anchor={welcomeAnchor}
        />
      ) : null}
      <p
        className="portal-cue font-display pointer-events-none absolute bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 z-30 w-[min(100%,22rem)] -translate-x-1/2 text-center text-base text-ink transition-none"
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

/**
 * @param {{
 *   reduceMotion: boolean,
 *   welcomeBlink: boolean,
 *   title: string,
 *   body: string,
 *   anchor: { x: number, y: number },
 * }} props
 */
function WelcomeBanner({ reduceMotion, welcomeBlink, title, body, anchor }) {
  const opacity = reduceMotion || welcomeBlink ? 1 : 0.2
  return (
    <h1
      className="welcome-banner font-display pointer-events-none absolute z-20 w-[min(100%,20rem)] -translate-x-1/2 -translate-y-full text-center text-xs text-ink transition-none sm:text-base"
      style={{ left: anchor.x, top: anchor.y }}
    >
      <span className="block" style={{ opacity }} aria-live="polite">
        {title}
      </span>
      <span className="mt-3 block text-[10px] leading-relaxed sm:text-xs" style={{ opacity }}>
        {body}
      </span>
    </h1>
  )
}