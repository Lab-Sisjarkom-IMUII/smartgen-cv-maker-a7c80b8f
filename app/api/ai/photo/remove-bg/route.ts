import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OPENAI_API_KEY not configured on server' }, { status: 403 })
    }

    const body = await request.json()
    const { image } = body // expect data URL string (data:image/..;base64,...)

    if (!image || typeof image !== 'string' || !image.startsWith('data:')) {
      return NextResponse.json({ error: 'Invalid image payload' }, { status: 400 })
    }

    // Extract base64 portion
    const matches = image.match(/^data:(.+);base64,(.+)$/)
    if (!matches) {
      return NextResponse.json({ error: 'Invalid data URL' }, { status: 400 })
    }

    const mime = matches[1]
    const b64 = matches[2]
    const buffer = Buffer.from(b64, 'base64')

    // Build multipart form data
    const formData = new FormData()
    // Convert buffer to Blob (Node 18+ provides global Blob)
    const blob = new Blob([buffer], { type: mime })
    formData.append('image', blob, 'upload.png')
    formData.append('prompt', 'Remove the background from this photo and return a PNG with a transparent background, preserving the person and fine hair details. Return a single PNG image.')
    formData.append('size', '1024x1024')

    const res = await fetch('https://api.openai.com/v1/images/edits', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: formData as any
    })

    if (!res.ok) {
      const t = await res.text()
      console.error('OpenAI images/edits error:', t)
      return NextResponse.json({ error: 'OpenAI images API error' }, { status: 502 })
    }

    const json = await res.json()
    // Response contains b64_json in data[0].b64_json
    const b64json = json?.data?.[0]?.b64_json
    if (!b64json) {
      console.error('OpenAI images response missing b64_json', json)
      return NextResponse.json({ error: 'Invalid OpenAI response' }, { status: 502 })
    }

    const dataUrl = `data:image/png;base64,${b64json}`

    return NextResponse.json({ image: dataUrl })
  } catch (err) {
    console.error('remove-bg route error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
