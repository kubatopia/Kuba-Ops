'use client'

import { CalendarDays, ChevronRight } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDate } from '@/lib/utils'
import type { Meeting } from '@/lib/types'

interface MeetingListProps {
  meetings: Meeting[]
}

export function MeetingList({ meetings }: MeetingListProps) {
  if (meetings.length === 0) {
    return (
      <EmptyState
        icon={CalendarDays}
        title="No updates logged"
        description="Use 'Log update' to record what happened after a call or work session."
      />
    )
  }

  return (
    <ul className="space-y-4">
      {meetings.map((m) => (
        <li key={m.id} className="border border-gray-100 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <CalendarDays size={14} className="text-gray-400" />
            <span className="text-sm font-medium text-gray-900">{formatDate(m.meeting_date)}</span>
            {m.next_meeting_date && (
              <span className="flex items-center gap-1 ml-auto text-xs text-brand-600">
                <ChevronRight size={12} />
                Next: {formatDate(m.next_meeting_date)}
              </span>
            )}
          </div>

          {m.summary && (
            <div className="mb-2">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Summary</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{m.summary}</p>
            </div>
          )}

          {m.decisions && (
            <div className="mb-2">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Decisions</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{m.decisions}</p>
            </div>
          )}

          {m.follow_ups && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Follow-ups</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{m.follow_ups}</p>
            </div>
          )}
        </li>
      ))}
    </ul>
  )
}
