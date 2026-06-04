import type { Plugin, ViteDevServer } from 'vite'
import { loadEnv } from 'vite'

/**
 * Local dev: handle POST /api/venue/enrich without Vercel (same logic as api/venue/enrich.ts).
 */
export function venueEnrichDevPlugin(): Plugin {
  return {
    name: 'burnpal-venue-enrich-dev',
    configureServer(server: ViteDevServer) {
      const env = loadEnv(server.config.mode, server.config.root, '')
      if (!process.env.OPENCLAW_TOKEN?.trim() && env.VITE_OPENCLAW_TOKEN?.trim()) {
        process.env.OPENCLAW_TOKEN = env.VITE_OPENCLAW_TOKEN.trim()
      }

      server.middlewares.use(async (req, res, next) => {
        const url = req.url ?? ''
        if (!url.startsWith('/api/venue/enrich')) {
          next()
          return
        }

        try {
          const { handleVenueEnrich } = await import('../../lib/venue-enrich-proxy')
          const host = req.headers.host ?? '127.0.0.1:5173'
          const proto = (req.headers['x-forwarded-proto'] as string) ?? 'http'
          const init: RequestInit = {
            method: req.method ?? 'GET',
            headers: Object.fromEntries(
              Object.entries(req.headers).map(([k, v]) => [
                k,
                Array.isArray(v) ? v.join(', ') : (v ?? ''),
              ]),
            ),
          }

          if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
            const chunks: Buffer[] = []
            for await (const chunk of req) {
              chunks.push(Buffer.from(chunk))
            }
            init.body = Buffer.concat(chunks)
          }

          const request = new Request(`${proto}://${host}${url}`, init)
          const response = await handleVenueEnrich(request)
          res.statusCode = response.status
          response.headers.forEach((value, key) => {
            if (key.toLowerCase() === 'content-encoding') return
            res.setHeader(key, value)
          })
          const body = await response.arrayBuffer()
          res.end(Buffer.from(body))
        } catch (error) {
          console.error('[venue-enrich-dev]', error)
          res.statusCode = 502
          res.setHeader('Content-Type', 'application/json')
          res.end(
            JSON.stringify({
              error: 'Venue enrich dev handler failed',
              detail: error instanceof Error ? error.message : 'Unknown',
            }),
          )
        }
      })
    },
  }
}
