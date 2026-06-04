interface ActionTagsProps {
  tags: string[]
  className?: string
}

export function ActionTags({ tags, className = '' }: ActionTagsProps) {
  if (tags.length === 0) return null

  return (
    <ul className={`flex flex-wrap gap-1.5 ${className}`}>
      {tags.map((tag) => (
        <li key={tag} className="tag-vitality rounded-md px-2 py-1 text-xs font-medium">
          {tag}
        </li>
      ))}
    </ul>
  )
}
