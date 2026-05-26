/** 封面装饰 — 绿色藤蔓轨迹与运动浮动要素 */
export function CoverMotionDecor() {
  return (
    <div className="cover-motion-decor" aria-hidden="true">
      <svg className="cover-motion-decor__vine" viewBox="0 0 800 200" preserveAspectRatio="none">
        <path
          d="M0,120 C120,40 200,160 320,80 S520,140 640,60 S760,100 800,90"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        />
      </svg>

      <span className="cover-motion-decor__float cover-motion-decor__float--1">🏃</span>
      <span className="cover-motion-decor__float cover-motion-decor__float--2">💪</span>
      <span className="cover-motion-decor__float cover-motion-decor__float--3">🧘</span>
      <span className="cover-motion-decor__leaf cover-motion-decor__leaf--1" />
      <span className="cover-motion-decor__leaf cover-motion-decor__leaf--2" />
    </div>
  )
}
