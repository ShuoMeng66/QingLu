export interface GlowColor {
  from: string
  to: string
}

export interface GlowPosition {
  x: number
  y: number
}

const MINT = { r: 110, g: 231, b: 183 }
const SKY = { r: 56, g: 189, b: 248 }
const GREEN = { r: 0, g: 193, b: 124 }

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

function rgb(r: number, g: number, b: number) {
  return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`
}

/** 根据鼠标归一化位置插值薄荷绿 → 天空蓝 */
export function glowColorsAt(nx: number, ny: number): GlowColor {
  const t = Math.min(1, Math.max(0, nx * 0.65 + ny * 0.35))
  const from = {
    r: lerp(MINT.r, GREEN.r, t * 0.4),
    g: lerp(MINT.g, GREEN.g, t * 0.4),
    b: lerp(MINT.b, GREEN.b, t * 0.4),
  }
  const to = {
    r: lerp(GREEN.r, SKY.r, t),
    g: lerp(GREEN.g, SKY.g, t),
    b: lerp(GREEN.b, SKY.b, t),
  }
  return {
    from: rgb(from.r, from.g, from.b),
    to: rgb(to.r, to.g, to.b),
  }
}

export function gradientStyle(colors: GlowColor): string {
  return `radial-gradient(circle at 30% 30%, ${colors.from} 0%, ${colors.to} 55%, transparent 72%)`
}

export class CursorGlowController {
  target: GlowPosition = { x: 0.5, y: 0.5 }
  current: GlowPosition = { x: 0.5, y: 0.5 }
  secondary: GlowPosition = { x: 0.5, y: 0.5 }
  private raf = 0
  private ease = 0.12
  private trailEase = 0.07
  private running = false
  onFrame: (() => void) | null = null

  setTarget(clientX: number, clientY: number) {
    const w = window.innerWidth || 1
    const h = window.innerHeight || 1
    this.target = {
      x: clientX / w,
      y: clientY / h,
    }
    this.start()
  }

  resetCenter() {
    this.target = { x: 0.5, y: 0.5 }
    this.start()
  }

  private tick = () => {
    this.current = {
      x: this.current.x + (this.target.x - this.current.x) * this.ease,
      y: this.current.y + (this.target.y - this.current.y) * this.ease,
    }
    this.secondary = {
      x: this.secondary.x + (this.target.x - this.secondary.x) * this.trailEase,
      y: this.secondary.y + (this.target.y - this.secondary.y) * this.trailEase,
    }
    this.onFrame?.()
    this.raf = requestAnimationFrame(this.tick)
  }

  start() {
    if (this.running) return
    this.running = true
    this.raf = requestAnimationFrame(this.tick)
  }

  stop() {
    this.running = false
    cancelAnimationFrame(this.raf)
  }
}

export const cursorGlowController = new CursorGlowController()
