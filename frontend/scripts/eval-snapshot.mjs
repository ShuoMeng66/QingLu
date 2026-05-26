/**
 * CLI helper: documents eval metrics (runtime metrics live in browser localStorage).
 * Run in devtools: import { computeEvalSnapshot } from './lib/evalLoop'
 */
console.log(`
小爪 Eval Loop
==============
Metrics (browser):
  - starterCtr: IceBreaker 开场点击率
  - firstMessageRate: 开场 → 发送转化率
  - thumbsUpRate: 回答 👍 率
  - avgScore: 轨迹平均评分
  - successRate: 轨迹成功率

Hold-out: holdOutSplit(trajectories, 0.2) in evalLoop.ts

Trace2Skill: npm run evolve-skills (from frontend/)
`)
