import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? `${req.nextUrl.protocol}//${req.nextUrl.host}`
  const code = req.nextUrl.searchParams.get('code')
  if (!code) {
    return NextResponse.redirect(`${origin}/?error=no_code`)
  }

  // Exchange code for tokens
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: `${origin}/api/auth/google/callback`,
      grant_type: 'authorization_code',
    }),
  })

  const tokens = await tokenRes.json()
  if (!tokens.access_token) {
    return NextResponse.redirect(`${origin}/?error=token_exchange_failed`)
  }

  const userId = req.nextUrl.searchParams.get('state')
  if (!userId) {
    return NextResponse.redirect(`${origin}/?error=missing_user`)
  }

  // Use service role to bypass RLS when storing tokens
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  const expiresAt = Date.now() + tokens.expires_in * 1000

  // Check if this is a first-time connection
  const { data: existing } = await supabase
    .from('google_tokens')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle()

  const isFirstConnect = !existing

  await supabase.from('google_tokens').upsert({
    user_id: userId,
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token ?? null,
    expires_at: expiresAt,
    ...(isFirstConnect ? { needs_backfill: true } : {}),
  })

  return NextResponse.redirect(`${origin}/`)
}
