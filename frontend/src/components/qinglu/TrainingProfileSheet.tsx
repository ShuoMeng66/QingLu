import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useI18n } from '../../hooks/useI18n'
import { HealthProfileForm } from './HealthProfileForm'

interface TrainingProfileSheetProps {
  open: boolean
  onClose: () => void
}

export function TrainingProfileSheet({ open, onClose }: TrainingProfileSheetProps) {
  const { t } = useI18n()

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            className="fixed inset-0 z-50 bg-emerald-950/10 backdrop-blur-sm dark:bg-black/40"
            aria-label={t('action.close')}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-sheet-title"
            className="fixed inset-x-0 bottom-0 z-[60] flex max-h-[90dvh] w-full flex-col rounded-t-[32px] glass-panel shadow-glass backdrop-blur-2xl"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          >
            <div className="relative flex shrink-0 flex-col items-center pt-3 pb-2">
              <div className="h-1 w-10 rounded-full bg-slate-300/80" aria-hidden="true" />
              <button
                type="button"
                className="absolute right-4 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/60 text-slate-500 backdrop-blur-md dark:bg-slate-800/80"
                aria-label={t('action.close')}
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-8">
              <h2 id="profile-sheet-title" className="mb-1 text-lg font-semibold text-slate-800">
                {t('profile.title')}
              </h2>
              <p className="mb-3 text-xs leading-relaxed text-slate-500">{t('profile.hint')}</p>
              <HealthProfileForm reloadWhen={open} onSaveSuccess={() => onClose()} />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
