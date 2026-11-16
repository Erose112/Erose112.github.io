import { ATLAS, TREX_FRAME_OFFSET } from './atlas.js'
import { footprintBox, boxesOverlap, resolveFootprintCollisions } from './collision.js'
import {
  BLINK_DELAY_MAX_MS,
  BLINK_DELAY_MIN_MS,
  BLINK_FRAME_MS,
  CLOUD_COUNT,
  CLOUD_DRIFT_PX_PER_SEC,
  DESERT_COLOR,
  FLANK_FOOTPRINT_H,
  FLANK_FOOTPRINT_W,
  FOOTPRINT_H,
  FOOTPRINT_W,
  GATE_FLANK_OUTSET,
  GATE_GAP,
  GROUND_BOTTOM,
  GROUND_TOP,
  HORIZON_TILE_STEP_Y,
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
  RUN_FRAME_MS,
  SHADOW_H,
  SHADOW_W,
  SKY_BOTTOM,
  SPAWN,
  WALK_LEFT,
  WALK_RIGHT,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from './constants.js'

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
 * @typedef {'about' | 'experience' | 'projects'} PortalId
 * @typedef {{
 *   id: PortalId,
 *   centerX: number,
 *   footY: number,
 *   label: string,
 *   leftPost: { footX: number, footY: number },
 *   rightPost: { footX: number, footY: number },
 *   leftFlank: { footX: number, footY: number },
 *   rightFlank: { footX: number, footY: number },
 *   trigger: { centerX: number, centerY: number, w: number, h: number },
 *   returnPoint: { x: number, y: number },
 * }} PortalGate
 */

/** @returns {PortalGate[]} */
export function createPortals() {
  const largeW = ATLAS.cactusLarge.w
  const smallW = ATLAS.cactusSmall.w
  const halfGap = GATE_GAP / 2

  return PORTAL_DEFS.map((def) => {
    const footY = def.y
    const centerX = def.x
    const leftPostFootX = centerX - halfGap - largeW / 2
    const rightPostFootX = centerX + halfGap + largeW / 2
    const leftFlankFootX = leftPostFootX - largeW / 2 - GATE_FLANK_OUTSET - smallW / 2
    const rightFlankFootX = rightPostFootX + largeW / 2 + GATE_FLANK_OUTSET + smallW / 2
    const triggerCenterY = footY - PORTAL_TRIGGER_H / 2

    return {
      id: def.id,
      centerX,
      footY,
      label: def.label,
      leftPost: { footX: leftPostFootX, footY },
      rightPost: { footX: rightPostFootX, footY },
      leftFlank: { footX: leftFlankFootX, footY },
      rightFlank: { footX: rightFlankFootX, footY },
      trigger: {
        centerX,
        centerY: triggerCenterY,
        w: PORTAL_TRIGGER_W,
        h: PORTAL_TRIGGER_H,
      },
      returnPoint: { x: centerX, y: footY + PORTAL_RETURN_OFFSET_Y },
    }
  })
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

export function createClouds() {
  const clouds = []
  for (let i = 0; i < CLOUD_COUNT; i++) {
    clouds.push({
      x: 0,
      y: 0,
      jitterX: Math.random() * 48,
    })
  }
  return clouds
}

/** Gameplay camera at south spawn leaves world sky off-screen; lay clouds in the top of the view. */
export function layoutCloudsForView(clouds, camX, camY, viewW, viewH) {
  const padding = 12
  const bandTop = camY + padding
  const bandHeight = Math.min(Math.max(72, viewH * 0.38), viewH - padding * 2)
  const bandBottom = bandTop + bandHeight
  const span = Math.max(viewW - 100, 80)

  for (let i = 0; i < clouds.length; i++) {
    const cloud = clouds[i]
    cloud.y = bandTop + 10 + (i % 2) * 20 + Math.min(28, bandHeight * 0.35)
    cloud.y = Math.min(cloud.y, bandBottom - ATLAS.cloud.h)
    cloud.x = camX + 36 + (i / Math.max(1, clouds.length - 1)) * span + cloud.jitterX
  }
}

/**
 * @param {{ x: number, y: number }[]} clouds
 * @param {number} dt
 * @param {number} camX
 * @param {number} viewW
 */
export function updateClouds(clouds, dt, camX, viewW) {
  const drift = CLOUD_DRIFT_PX_PER_SEC * dt
  const wrapLeft = camX - 80
  const wrapRight = camX + viewW + 40
  for (const cloud of clouds) {
    cloud.x += drift
    if (cloud.x > wrapRight) {
      cloud.x = wrapLeft
    }
  }
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

  if (camY < SKY_BOTTOM) {
    const top = Math.max(0, Math.floor(camY))
    const bottom = Math.min(camY + viewH, SKY_BOTTOM)
    if (bottom > top) {
      ctx.fillRect(left, top, width, Math.ceil(bottom - top))
    }
  }

  const viewportSkyH = Math.min(100, Math.max(56, viewH * 0.42))
  if (camY + viewportSkyH <= camY + viewH) {
    ctx.fillRect(left, Math.floor(camY), width, Math.ceil(viewportSkyH))
  }
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {CanvasImageSource} img
 * @param {number} camX
 * @param {number} camY
 * @param {number} viewW
 * @param {number} viewH
 */
export function drawHorizonTiles(ctx, img, camX, camY, viewW, viewH) {
  const { x: sx, y: sy, w, h } = ATLAS.horizon
  const yStart = SKY_BOTTOM
  const yEnd = WORLD_HEIGHT
  const xStart = Math.floor(camX / w) * w - w
  const xEnd = camX + viewW + w

  const stepY = Math.min(HORIZON_TILE_STEP_Y, h)
  for (let ty = yStart; ty < yEnd; ty += stepY) {
    if (ty + h < camY || ty > camY + viewH) {
      continue
    }
    for (let tx = xStart; tx < xEnd; tx += w) {
      ctx.drawImage(img, sx, sy, w, h, Math.round(tx), Math.round(ty), w, h)
    }
  }
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {CanvasImageSource} img
 * @param {{ x: number, y: number }[]} clouds
 */
export function drawClouds(ctx, img, clouds) {
  const { x: sx, y: sy, w, h } = ATLAS.cloud
  for (const cloud of clouds) {
    ctx.drawImage(
      img,
      sx,
      sy,
      w,
      h,
      Math.round(cloud.x),
      Math.round(cloud.y),
      w,
      h,
    )
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
  const kind = part === 'leftFlank' || part === 'rightFlank' ? 'small' : 'large'
  drawCactus(ctx, img, foot.footX, foot.footY, kind)
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {CanvasImageSource} img
 * @param {ReturnType<typeof createDino>} dino
 * @param {PortalGate[]} portals
 */
export function drawSortedActors(ctx, img, dino, portals) {
  /** @type {{ footY: number, draw: () => void }[]} */
  const items = []

  items.push({
    footY: dino.footY,
    draw: () => {
      drawDinoShadow(ctx, dino)
      drawDino(ctx, img, dino)
    },
  })

  const parts = ['leftPost', 'rightPost', 'leftFlank', 'rightFlank']
  for (const gate of portals) {
    for (const part of parts) {
      const foot =
        part === 'leftPost'
          ? gate.leftPost
          : part === 'rightPost'
            ? gate.rightPost
            : part === 'leftFlank'
              ? gate.leftFlank
              : gate.rightFlank
      items.push({
        footY: foot.footY,
        draw: () => drawPortalPart(ctx, img, gate, part),
      })
    }
  }

  items.sort((a, b) => a.footY - b.footY)
  for (const item of items) {
    item.draw()
  }
}

/** Label anchor in game space: centered above the gate posts. */
export function portalLabelAnchor(gate) {
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