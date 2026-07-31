export interface Coach {
  id: string
  email: string
  name: string
  created_at: string
}

export interface Athlete {
  id: string
  coach_id: string
  name: string
  email: string | null
  phone: string | null
  coaching_start_date: string
  notes: string | null
  status: 'active' | 'archived'
  created_at: string
}

export interface Race {
  id: string
  coach_id: string
  name: string
  date: string        // DATE — 'YYYY-MM-DD'
  location: string | null
  distance: string | null
  created_at: string
}

export interface AthleteRaceEntry {
  id: string
  athlete_id: string
  race_id: string
  created_at: string
}

// Used when displaying a race with its athlete list
export interface RaceWithAthletes extends Race {
  athletes: Athlete[]
}

// Used when displaying an athlete with their races
export interface AthleteWithRaces extends Athlete {
  races: Race[]
}

export interface ContactLog {
  id: string
  athlete_id: string
  coach_id: string
  contacted_at: string
  contact_type: 'text' | 'call' | 'video'
  notes: string | null
  created_at: string
}

export interface AthleteWithPriority extends Athlete {
  days_since_last_contact: number | null
  last_contact_at: string | null
  severity: 'green' | 'yellow' | 'red'
  is_new_athlete: boolean
  upcoming_race: Race | null   // nearest future race, any horizon
}
