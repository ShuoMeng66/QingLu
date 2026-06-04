import { useUserLocation } from '../../hooks/useUserLocation'
import { formatLocationLabel, getCitySkylineFallback, getCitySkylineUrl } from '../../lib/citySkyline'

interface CityBackgroundProps {
  variant?: 'splash' | 'chat'
}

/** Layer 1 · 纯城市外景（根据定位城市，无人物） */
export function CityBackground({ variant = 'chat' }: CityBackgroundProps) {
  const { location, loading } = useUserLocation()
  const city = location?.city
  const skylineUrl = city ? getCitySkylineUrl(city) : getCitySkylineFallback()
  const fallbackUrl = getCitySkylineFallback()
  const label = city ? formatLocationLabel(city, location?.region) : loading ? '定位中…' : ''

  return (
    <div
      className={`city-bg pointer-events-none absolute inset-x-0 top-0 z-[1] overflow-hidden ${
        variant === 'splash' ? 'city-bg--splash' : 'city-bg--chat'
      }`}
      aria-hidden="true"
    >
      <img
        src={skylineUrl}
        alt=""
        className="city-bg__photo"
        onError={(event) => {
          if (event.currentTarget.src !== fallbackUrl) {
            event.currentTarget.src = fallbackUrl
          }
        }}
      />

      <div className="city-bg__haze" />
      <div className="city-bg__fade" />

      {label && <p className="city-bg__label">{label}</p>}
    </div>
  )
}
