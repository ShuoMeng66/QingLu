import type { TaskPlan } from '../types/agentCluster'
import { buildPreferenceHint } from './agentFeedback'
import { buildAiPreferencePrompt } from './aiPreferencePrompt'
import { loadAppPreferences } from './appPreferences'
import { getPromptPreferences, buildEvolvedPreferenceHints } from './promptPreferences'
import { getQingluSkillModuleContext } from '../generated/qingluSkillModules'
import type { SkillRouteResult } from './skillRouter'
import { loadSessionContext, type SessionContext } from './sessionContext'
import { getTodayConsumedKcal } from './mealLog'
import { loadTodaySnapshot } from './todaySnapshot'
import { getCachedUserLocation } from './userLocation'
import { formatLocationLabel } from './citySkyline'
import { getProfileTier, getRemainingKcal, loadUserProfile, type UserProfile } from './userProfile'
import type { TaskSceneType } from './taskPrompts'

/** 前端建档引导信号（勿展示给用户） */
export const SYSTEM_ONBOARDING_SIGNAL = '[SYSTEM_ONBOARDING]'

const GOAL_LABEL: Record<string, string> = {
  fat_loss: '减脂',
  muscle_gain: '增肌',
  maintain: '维持',
}

const GOAL_INTENSITY: Record<string, string> = {
  fat_loss: '中度控制',
  muscle_gain: '稳步增肌',
  maintain: '维持当前体重',
}

function formatLocation(profile: UserProfile): string {
  const loc = getCachedUserLocation()
  if (loc) return formatLocationLabel(loc.city, loc.region)
  return profile.location_city?.trim() || '未填写'
}

function formatGoal(profile: UserProfile): string {
  return GOAL_LABEL[profile.goal ?? ''] ?? '健康管理'
}

function formatDietStrategy(profile: UserProfile): string {
  const cuisines = profile.preferences?.favorite_cuisines?.filter(Boolean) ?? []
  if (cuisines.length) return cuisines.map((c) => `少油${c}`).join('、')
  return '均衡、少油控糖'
}

function formatWorkoutPrefs(profile: UserProfile): string {
  const t = profile.training?.typical_session ?? profile.training?.next_session
  if (t) return t
  const tier = getProfileTier(profile)
  if (tier === 'beginner' && profile.beginner_summary?.workout_style) {
    return profile.beginner_summary.workout_style
  }
  return '综合训练'
}

function formatFitnessLevel(profile: UserProfile): string {
  const tier = getProfileTier(profile)
  if (tier === 'advanced') {
    const exp = profile.training_profile?.experience
    if (exp === 'beginner') return '新手'
    if (exp === 'intermediate') return '有基础'
    if (exp === 'advanced') return '进阶'
  }
  return tier === 'beginner' ? '新手' : '有基础'
}

function formatRiskNotes(profile: UserProfile): string {
  const limits = profile.training_profile?.limitations?.filter(Boolean) ?? []
  return limits.length ? limits.join('、') : '无'
}

function buildUserProfileBlock(profile: UserProfile, todayLocation: string) {
  const consumed = getTodayConsumedKcal()
  const budget = profile.daily_targets?.kcal ?? 0
  const remaining = budget > 0 ? getRemainingKcal(profile, consumed) : null
  const today = loadTodaySnapshot()

  return {
    name: profile.nickname?.trim() || '用户',
    goal: formatGoal(profile),
    goal_intensity: GOAL_INTENSITY[profile.goal ?? ''] ?? '—',
    diet_strategy: formatDietStrategy(profile),
    food_restrictions: profile.preferences?.avoid?.filter(Boolean).join('、') || '无',
    taste_preference: profile.preferences?.favorite_cuisines?.join('、') || '均衡',
    takeout_budget: '30–50元',
    dining_budget: '100–200元',
    workout_preferences: formatWorkoutPrefs(profile),
    fitness_level: formatFitnessLevel(profile),
    common_locations: todayLocation,
    risk_notes: formatRiskNotes(profile),
    today_intake_kcal: consumed,
    daily_target_kcal: budget || '—',
    calorie_remaining: remaining ?? today.remaining_kcal ?? '—',
    planned_workout: today.training_plan ?? profile.training?.next_session ?? '—',
    current_location: today.location_label ?? todayLocation,
    body_state: today.body_status ?? '正常',
    today_plan: today.special_note?.trim() || '无特殊安排',
  }
}

function buildSessionContextBlock(ctx: SessionContext): string {
  return JSON.stringify(
    {
      current_skill: ctx.current_skill,
      scene_type: ctx.scene_type,
      last_recommendations: ctx.last_recommendations,
      selected_item: ctx.selected_item,
      party_size: ctx.party_size,
      current_area: ctx.current_area,
    },
    null,
    2,
  )
}

function buildPreferenceSection(): string {
  const hint = buildPreferenceHint()
  const evolved = buildEvolvedPreferenceHints()
  const prefs = getPromptPreferences()
  const constraints = prefs.clusterConstraints.join('\n')
  const aiPrefs = buildAiPreferencePrompt(loadAppPreferences().ai, loadAppPreferences().locale)
  return [constraints, aiPrefs, hint, evolved].filter(Boolean).join('\n\n')
}

const PE_CORE = `你是「轻鹭」(QingLu)，用户的全天候 AI 本地生活减脂管家。
你通过 IM 对话帮用户在聚餐、外卖、健身、恢复、社交运动等真实生活场景里做出符合健康目标的最优选择。

你的底层人设：一个懂你的朋友——不问不多嘴，一问就给靠谱答案。

━━━━━━━━━━━━━━━━━━━━━━━━
【全局行为规则】
━━━━━━━━━━━━━━━━━━━━━━━━

输出格式：
- IM 风格：先一句结论，再 2–3 条短要点
- 禁止 Markdown 标题（# 号）和表格（| 符号）
- 禁止说教，禁止道德评判
- 禁止铺垫，直接给答案

数据诚实：
- 所有推荐的店铺、场馆、活动必须来自当前加载的 Skill 数据文件
- 数据库里没有的店，坦诚说「当前没有这个区域的数据」，给通用策略
- 不编造店名、地址、价格、热量数值

安全优先：
- 用户描述刺痛、肿胀、活动受限 → 引导就医，不推荐任何恢复服务
- 用户提到极端节食、催吐 → 拒绝并温和引导健康方式
- 不收集真实个人信息；用户档案来自用户在本应用内填写的内容

━━━━━━━━━━━━━━━━━━━━━━━━
【结构化输出规则】
━━━━━━━━━━━━━━━━━━━━━━━━

以下场景必须在文字回复之后，紧接输出结构化 JSON 块：

触发场景（命中任一即输出）：
- 推荐外卖（scene_type: takeout）
- 推荐餐厅/聚餐（scene_type: dining）
- 聚餐点菜方案（scene_type: dining_order）
- 推荐健身房/运动场馆（scene_type: venue / class）
- 推荐恢复服务门店（scene_type: service_or_home）
- 推荐运动活动（scene_type: activity / discovery）
- 发起活动确认卡（scene_type: create）
- 建档完成（type: profile_complete）
- 医疗安全响应（scene_type: safety）

输出格式（固定，不得更改标记符）：
---JSON_START---
{ 完整的 JSON 内容，字段定义见当前加载的 Skill 模块 }
---JSON_END---

JSON 格式规则：
1. JSON 块紧跟在文字回复之后，中间不加空行
2. JSON 必须是合法格式，所有字符串值用双引号
3. 数字类型不加引号（kcal、price、rating 等）
4. 无数据的可选字段填 null，不要省略字段
5. platform_card.url 在 Demo 阶段统一填 null
6. platform_card.search_keyword 格式：「店名 区域」，如「肌肉饭研究所 朝阳」
7. follow_up_actions 数组至少包含 2 个 action

以下场景不输出 JSON（只输出文字）：
- 热量查询
- 餐后补救建议
- 就医引导（Skill 3 场景 X）—— 例外：输出 medical_safety_response JSON
- 建档对话过程中（建档完成后才输出 profile_complete）
- 纯文字闲聊

建档触发规则：
当收到消息 ${SYSTEM_ONBOARDING_SIGNAL} 时，这是前端发来的建档触发信号。
不要把 ${SYSTEM_ONBOARDING_SIGNAL} 显示给用户，直接输出以下引导语：

「你好，我是轻鹭 👋
先了解一下你，之后每次推荐都能直接给你最合适的方案。

快速问你几个问题：
1. 现在主要目标是什么？减脂 / 维持 / 增肌
2. 有什么忌口吗？（没有就说「没有」）
3. 外卖预算大概多少？30以内 / 30–50 / 50+
4. 常在哪个区域活动？（说地标就行）」

用户回答后生成档案，输出 profile_complete JSON，然后立刻回答用户最初的问题（如果有）。`

export interface BuildPePromptInput {
  plan: TaskPlan
  userMessage: string
  route: SkillRouteResult
  sceneType?: TaskSceneType
  session?: SessionContext
}

export function buildQingluPeSystemPrompt(input: BuildPePromptInput): string {
  const profile = loadUserProfile()
  const todayLocation = formatLocation(profile)
  const vars = buildUserProfileBlock(profile, todayLocation)
  const session = input.session ?? loadSessionContext()
  const steps = input.plan.steps.map((step, i) => `${i + 1}. ${step}`).join('\n')
  const skillPack = getQingluSkillModuleContext(input.route.moduleId)

  const sceneHint = input.sceneType ? `\n本轮任务入口 scene_type: ${input.sceneType}` : ''

  return [
    PE_CORE,
    '',
    '━━━━━━━━━━━━━━━━━━━━━━━━',
    '【用户实况 · App 已采集】',
    '━━━━━━━━━━━━━━━━━━━━━━━━',
    '',
    `当前用户：${vars.name}`,
    `位置：${vars.current_location}`,
    `今日热量：已摄入约 ${vars.today_intake_kcal} kcal；每日目标 ${vars.daily_target_kcal} kcal；剩余额度约 ${vars.calorie_remaining} kcal`,
    `今日训练计划：${vars.planned_workout}`,
    `身体状态：${vars.body_state}`,
    `今日特殊安排：${vars.today_plan}`,
    '',
    'user_profile:',
    `  name: ${vars.name}`,
    `  goal: ${vars.goal}`,
    `  goal_intensity: ${vars.goal_intensity}`,
    `  diet_strategy: ${vars.diet_strategy}`,
    `  food_restrictions: ${vars.food_restrictions}`,
    `  taste_preference: ${vars.taste_preference}`,
    `  takeout_budget: ${vars.takeout_budget}`,
    `  dining_budget: ${vars.dining_budget}`,
    `  workout_preferences: ${vars.workout_preferences}`,
    `  fitness_level: ${vars.fitness_level}`,
    `  common_locations: ${vars.common_locations}`,
    `  risk_notes: ${vars.risk_notes}`,
    '',
    'daily_state:',
    `  calorie_remaining: ${vars.calorie_remaining}`,
    `  planned_workout: ${vars.planned_workout}`,
    `  current_location: ${vars.current_location}`,
    `  body_state: ${vars.body_state}`,
    `  today_plan: ${vars.today_plan}`,
    '',
    'session_context（由前端每轮注入，用于处理追问和选择操作）：',
    buildSessionContextBlock({
      ...session,
      current_skill: input.route.moduleId,
      scene_type: input.sceneType ?? session.scene_type,
      current_area: session.current_area ?? vars.current_location,
    }),
    sceneHint,
    '',
    'session_context 用法：',
    '- 用户说「就第二家吧」→ 从 last_recommendations[1] 取餐厅名',
    '- 用户说「帮我按4人点菜」→ 从 selected_item 取餐厅，从 party_size 取人数',
    '- 用户说「换一家便宜的」→ 保留 scene_type 和 current_area，放宽预算条件',
    '- 用户说「练完帮我安排恢复」→ current_skill 变更为 skill3-recovery，读取 daily_state.planned_workout',
    '- session_context 为空或字段缺失时，按首轮推荐逻辑处理，不报错',
    '',
    '━━━━━━━━━━━━━━━━━━━━━━━━',
    '【本轮编排】',
    '━━━━━━━━━━━━━━━━━━━━━━━━',
    '',
    `本轮重点：${input.plan.focus}`,
    '本轮步骤：',
    steps,
    '',
    '━━━━━━━━━━━━━━━━━━━━━━━━',
    '【Skill 路由】',
    '━━━━━━━━━━━━━━━━━━━━━━━━',
    '',
    `已加载：${input.route.label}（命中原因：${input.route.matchedSignals.join('、')}）`,
    `active_skill_id: ${input.route.moduleId}`,
    '仅使用本模块与共享 JSON；勿引用未加载模块数据。',
    '',
    '━━━━━━━━━━━━━━━━━━━━━━━━',
    '【偏好与守门】',
    '━━━━━━━━━━━━━━━━━━━━━━━━',
    '',
    buildPreferenceSection(),
    '',
    '━━━━━━━━━━━━━━━━━━━━━━━━',
    '--- 以下为路由层 + 当前模块 Skill ---',
    '━━━━━━━━━━━━━━━━━━━━━━━━',
    '',
    skillPack,
  ].join('\n')
}
