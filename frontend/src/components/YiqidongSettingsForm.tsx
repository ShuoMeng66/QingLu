import { useState } from 'react'
import {
  DEFAULT_YIQIDONG_CONFIG,
  describeYiqidongConfig,
  loadYiqidongConfig,
  saveYiqidongConfig,
  WEEKDAY_OPTIONS,
  type YiqidongConfig,
  type YiqidongMode,
} from '../lib/yiqidong'
import { useI18n } from '../hooks/useI18n'
import type { MessageKey } from '../lib/i18n/messages'

interface YiqidongSettingsFormProps {
  onApply: (config: YiqidongConfig) => void
  onSaved?: () => void
}

const REPEAT_IDS = ['daily', 'weekly', 'interval', 'custom'] as const

const MODES: { id: YiqidongMode; labelKey: MessageKey; hintKey: MessageKey }[] = [
  { id: 'casual', labelKey: 'yiqidong.casual', hintKey: 'yiqidong.casualHint' },
  { id: 'scheduled', labelKey: 'yiqidong.scheduled', hintKey: 'yiqidong.scheduledHint' },
  { id: 'off', labelKey: 'yiqidong.off', hintKey: 'yiqidong.offHint' },
]

const fieldClass =
  'w-full rounded-xl border border-white/80 bg-white/70 px-3 py-2 text-sm text-slate-800 outline-none focus:border-emerald-400 dark:border-white/10 dark:bg-slate-800/60'

export function YiqidongSettingsForm({ onApply, onSaved }: YiqidongSettingsFormProps) {
  const { t, locale } = useI18n()
  const [draft, setDraft] = useState<YiqidongConfig>(() => loadYiqidongConfig())

  const setMode = (mode: YiqidongMode) => {
    setDraft((current) => ({ ...current, mode }))
  }

  const toggleDay = (day: string) => {
    setDraft((current) => {
      const days = current.schedule.days.includes(day)
        ? current.schedule.days.filter((item) => item !== day)
        : [...current.schedule.days, day]
      return {
        ...current,
        schedule: { ...current.schedule, days: days.length ? days : [day] },
      }
    })
  }

  const updateTime = (index: number, value: string) => {
    setDraft((current) => {
      const times = [...current.schedule.times]
      times[index] = value
      return { ...current, schedule: { ...current.schedule, times } }
    })
  }

  const addTime = () => {
    setDraft((current) => ({
      ...current,
      schedule: {
        ...current.schedule,
        times: [...current.schedule.times, '18:00'],
      },
    }))
  }

  const removeTime = (index: number) => {
    setDraft((current) => {
      if (current.schedule.times.length <= 1) return current
      return {
        ...current,
        schedule: {
          ...current.schedule,
          times: current.schedule.times.filter((_, i) => i !== index),
        },
      }
    })
  }

  const showDayPicker =
    draft.mode === 'scheduled' &&
    (draft.schedule.repeat === 'weekly' || draft.schedule.repeat === 'custom')

  const handleSave = () => {
    saveYiqidongConfig(draft)
    onApply(draft)
    onSaved?.()
  }

  return (
    <div className="flex flex-col gap-4 pb-2">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-emerald-600">
          {t('yiqidong.heroLabel')}
        </p>
        <p className="mt-1 text-sm text-slate-500">{t('yiqidong.settingsIntro')}</p>
      </div>

      <section className="glass-panel rounded-[20px] p-4 shadow-glass">
        <p className="mb-3 text-sm font-semibold text-slate-800">{t('yiqidong.modeLabel')}</p>
        <div className="flex flex-col gap-2">
          {MODES.map(({ id, labelKey, hintKey }) => (
            <button
              key={id}
              type="button"
              className={`rounded-2xl border px-4 py-3 text-left transition ${
                draft.mode === id
                  ? 'border-emerald-400/60 bg-emerald-50/90 shadow-sm dark:bg-emerald-950/40'
                  : 'border-white/80 bg-white/50 hover:bg-white/70 dark:border-white/10 dark:bg-slate-800/40'
              }`}
              onClick={() => setMode(id)}
            >
              <span className="block text-sm font-semibold text-slate-800">{t(labelKey)}</span>
              <span className="mt-0.5 block text-xs leading-relaxed text-slate-500">{t(hintKey)}</span>
            </button>
          ))}
        </div>
      </section>

      {draft.mode === 'casual' && (
        <section className="glass-panel rounded-[20px] p-4 shadow-glass">
          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-slate-700">{t('yiqidong.maxPerDay')}</span>
            <select
              className={fieldClass}
              value={draft.casual.maxPerDay}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  casual: { maxPerDay: Number(event.target.value) },
                }))
              }
            >
              <option value={1}>{t('yiqidong.timesOnce')}</option>
              <option value={2}>{t('yiqidong.timesTwice')}</option>
              <option value={3}>{t('yiqidong.timesThrice')}</option>
            </select>
          </label>
        </section>
      )}

      {draft.mode === 'scheduled' && (
        <section className="glass-panel rounded-[20px] p-4 shadow-glass">
          <div className="flex flex-col gap-4">
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-slate-700">{t('yiqidong.repeat')}</span>
              <select
                className={fieldClass}
                value={draft.schedule.repeat}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    schedule: {
                      ...current.schedule,
                      repeat: event.target.value as YiqidongConfig['schedule']['repeat'],
                    },
                  }))
                }
              >
                {REPEAT_IDS.map((id) => (
                  <option key={id} value={id}>
                    {t(`yiqidong.repeat.${id}` as MessageKey)}
                  </option>
                ))}
              </select>
            </label>

            {draft.schedule.repeat === 'interval' && (
              <label className="flex flex-col gap-2 text-sm">
                <span className="font-medium text-slate-700">{t('yiqidong.intervalDays')}</span>
                <input
                  type="number"
                  min={1}
                  max={30}
                  className={fieldClass}
                  value={draft.schedule.intervalDays}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      schedule: {
                        ...current.schedule,
                        intervalDays: Math.max(1, Number(event.target.value) || 1),
                      },
                    }))
                  }
                />
              </label>
            )}

            {showDayPicker && (
              <div>
                <p className="mb-2 text-sm font-medium text-slate-700">{t('yiqidong.pickDays')}</p>
                <div className="grid grid-cols-7 gap-1.5">
                  {WEEKDAY_OPTIONS.map((day) => (
                    <button
                      key={day.id}
                      type="button"
                      className={`rounded-xl py-2 text-xs font-semibold transition ${
                        draft.schedule.days.includes(day.id)
                          ? 'btn-vitality'
                          : 'bg-white/60 text-slate-500 hover:bg-white/80'
                      }`}
                      onClick={() => toggleDay(day.id)}
                    >
                      {t(`yiqidong.weekday.${day.id}` as MessageKey)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="mb-2 text-sm font-medium text-slate-700">{t('yiqidong.times')}</p>
              <div className="flex flex-col gap-2">
                {draft.schedule.times.map((time, index) => (
                  <div key={`${time}-${index}`} className="flex items-center gap-2">
                    <input
                      type="time"
                      className={fieldClass}
                      value={time}
                      onChange={(event) => updateTime(index, event.target.value)}
                    />
                    {draft.schedule.times.length > 1 && (
                      <button
                        type="button"
                        className="shrink-0 text-xs font-semibold text-red-400"
                        onClick={() => removeTime(index)}
                      >
                        {t('yiqidong.remove')}
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  className="self-start text-xs font-semibold text-emerald-500"
                  onClick={addTime}
                >
                  + {t('yiqidong.addTime')}
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-emerald-200/60 bg-emerald-50/70 px-4 py-3 dark:border-emerald-900/40 dark:bg-emerald-950/30">
        <p className="text-xs font-medium text-slate-500">{t('yiqidong.preview')}</p>
        <p className="mt-1 text-sm font-semibold text-slate-800">
          {describeYiqidongConfig(draft, locale)}
        </p>
      </section>

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          className="flex-1 rounded-full border border-white/80 bg-white/60 py-3 text-sm font-semibold text-slate-600"
          onClick={() => setDraft({ ...DEFAULT_YIQIDONG_CONFIG })}
        >
          {t('yiqidong.reset')}
        </button>
        <button type="button" className="btn-vitality flex-1 rounded-full py-3 text-sm font-semibold" onClick={handleSave}>
          {t('yiqidong.save')}
        </button>
      </div>
    </div>
  )
}
