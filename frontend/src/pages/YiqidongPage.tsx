import { YiqidongIntroTip } from '../components/YiqidongIntroTip'
import { YiqidongSettingsForm } from '../components/YiqidongSettingsForm'
import { YIQIDONG } from '../copy/ui'
import type { YiqidongConfig } from '../lib/yiqidong'

interface YiqidongPageProps {
  onApply: (config: YiqidongConfig) => void
  onClose: () => void
}

export function YiqidongPage({ onApply, onClose }: YiqidongPageProps) {
  return (
    <div className="settings-stage">
      <header className="settings-topbar">
        <div className="settings-topbar__intro">
          <p className="eyebrow">{YIQIDONG.eyebrow}</p>
          <h1 className="settings-topbar__title">{YIQIDONG.title}</h1>
        </div>
        <button
          type="button"
          className="settings-close pressable"
          aria-label={`${YIQIDONG.back}一起动`}
          onClick={onClose}
        >
          <span className="settings-close__icon">×</span>
          {YIQIDONG.back}
        </button>
      </header>

      <div className="settings-scroll">
        <YiqidongIntroTip />
        <YiqidongSettingsForm onApply={onApply} />
      </div>
    </div>
  )
}
