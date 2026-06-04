const DASHSCOPE_GENERATION_URL =
  'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation'

const FETCH_TIMEOUT_MS = 42_000
const MAX_VENUES = 3

export interface VenueEnrichInput {
  id: string
  name: string
  area?: string
  address?: string
}

export interface VenueEnrichUserLocation {
  city?: string
  region?: string
  lat?: number
  lon?: number
}

export interface VenueEnrichResult {
  id: string
  facadeImageUrl?: string
  facadeSummary?: string
  sources?: string[]
  confidence?: 'high' | 'low'
}

function resolveToken(): string | undefined {
  return (
    process.env.OPENCLAW_TOKEN?.trim() ||
    process.env.DASHSCOPE_API_KEY?.trim() ||
    process.env.VITE_OPENCLAW_TOKEN?.trim() ||
    undefined
  )
}

function resolveModel(): string {
  return (
    process.env.VENUE_ENRICH_MODEL?.trim() || 'qwen3.5-omni-plus-2026-03-15'
  )
}

function isEnrichEnabled(): boolean {
  const raw = process.env.VENUE_ENRICH_ENABLED?.trim().toLowerCase()
  return raw !== 'false' && raw !== '0' && raw !== 'off'
}

function isValidHttpsUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false
  try {
    const url = new URL(value)
    return url.protocol === 'https:'
  } catch {
    return false
  }
}

function extractJsonObject(text: string): unknown {
  const trimmed = text.trim()
  if (!trimmed) return null

  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const candidate = fence?.[1]?.trim() ?? trimmed

  try {
    return JSON.parse(candidate)
  } catch {
    const start = candidate.indexOf('{')
    const end = candidate.lastIndexOf('}')
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(candidate.slice(start, end + 1))
      } catch {
        return null
      }
    }
    return null
  }
}

function normalizeResults(
  parsed: unknown,
  requestedIds: Set<string>,
): VenueEnrichResult[] {
  const rows =
    parsed && typeof parsed === 'object' && 'venues' in parsed
      ? (parsed as { venues: unknown }).venues
      : Array.isArray(parsed)
        ? parsed
        : []

  if (!Array.isArray(rows)) return []

  const out: VenueEnrichResult[] = []
  for (const row of rows) {
    if (!row || typeof row !== 'object') continue
    const item = row as Record<string, unknown>
    const id = typeof item.id === 'string' ? item.id : ''
    if (!id || !requestedIds.has(id)) continue

    const facadeImageUrl = isValidHttpsUrl(item.facadeImageUrl)
      ? item.facadeImageUrl
      : undefined
    const facadeSummary =
      typeof item.facadeSummary === 'string' ? item.facadeSummary.trim() : undefined
    const sources = Array.isArray(item.sources)
      ? item.sources.filter((s): s is string => isValidHttpsUrl(s))
      : undefined
    const confidence =
      item.confidence === 'high' || item.confidence === 'low'
        ? item.confidence
        : undefined

    out.push({
      id,
      ...(facadeImageUrl ? { facadeImageUrl } : {}),
      ...(facadeSummary ? { facadeSummary } : {}),
      ...(sources && sources.length > 0 ? { sources } : {}),
      ...(confidence ? { confidence } : {}),
    })
  }

  return out
}

function buildPrompt(venues: VenueEnrichInput[], userLocation?: VenueEnrichUserLocation): string {
  const list = venues
    .map(
      (v, i) =>
        `${i + 1}. id="${v.id}" name="${v.name}" area="${v.area ?? ''}" address="${v.address ?? ''}"`,
    )
    .join('\n')

  const userLine = userLocation
    ? `用户当前位置：${userLocation.city ?? ''} ${userLocation.region ?? ''}（检索时优先该城市/省份的门店，勿返回其它城市同名分店图片）。\n`
    : ''

  return `请为以下餐饮店/场馆检索真实门头或店面外景照片（联网搜索），仅处理列表中的店名，禁止编造新店铺。

${userLine}${list}

要求：
- 只输出一个 JSON 对象，不要 markdown 其它说明
- 格式：{"venues":[{"id":"...","facadeImageUrl":"https://...或null","facadeSummary":"一句话","sources":["https://..."],"confidence":"high|low"}]}
- facadeImageUrl 必须是可公网访问的 https 图片直链，优先门头/外景，不要菜品特写
- 找不到可靠门头图时 facadeImageUrl 设为 null，confidence 设为 low
- sources 填 1-3 个参考网页 https 链接`
}

function parseDashscopeContent(payload: unknown): string {
  if (!payload || typeof payload !== 'object') return ''
  const root = payload as Record<string, unknown>
  const output = root.output as Record<string, unknown> | undefined
  if (!output) return ''

  const choices = output.choices as Array<Record<string, unknown>> | undefined
  const message = choices?.[0]?.message as Record<string, unknown> | undefined
  if (typeof message?.content === 'string') return message.content

  const text = output.text
  if (typeof text === 'string') return text

  return ''
}

export async function fetchVenueEnrichment(
  venues: VenueEnrichInput[],
  userLocation?: VenueEnrichUserLocation,
): Promise<VenueEnrichResult[]> {
  const token = resolveToken()
  if (!token) throw new Error('OPENCLAW_TOKEN not configured')

  const model = resolveModel()
  const body = {
    model,
    input: {
      messages: [
        {
          role: 'system',
          content:
            '你是 QingLu 店面信息检索助手。通过联网搜索返回真实门头信息，严格按用户要求的 JSON 格式输出。',
        },
        { role: 'user', content: buildPrompt(venues, userLocation) },
      ],
    },
    parameters: {
      result_format: 'message',
      enable_search: true,
    },
  }

  const response = await fetch(DASHSCOPE_GENERATION_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  })

  const raw = await response.text()
  if (!response.ok) {
    throw new Error(
      `DashScope venue enrich failed (${response.status}): ${raw.slice(0, 400)}`,
    )
  }

  let payload: unknown
  try {
    payload = JSON.parse(raw)
  } catch {
    throw new Error('DashScope venue enrich returned non-JSON')
  }

  const content = parseDashscopeContent(payload)
  const requestedIds = new Set(venues.map((v) => v.id))
  const parsed = extractJsonObject(content)
  return normalizeResults(parsed, requestedIds)
}

export async function handleVenueEnrich(request: Request): Promise<Response> {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  }

  if (request.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 })
  }

  if (!isEnrichEnabled()) {
    return Response.json({ venues: [], disabled: true })
  }

  const token = resolveToken()
  if (!token) {
    return Response.json(
      {
        error: 'OPENCLAW_TOKEN not configured',
        hint: '在 Vercel 配置 OPENCLAW_TOKEN（百炼 API Key）后 Redeploy',
      },
      { status: 503 },
    )
  }

  let body: { venues?: VenueEnrichInput[]; userLocation?: VenueEnrichUserLocation }
  try {
    body = (await request.json()) as {
      venues?: VenueEnrichInput[]
      userLocation?: VenueEnrichUserLocation
    }
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const venues = (body.venues ?? [])
    .filter((v) => v?.id && v?.name)
    .slice(0, MAX_VENUES) as VenueEnrichInput[]

  if (venues.length === 0) {
    return Response.json({ venues: [] })
  }

  try {
    const results = await fetchVenueEnrichment(venues, body.userLocation)
    return Response.json({
      venues: results,
      model: resolveModel(),
    })
  } catch (error) {
    console.error('[venue-enrich]', error)
    const timedOut = error instanceof Error && error.name === 'TimeoutError'
    return Response.json(
      {
        error: timedOut ? 'Venue enrich timed out' : 'Venue enrich failed',
        detail: error instanceof Error ? error.message : 'Unknown error',
        venues: [],
      },
      { status: timedOut ? 504 : 502 },
    )
  }
}

export function isVenueEnrichPath(pathname: string): boolean {
  return pathname === '/api/venue/enrich'
}
