import { loadTodaySnapshot } from './todaySnapshot'
import { loadUserProfile } from './userProfile'

export type TaskSceneType = 'takeout' | 'gathering' | 'train' | 'recover' | 'move'

export interface TaskPromptContext {
  nickname: string
  goalLabel: string
  remainingKcal: number
  trainingPlan: string
  locationLabel: string
  dietPrefs: string
  restrictions: string
  budgetMin: number
  budgetMax: number
}

function buildContext(): TaskPromptContext {
  const profile = loadUserProfile()
  const today = loadTodaySnapshot()
  const remainingKcal =
    today.remaining_kcal ??
    (profile.daily_targets?.kcal ? Math.round(profile.daily_targets.kcal * 0.35) : 650)

  const trainingPlan =
    today.training_plan ?? profile.training?.next_session ?? profile.training?.typical_session ?? '今日训练'
  const locationLabel = today.location_label ?? profile.location_city ?? '当前区域'

  const restrictions = profile.preferences?.avoid?.join('、') ?? '无'
  const dietPrefs = profile.preferences?.favorite_cuisines?.join('、') ?? '均衡饮食'

  const budgetMin = 30
  const budgetMax = 55

  const goalLabel =
    profile.goal === 'fat_loss'
      ? '减脂'
      : profile.goal === 'muscle_gain'
        ? '增肌'
        : profile.goal === 'maintain'
          ? '维持'
          : '健康管理'

  return {
    nickname: profile.nickname || '我',
    goalLabel,
    remainingKcal: remainingKcal,
    trainingPlan,
    locationLabel,
    dietPrefs,
    restrictions,
    budgetMin,
    budgetMax,
  }
}

export function buildTaskPrompt(scene: TaskSceneType): string {
  const c = buildContext()

  switch (scene) {
    case 'takeout':
      return `我现在想点外卖。我的目标是${c.goalLabel}，今天还剩 ${c.remainingKcal} kcal，今晚计划${c.trainingPlan}，当前位置在${c.locationLabel}。我偏好${c.dietPrefs}、${c.restrictions}，预算 ${c.budgetMin}–${c.budgetMax} 元。请帮我推荐 2–3 个适合直接下单的外卖方案，并说明热量、价格、推荐理由和避雷点。`
    case 'gathering':
      return `朋友约饭/公司聚餐，我的目标是${c.goalLabel}，今天还剩 ${c.remainingKcal} kcal，当前在${c.locationLabel}。口味偏好：${c.dietPrefs}；忌口：${c.restrictions}；人均预算约 ${defaultDiningBudget()} 元。请按「不扫兴 + 可控热量」推荐 2–3 家餐厅，说明推荐理由、适合点什么、尽量避开什么。`
    case 'train':
      return `帮我找附近适合今天训练的运动场地。今日计划：${c.trainingPlan}；目标：${c.goalLabel}；位置：${c.locationLabel}。请推荐 2–3 个场地，说明器械/适配度、价格、距离与注意事项。`
    case 'recover':
      return `训练后需要恢复安排。今日训练：${c.trainingPlan}；位置：${c.locationLabel}。请先判断是普通酸痛还是需就医的情况；若适合，推荐附近恢复门店，并给居家恢复要点。`
    case 'move':
      return `帮我发现附近适合朋友一起参加的轻运动活动（飞盘、攀岩、普拉提、徒步等）。我在${c.locationLabel}，目标是${c.goalLabel}。请推荐 2–3 个活动，说明时间、费用、强度与新手友好度。`
    default:
      return `请根据我今天的状态（剩余 ${c.remainingKcal} kcal，${c.trainingPlan}，位于${c.locationLabel}）给出本地生活建议。`
  }
}

function defaultDiningBudget(): number {
  return 120
}

export function buildIndoorActivityPrompt(): string {
  const c = buildContext()
  return `请把推荐换成室内活动（攀岩、普拉提、羽毛球等），我在${c.locationLabel}，希望强度适中、适合朋友一起，符合${c.goalLabel}目标。`
}
