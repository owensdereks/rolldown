import type { ButtonHTMLAttributes } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'danger'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-bg font-semibold hover:brightness-110 active:scale-[0.98]',
  secondary: 'bg-elevated border border-border text-ink hover:border-white/20 hover:bg-white/5',
  danger: 'bg-signal-red/10 border border-signal-red/25 text-signal-red hover:bg-signal-red/20',
}

export default function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      className={`rounded-lg px-4 py-2 text-sm transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed ${variantStyles[variant]} ${className}`}
      {...props}
    />
  )
}
