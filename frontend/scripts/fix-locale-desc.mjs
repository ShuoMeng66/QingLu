import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.dirname(fileURLToPath(import.meta.url))
const zh = fs.readFileSync(path.resolve(root, '../src/lib/i18n/locales/zh.ts'), 'utf8')

const descKeys = [
  'today.task.takeout.desc',
  'today.task.gathering.desc',
  'today.task.train.desc',
  'today.task.recover.desc',
  'today.task.move.desc',
  'discovery.body',
]

function extractMultiline(content, key) {
  const re = new RegExp(`  '${key.replace(/\./g, '\\.')}':\\s*\\n?\\s*'([^']*(?:\\\\'[^']*)*)'`, 'm')
  const re2 = new RegExp(`  '${key.replace(/\./g, '\\.')}': '([^']*)',`)
  const m2 = content.match(re2)
  if (m2) return `  '${key}': '${m2[1]}',`
  const m = content.match(re)
  if (m) return `  '${key}':\n    '${m[1]}',`
  return null
}

for (const loc of ['zh-HK', 'zh-TW', 'ja', 'ko']) {
  const p = path.resolve(root, `../src/lib/i18n/locales/${loc}.ts`)
  let c = fs.readFileSync(p, 'utf8')
  for (const key of descKeys) {
    if (c.includes(`'${key}':`)) continue
    const row = extractMultiline(zh, key)
    if (!row) continue
    c = c.replace(`  'discovery.eyebrow':`, `${row}\n  'discovery.eyebrow':`)
  }
  fs.writeFileSync(p, c)
  console.log('fixed', loc)
}
