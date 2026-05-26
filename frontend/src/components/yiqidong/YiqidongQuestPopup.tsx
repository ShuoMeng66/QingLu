import type { YiqidongLetter } from '../../lib/yiqidongEnvelopes'
import { previewLetterBody } from '../../lib/yiqidongEnvelopes'
import { useI18n } from '../../hooks/useI18n'
import './YiqidongQuestPopup.css'

interface YiqidongQuestPopupProps {
  letter: YiqidongLetter
  onAccept: (letterId: string) => void
  onDismiss: (letterId: string) => void
}

export function YiqidongQuestPopup({ letter, onAccept, onDismiss }: YiqidongQuestPopupProps) {
  const { t } = useI18n()
  const isCasual = letter.kind === 'casual'
  const questTitle = isCasual ? t('yiqidong.questCasualTitle') : t('yiqidong.questScheduledTitle')

  return (
    <aside
      className="yiqidong-quest"
      role="alertdialog"
      aria-labelledby={`yiqidong-quest-title-${letter.id}`}
      aria-describedby={`yiqidong-quest-body-${letter.id}`}
    >
      <div className="yiqidong-quest__card">
        <div className="yiqidong-quest__ribbon" aria-hidden="true">
          {isCasual ? t('yiqidong.casual') : t('yiqidong.scheduled')}
        </div>

        <div className="yiqidong-quest__icon" aria-hidden="true">
          <span className="yiqidong-quest__envelope-body" />
          <span className="yiqidong-quest__envelope-flap" />
        </div>

        <div className="yiqidong-quest__content">
          <p className="yiqidong-quest__eyebrow">{t('yiqidong.questEyebrow')}</p>
          <h3 className="yiqidong-quest__title" id={`yiqidong-quest-title-${letter.id}`}>
            {questTitle}
          </h3>
          <p className="yiqidong-quest__preview" id={`yiqidong-quest-body-${letter.id}`}>
            {previewLetterBody(letter.body)}
          </p>
        </div>

        <div className="yiqidong-quest__actions">
          <button
            type="button"
            className="yiqidong-quest__btn yiqidong-quest__btn--ghost pressable"
            onClick={() => onDismiss(letter.id)}
          >
            {t('yiqidong.questLater')}
          </button>
          <button
            type="button"
            className="yiqidong-quest__btn yiqidong-quest__btn--primary pressable"
            onClick={() => onAccept(letter.id)}
          >
            {t('yiqidong.questAccept')}
          </button>
        </div>
      </div>
    </aside>
  )
}
