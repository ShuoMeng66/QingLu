/**
 * Report likely Mandarin residue in generated zh-HK.ts.
 * Run: npm run i18n:lint:hk
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const zhHkPath = path.join(__dirname, '../src/lib/i18n/locales/zh-HK.ts')

const CRITICAL = [
  { pattern: /你的/g, hint: '你嘅' },
  { pattern: /(?<![用])用户/g, hint: '用戶' },
  { pattern: /没有/g, hint: '冇' },
  { pattern: /是不是/g, hint: '係咪' },
  { pattern: /不要/g, hint: '唔好' },
  { pattern: /不能/g, hint: '唔可以' },
  { pattern: /正在根据你的/g, hint: '正在根據你嘅' },
  { pattern: /编辑你的/g, hint: '編輯你嘅' },
]

const WARN = [
  { pattern: /可以(?!用|能)/g, hint: '可以（檢查是否應為「得」）' },
  { pattern: /请(?!求|註|輸|揀|用|等|查|講)/g, hint: '請（粵語句式）' },
  { pattern: /吃了/g, hint: '食咗' },
  { pattern: /聊聊/g, hint: '傾下' },
  { pattern: /登录/g, hint: '登入' },
]

function parseEntries(content) {
  const match = content.match(/export const ZH_HK: Record<MessageKey, string> = (\{[\s\S]*\})\s*$/)
  if (!match) throw new Error('Could not parse zh-HK.ts')
  return Function(`"use strict"; return (${match[1]})`)()
}

const content = fs.readFileSync(zhHkPath, 'utf8')
const entries = parseEntries(content)

const findings = []

for (const [key, value] of Object.entries(entries)) {
  if (key.startsWith('settings.dev.') || key.startsWith('eval.') || key.startsWith('lang.')) {
    continue
  }
  for (const { pattern, hint } of CRITICAL) {
    pattern.lastIndex = 0
    if (pattern.test(value)) {
      findings.push({ level: 'critical', key, value, hint, pattern: pattern.source })
    }
  }
  for (const { pattern, hint } of WARN) {
    pattern.lastIndex = 0
    if (pattern.test(value)) {
      findings.push({ level: 'warn', key, value, hint, pattern: pattern.source })
    }
  }
}

const critical = findings.filter((f) => f.level === 'critical')
const warn = findings.filter((f) => f.level === 'warn')

console.log(`zh-HK Cantonese lint: ${critical.length} critical, ${warn.length} warn\n`)

for (const f of [...critical, ...warn].slice(0, 80)) {
  console.log(`[${f.level}] ${f.key}`)
  console.log(`  text: ${f.value.slice(0, 120)}${f.value.length > 120 ? '…' : ''}`)
  console.log(`  hint: ${f.hint} (/${f.pattern}/)\n`)
}

if (findings.length > 80) {
  console.log(`… and ${findings.length - 80} more`)
}

if (critical.length > 0) {
  process.exitCode = 1
}
