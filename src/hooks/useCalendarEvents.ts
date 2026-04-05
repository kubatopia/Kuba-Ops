'use client'

import { useState, useEffect } from 'react'

export interface CalendarEvent {
  id: string
  title: string
  start: string
  end: string
  htmlLink: string
}

export function useCalendarEvents() {
  const [thisWeek, setThisWeek] = useState<CalendarEvent[]>([])
  const [nextWeek, setNextWeek] = useState<CalendarEvent[]>([])
  const [connected, setConnected] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    import('@/lib/supabase').then(({ supabase }) =>
      supabase.auth.getUser().then(({ data }) => {
        const userId = data.user?.id
        if (!userId) { setConnected(false); setLoading(false); return }
        fetch(`/api/calendar/events?userId=${userId}`)
          .then((r) => r.json())
          .then((d) => {
            setConnected(d.connected ?? false)
            setThisWeek(d.thisWeek ?? [])
            setNextWeek(d.nextWeek ?? [])
          })
          .catch(() => setConnected(false))
          .finally(() => setLoading(false))
      })
    )
  }, [])

  return { thisWeek, nextWeek, connected, loading }
}
