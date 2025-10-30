import { NextResponse } from 'next/server'

export async function GET() {
  const key = process.env.OPENAI_API_KEY
  if (!key) {
    return NextResponse.json({ ok: false, reason: 'OPENAI_API_KEY not set' })
  }

  try {
    const res = await fetch('https://api.openai.com/v1/models', {
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json'
      }
    })

    const text = await res.text()
    return NextResponse.json({ ok: res.ok, status: res.status, bodyPreview: text ? text.substring(0, 500) : '' })
  } catch (err: any) {
    return NextResponse.json({ ok: false, reason: 'fetch failed', error: (err && (err.message || String(err))) || 'unknown' })
  }
}
