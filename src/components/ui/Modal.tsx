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
      <div className="absolute inset-0 bg-black/70 backdrop-blur-[3px]" />
      <div
        className="relative mx-4 w-full max-w-md rounded-2xl border border-white/[0.09] bg-elevated p-6"
        style={{ boxShadow: 'var(--shadow-panel)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-white/[0.05] hover:text-ink"
          aria-label="Close"
        >
          <X aria-hidden="true" size={18} />
        </button>
        {children}
      </div>
    </div>
  )
}
