import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

/**
 * Remove background using OpenAI DALL-E 2 Images Edit API
 * Uses creative prompting to simulate background removal
 */
export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'OpenAI API key not configured',
          details: 'Please set OPENAI_API_KEY in environment variables'
        },
        { status: 500 }
      )
    }

    const openai = new OpenAI({ apiKey })

    // Parse request body
    const body = await request.json()
    const { image } = body

    if (!image || typeof image !== 'string') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid request',
          details: 'Image data URL is required'
        },
        { status: 400 }
      )
    }

    console.log('Processing with OpenAI DALL-E...')

    // Extract base64 data from data URL
    const base64Match = image.match(/^data:image\/(png|jpg|jpeg);base64,(.+)$/)
    if (!base64Match) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid image format',
          details: 'Expected data URL format: data:image/png;base64,...'
        },
        { status: 400 }
      )
    }

    const base64Data = base64Match[2]
    const imageBuffer = Buffer.from(base64Data, 'base64')

    // Convert to PNG with mask (DALL-E requires PNG)
    const imageFile = new File([imageBuffer], 'image.png', { type: 'image/png' })
    
    // Create white mask (DALL-E will edit the masked area)
    // We create a full white mask to indicate "remove background everywhere"
    const maskCanvas = await createWhiteMask(imageBuffer)
    const maskBlob = await new Promise<Blob>((resolve, reject) => {
      maskCanvas.toBlob((blob) => {
        if (blob) resolve(blob)
        else reject(new Error('Failed to create mask'))
      }, 'image/png')
    })
    const maskFile = new File([maskBlob], 'mask.png', { type: 'image/png' })

    console.log('Calling OpenAI images.edit API...')

    // Call OpenAI Images Edit API with background removal prompt
    const response = await openai.images.edit({
      model: "dall-e-2",
      image: imageFile,
      mask: maskFile,
      prompt: "Professional studio portrait on pure white seamless background, clean edges, high quality, photorealistic",
      n: 1,
      size: "1024x1024",
      response_format: "b64_json"
    })

    if (!response.data || response.data.length === 0) {
      throw new Error('No image returned from OpenAI')
    }

    const resultBase64 = response.data[0].b64_json
    if (!resultBase64) {
      throw new Error('No base64 data in response')
    }

    const resultDataUrl = `data:image/png;base64,${resultBase64}`

    console.log('Background processed successfully with DALL-E')

    return NextResponse.json({
      success: true,
      image: resultDataUrl,
      model: 'dall-e-2',
      note: 'Background replaced with white studio background'
    })
  } catch (error: any) {
    console.error('Error in OpenAI API:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'OpenAI API error',
        details: error.message || String(error)
      },
      { status: 500 }
    )
  }
}

/**
 * Create white mask for DALL-E edit
 */
async function createWhiteMask(imageBuffer: Buffer): Promise<HTMLCanvasElement> {
  // This would normally run in browser, but for server we need node-canvas or similar
  // For now, return a simple implementation
  // In production, you'd use sharp or jimp for server-side image manipulation
  
  const { createCanvas, loadImage } = await import('canvas')
  const img = await loadImage(imageBuffer)
  
  const canvas = createCanvas(img.width, img.height)
  const ctx = canvas.getContext('2d')
  
  // Fill with white (DALL-E will edit this area)
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  
  return canvas as any
}
