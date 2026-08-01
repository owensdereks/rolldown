import type { ButtonHTMLAttributes, ReactNode } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'danger'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  icon?: ReactNode
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-white border border-transparent font-semibold shadow-[0_1px_2px_rgba(24,35,29,0.14)] hover:bg-accent-dark active:translate-y-px',
  secondary: 'bg-surface border border-border text-ink-dim hover:text-ink hover:border-ink/25 hover:bg-elevated/55',
  danger: 'bg-signal-red/10 border border-signal-red/20 text-signal-red hover:bg-signal-red/15',
}

export default function Button({
  variant = 'primary',
  className = '',
  icon,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-[10px] px-4 py-2 text-sm transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-40 ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {icon}
      {children}
    </button>
  )
}
