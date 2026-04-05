'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Activity } from '@/lib/types'

export function useActivities(clientId: string) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true)
      const { data } = await supabase
        .from('activities')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(30)

      setActivities((data as Activity[]) ?? [])
    } finally {
      setLoading(false)
    }
  }, [clientId])

  useEffect(() => {
    if (clientId) fetchActivities()
  }, [clientId, fetchActivities])

  return { activities, loading, refetch: fetchActivities }
}
