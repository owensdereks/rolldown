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
          className="block font-mono text-[10px] text-ink-muted uppercase tracking-widest mb-1.5"
        >
          {label}
        </label>
      )}
      <input
        id={id}
        className={`w-full bg-elevated border rounded-lg px-3 py-2 text-sm text-ink placeholder-ink-muted focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-colors ${
          error ? 'border-signal-red/50 bg-signal-red/5' : 'border-border hover:border-ink-muted/50'
        } ${className}`}
        {...props}
      />
      {error && <p className="mt-1.5 font-mono text-[10px] text-signal-red">{error}</p>}
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
          className="block font-mono text-[10px] text-ink-muted uppercase tracking-widest mb-1.5"
        >
          {label}
        </label>
      )}
      <textarea
        id={id}
        className={`w-full bg-elevated border rounded-lg px-3 py-2 text-sm text-ink placeholder-ink-muted focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-colors resize-none ${
          error ? 'border-signal-red/50 bg-signal-red/5' : 'border-border hover:border-ink-muted/50'
        } ${className}`}
        {...props}
      />
      {error && <p className="mt-1.5 font-mono text-[10px] text-signal-red">{error}</p>}
    </div>
  )
}
