import { FileUp, Plus, UsersRound } from 'lucide-react'
import Button from '../ui/Button'

interface OnboardingScreenProps {
  onAddAthlete: () => void
  onImportRoster: () => void
}

export default function OnboardingScreen({
  onAddAthlete,
  onImportRoster,
}: OnboardingScreenProps) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.08] bg-elevated text-accent">
          <UsersRound aria-hidden="true" size={25} strokeWidth={1.6} />
        </div>
        <h2 className="mb-2 text-2xl font-semibold tracking-[-0.03em] text-ink">
          Build your athlete roster
        </h2>
        <p className="mb-8 text-[15px] leading-relaxed text-ink-dim">
          Add your athletes to start tracking engagement and prioritizing follow-ups.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button onClick={onAddAthlete} icon={<Plus aria-hidden="true" size={17} />}>
            Add first athlete
          </Button>
          <Button variant="secondary" onClick={onImportRoster} icon={<FileUp aria-hidden="true" size={16} />}>
            Import roster
          </Button>
        </div>
      </div>
    </div>
  )
}
