import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useState } from 'react'
import { YiqidongSettingsForm } from '../YiqidongSettingsForm'
import type { YiqidongConfig } from '../../lib/yiqidong'
import {
  getYiqidongLetters,
  markLetterRead,
  formatLetterSalutation,
  type YiqidongLetter,
} from '../../lib/yiqidongEnvelopes'
import { useI18n } from '../../hooks/useI18n'

type EnvelopeTab = 'inbox' | 'settings'

interface EnvelopeModalProps {
  onApply: (config: YiqidongConfig) => void
  onClose: () => void
  initialTab?: EnvelopeTab
  initialLetterId?: string | null
}

export function EnvelopeModal({
  onApply,
  onClose,
  initialTab = 'settings',
  initialLetterId = null,
}: EnvelopeModalProps) {
  const { t } = useI18n()
  const [tab, setTab] = useState<EnvelopeTab>(initialTab)
  const [letters, setLetters] = useState<YiqidongLetter[]>(() => getYiqidongLetters())
  const [activeId, setActiveId] = useState<string | null>(() => initialLetterId ?? letters[0]?.id ?? null)

  const activeLetter = letters.find((letter) => letter.id === activeId) ?? null

  const openLetter = (letter: YiqidongLetter) => {
    setActiveId(letter.id)
    if (!letter.read) {
      setLetters(markLetterRead(letter.id))
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4"
        role="dialog"
        aria-modal="true"
        aria-label={t('yiqidong.modalAria')}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <button
          type="button"
          className="absolute inset-0 bg-emerald-950/15 backdrop-blur-sm"
          aria-label={t('action.close')}
          onClick={onClose}
        />

        <motion.div
          className="relative z-10 flex max-h-[90dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-[28px] glass-panel shadow-glass backdrop-blur-2xl sm:rounded-[28px]"
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        >
          <div className="flex shrink-0 items-center justify-between border-b border-white/60 px-5 py-4">
            <h2 className="text-lg font-semibold text-slate-800">{t('yiqidong.title')}</h2>
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/60 text-slate-500"
              aria-label={t('action.close')}
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex shrink-0 gap-2 px-5 pt-3">
            {(['settings', 'inbox'] as const).map((id) => (
              <button
                key={id}
                type="button"
                className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                  tab === id ? 'btn-vitality' : 'bg-white/60 text-slate-500'
                }`}
                onClick={() => setTab(id)}
              >
                {t(id === 'settings' ? 'yiqidong.settingsTab' : 'yiqidong.inbox')}
              </button>
            ))}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            {tab === 'inbox' ? (
              <div className="flex flex-col gap-4 sm:grid sm:grid-cols-[minmax(0,140px)_1fr]">
                <ul className="m-0 max-h-36 list-none overflow-y-auto border-b border-white/60 p-0 sm:max-h-none sm:border-b-0 sm:border-r sm:pr-3">
                  {letters.length === 0 ? (
                    <li className="py-2 text-sm text-slate-500">{t('yiqidong.noLetters')}</li>
                  ) : (
                    letters.map((letter) => (
                      <li key={letter.id}>
                        <button
                          type="button"
                          className={`mb-1 w-full rounded-xl px-3 py-2 text-left transition ${
                            activeId === letter.id ? 'bg-white/80' : 'hover:bg-white/50'
                          } ${letter.read ? '' : 'font-semibold'}`}
                          onClick={() => openLetter(letter)}
                        >
                          <span className="block text-[10px] font-bold uppercase tracking-wide text-emerald-500">
                            {letter.kind === 'scheduled'
                              ? t('yiqidong.scheduledBadge')
                              : t('yiqidong.casualBadge')}
                          </span>
                          <span className="mt-0.5 block text-xs text-slate-600">{letter.title}</span>
                        </button>
                      </li>
                    ))
                  )}
                </ul>

                <article className="min-h-[120px]">
                  {activeLetter ? (
                    <>
                      <h3 className="text-base font-semibold text-slate-800">{activeLetter.title}</h3>
                      <p className="mt-2 text-sm text-slate-500">{formatLetterSalutation()}</p>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
                        {activeLetter.body}
                      </p>
                      <p className="mt-4 text-sm text-slate-500">{t('yiqidong.letterSignOff')}</p>
                    </>
                  ) : (
                    <p className="text-sm text-slate-500">{t('yiqidong.pickLetter')}</p>
                  )}
                </article>
              </div>
            ) : (
              <YiqidongSettingsForm
                onApply={(next) => {
                  onApply(next)
                  setLetters(getYiqidongLetters())
                }}
                onSaved={onClose}
              />
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
