import type { VercelRequest, VercelResponse } from '@vercel/node'
import { pickForwardHeaders, pipeProxyResponse, queryToPath, readBody } from '../lib/proxy'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const backendBase = process.env.BACKEND_URL?.replace(/\/+$/, '')

  if (!backendBase) {
    res.status(503).json({
      error: 'Backend not configured',
      hint: 'Set BACKEND_URL in Vercel to your deployed backend (e.g. Render/Railway), or run locally via scripts/start.ps1',
    })
    return
  }

  const parts = queryToPath(req.query.path)
  const upstreamPath = parts.join('/')
  const search = req.url?.includes('?') ? req.url.slice(req.url.indexOf('?')) : ''
  const url = `${backendBase}/api/${upstreamPath}${search}`

  try {
    const headers = pickForwardHeaders(req) as Record<string, string>
    const body = await readBody(req)

    const upstream = await fetch(url, {
      method: req.method,
      headers,
      body: body as BodyInit | undefined,
    })

    await pipeProxyResponse(upstream, res)
  } catch (error) {
    console.error('[backend proxy]', error)
    res.status(502).json({
      error: 'Backend proxy failed',
      detail: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
}
