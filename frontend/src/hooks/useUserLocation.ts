import { useCallback, useEffect, useState } from 'react'
import {
  getCachedUserLocation,
  resolveUserLocation,
  type LocationSource,
  type UserLocation,
} from '../lib/userLocation'

export type LocationStatus = 'idle' | 'loading' | 'ready' | 'denied' | 'unavailable'

async function isGeolocationDenied(): Promise<boolean> {
  try {
    const permissions = navigator.permissions
    if (!permissions?.query) return false
    const status = await permissions.query({ name: 'geolocation' })
    return status.state === 'denied'
  } catch {
    return false
  }
}

export function useUserLocation(options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? true
  const [location, setLocation] = useState<UserLocation | null>(() =>
    enabled ? getCachedUserLocation() : null,
  )
  const [status, setStatus] = useState<LocationStatus>(() => {
    if (!enabled) return 'idle'
    return getCachedUserLocation() ? 'ready' : 'loading'
  })
  const [error, setError] = useState<string | null>(null)

  const applyResult = useCallback((result: UserLocation | null, denied = false) => {
    if (result) {
      setLocation(result)
      setStatus('ready')
      setError(null)
      return
    }
    setLocation(null)
    setStatus(denied ? 'denied' : 'unavailable')
    setError(denied ? '未授权位置权限' : '暂时无法获取位置')
  }, [])

  const refresh = useCallback(async (preferFreshGps = false) => {
    if (!enabled) return
    setStatus('loading')
    setError(null)
    const result = await resolveUserLocation({ preferFreshGps })
    if (result) {
      applyResult(result)
      return
    }
    const denied = preferFreshGps ? await isGeolocationDenied() : false
    applyResult(null, denied)
  }, [applyResult, enabled])

  useEffect(() => {
    if (!enabled) {
      setLocation(null)
      setStatus('idle')
      setError(null)
      return
    }

    let cancelled = false
    void resolveUserLocation().then((result) => {
      if (cancelled) return
      applyResult(result)
    })
    return () => {
      cancelled = true
    }
  }, [applyResult, enabled])

  const requestPermission = useCallback(async () => {
    await refresh(true)
  }, [refresh])

  const source: LocationSource | null = location?.source ?? null

  return {
    location,
    loading: status === 'loading',
    status,
    source,
    error,
    refresh,
    requestPermission,
  }
}
