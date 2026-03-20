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

export interface AthleteRace {
  id: string
  athlete_id: string
  race_name: string
  race_date: string
  created_at: string
}

export interface ContactLog {
  id: string
  athlete_id: string
  coach_id: string
  contacted_at: string
  contact_type: 'text' | 'email' | 'call' | 'other'
  notes: string | null
  created_at: string
}

export interface AthleteWithPriority extends Athlete {
  days_since_last_contact: number
  severity: 'green' | 'yellow' | 'red'
  is_new_athlete: boolean
  upcoming_race: AthleteRace | null
}
