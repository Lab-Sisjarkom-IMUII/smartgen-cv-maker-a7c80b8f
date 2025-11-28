import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    console.log('🤖 AI Photo Enhancement API called')

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.error('❌ OpenAI API key not configured')
      return NextResponse.json({
        success: false,
        error: 'OpenAI API key not configured',
        details: 'Please set OPENAI_API_KEY in environment variables'
      }, { status: 500 })
    }

    const body = await request.json()
    const { image, prompt } = body

    if (!image) {
      return NextResponse.json({
        success: false,
        error: 'No image provided'
      }, { status: 400 })
    }

    if (!prompt) {
      return NextResponse.json({
        success: false,
        error: 'No enhancement prompt provided'
      }, { status: 400 })
    }

    console.log('🖼️ Processing image enhancement...')
    console.log('📝 Enhancement prompt:', prompt.substring(0, 100) + '...')

    // Convert data URL to File object for OpenAI API
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '')
    const imageBuffer = Buffer.from(base64Data, 'base64')

    console.log('📊 Image buffer size:', imageBuffer.length, 'bytes')

    // Validate image size (OpenAI has limits)
    if (imageBuffer.length > 4 * 1024 * 1024) { // 4MB limit
      return NextResponse.json({
        success: false,
        error: 'Image too large',
        details: 'Please use an image smaller than 4MB'
      }, { status: 400 })
    }

    // Create a File object from buffer
    const imageFile = new File([imageBuffer], 'image.png', { type: 'image/png' })

    // Use OpenAI DALL-E 2 Image Edit API to enhance the photo
    console.log('🚀 Calling OpenAI DALL-E 2 API...')
    
    const response = await openai.images.edit({
      image: imageFile,
      prompt: prompt,
      n: 1,
      size: '1024x1024',
      response_format: 'b64_json'
    })

    if (!response.data || response.data.length === 0) {
      throw new Error('No image returned from OpenAI')
    }

    const enhancedImageB64 = response.data[0].b64_json
    if (!enhancedImageB64) {
      throw new Error('Invalid response from OpenAI')
    }

    // Convert base64 to data URL
    const enhancedImageDataURL = `data:image/png;base64,${enhancedImageB64}`

    console.log('✅ Image enhancement successful')
    console.log('📏 Enhanced image data length:', enhancedImageDataURL.length)

    return NextResponse.json({
      success: true,
      image: enhancedImageDataURL,
      model: 'dall-e-2',
      note: 'Photo enhanced using OpenAI DALL-E 2 Image Edit API'
    })

  } catch (error: any) {
    console.error('❌ Error in AI photo enhancement:', error)
    
    // Handle specific OpenAI errors
    if (error?.status === 400) {
      return NextResponse.json({
        success: false,
        error: 'Invalid image or prompt',
        details: error.message || 'The image or prompt provided is invalid'
      }, { status: 400 })
    }
    
    if (error?.status === 401) {
      return NextResponse.json({
        success: false,
        error: 'Invalid API key',
        details: 'OpenAI API key is invalid or expired'
      }, { status: 401 })
    }
    
    if (error?.status === 429) {
      return NextResponse.json({
        success: false,
        error: 'Rate limit exceeded',
        details: 'Please try again in a few moments'
      }, { status: 429 })
    }

    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error.message || 'Failed to enhance photo'
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    service: 'AI Photo Enhancement API',
    status: 'active',
    model: 'OpenAI DALL-E 2',
    endpoint: '/api/ai/enhance-photo',
    method: 'POST',
    description: 'Enhance photos using OpenAI DALL-E 2 Image Edit API'
  })
}