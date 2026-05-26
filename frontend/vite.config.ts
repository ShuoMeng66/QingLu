import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxyTarget =
    env.VITE_OPENCLAW_PROXY_TARGET?.trim() || 'https://dashscope.aliyuncs.com'
  const proxyPathPrefix = env.VITE_OPENCLAW_PROXY_PATH?.trim() || ''

  return {
    plugins: [react(), tailwindcss()],
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
