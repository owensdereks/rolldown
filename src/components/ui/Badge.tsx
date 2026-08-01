import type { ReactNode } from 'react'

type BadgeVariant = 'red' | 'amber' | 'emerald' | 'race'

interface BadgeProps {
  variant: BadgeVariant
  children: ReactNode
}

const variantStyles: Record<BadgeVariant, string> = {
  red: 'bg-signal-red/10 text-signal-red border border-signal-red/15',
  amber: 'bg-signal-amber/10 text-signal-amber border border-signal-amber/15',
  emerald: 'bg-signal-green/10 text-signal-green border border-signal-green/15',
  race: 'bg-elevated/70 text-ink-dim border border-border',
}

export default function Badge({ variant, children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium leading-none ${variantStyles[variant]}`}
    >
      {children}
    </span>
  )
}
