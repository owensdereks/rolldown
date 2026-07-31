import { supabase } from '../lib/supabase'
import { calculatePriority, comparePriority } from '../lib/priority'
import { localDateKey } from '../lib/dates'
import type {
  Athlete,
  AthleteWithPriority,
  Coach,
  ContactLog,
  Race,
  RaceWithAthletes,
} from '../types'

type RaceRow = Race & {
  athlete_race_entries: Array<{
    athlete_id: string
    athletes: Athlete | null
  }>
}

function mapRaceRows(data: unknown): RaceWithAthletes[] {
  const rows = (data ?? []) as RaceRow[]
  return rows.map(({ athlete_race_entries, ...race }) => ({
    ...race,
    athletes: athlete_race_entries
      .map((entry) => entry.athletes)
      .filter((athlete): athlete is Athlete => athlete !== null),
  }))
}

// ── Athletes ──

export async function getAthletes(coachId: string): Promise<AthleteWithPriority[]> {
  const now = new Date()
  const today = localDateKey(now)

  // Fetch active athletes
  const { data: athletes, error: athletesErr } = await supabase
    .from('athletes')
    .select('*')
    .eq('coach_id', coachId)
    .eq('status', 'active')

  if (athletesErr) throw athletesErr
  if (!athletes || athletes.length === 0) return []

  const athleteIds = athletes.map((a) => a.id)

  // Fetch latest contact log per athlete
  const { data: contacts, error: contactsErr } = await supabase
    .from('contact_logs')
    .select('*')
    .in('athlete_id', athleteIds)
    .in('contact_type', ['text', 'call', 'video', 'other', 'unknown'])
    .order('contacted_at', { ascending: false })

  if (contactsErr) throw contactsErr

  // Fetch upcoming races via join table (within 14-day window)
  const fourteenDaysOut = new Date()
  fourteenDaysOut.setDate(fourteenDaysOut.getDate() + 14)
  const cutoff = localDateKey(fourteenDaysOut)

  const { data: raceEntries, error: raceEntriesError } = await supabase
    .from('athlete_race_entries')
    .select('athlete_id, races(*)')
    .in('athlete_id', athleteIds)
    .gte('races.date', today)
    .lte('races.date', cutoff)
    .order('races(date)', { ascending: true })

  if (raceEntriesError) throw raceEntriesError

  // Build maps
  const latestContactMap = new Map<string, ContactLog>()
  for (const c of contacts ?? []) {
    if (!latestContactMap.has(c.athlete_id)) {
      latestContactMap.set(c.athlete_id, c as ContactLog)
    }
  }

  const result: AthleteWithPriority[] = athletes.map((athlete) => {
    const lastContact = latestContactMap.get(athlete.id)
    const priority = calculatePriority({
      coachingStartDate: athlete.coaching_start_date,
      lastContactAt: lastContact?.contacted_at ?? null,
      now,
    })

    const upcoming_race =
      raceEntries
        ?.filter(e => e.athlete_id === athlete.id && e.races)
        .map(e => e.races as unknown as Race)
        .sort((a, b) => a.date.localeCompare(b.date))[0] ?? null

    return {
      ...athlete,
      days_since_last_contact: priority.daysSinceLastContact,
      last_contact_at: lastContact?.contacted_at ?? null,
      severity: priority.severity,
      is_new_athlete: priority.isNewAthlete,
      upcoming_race,
    }
  })

  // Sort by days since last contact descending (most neglected first)
  result.sort(comparePriority)

  return result
}

export async function getAthlete(athleteId: string): Promise<Athlete> {
  const { data, error } = await supabase
    .from('athletes')
    .select('*')
    .eq('id', athleteId)
    .single()

  if (error) throw error
  return data as Athlete
}

export async function createAthlete(
  data: Pick<Athlete, 'coach_id' | 'name' | 'email' | 'phone' | 'notes' | 'coaching_start_date'>
): Promise<Athlete> {
  const { data: athlete, error } = await supabase
    .from('athletes')
    .insert(data)
    .select()
    .single()

  if (error) throw error
  return athlete as Athlete
}

export async function updateAthlete(
  athleteId: string,
  data: Partial<Pick<Athlete, 'name' | 'email' | 'phone' | 'notes' | 'coaching_start_date'>>
): Promise<Athlete> {
  const { data: athlete, error } = await supabase
    .from('athletes')
    .update(data)
    .eq('id', athleteId)
    .select()
    .single()

  if (error) throw error
  return athlete as Athlete
}

export async function archiveAthlete(athleteId: string): Promise<Athlete> {
  const { data, error } = await supabase
    .from('athletes')
    .update({ status: 'archived' })
    .eq('id', athleteId)
    .select()
    .single()

  if (error) throw error
  return data as Athlete
}

// ── Races ──

// Get all races for a coach, with their enrolled athletes
// Used for race feed, race pages, and calendar
export async function getRaces(coachId: string): Promise<RaceWithAthletes[]> {
  const { data, error } = await supabase
    .from('races')
    .select(`
      *,
      athlete_race_entries (
        athlete_id,
        athletes (*)
      )
    `)
    .eq('coach_id', coachId)
    .gte('date', localDateKey())
    .order('date', { ascending: true })

  if (error) throw error

  return mapRaceRows(data)
}

// Get all races for a single athlete
export async function getAthleteRaces(athleteId: string): Promise<Race[]> {
  const { data, error } = await supabase
    .from('athlete_race_entries')
    .select('races(*)')
    .eq('athlete_id', athleteId)
    .gte('races.date', localDateKey())
    .order('races(date)', { ascending: true })

  if (error) throw error
  const rows = (data ?? []) as unknown as Array<{ races: Race | null }>
  return rows.map((entry) => entry.races).filter((race): race is Race => race !== null)
}

// Create a race (or find existing) and enroll an athlete
export async function enrollAthleteInRace(
  coachId: string,
  athleteId: string,
  raceName: string,
  raceDate: string,
  options?: { location?: string; distance?: string }
): Promise<Race> {
  // Upsert the race
  const { data: race, error: raceError } = await supabase
    .from('races')
    .upsert(
      { coach_id: coachId, name: raceName, date: raceDate, ...options },
      { onConflict: 'coach_id,name,date' }
    )
    .select()
    .single()

  if (raceError) throw raceError

  // Enroll the athlete
  const { error: entryError } = await supabase
    .from('athlete_race_entries')
    .upsert(
      { athlete_id: athleteId, race_id: race.id },
      { onConflict: 'athlete_id,race_id' }
    )

  if (entryError) throw entryError
  return race
}

// Remove an athlete from a race
export async function removeAthleteFromRace(
  athleteId: string,
  raceId: string
): Promise<void> {
  const { error } = await supabase
    .from('athlete_race_entries')
    .delete()
    .eq('athlete_id', athleteId)
    .eq('race_id', raceId)

  if (error) throw error
}

// Get races for a coach within the next N days (default 30)
export async function getUpcomingRaces(
  coachId: string,
  days: number = 30
): Promise<RaceWithAthletes[]> {
  const today = localDateKey()
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() + days)
  const cutoffStr = localDateKey(cutoff)

  const { data, error } = await supabase
    .from('races')
    .select(`
      *,
      athlete_race_entries (
        athlete_id,
        athletes (*)
      )
    `)
    .eq('coach_id', coachId)
    .gte('date', today)
    .lte('date', cutoffStr)
    .order('date', { ascending: true })

  if (error) throw error

  return mapRaceRows(data)
}

// ── Contact Logs ──

export async function getContactLogs(athleteId: string): Promise<ContactLog[]> {
  const { data, error } = await supabase
    .from('contact_logs')
    .select('*')
    .eq('athlete_id', athleteId)
    .order('contacted_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as ContactLog[]
}

export async function createContactLog(
  data: Pick<ContactLog, 'athlete_id' | 'coach_id' | 'contact_type' | 'notes'> & { contacted_at?: string }
): Promise<ContactLog> {
  const { data: log, error } = await supabase
    .from('contact_logs')
    .insert(data)
    .select()
    .single()

  if (error) throw error
  return log as ContactLog
}

export async function deleteContactLog(contactLogId: string): Promise<void> {
  const { error } = await supabase
    .from('contact_logs')
    .delete()
    .eq('id', contactLogId)

  if (error) throw error
}

// ── Coach ──

export async function getCoach(): Promise<Coach> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('coaches')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) throw error
  return data as Coach
}

export async function updateCoach(
  data: Pick<Coach, 'name'>
): Promise<Coach> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: coach, error } = await supabase
    .from('coaches')
    .update(data)
    .eq('id', user.id)
    .select()
    .single()

  if (error) throw error
  return coach as Coach
}
