import { useCallback, useEffect, useState } from 'react'
import { testConnection } from '../lib/openclaw'
import { loadConfig, saveConfig } from '../lib/storage'
import type { ConnectionStatus, OpenClawConfig, OpenClawModel } from '../types/openclaw'
import { DEFAULT_CONFIG } from '../types/openclaw'

export function useOpenClawConfig(options?: { autoConnect?: boolean }) {
  const autoConnect = options?.autoConnect ?? true
  const [config, setConfig] = useState<OpenClawConfig>(() => loadConfig())
  const [draftConfig, setDraftConfig] = useState<OpenClawConfig>(() => loadConfig())
  const [status, setStatus] = useState<ConnectionStatus>(() =>
    autoConnect ? 'checking' : 'idle',
  )
  const [statusMessage, setStatusMessage] = useState('')
  const [models, setModels] = useState<OpenClawModel[]>([])

  const runConnectionTest = useCallback(async (nextConfig: OpenClawConfig) => {
    setStatus('checking')
    setStatusMessage('正在检查连接…')

    const result = await testConnection(nextConfig)
    setStatus(result.ok ? 'connected' : 'error')
    setStatusMessage(result.message)
    setModels(result.models)
    return result.ok
  }, [])

  useEffect(() => {
    if (!autoConnect) return
    void runConnectionTest(config)
  }, [autoConnect, config, runConnectionTest])

  useEffect(() => {
    if (!autoConnect) return

    const retry = () => {
      if (status === 'connected' || status === 'checking') return
      void runConnectionTest(config)
    }

    const onVisible = () => {
      if (document.visibilityState === 'visible') retry()
    }

    document.addEventListener('visibilitychange', onVisible)
    const timer = window.setInterval(retry, 60_000)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      window.clearInterval(timer)
    }
  }, [autoConnect, config, runConnectionTest, status])

  const handleSaveConfig = () => {
    saveConfig(draftConfig)
    setConfig(draftConfig)
  }

  const handleResetDraft = () => {
    setDraftConfig({ ...DEFAULT_CONFIG })
  }

  const syncDraftFromActive = () => {
    setDraftConfig({ ...config })
  }

  return {
    config,
    draftConfig,
    status,
    statusMessage,
    models,
    setDraftConfig,
    runConnectionTest,
    handleSaveConfig,
    handleResetDraft,
    syncDraftFromActive,
  }
}
