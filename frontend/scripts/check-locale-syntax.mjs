import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../src/lib/i18n/locales')

for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.ts'))) {
  const s = fs.readFileSync(path.join(dir, file), 'utf8')
  const m = s.match(/export const \w+: Record<MessageKey, string> = (\{[\s\S]*\})\s*$/)
  if (!m) {
    console.log(file, 'PARSE_FAIL no match')
    continue
  }
  try {
    const obj = Function(`"use strict"; return (${m[1]})`)()
    console.log(file, 'OK', Object.keys(obj).length)
  } catch (e) {
    console.log(file, 'FAIL', e.message)
    // find line with issue - check unescaped quotes
    const lines = m[1].split('\n')
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const match = line.match(/^\s+'([^']+)': '(.+)',?\s*$/)
      if (!match) {
        const partial = line.match(/^\s+'([^']+)': '(.*)$/)
        if (partial) console.log('  suspicious line', i + 1, line.slice(0, 120))
      }
    }
  }
}
