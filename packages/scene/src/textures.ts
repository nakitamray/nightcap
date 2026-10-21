import { Texture } from 'pixi.js'

// Soft shapes are way cheaper to bake once into a canvas than to fake with
// graphics + blur filters, so all the glows share these.

const cache = new Map<string, Texture>()

function canvasTexture(key: string, size: number, draw: (ctx: CanvasRenderingContext2D) => void) {
  const hit = cache.get(key)
  if (hit) return hit
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('no 2d context')
  draw(ctx)
  const tex = Texture.from(canvas)
  cache.set(key, tex)
  return tex
}

/** white radial falloff, tint it to whatever colour the light is */
export function glowTexture() {
  return canvasTexture('glow', 256, (ctx) => {
    const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128)
    g.addColorStop(0, 'rgba(255,255,255,1)')
    g.addColorStop(0.18, 'rgba(255,255,255,0.55)')
    g.addColorStop(0.45, 'rgba(255,255,255,0.16)')
    g.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 256, 256)
  })
}

/** a cone of light pointing down, apex at the top centre */
export function coneTexture() {
  return canvasTexture('cone', 256, (ctx) => {
    const g = ctx.createLinearGradient(0, 0, 0, 256)
    g.addColorStop(0, 'rgba(255,255,255,0.75)')
    g.addColorStop(0.6, 'rgba(255,255,255,0.18)')
    g.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.moveTo(122, 0)
    ctx.lineTo(134, 0)
    ctx.lineTo(256, 256)
    ctx.lineTo(0, 256)
    ctx.closePath()
    ctx.fill()
    // soften the edges so it doesn't look like a triangle
    const side = ctx.createLinearGradient(0, 0, 256, 0)
    side.addColorStop(0, 'rgba(0,0,0,1)')
    side.addColorStop(0.3, 'rgba(0,0,0,0)')
    side.addColorStop(0.7, 'rgba(0,0,0,0)')
    side.addColorStop(1, 'rgba(0,0,0,1)')
    ctx.globalCompositeOperation = 'destination-out'
    ctx.fillStyle = side
    ctx.fillRect(0, 0, 256, 256)
  })
}

/** a crisp disc, for stars and bulbs */
export function dotTexture() {
  return canvasTexture('dot', 64, (ctx) => {
    ctx.fillStyle = '#fff'
    ctx.beginPath()
    ctx.arc(32, 32, 30, 0, Math.PI * 2)
    ctx.fill()
  })
}

export function streakTexture() {
  return canvasTexture('streak', 32, (ctx) => {
    const g = ctx.createLinearGradient(0, 0, 0, 32)
    g.addColorStop(0, 'rgba(255,255,255,0)')
    g.addColorStop(1, 'rgba(255,255,255,1)')
    ctx.fillStyle = g
    ctx.fillRect(15, 0, 2, 32)
  })
}

export function ringTexture() {
  return canvasTexture('ring', 64, (ctx) => {
    ctx.strokeStyle = 'rgba(255,255,255,0.9)'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.ellipse(32, 32, 28, 28, 0, 0, Math.PI * 2)
    ctx.stroke()
  })
}

export function puffTexture() {
  return canvasTexture('puff', 128, (ctx) => {
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
    g.addColorStop(0, 'rgba(255,255,255,0.5)')
    g.addColorStop(0.6, 'rgba(255,255,255,0.15)')
    g.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 128, 128)
  })
}
