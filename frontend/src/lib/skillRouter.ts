import type { QingluSkillModuleId } from '../generated/qingluSkillModules'
import type { TaskSceneType } from './taskPrompts'

export interface SkillRouteResult {
  moduleId: QingluSkillModuleId
  label: string
  confidence: number
  matchedSignals: string[]
}

const MODULE_LABELS: Record<QingluSkillModuleId, string> = {
  'skill1-diet': 'Skill 1 · 吃什么',
  'skill2-venue': 'Skill 2 · 去哪练',
  'skill3-recovery': 'Skill 3 · 恢复放松',
  'skill4-social': 'Skill 4 · 一起动',
  general: '综合对话（仅路由层）',
}

const SCENE_TO_MODULE: Record<TaskSceneType, QingluSkillModuleId> = {
  takeout: 'skill1-diet',
  gathering: 'skill1-diet',
  train: 'skill2-venue',
  recover: 'skill3-recovery',
  move: 'skill4-social',
}

interface RouteRule {
  moduleId: QingluSkillModuleId
  patterns: RegExp[]
  signals: string[]
  priority: number
}

/** Lower priority number = matched first (aligns with burnpal_skill/SKILL.md) */
const ROUTE_RULES: RouteRule[] = [
  {
    moduleId: 'skill3-recovery',
    priority: 0,
    patterns: [/刺痛|肿胀|活动受限|跑完.*痛|膝盖.*痛|扭伤|骨折|急诊|就医/i],
    signals: ['运动损伤 / 安全拦截'],
  },
  {
    moduleId: 'skill1-diet',
    priority: 1,
    patterns: [/断食|催吐|极端减重/i],
    signals: ['饮食安全红线'],
  },
  {
    moduleId: 'skill1-diet',
    priority: 10,
    patterns: [
      /吃什么|外卖|点菜|餐厅|聚餐|约饭|饭局|热量|卡路里|kcal|大卡|吃多了|补救|星巴克|海底捞|麦当劳|肯德基|必胜客|喜茶|奈雪|火锅|烧烤|蛋白|餐|吃/i,
    ],
    signals: ['饮食 / 外卖 / 聚餐'],
  },
  {
    moduleId: 'skill2-venue',
    priority: 20,
    patterns: [
      /健身房|泳池|球场|跑道|器械|去哪练|附近.*健身|月卡|团课|私教|场地|篮球馆|羽毛球馆|拳击|瑜伽馆|练哪里/i,
    ],
    signals: ['运动场地'],
  },
  {
    moduleId: 'skill3-recovery',
    priority: 30,
    patterns: [/按摩|推拿|拉伸服务|正骨|冰浴|酸痛|放松|肩颈|恢复服务|练完.*恢复/i],
    signals: ['恢复放松'],
  },
  {
    moduleId: 'skill4-social',
    priority: 40,
    patterns: [
      /组局|约人运动|找活动|跑团|飞盘|骑行团|周末.*活动|发个局|找人一起|运动局|一起动|匹克球|腰旗橄榄球/i,
    ],
    signals: ['运动社交 / 一起动'],
  },
  {
    moduleId: 'skill2-venue',
    priority: 25,
    patterns: [/练|深蹲|硬拉|举铁|有氧|HIIT|训练计划|胸\+|背\+|腿\+/i],
    signals: ['训练相关（偏场地/计划）'],
  },
]

const ROUTE_RULES_SORTED = [...ROUTE_RULES].sort((a, b) => a.priority - b.priority)

/**
 * Code-level router (Scheme B): pick one Skill module to load into system prompt.
 * Aligns with root SKILL.md; task cards can pass sceneType as a high-confidence hint.
 */
export function routeQingluSkillModule(
  userMessage: string,
  hint?: { sceneType?: TaskSceneType },
): SkillRouteResult {
  const text = userMessage.trim()

  if (hint?.sceneType) {
    const moduleId = SCENE_TO_MODULE[hint.sceneType]
    return {
      moduleId,
      label: MODULE_LABELS[moduleId],
      confidence: 0.95,
      matchedSignals: [`今日任务入口: ${hint.sceneType}`],
    }
  }

  for (const rule of ROUTE_RULES_SORTED) {
    if (!rule.patterns.some((p) => p.test(text))) continue
    return {
      moduleId: rule.moduleId,
      label: MODULE_LABELS[rule.moduleId],
      confidence: Math.min(0.98, 0.75 + rule.signals.length * 0.05),
      matchedSignals: rule.signals,
    }
  }

  if (/减|脂|体重|睡|休息|疲劳|健康|BMI/.test(text)) {
    return {
      moduleId: 'general',
      label: MODULE_LABELS.general,
      confidence: 0.55,
      matchedSignals: ['综合健康咨询，未命中四模块关键词'],
    }
  }

  return {
    moduleId: 'general',
    label: MODULE_LABELS.general,
    confidence: 0.4,
    matchedSignals: ['意图不明确，仅加载路由层'],
  }
}
