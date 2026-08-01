interface LogoProps {
  reversed?: boolean
  compact?: boolean
  className?: string
}

export default function Logo({ reversed = false, compact = false, className = '' }: LogoProps) {
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <img
        src={reversed ? '/brand-mark-reversed.svg' : '/brand-mark.svg'}
        alt=""
        className={compact ? 'h-8 w-8' : 'h-9 w-9'}
      />
      {!compact && (
        <span className={`text-[22px] font-bold tracking-[-0.055em] ${reversed ? 'text-[#F5F1E8]' : 'text-ink'}`}>
          rolldown
        </span>
      )}
    </div>
  )
}
