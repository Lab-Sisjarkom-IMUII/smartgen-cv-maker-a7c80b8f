import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import connectDB from '@/lib/mongodb'
import { CV } from '@/models/CV'

// GET - Get specific CV by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized. Please login.' },
        { status: 401 }
      )
    }

    await connectDB()

    const cv = await CV.findOne({
      _id: params.id,
      userEmail: session.user.email,
    })

    if (!cv) {
      return NextResponse.json(
        { error: 'CV not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: cv,
    })
  } catch (error: any) {
    console.error('Error fetching CV:', error)
    return NextResponse.json(
      { error: 'Failed to fetch CV', details: error.message },
      { status: 500 }
    )
  }
}

// PUT - Update CV
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const updatedCV = await CV.findOneAndUpdate(
      {
        _id: params.id,
        userEmail: session.user.email,
      },
      { $set: body },
      { new: true, runValidators: true }
    )

    if (!updatedCV) {
      return NextResponse.json(
        { error: 'CV not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'CV updated successfully',
      data: updatedCV,
    })
  } catch (error: any) {
    console.error('Error updating CV:', error)
    return NextResponse.json(
      { error: 'Failed to update CV', details: error.message },
      { status: 500 }
    )
  }
}

// DELETE - Delete CV
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized. Please login.' },
        { status: 401 }
      )
    }

    await connectDB()

    const deletedCV = await CV.findOneAndDelete({
      _id: params.id,
      userEmail: session.user.email,
    })

    if (!deletedCV) {
      return NextResponse.json(
        { error: 'CV not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'CV deleted successfully',
    })
  } catch (error: any) {
    console.error('Error deleting CV:', error)
    return NextResponse.json(
      { error: 'Failed to delete CV', details: error.message },
      { status: 500 }
    )
  }
}
