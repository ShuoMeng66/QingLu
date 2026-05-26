import type { IncomingMessage, ServerResponse } from 'node:http'

type QueryValue = string | string[] | undefined

export function queryToPath(value: QueryValue): string[] {
  if (Array.isArray(value)) return value
  if (typeof value === 'string' && value.length > 0) return [value]
  return []
}

export async function readBody(req: IncomingMessage): Promise<Buffer | undefined> {
  if (req.method === 'GET' || req.method === 'HEAD') return undefined

  const chunks: Buffer[] = []
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  }
  return Buffer.concat(chunks)
}

export async function pipeProxyResponse(
  upstream: Response,
  res: ServerResponse,
): Promise<void> {
  res.statusCode = upstream.status
  upstream.headers.forEach((value, key) => {
    if (key.toLowerCase() === 'transfer-encoding') return
    res.setHeader(key, value)
  })

  if (!upstream.body) {
    res.end()
    return
  }

  const reader = upstream.body.getReader()
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    res.write(value)
  }
  res.end()
}

export function pickForwardHeaders(req: IncomingMessage): HeadersInit {
  const headers: Record<string, string> = {}
  const allow = ['content-type', 'accept', 'authorization', 'user-agent']

  for (const key of allow) {
    const value = req.headers[key]
    if (typeof value === 'string' && value.trim()) {
      headers[key] = value
    }
  }

  return headers
}

export function withServerToken(
  headers: Record<string, string>,
  envKey: string,
): Record<string, string> {
  if (headers.authorization?.trim()) return headers
  const token = process.env[envKey]?.trim()
  if (token) {
    headers.authorization = `Bearer ${token}`
  }
  return headers
}
