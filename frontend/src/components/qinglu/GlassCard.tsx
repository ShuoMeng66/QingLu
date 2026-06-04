import type { ReactNode } from 'react'

interface GlassCardProps {
  icon: ReactNode
  label: string
  value: string
  meta?: string
}

export function GlassCard({ icon, label, value, meta }: GlassCardProps) {
  return (
    <article className="glass-panel flex min-w-0 flex-1 flex-col gap-1 rounded-[24px] p-3.5 transition-transform duration-300 hover:-translate-y-1">
      <div className="flex items-center gap-1.5 text-gray-600">
        <span className="flex h-5 w-5 shrink-0 items-center justify-center text-emerald-400">{icon}</span>
        <span className="truncate text-[11px] font-medium">{label}</span>
      </div>
      <p className="truncate text-sm font-semibold leading-snug text-[#1F2937]">{value}</p>
      {meta && <p className="truncate text-[11px] text-gray-600">{meta}</p>}
    </article>
  )
}
