import { describeYiqidongConfig, type YiqidongConfig } from '../../lib/yiqidong'
import { SIDEBAR } from '../../copy/ui'
import './YiqidongEntryButton.css'

interface YiqidongEntryButtonProps {
  config: YiqidongConfig
  unread: number
  onOpenSettings: () => void
}

export function YiqidongEntryButton({ config, unread, onOpenSettings }: YiqidongEntryButtonProps) {
  const summary = describeYiqidongConfig(config)

  return (
    <button
      type="button"
      className="yiqidong-header-entry pressable"
      aria-label={`${SIDEBAR.yiqidong}设置`}
      title={summary}
      onClick={onOpenSettings}
    >
      <span className="yiqidong-header-entry__icon" aria-hidden="true">
        动
      </span>
      <span className="yiqidong-header-entry__text">
        <strong>{SIDEBAR.yiqidong}</strong>
        <span>{summary}</span>
      </span>
      {unread > 0 && (
        <span className="yiqidong-header-entry__badge" aria-label={`${unread} 封未读`}>
          {unread}
        </span>
      )}
    </button>
  )
}
