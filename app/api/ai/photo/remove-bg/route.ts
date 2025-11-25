import { NextRequest, NextResponse } from 'next/server'

// This route uses remove.bg service to remove image background.
// Set environment variable REMOVE_BG_API_KEY with your remove.bg API key.
export async function POST(request: NextRequest) {
  try {
    if (!process.env.REMOVE_BG_API_KEY) {
      return NextResponse.json({ error: 'REMOVE_BG_API_KEY not configured on server' }, { status: 403 })
    }

    const body = await request.json()
    const { image } = body // expect data URL string (data:image/..;base64,...)

    if (!image || typeof image !== 'string' || !image.startsWith('data:')) {
      return NextResponse.json({ error: 'Invalid image payload' }, { status: 400 })
    }

    const matches = image.match(/^data:(.+);base64,(.+)$/)
    if (!matches) {
      return NextResponse.json({ error: 'Invalid data URL' }, { status: 400 })
    }

    const mime = matches[1]
    const b64 = matches[2]

    // Use remove.bg API
    // Build form data: image_file_b64 expects raw base64 (no data: prefix)
    const formData = new FormData()
    formData.append('image_file_b64', b64)
    formData.append('size', 'auto')

    const res = await fetch('https://api.remove.bg/v1.0/remove', {
      method: 'POST',
      headers: {
        'X-Api-Key': process.env.REMOVE_BG_API_KEY as string
      },
      body: formData as any
    })

    if (!res.ok) {
      const t = await res.text()
      console.error('remove.bg error:', t)
      return NextResponse.json({ error: 'remove.bg API error', detail: t }, { status: 502 })
    }

    // remove.bg returns binary PNG image in response body
    const arrayBuffer = await res.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const dataUrl = `data:image/png;base64,${buffer.toString('base64')}`

    return NextResponse.json({ image: dataUrl })
  } catch (err) {
    console.error('remove-bg route error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
