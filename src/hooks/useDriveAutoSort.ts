'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Client } from '@/lib/types'

export function useDriveAutoSort(clients: Client[], profileName: string | null) {
  useEffect(() => {
    if (clients.length === 0 || !profileName) return

    supabase.auth.getUser().then(({ data }) => {
      const userId = data.user?.id
      if (!userId) return
      sortMeetingRecordings(userId, profileName, clients)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clients.map((c) => c.id).join(','), profileName])
}

async function sortMeetingRecordings(userId: string, profileName: string, clients: Client[]) {
  try {
    await fetch('/api/drive/sort', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        profileName,
        clients: clients.map((c) => ({ id: c.id, name: c.name, company: c.company, entrepreneur: c.entrepreneur })),
      }),
    })
  } catch {
    // silently fail if Drive not connected
  }
}
