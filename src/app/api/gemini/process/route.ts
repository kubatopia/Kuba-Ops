import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const PEOPLE = ['Finley Underwood', 'Nick King', 'Brady Weller', 'Lauren Prieur', 'Patrick Sanders', 'Drew Elliot']

async function getAccessToken(userId: string): Promise<string | null> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
  const { data } = await supabase
    .from('google_tokens')
    .select('access_token')
    .eq('user_id', userId)
    .single()
  return data?.access_token ?? null
}

async function getFileContent(fileId: string, mimeType: string, token: string): Promise<string> {
  // Export Google Docs as plain text, download others directly
  let url: string
  if (mimeType === 'application/vnd.google-apps.document') {
    url = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/plain`
  } else {
    url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`
  }
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  return res.text()
}

export async function POST(req: NextRequest) {
  const { userId, fileId, fileName, mimeType, clientId, defaultAssignee, meetingDate, sourceFileUrl } = await req.json()

  if (!userId || !fileId || !clientId) {
    return NextResponse.json({ error: 'missing params' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  // Skip if already processed
  const { data: existing } = await supabase
    .from('processed_drive_files')
    .select('id')
    .eq('file_id', fileId)
    .single()

  if (existing) return NextResponse.json({ skipped: true })

  const token = await getAccessToken(userId)
  if (!token) return NextResponse.json({ error: 'no_token' }, { status: 401 })

  const content = await getFileContent(fileId, mimeType, token)
  if (!content.trim()) {
    await supabase.from('processed_drive_files').insert({ file_id: fileId, client_id: clientId, file_name: fileName })
    return NextResponse.json({ tasks: [] })
  }

  // Call Gemini
  const refDate = meetingDate ?? new Date().toISOString().split('T')[0]
  const oneWeekOut = new Date(refDate)
  oneWeekOut.setDate(oneWeekOut.getDate() + 7)
  const oneMonthOut = new Date(refDate)
  oneMonthOut.setMonth(oneMonthOut.getMonth() + 1)
  const oneWeekStr = oneWeekOut.toISOString().split('T')[0]
  const oneMonthStr = oneMonthOut.toISOString().split('T')[0]

  const prompt = `You are a task extractor for a venture firm. Read the following call/meeting notes and extract all action items and tasks mentioned.

The meeting date is ${refDate}. Use this to calculate due dates.

Due date rules:
- If a specific date is mentioned, use that date (YYYY-MM-DD format)
- If the task is marked urgent or has high priority, use ${oneWeekStr} (1 week from meeting date)
- If no date is mentioned, use ${oneMonthStr} (1 month from meeting date)

For each task return a JSON object with:
- "title": short task description (max 10 words)
- "priority": "high", "medium", or "low"
- "due_date": ISO date string (YYYY-MM-DD) — always required, never null

Return ONLY a valid JSON array of task objects. No explanation, no markdown.

Meeting notes:
${content.slice(0, 8000)}`

  const geminiRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1 },
      }),
    }
  )

  const geminiData = await geminiRes.json()
  const raw = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? '[]'

  let tasks: any[] = []
  try {
    const cleaned = raw.replace(/```json|```/g, '').trim()
    tasks = JSON.parse(cleaned)
  } catch {
    tasks = []
  }

  // Insert tasks into DB
  if (tasks.length > 0) {
    await supabase.from('tasks').insert(
      tasks.map((t: any) => ({
        title: t.title,
        priority: ['high', 'medium', 'low'].includes(t.priority) ? t.priority : 'medium',
        due_date: t.due_date ?? oneMonthStr,
        assigned_to: PEOPLE.includes(defaultAssignee) ? defaultAssignee : null,
        client_id: clientId,
        status: 'not started',
        source: 'gemini',
        source_file_url: sourceFileUrl ?? null,
      }))
    )
  }

  // Mark file as processed
  await supabase.from('processed_drive_files').insert({
    file_id: fileId,
    client_id: clientId,
    file_name: fileName,
  })

  return NextResponse.json({ tasks })
}
