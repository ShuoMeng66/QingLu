export const backendProxyConfig = {
  runtime: 'nodejs' as const,
  maxDuration: 60,
}

/** Proxy /api/auth/* and /api/user/* to Render (or other) BACKEND_URL */
export async function proxyToBackend(request: Request, apiPrefix: '/api/auth' | '/api/user'): Promise<Response> {
  const backendBase = process.env.BACKEND_URL?.replace(/\/+$/, '')

  if (!backendBase) {
    return Response.json(
      {
        error: 'Backend not configured',
        hint: 'Set BACKEND_URL in Vercel to your deployed backend (e.g. Render)',
      },
      { status: 503 },
    )
  }

  const url = new URL(request.url)
  const pathname = url.pathname
  const subpath = pathname.startsWith(`${apiPrefix}/`)
    ? pathname.slice(apiPrefix.length + 1)
    : pathname === apiPrefix
      ? ''
      : pathname.replace(apiPrefix, '').replace(/^\//, '')

  const upstreamUrl = `${backendBase}${apiPrefix}${subpath ? `/${subpath}` : ''}${url.search}`

  const headers = new Headers()
  const contentType = request.headers.get('content-type')
  if (contentType) headers.set('Content-Type', contentType)
  const accept = request.headers.get('accept')
  if (accept) headers.set('Accept', accept)
  const authorization = request.headers.get('authorization')
  if (authorization) headers.set('Authorization', authorization)

  let body: ArrayBuffer | undefined
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    const buf = await request.arrayBuffer()
    if (buf.byteLength > 0) body = buf
  }

  try {
    const upstream = await fetch(upstreamUrl, {
      method: request.method,
      headers,
      body,
      signal: AbortSignal.timeout(55_000),
    })

    return new Response(upstream.body, {
      status: upstream.status,
      headers: upstream.headers,
    })
  } catch (error) {
    console.error('[backend proxy]', apiPrefix, error)
    const timedOut = error instanceof Error && error.name === 'TimeoutError'
    return Response.json(
      {
        error: timedOut
          ? 'Backend request timed out (service may be waking up — try again)'
          : 'Backend proxy failed',
        detail: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: timedOut ? 504 : 502 },
    )
  }
}
