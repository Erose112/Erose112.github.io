import { assetUrl } from '../assetUrl.js'

export const WORLD_WIDTH = 960
export const WORLD_HEIGHT = 560
export const SKY_BOTTOM = 100
export const GROUND_TOP = 120
export const GROUND_BOTTOM = 540
export const WALK_LEFT = 24
export const WALK_RIGHT = 936

export const DESERT_COLOR = '#f7f7f7'
export const DUNE_TINT = '#ebebeb'

export const WORLD_SEED = 0x657468616e

export const SPAWN = { x: 480, y: 430, facingRight: true }

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
export const WIPE_MS = 450
export const WIPE_BLINK_STEPS = 3
export const JOYSTICK_DEADZONE = 0.2

/** Opening centers; return point is same x, y + PORTAL_RETURN_OFFSET_Y. */
export const PORTAL_DEFS = [
  { id: 'about', x: 220, y: 300, label: 'ABOUT' },
  { id: 'experience', x: 480, y: 190, label: 'EXPERIENCE' },
  { id: 'projects', x: 740, y: 300, label: 'PROJECTS' },
]

export const HEADROOM = 147

export const HORIZON_SLICE_MIN_W = 24
export const HORIZON_SLICE_MAX_W = 80

export const CLOUD_COUNT = 6
export const CLOUD_PARALLAX = 0.3
export const CLOUD_SPEED_MIN = 12
export const CLOUD_SPEED_MAX = 30
export const CLOUD_RESPAWN_GAP_MIN = 80
export const CLOUD_RESPAWN_GAP_MAX = 360

export const PROP_COUNT_MIN = 14
export const PROP_COUNT_MAX = 20
export const PROP_MIN_SPACING = 56
export const GATE_OPENING_CLEAR_PX = 90
export const PROP_PATH_CLEAR_PX = 40

export const PTERO_INTERVAL_MIN_S = 25
export const PTERO_INTERVAL_MAX_S = 40
export const PTERO_FRAME_MS = 1000 / 6

export const DUST_FRAME_COUNT = 6
export const DUST_SPAWN_INTERVAL_S = 0.08

export const BLINK_FRAME_MS = 1000 / 3
export const BLINK_DELAY_MIN_MS = 3000
export const BLINK_DELAY_MAX_MS = 7000

export const MOVE_SPEED = 240
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

export const WELCOME_DISMISS_MS = 8000
export const WELCOME_BLINK_MS = 1000 / 3

export const SPRITE_SHEET_URL = assetUrl('sprites/100-offline-sprite.png')

/** Horizon strip: try 52 if 54 clips bumps (see PLAN §5). */
export const HORIZON_SOURCE_Y = 52

export function cameraAnchor(visibleHeight) {
  return Math.max(0.5, Math.min(0.85, HEADROOM / visibleHeight))
}

export function computeScale(dpr, innerWidth, innerHeight) {
  const fromViewport = Math.round(Math.min(innerWidth, innerHeight) * dpr / 220)
  return Math.max(Math.round(2 * dpr), fromViewport)
}