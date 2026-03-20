import { supabase } from '../lib/supabase'
import type {
  Athlete,
  AthleteRace,
  AthleteWithPriority,
  Coach,
  ContactLog,
} from '../types'

// ── Athletes ──

export async function getAthletes(coachId: string): Promise<AthleteWithPriority[]> {
  const now = new Date()
  const in14Days = new Date(now)
  in14Days.setDate(in14Days.getDate() + 14)

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
    .order('contacted_at', { ascending: false })

  if (contactsErr) throw contactsErr

  // Fetch upcoming races within 14 days
  const { data: races, error: racesErr } = await supabase
    .from('athlete_races')
    .select('*')
    .in('athlete_id', athleteIds)
    .gte('race_date', now.toISOString().split('T')[0])
    .lte('race_date', in14Days.toISOString().split('T')[0])
    .order('race_date', { ascending: true })

  if (racesErr) throw racesErr

  // Build maps
  const latestContactMap = new Map<string, ContactLog>()
  for (const c of contacts ?? []) {
    if (!latestContactMap.has(c.athlete_id)) {
      latestContactMap.set(c.athlete_id, c as ContactLog)
    }
  }

  const upcomingRaceMap = new Map<string, AthleteRace>()
  for (const r of races ?? []) {
    if (!upcomingRaceMap.has(r.athlete_id)) {
      upcomingRaceMap.set(r.athlete_id, r as AthleteRace)
    }
  }

  // Compute priority list
  const toUTCDateOnly = (d: Date) =>
    new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))

  const nowDateOnly = toUTCDateOnly(now)

  const result: AthleteWithPriority[] = athletes.map((athlete) => {
    const lastContact = latestContactMap.get(athlete.id)
    const refDate = lastContact
      ? new Date(lastContact.contacted_at)
      : new Date(athlete.created_at)
    const refDateOnly = toUTCDateOnly(refDate)
    const daysSince = Math.max(
      0,
      Math.floor(
        (nowDateOnly.getTime() - refDateOnly.getTime()) / (1000 * 60 * 60 * 24)
      )
    )

    const coachingStart = new Date(athlete.coaching_start_date)
    const daysSinceStart = Math.floor(
      (now.getTime() - coachingStart.getTime()) / (1000 * 60 * 60 * 24)
    )
    const isNew = daysSinceStart <= 90

    let severity: 'green' | 'yellow' | 'red'
    if (isNew) {
      // New athletes (≤90 days): green 0-1, yellow 2, red 3+
      if (daysSince <= 1) severity = 'green'
      else if (daysSince <= 2) severity = 'yellow'
      else severity = 'red'
    } else {
      // Tenured athletes (>90 days): green 0-4, yellow 5-6, red 7+
      if (daysSince <= 4) severity = 'green'
      else if (daysSince <= 6) severity = 'yellow'
      else severity = 'red'
    }

    return {
      ...athlete,
      days_since_last_contact: daysSince,
      severity,
      is_new_athlete: isNew,
      upcoming_race: upcomingRaceMap.get(athlete.id) ?? null,
    }
  })

  // Sort by days since last contact descending (most neglected first)
  result.sort((a, b) => b.days_since_last_contact - a.days_since_last_contact)

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

// ── Athlete Races (query) ──

export async function getAthleteRaces(athleteId: string): Promise<AthleteRace[]> {
  const now = new Date()
  const { data, error } = await supabase
    .from('athlete_races')
    .select('*')
    .eq('athlete_id', athleteId)
    .gte('race_date', now.toISOString().split('T')[0])
    .order('race_date', { ascending: true })

  if (error) throw error
  return (data ?? []) as AthleteRace[]
}

// ── Races ──

export async function createRace(
  athleteId: string,
  data: Pick<AthleteRace, 'race_name' | 'race_date'>
): Promise<AthleteRace> {
  const { data: race, error } = await supabase
    .from('athlete_races')
    .insert({ athlete_id: athleteId, ...data })
    .select()
    .single()

  if (error) throw error
  return race as AthleteRace
}

export async function updateRace(
  raceId: string,
  data: Partial<Pick<AthleteRace, 'race_name' | 'race_date'>>
): Promise<AthleteRace> {
  const { data: race, error } = await supabase
    .from('athlete_races')
    .update(data)
    .eq('id', raceId)
    .select()
    .single()

  if (error) throw error
  return race as AthleteRace
}

export async function deleteRace(raceId: string): Promise<void> {
  const { error } = await supabase
    .from('athlete_races')
    .delete()
    .eq('id', raceId)

  if (error) throw error
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
