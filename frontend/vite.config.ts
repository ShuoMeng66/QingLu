import path from 'node:path'
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { debugLogIngestPlugin } from './vite-plugins/debugLogIngest'
import { venueEnrichDevPlugin } from './vite-plugins/venueEnrichDev'

const debugLogFile = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../debug-9a6481.log',
)

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxyTarget =
    env.VITE_OPENCLAW_PROXY_TARGET?.trim() || 'https://dashscope.aliyuncs.com'
  const proxyPathPrefix = env.VITE_OPENCLAW_PROXY_PATH?.trim() || ''

  return {
    plugins: [
      react(),
      tailwindcss(),
      ...(mode === 'development'
        ? [venueEnrichDevPlugin(), debugLogIngestPlugin(debugLogFile)]
        : []),
    ],
    server: {
      port: 5173,
      proxy: {
        '/openclaw-api': {
          target: proxyTarget,
          changeOrigin: true,
          secure: true,
          rewrite: (path) => {
            const stripped = path.replace(/^\/openclaw-api/, '')
            return proxyPathPrefix ? `${proxyPathPrefix}${stripped}` : stripped
          },
        },
        '/api': {
          target: env.VITE_API_PROXY_TARGET?.trim() || 'http://127.0.0.1:8787',
          changeOrigin: true,
        },
      },
    },
  }
})
