import type { ApiChatMessage, ChatMessage, ConnectionResult, OpenClawConfig } from '../types/openclaw'

function buildHeaders(token: string): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (token.trim()) {
    headers.Authorization = `Bearer ${token.trim()}`
  }

  return headers
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, '')
}

/** Relative /openclaw-api — Vercel/Vite proxy injects API key on the server */
function usesServerProxy(baseUrl: string): boolean {
  return baseUrl.startsWith('/')
}

function openClawHealthUrl(baseUrl: string): string {
  const normalized = normalizeBaseUrl(baseUrl)
  if (normalized.endsWith('/v1')) {
    // /api/openclaw/v1 → /api/openclaw/health（不能拼成 openclawhealth）
    return `${normalized.slice(0, -3)}/health`
  }
  return `${normalized}/health`
}

const FETCH_TIMEOUT_MS = 12_000

async function fetchWithTimeout(url: string, init?: RequestInit): Promise<Response> {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    return await fetch(url, { ...init, signal: controller.signal })
  } finally {
    window.clearTimeout(timer)
  }
}

async function tryProxyHealth(baseUrl: string): Promise<ConnectionResult | null> {
  try {
    const response = await fetchWithTimeout(openClawHealthUrl(baseUrl))
    const raw = await response.text()
    if (!response.ok) return null

    const payload = JSON.parse(raw) as { ok?: boolean; hasToken?: boolean }
    if (!payload.ok) return null

    return {
      ok: true,
      models: [],
      message: payload.hasToken
        ? 'OpenClaw 代理已就绪'
        : 'OpenClaw 代理可达（请在 Vercel 配置 OPENCLAW_TOKEN）',
    }
  } catch {
    return null
  }
}

export async function testConnection(config: OpenClawConfig): Promise<ConnectionResult> {
  const baseUrl = normalizeBaseUrl(config.baseUrl)
  const proxied = usesServerProxy(baseUrl)

  if (!proxied && !config.token.trim()) {
    return {
      ok: false,
      models: [],
      message: '服务认证信息缺失。如需自行部署，请在设置中开启开发者模式并填写访问密钥。',
    }
  }

  let proxyHealth: ConnectionResult | null = null
  if (proxied) {
    proxyHealth = await tryProxyHealth(baseUrl)
    if (!proxyHealth?.ok) {
      return (
        proxyHealth ?? {
          ok: false,
          models: [],
          message:
            '无法连接 AI 代理。请在 Vercel 配置 OPENCLAW_TOKEN（百炼 API Key）并 Redeploy，或打开 /api/openclaw/health 自检。',
        }
      )
    }
  }

  try {
    const response = await fetchWithTimeout(`${baseUrl}/models`, {
      headers: buildHeaders(config.token),
    })

    const contentType = response.headers.get('content-type') ?? ''
    const raw = await response.text()

    if (!response.ok) {
      if (proxied && proxyHealth?.ok) return proxyHealth
      if (proxied) {
        const health = await tryProxyHealth(baseUrl)
        if (health?.ok) return health
      }

      const isHtml = contentType.includes('text/html') || raw.trimStart().startsWith('<!')
      let detail = isHtml
        ? '接口返回了网页而非 JSON，请检查 Vercel 路由（vercel.json）是否把 API 转到了首页。'
        : raw.slice(0, 400)
      try {
        const err = JSON.parse(raw) as {
          detail?: string
          upstreamUrl?: string
          proxyTargetWarning?: string
          hints?: string[]
        }
        if (err.proxyTargetWarning) detail = err.proxyTargetWarning
        else if (err.detail) detail = err.detail
        if (err.upstreamUrl) detail += `（上游：${err.upstreamUrl}）`
        if (Array.isArray(err.hints) && err.hints[0]) detail += `。${err.hints[0]}`
      } catch {
        /* keep raw slice */
      }
      const hint =
        response.status === 401
          ? ' 访问密钥无效或已过期，请检查后重试。'
          : response.status === 503
            ? ' 请在 Vercel 环境变量中配置 OPENCLAW_TOKEN（百炼 API Key）并重新部署。'
            : ''
      return {
        ok: false,
        models: [],
        message: `连接失败（${response.status}）${detail ? `：${detail}` : ''}${hint}${
          proxied && response.status === 401
            ? ' 请在 Vercel 环境变量中配置 OPENCLAW_TOKEN（百炼 API Key）。'
            : ''
        }`,
      }
    }

    if (contentType.includes('text/html') || raw.trimStart().startsWith('<!')) {
      if (proxied && proxyHealth?.ok) return proxyHealth
      if (proxied) {
        const health = await tryProxyHealth(baseUrl)
        if (health?.ok) return health
      }
      return {
        ok: false,
        models: [],
        message:
          '接口返回了网页而非 JSON，请确认 Vercel 已部署 middleware.ts 且未用 SPA rewrite 吞掉 /api/openclaw。',
      }
    }

    let payload: { data?: Array<{ id: string }> }
    try {
      payload = JSON.parse(raw) as { data?: Array<{ id: string }> }
    } catch {
      return {
        ok: false,
        models: [],
        message: `连接失败：响应不是有效 JSON（${raw.slice(0, 120)}）`,
      }
    }
    const models = payload.data?.map((item) => ({ id: item.id })) ?? []

    return {
      ok: true,
      models,
      message: models.length
        ? `连接成功，已发现 ${models.length} 个可用模型`
        : proxyHealth?.message || '连接成功，服务已就绪',
    }
  } catch (error) {
    if (usesServerProxy(normalizeBaseUrl(config.baseUrl))) {
      if (proxyHealth?.ok) return proxyHealth
      const health = await tryProxyHealth(normalizeBaseUrl(config.baseUrl))
      if (health?.ok) return health
    }

    const message = error instanceof Error ? error.message : '未知错误'
    const corsHint =
      message === 'Failed to fetch'
        ? '。若 baseUrl 为外部 HTTPS 地址，请改用 /openclaw-api/v1 并配置 VITE_OPENCLAW_PROXY_TARGET。'
        : ''
    return {
      ok: false,
      models: [],
      message: `无法连接服务，请检查网络后重试（${message}）${corsHint}`,
    }
  }
}

interface StreamHandlers {
  onDelta: (delta: string) => void
  onDone: () => void
  onError: (message: string) => void
}

function toApiMessages(messages: ChatMessage[], systemPrompt?: string): ApiChatMessage[] {
  const payload = messages.map(({ role, content }) => ({ role, content } as ApiChatMessage))
  if (systemPrompt?.trim()) {
    return [{ role: 'system', content: systemPrompt.trim() }, ...payload]
  }
  return payload
}

/** 百炼 OpenAI 兼容接口下 DeepSeek V4 系列（见阿里云 Model Studio 文档） */
function isBailianDeepSeekV4Model(model: string): boolean {
  return /^deepseek-v4(-pro|-flash)?$/i.test(model.trim())
}

function buildChatCompletionBody(
  config: OpenClawConfig,
  messages: ChatMessage[],
  userId: string,
  systemPrompt: string | undefined,
  stream: boolean,
): Record<string, unknown> {
  const body: Record<string, unknown> = {
    model: config.agent,
    stream,
    user: userId,
    messages: toApiMessages(messages, systemPrompt),
  }
  if (isBailianDeepSeekV4Model(config.agent)) {
    body.enable_thinking = true
  }
  return body
}

export async function streamChat(
  config: OpenClawConfig,
  messages: ChatMessage[],
  userId: string,
  handlers: StreamHandlers,
  signal?: AbortSignal,
  systemPrompt?: string,
): Promise<void> {
  const baseUrl = normalizeBaseUrl(config.baseUrl)

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: buildHeaders(config.token),
    signal,
    body: JSON.stringify(buildChatCompletionBody(config, messages, userId, systemPrompt, true)),
  })

  if (!response.ok) {
    const detail = await response.text()
    handlers.onError(`服务响应异常（${response.status}）${detail ? `：${detail}` : ''}`)
    return
  }

  if (!response.body) {
    handlers.onError('服务未返回有效内容，请稍后重试')
    return
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed.startsWith('data:')) continue

        const payload = trimmed.slice(5).trim()
        if (payload === '[DONE]') {
          handlers.onDone()
          return
        }

        try {
          const parsed = JSON.parse(payload) as {
            choices?: Array<{ delta?: { content?: string } }>
          }
          const delta = parsed.choices?.[0]?.delta?.content
          if (delta) handlers.onDelta(delta)
        } catch {
          // Ignore malformed SSE chunks.
        }
      }
    }
  } catch (error) {
    if (signal?.aborted) return
    throw error
  }

  handlers.onDone()
}

export async function sendChat(
  config: OpenClawConfig,
  messages: ChatMessage[],
  userId: string,
  signal?: AbortSignal,
  systemPrompt?: string,
): Promise<string> {
  const baseUrl = normalizeBaseUrl(config.baseUrl)

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: buildHeaders(config.token),
    signal,
    body: JSON.stringify(buildChatCompletionBody(config, messages, userId, systemPrompt, false)),
  })

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`服务响应异常（${response.status}）${detail ? `：${detail}` : ''}`)
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>
  }

  return payload.choices?.[0]?.message?.content?.trim() || '（暂无回复内容）'
}
