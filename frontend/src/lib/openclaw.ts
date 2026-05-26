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

  try {
    const response = await fetch(`${baseUrl}/models`, {
      headers: buildHeaders(config.token),
    })

    const contentType = response.headers.get('content-type') ?? ''
    const raw = await response.text()

    if (!response.ok) {
      const isHtml = contentType.includes('text/html') || raw.trimStart().startsWith('<!')
      const detail = isHtml
        ? '接口返回了网页而非 JSON，请检查 Vercel 路由（vercel.json）是否把 API 转到了首页。'
        : raw.slice(0, 200)
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
      return {
        ok: false,
        models: [],
        message:
          '接口返回了网页而非 JSON，请检查 Vercel 部署是否包含 api/openclaw 且路由未把 /openclaw-api 转到 index.html。',
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
        : '连接成功，服务已就绪',
    }
  } catch (error) {
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
    body: JSON.stringify({
      model: config.agent,
      stream: true,
      user: userId,
      messages: toApiMessages(messages, systemPrompt),
    }),
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
    body: JSON.stringify({
      model: config.agent,
      stream: false,
      user: userId,
      messages: toApiMessages(messages, systemPrompt),
    }),
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
