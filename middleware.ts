import { handleBackendProxy, isBackendApiPath } from './lib/backend-proxy'
import { handleOpenClawProxy } from './lib/openclaw-proxy'

export const config = {
  matcher: [
    '/api/auth/:path*',
    '/api/user/:path*',
    '/api/openclaw/:path*',
    '/openclaw-api/:path*',
  ],
}

export default function middleware(request: Request): Promise<Response> {
  const pathname = new URL(request.url).pathname
  if (isBackendApiPath(pathname)) {
    return handleBackendProxy(request)
  }
  return handleOpenClawProxy(request)
}
