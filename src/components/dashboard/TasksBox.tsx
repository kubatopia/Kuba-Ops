'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Check, X, ExternalLink } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Client } from '@/lib/types'

interface Task {
  id: string
  title: string
  due_date: string | null
  priority: 'high' | 'medium' | 'low'
  assigned_to: string | null
  status: string
  client_id: string | null
  source: string | null
  source_file_url: string | null
  completed_at: string | null
  client?: { company: string | null; name: string }
}

type EditFields = { title: string; due_date: string; priority: Task['priority']; assigned_to: string; client_id: string }

interface TasksBoxProps {
  clients: Client[]
  profileName: string
}

const PRIORITY_ROW_COLORS = {
  high:   'border-rose-800 border',
  medium: 'border-amber-800 border',
  low:    'border-emerald-800 border',
}

const PRIORITY_ROW_STYLES: Record<string, React.CSSProperties> = {
  high:   { backgroundColor: 'rgba(127,29,29,0.25)' },
  medium: { backgroundColor: 'rgba(120,53,15,0.25)' },
  low:    { backgroundColor: 'rgba(6,78,59,0.25)' },
}

const PRIORITY_BADGE_COLORS = {
  high:   'bg-rose-900 text-rose-200',
  medium: 'bg-amber-900 text-amber-200',
  low:    'bg-emerald-900 text-emerald-200',
}

const PEOPLE = ['Finley Underwood', 'Nick King', 'Brady Weller', 'Lauren Prieur', 'Patrick Sanders', 'Drew Elliot']
const INPUT_CLS = 'w-full rounded border border-gray-200 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500 bg-white'

const SELECT_CLS = 'rounded-md border border-gray-200 px-2 py-1 text-xs bg-white text-gray-600 focus:outline-none focus:ring-1 focus:ring-brand-400'

export function TasksBox({ clients, profileName }: TasksBoxProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [completedTasks, setCompletedTasks] = useState<Task[]>([])
  const [showCompleted, setShowCompleted] = useState(false)
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [editFields, setEditFields] = useState<EditFields>({ title: '', due_date: '', priority: 'medium', assigned_to: '', client_id: '' })
  const [newTask, setNewTask] = useState<EditFields>({ title: '', due_date: '', priority: 'medium', assigned_to: profileName, client_id: '' })
  const [filterPriority, setFilterPriority] = useState<string>('')
  const [filterOwner, setFilterOwner] = useState<string>('')
  const [filterDate, setFilterDate] = useState<string>('')
  const [filterCompletedWithin, setFilterCompletedWithin] = useState<string>('month')

  const clientIds = clients.map((c) => c.id)

  const fetchTasks = useCallback(async () => {
    if (clientIds.length === 0) return
    const { data } = await supabase
      .from('tasks')
      .select('id, title, due_date, priority, assigned_to, status, source, source_file_url, completed_at, client_id, clients(name, company)')
      .in('client_id', clientIds)
      .or(`assigned_to.eq.${profileName},and(assigned_to.is.null,source.eq.manual)`)
      .neq('status', 'done')
      .order('due_date', { ascending: true, nullsFirst: false })
    setTasks((data ?? []).map((t: any) => ({ ...t, client: t.clients })))
  }, [clientIds.join(','), profileName])

  const fetchCompletedTasks = useCallback(async () => {
    if (clientIds.length === 0) return
    let query = supabase
      .from('tasks')
      .select('id, title, due_date, priority, assigned_to, status, source, source_file_url, completed_at, client_id, clients(name, company)')
      .in('client_id', clientIds)
      .or(`assigned_to.eq.${profileName},and(assigned_to.is.null,source.eq.manual)`)
      .eq('status', 'done')
      .order('completed_at', { ascending: false, nullsFirst: false })

    if (filterCompletedWithin === 'week') {
      const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      query = query.gte('completed_at', cutoff)
    } else if (filterCompletedWithin === 'month') {
      const cutoff = new Date(); cutoff.setMonth(cutoff.getMonth() - 1)
      query = query.gte('completed_at', cutoff.toISOString())
    } else if (filterCompletedWithin === 'quarter') {
      const cutoff = new Date(); cutoff.setMonth(cutoff.getMonth() - 3)
      query = query.gte('completed_at', cutoff.toISOString())
    }

    const { data } = await query
    setCompletedTasks((data ?? []).map((t: any) => ({ ...t, client: t.clients })))
  }, [clientIds.join(','), profileName, filterCompletedWithin])

  useEffect(() => { fetchTasks() }, [fetchTasks])
  useEffect(() => { if (showCompleted) fetchCompletedTasks() }, [showCompleted, fetchCompletedTasks])

  function startEdit(t: Task) {
    setEditId(t.id)
    setEditFields({ title: t.title, due_date: t.due_date ?? '', priority: t.priority, assigned_to: t.assigned_to ?? '', client_id: t.client_id ?? '' })
  }

  async function saveEdit() {
    if (!editId) return
    setSaving(true)
    await supabase.from('tasks').update({
      title: editFields.title.trim(),
      due_date: editFields.due_date || null,
      priority: editFields.priority,
      assigned_to: editFields.assigned_to || null,
      client_id: editFields.client_id || null,
    }).eq('id', editId)
    setSaving(false)
    setEditId(null)
    fetchTasks()
  }

  async function saveNew() {
    if (!newTask.title.trim()) return
    setSaving(true)
    await supabase.from('tasks').insert({
      title: newTask.title.trim(),
      due_date: newTask.due_date || null,
      priority: newTask.priority,
      assigned_to: newTask.assigned_to || null,
      client_id: newTask.client_id || null,
      status: 'not started',
    })
    setSaving(false)
    setAdding(false)
    setNewTask({ title: '', due_date: '', priority: 'medium', assigned_to: profileName, client_id: '' })
    fetchTasks()
  }

  async function completeTask(id: string) {
    await supabase.from('tasks').update({ status: 'done', completed_at: new Date().toISOString() }).eq('id', id)
    setTasks((t) => t.filter((x) => x.id !== id))
    if (showCompleted) fetchCompletedTasks()
  }

  async function reopenTask(id: string) {
    await supabase.from('tasks').update({ status: 'not started', completed_at: null }).eq('id', id)
    setCompletedTasks((t) => t.filter((x) => x.id !== id))
    fetchTasks()
  }

  async function deleteTask(id: string) {
    await supabase.from('tasks').delete().eq('id', id)
    setTasks((t) => t.filter((x) => x.id !== id))
    setCompletedTasks((t) => t.filter((x) => x.id !== id))
  }

  function TaskForm({ fields, onChange, onSave, onCancel }: {
    fields: EditFields; onChange: (f: EditFields) => void; onSave: () => void; onCancel: () => void
  }) {
    return (
      <div className="space-y-2">
        <input autoFocus placeholder="Task title" value={fields.title}
          onChange={(e) => onChange({ ...fields, title: e.target.value })}
          className={INPUT_CLS} />
        <div className="grid grid-cols-2 gap-2">
          <input type="date" value={fields.due_date}
            onChange={(e) => onChange({ ...fields, due_date: e.target.value })}
            className={INPUT_CLS} />
          <select value={fields.priority}
            onChange={(e) => onChange({ ...fields, priority: e.target.value as Task['priority'] })}
            className={INPUT_CLS}>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <select value={fields.assigned_to} onChange={(e) => onChange({ ...fields, assigned_to: e.target.value })} className={INPUT_CLS}>
            <option value="">— Owner —</option>
            {PEOPLE.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <select value={fields.client_id} onChange={(e) => onChange({ ...fields, client_id: e.target.value })} className={INPUT_CLS}>
            <option value="">— Client —</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.company || c.name}</option>)}
          </select>
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 p-1"><X size={14} /></button>
          <button onClick={onSave} disabled={saving} className="text-emerald-600 hover:text-emerald-800 p-1"><Check size={14} /></button>
        </div>
      </div>
    )
  }

  function TaskRow({ t, completed }: { t: Task; completed?: boolean }) {
    const badges = (
      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
        {t.client && (
          <span className="text-xs px-1.5 py-0.5 rounded-full bg-slate-700 text-slate-300 font-medium">
            {t.client.company || t.client.name}
          </span>
        )}
        {t.due_date && (
          <span className="text-xs px-1.5 py-0.5 rounded-full bg-slate-700 text-slate-300 font-medium">
            {new Date(t.due_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        )}
        {t.assigned_to && (
          <span className="text-xs px-1.5 py-0.5 rounded-full bg-slate-700 text-slate-300 font-medium">
            {t.assigned_to.split(' ')[0]}
          </span>
        )}
        {t.source === 'gemini'
          ? <span className="text-xs px-1.5 py-0.5 rounded-full bg-brand-900 text-brand-300 font-medium">Gemini</span>
          : <span className="text-xs px-1.5 py-0.5 rounded-full bg-slate-600 text-slate-400 font-medium">Manual</span>
        }
        {completed && t.completed_at && (
          <span className="text-xs text-gray-500">
            Done {new Date(t.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        )}
      </div>
    )

    return (
      <li key={t.id} className={`rounded-lg px-3 py-2 ${completed ? 'border border-gray-700 opacity-60' : PRIORITY_ROW_COLORS[t.priority]}`}
        style={completed ? { backgroundColor: 'rgba(50,50,50,0.2)' } : PRIORITY_ROW_STYLES[t.priority]}>
        {!completed && editId === t.id ? (
          <TaskForm fields={editFields} onChange={setEditFields} onSave={saveEdit} onCancel={() => setEditId(null)} />
        ) : (
          <div className="flex items-start gap-2 group">
            {!completed && (
              <button onClick={() => completeTask(t.id)}
                className="mt-0.5 w-4 h-4 rounded-full border border-gray-400 hover:border-emerald-600 hover:bg-emerald-100 shrink-0 transition-colors" />
            )}
            {completed && (
              <button onClick={() => reopenTask(t.id)}
                className="mt-0.5 w-4 h-4 rounded-full border border-gray-600 bg-gray-700 shrink-0 flex items-center justify-center hover:border-amber-500 hover:bg-amber-900 transition-colors">
                <Check size={9} className="text-gray-400" />
              </button>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p
                  className={`text-sm leading-snug ${completed ? 'text-gray-500 line-through' : 'text-gray-800 cursor-pointer hover:text-brand-400'}`}
                  onClick={completed ? undefined : () => startEdit(t)}
                >
                  {t.title}
                </p>
                {t.source_file_url && (
                  <a href={t.source_file_url} target="_blank" rel="noopener noreferrer"
                    className="text-gray-500 hover:text-brand-400 shrink-0" title="View transcript">
                    <ExternalLink size={11} />
                  </a>
                )}
              </div>
              {badges}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {!completed && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${PRIORITY_BADGE_COLORS[t.priority]}`}>
                  {t.priority}
                </span>
              )}
              <button onClick={() => deleteTask(t.id)}
                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity p-0.5">
                <X size={12} />
              </button>
            </div>
          </div>
        )}
      </li>
    )
  }

  const filtered = tasks.filter((t) => {
    if (filterPriority && t.priority !== filterPriority) return false
    if (filterOwner && t.assigned_to !== filterOwner) return false
    if (filterDate === 'today') {
      const today = new Date().toISOString().slice(0, 10)
      if (t.due_date !== today) return false
    } else if (filterDate === 'week') {
      if (!t.due_date) return false
      const end = new Date(); end.setDate(end.getDate() + 7)
      if (new Date(t.due_date) > end) return false
    } else if (filterDate === 'overdue') {
      if (!t.due_date || new Date(t.due_date) >= new Date()) return false
    }
    return true
  })

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">{filtered.length} of {tasks.length} open</span>
          <button
            onClick={() => setShowCompleted((v) => !v)}
            className={`text-xs underline ${showCompleted ? 'text-brand-500' : 'text-gray-400 hover:text-gray-600'}`}
          >
            {showCompleted ? 'Hide completed' : 'Show completed'}
          </button>
        </div>
        <button onClick={() => { setAdding(true); setEditId(null) }}
          className="inline-flex items-center gap-1 text-xs text-brand-600 hover:text-brand-800 font-medium">
          <Plus size={12} /> Add task
        </button>
      </div>

      {/* Open task filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} className={SELECT_CLS}>
          <option value="">All priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select value={filterOwner} onChange={(e) => setFilterOwner(e.target.value)} className={SELECT_CLS}>
          <option value="">All owners</option>
          {PEOPLE.map((p) => <option key={p} value={p}>{p.split(' ')[0]}</option>)}
        </select>
        <select value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className={SELECT_CLS}>
          <option value="">Any date</option>
          <option value="today">Due today</option>
          <option value="week">Due this week</option>
          <option value="overdue">Overdue</option>
        </select>
        {[filterPriority, filterOwner, filterDate].some(Boolean) && (
          <button onClick={() => { setFilterPriority(''); setFilterOwner(''); setFilterDate('') }}
            className="text-xs text-gray-400 hover:text-gray-600 underline">Clear</button>
        )}
      </div>

      {adding && (
        <div className="mb-4 rounded-lg border border-brand-200 bg-brand-50/40 p-3">
          <TaskForm fields={newTask} onChange={setNewTask} onSave={saveNew} onCancel={() => setAdding(false)} />
        </div>
      )}

      {filtered.length === 0 && !adding ? (
        <p className="text-sm text-gray-400 italic">{tasks.length === 0 ? 'No open tasks.' : 'No tasks match filters.'}</p>
      ) : (
        <ul className="space-y-2">
          {filtered.map((t) => <TaskRow key={t.id} t={t} />)}
        </ul>
      )}

      {/* Completed tasks */}
      {showCompleted && (
        <div className="mt-6">
          <div className="flex items-center gap-3 mb-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Completed</p>
            <select value={filterCompletedWithin} onChange={(e) => setFilterCompletedWithin(e.target.value)} className={SELECT_CLS}>
              <option value="week">Last 7 days</option>
              <option value="month">Last 30 days</option>
              <option value="quarter">Last 3 months</option>
              <option value="all">All time</option>
            </select>
          </div>
          {completedTasks.length === 0 ? (
            <p className="text-sm text-gray-400 italic">No completed tasks in this period.</p>
          ) : (
            <ul className="space-y-2">
              {completedTasks.map((t) => <TaskRow key={t.id} t={t} completed />)}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
