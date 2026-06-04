import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { usePreferences } from '../../context/PreferencesContext'
import { loadTodaySnapshot, saveTodaySnapshot, type TodaySnapshot } from '../../lib/todaySnapshot'

interface TodayStatusSheetProps {
  open: boolean
  onClose: () => void
}

export function TodayStatusSheet({ open, onClose }: TodayStatusSheetProps) {
  const { t } = usePreferences()
  const [draft, setDraft] = useState<TodaySnapshot>(() => loadTodaySnapshot())

  useEffect(() => {
    if (open) setDraft(loadTodaySnapshot())
  }, [open])

  const handleSave = () => {
    saveTodaySnapshot({
      ...draft,
      remaining_kcal: draft.remaining_kcal != null ? Number(draft.remaining_kcal) : undefined,
    })
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-x-0 bottom-0 z-50 max-h-[85dvh] overflow-y-auto rounded-t-[28px] bg-white px-5 pb-8 pt-4 shadow-2xl"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-body-primary">{t('today.editTitle')}</h2>
              <button type="button" className="rounded-full p-2 hover:bg-black/5" onClick={onClose}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <label className="block text-sm">
                <span className="text-body-secondary">{t('today.fieldRemaining')}</span>
                <input
                  type="number"
                  className="mt-1 w-full rounded-xl border border-lime-200 px-3 py-2"
                  value={draft.remaining_kcal ?? ''}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      remaining_kcal: e.target.value ? Number(e.target.value) : undefined,
                    }))
                  }
                />
              </label>
              <label className="block text-sm">
                <span className="text-body-secondary">{t('today.fieldTraining')}</span>
                <input
                  className="mt-1 w-full rounded-xl border border-lime-200 px-3 py-2"
                  value={draft.training_plan ?? ''}
                  onChange={(e) => setDraft((d) => ({ ...d, training_plan: e.target.value }))}
                />
              </label>
              <label className="block text-sm">
                <span className="text-body-secondary">{t('today.fieldLocation')}</span>
                <input
                  className="mt-1 w-full rounded-xl border border-lime-200 px-3 py-2"
                  value={draft.location_label ?? ''}
                  onChange={(e) => setDraft((d) => ({ ...d, location_label: e.target.value }))}
                />
              </label>
              <label className="block text-sm">
                <span className="text-body-secondary">{t('today.fieldBody')}</span>
                <input
                  className="mt-1 w-full rounded-xl border border-lime-200 px-3 py-2"
                  value={draft.body_status ?? ''}
                  onChange={(e) => setDraft((d) => ({ ...d, body_status: e.target.value }))}
                />
              </label>
              <label className="block text-sm">
                <span className="text-body-secondary">{t('today.fieldSpecial')}</span>
                <input
                  className="mt-1 w-full rounded-xl border border-lime-200 px-3 py-2"
                  value={draft.special_note ?? ''}
                  onChange={(e) => setDraft((d) => ({ ...d, special_note: e.target.value }))}
                />
              </label>
            </div>
            <button type="button" className="btn-vitality mt-6 w-full rounded-full py-3 font-semibold" onClick={handleSave}>
              {t('today.save')}
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
