import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  const { name, email } = await req.json()
  if (!name || !email) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  // Check if already pending or approved
  const { data: existing } = await supabase
    .from('pending_signups')
    .select('status')
    .eq('email', email)
    .maybeSingle()

  if (existing?.status === 'approved') {
    return NextResponse.json({ error: 'This email already has access.' }, { status: 400 })
  }
  if (existing?.status === 'pending') {
    return NextResponse.json({ error: 'A request for this email is already pending.' }, { status: 400 })
  }

  const { data: row, error } = await supabase
    .from('pending_signups')
    .insert({ name, email })
    .select('token')
    .single()

  if (error || !row) return NextResponse.json({ error: 'Failed to save request' }, { status: 500 })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://venture-crm-two.vercel.app'
  const approveUrl = `${appUrl}/api/auth/approve?token=${row.token}&action=approve`
  const denyUrl = `${appUrl}/api/auth/approve?token=${row.token}&action=deny`

  await resend.emails.send({
    from: 'KubaVentures <onboarding@resend.dev>',
    to: 'finley@qsbsrollover.com',
    subject: `Access request: ${name}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="margin:0 0 8px">New access request</h2>
        <p style="color:#555;margin:0 0 20px"><strong>${name}</strong> (${email}) is requesting access to KubaVentures.</p>
        <a href="${approveUrl}" style="display:inline-block;background:#00D4AA;color:#fff;text-decoration:none;padding:10px 24px;border-radius:6px;font-weight:600;margin-right:12px">Approve</a>
        <a href="${denyUrl}" style="display:inline-block;background:#f43f5e;color:#fff;text-decoration:none;padding:10px 24px;border-radius:6px;font-weight:600">Deny</a>
      </div>
    `,
  })

  return NextResponse.json({ ok: true })
}
