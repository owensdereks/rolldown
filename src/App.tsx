import { useState, useEffect } from 'react'
import { useAuth } from './contexts/AuthContext'
import { getAthletes, getCoach } from './services/api'
import type { AthleteWithPriority, Coach } from './types'
import LoginPage from './components/Auth/LoginPage'
import AppShell from './components/Layout/AppShell'
import AddAthleteForm from './components/Athletes/AddAthleteForm'
import EditAthleteForm from './components/Athletes/EditAthleteForm'
import CSVImport from './components/Athletes/CSVImport'
import PriorityList from './components/Dashboard/PriorityList'

type View =
  | { page: 'main' }
  | { page: 'add-athlete' }
  | { page: 'edit-athlete'; athleteId: string }
  | { page: 'csv-import' }

function AuthenticatedApp() {
  const { user, signOut } = useAuth()
  const [view, setView] = useState<View>({ page: 'main' })
  const [athletes, setAthletes] = useState<AthleteWithPriority[]>([])
  const [coach, setCoach] = useState<Coach | null>(null)
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    if (!user) return
    const load = async () => {
      try {
        const [coachData, athleteData] = await Promise.all([
          getCoach(),
          getAthletes(user.id),
        ])
        setCoach(coachData)
        setAthletes(athleteData)
      } catch (err) {
        console.error('Failed to load data:', err)
      } finally {
        setLoadingData(false)
      }
    }
    load()
  }, [user])

  const refreshAthletes = async () => {
    if (!user) return
    try {
      const data = await getAthletes(user.id)
      setAthletes(data)
    } catch (err) {
      console.error('Failed to refresh athletes:', err)
    }
  }

  const handleSaved = async () => {
    await refreshAthletes()
    setView({ page: 'main' })
  }

  return (
    <AppShell
      coachName={coach?.name ?? user?.email ?? ''}
      onLogout={signOut}
    >
      {view.page === 'main' && (
        <PriorityList
          athletes={athletes}
          loading={loadingData}
          coachId={user!.id}
          onAddAthlete={() => setView({ page: 'add-athlete' })}
          onImportCSV={() => setView({ page: 'csv-import' })}
          onEditAthlete={(id) => setView({ page: 'edit-athlete', athleteId: id })}
          onRefresh={refreshAthletes}
        />
      )}

      {view.page === 'add-athlete' && (
        <AddAthleteForm
          onCancel={() => setView({ page: 'main' })}
          onSave={handleSaved}
        />
      )}

      {view.page === 'edit-athlete' && (
        <EditAthleteForm
          athleteId={view.athleteId}
          onCancel={() => setView({ page: 'main' })}
          onSave={handleSaved}
          onArchive={handleSaved}
        />
      )}

      {view.page === 'csv-import' && (
        <CSVImport
          onCancel={() => setView({ page: 'main' })}
          onDone={handleSaved}
        />
      )}
    </AppShell>
  )
}

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-sm text-slate-500">Loading...</p>
      </div>
    )
  }

  if (!user) {
    return <LoginPage />
  }

  return <AuthenticatedApp />
}

export default App
