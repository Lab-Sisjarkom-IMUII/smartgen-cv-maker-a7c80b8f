import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

export async function POST(request: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY not configured' },
        { status: 403 }
      )
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    const body = await request.json()
    const { image, background } = body

    if (!image || typeof image !== 'string' || !image.startsWith('data:')) {
      return NextResponse.json(
        { error: 'Invalid image data. Expected data URL format.' },
        { status: 400 }
      )
    }

    if (!background || typeof background !== 'string' || background.trim() === '') {
      return NextResponse.json(
        { error: 'Background description is required' },
        { status: 400 }
      )
    }

    // Extract base64 from data URL
    const matches = image.match(/^data:(.+);base64,(.+)$/)
    if (!matches) {
      return NextResponse.json(
        { error: 'Invalid data URL format' },
        { status: 400 }
      )
    }

    const mime = matches[1]
    const b64 = matches[2]

    // Convert base64 to Buffer
    const imageBuffer = Buffer.from(b64, 'base64')
    
    // Create File object - always use PNG mime type for OpenAI compatibility
    const file = new File([imageBuffer], 'photo.png', { type: 'image/png' })

    // Create prompt
    const prompt = `Ganti background pada gambar ini dengan background: ${background}.
Jangan mengubah wajah, rambut, kulit, kacamata, atau pakaian sama sekali.
Pertahankan semua detail orang dengan jelas dan natural.
Edit hanya area background.
Buat hasil yang rapi, natural, dan bebas dari warna bocor ke tubuh.
Jika batas antara orang dan background tidak jelas, perhalus secara otomatis.`

    console.log(`[${new Date().toISOString()}] Processing background change: "${background}"`)

    // Call OpenAI Images Edit API
    const response = await openai.images.edit({
      image: file,
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      response_format: "b64_json"
    })

    if (!response.data || !response.data[0]?.b64_json) {
      throw new Error('OpenAI did not return image data')
    }

    // Return as data URL
    const resultDataUrl = `data:image/png;base64,${response.data[0].b64_json}`

    console.log(`[${new Date().toISOString()}] Background change completed successfully`)

    return NextResponse.json({
      success: true,
      image: resultDataUrl,
      message: 'Background changed successfully'
    })

  } catch (error: any) {
    console.error('Error changing background:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to change background',
        details: error?.message || 'Unknown error'
      },
      { status: 500 }
    )
  }
}
