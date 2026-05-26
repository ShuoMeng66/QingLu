import { useCallback, useEffect, useRef, useState } from 'react'
import type { PixPetMood, PixPetRestPhase, PixPetState } from './types'

/** 无聊天内容时轮播全部吃饭 / 锻炼动作 */
const AUTO_SEQUENCE: PixPetState[] = [
  { mode: 'eating', eating: 'hotpot' },
  { mode: 'eating', eating: 'bbq' },
  { mode: 'eating', eating: 'meal' },
  { mode: 'exercising', exercise: 'dumbbell' },
  { mode: 'exercising', exercise: 'treadmill' },
  { mode: 'exercising', exercise: 'football' },
  { mode: 'exercising', exercise: 'basketball' },
  { mode: 'exercising', exercise: 'workout' },
]

const AUTO_DURATION = 4500
const MOOD_DURATION = 2200
const DOZE_AFTER_MS = 18_000
const SLEEP_AFTER_MS = 40_000

interface ControllerOptions {
  chatState: PixPetState
  autoPlay: boolean
  loading?: boolean
  isTyping?: boolean
  previewState?: PixPetState | null
}

export function usePixPetController({
  chatState,
  autoPlay,
  loading = false,
  isTyping = false,
  previewState = null,
}: ControllerOptions) {
  const [autoState, setAutoState] = useState<PixPetState>(AUTO_SEQUENCE[0])
  const [mood, setMood] = useState<PixPetMood>('normal')
  const [restPhase, setRestPhase] = useState<PixPetRestPhase>('awake')
  const stepRef = useRef(0)
  const timerRef = useRef<number | null>(null)
  const moodTimerRef = useRef<number | null>(null)
  const lastActivityRef = useRef(Date.now())

  const bumpActivity = useCallback(() => {
    lastActivityRef.current = Date.now()
    setRestPhase('awake')
  }, [])

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const clearMoodTimer = useCallback(() => {
    if (moodTimerRef.current !== null) {
      window.clearTimeout(moodTimerRef.current)
      moodTimerRef.current = null
    }
  }, [])

  const setTimedMood = useCallback(
    (next: PixPetMood, duration = MOOD_DURATION) => {
      clearMoodTimer()
      setMood(next)
      if (next === 'normal') return
      moodTimerRef.current = window.setTimeout(() => {
        setMood('normal')
        moodTimerRef.current = null
      }, duration)
    },
    [clearMoodTimer],
  )

  const poke = useCallback(() => {
    bumpActivity()
    setTimedMood('happy', 1800)
  }, [bumpActivity, setTimedMood])

  const celebrate = useCallback(() => {
    bumpActivity()
    setTimedMood('celebrate', 1600)
  }, [bumpActivity, setTimedMood])

  const wake = useCallback(() => {
    bumpActivity()
  }, [bumpActivity])

  const chatActive = chatState.mode !== 'idle'
  const isResting = restPhase !== 'awake'

  const scheduleAuto = useCallback(() => {
    clearTimer()
    if (!autoPlay || chatActive || previewState || isResting) return

    const current = AUTO_SEQUENCE[stepRef.current % AUTO_SEQUENCE.length]
    setAutoState(current)
    timerRef.current = window.setTimeout(() => {
      stepRef.current += 1
      scheduleAuto()
    }, AUTO_DURATION)
  }, [autoPlay, chatActive, previewState, isResting, clearTimer])

  useEffect(() => {
    scheduleAuto()
    return clearTimer
  }, [scheduleAuto, clearTimer])

  useEffect(() => {
    if (loading || isTyping || previewState) {
      bumpActivity()
    }
  }, [loading, isTyping, previewState, bumpActivity])

  useEffect(() => {
    if (loading) {
      setMood('thinking')
      return
    }
    if (isTyping) {
      setMood((current) =>
        current === 'happy' || current === 'celebrate' ? current : 'listening',
      )
      return
    }
    setMood((current) =>
      current === 'thinking' || current === 'listening' ? 'normal' : current,
    )
  }, [loading, isTyping])

  useEffect(() => {
    const tick = () => {
      if (loading || isTyping || previewState) return
      const idleMs = Date.now() - lastActivityRef.current
      if (idleMs >= SLEEP_AFTER_MS) {
        setRestPhase('sleep')
      } else if (idleMs >= DOZE_AFTER_MS) {
        setRestPhase('doze')
      }
    }
    tick()
    const id = window.setInterval(tick, 1500)
    return () => window.clearInterval(id)
  }, [loading, isTyping, previewState])

  useEffect(() => () => clearMoodTimer(), [clearMoodTimer])

  const actionState = previewState ?? (chatActive ? chatState : autoState)
  const displayState: PixPetState = isResting ? { mode: 'idle' } : actionState

  return {
    state: displayState,
    actionState,
    restPhase,
    mood,
    chatActive,
    isResting,
    poke,
    celebrate,
    wake,
    bumpActivity,
    setTimedMood,
  }
}

export function stateClassName(state: PixPetState, restPhase: PixPetRestPhase = 'awake'): string {
  if (restPhase === 'sleep') return 'sleeping'
  if (restPhase === 'doze') return 'dozing'
  if (state.mode === 'idle') return 'idle'
  if (state.mode === 'eating') return `eating-${state.eating ?? 'meal'}`
  return `exercising-${state.exercise ?? 'workout'}`
}
