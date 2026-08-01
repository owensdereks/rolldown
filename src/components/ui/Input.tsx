import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export function Input({
  label,
  error,
  className = '',
  id,
  ...props
}: InputProps) {
  return (
    <div>
      {label && (
        <label
          htmlFor={id}
          className="field-label mb-2 block"
        >
          {label}
        </label>
      )}
      <input
        id={id}
        className={`min-h-11 w-full rounded-[10px] border bg-elevated px-3.5 py-2.5 text-[15px] text-ink placeholder:text-ink-muted/70 transition-colors ${
          error ? 'border-signal-red/50 bg-signal-red/5' : 'border-border hover:border-ink/25 focus:border-accent/70'
        } ${className}`}
        {...props}
      />
      {error && <p className="mt-1.5 text-xs text-signal-red">{error}</p>}
    </div>
  )
}

export function Textarea({
  label,
  error,
  className = '',
  id,
  ...props
}: TextareaProps) {
  return (
    <div>
      {label && (
        <label
          htmlFor={id}
          className="field-label mb-2 block"
        >
          {label}
        </label>
      )}
      <textarea
        id={id}
        className={`w-full resize-none rounded-[10px] border bg-elevated px-3.5 py-2.5 text-[15px] leading-relaxed text-ink placeholder:text-ink-muted/70 transition-colors ${
          error ? 'border-signal-red/50 bg-signal-red/5' : 'border-border hover:border-ink/25 focus:border-accent/70'
        } ${className}`}
        {...props}
      />
      {error && <p className="mt-1.5 text-xs text-signal-red">{error}</p>}
    </div>
  )
}
