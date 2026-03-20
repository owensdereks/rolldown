import type { ReactNode } from 'react'

type BadgeVariant = 'red' | 'amber' | 'emerald' | 'race'

interface BadgeProps {
  variant: BadgeVariant
  children: ReactNode
}

const variantStyles: Record<BadgeVariant, string> = {
  red: 'bg-red-50 text-red-600 border border-red-200',
  amber: 'bg-amber-50 text-amber-700 border border-amber-200',
  emerald: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  race: 'bg-blue-50 text-blue-700 border border-blue-200',
}

export default function Badge({ variant, children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${variantStyles[variant]}`}
    >
      {children}
    </span>
  )
}
