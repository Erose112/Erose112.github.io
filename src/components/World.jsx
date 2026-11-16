import { useEffect, useRef } from 'react'
import { Game } from '../game/Game.js'
import ExitButton from './ExitButton.jsx'

export default function World() {
  const canvasRef = useRef(null)
  const gameRef = useRef(null)
  const observerRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      return undefined
    }

    const game = new Game(canvas)
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

    return () => {
      ro.disconnect()
      observerRef.current = null
      game.destroy()
      gameRef.current = null
    }
  }, [])

  return (
    <div className="world-shell fixed inset-0">
      <canvas
        ref={canvasRef}
        className="world-canvas relative z-0 block h-full w-full touch-none"
        width={1}
        height={1}
        aria-hidden
      />
      <ExitButton />
    </div>
  )
}