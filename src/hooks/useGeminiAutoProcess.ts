'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Client } from '@/lib/types'

export function useGeminiAutoProcess(clients: Client[], profileName?: string) {
  useEffect(() => {
    if (clients.length === 0) return

    supabase.auth.getUser().then(({ data }) => {
      const userId = data.user?.id
      if (!userId) return
      processNewFiles(userId, clients, profileName)
    })
  }, [clients.map((c) => c.id).join(','), profileName])
}

async function processNewFiles(userId: string, clients: Client[], profileName?: string) {
  // Check if this user needs a backfill (first-time Google connect)
  const { data: tokenRow } = await supabase
    .from('google_tokens')
    .select('needs_backfill')
    .eq('user_id', userId)
    .maybeSingle()

  if (tokenRow?.needs_backfill) {
    await runBackfill(userId, clients)
    await supabase
      .from('google_tokens')
      .update({ needs_backfill: false })
      .eq('user_id', userId)
  }

  for (const client of clients) {
    const companyName = client.company || client.name
    if (!companyName) continue

    try {
      const res = await fetch(
        `/api/drive/files?userId=${userId}&clientName=${encodeURIComponent(companyName)}&category=Communications`
      )
      const { files } = await res.json()
      if (!files?.length) continue

      for (const file of files) {
        const supportedTypes = [
          'application/vnd.google-apps.document',
          'text/plain',
        ]
        if (!supportedTypes.includes(file.mimeType)) continue

        await fetch('/api/gemini/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            fileId: file.id,
            fileName: file.name,
            mimeType: file.mimeType,
            clientId: client.id,
            defaultAssignee: profileName,
            sourceFileUrl: file.webViewLink ?? null,
          }),
        })
      }
    } catch {
      // silently skip if drive not connected or folder not found
    }
  }
}

async function runBackfill(userId: string, clients: Client[]) {
  const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()

  for (const client of clients) {
    const companyName = client.company || client.name
    if (!companyName) continue

    try {
      const res = await fetch(
        `/api/drive/files?userId=${userId}&clientName=${encodeURIComponent(companyName)}&category=Communications&modifiedAfter=${encodeURIComponent(twoWeeksAgo)}`
      )
      const { files } = await res.json()
      if (!files?.length) continue

      // Remove these files from processed_drive_files so they get re-processed
      const fileIds = files.map((f: any) => f.id)
      await supabase
        .from('processed_drive_files')
        .delete()
        .in('file_id', fileIds)
    } catch {
      // silently skip
    }
  }
}
