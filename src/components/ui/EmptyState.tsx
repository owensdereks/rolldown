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
    <div className="text-center py-12 px-4">
      {icon && <div className="mx-auto mb-4 text-slate-300">{icon}</div>}
      <h3 className="text-lg font-semibold text-slate-800 mb-2">{heading}</h3>
      <p className="text-sm text-slate-600 mb-6 max-w-sm mx-auto">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button onClick={onAction}>{actionLabel}</Button>
      )}
    </div>
  )
}
