import { NextRequest, NextResponse } from 'next/server'

// This endpoint is now deprecated - photo processing is done client-side
// using @imgly/background-removal (FREE, no API costs!)

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { 
      error: 'Endpoint ini sudah tidak digunakan.',
      message: 'Photo processing sekarang dilakukan di browser (client-side) menggunakan @imgly/background-removal - GRATIS tanpa biaya API!',
      info: 'Gunakan AIPhotoFormatter component langsung, tidak perlu panggil API.'
    },
    { status: 410 } // 410 Gone - endpoint deprecated
  )
}
