import type { ReactNode } from 'react'
import Button from './Button'

interface EmptyStateProps {
  icon?: ReactNode
  heading: string
  description: string
  actionLabel?: string
  onAction?: () => void
}

export default function EmptyState({
  icon,
  heading,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="px-5 py-14 text-center">
      {icon && <div className="mx-auto mb-5 text-ink-muted">{icon}</div>}
      <h3 className="mb-2 text-lg font-semibold tracking-[-0.02em] text-ink">{heading}</h3>
      <p className="mx-auto mb-6 max-w-sm text-sm leading-relaxed text-ink-dim">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button onClick={onAction}>{actionLabel}</Button>
      )}
    </div>
  )
}
