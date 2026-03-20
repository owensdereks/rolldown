import { useState, useRef, useCallback } from 'react'
import Papa from 'papaparse'
import { useAuth } from '../../contexts/AuthContext'
import { createAthlete, createContactLog, createRace } from '../../services/api'
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

  // ── Template download ──

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

  // ── CSV parsing & validation ──

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

          // Validate name
          if (!row.name) {
            row.status = 'error'
            row.message = 'Name is required'
            parsed.push(row)
            continue
          }

          // Validate dates
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

          // Validate race pairing
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

          // Duplicate detection
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

  // ── Import execution ──

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
          await createRace(athlete.id, {
            race_name: row.race_name,
            race_date: row.race_date,
          })
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

  // ── Render: Import result ──

  if (importResult) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
          <div className="mx-auto mb-4 text-emerald-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 mx-auto"
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
          <h2 className="text-lg font-semibold text-slate-800 mb-2">
            Import Complete
          </h2>
          <p className="text-sm text-slate-600 mb-6">
            Successfully imported {importResult.imported} athlete
            {importResult.imported !== 1 ? 's' : ''}.
            {importResult.skipped > 0 &&
              ` ${importResult.skipped} row${importResult.skipped !== 1 ? 's' : ''} skipped due to errors.`}
          </p>
          <Button onClick={onDone}>Done</Button>
        </div>
      </div>
    )
  }

  // ── Render: Preview table ──

  if (rows) {
    const validCount = rows.filter((r) => r.status !== 'error').length
    const errorCount = rows.filter((r) => r.status === 'error').length
    const warningCount = rows.filter((r) => r.status === 'warning').length

    return (
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-800">
            Import Preview
          </h2>
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={onCancel}>
              Cancel
            </Button>
            <Button onClick={handleImport} disabled={validCount === 0 || importing}>
              {importing ? 'Importing...' : 'Import'}
            </Button>
          </div>
        </div>

        <p className="text-sm text-slate-600 mb-4">
          {validCount} athlete{validCount !== 1 ? 's' : ''} ready to import
          {errorCount > 0 && `, ${errorCount} error${errorCount !== 1 ? 's' : ''}`}
          {warningCount > 0 && `, ${warningCount} warning${warningCount !== 1 ? 's' : ''}`}
        </p>

        <div className="bg-white rounded-lg border border-slate-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left py-2 px-3 text-xs text-slate-500 uppercase tracking-wide font-medium">
                  Row
                </th>
                <th className="text-left py-2 px-3 text-xs text-slate-500 uppercase tracking-wide font-medium">
                  Name
                </th>
                <th className="text-left py-2 px-3 text-xs text-slate-500 uppercase tracking-wide font-medium">
                  Email
                </th>
                <th className="text-left py-2 px-3 text-xs text-slate-500 uppercase tracking-wide font-medium">
                  Phone
                </th>
                <th className="text-left py-2 px-3 text-xs text-slate-500 uppercase tracking-wide font-medium">
                  Start Date
                </th>
                <th className="text-left py-2 px-3 text-xs text-slate-500 uppercase tracking-wide font-medium">
                  Last Contact
                </th>
                <th className="text-left py-2 px-3 text-xs text-slate-500 uppercase tracking-wide font-medium">
                  Race
                </th>
                <th className="text-left py-2 px-3 text-xs text-slate-500 uppercase tracking-wide font-medium">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => (
                <tr key={row.rowNumber} className="hover:bg-slate-50">
                  <td className="py-2 px-3 text-slate-600">{row.rowNumber}</td>
                  <td className="py-2 px-3 text-slate-800 font-medium">
                    {row.name || '—'}
                  </td>
                  <td className="py-2 px-3 text-slate-600">
                    {row.email || '—'}
                  </td>
                  <td className="py-2 px-3 text-slate-600">
                    {row.phone || '—'}
                  </td>
                  <td className="py-2 px-3 text-slate-600">
                    {row.coaching_start_date || '(today)'}
                  </td>
                  <td className="py-2 px-3 text-slate-600">
                    {row.last_contact_date || '(today)'}
                  </td>
                  <td className="py-2 px-3 text-slate-600">
                    {row.race_name
                      ? `${row.race_name} (${row.race_date})`
                      : '—'}
                  </td>
                  <td className="py-2 px-3">
                    {row.status === 'valid' && (
                      <span className="text-emerald-600" title="Valid">
                        &#10003;
                      </span>
                    )}
                    {row.status === 'error' && (
                      <span className="flex items-center gap-1">
                        <span className="text-red-500" title={row.message}>
                          &#10007;
                        </span>
                        <Badge variant="red">{row.message}</Badge>
                      </span>
                    )}
                    {row.status === 'warning' && (
                      <span className="flex items-center gap-1">
                        <span className="text-amber-500" title={row.message}>
                          &#9888;
                        </span>
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

  // ── Render: Upload / template screen ──

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-slate-800">
          Import Athletes from CSV
        </h2>
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-6 mb-6">
        <h3 className="text-sm font-medium text-slate-800 mb-2">
          1. Download Template
        </h3>
        <p className="text-sm text-slate-600 mb-4">
          Start with our CSV template — it includes the required columns and
          example rows showing the expected format.
        </p>
        <Button variant="secondary" onClick={downloadTemplate}>
          Download Template
        </Button>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h3 className="text-sm font-medium text-slate-800 mb-2">
          2. Upload Your Roster
        </h3>
        <p className="text-sm text-slate-600 mb-4">
          Fill in the template with your athletes and upload it here.
        </p>

        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
            dragOver
              ? 'border-blue-400 bg-blue-50'
              : 'border-slate-300 hover:border-slate-400'
          }`}
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="text-slate-400 mb-2">
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
          <p className="text-sm text-slate-600 mb-1">
            Drag and drop your CSV file here, or click to browse
          </p>
          <p className="text-xs text-slate-400">Only .csv files accepted</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>

        {parseError && (
          <p className="mt-3 text-sm text-red-500">{parseError}</p>
        )}
      </div>
    </div>
  )
}
