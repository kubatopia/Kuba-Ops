import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

async function refreshAccessToken(refreshToken: string): Promise<{ access_token: string; expires_at: number } | null> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })
  const data = await res.json()
  if (!data.access_token) return null
  return {
    access_token: data.access_token,
    expires_at: Date.now() + data.expires_in * 1000,
  }
}

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId')
  if (!userId) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  const { data: tokenRow } = await supabase
    .from('google_tokens')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (!tokenRow) return NextResponse.json({ connected: false })

  let accessToken = tokenRow.access_token

  // Refresh if expired
  if (Date.now() > tokenRow.expires_at - 60_000) {
    if (!tokenRow.refresh_token) return NextResponse.json({ connected: false })
    const refreshed = await refreshAccessToken(tokenRow.refresh_token)
    if (!refreshed) return NextResponse.json({ connected: false })
    accessToken = refreshed.access_token
    await supabase.from('google_tokens').update({
      access_token: refreshed.access_token,
      expires_at: refreshed.expires_at,
    }).eq('user_id', userId)
  }

  // Fetch this week + next week's events
  const now = new Date()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay())
  startOfWeek.setHours(0, 0, 0, 0)
  const endOfNextWeek = new Date(startOfWeek)
  endOfNextWeek.setDate(startOfWeek.getDate() + 14)

  const params = new URLSearchParams({
    timeMin: startOfWeek.toISOString(),
    timeMax: endOfNextWeek.toISOString(),
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '100',
  })

  const calRes = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )

  const calData = await calRes.json()

  const endOfThisWeek = new Date(startOfWeek)
  endOfThisWeek.setDate(startOfWeek.getDate() + 7)

  const allEvents = (calData.items ?? []).map((e: any) => ({
    id: e.id,
    title: e.summary ?? '(No title)',
    start: e.start?.dateTime ?? e.start?.date,
    end: e.end?.dateTime ?? e.end?.date,
    htmlLink: e.htmlLink,
  }))

  const thisWeek = allEvents.filter((e: any) => new Date(e.start) < endOfThisWeek)
  const nextWeek = allEvents.filter((e: any) => new Date(e.start) >= endOfThisWeek)

  return NextResponse.json({ connected: true, thisWeek, nextWeek })
}
