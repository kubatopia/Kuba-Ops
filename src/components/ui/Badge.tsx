import { cn } from '@/lib/utils'
import type { ClientStatus, Priority, TaskStatus, TaskType } from '@/lib/types'

const statusStyles: Record<ClientStatus, string> = {
  'active research':    'bg-blue-50 text-blue-700 ring-blue-600/20',
  'prep for next call': 'bg-violet-50 text-violet-700 ring-violet-600/20',
  'waiting on client':  'bg-amber-50 text-amber-700 ring-amber-600/20',
  'blocked':            'bg-red-50 text-red-700 ring-red-600/20',
  'prototyping':        'bg-cyan-50 text-cyan-700 ring-cyan-600/20',
  'follow-up needed':   'bg-orange-50 text-orange-700 ring-orange-600/20',
  'low priority':       'bg-gray-50 text-gray-500 ring-gray-500/20',
  'complete':           'bg-green-50 text-green-700 ring-green-600/20',
  'on hold':            'bg-gray-50 text-gray-400 ring-gray-500/20',
}

const priorityStyles: Record<Priority, string> = {
  high:   'bg-red-50 text-red-700 ring-red-600/20',
  medium: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  low:    'bg-gray-50 text-gray-500 ring-gray-500/20',
}

const taskStatusStyles: Record<TaskStatus, string> = {
  'not started': 'bg-gray-50 text-gray-500 ring-gray-500/20',
  'in progress': 'bg-blue-50 text-blue-700 ring-blue-600/20',
  'waiting':     'bg-amber-50 text-amber-700 ring-amber-600/20',
  'done':        'bg-green-50 text-green-700 ring-green-600/20',
}

const taskTypeStyles: Record<TaskType, string> = {
  research:   'bg-brand-50 text-brand-600 ring-brand-600/20',
  outreach:   'bg-sky-50 text-sky-600 ring-sky-600/20',
  prep:       'bg-violet-50 text-violet-600 ring-violet-600/20',
  'follow-up':'bg-orange-50 text-orange-600 ring-orange-600/20',
  compliance: 'bg-red-50 text-red-600 ring-red-600/20',
  sourcing:   'bg-teal-50 text-teal-600 ring-teal-600/20',
  design:     'bg-pink-50 text-pink-600 ring-pink-600/20',
  deck:       'bg-purple-50 text-purple-600 ring-purple-600/20',
  legal:      'bg-rose-50 text-rose-600 ring-rose-600/20',
  product:    'bg-cyan-50 text-cyan-600 ring-cyan-600/20',
}

const base = 'inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ring-1 ring-inset whitespace-nowrap'

export function StatusBadge({ status, className }: { status: ClientStatus; className?: string }) {
  return <span className={cn(base, statusStyles[status], className)}>{status}</span>
}

export function PriorityBadge({ priority, className }: { priority: Priority; className?: string }) {
  return <span className={cn(base, priorityStyles[priority], className)}>{priority}</span>
}

export function TaskStatusBadge({ status, className }: { status: TaskStatus; className?: string }) {
  return <span className={cn(base, taskStatusStyles[status], className)}>{status}</span>
}

export function TaskTypeBadge({ type, className }: { type: TaskType; className?: string }) {
  return <span className={cn(base, taskTypeStyles[type], className)}>{type}</span>
}
