/**
 * Extract ZH/EN/JA/KO blocks from messages.ts into locales/*.ts (does not modify messages.ts).
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const messagesPath = path.join(root, 'src/lib/i18n/messages.ts')
const localesDir = path.join(root, 'src/lib/i18n/locales')

const content = fs.readFileSync(messagesPath, 'utf8')

const BLOCK_END = {
  ZH: ['const EN:', 'const JA:', 'const KO:', 'export const MESSAGES'],
  EN: ['const JA:', 'const KO:', 'export const MESSAGES'],
  JA: ['const KO:', 'export const MESSAGES'],
  KO: ['export const MESSAGES'],
}

function extractBlock(name) {
  const start = content.indexOf(`const ${name}:`)
  let end = content.length
  for (const marker of BLOCK_END[name]) {
    const idx = content.indexOf(marker, start + 1)
    if (idx !== -1 && idx < end) end = idx
  }
  const block = content.slice(start, end).trim()
  return block.replace(`const ${name}: Record<MessageKey, string> = `, '')
}

fs.mkdirSync(localesDir, { recursive: true })

for (const [constName, fileName] of Object.entries({ ZH: 'zh', EN: 'en', JA: 'ja', KO: 'ko' })) {
  const body = extractBlock(constName)
  const out = `import type { MessageKey } from '../messages'\n\n/** ${fileName === 'zh' ? 'Simplified Chinese — source for zh-HK/zh-TW generation' : fileName} */\nexport const ${constName}: Record<MessageKey, string> = ${body}`
  fs.writeFileSync(path.join(localesDir, `${fileName}.ts`), out, 'utf8')
  console.log('Wrote locales/' + fileName + '.ts')
}
