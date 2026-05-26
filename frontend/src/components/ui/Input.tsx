import type { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: string
}

export function Input({ label, hint, className = '', id, ...props }: InputProps) {
  const inputId = id ?? label?.replace(/\s+/g, '-').toLowerCase()

  return (
    <label className={`organic-field ${className}`.trim()} htmlFor={inputId}>
      {label && <span className="organic-field__label">{label}</span>}
      <input id={inputId} className="organic-field__input" {...props} />
      {hint && <span className="organic-field__hint">{hint}</span>}
    </label>
  )
}
