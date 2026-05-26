/** Skill 1 饮食管家 — 飞书测评框架场景（Decision Guide 优先级） */
export type DietSceneId =
  | 'A1_gathering_poi'
  | 'A2_in_store_order'
  | 'B_takeout'
  | 'C_travel_explore'
  | 'D_post_meal_recovery'
  | 'E_calorie_query'
  | 'general_health'

export interface DietSceneMeta {
  id: DietSceneId
  label: string
  /** 路由优先级：数字越小越优先匹配 */
  priority: number
}

export const DIET_SCENES: DietSceneMeta[] = [
  { id: 'E_calorie_query', label: 'E · 热量查询', priority: 1 },
  { id: 'D_post_meal_recovery', label: 'D · 餐后补救', priority: 2 },
  { id: 'A2_in_store_order', label: 'A2 · 到店点单', priority: 3 },
  { id: 'A1_gathering_poi', label: 'A1 · 聚餐选餐厅', priority: 4 },
  { id: 'B_takeout', label: 'B · 外卖智选', priority: 5 },
  { id: 'C_travel_explore', label: 'C · 异地探索', priority: 6 },
]

export interface SceneRouteResult {
  sceneId: DietSceneId
  sceneLabel: string
  confidence: number
  matchedSignals: string[]
}

/** 模块 2 — 场景执行通用五维（飞书 Skill 1 测评框架） */
export type ExecutionDimensionId =
  | 'info_extraction'
  | 'plan_quality'
  | 'data_evidence'
  | 'actionability'
  | 'scene_fit'

export interface ExecutionDimensionScore {
  id: ExecutionDimensionId
  label: string
  value: number
  findings: string[]
}

/** 模块 3 — 全局规则（Skill 1 调性五条） */
export interface GlobalRuleCheck {
  id: string
  label: string
  pass: boolean
  note: string
}

export interface GlobalRulesResult {
  checks: GlobalRuleCheck[]
  score: number
}

export interface EvalReport {
  routing: SceneRouteResult
  execution: ExecutionDimensionScore[]
  globalRules: GlobalRulesResult
  /** 加权总分 0–100 */
  total: number
  pass: boolean
  summary: string
}
