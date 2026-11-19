import { assetUrl } from '../assetUrl.js'

export const WORLD_WIDTH = 720
export const WORLD_HEIGHT = 660
export const SKY_BOTTOM = 100
export const GROUND_TOP = 120
/** North desert band unchanged when extending south (PLAN-DINO-RUN §6). */
export const GROUND_NORTH_BOTTOM = 540
export const GROUND_BOTTOM = 640
export const WALK_LEFT = 24
export const WALK_RIGHT = 696

export const DESERT_COLOR = '#f7f7f7'
export const DUNE_TINT = '#ebebeb'

export const WORLD_SEED = 0x657468616e

export const SPAWN = {
  x: WORLD_WIDTH / 2,
  y: Math.round(WORLD_HEIGHT / 2),
  facingRight: true,
}

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

/** Section gates: offsets from `SPAWN` (triangle: left / north / right). */
const SECTION_PORTAL_LAYOUT = [
  { id: 'about', dx: -120, dy: -30, label: 'ABOUT' },
  { id: 'experience', dx: 0, dy: -90, label: 'EXPERIENCE' },
  { id: 'projects', dx: 120, dy: -30, label: 'PROJECTS' },
]

/** Opening centers; return point is same x, y + PORTAL_RETURN_OFFSET_Y. */
export const PORTAL_DEFS = SECTION_PORTAL_LAYOUT.map(
  ({ id, dx, dy, label }) => ({
    id,
    x: SPAWN.x + dx,
    y: SPAWN.y + dy,
    label,
    path: true,
  }),
)

/** Dino Run gate: no path dots, not in `visited` (PLAN-DINO-RUN §6). */
export const DINO_RUN_PORTAL_DEF = {
  id: 'dino',
  x: SPAWN.x,
  y: SPAWN.y + 190,
  label: 'DINO RUN',
  path: false,
}

/** Gate pterodactyl: sprite bottom this many game px above `DINO_RUN_PORTAL_DEF.y`. */
export const DINO_GATE_PTERO_ABOVE_GROUND = 52
export const DINO_GATE_PTERO_BOB_PX = 3
/** Label bottom edge above ptero top at max upward bob (game px). */
export const DINO_GATE_LABEL_GAP_ABOVE_PTERO = 6

export const HEADROOM = 147

export const HORIZON_SLICE_MIN_W = 24
export const HORIZON_SLICE_MAX_W = 80

export const CLOUD_COUNT = 6
export const CLOUD_PARALLAX = 0.3
export const CLOUD_SPEED_MIN = 12
export const CLOUD_SPEED_MAX = 30
export const CLOUD_RESPAWN_GAP_MIN = 80
export const CLOUD_RESPAWN_GAP_MAX = 360

export const PROP_COUNT_MIN = 10
export const PROP_COUNT_MAX = 14
/** South extension band (`WORLD_SEED + 11`); north band keeps `PROP_COUNT_*`. */
export const SOUTH_PROP_COUNT_MIN = 6
export const SOUTH_PROP_COUNT_MAX = 10
export const SOUTH_GROUND_SLICE_MIN = 18
export const SOUTH_GROUND_SLICE_MAX = 28
export const SOUTH_GROUND_PEBBLE_MIN = 70
export const SOUTH_GROUND_PEBBLE_MAX = 110
export const SOUTH_GROUND_TUFT_MIN = 16
export const SOUTH_GROUND_TUFT_MAX = 28
export const SOUTH_GROUND_DUNE_MIN = 3
export const SOUTH_GROUND_DUNE_MAX = 6
export const PROP_BOX_GAP_PX = 16
export const SPAWN_PROP_CLEAR_PX = 88
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

export { HORIZON_SOURCE_Y } from './atlas.js'

export function cameraAnchor(visibleHeight) {
  return Math.max(0.5, Math.min(0.85, HEADROOM / visibleHeight))
}

export function computeScale(dpr, innerWidth, innerHeight) {
  const fromViewport = Math.round(Math.min(innerWidth, innerHeight) * dpr / 220)
  return Math.max(Math.round(2 * dpr), fromViewport)
}