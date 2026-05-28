import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const messagesPath = path.join(__dirname, '../src/lib/i18n/messages.ts')
const content = fs.readFileSync(messagesPath, 'utf8')
const headerEnd = content.indexOf('const ZH:')
const header = content.slice(0, headerEnd).trimEnd()

const footer = `
import { ZH } from './locales/zh'
import { EN } from './locales/en'
import { JA } from './locales/ja'
import { KO } from './locales/ko'
import { ZH_HK } from './locales/zh-HK'
import { ZH_TW } from './locales/zh-TW'

export const MESSAGES: Record<AppLocale, Record<MessageKey, string>> = {
  zh: ZH,
  'zh-HK': ZH_HK,
  'zh-TW': ZH_TW,
  en: EN,
  ja: JA,
  ko: KO,
}

export function translate(
  locale: AppLocale,
  key: MessageKey,
  params?: Record<string, string | number>,
): string {
  let text = MESSAGES[locale]?.[key] ?? MESSAGES.zh[key] ?? key
  if (params) {
    for (const [name, value] of Object.entries(params)) {
      text = text.replaceAll(\`{\${name}}\`, String(value))
    }
  }
  return text
}
`

fs.writeFileSync(messagesPath, header + footer, 'utf8')
console.log('messages.ts is now aggregator-only')
