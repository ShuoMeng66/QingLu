export interface TagOption {
  value: string
  label: string
}

interface TagCloudProps {
  options: TagOption[]
  selected: string[]
  onChange: (next: string[]) => void
  multiple?: boolean
}

export function TagCloud({
  options,
  selected,
  onChange,
  multiple = true,
}: TagCloudProps) {
  const toggle = (value: string) => {
    if (multiple) {
      onChange(
        selected.includes(value)
          ? selected.filter((item) => item !== value)
          : [...selected, value],
      )
      return
    }
    onChange(selected.includes(value) ? [] : [value])
  }

  return (
    <div className="flex flex-wrap gap-2" role="group">
      {options.map((option) => {
        const active = selected.includes(option.value)
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              active ? 'btn-vitality' : 'btn-glass text-slate-500'
            }`}
            onClick={() => toggle(option.value)}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
