import { NextRequest, NextResponse } from 'next/server'
import Replicate from 'replicate'

// Initialize Replicate
const replicate = process.env.REPLICATE_API_TOKEN
  ? new Replicate({ auth: process.env.REPLICATE_API_TOKEN })
  : null

export async function POST(request: NextRequest) {
  try {
    if (!replicate || !process.env.REPLICATE_API_TOKEN) {
      return NextResponse.json(
        { error: 'AI Photo service tidak tersedia saat ini.' },
        { status: 503 }
      )
    }

    const body = await request.json()
    const { imageUrl, style = 'professional', backgroundColor = 'blue' } = body

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Image URL diperlukan.' },
        { status: 400 }
      )
    }

    // Use professional headshot model
    // This model converts casual photos to professional headshots
    const output = await replicate.run(
      "tencentarc/photomaker:ddfc2b08d209f9fa8c1eca692712918bd449f695dabb4a958da31802a9570fe4",
      {
        input: {
          input_image: imageUrl,
          prompt: `professional passport photo, ${backgroundColor} background, formal attire, business shirt, professional lighting, studio quality, high resolution, clean and sharp`,
          negative_prompt: "casual clothes, t-shirt, messy background, low quality, blurry, dark, shadows",
          num_steps: 20,
          style_strength_ratio: 25,
          num_outputs: 1,
          guidance_scale: 5,
          seed: Math.floor(Math.random() * 1000000)
        }
      }
    )

    return NextResponse.json({
      success: true,
      originalImage: imageUrl,
      professionalImage: Array.isArray(output) ? output[0] : output,
      message: 'Foto berhasil diubah menjadi foto formal!'
    })
  } catch (error: any) {
    console.error('AI Photo error:', error)
    return NextResponse.json(
      { 
        error: 'Gagal mengubah foto. Pastikan foto wajah terlihat jelas.',
        details: error.message 
      },
      { status: 500 }
    )
  }
}
