/**
 * 面向公众的产品文案（不含开发者模式内的 API 字段标签）
 */

export const BRAND = {
  name: 'BurnPal 轻鹭',
  tagline: '轻盈随行 · 智慧本地',
  description:
    '基于 OpenClaw 的本地生活减脂搭子——聚餐、外卖、练后在真实场景里给你可执行的饮食与运动建议。',
} as const

export const QUICK_ACTIONS = [
  { id: 'eat', icon: '🍽', label: '吃什么', prompt: '今天下班后吃什么比较合适？' },
  { id: 'train', icon: '🏃', label: '去哪练', prompt: '帮我找附近适合力量训练的健身房' },
  { id: 'recover', icon: '🌿', label: '恢复一下', prompt: '今天练完腿了，给我一些拉伸恢复建议' },
  { id: 'move', icon: '💪', label: '一起动', prompt: '帮我安排今天的运动计划' },
] as const

export const DEMO_STATUS = {
  calories: { label: '今日剩余热量', value: '剩余 782 kcal', icon: '🔥' },
  training: { label: '训练计划', value: '晚间臀腿训练', time: '19:00 开始', icon: '🏋' },
  location: { label: '当前位置', value: '珠江新城', weather: '晴 28°C 优', icon: '📍' },
} as const

export const FOCUS_PILLARS = [
  { id: 'diet', icon: '食', label: '饮食', hint: '搭配与份量' },
  { id: 'calorie', icon: '热', label: '热量', hint: '缺口与记录' },
  { id: 'move', icon: '动', label: '运动', hint: '计划与恢复' },
] as const

export const CONNECTION_STATUS_LABEL = {
  idle: '待连接',
  checking: '连接中',
  connected: '在线',
  error: '离线',
} as const

export const EMPTY_STATE = {
  title: '科学减脂，轻松开练',
  lead: '选一个话题，或直接输入你的问题。',
  todayLabel: '今日能量',
  startersLabel: '推荐开场',
} as const

export const CHAT = {
  statusOnline: '轻鹭待命',
  statusClusterWorking: '轻鹭思考中',
  statusGenerating: '回复中',
  statusOffline: '离线',
  placeholderReady: '问问 BurnPal…',
  placeholderGenerating: '正在回复…',
  placeholderOffline: '服务暂不可用，请稍后在设置中重试',
  stopped: '（已停止生成）',
  emptyReply: '（暂无回复内容）',
} as const

export const SIDEBAR = {
  newChat: '新建对话',
  currentSection: '当前对话',
  historySection: '历史记录',
  noConversation: '还没有对话',
  noHistory: '暂无历史记录',
  navChat: '对话',
  navSettings: '设置',
  yiqidong: '一起动',
} as const

export const TOAST = {
  newConversation: '已开始新对话',
  conversationDeleted: '对话已删除',
  conversationDeletedNew: '已为你开启新对话',
  settingsSaved: '设置已保存',
  settingsReset: '已恢复默认设置',
  connectionOk: '连接成功，轻鹭已就绪',
  developerUnlocked: '已开启开发者模式',
  yiqidongSaved: (summary: string) => `一起动已保存 · ${summary}`,
  sendFailed: '消息发送失败，请稍后重试',
  stopped: '已停止生成',
  needConnection: '请先完成连接后再开始对话',
  feedbackThanks: '感谢您的反馈！',
  feedbackImprove: '感谢反馈，轻鹭会继续改进',
  regenerating: '正在重新生成…',
  editingResend: '正在根据新问题生成回复…',
  voiceUnsupported: '当前浏览器不支持语音输入，请使用 Chrome 或 Edge',
  voiceListening: '正在聆听…',
  voiceStarted: '语音输入已开始，请说话',
} as const

export const SETTINGS = {
  eyebrow: '账户',
  title: '设置',
  close: '关闭',
  connectionLabel: '服务状态',
  ready: '轻鹭在线',
  waiting: '暂时无法连接',
  checking: '检查中',
  connected: '在线',
  error: '连接异常',
  idle: '未检查',
  testConnection: '测试连接',
  reset: '恢复默认',
  save: '保存设置',
  developerPlaceholder: '#开发者',
  developerAria: '开发者模式',
} as const

export const YIQIDONG = {
  eyebrow: '健康',
  title: '一起动',
  back: '返回',
  heroLabel: '运动提醒',
  modeLabel: '提醒方式',
  casual: '随心推',
  scheduled: '固定提醒',
  off: '关闭',
  maxPerDay: '每日最多提醒',
  repeat: '重复周期',
  intervalDays: '间隔天数',
  pickDays: '选择星期',
  times: '提醒时间',
  remove: '移除',
  addTime: '添加时间',
  preview: '当前设置',
  reset: '恢复默认',
  save: '保存',
  offSummary: '未开启',
  questEyebrow: '新委托',
  questCasualTitle: '随心任务',
  questScheduledTitle: '运动委托',
  questAccept: '查看',
  questLater: '稍后',
  letterShaking: '轻鹭来信了…',
  letterAck: '知道了',
  letterSignOff: '—— 轻鹭',
} as const
