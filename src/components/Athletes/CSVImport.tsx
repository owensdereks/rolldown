import { useState, useRef, useCallback } from 'react'
import Papa from 'papaparse'
import { useAuth } from '../../contexts/AuthContext'
import { createAthlete, createContactLog, enrollAthleteInRace } from '../../services/api'
import Button from '../ui/Button'
import Badge from '../ui/Badge'

interface CSVImportProps {
  onCancel: () => void
  onDone: () => void
}

interface ParsedRow {
  rowNumber: number
  name: string
  email: string
  phone: string
  coaching_start_date: string
  last_contact_date: string
  race_name: string
  race_date: string
  status: 'valid' | 'error' | 'warning'
  message: string
}

const TEMPLATE_HEADERS = [
  'name',
  'email',
  'phone',
  'coaching_start_date',
  'last_contact_date',
  'race_name',
  'race_date',
]

const TEMPLATE_ROWS = [
  'Jane Smith,jane@email.com,555-0101,2025-01-15,2026-03-15,70.3 Boulder,2026-07-12',
  'Mike Johnson,mike@email.com,,2026-01-01,,,,',
]

function isValidDate(str: string): boolean {
  if (!str) return false
  const d = new Date(str)
  return !isNaN(d.getTime()) && /^\d{4}-\d{2}-\d{2}$/.test(str.trim())
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0]
}

export default function CSVImport({ onCancel, onDone }: CSVImportProps) {
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)
  const [rows, setRows] = useState<ParsedRow[] | null>(null)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{
    imported: number
    skipped: number
  } | null>(null)

  const downloadTemplate = () => {
    const csv = [TEMPLATE_HEADERS.join(','), ...TEMPLATE_ROWS].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'rolldown_roster_template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const processFile = useCallback((file: File) => {
    setParseError(null)
    setRows(null)
    setImportResult(null)

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete(results) {
        const headers = results.meta.fields ?? []
        if (!headers.map((h) => h.toLowerCase().trim()).includes('name')) {
          setParseError("CSV must include a 'name' column.")
          return
        }

        const parsed: ParsedRow[] = []
        const namesSeen = new Map<string, number>()

        for (let i = 0; i < results.data.length; i++) {
          const raw = results.data[i] as Record<string, string>
          const row: ParsedRow = {
            rowNumber: i + 1,
            name: (raw['name'] ?? '').trim(),
            email: (raw['email'] ?? '').trim(),
            phone: (raw['phone'] ?? '').trim(),
            coaching_start_date: (raw['coaching_start_date'] ?? '').trim(),
            last_contact_date: (raw['last_contact_date'] ?? '').trim(),
            race_name: (raw['race_name'] ?? '').trim(),
            race_date: (raw['race_date'] ?? '').trim(),
            status: 'valid',
            message: '',
          }

          if (!row.name) {
            row.status = 'error'
            row.message = 'Name is required'
            parsed.push(row)
            continue
          }
          if (row.coaching_start_date && !isValidDate(row.coaching_start_date)) {
            row.status = 'error'
            row.message = 'Invalid coaching start date (use YYYY-MM-DD)'
            parsed.push(row)
            continue
          }
          if (row.last_contact_date && !isValidDate(row.last_contact_date)) {
            row.status = 'error'
            row.message = 'Invalid last contact date (use YYYY-MM-DD)'
            parsed.push(row)
            continue
          }
          if (row.race_date && !isValidDate(row.race_date)) {
            row.status = 'error'
            row.message = 'Invalid race date (use YYYY-MM-DD)'
            parsed.push(row)
            continue
          }
          if (row.race_name && !row.race_date) {
            row.status = 'error'
            row.message = 'Both race name and date are required'
            parsed.push(row)
            continue
          }
          if (row.race_date && !row.race_name) {
            row.status = 'error'
            row.message = 'Both race name and date are required'
            parsed.push(row)
            continue
          }

          const nameLower = row.name.toLowerCase()
          if (namesSeen.has(nameLower)) {
            row.status = 'warning'
            row.message = `Duplicate name (same as row ${namesSeen.get(nameLower)})`
          }
          namesSeen.set(nameLower, row.rowNumber)
          parsed.push(row)
        }

        setRows(parsed)
      },
      error() {
        setParseError('Failed to parse CSV file.')
      },
    })
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file && file.name.endsWith('.csv')) processFile(file)
    else setParseError('Please upload a .csv file.')
  }

  const handleImport = async () => {
    if (!rows || !user) return
    setImporting(true)

    const validRows = rows.filter((r) => r.status !== 'error')
    let imported = 0
    let skipped = 0

    for (const row of validRows) {
      try {
        const athlete = await createAthlete({
          coach_id: user.id,
          name: row.name,
          email: row.email || null,
          phone: row.phone || null,
          notes: null,
          coaching_start_date: row.coaching_start_date || todayStr(),
        })

        const contactDate = row.last_contact_date || todayStr()
        await createContactLog({
          athlete_id: athlete.id,
          coach_id: user.id,
          contact_type: 'other',
          notes: 'Imported via CSV',
          contacted_at: contactDate,
        })

        if (row.race_name && row.race_date) {
          await enrollAthleteInRace(user.id, athlete.id, row.race_name, row.race_date)
        }

        imported++
      } catch (err) {
        console.error(`Failed to import row ${row.rowNumber}:`, err)
        skipped++
      }
    }

    const errorRows = rows.filter((r) => r.status === 'error').length
    setImportResult({ imported, skipped: skipped + errorRows })
    setImporting(false)
  }

  // ── Import result ──

  if (importResult) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-surface border border-border rounded-2xl p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-signal-green/10 border border-signal-green/20 flex items-center justify-center mx-auto mb-5">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-signal-green"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="font-display font-black text-2xl text-ink uppercase tracking-widest mb-2">
            Import Complete
          </h2>
          <p className="text-sm text-ink-dim mb-6 leading-relaxed">
            Successfully imported {importResult.imported} athlete
            {importResult.imported !== 1 ? 's' : ''}.
            {importResult.skipped > 0 &&
              ` ${importResult.skipped} row${importResult.skipped !== 1 ? 's' : ''} skipped.`}
          </p>
          <Button onClick={onDone}>Done</Button>
        </div>
      </div>
    )
  }

  // ── Preview table ──

  if (rows) {
    const validCount = rows.filter((r) => r.status !== 'error').length
    const errorCount = rows.filter((r) => r.status === 'error').length
    const warningCount = rows.filter((r) => r.status === 'warning').length

    return (
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="font-mono text-[10px] text-ink-muted uppercase tracking-widest mb-0.5">
              CSV Import
            </p>
            <h2 className="font-display font-black text-3xl text-ink uppercase tracking-wide">
              Preview
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={onCancel}>
              Cancel
            </Button>
            <Button onClick={handleImport} disabled={validCount === 0 || importing}>
              {importing ? 'Importing...' : `Import ${validCount}`}
            </Button>
          </div>
        </div>

        <p className="font-mono text-[10px] text-ink-muted uppercase tracking-widest mb-4">
          {validCount} ready
          {errorCount > 0 && ` · ${errorCount} error${errorCount !== 1 ? 's' : ''}`}
          {warningCount > 0 && ` · ${warningCount} warning${warningCount !== 1 ? 's' : ''}`}
        </p>

        <div className="bg-surface border border-border rounded-2xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {['Row', 'Name', 'Email', 'Phone', 'Start Date', 'Last Contact', 'Race', 'Status'].map(
                  (h) => (
                    <th
                      key={h}
                      className="text-left py-3 px-4 font-mono text-[10px] text-ink-muted uppercase tracking-widest whitespace-nowrap"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.rowNumber}
                  className="border-b border-border/50 last:border-0 hover:bg-elevated/50 transition-colors"
                >
                  <td className="py-3 px-4 font-mono text-xs text-ink-muted">{row.rowNumber}</td>
                  <td className="py-3 px-4 font-medium text-ink">{row.name || '—'}</td>
                  <td className="py-3 px-4 text-ink-dim">{row.email || '—'}</td>
                  <td className="py-3 px-4 text-ink-dim">{row.phone || '—'}</td>
                  <td className="py-3 px-4 font-mono text-xs text-ink-dim">
                    {row.coaching_start_date || '(today)'}
                  </td>
                  <td className="py-3 px-4 font-mono text-xs text-ink-dim">
                    {row.last_contact_date || '(today)'}
                  </td>
                  <td className="py-3 px-4 text-ink-dim">
                    {row.race_name ? `${row.race_name} (${row.race_date})` : '—'}
                  </td>
                  <td className="py-3 px-4">
                    {row.status === 'valid' && (
                      <span className="text-signal-green text-base leading-none">✓</span>
                    )}
                    {row.status === 'error' && (
                      <span className="flex items-center gap-1.5">
                        <span className="text-signal-red text-base leading-none">✗</span>
                        <Badge variant="red">{row.message}</Badge>
                      </span>
                    )}
                    {row.status === 'warning' && (
                      <span className="flex items-center gap-1.5">
                        <span className="text-signal-amber text-base leading-none">⚠</span>
                        <Badge variant="amber">{row.message}</Badge>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  // ── Upload screen ──

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="font-mono text-[10px] text-ink-muted uppercase tracking-widest mb-0.5">
            CSV Import
          </p>
          <h2 className="font-display font-black text-3xl text-ink uppercase tracking-wide">
            Import Athletes
          </h2>
        </div>
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>

      <div className="bg-surface border border-border rounded-2xl p-6 mb-4">
        <p className="font-mono text-[10px] text-ink-muted uppercase tracking-widest mb-2">
          Step 1
        </p>
        <h3 className="text-sm font-semibold text-ink mb-2">Download Template</h3>
        <p className="text-sm text-ink-dim mb-4 leading-relaxed">
          Start with our template — it includes the required columns and example rows showing the
          expected format.
        </p>
        <Button variant="secondary" onClick={downloadTemplate}>
          Download Template
        </Button>
      </div>

      <div className="bg-surface border border-border rounded-2xl p-6">
        <p className="font-mono text-[10px] text-ink-muted uppercase tracking-widest mb-2">
          Step 2
        </p>
        <h3 className="text-sm font-semibold text-ink mb-2">Upload Your Roster</h3>
        <p className="text-sm text-ink-dim mb-4 leading-relaxed">
          Fill in the template with your athletes and upload it here.
        </p>

        <div
          className={`border-2 border-dashed rounded-xl p-10 text-center transition-all duration-200 cursor-pointer ${
            dragOver
              ? 'border-accent/50 bg-accent/5'
              : 'border-border hover:border-ink-muted/50 hover:bg-elevated/50'
          }`}
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className={`mb-3 transition-colors ${dragOver ? 'text-accent' : 'text-ink-muted'}`}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 mx-auto"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>
          <p className="text-sm text-ink-dim mb-1">
            Drag and drop your CSV here, or{' '}
            <span className="text-accent">browse</span>
          </p>
          <p className="font-mono text-[10px] text-ink-muted uppercase tracking-widest">
            Only .csv files accepted
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>

        {parseError && (
          <p className="mt-3 font-mono text-[10px] text-signal-red">{parseError}</p>
        )}
      </div>
    </div>
  )
}
