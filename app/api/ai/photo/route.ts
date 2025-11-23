import { NextRequest, NextResponse } from 'next/server'

// This endpoint is no longer needed - processing is done client-side
// Using @imgly/background-removal library (FREE, no API costs!)

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { 
      message: 'Photo processing sekarang dilakukan di browser (client-side) menggunakan @imgly/background-removal - GRATIS tanpa biaya API!',
      info: 'Gunakan AIPhotoFormatter component langsung, tidak perlu panggil API.'
    },
    { status: 200 }
  )
}
