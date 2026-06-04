import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { useI18n } from '../../hooks/useI18n'
import { getMealSlotLabel } from '../../lib/i18n/chatCopy'
import { estimateMealCaloriesSmart } from '../../lib/mealCalorieAi'
import type { MealReminder, MealSlot } from '../../lib/mealLog'
import { submitMealLogAsync } from '../../lib/mealLog'
import type { UserProfile } from '../../lib/userProfile'
import type { OpenClawConfig } from '../../types/openclaw'
import { QingluAvatar } from '../qinglu/QingluAvatar'
import './MealEnvelopePopup.css'

interface MealEnvelopePopupProps {
  reminder: MealReminder
  profile: UserProfile
  config: OpenClawConfig
  connected: boolean
  onSubmit: (result: Awaited<ReturnType<typeof submitMealLogAsync>>) => void
  onDismiss: () => void
}

export function MealEnvelopePopup({
  reminder,
  profile,
  config,
  connected,
  onSubmit,
  onDismiss,
}: MealEnvelopePopupProps) {
  const { t, locale } = useI18n()
  const [phase, setPhase] = useState<'envelope' | 'form' | 'result'>('envelope')
  const [food, setFood] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<Awaited<ReturnType<typeof submitMealLogAsync>> | null>(
    null,
  )

  const slotLabel = getMealSlotLabel(locale, reminder.slot as MealSlot)

  const handleSubmit = async () => {
    const trimmed = food.trim()
    if (!trimmed || submitting) return

    setSubmitting(true)
    try {
      const estimate = await estimateMealCaloriesSmart(trimmed, config, connected)
      const logResult = await submitMealLogAsync(profile, reminder.slot, trimmed, estimate)
      setResult(logResult)
      setPhase('result')
      onSubmit(logResult)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        className="meal-envelope"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <button type="button" className="meal-envelope__backdrop" aria-label={t('action.close')} onClick={onDismiss} />

        {phase === 'envelope' && (
          <motion.div
            className="meal-envelope__shake-wrap"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <div className="meal-envelope__envelope" aria-hidden="true">
              <span className="meal-envelope__flap" />
              <span className="meal-envelope__body" />
            </div>
            <p className="meal-envelope__hint">{t('meal.letterFrom', { slot: slotLabel })}</p>
            <button
              type="button"
              className="meal-envelope__open-btn"
              onClick={() => setPhase('form')}
            >
              {t('meal.openEnvelope')}
            </button>
          </motion.div>
        )}

        {(phase === 'form' || phase === 'result') && (
          <motion.article
            className="meal-envelope__paper glass-panel shadow-glass"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            <div className="meal-envelope__paper-head">
              <QingluAvatar size={40} />
              <div>
                <h2>{reminder.title}</h2>
                <p>{reminder.body}</p>
              </div>
            </div>

            {phase === 'form' ? (
              <>
                <label className="meal-envelope__label">
                  {t('meal.whatDidYouEat', { slot: slotLabel })}
                  <textarea
                    value={food}
                    rows={3}
                    placeholder={t('meal.placeholder')}
                    className="meal-envelope__input"
                    disabled={submitting}
                    onChange={(event) => setFood(event.target.value)}
                  />
                </label>
                <button
                  type="button"
                  className="meal-envelope__submit"
                  disabled={!food.trim() || submitting}
                  onClick={() => void handleSubmit()}
                >
                  {submitting ? t('meal.submitting') : t('meal.submit')}
                </button>
                <p className="mt-2 text-[11px] text-slate-400">
                  {connected ? t('meal.hintAi') : t('meal.hintRules')}
                </p>
              </>
            ) : (
              result && (
                <div className="meal-envelope__result">
                  <p>
                    {t('meal.recorded', { kcal: result.entry.kcal })}
                    {result.estimateSource === 'ai' ? t('meal.aiEstimate') : t('meal.ruleEstimate')}
                    {t('meal.todayConsumed', { consumed: result.consumed })}
                  </p>
                  <p className="meal-envelope__remaining">
                    {t('meal.remainingIntake', { remaining: result.remaining })}
                  </p>
                  <p className="meal-envelope__recommend">{result.recommendation}</p>
                  <button type="button" className="meal-envelope__submit" onClick={onDismiss}>
                    {t('meal.ok')}
                  </button>
                </div>
              )
            )}
          </motion.article>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
