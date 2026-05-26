const DASHSCOPE_BASE = 'https://dashscope.aliyuncs.com'
const DASHSCOPE_PATH = '/compatible-mode'
const DEEPSEEK_BASE = 'https://api.deepseek.com'
const DEEPSEEK_PATH = '/v1'

const FETCH_TIMEOUT_MS = 28_000

function resolveToken(): string | undefined {
  return (
    process.env.OPENCLAW_TOKEN?.trim() ||
    process.env.DASHSCOPE_API_KEY?.trim() ||
    process.env.DEEPSEEK_API_KEY?.trim() ||
    undefined
  )
}

function normalizeProxyTarget(raw: string | undefined): { base: string; warning?: string } {
  const fallback = DASHSCOPE_BASE
  const trimmed = raw?.trim()
  if (!trimmed) return { base: fallback }

  if (/localhost|127\.0\.0\.1|0\.0\.0\.0|192\.168\.|10\.\d+\./i.test(trimmed)) {
    return {
      base: fallback,
      warning:
        'OPENCLAW_PROXY_TARGET 指向本机/内网，Vercel 无法访问；已回退到百炼 dashscope.aliyuncs.com。请删除或改为 https://dashscope.aliyuncs.com',
    }
  }

  return { base: trimmed.replace(/\/+$/, '') }
}

function resolveProxyPath(targetBase: string, rawPath: string | undefined): string {
  const trimmed = rawPath?.trim()
  if (trimmed) return trimmed.startsWith('/') ? trimmed : `/${trimmed}`

  if (/deepseek\.com/i.test(targetBase)) return DEEPSEEK_PATH
  return DASHSCOPE_PATH
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
  const { base: targetBase } = normalizeProxyTarget(process.env.OPENCLAW_PROXY_TARGET)
  const prefix = resolveProxyPath(targetBase, process.env.OPENCLAW_PROXY_PATH)
  const search = new URL(request.url).search
  const path = subpath ? `/${subpath}` : ''
  return `${targetBase}${prefix}${path}${search}`
}

function upstreamDiagnostics(request: Request) {
  const { base, warning } = normalizeProxyTarget(process.env.OPENCLAW_PROXY_TARGET)
  const prefix = resolveProxyPath(base, process.env.OPENCLAW_PROXY_PATH)
  const subpath = subpathFromPathname(new URL(request.url).pathname)
  return {
    proxyTarget: base,
    proxyPath: prefix,
    sampleUpstream: `${base}${prefix}/${subpath || 'v1/models'}`,
    proxyTargetWarning: warning,
    hasToken: Boolean(resolveToken()),
    defaultModel:
      process.env.OPENCLAW_AGENT?.trim() ||
      process.env.VITE_OPENCLAW_AGENT?.trim() ||
      'qwen-plus',
  }
}

export async function handleOpenClawProxy(request: Request): Promise<Response> {
  const subpath = subpathFromPathname(new URL(request.url).pathname)

  if (subpath === 'health') {
    const diag = upstreamDiagnostics(request)
    return Response.json({
      ok: true,
      service: 'openclaw-proxy',
      runtime: process.env.VERCEL ? 'vercel-serverless' : 'local',
      ...diag,
    })
  }

  const token = resolveToken()
  if (!token) {
    return Response.json(
      {
        error: 'OPENCLAW_TOKEN not configured',
        hint: '在 Vercel 环境变量设置 OPENCLAW_TOKEN（百炼 API Key，sk- 开头）或 DEEPSEEK_API_KEY，然后 Redeploy',
      },
      { status: 503 },
    )
  }

  const upstreamUrl = buildUpstreamUrl(request, subpath)
  const headers = new Headers({
    Authorization: `Bearer ${token}`,
    'User-Agent': 'BurnPal-OpenClaw-Proxy/1.0',
  })

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
      cache: 'no-store',
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    })

    return new Response(upstream.body, {
      status: upstream.status,
      headers: upstream.headers,
    })
  } catch (error) {
    console.error('[openclaw proxy]', upstreamUrl, error)
    const timedOut = error instanceof Error && error.name === 'TimeoutError'
    const diag = upstreamDiagnostics(request)
    return Response.json(
      {
        error: timedOut ? 'OpenClaw proxy timed out' : 'OpenClaw proxy failed',
        detail: error instanceof Error ? error.message : 'Unknown error',
        upstreamUrl,
        ...diag,
        hints: [
          '百炼：OPENCLAW_PROXY_TARGET=https://dashscope.aliyuncs.com，OPENCLAW_PROXY_PATH=/compatible-mode，模型用 qwen-plus',
          'DeepSeek：OPENCLAW_PROXY_TARGET=https://api.deepseek.com，OPENCLAW_PROXY_PATH=/v1，OPENCLAW_TOKEN=DeepSeek Key，模型用 deepseek-chat',
          '勿将 OPENCLAW_PROXY_TARGET 设为 127.0.0.1 或 Vite 本地地址',
        ],
      },
      { status: timedOut ? 504 : 502 },
    )
  }
}
