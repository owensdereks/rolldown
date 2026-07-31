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
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-sm">
        <div className="w-20 h-20 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-6">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-9 w-9 text-accent"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.25}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        </div>
        <h2 className="font-display font-black text-3xl text-ink uppercase tracking-widest mb-2">
          Your Roster Awaits
        </h2>
        <p className="text-sm text-ink-dim mb-8 leading-relaxed">
          Add your athletes to start tracking engagement and prioritizing follow-ups.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button onClick={onAddAthlete}>Add First Athlete</Button>
          <Button variant="secondary" onClick={onImportRoster}>
            Import Roster
          </Button>
        </div>
      </div>
    </div>
  )
}
