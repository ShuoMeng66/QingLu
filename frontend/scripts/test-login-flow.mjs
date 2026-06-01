import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const logPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../debug-9a6481.log')
const API = process.env.API_BASE ?? 'http://127.0.0.1:8787/api'

function log(message, data, hypothesisId) {
  const line = JSON.stringify({
    sessionId: '9a6481',
    location: 'test-login-flow.mjs',
    message,
    data,
    hypothesisId,
    timestamp: Date.now(),
    runId: 'local-verify',
  })
  fs.appendFileSync(logPath, line + '\n')
}

async function timedFetch(label, url, init) {
  const started = Date.now()
  log(`${label} start`, { url, method: init?.method ?? 'GET' }, 'A')
  try {
    const res = await fetch(url, { ...init, signal: AbortSignal.timeout(22_000) })
    const text = await res.text()
    log(`${label} done`, { status: res.status, ms: Date.now() - started, len: text.length }, 'A')
    return { res, text }
  } catch (error) {
    log(`${label} error`, {
      ms: Date.now() - started,
      name: error instanceof Error ? error.name : 'unknown',
      msg: error instanceof Error ? error.message : String(error),
    }, 'D')
    throw error
  }
}

try {
  fs.writeFileSync(logPath, '')
  await timedFetch('health', `${API}/auth/health`)
  await timedFetch('login', `${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'test@example.com', password: 'wrongpass' }),
  })
  log('flow complete', {}, 'E')
  console.log('Wrote', logPath)
} catch (e) {
  log('flow failed', { err: String(e) }, 'E')
  console.error(e)
  process.exit(1)
}
