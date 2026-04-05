'use client'

import { useMemo, useEffect, useState } from 'react'
import { Users, Calendar } from 'lucide-react'
import { StatCard } from './StatCard'
import { useCalendarEvents, type CalendarEvent } from '@/hooks/useCalendarEvents'
import { TasksBox } from './TasksBox'
import { useGeminiAutoProcess } from '@/hooks/useGeminiAutoProcess'
import { useDriveAutoSort } from '@/hooks/useDriveAutoSort'
import { supabase } from '@/lib/supabase'
import type { Client, Profile } from '@/lib/types'

interface PersonalDashboardProps {
  profile: Profile
  clients: Client[]
  isCurrentUser?: boolean
}

function CalendarSection() {
  const { thisWeek, nextWeek, connected, loading } = useCalendarEvents()
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null))
  }, [])

  if (loading) return null

  if (!connected) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-5 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-700">Google Calendar</p>
          <p className="text-xs text-gray-400 mt-0.5">Connect to see this week's events</p>
        </div>
        <a
          href={userId ? `/api/auth/google?userId=${userId}` : '#'}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-brand-600 text-white text-xs font-medium hover:bg-brand-700 transition-colors"
        >
          <Calendar size={13} />
          Connect Calendar
        </a>
      </div>
    )
  }

  function EventList({ events, label }: { events: CalendarEvent[], label: string }) {
    return (
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
          <span className="text-xs text-gray-400">{events.length} event{events.length !== 1 ? 's' : ''}</span>
        </div>
        {events.length === 0 ? (
          <p className="text-sm text-gray-400 italic">No events.</p>
        ) : (
          <ul className="space-y-2">
            {events.map((e) => {
              const date = new Date(e.start)
              const dayLabel = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
              const timeLabel = e.start.includes('T')
                ? date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
                : 'All day'
              return (
                <li key={e.id} className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-400 shrink-0 mt-1.5" />
                  <div className="min-w-0">
                    <a href={e.htmlLink} target="_blank" rel="noopener noreferrer"
                      className="text-sm text-gray-800 font-medium hover:text-brand-600 truncate block">
                      {e.title}
                    </a>
                    <p className="text-xs text-gray-400">{dayLabel} · {timeLabel}</p>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs text-gray-400">Google Calendar connected</span>
        <a
          href={userId ? `/api/auth/google?userId=${userId}` : '#'}
          className="text-xs text-brand-400 hover:text-brand-600 underline"
        >
          Reconnect
        </a>
      </div>
      <div className="flex gap-6 divide-x divide-gray-100">
        <EventList events={thisWeek} label="This Week" />
        <div className="pl-6 flex-1 min-w-0">
          <EventList events={nextWeek} label="Next Week" />
        </div>
      </div>
    </div>
  )
}

export function PersonalDashboard({ profile, clients, isCurrentUser = false }: PersonalDashboardProps) {
  const profileName = (profile.full_name || profile.email.split('@')[0]).replace(/\s+/g, ' ').trim()
  const myClients = useMemo(() => clients.filter((c) => {
    const name = profileName
    return (
      c.assigned_to === profile.id ||
      c.engagement_manager === name ||
      c.compliance_manager === name ||
      c.entrepreneur === name
    )
  }), [clients, profile.id, profileName])
  const active = useMemo(() => myClients.filter((c) => c.status !== 'complete' && c.status !== 'on hold'), [myClients])

  const primaryRoleCount = useMemo(() => {
    const name = profileName
    const entrepreneurCount = clients.filter((c) => c.entrepreneur === name).length
    const engagementCount = clients.filter((c) => c.engagement_manager === name).length
    const complianceCount = clients.filter((c) => c.compliance_manager === name).length
    return Math.max(entrepreneurCount, engagementCount, complianceCount)
  }, [clients, profileName])

  useGeminiAutoProcess(isCurrentUser ? myClients : [], profileName)
  useDriveAutoSort(isCurrentUser ? myClients : [], isCurrentUser ? profileName : null)

  const displayName = profileName.charAt(0).toUpperCase() + profileName.slice(1)
  const possessive = `${displayName}'${displayName.endsWith('s') ? '' : 's'}`

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-2xl font-semibold text-gray-900">{possessive} Personal Dashboard</h2>
        <p className="text-sm text-gray-400 mt-0.5">{primaryRoleCount} assigned client{primaryRoleCount !== 1 ? 's' : ''}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 mb-6">
        <StatCard label="Active clients" value={primaryRoleCount} icon={Users} accent="default" />
      </div>

      {myClients.length === 0 && (
        <p className="text-sm text-gray-400 italic mb-4">No clients assigned yet.</p>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {isCurrentUser && (
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Meetings</p>
            <CalendarSection />
          </div>
        )}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Tasks</p>
          <TasksBox clients={myClients} profileName={profileName} />
        </div>
      </div>
    </div>
  )
}
