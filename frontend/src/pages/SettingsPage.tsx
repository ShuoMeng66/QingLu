import { useEffect } from 'react'
import { ArrowLeft, Moon, Sun, UserCircle } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { AppShell } from '../components/burnpal/AppShell'
import { PageTransition } from '../components/layout/PageTransition'
import { ToggleSwitch } from '../components/burnpal/ToggleSwitch'
import { SettingsPanel, useAdvancedSettingsUnlock } from '../components/SettingsPanel'
import { useAppContext } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { usePreferences } from '../context/PreferencesContext'
import { useToast } from '../context/ToastContext'
import { useUserLocation } from '../hooks/useUserLocation'
import { formatLocationLabel } from '../lib/citySkyline'
import { locationSourceLabel } from '../lib/i18n/chatCopy'
import type { AiDetail, AiTone, AppLocale, AppTheme } from '../lib/appPreferences'
import { saveUserProfile } from '../lib/userProfile'

const LOCALES: AppLocale[] = ['zh', 'en', 'ja', 'ko']
const TONES: AiTone[] = ['friendly', 'professional', 'coach']
const DETAILS: AiDetail[] = ['concise', 'balanced', 'detailed']

function OptionPills<T extends string>({
  options,
  value,
  label,
  onChange,
}: {
  options: { id: T; label: string }[]
  value: T
  label: string
  onChange: (next: T) => void
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium text-slate-500">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
              value === option.id ? 'btn-vitality' : 'bg-white/60 text-slate-500'
            }`}
            onClick={() => onChange(option.id)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export function SettingsPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { location, status: locationStatus, requestPermission } = useUserLocation()
  const {
    preferences,
    setTheme,
    setLocale,
    setAiPreferences,
    setMealReminders,
    setLocationShare,
    t,
  } = usePreferences()
  const {
    draftConfig,
    config,
    status,
    statusMessage,
    models,
    setDraftConfig,
    syncDraftFromActive,
    handleSaveSettings,
    handleResetSettings,
    handleTestSettings,
  } = useAppContext()
  const { user, syncing: authSyncing } = useAuth()

  const { showAdvanced, commandInput, setCommandInput, tryUnlock } = useAdvancedSettingsUnlock()

  useEffect(() => {
    syncDraftFromActive()
  }, [syncDraftFromActive])

  useEffect(() => {
    if (location && preferences.locationShare) {
      saveUserProfile({ location_city: location.city })
    }
  }, [location, preferences.locationShare])

  const toneOptions = TONES.map((id) => ({
    id,
    label: t(`tone.${id}` as Parameters<typeof t>[0]),
  }))
  const detailOptions = DETAILS.map((id) => ({
    id,
    label: t(`detail.${id}` as Parameters<typeof t>[0]),
  }))
  const localeOptions = LOCALES.map((id) => ({
    id,
    label: t(`lang.${id}` as Parameters<typeof t>[0]),
  }))

  return (
    <AppShell scrollable>
      <PageTransition className="mx-auto w-full max-w-2xl pb-8">
        <header className="flex items-center gap-3 px-5 py-4">
          <button
            type="button"
            className="glass-panel flex h-10 w-10 items-center justify-center rounded-full shadow-glass"
            aria-label={t('action.back')}
            onClick={() => navigate('/chat')}
          >
            <ArrowLeft className="h-5 w-5 text-slate-800" />
          </button>
          <h1 className="text-lg font-semibold text-slate-800">{t('settings.title')}</h1>
        </header>

        <div className="flex flex-col gap-4 px-5">
          <section className="glass-panel rounded-[24px] p-4 shadow-glass">
            <div className="mb-3 flex items-center gap-2">
              <UserCircle className="h-5 w-5 text-emerald-500" />
              <h2 className="text-sm font-semibold text-slate-800">{t('settings.account')}</h2>
            </div>
            {user ? (
              <>
                <p className="text-sm font-medium text-slate-800">{user.email}</p>
                <p className="mt-1 text-xs text-slate-500">{t('settings.accountHint')}</p>
                {authSyncing && (
                  <p className="mt-2 text-xs text-emerald-500">{t('settings.accountSyncing')}</p>
                )}
                <Link
                  to="/auth"
                  className="mt-4 inline-flex rounded-full border border-white/80 bg-white/60 px-4 py-2 text-sm font-semibold text-slate-700"
                >
                  {t('settings.accountManage')}
                </Link>
              </>
            ) : (
              <>
                <p className="text-xs leading-relaxed text-slate-500">{t('settings.accountHint')}</p>
                <Link to="/auth" className="btn-vitality mt-4 inline-flex rounded-full px-4 py-2 text-sm font-semibold">
                  {t('settings.accountLogin')}
                </Link>
              </>
            )}
          </section>

          <section className="glass-panel rounded-[24px] p-4 shadow-glass">
            <h2 className="mb-3 text-sm font-semibold text-slate-800">{t('settings.theme')}</h2>
            <div className="grid grid-cols-2 gap-2">
              {(['light', 'dark'] as AppTheme[]).map((theme) => (
                <button
                  key={theme}
                  type="button"
                  className={`flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                    preferences.theme === theme
                      ? 'btn-vitality'
                      : 'bg-white/60 text-slate-600'
                  }`}
                  onClick={() => setTheme(theme)}
                >
                  {theme === 'light' ? (
                    <Sun className="h-4 w-4" />
                  ) : (
                    <Moon className="h-4 w-4" />
                  )}
                  {theme === 'light' ? t('settings.themeLight') : t('settings.themeDark')}
                </button>
              ))}
            </div>
          </section>

          <section className="glass-panel rounded-[24px] p-4 shadow-glass">
            <h2 className="mb-3 text-sm font-semibold text-slate-800">{t('settings.language')}</h2>
            <OptionPills
              label=""
              options={localeOptions}
              value={preferences.locale}
              onChange={setLocale}
            />
          </section>

          <section className="glass-panel rounded-[24px] p-4 shadow-glass">
            <h2 className="mb-4 text-sm font-semibold text-slate-800">{t('settings.aiPrefs')}</h2>
            <div className="flex flex-col gap-4">
              <OptionPills
                label={t('settings.aiTone')}
                options={toneOptions}
                value={preferences.ai.tone}
                onChange={(tone) => setAiPreferences({ tone })}
              />
              <OptionPills
                label={t('settings.aiDetail')}
                options={detailOptions}
                value={preferences.ai.detail}
                onChange={(detail) => setAiPreferences({ detail })}
              />
              <ToggleSwitch
                label={t('settings.aiEmoji')}
                checked={preferences.ai.useEmoji}
                onChange={(useEmoji) => setAiPreferences({ useEmoji })}
              />
              <ToggleSwitch
                label={t('settings.aiNearby')}
                checked={preferences.ai.citeNearby}
                onChange={(citeNearby) => setAiPreferences({ citeNearby })}
              />
            </div>
          </section>

          <section className="glass-panel rounded-[24px] p-4 shadow-glass">
            <h2 className="mb-3 text-sm font-semibold text-slate-800">{t('settings.privacy')}</h2>
            <div className="mb-4 rounded-xl bg-white/50 px-3 py-2 text-xs text-slate-500 dark:bg-slate-800/50">
              {preferences.locationShare && location
                ? `${formatLocationLabel(location.city, location.region)} · ${locationSourceLabel(preferences.locale, location.source)}`
                : preferences.locationShare && locationStatus === 'loading'
                  ? '…'
                  : preferences.locationShare && locationStatus === 'denied'
                    ? t('settings.locationDenied')
                    : preferences.locationShare
                      ? t('settings.locationUnavailable')
                      : t('settings.locationOff')}
              {preferences.locationShare && locationStatus === 'denied' && (
                <button
                  type="button"
                  className="ml-2 font-semibold text-emerald-400"
                  onClick={() => void requestPermission()}
                >
                  {t('action.retry')}
                </button>
              )}
            </div>
            <div className="flex flex-col gap-4">
              <ToggleSwitch
                label={t('settings.mealReminders')}
                checked={preferences.mealReminders}
                onChange={setMealReminders}
              />
              <ToggleSwitch
                label={t('settings.location')}
                checked={preferences.locationShare}
                onChange={setLocationShare}
              />
            </div>
          </section>

          {showAdvanced ? (
            <section className="glass-panel rounded-[24px] p-4 shadow-glass">
              <SettingsPanel
                config={draftConfig}
                activeConfig={config}
                status={status}
                statusMessage={statusMessage}
                models={models}
                showAdvanced={showAdvanced}
                onChange={setDraftConfig}
                onTest={() => void handleTestSettings()}
                onSave={handleSaveSettings}
                onReset={handleResetSettings}
              />
            </section>
          ) : (
            <div className="glass-panel rounded-[24px] p-4 shadow-glass">
              <label className="flex flex-col gap-1 text-xs text-slate-500">
                {t('settings.developer')}
                <input
                  value={commandInput}
                  placeholder="…"
                  aria-label={t('settings.developerAria')}
                  className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-slate-800 outline-none focus:border-primary"
                  onChange={(event) => setCommandInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && tryUnlock(commandInput)) {
                      toast(t('toast.developerUnlocked'), 'success')
                    }
                  }}
                />
              </label>
            </div>
          )}
        </div>
      </PageTransition>
    </AppShell>
  )
}
