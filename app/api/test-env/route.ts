import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({
    hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
    hasGoogleSecret: !!process.env.GOOGLE_CLIENT_SECRET,
    hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
    hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
    nextAuthUrl: process.env.NEXTAUTH_URL,
    // Just show first/last chars for security
    googleClientIdPreview: process.env.GOOGLE_CLIENT_ID 
      ? `${process.env.GOOGLE_CLIENT_ID.substring(0, 12)}...${process.env.GOOGLE_CLIENT_ID.slice(-12)}`
      : 'NOT SET',
    nodeEnv: process.env.NODE_ENV,
  })
}
