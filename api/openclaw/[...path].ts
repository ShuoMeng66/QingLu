export const config = { runtime: 'edge' }

function subpathFromRequest(request: Request): string {
  const pathname = new URL(request.url).pathname
  const prefix = '/api/openclaw/'
  if (!pathname.startsWith(prefix)) return ''
  return pathname.slice(prefix.length)
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

function resolveToken(): string | undefined {
  return process.env.OPENCLAW_TOKEN?.trim() || process.env.DASHSCOPE_API_KEY?.trim() || undefined
}

export default async function handler(request: Request): Promise<Response> {
  const subpath = subpathFromRequest(request)

  if (subpath === 'health') {
    const token = resolveToken()
    return Response.json({
      ok: true,
      service: 'openclaw-proxy',
      runtime: 'edge',
      hasToken: Boolean(token),
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
