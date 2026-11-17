import { useCallback, useEffect, useRef, useState } from 'react'
import PlainPage from './components/PlainPage.jsx'
import SectionFrame from './components/SectionFrame.jsx'
import World from './components/World.jsx'
import { WIPE_MS } from './game/constants.js'

const SECTION_IDS = ['about', 'experience', 'projects']

const PORTAL_FOCUS_NAMES = {
  about: 'About',
  experience: 'Experience',
  projects: 'Projects',
  dino: 'Dino Run',
}

/** @param {string} raw */
function hashBody(raw) {
  if (!raw || raw === '#') {
    return 'world'
  }
  return raw.replace(/^#/, '')
}

/** @param {string} body */
function isSectionId(body) {
  return /** @type {body is 'about' | 'experience' | 'projects'} */ (
    SECTION_IDS.includes(body)
  )
}

function readInitialShell() {
  const body = hashBody(
    typeof window !== 'undefined' ? window.location.hash : '',
  )
  if (body === 'plain') {
    return { mode: 'plain', section: null }
  }
  if (body === 'dino-run') {
    return { mode: 'runner', section: null }
  }
  if (isSectionId(body)) {
    return { mode: 'section', section: body }
  }
  return { mode: 'world', section: null }
}

export default function App() {
  const [mode, setMode] = useState(() => readInitialShell().mode)
  const [section, setSection] = useState(() => readInitialShell().section)
  const [visited, setVisited] = useState(() => new Set())
  /** @type {['none' | 'enter' | 'exit', typeof useState]} */
  const [wipe, setWipe] = useState('none')

  const dialogRef = useRef(/** @type {HTMLDialogElement | null} */ (null))
  const worldCanvasRef = useRef(/** @type {HTMLCanvasElement | null} */ (null))
  const gameRef = useRef(/** @type {import('./game/Game.js').Game | null} */ (null))
  const focusCanvasEpochRef = useRef(0)
  const modeRef = useRef(mode)
  const exitBusyRef = useRef(false)
  const pendingEnterRef = useRef(
    /** @type {'about' | 'experience' | 'projects' | 'dino' | null} */ (null),
  )
  const enteringFromHopRef = useRef(false)
  const pushedEntryRef = useRef(false)
  const lastReturnPortalRef = useRef(
    /** @type {'about' | 'experience' | 'projects' | 'dino' | null} */ (null),
  )
  const wipeTimerRef = useRef(0)
  const [exitAnnouncement, setExitAnnouncement] = useState('')
  const [focusCanvasEpoch, setFocusCanvasEpoch] = useState(0)
  const [reduceMotion] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  useEffect(() => {
    modeRef.current = mode
  }, [mode])

  const clearWipeTimer = useCallback(() => {
    if (wipeTimerRef.current) {
      window.clearTimeout(wipeTimerRef.current)
      wipeTimerRef.current = 0
    }
  }, [])

  const openSectionDialog = useCallback(() => {
    const dialog = dialogRef.current
    if (!dialog || dialog.open) {
      return
    }
    dialog.showModal()
  }, [])

  const closeSectionDialog = useCallback(() => {
    const dialog = dialogRef.current
    if (!dialog?.open) {
      return
    }
    dialog.close()
  }, [])

  const focusWorldCanvas = useCallback(() => {
    focusCanvasEpochRef.current += 1
    setFocusCanvasEpoch(focusCanvasEpochRef.current)
  }, [])

  const applyWorld = useCallback(
    (returnPortal, announcePortal) => {
      const game = gameRef.current
      game?.setLoopMode('world')
      game?.setInputLocked(false)
      game?.clearTransitionFreeze()
      if (returnPortal) {
        game?.placeDinoAtReturn(returnPortal)
      }
      setMode('world')
      setSection(null)
      setWipe('none')
      if (announcePortal) {
        const label = PORTAL_FOCUS_NAMES[announcePortal] ?? announcePortal
        setExitAnnouncement(`Back in the desert, at the ${label} portal.`)
      }
      focusWorldCanvas()
    },
    [focusWorldCanvas],
  )

  const enterRunner = useCallback(
    (fromHop) => {
      const game = gameRef.current
      closeSectionDialog()
      game?.setLoopMode('runner')
      game?.setInputLocked(false)
      game?.clearTransitionFreeze()
      if (!fromHop) {
        game?.clearTransitionFreeze()
      }
      game?.startRunner()
      setMode('runner')
      setSection(null)
      setWipe('none')
      lastReturnPortalRef.current = 'dino'
    },
    [closeSectionDialog],
  )

  const syncFromLocation = useCallback(() => {
    const body = hashBody(window.location.hash)
    const game = gameRef.current

    if (body === 'plain') {
      closeSectionDialog()
      game?.setLoopMode('plain')
      setMode('plain')
      setSection(null)
      setWipe('none')
      lastReturnPortalRef.current = null
      return
    }

    if (body === 'dino-run') {
      enterRunner(enteringFromHopRef.current)
      pendingEnterRef.current = null
      return
    }

    if (isSectionId(body)) {
      lastReturnPortalRef.current = body
      setSection(body)
      setMode('section')
      setVisited((prev) => {
        if (prev.has(body)) {
          return prev
        }
        const next = new Set(prev)
        next.add(body)
        return next
      })
      game?.setLoopMode('section')
      if (!enteringFromHopRef.current) {
        game?.clearTransitionFreeze()
        game?.placeDinoAtReturn(body)
      }
      openSectionDialog()
      setWipe('none')
      return
    }

    if (body === 'world') {
      closeSectionDialog()
      const returnPortal = lastReturnPortalRef.current
      const announce =
        returnPortal &&
        (modeRef.current === 'section' ||
          modeRef.current === 'transition' ||
          modeRef.current === 'runner')
          ? returnPortal
          : null
      applyWorld(returnPortal, announce)
      lastReturnPortalRef.current = null
      pendingEnterRef.current = null
      if (modeRef.current !== 'runner') {
        pushedEntryRef.current = false
      }
      return
    }

    closeSectionDialog()
    const returnPortal = lastReturnPortalRef.current
    const announce =
      returnPortal &&
      (modeRef.current === 'section' ||
        modeRef.current === 'transition' ||
        modeRef.current === 'runner')
        ? returnPortal
        : null
    applyWorld(returnPortal, announce)
    lastReturnPortalRef.current = null
    pendingEnterRef.current = null
    pushedEntryRef.current = false
    window.history.replaceState(null, '', '#world')
  }, [applyWorld, closeSectionDialog, enterRunner, openSectionDialog])

  const completeEnterAfterWipe = useCallback(() => {
    const id = pendingEnterRef.current
    if (!id) {
      return
    }
    enteringFromHopRef.current = true
    pushedEntryRef.current = true
    const hash = id === 'dino' ? 'dino-run' : id
    window.history.pushState(null, '', `#${hash}`)
    syncFromLocation()
    enteringFromHopRef.current = false
    pendingEnterRef.current = null
  }, [syncFromLocation])

  const handleEnterApex = useCallback(() => {
    const game = gameRef.current
    game?.freezeAtApex()
  }, [])

  const scheduleEnterAfterWipe = useCallback(() => {
    clearWipeTimer()
    if (reduceMotion) {
      completeEnterAfterWipe()
      return
    }
    setWipe('enter')
    wipeTimerRef.current = window.setTimeout(() => {
      wipeTimerRef.current = 0
      completeEnterAfterWipe()
    }, WIPE_MS)
  }, [clearWipeTimer, completeEnterAfterWipe, reduceMotion])

  const handlePortalEnter = useCallback((id, game) => {
    if (modeRef.current !== 'world') {
      return
    }
    pendingEnterRef.current = id
    lastReturnPortalRef.current = id
    game.setLoopMode('transition')
    game.setInputLocked(true)
    game.beginEnterTransition()
    setMode('transition')
  }, [])

  const registerApexHandler = useCallback(
    (game) => {
      game.onApex = () => {
        handleEnterApex()
        scheduleEnterAfterWipe()
      }
    },
    [handleEnterApex, scheduleEnterAfterWipe],
  )

  const handleGameReady = useCallback(
    (game) => {
      gameRef.current = game
      registerApexHandler(game)
      syncFromLocation()
    },
    [registerApexHandler, syncFromLocation],
  )

  const navigateToWorldFromPushedEntry = useCallback(() => {
    if (pushedEntryRef.current) {
      pushedEntryRef.current = false
      window.history.back()
      return
    }
    window.history.replaceState(null, '', '#world')
    syncFromLocation()
  }, [syncFromLocation])

  const handleDialogClose = useCallback(() => {
    const body = hashBody(window.location.hash)
    if (!isSectionId(body)) {
      exitBusyRef.current = false
      return
    }
    if (exitBusyRef.current) {
      return
    }
    exitBusyRef.current = true
    lastReturnPortalRef.current = body

    const game = gameRef.current
    game?.placeDinoAtReturn(body)
    game?.clearTransitionFreeze()
    game?.setLoopMode('transition')
    setMode('transition')

    clearWipeTimer()
    const finish = () => {
      navigateToWorldFromPushedEntry()
      exitBusyRef.current = false
    }

    setWipe('none')
    finish()
  }, [clearWipeTimer, navigateToWorldFromPushedEntry])

  const handleRunnerBack = useCallback(() => {
    lastReturnPortalRef.current = 'dino'
    navigateToWorldFromPushedEntry()
  }, [navigateToWorldFromPushedEntry])

  useEffect(() => {
    const onNav = () => syncFromLocation()
    window.addEventListener('popstate', onNav)
    window.addEventListener('hashchange', onNav)
    return () => {
      window.removeEventListener('popstate', onNav)
      window.removeEventListener('hashchange', onNav)
    }
  }, [syncFromLocation])

  useEffect(() => {
    if (mode !== 'runner') {
      return undefined
    }
    const onKey = (e) => {
      if (e.code === 'Escape' && !e.repeat) {
        e.preventDefault()
        handleRunnerBack()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mode, handleRunnerBack])

  useEffect(() => () => clearWipeTimer(), [clearWipeTimer])

  useEffect(() => {
    if (focusCanvasEpoch === 0) {
      return
    }
    worldCanvasRef.current?.focus({ preventScroll: true })
  }, [focusCanvasEpoch])

  const handleSkip = useCallback(() => {
    window.history.pushState(null, '', '#plain')
    syncFromLocation()
  }, [syncFromLocation])

  const handlePlayGame = useCallback(() => {
    window.history.pushState(null, '', '#world')
    syncFromLocation()
    focusWorldCanvas()
  }, [syncFromLocation, focusWorldCanvas])

  const showWorld = mode !== 'plain'

  return (
    <>
      {showWorld ? (
        <World
          mode={mode}
          wipe={wipe}
          visited={visited}
          onSkip={handleSkip}
          worldCanvasRef={worldCanvasRef}
          exitAnnouncement={exitAnnouncement}
          onGameReady={handleGameReady}
          onPortalEnter={handlePortalEnter}
          onRunnerBack={handleRunnerBack}
        />
      ) : null}
      {mode === 'plain' ? <PlainPage onPlayGame={handlePlayGame} /> : null}
      <SectionFrame
        section={section}
        dialogRef={dialogRef}
        onClose={handleDialogClose}
      />
    </>
  )
}