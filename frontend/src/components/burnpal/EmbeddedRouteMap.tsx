import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useI18n } from '../../hooks/useI18n'
import {
  fetchWalkingRoute,
  formatRouteDuration,
  type LatLon,
} from '../../lib/osrmRoute'
import { formatDistance } from '../../lib/userLocation'
import './EmbeddedRouteMap.css'

interface EmbeddedRouteMapProps {
  destination: LatLon & { label?: string }
  origin?: LatLon | null
  className?: string
}

function markerIcon(className: string) {
  return L.divIcon({
    className: '',
    html: `<span class="embedded-route-map__marker ${className}"></span>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  })
}

export function EmbeddedRouteMap({
  destination,
  origin,
  className = '',
}: EmbeddedRouteMapProps) {
  const { t } = useI18n()
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const layerGroupRef = useRef<L.LayerGroup | null>(null)
  const [loading, setLoading] = useState(Boolean(origin))
  const [routeSummary, setRouteSummary] = useState<string | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    if (mapRef.current) {
      mapRef.current.remove()
      mapRef.current = null
    }

    const map = L.map(container, {
      zoomControl: false,
      attributionControl: true,
    })
    mapRef.current = map

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
    }).addTo(map)

    L.control.zoom({ position: 'topright' }).addTo(map)

    const layers = L.layerGroup().addTo(map)
    layerGroupRef.current = layers

    const destMarker = L.marker([destination.lat, destination.lon], {
      icon: markerIcon('embedded-route-map__marker--dest'),
      title: destination.label ?? t('detail.destination'),
    })
    layers.addLayer(destMarker)

    const bounds = L.latLngBounds([[destination.lat, destination.lon]])

    if (origin) {
      const originMarker = L.marker([origin.lat, origin.lon], {
        icon: markerIcon('embedded-route-map__marker--origin'),
        title: t('detail.youAreHere'),
      })
      layers.addLayer(originMarker)
      bounds.extend([origin.lat, origin.lon])
    }

    map.fitBounds(bounds.pad(origin ? 0.2 : 0.35), { animate: false, maxZoom: 16 })

    const controller = new AbortController()
    let cancelled = false

    if (origin) {
      setLoading(true)
      setRouteSummary(null)
      void fetchWalkingRoute(origin, destination, controller.signal).then((route) => {
        if (cancelled || !mapRef.current || !layerGroupRef.current) return

        if (route && route.polyline.length > 1) {
          const line = L.polyline(route.polyline, {
            color: '#10b981',
            weight: 5,
            opacity: 0.88,
            lineCap: 'round',
            lineJoin: 'round',
          })
          layerGroupRef.current.addLayer(line)
          map.fitBounds(line.getBounds().pad(0.15), { animate: false, maxZoom: 16 })
          setRouteSummary(
            `${t('detail.routeWalk')} · ${formatDistance(route.distanceM)} · ${formatRouteDuration(route.durationSec)}`,
          )
        } else {
          setRouteSummary(t('detail.routeUnavailable'))
        }
        setLoading(false)
      })
    } else {
      setLoading(false)
      setRouteSummary(null)
    }

    return () => {
      cancelled = true
      controller.abort()
      map.remove()
      mapRef.current = null
      layerGroupRef.current = null
    }
  }, [destination.lat, destination.lon, destination.label, origin?.lat, origin?.lon, t])

  return (
    <div
      className={`embedded-route-map h-52 w-full sm:h-56 ${className}`}
      aria-label={t('detail.mapLabel')}
    >
      <div ref={containerRef} className="h-full w-full" />
      {loading && <div className="embedded-route-map__loading">{t('detail.mapLoading')}</div>}
      {(routeSummary || !origin) && !loading && (
        <div className="embedded-route-map__badge">
          {routeSummary && <span className="embedded-route-map__pill">{routeSummary}</span>}
          {!origin && (
            <span className="embedded-route-map__pill">{t('detail.mapNoOrigin')}</span>
          )}
        </div>
      )}
    </div>
  )
}
