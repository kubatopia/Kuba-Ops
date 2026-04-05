import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  label: string
  value: number | string
  icon: LucideIcon
  accent?: 'default' | 'red' | 'amber' | 'green' | 'blue'
  description?: string
}

const accents = {
  default: 'text-gray-900',
  red:     'text-red-600',
  amber:   'text-amber-600',
  green:   'text-green-600',
  blue:    'text-blue-600',
}

const iconBg = {
  default: 'bg-gray-100 text-gray-500',
  red:     'bg-red-50 text-red-500',
  amber:   'bg-amber-50 text-amber-500',
  green:   'bg-green-50 text-green-500',
  blue:    'bg-blue-50 text-blue-500',
}

export function StatCard({ label, value, icon: Icon, accent = 'default', description }: StatCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
          <p className={cn('text-3xl font-bold mt-1', accents[accent])}>{value}</p>
          {description && <p className="text-xs text-gray-400 mt-1">{description}</p>}
        </div>
        <div className={cn('p-2.5 rounded-lg', iconBg[accent])}>
          <Icon size={18} />
        </div>
      </div>
    </div>
  )
}
