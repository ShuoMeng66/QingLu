import type { HTMLAttributes, ReactNode } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  hover?: boolean
  padding?: 'sm' | 'md' | 'lg'
}

const paddingClass = {
  sm: 'organic-card--sm',
  md: 'organic-card--md',
  lg: 'organic-card--lg',
}

export function Card({
  children,
  hover = false,
  padding = 'md',
  className = '',
  ...props
}: CardProps) {
  return (
    <div
      className={`organic-card ${paddingClass[padding]} ${hover ? 'organic-card--hover' : ''} ${className}`.trim()}
      {...props}
    >
      {children}
    </div>
  )
}
