import type { ReactNode } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  open: boolean
  onClose: () => void
  children: ReactNode
}

export default function Modal({ open, onClose, children }: ModalProps) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-ink/45 backdrop-blur-[2px]" />
      <div
        className="relative mx-4 w-full max-w-md rounded-2xl border border-border bg-surface p-6"
        style={{ boxShadow: 'var(--shadow-panel)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-elevated hover:text-ink"
          aria-label="Close"
        >
          <X aria-hidden="true" size={18} />
        </button>
        {children}
      </div>
    </div>
  )
}
