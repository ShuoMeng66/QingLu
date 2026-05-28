import { useCallback, useState } from 'react'

export function usePersistedBoolean(storageKey: string, defaultValue = false) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw === '1') return true
      if (raw === '0') return false
    } catch {
      /* ignore */
    }
    return defaultValue
  })

  const setPersisted = useCallback(
    (next: boolean | ((prev: boolean) => boolean)) => {
      setValue((prev) => {
        const resolved = typeof next === 'function' ? next(prev) : next
        try {
          localStorage.setItem(storageKey, resolved ? '1' : '0')
        } catch {
          /* ignore */
        }
        return resolved
      })
    },
    [storageKey],
  )

  return [value, setPersisted] as const
}
