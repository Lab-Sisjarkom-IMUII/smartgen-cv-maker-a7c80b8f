import { NextResponse } from 'next/server'

export async function GET() {
  // Check if environment variables are loaded
  const envCheck = {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL ? '✅ Set' : '❌ Not Set',
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? '✅ Set' : '❌ Not Set',
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? '✅ Set' : '❌ Not Set',
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? '✅ Set' : '❌ Not Set',
    OPENAI_API_KEY: process.env.OPENAI_API_KEY ? '✅ Set' : '❌ Not Set',
    NODE_ENV: process.env.NODE_ENV,
  }

  return NextResponse.json(envCheck)
}
