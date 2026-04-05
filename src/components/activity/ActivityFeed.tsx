'use client'

import { Circle } from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { formatRelative } from '@/lib/utils'
import type { Activity, ActivityEventType } from '@/lib/types'

const eventLabels: Record<ActivityEventType, string> = {
  client_created:    'Client created',
  task_added:        'Task added',
  task_completed:    'Task completed',
  meeting_added:     'Update logged',
  next_call_updated: 'Next call updated',
  blocker_updated:   'Blocker updated',
  status_updated:    'Status changed',
  priority_updated:  'Priority changed',
  notes_updated:     'Notes updated',
}

const eventColors: Record<ActivityEventType, string> = {
  client_created:    'bg-green-400',
  task_added:        'bg-blue-400',
  task_completed:    'bg-green-500',
  meeting_added:     'bg-violet-400',
  next_call_updated: 'bg-brand-400',
  blocker_updated:   'bg-red-400',
  status_updated:    'bg-amber-400',
  priority_updated:  'bg-orange-400',
  notes_updated:     'bg-gray-400',
}

interface ActivityFeedProps {
  activities: Activity[]
  loading?: boolean
}

export function ActivityFeed({ activities, loading }: ActivityFeedProps) {
  if (loading) return <LoadingSpinner />

  if (activities.length === 0) {
    return <p className="text-sm text-gray-400 py-4 text-center">No activity yet.</p>
  }

  return (
    <ul className="space-y-0">
      {activities.map((a, i) => {
        const label = eventLabels[a.event_type as ActivityEventType] ?? a.event_type
        const color = eventColors[a.event_type as ActivityEventType] ?? 'bg-gray-400'
        const isLast = i === activities.length - 1

        return (
          <li key={a.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${color}`} />
              {!isLast && <div className="w-px flex-1 bg-gray-100 mt-1" />}
            </div>
            <div className="pb-4 min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-medium text-gray-700">{label}</span>
                <span className="text-xs text-gray-400">{formatRelative(a.created_at)}</span>
              </div>
              <p className="text-sm text-gray-500 mt-0.5">{a.description}</p>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
