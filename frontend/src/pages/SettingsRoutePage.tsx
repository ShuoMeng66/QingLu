import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { SettingsPanel, useAdvancedSettingsUnlock } from '../components/SettingsPanel'
import { SETTINGS, TOAST } from '../copy/ui'
import { useOptionalAppContext } from '../context/AppContext'
import { useToast } from '../context/ToastContext'

export function SettingsRoutePage() {
  const navigate = useNavigate()
  const { toast } = useToast()
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
  } = useOptionalAppContext() ?? {
    draftConfig: { baseUrl: '', token: '', agent: '' },
    config: { baseUrl: '', token: '', agent: '' },
    status: 'idle' as const,
    statusMessage: '',
    models: [],
    setDraftConfig: () => {},
    syncDraftFromActive: () => {},
    handleSaveSettings: () => {},
    handleResetSettings: () => {},
    handleTestSettings: async () => {},
  }

  const { showAdvanced, commandInput, setCommandInput, tryUnlock } = useAdvancedSettingsUnlock()

  useEffect(() => {
    syncDraftFromActive()
  }, [syncDraftFromActive])

  return (
    <div className="page page--settings">
      <header className="page-header">
        <div>
          <p className="eyebrow">{SETTINGS.eyebrow}</p>
          <h1 className="page-header__title">{SETTINGS.title}</h1>
        </div>
        <button
          type="button"
          className="settings-close pressable"
          aria-label={SETTINGS.close}
          onClick={() => navigate('/')}
        >
          <span className="settings-close__icon">×</span>
          {SETTINGS.close}
        </button>
      </header>

      <div className="settings-scroll">
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

        {!showAdvanced && (
          <div className="settings-unlock">
            <label className="settings-unlock__field">
              <input
                value={commandInput}
                placeholder={SETTINGS.developerPlaceholder}
                aria-label={SETTINGS.developerAria}
                onChange={(event) => setCommandInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && tryUnlock(commandInput)) {
                    toast(TOAST.developerUnlocked, 'success')
                  }
                }}
              />
            </label>
          </div>
        )}
      </div>
    </div>
  )
}
