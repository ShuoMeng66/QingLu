import { useEffect, useRef } from 'react'
import {
  createParticles,
  drawParticleNetwork,
  stepParticles,
  type Particle,
} from '../lib/particleNetwork'

/** 全屏粒子网络背景 — 光点 + 连线 + 鼠标聚集/扩散 */
export function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const mouseRef = useRef({ x: 0, y: 0, active: false })
  const rafRef = useRef(0)
  const attractRef = useRef(true)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const connectDistance = 95
    const mouseRadius = 140

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w = window.innerWidth
      const h = window.innerHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      particlesRef.current = createParticles({ width: w, height: h })
    }

    resize()
    window.addEventListener('resize', resize)

    const onMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY, active: true }
    }
    const onLeave = () => {
      mouseRef.current.active = false
    }
    const onClick = () => {
      attractRef.current = !attractRef.current
    }

    if (!reducedMotion) {
      window.addEventListener('mousemove', onMove, { passive: true })
      window.addEventListener('mouseleave', onLeave)
      window.addEventListener('click', onClick)
    }

    const tick = () => {
      const w = window.innerWidth
      const h = window.innerHeight
      const particles = particlesRef.current

      if (!reducedMotion) {
        const connectDistSq = stepParticles(particles, w, h, mouseRef.current, {
          connectDistance,
          mouseRadius,
          attract: attractRef.current,
        })
        drawParticleNetwork(ctx, particles, w, h, connectDistSq, false)
      } else {
        drawParticleNetwork(ctx, particles, w, h, connectDistance * connectDistance, true)
      }

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)

    return () => {
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseleave', onLeave)
      window.removeEventListener('click', onClick)
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="particle-canvas"
      aria-hidden="true"
    />
  )
}
