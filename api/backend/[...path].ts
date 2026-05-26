/** Node runtime: longer timeout for Render cold start + SMTP (Edge middleware times out) */
export const config = {
  runtime: 'nodejs',
  maxDuration: 60,
}

function subpathFromRequest(request: Request): string {
  const pathname = new URL(request.url).pathname
  const prefix = '/api/backend/'
  if (!pathname.startsWith(prefix)) return ''
  return pathname.slice(prefix.length)
}

export default async function handler(request: Request): Promise<Response> {
  const backendBase = process.env.BACKEND_URL?.replace(/\/+$/, '')

  if (!backendBase) {
    return Response.json(
      {
        error: 'Backend not configured',
        hint: 'Set BACKEND_URL in Vercel to your deployed backend (e.g. Render/Railway)',
      },
      { status: 503 },
    )
  }

  const subpath = subpathFromRequest(request)
  const search = new URL(request.url).search
  const upstreamUrl = `${backendBase}/api/${subpath}${search}`

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
    console.error('[backend proxy]', error)
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
