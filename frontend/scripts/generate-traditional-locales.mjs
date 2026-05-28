/**
 * Generate locales/zh-HK.ts (OpenCC s2hk) and locales/zh-TW.ts (s2twp) from locales/zh.ts.
 * Run: npm run i18n:traditional
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { Converter } from 'opencc-js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const zhPath = path.join(root, 'src/lib/i18n/locales/zh.ts')
const overridesDir = path.join(__dirname, 'i18n-overrides')

const hkConverter = Converter({ from: 'cn', to: 'hk' })
const twConverter = Converter({ from: 'cn', to: 'tw' })

function loadOverrides(name) {
  const p = path.join(overridesDir, `${name}.json`)
  if (!fs.existsSync(p)) return {}
  return JSON.parse(fs.readFileSync(p, 'utf8'))
}

function parseZhEntries(tsContent) {
  const match = tsContent.match(/export const ZH: Record<MessageKey, string> = (\{[\s\S]*\})\s*$/)
  if (!match) throw new Error('Could not parse locales/zh.ts')
  const obj = Function(`"use strict"; return (${match[1]})`)()
  return obj
}

function escapeTsString(s) {
  return s
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\r/g, '')
    .replace(/\n/g, '\\n')
}

function writeLocaleFile(exportName, fileName, entries, banner) {
  const lines = Object.entries(entries)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `  '${key}': '${escapeTsString(value)}',`)

  const content = `import type { MessageKey } from '../messages'

/** ${banner} */
export const ${exportName}: Record<MessageKey, string> = {
${lines.join('\n')}
}
`
  const outPath = path.join(root, 'src/lib/i18n/locales', fileName)
  fs.writeFileSync(outPath, content, 'utf8')
  console.log('Wrote', outPath, `(${lines.length} keys)`)
}

const zhContent = fs.readFileSync(zhPath, 'utf8')
const zh = parseZhEntries(zhContent)
const hkOverrides = loadOverrides('zh-HK')
const twOverrides = loadOverrides('zh-TW')

const zhHK = {}
const zhTW = {}

for (const [key, value] of Object.entries(zh)) {
  zhHK[key] = hkOverrides[key] ?? hkConverter(value)
  zhTW[key] = twOverrides[key] ?? twConverter(value)
}

writeLocaleFile(
  'ZH_HK',
  'zh-HK.ts',
  zhHK,
  'AUTO-GENERATED — Hong Kong Traditional (OpenCC s2hk). Edit zh.ts + overrides, then npm run i18n:traditional',
)
writeLocaleFile(
  'ZH_TW',
  'zh-TW.ts',
  zhTW,
  'AUTO-GENERATED — Taiwan Traditional (OpenCC s2twp). Edit zh.ts + overrides, then npm run i18n:traditional',
)
