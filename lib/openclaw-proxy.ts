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
      'deepseek-v4-flash',
    bailianDeepSeekModels: ['deepseek-v4-flash', 'deepseek-v4-pro'],
  }
}

/** 百炼 compatible-mode：DeepSeek V4 建议开启思考模式（与官方 curl 示例一致） */
function patchChatCompletionBody(body: ArrayBuffer, targetBase: string): ArrayBuffer {
  if (!/dashscope\.aliyuncs\.com/i.test(targetBase) || body.byteLength === 0) return body
  try {
    const json = JSON.parse(new TextDecoder().decode(body)) as {
      model?: string
      enable_thinking?: boolean
    }
    if (typeof json.model === 'string' && /^deepseek-v4/i.test(json.model)) {
      if (json.enable_thinking == null) json.enable_thinking = true
      return new TextEncoder().encode(JSON.stringify(json))
    }
  } catch {
    /* keep original body */
  }
  return body
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

  const { base: targetBase } = normalizeProxyTarget(process.env.OPENCLAW_PROXY_TARGET)

  let body: ArrayBuffer | undefined
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    const buf = await request.arrayBuffer()
    if (buf.byteLength > 0) {
      body =
        subpath.includes('chat/completions') ? patchChatCompletionBody(buf, targetBase) : buf
    }
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
          '百炼 DeepSeek：OPENCLAW_TOKEN=百炼 API Key（sk-），OPENCLAW_PROXY_TARGET=https://dashscope.aliyuncs.com，OPENCLAW_PROXY_PATH=/compatible-mode，VITE_OPENCLAW_AGENT=deepseek-v4-flash',
          '勿把百炼 Key 配到 api.deepseek.com；deepseek-v4-flash 只在百炼 dashscope 上可用',
          '勿将 OPENCLAW_PROXY_TARGET 设为 127.0.0.1 或本地 Vite 地址',
        ],
      },
      { status: timedOut ? 504 : 502 },
    )
  }
}
