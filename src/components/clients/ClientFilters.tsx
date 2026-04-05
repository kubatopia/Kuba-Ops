'use client'

import { Search, X } from 'lucide-react'

export interface ClientFilterState {
  search: string
  engagement_manager: string
  entrepreneur: string
  compliance_manager: string
  rollover: string
}

interface ClientFiltersProps {
  filters: ClientFilterState
  onChange: (filters: ClientFilterState) => void
}

const ENGAGEMENT_MANAGERS = ['Nick King', 'Brady Weller']
const ENTREPRENEURS = ['Finley Underwood', 'Brady Weller', 'Lauren Prieur', 'Nick King', 'Patrick Sanders', 'Drew Elliot']
const COMPLIANCE = ['Lauren Prieur']

const SEL = 'py-1.5 px-2 text-xs border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-brand-500 text-gray-700'

export function ClientFilters({ filters, onChange }: ClientFiltersProps) {
  const set = (key: keyof ClientFilterState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    onChange({ ...filters, [key]: e.target.value })

  const hasActive = Object.values(filters).some(Boolean)
  const empty: ClientFilterState = { search: '', engagement_manager: '', entrepreneur: '', compliance_manager: '', rollover: '' }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={filters.search}
          onChange={set('search')}
          placeholder="Search clients..."
          className="pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 w-52"
        />
      </div>

      <select value={filters.engagement_manager} onChange={set('engagement_manager')} className={SEL}>
        <option value="">Engagement Manager</option>
        {ENGAGEMENT_MANAGERS.map((p) => <option key={p} value={p}>{p}</option>)}
      </select>

      <select value={filters.entrepreneur} onChange={set('entrepreneur')} className={SEL}>
        <option value="">Entrepreneur</option>
        {ENTREPRENEURS.map((p) => <option key={p} value={p}>{p}</option>)}
      </select>

      <select value={filters.compliance_manager} onChange={set('compliance_manager')} className={SEL}>
        <option value="">Compliance</option>
        {COMPLIANCE.map((p) => <option key={p} value={p}>{p}</option>)}
      </select>

      <select value={filters.rollover} onChange={set('rollover')} className={SEL}>
        <option value="">Rollover amount</option>
        <option value="0-100000">Under $100K</option>
        <option value="100000-500000">$100K – $500K</option>
        <option value="500000-1000000">$500K – $1M</option>
        <option value="1000000-999999999">$1M+</option>
      </select>

      {hasActive && (
        <button onClick={() => onChange(empty)} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700">
          <X size={12} /> Clear
        </button>
      )}
    </div>
  )
}
