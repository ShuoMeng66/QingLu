import { useEffect, useRef, useState } from 'react'
import {
  buildYiqidongPrompt,
  DEFAULT_YIQIDONG_CONFIG,
  describeYiqidongConfig,
  loadYiqidongConfig,
  REPEAT_OPTIONS,
  saveYiqidongConfig,
  WEEKDAY_OPTIONS,
  type YiqidongConfig,
  type YiqidongMode,
} from '../lib/yiqidong'

interface YiqidongLauncherProps {
  disabled?: boolean
  onApply: (config: YiqidongConfig, prompt: string) => void
}

export function YiqidongLauncher({ disabled, onApply }: YiqidongLauncherProps) {
  const [saved, setSaved] = useState<YiqidongConfig>(() => loadYiqidongConfig())
  const [draft, setDraft] = useState<YiqidongConfig>(() => loadYiqidongConfig())
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    if (open) {
      setDraft(loadYiqidongConfig())
    }
  }, [open])

  const setMode = (mode: YiqidongMode) => {
    setDraft((current) => ({ ...current, mode }))
  }

  const toggleDay = (day: string) => {
    setDraft((current) => {
      const days = current.schedule.days.includes(day)
        ? current.schedule.days.filter((item) => item !== day)
        : [...current.schedule.days, day]
      return {
        ...current,
        schedule: { ...current.schedule, days: days.length ? days : [day] },
      }
    })
  }

  const updateTime = (index: number, value: string) => {
    setDraft((current) => {
      const times = [...current.schedule.times]
      times[index] = value
      return { ...current, schedule: { ...current.schedule, times } }
    })
  }

  const addTime = () => {
    setDraft((current) => ({
      ...current,
      schedule: {
        ...current.schedule,
        times: [...current.schedule.times, '18:00'],
      },
    }))
  }

  const removeTime = (index: number) => {
    setDraft((current) => {
      if (current.schedule.times.length <= 1) return current
      return {
        ...current,
        schedule: {
          ...current.schedule,
          times: current.schedule.times.filter((_, i) => i !== index),
        },
      }
    })
  }

  const handleApply = () => {
    saveYiqidongConfig(draft)
    setSaved(draft)
    setOpen(false)
    onApply(draft, buildYiqidongPrompt(draft))
  }

  const handleReset = () => {
    setDraft({ ...DEFAULT_YIQIDONG_CONFIG })
  }

  const showDayPicker =
    draft.mode === 'scheduled' &&
    (draft.schedule.repeat === 'weekly' || draft.schedule.repeat === 'custom')

  return (
    <div className="yiqidong-launcher" ref={rootRef}>
      <button
        type="button"
        className={`yiqidong-launcher__trigger pressable ${saved.mode !== 'off' ? 'is-active' : ''}`}
        disabled={disabled}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="yiqidong-launcher__icon">动</span>
        <span className="yiqidong-launcher__text">
          <strong>一起动</strong>
          <span>{describeYiqidongConfig(saved)}</span>
        </span>
      </button>

      {open && (
        <div className="yiqidong-panel" role="dialog" aria-label="一起动设置">
          <div className="yiqidong-panel__header">
            <strong>一起动推送</strong>
            <span>自定义时间、周期与频率</span>
          </div>

          <div className="yiqidong-panel__modes">
            {([
              ['casual', '随心推', '天气合适时偶尔提醒'],
              ['scheduled', '固定提醒', '按你设定的时间与周期'],
              ['off', '关闭', '不再主动推送'],
            ] as const).map(([mode, title, hint]) => (
              <button
                key={mode}
                type="button"
                className={`yiqidong-panel__mode pressable ${draft.mode === mode ? 'is-selected' : ''}`}
                onClick={() => setMode(mode)}
              >
                <span>{title}</span>
                <small>{hint}</small>
              </button>
            ))}
          </div>

          {draft.mode === 'casual' && (
            <label className="yiqidong-panel__field">
              <span>每日最多推送</span>
              <select
                value={draft.casual.maxPerDay}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    casual: { maxPerDay: Number(event.target.value) },
                  }))
                }
              >
                <option value={1}>1 次</option>
                <option value={2}>2 次</option>
                <option value={3}>3 次</option>
              </select>
            </label>
          )}

          {draft.mode === 'scheduled' && (
            <div className="yiqidong-panel__schedule">
              <label className="yiqidong-panel__field">
                <span>重复周期</span>
                <select
                  value={draft.schedule.repeat}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      schedule: {
                        ...current.schedule,
                        repeat: event.target.value as YiqidongConfig['schedule']['repeat'],
                      },
                    }))
                  }
                >
                  {REPEAT_OPTIONS.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              {draft.schedule.repeat === 'interval' && (
                <label className="yiqidong-panel__field">
                  <span>间隔天数</span>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={draft.schedule.intervalDays}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        schedule: {
                          ...current.schedule,
                          intervalDays: Math.max(1, Number(event.target.value) || 1),
                        },
                      }))
                    }
                  />
                </label>
              )}

              {showDayPicker && (
                <div className="yiqidong-panel__days">
                  <span>选择星期</span>
                  <div className="yiqidong-panel__day-grid">
                    {WEEKDAY_OPTIONS.map((day) => (
                      <button
                        key={day.id}
                        type="button"
                        className={`yiqidong-panel__day pressable ${
                          draft.schedule.days.includes(day.id) ? 'is-selected' : ''
                        }`}
                        onClick={() => toggleDay(day.id)}
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="yiqidong-panel__times">
                <span>提醒时间</span>
                {draft.schedule.times.map((time, index) => (
                  <div key={`${time}-${index}`} className="yiqidong-panel__time-row">
                    <input
                      type="time"
                      value={time}
                      onChange={(event) => updateTime(index, event.target.value)}
                    />
                    {draft.schedule.times.length > 1 && (
                      <button
                        type="button"
                        className="yiqidong-panel__time-remove pressable"
                        onClick={() => removeTime(index)}
                      >
                        移除
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" className="yiqidong-panel__time-add pressable" onClick={addTime}>
                  + 添加时间
                </button>
              </div>
            </div>
          )}

          <div className="yiqidong-panel__preview">
            <span>预览</span>
            <p>{describeYiqidongConfig(draft)}</p>
          </div>

          <div className="yiqidong-panel__actions">
            <button type="button" className="btn btn--ghost pressable" onClick={handleReset}>
              恢复默认
            </button>
            <button type="button" className="btn btn--primary pressable" onClick={handleApply}>
              保存并同步
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
