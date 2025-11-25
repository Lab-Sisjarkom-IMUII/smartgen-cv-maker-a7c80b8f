import { NextRequest, NextResponse } from 'next/server'

/**
 * Remove background using Remove.bg API
 * Requires REMOVE_BG_API_KEY environment variable
 */
export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.REMOVE_BG_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Remove.bg API key not configured',
          details: 'Please set REMOVE_BG_API_KEY in environment variables'
        },
        { status: 500 }
      )
    }

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

    console.log('Sending to Remove.bg API, size:', imageBuffer.length, 'bytes')

    // Call Remove.bg API
    const formData = new FormData()
    const blob = new Blob([imageBuffer], { type: 'image/png' })
    formData.append('image_file', blob, 'image.png')
    formData.append('size', 'auto')

    const response = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: {
        'X-Api-Key': apiKey,
      },
      body: formData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Remove.bg API error:', response.status, errorText)
      
      let errorMessage = 'Remove.bg API error'
      try {
        const errorJson = JSON.parse(errorText)
        errorMessage = errorJson.errors?.[0]?.title || errorMessage
      } catch (e) {
        // Use default error message
      }

      return NextResponse.json(
        { 
          success: false, 
          error: errorMessage,
          details: `Status ${response.status}: ${errorText.substring(0, 200)}`
        },
        { status: response.status }
      )
    }

    // Get result as buffer
    const resultBuffer = await response.arrayBuffer()
    const resultBase64 = Buffer.from(resultBuffer).toString('base64')
    const resultDataUrl = `data:image/png;base64,${resultBase64}`

    console.log('Background removed successfully, result size:', resultBuffer.byteLength, 'bytes')

    return NextResponse.json({
      success: true,
      image: resultDataUrl,
      credits_charged: response.headers.get('X-Credits-Charged') || 'unknown',
    })
  } catch (error: any) {
    console.error('Error in remove-bg API:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Server error',
        details: error.message || String(error)
      },
      { status: 500 }
    )
  }
}
