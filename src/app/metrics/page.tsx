'use client'

import { useState, useEffect } from 'react'
import { Plus, Check, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useMetrics, type Metric } from '@/hooks/useMetrics'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Button } from '@/components/ui/Button'

function fmt(n: number | null) {
  if (n == null) return '—'
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n}`
}

function fmtDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const COLS: { key: keyof Omit<Metric, 'id'>; label: string; prefix?: string }[] = [
  { key: 'date',                  label: 'Date' },
  { key: 'mrr',                   label: 'MRR',               prefix: '$' },
  { key: 'contracted_revenue',    label: 'Contracted Rev.',   prefix: '$' },
  { key: 'acv',                   label: 'ACV',               prefix: '$' },
  { key: 'total_rollover_volume', label: 'Total Rollover',    prefix: '$' },
  { key: 'total_clients',         label: 'Total Clients' },
  { key: 'new_clients',           label: 'New Clients' },
  { key: 'new_mrr',               label: 'New MRR',           prefix: '$' },
  { key: 'arr',                   label: 'ARR',               prefix: '$' },
]

type EditRow = Omit<Metric, 'id'>

const emptyRow = (): EditRow => ({
  date: '', mrr: null, contracted_revenue: null, acv: null,
  total_rollover_volume: null, total_clients: null, new_clients: null,
  new_mrr: null, arr: null,
})

function PasswordGate({ children }: { children: React.ReactNode }) {
  const [unlocked, setUnlocked] = useState(false)
  const [input, setInput] = useState('')
  const [error, setError] = useState(false)

  useEffect(() => {
    if (sessionStorage.getItem('metrics_unlocked') === '1') setUnlocked(true)
  }, [])

  if (unlocked) return <>{children}</>

  const attempt = () => {
    if (input === 'utopia') {
      sessionStorage.setItem('metrics_unlocked', '1')
      setUnlocked(true)
    } else {
      setError(true)
      setInput('')
    }
  }

  return (
    <div className="flex items-center justify-center h-full min-h-[60vh]">
      <div className="w-80 p-8 rounded-xl border border-gray-700 bg-gray-800/60 flex flex-col items-center gap-4">
        <div className="text-sm font-semibold text-gray-300 tracking-wide uppercase">Metrics — Restricted</div>
        <input
          type="password"
          value={input}
          onChange={(e) => { setInput(e.target.value); setError(false) }}
          onKeyDown={(e) => e.key === 'Enter' && attempt()}
          placeholder="Enter password"
          autoFocus
          className="w-full text-sm bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
        {error && <p className="text-xs text-rose-400">Incorrect password</p>}
        <button
          onClick={attempt}
          className="w-full py-2 rounded-md bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium transition-colors"
        >
          Unlock
        </button>
      </div>
    </div>
  )
}

export default function MetricsPage() {
  const { metrics, loading, refetch } = useMetrics()
  const [editId, setEditId] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<EditRow>(emptyRow())
  const [adding, setAdding] = useState(false)
  const [newRow, setNewRow] = useState<EditRow>(emptyRow())
  const [saving, setSaving] = useState(false)

  function startEdit(m: Metric) {
    setEditId(m.id)
    setEditValues({ date: m.date, mrr: m.mrr, contracted_revenue: m.contracted_revenue, acv: m.acv, total_rollover_volume: m.total_rollover_volume, total_clients: m.total_clients, new_clients: m.new_clients, new_mrr: m.new_mrr, arr: m.arr })
  }

  async function saveEdit() {
    if (!editId) return
    setSaving(true)
    await supabase.from('metrics').update(editValues).eq('id', editId)
    setSaving(false)
    setEditId(null)
    refetch()
  }

  async function saveNew() {
    if (!newRow.date) return
    setSaving(true)
    await supabase.from('metrics').insert(newRow)
    setSaving(false)
    setAdding(false)
    setNewRow(emptyRow())
    refetch()
  }

  async function deleteRow(id: string) {
    await supabase.from('metrics').delete().eq('id', id)
    refetch()
  }

  function cell(val: number | null, prefix?: string) {
    return val == null ? '—' : `${prefix ?? ''}${val.toLocaleString()}`
  }

  if (loading) return <LoadingSpinner />

  return (
    <PasswordGate>
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Metrics</h1>
          <p className="text-sm text-gray-400 mt-0.5">Monthly performance data — feeds directly into the dashboard</p>
        </div>
        <Button onClick={() => { setAdding(true); setNewRow(emptyRow()) }}>
          <Plus size={15} /> Add month
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              {COLS.map((c) => (
                <th key={c.key} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                  {c.label}
                </th>
              ))}
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {metrics.map((m) => (
              <tr key={m.id} className="hover:bg-gray-50/60 group">
                {editId === m.id ? (
                  <>
                    {COLS.map((c) => (
                      <td key={c.key} className="px-4 py-2">
                        <input
                          type={c.key === 'date' ? 'date' : 'number'}
                          value={editValues[c.key] ?? ''}
                          onChange={(e) => setEditValues((v) => ({ ...v, [c.key]: e.target.value === '' ? null : (c.key === 'date' ? e.target.value : Number(e.target.value)) }))}
                          className="w-full rounded border border-brand-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
                        />
                      </td>
                    ))}
                    <td className="px-4 py-2">
                      <div className="flex gap-1">
                        <button onClick={saveEdit} disabled={saving} className="text-emerald-600 hover:text-emerald-800 p-1"><Check size={14} /></button>
                        <button onClick={() => setEditId(null)} className="text-gray-400 hover:text-gray-600 p-1"><X size={14} /></button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{fmtDate(m.date)}</td>
                    <td className="px-4 py-3 text-gray-700">{cell(m.mrr, '$')}</td>
                    <td className="px-4 py-3 text-gray-700">{cell(m.contracted_revenue, '$')}</td>
                    <td className="px-4 py-3 text-gray-700">{cell(m.acv, '$')}</td>
                    <td className="px-4 py-3 text-gray-700">{cell(m.total_rollover_volume, '$')}</td>
                    <td className="px-4 py-3 text-gray-700">{m.total_clients ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-700">{m.new_clients ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-700">{cell(m.new_mrr, '$')}</td>
                    <td className="px-4 py-3 text-gray-700">{cell(m.arr, '$')}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => startEdit(m)} className="text-xs text-brand-500 hover:text-brand-700">Edit</button>
                        <button onClick={() => deleteRow(m.id)} className="text-xs text-red-400 hover:text-red-600">Delete</button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}

            {/* Add new row */}
            {adding && (
              <tr className="bg-brand-50/40">
                {COLS.map((c) => (
                  <td key={c.key} className="px-4 py-2">
                    <input
                      type={c.key === 'date' ? 'date' : 'number'}
                      value={newRow[c.key] ?? ''}
                      placeholder={c.key === 'date' ? 'Date' : '0'}
                      onChange={(e) => setNewRow((v) => ({ ...v, [c.key]: e.target.value === '' ? null : (c.key === 'date' ? e.target.value : Number(e.target.value)) }))}
                      className="w-full rounded border border-brand-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500 bg-white"
                    />
                  </td>
                ))}
                <td className="px-4 py-2">
                  <div className="flex gap-1">
                    <button onClick={saveNew} disabled={saving} className="text-emerald-600 hover:text-emerald-800 p-1"><Check size={14} /></button>
                    <button onClick={() => setAdding(false)} className="text-gray-400 hover:text-gray-600 p-1"><X size={14} /></button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
    </PasswordGate>
  )
}
