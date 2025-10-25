import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import connectDB from '@/lib/mongodb'
import { CV } from '@/models/CV'

// GET - Get all CVs for current user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized. Please login.' },
        { status: 401 }
      )
    }

    await connectDB()

    const cvs = await CV.find({ userEmail: session.user.email })
      .sort({ updatedAt: -1 })
      .select('-__v')

    return NextResponse.json({
      success: true,
      count: cvs.length,
      data: cvs,
    })
  } catch (error: any) {
    console.error('Error fetching CVs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch CVs', details: error.message },
      { status: 500 }
    )
  }
}

// POST - Create new CV
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized. Please login.' },
        { status: 401 }
      )
    }

    const body = await request.json()

    await connectDB()

    // Create new CV with user info
    const newCV = await CV.create({
      ...body,
      userId: session.user.id || session.user.email,
      userEmail: session.user.email,
    })

    return NextResponse.json(
      {
        success: true,
        message: 'CV created successfully',
        data: newCV,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error creating CV:', error)
    return NextResponse.json(
      { error: 'Failed to create CV', details: error.message },
      { status: 500 }
    )
  }
}
