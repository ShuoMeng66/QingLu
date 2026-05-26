import { useEffect, useState } from 'react'
import {
  fetchNearbyRecommendations,
  type NearbyPlace,
} from '../lib/nearbyRecommendations'
import type { UserLocation } from '../lib/userLocation'

export function useNearbyRecommendations(location: UserLocation | null) {
  const [places, setPlaces] = useState<NearbyPlace[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!location) {
      setPlaces([])
      setLoading(false)
      setError(null)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    void fetchNearbyRecommendations(location)
      .then((result) => {
        if (cancelled) return
        setPlaces(result)
        if (result.length === 0) setError('附近暂无可用推荐')
      })
      .catch(() => {
        if (cancelled) return
        setPlaces([])
        setError('加载附近推荐失败')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [location?.lat, location?.lon, location?.fetchedAt])

  const foodPlaces = places.filter((place) => place.kind === 'food')
  const food = foodPlaces[0] ?? null
  const gym = places.find((place) => place.kind === 'gym') ?? null
  const recovery = places.find((place) => place.kind === 'recovery') ?? null

  return { food, foodPlaces, gym, recovery, places, loading, error }
}
