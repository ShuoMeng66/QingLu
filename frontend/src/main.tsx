import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { applyTheme, loadAppPreferences } from './lib/appPreferences'
import { migrateBurnpalStorageKeys } from './lib/storageMigration'
import { loadEvolvedPromptPatch } from './lib/promptPreferences'
import { logEvalSnapshot } from './lib/evalLoop'
import './index.css'

migrateBurnpalStorageKeys()
applyTheme(loadAppPreferences().theme)

function Bootstrap() {
  useEffect(() => {
    void loadEvolvedPromptPatch()
    logEvalSnapshot('boot')
  }, [])
  return <App />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Bootstrap />
  </StrictMode>,
)
