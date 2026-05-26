import { handleBackendProxy, isBackendApiPath } from './lib/backend-proxy'

export const config = {
  matcher: ['/api/auth/:path*', '/api/user/:path*'],
}

export default function middleware(request: Request): Promise<Response> {
  return handleBackendProxy(request)
}
