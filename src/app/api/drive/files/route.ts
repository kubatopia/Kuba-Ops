import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

async function getAccessToken(userId: string): Promise<string | null> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
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

async function driveSearch(query: string, token: string) {
  const params = new URLSearchParams({
    q: query,
    fields: 'files(id,name,mimeType,webViewLink,modifiedTime)',
    pageSize: '50',
  })
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?${params}`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  const data = await res.json()
  return data.files ?? []
}

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId')
  const clientName = req.nextUrl.searchParams.get('clientName')
  const category = req.nextUrl.searchParams.get('category') // Communications | Compliance | Research
  const modifiedAfter = req.nextUrl.searchParams.get('modifiedAfter') // ISO date string

  if (!userId || !clientName || !category) {
    return NextResponse.json({ error: 'missing params' }, { status: 400 })
  }

  const token = await getAccessToken(userId)
  if (!token) return NextResponse.json({ files: [], error: 'not_connected' })

  // Step 1: Find the "Clients" parent folder
  const clientsParent = await driveSearch(
    `name = 'Clients' and mimeType='application/vnd.google-apps.folder'`,
    token
  )

  // Step 2: Build search terms — strip legal suffixes and try progressively shorter names
  const stripped = clientName
    .replace(/\b(LLC|Inc\.?|Corp\.?|Ltd\.?|Co\.?|Incorporated|Limited|Technologies|Automations?|Enterprises?|Holdings?|Solutions?|Group|Labs?|Ventures?)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim()

  // Try the stripped name first, then fall back to first meaningful word
  const firstWord = stripped.split(' ')[0]
  const searchTerms = Array.from(new Set([stripped, firstWord].filter(Boolean)))

  let clientFolders: any[] = []

  for (const term of searchTerms) {
    if (clientFolders.length) break
    const safeTerm = term.replace(/'/g, "\\'")

    if (clientsParent.length > 0) {
      for (const parent of clientsParent) {
        const results = await driveSearch(
          `name contains '${safeTerm}' and '${parent.id}' in parents and mimeType='application/vnd.google-apps.folder'`,
          token
        )
        clientFolders.push(...results)
      }
    }

    // Fall back to global search
    if (!clientFolders.length) {
      clientFolders = await driveSearch(
        `name contains '${safeTerm}' and mimeType='application/vnd.google-apps.folder'`,
        token
      )
    }
  }

  if (!clientFolders.length) return NextResponse.json({ files: [], debug: `no client folder found for: ${clientName}` })

  const clientFolderId = clientFolders[0].id

  // Step 3: Find the category subfolder (try exact match first, then contains)
  let categoryFolders = await driveSearch(
    `name = '${category}' and '${clientFolderId}' in parents and mimeType='application/vnd.google-apps.folder'`,
    token
  )

  if (!categoryFolders.length) {
    categoryFolders = await driveSearch(
      `name contains '${category}' and '${clientFolderId}' in parents and mimeType='application/vnd.google-apps.folder'`,
      token
    )
  }

  if (!categoryFolders.length) return NextResponse.json({ files: [], debug: `no ${category} folder in ${clientFolders[0].name}` })

  const categoryFolderId = categoryFolders[0].id

  // Step 4: List files
  const modifiedClause = modifiedAfter ? ` and modifiedTime > '${modifiedAfter}'` : ''
  const files = await driveSearch(
    `'${categoryFolderId}' in parents and trashed=false${modifiedClause}`,
    token
  )

  return NextResponse.json({ files, categoryFolderId })
}
