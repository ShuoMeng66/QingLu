import { useState } from 'react'
import { useI18n } from '../hooks/useI18n'
import type { ConnectionStatus, OpenClawConfig, OpenClawModel } from '../types/openclaw'
import { DEFAULT_CONFIG } from '../types/openclaw'

const BAILIAN_MODEL_PRESETS = ['deepseek-v4-flash', 'deepseek-v4-pro', 'qwen-plus'] as const

interface SettingsPanelProps {
  config: OpenClawConfig
  activeConfig: OpenClawConfig
  status: ConnectionStatus
  statusMessage: string
  models: OpenClawModel[]
  showAdvanced: boolean
  onChange: (next: OpenClawConfig) => void
  onTest: () => void
  onSave: () => void
  onReset: () => void
}

function maskToken(token: string, notConfigured: string): string {
  if (!token.trim()) return notConfigured
  if (token.length <= 8) return '••••••••'
  return `${token.slice(0, 4)}••••${token.slice(-4)}`
}

export function SettingsPanel({
  config,
  activeConfig,
  status,
  statusMessage,
  models,
  showAdvanced,
  onChange,
  onTest,
  onSave,
  onReset,
}: SettingsPanelProps) {
  const { t } = useI18n()

  return (
    <section className="bento-grid bento-grid--settings">
      <article className="bento-card bento-card--hero">
        <div>
          <p className="bento-card__label">{t('settings.dev.connectionLabel')}</p>
          <h2>{status === 'connected' ? t('settings.dev.ready') : t('settings.dev.waiting')}</h2>
        </div>
        <div className={`status-pill status-pill--${status}`}>
          {status === 'checking' && t('settings.dev.checking')}
          {status === 'connected' && t('settings.dev.connected')}
          {status === 'error' && t('settings.dev.error')}
          {status === 'idle' && t('settings.dev.idle')}
        </div>
      </article>

      <article className="bento-card bento-card--actions">
        {statusMessage && (
          <p className={`setup-message setup-message--${status}`}>{statusMessage}</p>
        )}
        <div className="setup-actions">
          <button type="button" className="btn btn--ghost pressable" onClick={onTest}>
            {t('settings.dev.testConnection')}
          </button>
          {showAdvanced && (
            <>
              <button type="button" className="btn btn--ghost pressable" onClick={onReset}>
                {t('settings.dev.reset')}
              </button>
              <button type="button" className="btn btn--primary pressable" onClick={onSave}>
                {t('settings.dev.save')}
              </button>
            </>
          )}
        </div>
      </article>

      {showAdvanced && (
        <>
          <article className="bento-card">
            <p className="bento-card__label">{t('settings.dev.activeConfig')}</p>
            <strong className="bento-card__value">{activeConfig.baseUrl}</strong>
            <span className="muted">{t('settings.dev.model')} · {activeConfig.agent}</span>
            <span className="muted">{t('settings.dev.token')} · {maskToken(activeConfig.token, t('settings.dev.notConfigured'))}</span>
          </article>

          <article className="bento-card">
            <p className="bento-card__label">{t('settings.dev.defaultConfig')}</p>
            <strong className="bento-card__value">{DEFAULT_CONFIG.baseUrl}</strong>
            <span className="muted">{t('settings.dev.model')} · {DEFAULT_CONFIG.agent}</span>
            <span className="muted">{t('settings.dev.token')} · {maskToken(DEFAULT_CONFIG.token, t('settings.dev.notConfigured'))}</span>
          </article>

          <article className="bento-card bento-card--wide">
            <div className="bento-fields">
              <label className="field">
                <span>{t('settings.dev.apiBaseUrl')}</span>
                <input
                  value={config.baseUrl}
                  onChange={(event) => onChange({ ...config, baseUrl: event.target.value })}
                  placeholder={DEFAULT_CONFIG.baseUrl}
                />
              </label>

              <label className="field">
                <span>{t('settings.dev.accessKey')}</span>
                <input
                  type="password"
                  value={config.token}
                  onChange={(event) => onChange({ ...config, token: event.target.value })}
                  placeholder="Access Token"
                />
              </label>
            </div>
          </article>

          <article className="bento-card">
            <label className="field">
              <span>{t('settings.dev.modelId')}</span>
              <input
                value={config.agent}
                onChange={(event) => onChange({ ...config, agent: event.target.value })}
                placeholder={DEFAULT_CONFIG.agent}
              />
            </label>

            <div className="model-list">
              <span className="model-list__label">百炼常用模型</span>
              <div className="model-list__items">
                {BAILIAN_MODEL_PRESETS.map((modelId) => (
                  <button
                    key={modelId}
                    type="button"
                    className={`model-chip pressable ${config.agent === modelId ? 'model-chip--active' : ''}`}
                    onClick={() => onChange({ ...config, agent: modelId })}
                  >
                    {modelId}
                  </button>
                ))}
              </div>
            </div>

            {models.length > 0 && (
              <div className="model-list">
                <span className="model-list__label">{t('settings.dev.availableModels')}</span>
                <div className="model-list__items">
                  {models.map((model) => (
                    <button
                      key={model.id}
                      type="button"
                      className={`model-chip pressable ${config.agent === model.id ? 'model-chip--active' : ''}`}
                      onClick={() => onChange({ ...config, agent: model.id })}
                    >
                      {model.id}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </article>
        </>
      )}
    </section>
  )
}

export const ADVANCED_SETTINGS_COMMANDS = ['#开发者', '开发者模式'] as const

export function useAdvancedSettingsUnlock() {
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [commandInput, setCommandInput] = useState('')

  const tryUnlock = (value: string) => {
    const normalized = value.trim()
    if (ADVANCED_SETTINGS_COMMANDS.includes(normalized as (typeof ADVANCED_SETTINGS_COMMANDS)[number])) {
      setShowAdvanced(true)
      setCommandInput('')
      return true
    }
    return false
  }

  return {
    showAdvanced,
    commandInput,
    setCommandInput,
    tryUnlock,
  }
}
