import type { VercelRequest, VercelResponse } from '@vercel/node'

/** Lightweight probe — does not call DashScope; use to verify routing + env. */
export default function handler(_req: VercelRequest, res: VercelResponse) {
  const hasToken = Boolean(
    process.env.OPENCLAW_TOKEN?.trim() || process.env.DASHSCOPE_API_KEY?.trim(),
  )
  res.status(200).json({
    ok: true,
    service: 'openclaw-proxy',
    hasToken,
    proxyTarget: process.env.OPENCLAW_PROXY_TARGET || 'https://dashscope.aliyuncs.com',
    proxyPath: process.env.OPENCLAW_PROXY_PATH || '/compatible-mode',
  })
}
