import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const logPath = path.resolve(__dirname, '../../debug-9a6481.log')

// Minimal copies of normalize + match logic for runtime verification
const FULLWIDTH = { '？': '?', '，': ',', '。': '.' }
function normalizeDemoText(value) {
  let text = value.replace(/\s+/g, ' ').trim()
  for (const [a, b] of Object.entries(FULLWIDTH)) text = text.split(a).join(b)
  return text
}

const scenesDir = path.resolve(__dirname, '../../demoPre/scenes')
const sceneList = fs.readdirSync(scenesDir).filter((f) => f.endsWith('.json')).map((f) => {
  return JSON.parse(fs.readFileSync(path.join(scenesDir, f), 'utf8'))
})

function matchScene(userText) {
  const normalized = normalizeDemoText(userText)
  for (const scene of sceneList) {
    for (const exact of scene.match?.exact ?? []) {
      if (normalizeDemoText(exact) === normalized) return scene.id
    }
  }
  for (const scene of sceneList) {
    for (const group of scene.match?.keywordGroups ?? []) {
      const lower = normalized.toLowerCase()
      if (group.every((w) => lower.includes(normalizeDemoText(w).toLowerCase()))) return scene.id
    }
  }
  return null
}

const followUps = [
  '这几家餐厅点菜怎么控制热量？',
  '聚餐的话，第一家 Wagas 和第二家火锅你更推荐哪家？',
  '帮我对比一下前两家哪家更适合中午吃',
  '拉日训练的话这些活动怎么安排比较好',
]

const results = {
  sceneCount: sceneList.length,
  followUpMatches: Object.fromEntries(followUps.map((t) => [t, matchScene(t)])),
  mapDemoPreferences: {
    diet_strategies: ['高蛋白', '低脂', '控碳'],
    common_areas: ['公司附近'],
    dietary_customs: ['油炸', '内脏'],
  },
}

fs.appendFileSync(
  logPath,
  JSON.stringify({
    sessionId: '9a6481',
    runId: 'verify-pre-push',
    hypothesisId: 'ALL',
    location: 'scripts/verify-demo-fixes.mjs',
    message: 'automated verification',
    data: results,
    timestamp: Date.now(),
  }) + '\n',
)

console.log(JSON.stringify(results, null, 2))
