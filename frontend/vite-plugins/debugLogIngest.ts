import fs from 'node:fs'
import path from 'node:path'
import type { Plugin } from 'vite'

/** Dev-only: POST /__debug_log → append NDJSON to workspace debug-9a6481.log */
export function debugLogIngestPlugin(logFile: string): Plugin {
  return {
    name: 'debug-log-ingest',
    configureServer(server) {
      server.middlewares.use('/__debug_log', (req, res, next) => {
        if (req.method !== 'POST') {
          next()
          return
        }

        const chunks: Buffer[] = []
        req.on('data', (chunk: Buffer) => chunks.push(chunk))
        req.on('end', () => {
          try {
            const body = Buffer.concat(chunks).toString('utf8').trim()
            if (body) {
              fs.mkdirSync(path.dirname(logFile), { recursive: true })
              fs.appendFileSync(logFile, `${body}\n`)
            }
            res.statusCode = 204
            res.end()
          } catch (error) {
            res.statusCode = 500
            res.end(error instanceof Error ? error.message : 'debug log write failed')
          }
        })
        req.on('error', () => {
          res.statusCode = 500
          res.end('request error')
        })
      })
    },
  }
}
