/** 经 Vercel Edge 转发 OSRM，避免浏览器直连境外路由服务被墙/超时 */

const OSRM_UPSTREAM = 'https://router.project-osrm.org'
const FETCH_TIMEOUT_MS = 12_000

export function isOsrmApiPath(pathname: string): boolean {
  return pathname.startsWith('/api/osrm')
}

export async function handleOsrmProxy(request: Request): Promise<Response> {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return Response.json({ error: 'OSRM proxy only supports GET' }, { status: 405 })
  }

  const url = new URL(request.url)
  const subpath = url.pathname.replace(/^\/api\/osrm/, '') || ''
  const upstreamUrl = `${OSRM_UPSTREAM}${subpath}${url.search}`

  try {
    const upstream = await fetch(upstreamUrl, {
      method: request.method,
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    })

    const body = await upstream.arrayBuffer()
    const headers = new Headers()
    const contentType = upstream.headers.get('content-type')
    if (contentType) headers.set('Content-Type', contentType)
    headers.set('Cache-Control', 'public, max-age=300')

    return new Response(body, { status: upstream.status, headers })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'OSRM upstream failed'
    return Response.json({ error: message, hint: 'OSRM route service unreachable from edge' }, { status: 502 })
  }
}
