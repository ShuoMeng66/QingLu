import { useEffect, useState } from 'react'
import {
  cursorGlowController,
  glowColorsAt,
  gradientStyle,
  type GlowColor,
} from '../lib/cursorGlow'

export function CursorGlow() {
  const [primary, setPrimary] = useState<GlowColor>(() => glowColorsAt(0.5, 0.5))
  const [pos, setPos] = useState({ x: 50, y: 50, tx: 50, ty: 50 })
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mq.matches)
    const onChange = () => setReducedMotion(mq.matches)
    mq.addEventListener('change', onChange)

    cursorGlowController.onFrame = () => {
      const { current, secondary } = cursorGlowController
      setPrimary(glowColorsAt(current.x, current.y))
      setPos({
        x: current.x * 100,
        y: current.y * 100,
        tx: secondary.x * 100,
        ty: secondary.y * 100,
      })
    }

    if (!mq.matches) {
      const onMove = (e: MouseEvent) => cursorGlowController.setTarget(e.clientX, e.clientY)
      window.addEventListener('mousemove', onMove, { passive: true })
      cursorGlowController.start()
      return () => {
        window.removeEventListener('mousemove', onMove)
        cursorGlowController.stop()
        cursorGlowController.onFrame = null
        mq.removeEventListener('change', onChange)
      }
    }

    cursorGlowController.resetCenter()
    return () => {
      cursorGlowController.stop()
      cursorGlowController.onFrame = null
      mq.removeEventListener('change', onChange)
    }
  }, [])

  const grad = gradientStyle(primary)

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[1] overflow-hidden"
      aria-hidden="true"
    >
      <div
        className="absolute h-[min(42vw,420px)] w-[min(42vw,420px)] rounded-full blur-3xl opacity-35 transition-opacity duration-300"
        style={{
          left: `${pos.x}%`,
          top: `${pos.y}%`,
          transform: 'translate(-50%, -50%)',
          background: grad,
          willChange: reducedMotion ? 'auto' : 'left, top',
        }}
      />
      {!reducedMotion && (
        <div
          className="absolute h-[min(28vw,280px)] w-[min(28vw,280px)] rounded-full blur-3xl opacity-25"
          style={{
            left: `${pos.tx}%`,
            top: `${pos.ty}%`,
            transform: 'translate(-50%, -50%)',
            background: grad,
            willChange: 'left, top',
          }}
        />
      )}
    </div>
  )
}
