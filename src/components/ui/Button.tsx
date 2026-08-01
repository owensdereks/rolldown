import type { ButtonHTMLAttributes, ReactNode } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'danger'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  icon?: ReactNode
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-[#0B0D10] border border-transparent font-semibold hover:bg-[#8CB3FF] active:bg-[#6D9CF3]',
  secondary: 'bg-elevated border border-white/[0.08] text-ink-dim hover:text-ink hover:border-white/[0.14] hover:bg-[#1D232B]',
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
