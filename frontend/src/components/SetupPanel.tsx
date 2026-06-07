import type { ConnectionStatus, OpenClawConfig, OpenClawModel } from '../types/openclaw'

interface SetupPanelProps {
  config: OpenClawConfig
  status: ConnectionStatus
  statusMessage: string
  models: OpenClawModel[]
  onChange: (next: OpenClawConfig) => void
  onTest: () => void
  onSave: () => void
}

export function SetupPanel({
  config,
  status,
  statusMessage,
  models,
  onChange,
  onTest,
  onSave,
}: SetupPanelProps) {
  return (
    <section className="setup-panel">
      <div className="setup-panel__header">
        <div>
          <p className="eyebrow">OpenClaw 接入</p>
          <h2>连接你的本地 Agent</h2>
          <p className="muted">
            通过 Gateway 的 OpenAI 兼容接口接入轻鹭。默认代理到{' '}
            <code>/openclaw-api/v1</code>，避免浏览器跨域问题。
          </p>
        </div>
        <div className={`status-pill status-pill--${status}`}>
          {status === 'checking' && '检测中'}
          {status === 'connected' && '已连接'}
          {status === 'error' && '连接失败'}
          {status === 'idle' && '未检测'}
        </div>
      </div>

      <div className="setup-grid">
        <label className="field">
          <span>Gateway 地址</span>
          <input
            value={config.baseUrl}
            onChange={(event) => onChange({ ...config, baseUrl: event.target.value })}
            placeholder="/openclaw-api/v1"
          />
        </label>

        <label className="field">
          <span>Gateway Token</span>
          <input
            type="password"
            value={config.token}
            onChange={(event) => onChange({ ...config, token: event.target.value })}
            placeholder="openclaw.json 中的 gateway.auth.token"
          />
          {!config.token.trim() && (
            <span className="field-hint field-hint--warn">
              当前未填写 Token，连接会返回 401 Unauthorized
            </span>
          )}
        </label>

        <label className="field field--full">
          <span>Agent 目标</span>
          <input
            value={config.agent}
            onChange={(event) => onChange({ ...config, agent: event.target.value })}
            placeholder="openclaw/qinglu-dev"
          />
        </label>
      </div>

      {models.length > 0 && (
        <div className="model-list">
          <span className="model-list__label">可用 Agent</span>
          <div className="model-list__items">
            {models.map((model) => (
              <button
                key={model.id}
                type="button"
                className={`model-chip ${config.agent === model.id ? 'model-chip--active' : ''}`}
                onClick={() => onChange({ ...config, agent: model.id })}
              >
                {model.id}
              </button>
            ))}
          </div>
        </div>
      )}

      {statusMessage && <p className={`setup-message setup-message--${status}`}>{statusMessage}</p>}

      <div className="setup-actions">
        <button type="button" className="btn btn--ghost" onClick={onTest}>
          测试连接
        </button>
        <button type="button" className="btn btn--primary" onClick={onSave}>
          保存配置
        </button>
      </div>

      <details className="setup-help">
        <summary>首次接入 checklist</summary>
        <ol>
          <li>
            在 OpenClaw 配置目录的 <code>openclaw.json</code> 中启用{' '}
            <code>gateway.http.endpoints.chatCompletions.enabled</code>
          </li>
          <li>运行 <code>openclaw gateway</code>，确认 Gateway 端口可用</li>
          <li>将 Gateway Token 填入上方输入框并测试连接</li>
          <li>选择 <code>openclaw/qinglu-dev</code> 或你的 Agent 目标后开始对话</li>
        </ol>
      </details>
    </section>
  )
}
