import { handleBackendProxy, isBackendApiPath } from './lib/backend-proxy'
import { handleOpenClawProxy } from './lib/openclaw-proxy'
import { handleOsrmProxy, isOsrmApiPath } from './lib/osrm-proxy'
import { handleVenueEnrich, isVenueEnrichPath } from './lib/venue-enrich-proxy'

export const config = {
  matcher: [
    '/api/auth/:path*',
    '/api/user/:path*',
    '/api/openclaw/:path*',
    '/openclaw-api/:path*',
    '/api/osrm/:path*',
    '/api/venue/enrich',
  ],
}

export default function middleware(request: Request): Promise<Response> {
  const pathname = new URL(request.url).pathname
  if (isVenueEnrichPath(pathname)) {
    return handleVenueEnrich(request)
  }
  if (isOsrmApiPath(pathname)) {
    return handleOsrmProxy(request)
  }
  if (isBackendApiPath(pathname)) {
    return handleBackendProxy(request)
  }
  return handleOpenClawProxy(request)
}
