import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

// This route uses OpenAI DALL-E (gpt-image-1) to edit/remove background from images.
// Set environment variable OPENAI_API_KEY with your OpenAI API key.
export async function POST(request: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OPENAI_API_KEY not configured on server' }, { status: 403 })
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

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

    // Convert base64 to Buffer for OpenAI
    const imageBuffer = Buffer.from(b64, 'base64')
    
    // Create a File object from the buffer
    const file = new File([imageBuffer], 'image.png', { type: mime })

    // Use OpenAI Images Edit API to remove background
    // This uses DALL-E 2 model for image editing
    const response = await openai.images.edit({
      image: file,
      prompt: "Remove the background, make it transparent. Keep only the person/subject in the foreground with clean edges.",
      n: 1,
      size: "1024x1024",
      response_format: "b64_json"
    })

    if (!response.data || !response.data[0]?.b64_json) {
      return NextResponse.json({ error: 'OpenAI did not return image data' }, { status: 502 })
    }

    // Return as data URL
    const dataUrl = `data:image/png;base64,${response.data[0].b64_json}`

    return NextResponse.json({ image: dataUrl })
  } catch (err: any) {
    console.error('OpenAI image edit error:', err)
    return NextResponse.json({ 
      error: 'OpenAI API error', 
      detail: err?.message || 'Unknown error' 
    }, { status: 500 })
  }
}
