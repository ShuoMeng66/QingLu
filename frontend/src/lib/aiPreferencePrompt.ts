import type { AppLocale, AiPreferences } from './appPreferences'
import { buildLocaleReplyInstruction } from './i18n/chatCopy'
import { translate, type MessageKey } from './i18n/messages'

export function buildAiPreferencePrompt(ai: AiPreferences, locale: AppLocale = 'zh'): string {
  const toneKey = `ai.pref.tone.${ai.tone}` as MessageKey
  const detailKey = `ai.pref.detail.${ai.detail}` as MessageKey

  const parts = [
    translate(locale, toneKey),
    translate(locale, detailKey),
    translate(locale, ai.useEmoji ? 'ai.pref.emojiOn' : 'ai.pref.emojiOff'),
    translate(locale, ai.citeNearby ? 'ai.pref.nearbyOn' : 'ai.pref.nearbyOff'),
    translate(
      locale,
      ai.outputGuard !== false ? 'ai.pref.outputGuardOn' : 'ai.pref.outputGuardOff',
    ),
  ]

  return [
    `${translate(locale, 'ai.pref.header')}：${parts.join('；')}。`,
    buildLocaleReplyInstruction(locale),
  ].join('\n')
}
