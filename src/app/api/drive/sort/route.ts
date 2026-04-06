import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Map first name to folder name pattern in "Meeting Recordings"
const FOLDER_NAME_MAP: Record<string, string> = {
  Finley: 'Finley Meet Recordings',
  Nick: 'Nick Meet Recordings',
  Brady: 'Brady Meet Recordings',
  Drew: 'Drew Meet Recordings',
  Lauren: 'Lauren Meet Recordings',
  Patrick: 'Patrick Meet Recordings',
}

const CATEGORIES = ['Communications', 'Compliance', 'Research']

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

async function getAccessToken(userId: string): Promise<string | null> {
  const supabase = getSupabase()
  const { data } = await supabase
    .from('google_tokens')
    .select('access_token, refresh_token, expires_at')
    .eq('user_id', userId)
    .single()
  if (!data) return null

  if (Date.now() > data.expires_at - 60_000) {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: data.refresh_token,
        grant_type: 'refresh_token',
      }),
    })
    const refreshed = await res.json()
    if (!refreshed.access_token) return null
    await supabase.from('google_tokens').update({
      access_token: refreshed.access_token,
      expires_at: Date.now() + refreshed.expires_in * 1000,
    }).eq('user_id', userId)
    return refreshed.access_token
  }

  return data.access_token
}

async function driveSearch(query: string, token: string): Promise<any[]> {
  const params = new URLSearchParams({
    q: query,
    fields: 'files(id,name,mimeType,webViewLink,parents,createdTime)',
    pageSize: '100',
    includeItemsFromAllDrives: 'true',
    supportsAllDrives: 'true',
  })
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?${params}`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  const data = await res.json()
  return data.files ?? []
}

async function getFileContent(fileId: string, mimeType: string, token: string): Promise<string> {
  const url = mimeType === 'application/vnd.google-apps.document'
    ? `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/plain`
    : `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) return ''
  return res.text()
}

async function moveFile(fileId: string, oldParentId: string, newParentId: string, token: string): Promise<boolean> {
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?addParents=${newParentId}&removeParents=${oldParentId}&fields=id&supportsAllDrives=true`,
    {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    }
  )
  return res.ok
}

async function findOrCreateFolder(name: string, parentId: string, token: string): Promise<string | null> {
  const existing = await driveSearch(
    `name = '${name.replace(/'/g, "\\'")}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    token
  )
  if (existing.length > 0) return existing[0].id

  const res = await fetch('https://www.googleapis.com/drive/v3/files?supportsAllDrives=true', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId],
    }),
  })
  if (!res.ok) return null
  const created = await res.json()
  return created.id ?? null
}

async function markProcessed(fileId: string, fileName: string, clientId: string | null) {
  const supabase = getSupabase()
  // Use upsert to safely handle duplicates (processed_drive_files has unique constraint on file_id)
  await supabase.from('processed_drive_files').upsert(
    { file_id: fileId, file_name: fileName, client_id: clientId },
    { onConflict: 'file_id', ignoreDuplicates: true }
  )
}

export async function POST(req: NextRequest) {
  const { userId, profileName, clients } = await req.json()

  if (!userId || !profileName || !clients?.length) {
    return NextResponse.json({ error: 'missing params' }, { status: 400 })
  }

  const token = await getAccessToken(userId)
  if (!token) return NextResponse.json({ error: 'not_connected' }, { status: 401 })

  // Determine which recording folder to scan based on first name
  const firstName = profileName.split(' ')[0]
  if (!FOLDER_NAME_MAP[firstName]) {
    return NextResponse.json({ error: `no folder mapping for ${firstName}` }, { status: 400 })
  }

  // Find "Meeting Recordings" root folder
  const meetingRoots = await driveSearch(
    `name = 'Meeting Recordings' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    token
  )
  if (!meetingRoots.length) {
    return NextResponse.json({ processed: 0, error: 'Meeting Recordings folder not found' })
  }

  // Find the personal subfolder
  let personalFolder: any = null
  for (const root of meetingRoots) {
    const found = await driveSearch(
      `name contains '${firstName}' and '${root.id}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      token
    )
    if (found.length > 0) {
      personalFolder = found[0]
      break
    }
  }

  if (!personalFolder) {
    return NextResponse.json({ processed: 0, error: `${firstName} Meet Recordings folder not found` })
  }

  // List all files in the personal folder
  const allFiles = await driveSearch(
    `'${personalFolder.id}' in parents and trashed=false`,
    token
  )

  const supportedTypes = ['application/vnd.google-apps.document', 'text/plain']
  const processableFiles = allFiles.filter((f) => supportedTypes.includes(f.mimeType))

  if (!processableFiles.length) {
    return NextResponse.json({ processed: 0, message: 'no processable files' })
  }

  // Check which files are already processed
  const supabase = getSupabase()
  const { data: alreadyProcessed } = await supabase
    .from('processed_drive_files')
    .select('file_id')
    .in('file_id', processableFiles.map((f: any) => f.id))

  const processedIds = new Set((alreadyProcessed ?? []).map((p: any) => p.file_id))
  const newFiles = processableFiles.filter((f: any) => !processedIds.has(f.id))

  if (!newFiles.length) {
    return NextResponse.json({ processed: 0, message: 'all files already processed' })
  }

  // Find "Clients" root folder for file organization
  const clientsRoots = await driveSearch(
    `name = 'Clients' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    token
  )
  const clientsRootId: string | null = clientsRoots[0]?.id ?? null

  const clientNames = clients.map((c: any) => c.company || c.name).filter(Boolean)
  const results: any[] = []

  for (const file of newFiles) {
    try {
      const content = await getFileContent(file.id, file.mimeType, token)
      if (!content.trim()) {
        await markProcessed(file.id, file.name, null)
        results.push({ file: file.name, status: 'empty' })
        continue
      }

      // Ask Gemini to identify client + category
      const identifyPrompt = `You are helping organize files for a venture firm called Kuba Ventures.

Given this meeting transcript or document, identify:
1. Which client is this about? Choose from: ${clientNames.join(', ')}. If none match, return null.
2. What category does it belong to? Choose from: Communications, Compliance, Research. Meeting notes/transcripts = Communications.

Return ONLY a JSON object like: {"client": "Client Company Name", "category": "Communications"}
No explanation, no markdown.

Document title: ${file.name}
Content preview:
${content.slice(0, 4000)}`

      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: identifyPrompt }] }],
            generationConfig: { temperature: 0.1 },
          }),
        }
      )

      const geminiData = await geminiRes.json()
      const raw = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}'

      let identified: { client: string | null; category: string } = { client: null, category: 'Communications' }
      try {
        identified = JSON.parse(raw.replace(/```json|```/g, '').trim())
      } catch {
        // fall through to unidentified
      }

      if (!identified.client || !CATEGORIES.includes(identified.category)) {
        await markProcessed(file.id, file.name, null)
        results.push({ file: file.name, status: 'unidentified', raw })
        continue
      }

      // Match identified client to DB client
      const matchedClient = clients.find((c: any) => {
        const name = (c.company || c.name || '').toLowerCase()
        const target = identified.client!.toLowerCase()
        return name === target || name.includes(target) || target.includes(name)
      })

      if (!matchedClient) {
        await markProcessed(file.id, file.name, null)
        results.push({ file: file.name, status: 'client_not_found', identified })
        continue
      }

      // Find client folder in Drive — strip legal suffixes for better matching
      let clientFolderId: string | null = null
      const rawName = matchedClient.company || matchedClient.name
      const strippedName = rawName
        .replace(/\b(LLC|Inc\.?|Corp\.?|Ltd\.?|Co\.?|Incorporated|Limited|Technologies|Automations?|Enterprises?|Holdings?|Solutions?|Group|Labs?|Ventures?)\b/gi, '')
        .replace(/\s+/g, ' ')
        .trim()
      const searchTerms = Array.from(new Set([strippedName, strippedName.split(' ')[0]].filter(Boolean)))

      for (const term of searchTerms) {
        if (clientFolderId) break
        const safeTerm = term.replace(/'/g, "\\'")

        if (clientsRootId) {
          const found = await driveSearch(
            `name contains '${safeTerm}' and '${clientsRootId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
            token
          )
          if (found.length > 0) { clientFolderId = found[0].id; break }
        }

        const found = await driveSearch(
          `name contains '${safeTerm}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
          token
        )
        if (found.length > 0) clientFolderId = found[0].id
      }

      if (!clientFolderId) {
        await markProcessed(file.id, file.name, matchedClient.id)
        results.push({ file: file.name, status: 'no_drive_folder', client: identified.client })
        continue
      }

      // Find or create category subfolder
      const categoryFolderId = await findOrCreateFolder(identified.category, clientFolderId, token)
      if (!categoryFolderId) {
        results.push({ file: file.name, status: 'folder_create_failed' })
        continue
      }

      // Move file to correct location
      const oldParentId = file.parents?.[0] ?? personalFolder.id
      const moved = await moveFile(file.id, oldParentId, categoryFolderId, token)

      await markProcessed(file.id, file.name, matchedClient.id)

      results.push({
        file: file.name,
        status: moved ? 'moved' : 'move_failed',
        client: identified.client,
        category: identified.category,
      })

      // Trigger task extraction for Communications files
      // Tasks are assigned to the client's entrepreneur, not inferred from the transcript
      if (identified.category === 'Communications' && moved) {
        await fetch(`${req.nextUrl.origin}/api/gemini/process`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            fileId: file.id,
            fileName: file.name,
            mimeType: file.mimeType,
            clientId: matchedClient.id,
            defaultAssignee: matchedClient.entrepreneur ?? null,
            meetingDate: file.createdTime ? file.createdTime.split('T')[0] : new Date().toISOString().split('T')[0],
          }),
        })
      }
    } catch (err) {
      results.push({ file: file.name, status: 'error', error: String(err) })
    }
  }

  return NextResponse.json({ processed: results.length, results })
}
