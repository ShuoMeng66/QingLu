import type { TaskPlan, TaskScore } from '../types/agentCluster'
import type { DietSceneId } from '../types/evalAgent'
import { buildPreferenceHint } from './agentFeedback'
import { buildAiPreferencePrompt } from './aiPreferencePrompt'
import { loadAppPreferences } from './appPreferences'
import { getPromptPreferences, buildEvolvedPreferenceHints } from './promptPreferences'
import { routeDietScene, scoreResponseWithEvalAgent } from './evalAgent'
import { buildUserContextPrompt } from './userContextPrompt'

const SCENE_STEPS: Record<Exclude<DietSceneId, 'general_health'>, string[]> = {
  A1_gathering_poi: [
    '确认聚餐人数、预算与口味偏好',
    '按减脂友好度筛选 2–3 家餐厅',
    '给出选店理由 + 到店点菜原则',
  ],
  A2_in_store_order: [
    '使用已知位置/门店与今日剩余热量额度',
    '按少油少糖原则点选具体 SKU',
    '估算本餐 kcal 与蛋白克数',
  ],
  B_takeout: [
    '使用已知配送区域与今日剩余热量额度',
    '筛选 2–3 套外卖组合（含店名或品类）',
    '标注热量与替换建议',
  ],
  C_travel_explore: [
    '确认城市/商圈与餐次',
    '推荐当地健康餐选项',
    '给出便携补救方案',
  ],
  D_post_meal_recovery: [
    '先安抚情绪，评估超标幅度',
    '安排次日/下一餐清淡补救',
    '保持整周节奏不被一餐打断',
  ],
  E_calorie_query: [
    '提取目标体重与已摄入',
    '计算剩余额度或缺口',
    '给出下一餐热量区间',
  ],
}

export function decomposeTask(input: string): TaskPlan {
  const text = input.trim()
  const route = routeDietScene(text)

  if (route.sceneId !== 'general_health' && route.confidence >= 0.6) {
    const steps = SCENE_STEPS[route.sceneId]
    return { steps, focus: route.sceneLabel }
  }

  if (/减|脂|体重|热量|卡路里|BMI/.test(text)) {
    return {
      focus: '减脂与体重管理',
      steps: [
        '确认目标、周期与饮食禁忌',
        '估算每日热量与三大营养素比例',
        '给出饮食搭配 + 有氧/力量组合',
      ],
    }
  }

  if (/练|跑|深蹲|硬拉|举|铁|有氧|HIIT|拉伸/.test(text)) {
    return {
      focus: '训练计划',
      steps: [
        '确认训练类型、经验与当日状态',
        '拆解热身、主训、冷身三阶段',
        '给出组数/配速/休息与恢复建议',
      ],
    }
  }

  if (/吃|餐|点|外卖|聚|火锅|烧烤|蛋白/.test(text)) {
    return {
      focus: route.sceneLabel !== '综合健康咨询' ? route.sceneLabel : '饮食决策',
      steps: SCENE_STEPS.B_takeout,
    }
  }

  if (/睡|休息|疲劳|恢复/.test(text)) {
    return {
      focus: '恢复管理',
      steps: [
        '评估睡眠与疲劳信号',
        '区分需要休息 vs 可低强度活动',
        '给出恢复策略与次日训练调整',
      ],
    }
  }

  return {
    focus: '综合健康咨询',
    steps: [
      '理解问题与健身相关背景',
      '拆成 2–3 个可执行步骤',
      '补充注意事项与下一步行动',
    ],
  }
}

export function scoreResponse(question: string, answer: string): TaskScore {
  return scoreResponseWithEvalAgent(question, answer)
}

export function buildClusterSystemPrompt(plan: TaskPlan): string {
  const steps = plan.steps.map((step, i) => `${i + 1}. ${step}`).join('\n')
  const hint = buildPreferenceHint()
  const evolved = buildEvolvedPreferenceHints()
  const prefs = getPromptPreferences()
  const constraints = prefs.clusterConstraints.join('；')
  const aiPrefs = buildAiPreferencePrompt(loadAppPreferences().ai, loadAppPreferences().locale)

  const userContext = buildUserContextPrompt()

  return [
    '你是「轻鹭」，用户的本地生活减脂 AI 管家。产品调性：轻松友好、不说教；数据先行、推荐有理有据。',
    userContext,
    `本轮重点：${plan.focus}`,
    '本轮步骤：',
    steps,
    'Skill 1 全局规则：先给结论与 kcal/克数；用「可以/建议」而非「必须」；推荐带理由；少铺垫；用户懊恼时先安抚。',
    '若【用户实况】已含位置或今日热量，直接据此推荐，勿用「先告诉我地址/吃了多少」开场。',
    `要求：${constraints}`,
    aiPrefs,
    hint,
    evolved,
  ]
    .filter(Boolean)
    .join('\n')
}
