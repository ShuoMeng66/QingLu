import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.dirname(fileURLToPath(import.meta.url))
const zhPath = path.resolve(root, '../src/lib/i18n/locales/zh.ts')
const zh = fs.readFileSync(zhPath, 'utf8')

const PREFIXES = ['splash.login', 'onboard.', 'ready.', 'today.', 'discovery.', 'platform.']

function extractLine(content, key) {
  const re = new RegExp(`  '${key.replace(/\./g, '\\.')}':[^\\n]+`)
  const m = content.match(re)
  return m ? m[0] : null
}

const keys = [...zh.matchAll(/  '([^']+)':/g)]
  .map((m) => m[1])
  .filter((k) => PREFIXES.some((p) => k.startsWith(p)))

for (const loc of ['en', 'zh-HK', 'zh-TW', 'ja', 'ko']) {
  const p = path.resolve(root, `../src/lib/i18n/locales/${loc}.ts`)
  let c = fs.readFileSync(p, 'utf8')
  for (const key of keys) {
    if (c.includes(`'${key}':`)) continue
    const row = extractLine(zh, key)
    if (!row) continue
    c = c.replace(`  'toast.connectionOk':`, `${row}\n  'toast.connectionOk':`)
  }
  if (loc === 'en') {
    c = c.replace("'about.version': 'BurnPal v1.0'", "'about.version': 'QingLu v1.0'")
    c = c.replace("'chat.placeholderReady': 'Ask BurnPal…'", "'chat.placeholderReady': 'Tell QingLu your scenario…'")
  }
  fs.writeFileSync(p, c)
  console.log('patched', loc)
}
