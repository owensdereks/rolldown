import type { ReactNode } from 'react'

type BadgeVariant = 'red' | 'amber' | 'emerald' | 'race'

interface BadgeProps {
  variant: BadgeVariant
  children: ReactNode
}

const variantStyles: Record<BadgeVariant, string> = {
  red: 'bg-signal-red/10 text-signal-red border border-signal-red/25',
  amber: 'bg-signal-amber/10 text-signal-amber border border-signal-amber/25',
  emerald: 'bg-signal-green/10 text-signal-green border border-signal-green/25',
  race: 'bg-signal-purple/10 text-signal-purple border border-signal-purple/25',
}

export default function Badge({ variant, children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variantStyles[variant]}`}
    >
      {children}
    </span>
  )
}
