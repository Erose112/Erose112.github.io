import { assetUrl } from '../../assetUrl.js'
import { readMuted, writeMuted } from './storage.js'

const SOUND_URLS = {
  button: assetUrl('sounds/button-press.mp3'),
  hit: assetUrl('sounds/hit.mp3'),
  score: assetUrl('sounds/score-reached.mp3'),
}

/**
 * Runner SFX — muted by default, unlock on first gesture (PLAN-DINO-RUN R6).
 */
export class RunnerAudio {
  constructor() {
    /** @type {Record<string, HTMLAudioElement>} */
    this.clips = {}
    this.muted = readMuted()
    this.unlocked = false
    for (const [key, src] of Object.entries(SOUND_URLS)) {
      const el = new Audio(src)
      el.preload = 'auto'
      this.clips[key] = el
    }
  }

  /** Try silent unlock after a user gesture; ignore play() rejection. */
  unlock() {
    if (this.unlocked) {
      return
    }
    this.unlocked = true
    for (const el of Object.values(this.clips)) {
      const prev = el.muted
      el.muted = true
      const p = el.play()
      if (p && typeof p.then === 'function') {
        p.then(() => {
          el.pause()
          el.currentTime = 0
          el.muted = prev
        }).catch(() => {
          el.muted = prev
        })
      } else {
        el.pause()
        el.currentTime = 0
        el.muted = prev
      }
    }
  }

  toggleMuted() {
    this.muted = !this.muted
    writeMuted(this.muted)
    return this.muted
  }

  setMuted(value) {
    this.muted = value
    writeMuted(value)
  }

  /** @param {'button' | 'hit' | 'score'} name */
  play(name) {
    if (this.muted) {
      return
    }
    const el = this.clips[name]
    if (!el) {
      return
    }
    try {
      el.currentTime = 0
      const p = el.play()
      if (p && typeof p.then === 'function') {
        p.catch(() => {})
      }
    } catch {
      /* stay silent */
    }
  }
}