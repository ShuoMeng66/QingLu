import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** @type {{ skipKeyPrefixes: string[], skipKeys: string[], phraseReplacements: [string, string][] }} */
const rules = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'i18n-cantonese-rules.json'), 'utf8'),
)

const phrases = [...rules.phraseReplacements].sort((a, b) => b[0].length - a[0].length)

export function shouldSkipCantoneseRules(key) {
  if (rules.skipKeys.includes(key)) return true
  return rules.skipKeyPrefixes.some((prefix) => key.startsWith(prefix))
}

function applyToSegment(segment) {
  let out = segment
  for (const [from, to] of phrases) {
    if (from && out.includes(from)) {
      out = out.split(from).join(to)
    }
  }
  return out
}

/** Apply written Cantonese phrase rules; preserves `{placeholder}` segments. */
export function applyCantoneseRules(text, key) {
  if (!text || shouldSkipCantoneseRules(key)) return text
  const parts = text.split(/(\{[^}]+\})/g)
  return parts.map((part, index) => (index % 2 === 1 ? part : applyToSegment(part))).join('')
}
