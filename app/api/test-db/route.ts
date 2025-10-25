import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import mongoose from 'mongoose'

export async function GET(request: NextRequest) {
  try {
    // Test connection
    await connectDB()
    
    const status = mongoose.connection.readyState
    const statusText = ['disconnected', 'connected', 'connecting', 'disconnecting'][status]
    
    return NextResponse.json({
      success: true,
      message: '✅ MongoDB connection successful!',
      status: statusText,
      database: mongoose.connection.name,
      host: mongoose.connection.host,
    })
  } catch (error: any) {
    console.error('MongoDB connection error:', error)
    return NextResponse.json(
      {
        success: false,
        message: '❌ MongoDB connection failed',
        error: error.message,
      },
      { status: 500 }
    )
  }
}
