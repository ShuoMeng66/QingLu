function resolveToken(): string | undefined {
  return process.env.OPENCLAW_TOKEN?.trim() || process.env.DASHSCOPE_API_KEY?.trim() || undefined
}

export function subpathFromPathname(pathname: string): string {
  if (pathname.startsWith('/api/openclaw/')) {
    return pathname.slice('/api/openclaw/'.length)
  }
  if (pathname === '/api/openclaw') return ''
  if (pathname.startsWith('/openclaw-api/')) {
    return pathname.slice('/openclaw-api/'.length)
  }
  if (pathname === '/openclaw-api') return ''
  return ''
}

function buildUpstreamUrl(request: Request, subpath: string): string {
  const targetBase = (process.env.OPENCLAW_PROXY_TARGET || 'https://dashscope.aliyuncs.com').replace(
    /\/+$/,
    '',
  )
  const prefix = process.env.OPENCLAW_PROXY_PATH || '/compatible-mode'
  const search = new URL(request.url).search
  const path = subpath ? `/${subpath}` : ''
  return `${targetBase}${prefix}${path}${search}`
}

export async function handleOpenClawProxy(request: Request): Promise<Response> {
  const subpath = subpathFromPathname(new URL(request.url).pathname)

  if (subpath === 'health') {
    return Response.json({
      ok: true,
      service: 'openclaw-proxy',
      runtime: 'edge-middleware',
      hasToken: Boolean(resolveToken()),
      proxyTarget: process.env.OPENCLAW_PROXY_TARGET || 'https://dashscope.aliyuncs.com',
      proxyPath: process.env.OPENCLAW_PROXY_PATH || '/compatible-mode',
    })
  }

  const token = resolveToken()
  if (!token) {
    return Response.json(
      {
        error: 'OPENCLAW_TOKEN not configured',
        hint: 'Set OPENCLAW_TOKEN (DashScope API key) in Vercel project environment variables',
      },
      { status: 503 },
    )
  }

  const upstreamUrl = buildUpstreamUrl(request, subpath)
  const headers = new Headers()
  headers.set('Authorization', `Bearer ${token}`)

  const contentType = request.headers.get('content-type')
  if (contentType) headers.set('Content-Type', contentType)
  const accept = request.headers.get('accept')
  if (accept) headers.set('Accept', accept)

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
    })

    return new Response(upstream.body, {
      status: upstream.status,
      headers: upstream.headers,
    })
  } catch (error) {
    console.error('[openclaw proxy]', error)
    return Response.json(
      {
        error: 'OpenClaw proxy failed',
        detail: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 502 },
    )
  }
}
