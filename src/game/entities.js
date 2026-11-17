import { ATLAS, TREX_FRAME_OFFSET } from './atlas.js'
import { footprintBox, boxesOverlap, resolveFootprintCollisions } from './collision.js'
import { ATLAS as ATLAS_REF } from './atlas.js'
import {
  BLINK_DELAY_MAX_MS,
  BLINK_DELAY_MIN_MS,
  BLINK_FRAME_MS,
  CLOUD_COUNT,
  CLOUD_PARALLAX,
  CLOUD_RESPAWN_GAP_MAX,
  CLOUD_RESPAWN_GAP_MIN,
  CLOUD_SPEED_MAX,
  CLOUD_SPEED_MIN,
  DESERT_COLOR,
  DUST_FRAME_COUNT,
  DUST_SPAWN_INTERVAL_S,
  FLANK_FOOTPRINT_H,
  FLANK_FOOTPRINT_W,
  FOOTPRINT_H,
  FOOTPRINT_W,
  DINO_GATE_LABEL_GAP_ABOVE_PTERO,
  DINO_GATE_PTERO_ABOVE_GROUND,
  DINO_GATE_PTERO_BOB_PX,
  DINO_RUN_PORTAL_DEF,
  GATE_FLANK_OUTSET,
  GATE_GAP,
  GROUND_BOTTOM,
  GROUND_TOP,
  INK_COLOR,
  JUMP_DROP_VELOCITY,
  JUMP_GRAVITY,
  JUMP_INITIAL_VELOCITY,
  JUMP_MIN_HEIGHT,
  JUMP_PEAK_REF,
  JUMP_Z_CLAMP,
  MOVE_SPEED,
  PORTAL_DEFS,
  PORTAL_RETURN_OFFSET_Y,
  PORTAL_TRIGGER_H,
  PORTAL_TRIGGER_W,
  POST_FOOTPRINT_H,
  POST_FOOTPRINT_W,
  PTERO_FRAME_MS,
  PTERO_INTERVAL_MAX_S,
  PTERO_INTERVAL_MIN_S,
  RUN_FRAME_MS,
  SHADOW_H,
  SHADOW_W,
  SKY_BOTTOM,
  SPAWN,
  WALK_LEFT,
  WALK_RIGHT,
  WORLD_HEIGHT,
  WORLD_WIDTH,
  WORLD_SEED,
} from './constants.js'
import { drawPropCactus } from './props.js'
import { createRng, randFloat } from './rng.js'

function randomBlinkDelay() {
  return BLINK_DELAY_MIN_MS + Math.random() * (BLINK_DELAY_MAX_MS - BLINK_DELAY_MIN_MS)
}

export function createDino() {
  const now = performance.now()
  return {
    footX: SPAWN.x,
    footY: SPAWN.y,
    facingRight: SPAWN.facingRight,
    z: 0,
    vz: 0,
    airborne: false,
    reachedMinJump: false,
    frameOffset: TREX_FRAME_OFFSET.stand,
    blinkPhase: 'idle',
    nextBlinkAt: now + randomBlinkDelay(),
    blinkEndAt: 0,
    runFrameIndex: 0,
    runAnimElapsed: 0,
    moveSpeed: 0,
  }
}

function clampFootprint(footX, footY) {
  const halfW = FOOTPRINT_W / 2
  let x = footX
  let y = footY
  x = Math.max(WALK_LEFT + halfW, Math.min(WALK_RIGHT - halfW, x))
  y = Math.max(GROUND_TOP + FOOTPRINT_H, Math.min(GROUND_BOTTOM, y))
  return { x, y }
}

/**
 * @typedef {'about' | 'experience' | 'projects' | 'dino'} PortalId
 * @typedef {{
 *   id: PortalId,
 *   centerX: number,
 *   footY: number,
 *   label: string,
 *   noFlanks: boolean,
 *   leftPost: { footX: number, footY: number },
 *   rightPost: { footX: number, footY: number },
 *   leftFlank: { footX: number, footY: number } | null,
 *   rightFlank: { footX: number, footY: number } | null,
 *   trigger: { centerX: number, centerY: number, w: number, h: number },
 *   returnPoint: { x: number, y: number },
 *   gatePtero?: { frame: number, frameElapsed: number, bobT: number },
 * }} PortalGate
 */

/**
 * @param {{ id: PortalId, x: number, y: number, label: string, path?: boolean }} def
 * @param {{ returnNorth?: boolean, noFlanks?: boolean, gatePtero?: PortalGate['gatePtero'] }} [opts]
 * @returns {PortalGate}
 */
function buildPortalGate(def, opts = {}) {
  const largeW = ATLAS.cactusLarge.w
  const smallW = ATLAS.cactusSmall.w
  const halfGap = GATE_GAP / 2
  const footY = def.y
  const centerX = def.x
  const leftPostFootX = centerX - halfGap - largeW / 2
  const rightPostFootX = centerX + halfGap + largeW / 2
  const noFlanks = opts.noFlanks === true
  const leftFlankFootX = leftPostFootX - largeW / 2 - GATE_FLANK_OUTSET - smallW / 2
  const rightFlankFootX = rightPostFootX + largeW / 2 + GATE_FLANK_OUTSET + smallW / 2
  const triggerCenterY = footY - PORTAL_TRIGGER_H / 2
  const returnY = opts.returnNorth
    ? footY - PORTAL_RETURN_OFFSET_Y
    : footY + PORTAL_RETURN_OFFSET_Y

  return {
    id: def.id,
    centerX,
    footY,
    label: def.label,
    noFlanks,
    leftPost: { footX: leftPostFootX, footY },
    rightPost: { footX: rightPostFootX, footY },
    leftFlank: noFlanks ? null : { footX: leftFlankFootX, footY },
    rightFlank: noFlanks ? null : { footX: rightFlankFootX, footY },
    trigger: {
      centerX,
      centerY: triggerCenterY,
      w: PORTAL_TRIGGER_W,
      h: PORTAL_TRIGGER_H,
    },
    returnPoint: { x: centerX, y: returnY },
    gatePtero: opts.gatePtero,
  }
}

/** @returns {PortalGate[]} */
export function createPortals() {
  const sectionGates = PORTAL_DEFS.map((def) => buildPortalGate(def, { noFlanks: false }))
  const dinoGate = buildPortalGate(DINO_RUN_PORTAL_DEF, {
    returnNorth: true,
    noFlanks: true,
    gatePtero: { frame: 0, frameElapsed: 0, bobT: 0 },
  })
  return [...sectionGates, dinoGate]
}

/** @param {PortalGate[]} portals */
export function portalSolidColliders(portals) {
  /** @type {{ footX: number, footY: number, footprint: { w: number, h: number } }[]} */
  const solids = []
  for (const gate of portals) {
    solids.push(
      {
        footX: gate.leftPost.footX,
        footY: gate.leftPost.footY,
        footprint: { w: POST_FOOTPRINT_W, h: POST_FOOTPRINT_H },
      },
      {
        footX: gate.rightPost.footX,
        footY: gate.rightPost.footY,
        footprint: { w: POST_FOOTPRINT_W, h: POST_FOOTPRINT_H },
      },
    )
    if (!gate.noFlanks && gate.leftFlank && gate.rightFlank) {
      solids.push(
        {
          footX: gate.leftFlank.footX,
          footY: gate.leftFlank.footY,
          footprint: { w: FLANK_FOOTPRINT_W, h: FLANK_FOOTPRINT_H },
        },
        {
          footX: gate.rightFlank.footX,
          footY: gate.rightFlank.footY,
          footprint: { w: FLANK_FOOTPRINT_W, h: FLANK_FOOTPRINT_H },
        },
      )
    }
  }
  return solids
}

/** @param {PortalGate} gate */
export function portalTriggerBox(gate) {
  const { centerX, centerY, w, h } = gate.trigger
  return {
    left: centerX - w / 2,
    right: centerX + w / 2,
    top: centerY - h / 2,
    bottom: centerY + h / 2,
  }
}

/**
 * @param {ReturnType<typeof createDino>} dino
 * @param {PortalGate[]} portals
 * @returns {PortalId | null}
 */
export function portalOverlappingTrigger(dino, portals) {
  const dinoBox = footprintBox(dino.footX, dino.footY, FOOTPRINT_W, FOOTPRINT_H)
  for (const gate of portals) {
    if (boxesOverlap(dinoBox, portalTriggerBox(gate))) {
      return gate.id
    }
  }
  return null
}

/**
 * @param {ReturnType<typeof createDino>} dino
 * @param {{ x: number, y: number }} axis
 * @param {number} dt
 * @param {boolean} jumpEdge
 * @param {boolean} jumpHeld
 * @param {{ footX: number, footY: number, footprint: { w: number, h: number } }[]} [solids]
 * @param {PortalGate[]} [portals]
 * @returns {PortalId | null} portal entered via jump edge while overlapping trigger
 */
export function updateDinoMoveAndJump(
  dino,
  axis,
  dt,
  jumpEdge,
  jumpHeld,
  solids = [],
  portals = [],
) {
  const frames = dt * 60

  let vx = axis.x * MOVE_SPEED * dt
  let vy = axis.y * MOVE_SPEED * dt

  if (vx !== 0) {
    dino.facingRight = vx > 0
  }

  dino.footX += vx
  if (solids.length > 0) {
    const resolvedX = resolveFootprintCollisions(
      dino.footX,
      dino.footY,
      FOOTPRINT_W,
      FOOTPRINT_H,
      solids,
    )
    dino.footX = resolvedX.x
    dino.footY = resolvedX.y
  }
  dino.footY += vy
  if (solids.length > 0) {
    const resolvedY = resolveFootprintCollisions(
      dino.footX,
      dino.footY,
      FOOTPRINT_W,
      FOOTPRINT_H,
      solids,
    )
    dino.footX = resolvedY.x
    dino.footY = resolvedY.y
  }
  const clamped = clampFootprint(dino.footX, dino.footY)
  dino.footX = clamped.x
  dino.footY = clamped.y

  dino.moveSpeed = Math.hypot(vx, vy) / dt

  let enteredPortal = null
  if (jumpEdge && dino.z === 0) {
    if (portals.length > 0) {
      enteredPortal = portalOverlappingTrigger(dino, portals)
    }
    const hPxPerFrame = Math.abs(axis.x) * (MOVE_SPEED / 60)
    dino.vz = JUMP_INITIAL_VELOCITY + hPxPerFrame / 10
    dino.airborne = true
    dino.reachedMinJump = false
  }

  if (dino.airborne) {
    dino.z += dino.vz * frames
    dino.vz -= JUMP_GRAVITY * frames
    if (dino.z >= JUMP_MIN_HEIGHT) {
      dino.reachedMinJump = true
    }
    if (!jumpHeld && dino.reachedMinJump && dino.vz > JUMP_DROP_VELOCITY) {
      dino.vz = JUMP_DROP_VELOCITY
    }
    if (dino.z > JUMP_Z_CLAMP) {
      dino.z = JUMP_Z_CLAMP
    }
    if (dino.z <= 0) {
      dino.z = 0
      dino.vz = 0
      dino.airborne = false
      dino.reachedMinJump = false
    }
  }

  return enteredPortal
}

/**
 * @param {ReturnType<typeof createDino>} dino
 * @param {number} now
 * @param {number} dt
 */
export function updateDinoAnimation(dino, now, dt) {
  const moving = dino.z === 0 && dino.moveSpeed > 0.5

  if (dino.z > 0) {
    dino.frameOffset = TREX_FRAME_OFFSET.stand
    dino.blinkPhase = 'idle'
    return
  }

  if (moving) {
    dino.runAnimElapsed += dt * 1000
    while (dino.runAnimElapsed >= RUN_FRAME_MS) {
      dino.runAnimElapsed -= RUN_FRAME_MS
      dino.runFrameIndex = dino.runFrameIndex === 0 ? 1 : 0
    }
    dino.frameOffset =
      dino.runFrameIndex === 0 ? TREX_FRAME_OFFSET.run1 : TREX_FRAME_OFFSET.run2
    dino.blinkPhase = 'idle'
    return
  }

  if (dino.blinkPhase === 'idle') {
    dino.frameOffset = TREX_FRAME_OFFSET.stand
    if (now >= dino.nextBlinkAt) {
      dino.blinkPhase = 'blink'
      dino.frameOffset = TREX_FRAME_OFFSET.blink
      dino.blinkEndAt = now + BLINK_FRAME_MS
    }
  } else if (now >= dino.blinkEndAt) {
    dino.blinkPhase = 'idle'
    dino.frameOffset = TREX_FRAME_OFFSET.stand
    dino.nextBlinkAt = now + randomBlinkDelay()
  }
}

/**
 * @param {ReturnType<typeof createScreenClouds>[number]} cloud
 * @param {number} index
 * @param {number} viewW
 * @param {number} viewH
 * @param {number} [staggerPx]
 */
function placeCloudOffLeft(cloud, index, viewW, viewH, staggerPx = 0) {
  const w = ATLAS.cloud.w
  const bandH = viewH / 3
  const rng = createRng(WORLD_SEED + 11 + index * 19)
  cloud.screenX =
    -w - randFloat(rng, CLOUD_RESPAWN_GAP_MIN, CLOUD_RESPAWN_GAP_MAX) - staggerPx
  cloud.screenYOffset =
    10 + (index % 3) * 12 + randFloat(rng, 0, Math.max(8, bandH - w - 16))
  cloud.speed = randFloat(rng, CLOUD_SPEED_MIN, CLOUD_SPEED_MAX)
}

function respawnCloudOffLeft(cloud, index, viewW, viewH) {
  placeCloudOffLeft(cloud, index, viewW, viewH)
}

/** Screen X after parallax; matches {@link drawSortedActors} cloud placement. */
function cloudDrawScreenX(cloud, camX) {
  return cloud.screenX - camX * CLOUD_PARALLAX
}

export function createScreenClouds() {
  const clouds = []
  for (let i = 0; i < CLOUD_COUNT; i++) {
    clouds.push({
      screenX: Number.NaN,
      screenYOffset: 16,
      speed: CLOUD_SPEED_MIN,
    })
  }
  return clouds
}

/** @param {ReturnType<typeof createScreenClouds>} clouds @param {number} viewW @param {number} viewH */
export function layoutScreenClouds(clouds, viewW, viewH) {
  const w = ATLAS.cloud.w
  const bandH = viewH / 3
  const laneSpacing = w + (CLOUD_RESPAWN_GAP_MIN + CLOUD_RESPAWN_GAP_MAX) * 0.35
  for (let i = 0; i < clouds.length; i++) {
    const cloud = clouds[i]
    if (!Number.isFinite(cloud.screenX)) {
      placeCloudOffLeft(cloud, i, viewW, viewH, i * laneSpacing)
      continue
    }
    const rng = createRng(WORLD_SEED + 5 + i)
    cloud.screenYOffset =
      10 + (i % 3) * 12 + randFloat(rng, 0, Math.max(8, bandH - w - 16))
  }
}

/**
 * @param {ReturnType<typeof createScreenClouds>} clouds
 * @param {number} dt
 * @param {number} viewW
 * @param {number} viewH
 * @param {number} camX
 */
export function updateScreenClouds(clouds, dt, viewW, viewH, camX) {
  const w = ATLAS.cloud.w
  for (let i = 0; i < clouds.length; i++) {
    const cloud = clouds[i]
    if (!Number.isFinite(cloud.screenX)) {
      placeCloudOffLeft(cloud, i, viewW, viewH, i * (w + CLOUD_RESPAWN_GAP_MIN))
      continue
    }
    cloud.screenX += cloud.speed * dt
  }
  for (let i = 0; i < clouds.length; i++) {
    const cloud = clouds[i]
    if (!Number.isFinite(cloud.screenX)) {
      continue
    }
    const drawX = cloudDrawScreenX(cloud, camX)
    if (drawX > viewW + w) {
      respawnCloudOffLeft(cloud, i, viewW, viewH)
    }
  }
}

const CLOUD_FILL_RGB = [218, 218, 218]

/**
 * The sheet cloud is an outline; fill each row’s interior so the exterior stays transparent.
 * @param {CanvasImageSource} sheet
 */
export function buildCloudSprite(sheet) {
  const { x: sx, y: sy, w, h } = ATLAS.cloud
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const cctx = canvas.getContext('2d')
  if (!cctx) {
    return canvas
  }
  cctx.drawImage(sheet, sx, sy, w, h, 0, 0, w, h)
  const imageData = cctx.getImageData(0, 0, w, h)
  const data = imageData.data
  for (let py = 0; py < h; py++) {
    let minX = w
    let maxX = -1
    for (let px = 0; px < w; px++) {
      if (data[(py * w + px) * 4 + 3] === 255) {
        if (px < minX) {
          minX = px
        }
        if (px > maxX) {
          maxX = px
        }
      }
    }
    if (maxX - minX < 1) {
      continue
    }
    for (let px = minX; px <= maxX; px++) {
      const i = (py * w + px) * 4
      if (data[i + 3] === 0) {
        data[i] = CLOUD_FILL_RGB[0]
        data[i + 1] = CLOUD_FILL_RGB[1]
        data[i + 2] = CLOUD_FILL_RGB[2]
        data[i + 3] = 255
      }
    }
  }
  cctx.putImageData(imageData, 0, 0)
  return canvas
}

export function createDustState() {
  return {
    elapsed: 0,
    /** @type {{ x: number, y: number, age: number, size: number }[]} */
    puffs: [],
  }
}

/**
 * @param {ReturnType<typeof createDustState>} dust
 * @param {ReturnType<typeof createDino>} dino
 * @param {number} dt
 */
export function updateDust(dust, dino, dt) {
  dust.elapsed += dt
  if (dino.z === 0 && dino.moveSpeed > 0.5) {
    if (dust.elapsed >= DUST_SPAWN_INTERVAL_S) {
      dust.elapsed = 0
      dust.puffs.push({
        x: dino.footX + (Math.random() - 0.5) * 8,
        y: dino.footY,
        age: 0,
        size: 2 + Math.floor(Math.random() * 2),
      })
    }
  } else {
    dust.elapsed = 0
  }

  for (const puff of dust.puffs) {
    puff.age += dt
  }
  dust.puffs = dust.puffs.filter((p) => p.age * 60 < DUST_FRAME_COUNT)
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {ReturnType<typeof createDustState>} dust
 */
export function drawDust(ctx, dust) {
  ctx.fillStyle = INK_COLOR
  for (const puff of dust.puffs) {
    const alpha = 1 - puff.age * 60 / DUST_FRAME_COUNT
    if (alpha <= 0) {
      continue
    }
    ctx.globalAlpha = alpha * 0.55
    ctx.fillRect(Math.round(puff.x), Math.round(puff.y - 2), puff.size, puff.size)
  }
  ctx.globalAlpha = 1
}

export function createPterodactylState() {
  const rng = createRng(WORLD_SEED + 11)
  return {
    active: false,
    x: 0,
    y: 0,
    direction: 1,
    frame: 0,
    frameElapsed: 0,
    nextAt: performance.now() + randFloat(rng, PTERO_INTERVAL_MIN_S, PTERO_INTERVAL_MAX_S) * 1000,
  }
}

/**
 * @param {ReturnType<typeof createPterodactylState>} ptero
 * @param {number} now
 * @param {number} dt
 * @param {number} camX
 * @param {number} camY
 * @param {number} viewW
 * @param {number} viewH
 * @param {boolean} reduceMotion
 */
export function updatePterodactyl(ptero, now, dt, camX, camY, viewW, viewH, reduceMotion) {
  if (reduceMotion) {
    return
  }

  if (!ptero.active) {
    if (now >= ptero.nextAt) {
      const rng = createRng(Math.floor(now) + WORLD_SEED)
      ptero.active = true
      ptero.direction = rng() < 0.5 ? -1 : 1
      ptero.x = ptero.direction > 0 ? camX - 60 : camX + viewW + 60
      const bandTop = camY + viewH * 0.08
      const bandBottom = camY + viewH / 3 - ATLAS_REF.pterodactyl.h
      ptero.y = bandTop + randFloat(rng, 0, Math.max(8, bandBottom - bandTop))
      ptero.frame = 0
      ptero.frameElapsed = 0
    }
    return
  }

  ptero.x += ptero.direction * 140 * dt
  ptero.frameElapsed += dt * 1000
  while (ptero.frameElapsed >= PTERO_FRAME_MS) {
    ptero.frameElapsed -= PTERO_FRAME_MS
    ptero.frame = ptero.frame === 0 ? 1 : 0
  }

  if (
    (ptero.direction > 0 && ptero.x > camX + viewW + 80) ||
    (ptero.direction < 0 && ptero.x < camX - 80)
  ) {
    ptero.active = false
    const rng = createRng(Math.floor(now) + 19)
    ptero.nextAt =
      now + randFloat(rng, PTERO_INTERVAL_MIN_S, PTERO_INTERVAL_MAX_S) * 1000
  }
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {CanvasImageSource} img
 * @param {ReturnType<typeof createPterodactylState>} ptero
 */
/**
 * @param {PortalGate[]} portals
 * @param {number} dt
 * @param {boolean} reduceMotion
 */
export function updateDinoGatePteros(portals, dt, reduceMotion) {
  if (reduceMotion) {
    return
  }
  for (const gate of portals) {
    const deco = gate.gatePtero
    if (!deco) {
      continue
    }
    deco.bobT += dt
    deco.frameElapsed += dt * 1000
    while (deco.frameElapsed >= PTERO_FRAME_MS) {
      deco.frameElapsed -= PTERO_FRAME_MS
      deco.frame = deco.frame === 0 ? 1 : 0
    }
  }
}

/**
 * @param {PortalGate} gate
 * @returns {{ x: number, y: number }}
 */
function dinoGatePteroPosition(gate) {
  const { w: pteroW, h: pteroH } = ATLAS_REF.pterodactyl
  const bob = gate.gatePtero
    ? Math.sin(gate.gatePtero.bobT * Math.PI * 2 / 2.4) * DINO_GATE_PTERO_BOB_PX
    : 0
  const bottomY = gate.footY - DINO_GATE_PTERO_ABOVE_GROUND + bob
  const topY = bottomY - pteroH
  return { x: Math.round(gate.centerX - pteroW / 2), y: Math.round(topY) }
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {CanvasImageSource} img
 * @param {PortalGate} gate
 */
export function drawGatePterodactyl(ctx, img, gate) {
  const deco = gate.gatePtero
  if (!deco) {
    return
  }
  const atlas = deco.frame === 0 ? ATLAS_REF.pterodactyl : ATLAS_REF.pterodactylFrame2
  const { x: sx, y: sy, w, h } = atlas
  const pos = dinoGatePteroPosition(gate)
  ctx.drawImage(img, sx, sy, w, h, pos.x, pos.y, w, h)
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {CanvasImageSource} img
 * @param {PortalGate} gate
 */
export function drawDinoGateOpeningStrip(ctx, img, gate) {
  if (gate.id !== 'dino') {
    return
  }
  const { x: hsx, y: hsy, w: hw, h: hh } = ATLAS.horizon
  const stripW = GATE_GAP
  const drawX = Math.round(gate.centerX - stripW / 2)
  const drawY = Math.round(gate.footY - hh)
  ctx.drawImage(img, hsx, hsy, Math.min(hw, stripW), hh, drawX, drawY, stripW, hh)
}

export function drawPterodactyl(ctx, img, ptero) {
  if (!ptero.active) {
    return
  }
  const atlas = ptero.frame === 0 ? ATLAS_REF.pterodactyl : ATLAS_REF.pterodactylFrame2
  const { x: sx, y: sy, w, h } = atlas
  const drawX = Math.round(ptero.x)
  const drawY = Math.round(ptero.y)
  // Atlas pterodactyl faces left; flip when flying right.
  if (ptero.direction > 0) {
    ctx.save()
    ctx.translate(drawX + w / 2, drawY + h / 2)
    ctx.scale(-1, 1)
    ctx.drawImage(img, sx, sy, w, h, -w / 2, -h / 2, w, h)
    ctx.restore()
    return
  }
  ctx.drawImage(img, sx, sy, w, h, drawX, drawY, w, h)
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} camX
 * @param {number} camY
 * @param {number} viewW
 * @param {number} viewH
 */
export function drawSky(ctx, camX, camY, viewW, viewH) {
  ctx.fillStyle = DESERT_COLOR
  const left = Math.floor(camX)
  const width = Math.ceil(viewW)

  const worldSkyTop = Math.max(0, Math.floor(camY))
  const worldSkyBottom = Math.min(camY + viewH, SKY_BOTTOM)
  if (worldSkyBottom > worldSkyTop) {
    ctx.fillRect(left, worldSkyTop, width, Math.ceil(worldSkyBottom - worldSkyTop))
  }

  const northStripH = Math.min(SKY_BOTTOM, Math.max(0, SKY_BOTTOM - camY))
  if (northStripH > 0 && camY < SKY_BOTTOM) {
    ctx.fillRect(left, Math.floor(camY), width, Math.ceil(Math.min(northStripH, viewH)))
  }
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {ReturnType<typeof createDino>} dino
 */
export function drawDinoShadow(ctx, dino) {
  const widthScale = 1 - (dino.z / JUMP_PEAK_REF) * 0.35
  const w = Math.round(SHADOW_W * widthScale)
  const h = SHADOW_H
  const x = Math.round(dino.footX - w / 2)
  const y = Math.round(dino.footY - h / 2)
  ctx.fillStyle = INK_COLOR
  ctx.beginPath()
  ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2)
  ctx.fill()
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {CanvasImageSource} img
 * @param {ReturnType<typeof createDino>} dino
 */
export function drawDino(ctx, img, dino) {
  const { x: baseX, y: sy, w, h } = ATLAS.tRex
  const sx = baseX + dino.frameOffset
  const drawX = Math.round(dino.footX - w / 2)
  const drawY = Math.round(dino.footY - h - dino.z)

  if (dino.facingRight) {
    ctx.drawImage(img, sx, sy, w, h, drawX, drawY, w, h)
    return
  }

  ctx.save()
  ctx.translate(drawX + w / 2, drawY + h / 2)
  ctx.scale(-1, 1)
  ctx.drawImage(img, sx, sy, w, h, -w / 2, -h / 2, w, h)
  ctx.restore()
}

/**
 * Fill margins when the view is larger than the world on an axis.
 */
/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {CanvasImageSource} img
 * @param {number} footX
 * @param {number} footY
 * @param {'large' | 'small'} kind
 */
function drawCactus(ctx, img, footX, footY, kind) {
  const atlas = kind === 'large' ? ATLAS.cactusLarge : ATLAS.cactusSmall
  const { x: sx, y: sy, w, h } = atlas
  const drawX = Math.round(footX - w / 2)
  const drawY = Math.round(footY - h)
  ctx.drawImage(img, sx, sy, w, h, drawX, drawY, w, h)
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {CanvasImageSource} img
 * @param {PortalGate} gate
 * @param {'leftPost' | 'rightPost' | 'leftFlank' | 'rightFlank'} part
 */
export function drawPortalPart(ctx, img, gate, part) {
  const foot =
    part === 'leftPost'
      ? gate.leftPost
      : part === 'rightPost'
        ? gate.rightPost
        : part === 'leftFlank'
          ? gate.leftFlank
          : gate.rightFlank
  if (!foot) {
    return
  }
  const kind = part === 'leftFlank' || part === 'rightFlank' ? 'small' : 'large'
  drawCactus(ctx, img, foot.footX, foot.footY, kind)
}

const DRAW_LAYER_CACTUS = 0
const DRAW_LAYER_CLOUD = 1
const DRAW_LAYER_ACTOR = 2

/**
 * @param {{ footY: number, layer: number }} a
 * @param {{ footY: number, layer: number }} b
 * @returns {number}
 */
function compareDrawOrder(a, b) {
  if (a.layer === DRAW_LAYER_CACTUS && b.layer === DRAW_LAYER_CLOUD) {
    return -1
  }
  if (a.layer === DRAW_LAYER_CLOUD && b.layer === DRAW_LAYER_CACTUS) {
    return 1
  }
  if (a.layer === DRAW_LAYER_CLOUD && b.layer === DRAW_LAYER_ACTOR) {
    return -1
  }
  if (a.layer === DRAW_LAYER_ACTOR && b.layer === DRAW_LAYER_CLOUD) {
    return 1
  }
  return a.footY - b.footY
}

/**
 * @param {import('./props.js').PropCactus[]} props
 * @param {CanvasImageSource | null | undefined} cloudImg
 * @param {ReturnType<typeof createScreenClouds>} [clouds]
 * @param {number} camX
 * @param {number} camY
 * @param {number} viewW
 * @param {number} viewH
 * @param {ReturnType<typeof createPterodactylState>} [ptero]
 */
export function drawSortedActors(
  ctx,
  img,
  dino,
  portals,
  props = [],
  cloudImg,
  clouds,
  camX,
  camY,
  viewW,
  viewH,
  ptero,
) {
  /** @type {{ footY: number, layer: number, draw: () => void }[]} */
  const items = []

  for (const prop of props) {
    items.push({
      footY: prop.footY,
      layer: DRAW_LAYER_CACTUS,
      draw: () => drawPropCactus(ctx, img, prop),
    })
  }

  for (const gate of portals) {
    const parts = gate.noFlanks
      ? /** @type {const} */ (['leftPost', 'rightPost'])
      : /** @type {const} */ (['leftPost', 'rightPost', 'leftFlank', 'rightFlank'])
    for (const part of parts) {
      const foot =
        part === 'leftPost'
          ? gate.leftPost
          : part === 'rightPost'
            ? gate.rightPost
            : part === 'leftFlank'
              ? gate.leftFlank
              : gate.rightFlank
      if (!foot) {
        continue
      }
      items.push({
        footY: foot.footY,
        layer: DRAW_LAYER_CACTUS,
        draw: () => drawPortalPart(ctx, img, gate, part),
      })
    }
    if (gate.id === 'dino') {
      items.push({
        footY: gate.footY,
        layer: DRAW_LAYER_CACTUS,
        draw: () => drawDinoGateOpeningStrip(ctx, img, gate),
      })
      if (gate.gatePtero) {
        const pos = dinoGatePteroPosition(gate)
        const pteroH = ATLAS.pterodactyl.h
        items.push({
          footY: pos.y + pteroH,
          layer: DRAW_LAYER_ACTOR,
          draw: () => drawGatePterodactyl(ctx, img, gate),
        })
      }
    }
  }

  if (cloudImg && clouds) {
    const { w, h } = ATLAS.cloud
    const bandLimit = viewH / 3
    for (const cloud of clouds) {
      if (!Number.isFinite(cloud.screenX)) {
        continue
      }
      const drawX = cloudDrawScreenX(cloud, camX)
      if (drawX + w < 0 || drawX > viewW) {
        continue
      }
      const worldX = Math.round(camX + drawX)
      const worldY = Math.round(camY + cloud.screenYOffset)
      if (cloud.screenYOffset > bandLimit) {
        continue
      }
      items.push({
        footY: worldY + h,
        layer: DRAW_LAYER_CLOUD,
        draw: () => ctx.drawImage(cloudImg, worldX, worldY),
      })
    }
  }

  items.push({
    footY: dino.footY,
    layer: DRAW_LAYER_ACTOR,
    draw: () => {
      drawDinoShadow(ctx, dino)
      drawDino(ctx, img, dino)
    },
  })

  if (ptero?.active) {
    const { h: pteroH } = ATLAS.pterodactyl
    items.push({
      footY: ptero.y + pteroH,
      layer: DRAW_LAYER_ACTOR,
      draw: () => drawPterodactyl(ctx, img, ptero),
    })
  }

  items.sort(compareDrawOrder)
  for (const item of items) {
    item.draw()
  }
}

/** Label anchor in game space: point is the label’s bottom center (DOM uses translate(-50%, -100%)). */
export function portalLabelAnchor(gate) {
  if (gate.id === 'dino') {
    const pteroH = ATLAS.pterodactyl.h
    return {
      x: gate.centerX,
      y:
        gate.footY -
        DINO_GATE_PTERO_ABOVE_GROUND -
        pteroH -
        DINO_GATE_PTERO_BOB_PX -
        DINO_GATE_LABEL_GAP_ABOVE_PTERO,
    }
  }
  return {
    x: gate.centerX,
    y: gate.footY - ATLAS.cactusLarge.h - 12,
  }
}

export function drawWorldMargins(ctx, camX, camY, viewW, viewH) {
  ctx.fillStyle = DESERT_COLOR
  if (viewW > WORLD_WIDTH) {
    if (camX < 0) {
      ctx.fillRect(Math.floor(camX), Math.floor(camY), Math.ceil(-camX), Math.ceil(viewH))
    }
    if (camX + viewW > WORLD_WIDTH) {
      const overflow = camX + viewW - WORLD_WIDTH
      ctx.fillRect(
        Math.floor(WORLD_WIDTH),
        Math.floor(camY),
        Math.ceil(overflow),
        Math.ceil(viewH),
      )
    }
  }
  if (viewH > WORLD_HEIGHT) {
    if (camY < 0) {
      ctx.fillRect(Math.floor(camX), Math.floor(camY), Math.ceil(viewW), Math.ceil(-camY))
    }
    if (camY + viewH > WORLD_HEIGHT) {
      const overflow = camY + viewH - WORLD_HEIGHT
      ctx.fillRect(
        Math.floor(camX),
        Math.floor(WORLD_HEIGHT),
        Math.ceil(viewW),
        Math.ceil(overflow),
      )
    }
  }
}