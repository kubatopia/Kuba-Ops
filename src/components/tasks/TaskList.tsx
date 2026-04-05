'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, Circle, ChevronRight, AlertTriangle } from 'lucide-react'
import { TaskStatusBadge, TaskTypeBadge, PriorityBadge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDate, isOverdueTask, cn } from '@/lib/utils'
import type { Task } from '@/lib/types'

interface TaskListProps {
  tasks: Task[]
  showClient?: boolean
  onComplete?: (task: Task) => Promise<void>
  onEdit?: (task: Task) => void
  emptyMessage?: string
}

export function TaskList({ tasks, showClient = false, onComplete, onEdit, emptyMessage }: TaskListProps) {
  const [completing, setCompleting] = useState<string | null>(null)

  if (tasks.length === 0) {
    return (
      <EmptyState
        title={emptyMessage ?? 'No tasks'}
        description="Tasks added to this client will appear here."
      />
    )
  }

  const handleComplete = async (task: Task) => {
    if (!onComplete || completing) return
    setCompleting(task.id)
    try {
      await onComplete(task)
    } finally {
      setCompleting(null)
    }
  }

  return (
    <ul className="divide-y divide-gray-50">
      {tasks.map((task) => {
        const overdue = isOverdueTask(task)
        const done = task.status === 'done'

        return (
          <li
            key={task.id}
            className={cn(
              'flex items-start gap-3 py-3 px-1 group',
              done && 'opacity-60'
            )}
          >
            {/* Complete toggle */}
            {onComplete && (
              <button
                onClick={() => handleComplete(task)}
                disabled={!!completing || done}
                className="mt-0.5 shrink-0 text-gray-400 hover:text-green-600 transition-colors disabled:cursor-not-allowed"
                aria-label={done ? 'Done' : 'Mark complete'}
              >
                {done ? (
                  <CheckCircle2 size={17} className="text-green-500" />
                ) : (
                  <Circle size={17} />
                )}
              </button>
            )}

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <span className={cn(
                    'text-sm font-medium',
                    done ? 'line-through text-gray-400' : 'text-gray-900'
                  )}>
                    {task.title}
                  </span>
                  {showClient && task.client && (
                    <Link
                      href={`/clients/${task.client_id}`}
                      className="ml-2 text-xs text-brand-600 hover:text-brand-800 transition-colors"
                    >
                      {task.client.company || task.client.name}
                    </Link>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {task.task_type && <TaskTypeBadge type={task.task_type} />}
                  <PriorityBadge priority={task.priority} />
                  <TaskStatusBadge status={task.status} />
                </div>
              </div>

              {task.description && (
                <p className="mt-0.5 text-xs text-gray-500 line-clamp-1">{task.description}</p>
              )}

              <div className="flex items-center gap-3 mt-1">
                {task.due_date && (
                  <span className={cn(
                    'flex items-center gap-1 text-xs',
                    overdue ? 'text-red-600 font-medium' : 'text-gray-400'
                  )}>
                    {overdue && <AlertTriangle size={11} />}
                    Due {formatDate(task.due_date)}
                  </span>
                )}
                {task.next_step && (
                  <span className="flex items-center gap-1 text-xs text-gray-400">
                    <ChevronRight size={11} />
                    {task.next_step}
                  </span>
                )}
              </div>
            </div>

            {/* Edit button */}
            {onEdit && (
              <button
                onClick={() => onEdit(task)}
                className="text-xs text-gray-300 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5"
              >
                Edit
              </button>
            )}
          </li>
        )
      })}
    </ul>
  )
}
