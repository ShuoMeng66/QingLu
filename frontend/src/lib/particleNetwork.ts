export interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  baseX: number
  baseY: number
}

export interface ParticleNetworkOptions {
  width: number
  height: number
  count?: number
  connectDistance?: number
  mouseRadius?: number
}

export function createParticles(options: ParticleNetworkOptions): Particle[] {
  const { width, height } = options
  const area = width * height
  const count = options.count ?? Math.min(1600, Math.max(400, Math.floor(area / 900)))
  const particles: Particle[] = []

  for (let i = 0; i < count; i++) {
    const x = Math.random() * width
    const y = Math.random() * height
    particles.push({
      x,
      y,
      baseX: x,
      baseY: y,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
    })
  }

  return particles
}

export function stepParticles(
  particles: Particle[],
  width: number,
  height: number,
  mouse: { x: number; y: number; active: boolean },
  opts: { connectDistance: number; mouseRadius: number; attract: boolean },
) {
  const { connectDistance, mouseRadius, attract } = opts
  const connectDistSq = connectDistance * connectDistance
  const mouseRadiusSq = mouseRadius * mouseRadius

  for (const p of particles) {
    p.x += p.vx
    p.y += p.vy

    if (p.x <= 0 || p.x >= width) p.vx *= -1
    if (p.y <= 0 || p.y >= height) p.vy *= -1

    p.x = Math.max(0, Math.min(width, p.x))
    p.y = Math.max(0, Math.min(height, p.y))

    p.x += (p.baseX - p.x) * 0.002
    p.y += (p.baseY - p.y) * 0.002

    if (mouse.active) {
      const dx = mouse.x - p.x
      const dy = mouse.y - p.y
      const distSq = dx * dx + dy * dy
      if (distSq < mouseRadiusSq && distSq > 1) {
        const dist = Math.sqrt(distSq)
        const force = (1 - dist / mouseRadius) * (attract ? 0.55 : -0.75)
        p.vx += (dx / dist) * force
        p.vy += (dy / dist) * force
      }
    }

    p.vx *= 0.985
    p.vy *= 0.985
  }

  return connectDistSq
}

export function drawParticleNetwork(
  ctx: CanvasRenderingContext2D,
  particles: Particle[],
  width: number,
  height: number,
  connectDistSq: number,
  reducedMotion: boolean,
) {
  ctx.clearRect(0, 0, width, height)
  ctx.fillStyle = '#ecfdf5'
  ctx.fillRect(0, 0, width, height)

  const linkDist = Math.sqrt(connectDistSq)

  for (let i = 0; i < particles.length; i++) {
    const a = particles[i]
    for (let j = i + 1; j < particles.length; j++) {
      const b = particles[j]
      const dx = a.x - b.x
      const dy = a.y - b.y
      const distSq = dx * dx + dy * dy
      if (distSq < connectDistSq) {
        const alpha = (1 - Math.sqrt(distSq) / linkDist) * 0.22
        ctx.strokeStyle = `rgba(0, 0, 0, ${alpha})`
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(a.x, a.y)
        ctx.lineTo(b.x, b.y)
        ctx.stroke()
      }
    }
  }

  for (const p of particles) {
    ctx.beginPath()
    ctx.arc(p.x, p.y, 1.2, 0, Math.PI * 2)
    ctx.fillStyle = reducedMotion ? 'rgba(0, 230, 118, 0.55)' : 'rgba(0, 0, 0, 0.75)'
    ctx.fill()
  }
}
