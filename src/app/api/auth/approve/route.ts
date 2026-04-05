import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  const action = req.nextUrl.searchParams.get('action')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://venture-crm-two.vercel.app'

  if (!token || !action) {
    return new NextResponse('Invalid link', { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  const { data: signup } = await supabase
    .from('pending_signups')
    .select('*')
    .eq('token', token)
    .single()

  if (!signup) return new NextResponse('Request not found.', { status: 404 })
  if (signup.status !== 'pending') {
    return new NextResponse(`This request has already been ${signup.status}.`, { status: 400 })
  }

  if (action === 'deny') {
    await supabase.from('pending_signups').update({ status: 'denied' }).eq('token', token)
    return new NextResponse(
      `<html><body style="font-family:sans-serif;padding:40px;text-align:center"><h2>Access denied for ${signup.name}.</h2></body></html>`,
      { headers: { 'Content-Type': 'text/html' } }
    )
  }

  if (action === 'approve') {
    // Invite user — creates account and sends Supabase's built-in invite email
    const { error: inviteError } = await supabase.auth.admin.inviteUserByEmail(signup.email, {
      data: { full_name: signup.name },
      redirectTo: `${appUrl}/set-password`,
    })

    if (inviteError) {
      return new NextResponse(`Failed to invite user: ${inviteError.message}`, { status: 500 })
    }

    await supabase.from('pending_signups').update({ status: 'approved' }).eq('token', token)

    return new NextResponse(
      `<html><body style="font-family:sans-serif;padding:40px;text-align:center;color:#111"><h2 style="color:#00D4AA">Approved!</h2><p>${signup.name} has been invited and will receive an email to set their password.</p></body></html>`,
      { headers: { 'Content-Type': 'text/html' } }
    )
  }

  return new NextResponse('Invalid action', { status: 400 })
}
