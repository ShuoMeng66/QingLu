/**
 * 测评 Agent — 对齐飞书 Skill 1「智能饮食管家」测评框架
 *
 * 三模块：场景路由 → 场景执行（5 维）→ 全局规则（调性底线）
 */
import type {
  DietSceneId,
  EvalReport,
  ExecutionDimensionScore,
  GlobalRuleCheck,
  GlobalRulesResult,
  SceneRouteResult,
} from '../types/evalAgent'
import { DIET_SCENES } from '../types/evalAgent'
import type { TaskScore } from '../types/agentCluster'

interface ScenePattern {
  sceneId: DietSceneId
  patterns: RegExp[]
  signals: string[]
}

const ROUTE_PATTERNS: ScenePattern[] = [
  {
    sceneId: 'E_calorie_query',
    patterns: [/热量|卡路里|kcal|大卡|多少卡|还能吃多少|今日.*(剩|余)/i],
    signals: ['热量/额度关键词'],
  },
  {
    sceneId: 'D_post_meal_recovery',
    patterns: [/吃多了|超标|补救|拉回来|明天.*(清淡|控制)|放纵/i],
    signals: ['餐后补救意图'],
  },
  {
    sceneId: 'A2_in_store_order',
    patterns: [
      /星巴克|海底捞|麦当劳|肯德基|必胜客|喜茶|奈雪|这家.*怎么点|到店|菜单/i,
      /在.*(店|馆|厅).*(点|选|吃)/,
    ],
    signals: ['具体门店/到店点单'],
  },
  {
    sceneId: 'A1_gathering_poi',
    patterns: [/聚餐|约饭|朋友.*(吃|约)|推荐.*餐厅|去哪吃|饭局|选餐厅/i],
    signals: ['聚餐选店'],
  },
  {
    sceneId: 'B_takeout',
    patterns: [/外卖|配送|美团|饿了么|点单/i],
    signals: ['外卖场景'],
  },
  {
    sceneId: 'C_travel_explore',
    patterns: [/出差|旅游|异地|外地|当地.*(吃|餐)/i],
    signals: ['异地探索'],
  },
]

const SCENE_EXEC_WEIGHTS: Partial<
  Record<DietSceneId, Partial<Record<ExecutionDimensionScore['id'], number>>>
> = {
  A1_gathering_poi: { plan_quality: 1.15, scene_fit: 1.1 },
  A2_in_store_order: { actionability: 1.15, data_evidence: 1.1 },
  B_takeout: { actionability: 1.1, plan_quality: 1.05 },
  C_travel_explore: { info_extraction: 1.1, plan_quality: 1.1 },
  D_post_meal_recovery: { scene_fit: 1.15 },
  E_calorie_query: { data_evidence: 1.2, info_extraction: 1.15 },
}

/** 模块 1：场景路由 */
export function routeDietScene(userMessage: string): SceneRouteResult {
  const text = userMessage.trim()
  let best: SceneRouteResult = {
    sceneId: 'general_health',
    sceneLabel: '综合健康咨询',
    confidence: 0.45,
    matchedSignals: ['未命中饮食子场景，按综合咨询处理'],
  }

  for (const meta of DIET_SCENES) {
    const pattern = ROUTE_PATTERNS.find((p) => p.sceneId === meta.id)
    if (!pattern) continue
    const hits = pattern.patterns.filter((re) => re.test(text))
    if (hits.length === 0) continue
    const confidence = Math.min(0.98, 0.62 + hits.length * 0.12)
    if (confidence > best.confidence) {
      best = {
        sceneId: meta.id,
        sceneLabel: meta.label,
        confidence,
        matchedSignals: pattern.signals,
      }
    }
  }

  return best
}

function clamp(n: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, Math.round(n)))
}

function hasNumericEvidence(text: string): boolean {
  return /\d+\s*(kcal|大卡|卡|g|克|kJ)|\d{2,4}\s*(大卡|kcal)/i.test(text)
}

function scoreInfoExtraction(question: string, answer: string): ExecutionDimensionScore {
  const findings: string[] = []
  let value = 58

  if (/身高|体重|目标|预算|位置|城市|餐厅|店名/.test(question)) {
    if (/你|请问|补充|告诉我|大概/.test(answer) && answer.length < 180) {
      findings.push('用户已给部分参数，仍过度追问')
      value -= 8
    } else {
      findings.push('识别到用户上下文参数')
      value += 10
    }
  } else {
    findings.push('用户未给细参数，默认可执行假设合理')
    value += 6
  }

  if (hasNumericEvidence(answer)) {
    findings.push('回答含具体数值')
    value += 14
  } else if (/大约|大概|左右/.test(answer)) {
    findings.push('有量级估算')
    value += 8
  }

  return { id: 'info_extraction', label: '信息提取', value: clamp(value), findings }
}

function scorePlanQuality(answer: string, sceneId: DietSceneId): ExecutionDimensionScore {
  const findings: string[] = []
  let value = 55

  const optionCount = (answer.match(/[1-9][.)）、]|方案|推荐|选项/g) ?? []).length
  if (optionCount >= 2) {
    findings.push('给出多方案或分步推荐')
    value += 12
  }
  if (/优先|建议|可以选|推荐/.test(answer)) {
    findings.push('有明确推荐结论')
    value += 10
  }
  if (sceneId === 'A1_gathering_poi' && /人均|距离|口味|环境/.test(answer)) {
    findings.push('聚餐场景含选店维度')
    value += 10
  }
  if (sceneId === 'A2_in_store_order' && /(少油|去皮|换|半份|不加)/.test(answer)) {
    findings.push('到店点单含替换策略')
    value += 12
  }

  return { id: 'plan_quality', label: '方案质量', value: clamp(value), findings }
}

function scoreDataEvidence(answer: string): ExecutionDimensionScore {
  const findings: string[] = []
  let value = 52

  if (hasNumericEvidence(answer)) {
    findings.push('数据先行：含 kcal/克数')
    value += 22
  }
  if (/蛋白|脂肪|碳水|钠|糖/.test(answer)) {
    findings.push('营养素维度')
    value += 10
  }
  if (/依据|因为|烹饪|少油|蒸|烤|刺身/.test(answer)) {
    findings.push('推荐理由可信')
    value += 10
  }

  return { id: 'data_evidence', label: '数据依据', value: clamp(value), findings }
}

function scoreActionability(answer: string): ExecutionDimensionScore {
  const findings: string[] = []
  let value = 54

  if (/第一步|首先|然后|最后|具体|直接/.test(answer)) value += 10
  if (/(点|选|吃|加|换).{1,12}(，|。|；|$)/.test(answer)) {
    findings.push('有可执行动作')
    value += 14
  }
  if (answer.length > 80 && answer.length < 900) {
    findings.push('篇幅适中')
    value += 6
  }

  return { id: 'actionability', label: '可执行性', value: clamp(value), findings }
}

function scoreSceneFit(answer: string, route: SceneRouteResult): ExecutionDimensionScore {
  const findings: string[] = []
  let value = 60

  const sceneKeywords: Record<DietSceneId, RegExp> = {
    A1_gathering_poi: /餐厅|聚餐|人均|选店/,
    A2_in_store_order: /点单|菜单|套餐|替换/,
    B_takeout: /外卖|配送|商家/,
    C_travel_explore: /当地|异地|出差|旅游/,
    D_post_meal_recovery: /补救|明天|清淡|没关系|拉回来/,
    E_calorie_query: /kcal|大卡|热量|剩余|额度/,
    general_health: /建议|可以|步骤/,
  }

  const re = sceneKeywords[route.sceneId]
  if (re?.test(answer)) {
    findings.push('回答贴合路由场景')
    value += 16
  } else if (route.sceneId !== 'general_health') {
    findings.push('回答与路由场景关联偏弱')
    value -= 10
  }

  return { id: 'scene_fit', label: '场景贴合', value: clamp(value), findings }
}

/** 模块 3：全局规则（Skill 1 调性） */
export function evaluateGlobalRules(question: string, answer: string): GlobalRulesResult {
  const checks: GlobalRuleCheck[] = []

  const preachy = /必须|应该|严重超标|绝对不行|惩罚|自律/.test(answer)
  checks.push({
    id: 'gentle_tone',
    label: '温和引导，不施压',
    pass: !preachy,
    note: preachy ? '出现命令式/施压措辞' : '语气友好',
  })

  const vagueOnly = !hasNumericEvidence(answer) && /随便|看着办|都行/.test(answer)
  checks.push({
    id: 'data_first',
    label: '数据先行，结论清晰',
    pass: !vagueOnly && (hasNumericEvidence(answer) || /大约|大概|建议/.test(answer)),
    note: vagueOnly ? '缺少数据或结论' : '有量化或清晰结论',
  })

  const noReason = /推荐|建议/.test(answer) && !/因为|理由|少油|蛋白|烹饪|适合/.test(answer)
  checks.push({
    id: 'evidence_based',
    label: '推荐有理有据',
    pass: !noReason,
    note: noReason ? '推荐缺理由' : '推荐理由充分',
  })

  const verboseOpen =
    /^关于|您好|很高兴|综合考虑/.test(answer.trim()) && answer.length > 200
  checks.push({
    id: 'concise',
    label: '简洁高效，不铺垫',
    pass: !verboseOpen,
    note: verboseOpen ? '开场铺垫过长' : '直入主题',
  })

  const regret = /吃多了|后悔|破功|懊恼|超标/.test(question)
  const coldOpen = regret && /^注意|但是|然而|虽然/.test(answer.trim())
  checks.push({
    id: 'emotion_aware',
    label: '情绪识别与回应',
    pass: !coldOpen,
    note: coldOpen ? '用户懊恼时先泼冷水' : regret ? '可先安抚再给方案' : '情绪场景不突出',
  })

  const passCount = checks.filter((c) => c.pass).length
  const score = clamp(40 + passCount * 12)

  return { checks, score }
}

function applySceneWeights(
  dims: ExecutionDimensionScore[],
  sceneId: DietSceneId,
): ExecutionDimensionScore[] {
  const weights = SCENE_EXEC_WEIGHTS[sceneId] ?? {}
  return dims.map((d) => {
    const w = weights[d.id] ?? 1
    return { ...d, value: clamp(d.value * w) }
  })
}

/** 完整测评报告 */
export function runEvalAgent(userMessage: string, answer: string): EvalReport {
  const routing = routeDietScene(userMessage)
  const q = userMessage.trim()
  const a = answer.trim()

  let execution = [
    scoreInfoExtraction(q, a),
    scorePlanQuality(a, routing.sceneId),
    scoreDataEvidence(a),
    scoreActionability(a),
    scoreSceneFit(a, routing),
  ]
  execution = applySceneWeights(execution, routing.sceneId)

  const globalRules = evaluateGlobalRules(q, a)

  const execAvg = execution.reduce((s, d) => s + d.value, 0) / execution.length
  const routeBonus = routing.confidence >= 0.7 ? 4 : 0
  const total = clamp(execAvg * 0.62 + globalRules.score * 0.28 + routeBonus + 6)

  const pass = total >= 75 && globalRules.checks.filter((c: GlobalRuleCheck) => c.pass).length >= 4

  const summary = pass
    ? `质量达标 · ${routing.sceneLabel} · 调性 ${globalRules.checks.filter((c: GlobalRuleCheck) => c.pass).length}/5`
    : total >= 65
      ? `基本可用 · ${routing.sceneLabel} · 建议补强数据或调性`
      : `需改进 · 可加强场景贴合与数据依据`

  return {
    routing,
    execution,
    globalRules,
    total,
    pass,
    summary,
  }
}

export function evalReportToTaskScore(report: EvalReport): TaskScore {
  return {
    total: report.total,
    dimensions: report.execution.map((d) => ({ label: d.label, value: d.value })),
    note: report.summary,
    evalReport: report,
  }
}

export function scoreResponseWithEvalAgent(question: string, answer: string): TaskScore {
  return evalReportToTaskScore(runEvalAgent(question, answer))
}
