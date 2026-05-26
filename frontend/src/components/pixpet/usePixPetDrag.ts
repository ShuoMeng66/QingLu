import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { loadPixPetPosition, savePixPetPosition, type PixPetPosition } from './types'

const DRAG_THRESHOLD = 8

interface UsePixPetDragOptions {
  layout: 'hero' | 'compact'
  enabled?: boolean
  onDragStart?: () => void
  onDragEnd?: () => void
  onTap?: () => void
}

export function usePixPetDrag({
  layout,
  enabled = true,
  onDragStart,
  onDragEnd,
  onTap,
}: UsePixPetDragOptions) {
  const [position, setPosition] = useState<PixPetPosition | null>(() =>
    enabled ? loadPixPetPosition(layout) : null,
  )
  const [isDragging, setIsDragging] = useState(false)
  const pointerRef = useRef<{
    pointerId: number
    startX: number
    startY: number
    originX: number
    originY: number
    moved: boolean
  } | null>(null)

  useEffect(() => {
    if (!enabled) return
    setPosition(loadPixPetPosition(layout))
  }, [layout, enabled])

  const resetPosition = useCallback(() => {
    setPosition(null)
    savePixPetPosition(layout, null)
  }, [layout])

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (!enabled || event.button !== 0) return
      const target = event.currentTarget
      target.setPointerCapture(event.pointerId)
      pointerRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        originX: position?.x ?? 0,
        originY: position?.y ?? 0,
        moved: false,
      }
    },
    [enabled, position],
  )

  const onPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      const session = pointerRef.current
      if (!session || session.pointerId !== event.pointerId) return

      const dx = event.clientX - session.startX
      const dy = event.clientY - session.startY

      if (!session.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return

      if (!session.moved) {
        session.moved = true
        setIsDragging(true)
        onDragStart?.()
      }

      setPosition({
        x: session.originX + dx,
        y: session.originY + dy,
      })
    },
    [onDragStart],
  )

  const finishPointer = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      const session = pointerRef.current
      if (!session || session.pointerId !== event.pointerId) return

      try {
        event.currentTarget.releasePointerCapture(event.pointerId)
      } catch {
        /* already released */
      }

      if (session.moved) {
        const dx = event.clientX - session.startX
        const dy = event.clientY - session.startY
        const next = {
          x: session.originX + dx,
          y: session.originY + dy,
        }
        setPosition(next)
        savePixPetPosition(layout, next)
        onDragEnd?.()
      } else {
        onTap?.()
      }

      pointerRef.current = null
      setIsDragging(false)
    },
    [layout, onDragEnd, onTap],
  )

  const onPointerUp = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      finishPointer(event)
    },
    [finishPointer],
  )

  const onPointerCancel = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      finishPointer(event)
    },
    [finishPointer],
  )

  const style =
    position && enabled
      ? {
          transform: `translate(${position.x}px, ${position.y}px)`,
        }
      : undefined

  return {
    position,
    isDragging,
    style,
    resetPosition,
    dragHandlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel,
    },
  }
}
