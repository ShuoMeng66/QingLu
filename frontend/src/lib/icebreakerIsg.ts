import type { ConversationStarter, DiversityAxis, TriggerInterest } from '../types/icebreaker'
import { buildPreferenceHint } from './agentFeedback'
import { getPromptPreferences } from './promptPreferences'
import { wasStarterClickedRecently } from './icebreakerTelemetry'
import { loadUserProfile } from './userProfile'

const STARTER_TEMPLATES: Record<
  string,
  Array<Omit<ConversationStarter, 'id' | 'interestId'>>
> = {
  calorie_gap: [
    {
      tag: '热量',
      title: '算热量缺口',
      subtitle: '目标体重与每日摄入',
      prompt:
        '我 {height}cm、{weight}kg，想减到 {target}kg，帮我估算每天大概吃多少热量合适？',
      diversityAxis: 'numeric',
      image: '/images/scene-fastfood.jpg',
      imageAlt: '热量与饮食',
    },
    {
      tag: '热量',
      title: '今日还能吃多少',
      subtitle: '按已摄入反推剩余额度',
      prompt: '今天已经吃了约 {eaten_kcal} kcal，按我的减脂目标，晚上还能吃多少？',
      diversityAxis: 'numeric',
      image: '/images/scene-fastfood.jpg',
      imageAlt: '热量记录',
    },
  ],
  meal_plan: [
    {
      tag: '饮食',
      title: '减脂餐搭配',
      subtitle: '三餐简单好做',
      prompt: '帮我设计一份适合上班族的减脂三餐，尽量简单好做，蛋白质优先。',
      diversityAxis: 'meal',
      image: '/images/scene-dining.jpg',
      imageAlt: '均衡饮食',
    },
    {
      tag: '饮食',
      title: '外卖怎么点',
      subtitle: '忙里也能控热量',
      prompt: '今天只能点外卖，帮我选一份相对健康、热量可控的搭配，大概 {lunch_kcal} kcal 左右。',
      diversityAxis: 'meal',
      image: '/images/scene-fastfood.jpg',
      imageAlt: '外卖点餐',
    },
  ],
  workout_plan: [
    {
      tag: '运动',
      title: '运动计划',
      subtitle: '有氧与力量怎么排',
      prompt:
        '每周能运动 {freq} 次，每次 40 分钟，帮我安排一个入门减脂运动计划。',
      diversityAxis: 'workout',
      image: '/images/scene-workout.jpg',
      imageAlt: '运动训练',
    },
  ],
  recovery: [
    {
      tag: '恢复',
      title: '练后怎么吃',
      subtitle: '窗口期与补能',
      prompt: '刚练完力量，接下来 90 分钟内饮食怎么安排比较利于恢复又不超热量？',
      diversityAxis: 'habit',
      image: '/images/scene-workout.jpg',
      imageAlt: '练后恢复',
    },
  ],
  habit: [
    {
      tag: '习惯',
      title: '一周打卡计划',
      subtitle: '饮食运动各 3 项',
      prompt: '帮我列一个可执行的一周减脂打卡清单，饮食和运动各 3 项，别太复杂。',
      diversityAxis: 'habit',
      image: '/images/scene-dining.jpg',
      imageAlt: '习惯养成',
    },
  ],
}

const FALLBACK_STARTERS: Omit<ConversationStarter, 'id'>[] = [
  {
    tag: '热量',
    title: '算热量缺口',
    subtitle: '从目标体重倒推',
    prompt: '我 165cm、62kg，想减到 58kg，帮我估算每天大概吃多少热量合适？',
    interestId: 'calorie_gap',
    diversityAxis: 'numeric',
    image: '/images/scene-fastfood.jpg',
    imageAlt: '热量与饮食',
  },
  {
    tag: '饮食',
    title: '减脂餐搭配',
    subtitle: '三餐怎么吃得均衡',
    prompt: '帮我设计一份适合上班族的减脂三餐，尽量简单好做。',
    interestId: 'meal_plan',
    diversityAxis: 'meal',
    image: '/images/scene-dining.jpg',
    imageAlt: '均衡饮食',
  },
  {
    tag: '运动',
    title: '运动计划',
    subtitle: '有氧与力量怎么安排',
    prompt: '每周能运动 3 次，每次 40 分钟，帮我安排一个入门减脂运动计划。',
    interestId: 'workout_plan',
    diversityAxis: 'workout',
    image: '/images/scene-workout.jpg',
    imageAlt: '运动训练',
  },
]

function fillPlaceholders(text: string): string {
  const profile = loadUserProfile()
  const target = Math.max(50, (profile.weight_kg ?? 78) - 4)
  return text
    .replace('{height}', String(profile.height_cm ?? 175))
    .replace('{weight}', String(profile.weight_kg ?? 78))
    .replace('{target}', String(Math.round(target)))
    .replace('{eaten_kcal}', '1200')
    .replace('{lunch_kcal}', String(profile.daily_targets?.kcal ? Math.round(profile.daily_targets.kcal * 0.35) : 580))
    .replace('{freq}', String(profile.training?.frequency_per_week ?? 3))
}

function applyPreferenceStyle(starter: ConversationStarter): ConversationStarter {
  const prefs = getPromptPreferences()
  const hint = buildPreferenceHint()
  if (prefs.starterStyle === 'conclusion_first' && !starter.prompt.startsWith('先给结论')) {
    return {
      ...starter,
      prompt: `先给结论和具体数字，再展开：${starter.prompt}`,
    }
  }
  if (hint.includes('具体数字') && !/\d/.test(starter.prompt)) {
    return { ...starter, prompt: fillPlaceholders(starter.prompt) }
  }
  return { ...starter, prompt: fillPlaceholders(starter.prompt) }
}

export function generateConversationStarters(
  interests: TriggerInterest[],
  k = 3,
): ConversationStarter[] {
  const usedAxes = new Set<DiversityAxis>()
  const result: ConversationStarter[] = []
  let seq = 0

  for (const interest of interests) {
    const templates = STARTER_TEMPLATES[interest.id] ?? []
    for (const tpl of templates) {
      if (usedAxes.has(tpl.diversityAxis)) continue
      const id = `starter_${interest.id}_${seq++}`
      if (wasStarterClickedRecently(id)) continue
      const starter = applyPreferenceStyle({
        ...tpl,
        id,
        interestId: interest.id,
        prompt: fillPlaceholders(tpl.prompt),
      })
      result.push(starter)
      usedAxes.add(tpl.diversityAxis)
      if (result.length >= k) break
    }
    if (result.length >= k) break
  }

  for (const fb of FALLBACK_STARTERS) {
    if (result.length >= k) break
    if (usedAxes.has(fb.diversityAxis)) continue
    const id = `starter_fallback_${fb.interestId}`
    if (wasStarterClickedRecently(id)) continue
    result.push(applyPreferenceStyle({ ...fb, id }))
    usedAxes.add(fb.diversityAxis)
  }

  const hasNumeric = result.some((s) => s.diversityAxis === 'numeric' || /\d/.test(s.prompt))
  if (!hasNumeric && result.length > 0) {
    result[0] = applyPreferenceStyle({
      ...FALLBACK_STARTERS[0],
      id: 'starter_fallback_numeric',
    })
  }

  return result.slice(0, k)
}

export function pickFeaturedStarter(starters: ConversationStarter[]): ConversationStarter | null {
  return starters[0] ?? null
}
