import { handleOpenClawProxy } from './lib/openclaw-proxy'

export const config = {
  matcher: ['/api/openclaw/:path*', '/openclaw-api/:path*'],
}

export default function middleware(request: Request): Promise<Response> {
  return handleOpenClawProxy(request)
}
