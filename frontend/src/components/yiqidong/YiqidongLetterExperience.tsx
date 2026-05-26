import { useEffect, useState } from 'react'
import type { YiqidongLetter } from '../../lib/yiqidongEnvelopes'
import { formatLetterSalutation } from '../../lib/yiqidongEnvelopes'
import { useI18n } from '../../hooks/useI18n'
import './YiqidongLetterExperience.css'

const REVEAL_DELAY_MS = 2800

interface YiqidongLetterExperienceProps {
  letter: YiqidongLetter
  onAcknowledge: (letterId: string) => void
  onDismiss: (letterId: string) => void
}

export function YiqidongLetterExperience({
  letter,
  onAcknowledge,
  onDismiss,
}: YiqidongLetterExperienceProps) {
  const { t } = useI18n()
  const [phase, setPhase] = useState<'shake' | 'letter'>('shake')
  const reducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  useEffect(() => {
    if (reducedMotion) {
      setPhase('letter')
      return
    }
    const timer = window.setTimeout(() => setPhase('letter'), REVEAL_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [letter.id, reducedMotion])

  return (
    <>
      {phase === 'shake' && (
        <div className="yiqidong-shake" role="status" aria-live="polite">
          <div className="yiqidong-shake__envelope" aria-hidden="true">
            <span className="yiqidong-shake__flap" />
            <span className="yiqidong-shake__body" />
          </div>
          <p className="yiqidong-shake__hint">{t('yiqidong.letterShaking')}</p>
        </div>
      )}

      {phase === 'letter' && (
        <div
          className="yiqidong-paper"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby={`yiqidong-paper-title-${letter.id}`}
        >
          <button
            type="button"
            className="yiqidong-paper__backdrop"
            aria-label={t('action.close')}
            onClick={() => onDismiss(letter.id)}
          />
          <article className="yiqidong-paper__sheet">
            <div className="yiqidong-paper__grain" aria-hidden="true" />
            <header className="yiqidong-paper__head">
              <span className="yiqidong-paper__stamp">
                {letter.kind === 'scheduled' ? t('yiqidong.scheduled') : t('yiqidong.casual')}
              </span>
              <h2 id={`yiqidong-paper-title-${letter.id}`} className="yiqidong-paper__title">
                {letter.title}
              </h2>
            </header>

            <p className="yiqidong-paper__salutation">{formatLetterSalutation()}</p>

            <div className="yiqidong-paper__body">{letter.body}</div>

            <footer className="yiqidong-paper__footer">
              <p className="yiqidong-paper__sign">{t('yiqidong.letterSignOff')}</p>
              <div className="yiqidong-paper__actions">
                <button
                  type="button"
                  className="yiqidong-paper__btn yiqidong-paper__btn--ghost"
                  onClick={() => onDismiss(letter.id)}
                >
                  {t('yiqidong.questLater')}
                </button>
                <button
                  type="button"
                  className="yiqidong-paper__btn yiqidong-paper__btn--primary"
                  onClick={() => onAcknowledge(letter.id)}
                >
                  {t('yiqidong.letterAck')}
                </button>
              </div>
            </footer>
          </article>
        </div>
      )}
    </>
  )
}
