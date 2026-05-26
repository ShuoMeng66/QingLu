import './AuroraBackground.css'

/** 可爱 Pastel 背景 — Clay / PostHog 灵感 */
export function AuroraBackground() {
  return (
    <div className="editorial-canvas" aria-hidden="true">
      <div className="editorial-canvas__base" />
      <div className="editorial-canvas__grain" />
      <div className="editorial-canvas__blob editorial-canvas__blob--pink" />
      <div className="editorial-canvas__blob editorial-canvas__blob--mint" />
      <div className="editorial-canvas__blob editorial-canvas__blob--lemon" />
    </div>
  )
}
