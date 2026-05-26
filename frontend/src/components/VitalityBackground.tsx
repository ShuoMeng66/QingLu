import './VitalityBackground.css'

/** 晨光活力背景 — 青绿主色 + 浮动光斑 */
export function VitalityBackground() {
  return (
    <div className="vitality-canvas" aria-hidden="true">
      <div className="vitality-canvas__base" />
      <div className="vitality-canvas__blob vitality-canvas__blob--green" />
      <div className="vitality-canvas__blob vitality-canvas__blob--sky" />
      <div className="vitality-canvas__blob vitality-canvas__blob--orange" />
      <svg className="vitality-canvas__wave" viewBox="0 0 1440 48" preserveAspectRatio="none">
        <path d="M0,32 C360,8 720,48 1080,24 C1260,12 1380,36 1440,28 L1440,48 L0,48 Z" />
      </svg>
    </div>
  )
}
