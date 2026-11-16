export const WORLD_WIDTH = 1600
export const WORLD_HEIGHT = 960
export const SKY_BOTTOM = 150
export const GROUND_TOP = 180
export const GROUND_BOTTOM = 920
export const WALK_LEFT = 24
export const WALK_RIGHT = 1576

export const DESERT_COLOR = '#f7f7f7'

export const SPAWN = { x: 800, y: 760, facingRight: true }

/** Gate geometry (PLAN §4). */
export const GATE_GAP = 48
export const GATE_FLANK_OUTSET = 16
export const POST_FOOTPRINT_W = 25
export const POST_FOOTPRINT_H = 8
export const FLANK_FOOTPRINT_W = 17
export const FLANK_FOOTPRINT_H = 6
export const PORTAL_TRIGGER_W = 40
export const PORTAL_TRIGGER_H = 28
export const PORTAL_RETURN_OFFSET_Y = 72
export const CUE_BLINK_MS = 1000 / 3
export const WIPE_MS = 400

/** Opening centers; return point is same x, y + PORTAL_RETURN_OFFSET_Y. */
export const PORTAL_DEFS = [
  { id: 'about', x: 340, y: 460, label: 'ABOUT' },
  { id: 'experience', x: 800, y: 300, label: 'EXPERIENCE' },
  { id: 'projects', x: 1260, y: 460, label: 'PROJECTS' },
]

export const HEADROOM = 147
/** PLAN cites 56px; use strip height (12) so ground reads continuous in the camera window. */
export const HORIZON_TILE_STEP_Y = 12

/** Horizon strip: try 52 if 54 clips bumps (see PLAN §5). */
export const HORIZON_SOURCE_Y = 52

export const CLOUD_COUNT = 4
export const CLOUD_DRIFT_PX_PER_SEC = 30

export const BLINK_FRAME_MS = 1000 / 3
export const BLINK_DELAY_MIN_MS = 3000
export const BLINK_DELAY_MAX_MS = 7000

export const MOVE_SPEED = 180
export const RUN_FRAME_MS = 1000 / 12

export const FOOTPRINT_W = 28
export const FOOTPRINT_H = 12

export const JUMP_INITIAL_VELOCITY = 10
export const JUMP_GRAVITY = 0.6
export const JUMP_MIN_HEIGHT = 30
export const JUMP_DROP_VELOCITY = 5
export const JUMP_Z_CLAMP = 100
export const JUMP_PEAK_REF = 90

export const INK_COLOR = '#535353'
export const SHADOW_W = 30
export const SHADOW_H = 8

export const SPRITE_SHEET_URL = '/sprites/100-offline-sprite.png'

export function cameraAnchor(visibleHeight) {
  return Math.max(0.5, Math.min(0.85, HEADROOM / visibleHeight))
}

export function computeScale(dpr, innerWidth, innerHeight) {
  const fromViewport = Math.round(Math.min(innerWidth, innerHeight) * dpr / 220)
  return Math.max(Math.round(2 * dpr), fromViewport)
}