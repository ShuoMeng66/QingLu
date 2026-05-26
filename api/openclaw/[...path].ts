import type { VercelRequest, VercelResponse } from '@vercel/node'
import {
  pickForwardHeaders,
  pipeProxyResponse,
  queryToPath,
  readBody,
  withServerToken,
} from '../lib/proxy'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const parts = queryToPath(req.query.path)
  const targetBase = (process.env.OPENCLAW_PROXY_TARGET || 'https://dashscope.aliyuncs.com').replace(
    /\/+$/,
    '',
  )
  const prefix = process.env.OPENCLAW_PROXY_PATH || '/compatible-mode'
  const upstreamPath = parts.join('/')
  const search = req.url?.includes('?') ? req.url.slice(req.url.indexOf('?')) : ''
  const url = `${targetBase}${prefix}/${upstreamPath}${search}`

  try {
    const headers = withServerToken(
      pickForwardHeaders(req) as Record<string, string>,
      'OPENCLAW_TOKEN',
    )
    if (!headers.authorization && process.env.DASHSCOPE_API_KEY?.trim()) {
      headers.authorization = `Bearer ${process.env.DASHSCOPE_API_KEY.trim()}`
    }
    const body = await readBody(req)

    const upstream = await fetch(url, {
      method: req.method,
      headers,
      body: body as BodyInit | undefined,
    })

    await pipeProxyResponse(upstream, res)
  } catch (error) {
    console.error('[openclaw proxy]', error)
    res.status(502).json({
      error: 'OpenClaw proxy failed',
      detail: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
}
