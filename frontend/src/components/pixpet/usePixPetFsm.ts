import { useCallback, useEffect, useRef, useState } from 'react'
import type { PixPetAction } from './types'

const AUTO_SEQUENCE: PixPetAction[] = ['idle', 'eating', 'idle', 'exercising']
const DURATIONS: Record<PixPetAction, number> = {
  idle: 5200,
  eating: 4200,
  exercising: 4800,
}

export function usePixPetFsm(autoCycle = true) {
  const [action, setAction] = useState<PixPetAction>('idle')
  const [manual, setManual] = useState(false)
  const timerRef = useRef<number | null>(null)
  const stepRef = useRef(0)

  const clearTimer = () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  const scheduleNext = useCallback(() => {
    clearTimer()
    if (!autoCycle || manual) return

    const current = AUTO_SEQUENCE[stepRef.current % AUTO_SEQUENCE.length]
    setAction(current)
    timerRef.current = window.setTimeout(() => {
      stepRef.current += 1
      scheduleNext()
    }, DURATIONS[current])
  }, [autoCycle, manual])

  useEffect(() => {
    scheduleNext()
    return clearTimer
  }, [scheduleNext])

  const trigger = useCallback((next: PixPetAction) => {
    setManual(true)
    setAction(next)
    clearTimer()
    timerRef.current = window.setTimeout(() => {
      setManual(false)
      stepRef.current = AUTO_SEQUENCE.indexOf('idle')
      scheduleNext()
    }, DURATIONS[next])
  }, [scheduleNext])

  return { action, trigger }
}
