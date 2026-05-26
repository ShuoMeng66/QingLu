import type { AppLocale, AiPreferences } from './appPreferences'
import { buildLocaleReplyInstruction } from './i18n/chatCopy'

export function buildAiPreferencePrompt(ai: AiPreferences, locale: AppLocale = 'zh'): string {
  const toneHint: Record<AiPreferences['tone'], string> = {
    friendly: '语气亲切自然，像朋友聊天',
    professional: '语气专业克制，条理清晰',
    coach: '语气像教练，鼓励推进但有节奏',
  }
  const detailHint: Record<AiPreferences['detail'], string> = {
    concise: '回答简洁，优先给结论和关键数字',
    balanced: '详略适中，结论先行再补充理由',
    detailed: '回答尽量完整，步骤与注意事项写清楚',
  }

  const parts = [
    toneHint[ai.tone],
    detailHint[ai.detail],
    ai.useEmoji ? '可适度使用 emoji' : '不要使用 emoji',
    ai.citeNearby
      ? '若问题与外出、饮食或训练相关，可结合附近真实地点举例'
      : '不要主动引用用户附近地点',
  ]

  return [`用户 AI 偏好：${parts.join('；')}。`, buildLocaleReplyInstruction(locale)].join('\n')
}
