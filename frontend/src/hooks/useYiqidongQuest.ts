import { useCallback, useEffect, useRef, useState } from 'react'
import type { YiqidongConfig } from '../lib/yiqidong'
import {
  canShowQuestPopup,
  markQuestDismissed,
  trySpawnCasualLetter,
  trySpawnScheduledLetter,
  type YiqidongLetter,
} from '../lib/yiqidongEnvelopes'

const MIN_INTERVAL_MS = 45_000
const MAX_INTERVAL_MS = 120_000
const SCHEDULED_POLL_MS = 60_000

function randomInterval() {
  return MIN_INTERVAL_MS + Math.random() * (MAX_INTERVAL_MS - MIN_INTERVAL_MS)
}

export function useYiqidongQuest(config: YiqidongConfig) {
  const [questLetter, setQuestLetter] = useState<YiqidongLetter | null>(null)
  const questRef = useRef<YiqidongLetter | null>(null)
  const configRef = useRef(config)
  const scheduleRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    configRef.current = config
  }, [config])

  useEffect(() => {
    questRef.current = questLetter
  }, [questLetter])

  const dismissQuest = useCallback((letterId: string) => {
    markQuestDismissed(letterId)
    setQuestLetter(null)
    scheduleRef.current?.()
  }, [])

  const clearQuest = useCallback(() => {
    setQuestLetter(null)
    scheduleRef.current?.()
  }, [])

  useEffect(() => {
    if (config.mode === 'off') {
      setQuestLetter(null)
      return
    }

    let timeoutId = 0
    let pollId = 0
    let cancelled = false

    const tryShowQuest = () => {
      if (cancelled || questRef.current) return false
      if (document.visibilityState !== 'visible') return false
      if (!canShowQuestPopup()) return false

      const current = configRef.current
      const letter =
        current.mode === 'casual'
          ? trySpawnCasualLetter(current)
          : current.mode === 'scheduled'
            ? trySpawnScheduledLetter(current)
            : null

      if (letter) {
        setQuestLetter(letter)
        return true
      }
      return false
    }

    const scheduleNext = (delay = randomInterval()) => {
      if (cancelled) return
      window.clearTimeout(timeoutId)
      timeoutId = window.setTimeout(() => {
        if (!tryShowQuest()) {
          scheduleNext()
        }
      }, delay)
    }

    scheduleRef.current = () => {
      if (configRef.current.mode === 'casual') {
        scheduleNext()
      }
    }

    if (config.mode === 'casual') {
      scheduleNext()
    }

    if (config.mode === 'scheduled') {
      pollId = window.setInterval(() => {
        if (!questRef.current) tryShowQuest()
      }, SCHEDULED_POLL_MS)
      tryShowQuest()
    }

    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && configRef.current.mode === 'casual' && !questRef.current) {
        scheduleNext(randomInterval() * 0.5)
      }
    }

    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      cancelled = true
      scheduleRef.current = null
      window.clearTimeout(timeoutId)
      window.clearInterval(pollId)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [config.mode])

  return { questLetter, dismissQuest, clearQuest }
}
