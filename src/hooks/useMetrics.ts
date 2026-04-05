'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export interface Metric {
  id: string
  date: string
  mrr: number | null
  contracted_revenue: number | null
  acv: number | null
  total_rollover_volume: number | null
  total_clients: number | null
  new_clients: number | null
  new_mrr: number | null
  arr: number | null
}

export function useMetrics() {
  const [metrics, setMetrics] = useState<Metric[]>([])
  const [loading, setLoading] = useState(true)

  const fetchMetrics = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('metrics')
      .select('*')
      .order('date', { ascending: true })
    setMetrics((data as Metric[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchMetrics() }, [fetchMetrics])

  return { metrics, loading, refetch: fetchMetrics }
}
