'use client'

import { X } from 'lucide-react'
import { Select } from '@/components/ui/Select'
import { TASK_STATUSES, TASK_TYPES, PRIORITIES } from '@/lib/constants'

export interface TaskFilterState {
  status: string
  priority: string
  type: string
  view: 'all' | 'overdue' | 'this-week' | 'done'
}

interface TaskFiltersProps {
  filters: TaskFilterState
  onChange: (f: TaskFilterState) => void
}

const ALL = { value: '', label: 'All' }

const VIEWS = [
  { value: 'all',       label: 'All open' },
  { value: 'overdue',   label: 'Overdue' },
  { value: 'this-week', label: 'Due this week' },
  { value: 'done',      label: 'Completed' },
]

export function TaskFilters({ filters, onChange }: TaskFiltersProps) {
  const set = (key: keyof TaskFilterState) => (e: React.ChangeEvent<HTMLSelectElement>) =>
    onChange({ ...filters, [key]: e.target.value })

  const hasFilters = filters.status || filters.priority || filters.type

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* View tabs */}
      <div className="flex items-center bg-gray-100 rounded-md p-0.5 gap-0.5">
        {VIEWS.map((v) => (
          <button
            key={v.value}
            onClick={() => onChange({ ...filters, view: v.value as TaskFilterState['view'] })}
            className={
              filters.view === v.value
                ? 'px-2.5 py-1 text-xs font-medium bg-white rounded shadow-sm text-gray-900'
                : 'px-2.5 py-1 text-xs text-gray-500 hover:text-gray-700'
            }
          >
            {v.label}
          </button>
        ))}
      </div>

      <div className="w-px h-5 bg-gray-200" />

      <Select
        value={filters.priority}
        onChange={set('priority')}
        options={[ALL, ...PRIORITIES.map((p) => ({ value: p, label: p }))]}
        className="py-1.5 text-xs"
      />
      <Select
        value={filters.type}
        onChange={set('type')}
        options={[ALL, ...TASK_TYPES.map((t) => ({ value: t, label: t }))]}
        className="py-1.5 text-xs"
      />

      {hasFilters && (
        <button
          onClick={() => onChange({ ...filters, status: '', priority: '', type: '' })}
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700"
        >
          <X size={12} /> Clear
        </button>
      )}
    </div>
  )
}
