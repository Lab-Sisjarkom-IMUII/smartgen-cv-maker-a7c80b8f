import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import connectDB from '@/lib/mongodb'
import { CVHistory } from '@/models/CVHistory'
import { CV } from '@/models/CV'

// GET - Get history for a specific CV
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

    // Verify CV ownership
    const cv = await CV.findOne({
      _id: params.id,
      userEmail: session.user.email,
    })

    if (!cv) {
      return NextResponse.json(
        { error: 'CV not found or access denied' },
        { status: 404 }
      )
    }

    // Get history sorted by version descending
    const history = await CVHistory.find({ cvId: params.id })
      .sort({ version: -1 })
      .select('-__v')
      .limit(20) // Last 20 versions

    return NextResponse.json({
      success: true,
      count: history.length,
      data: history,
    })
  } catch (error: any) {
    console.error('Error fetching CV history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch history', details: error.message },
      { status: 500 }
    )
  }
}

// POST - Create new history snapshot
export async function POST(
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
    const { changeDescription } = body

    await connectDB()

    // Verify CV ownership
    const cv = await CV.findOne({
      _id: params.id,
      userEmail: session.user.email,
    })

    if (!cv) {
      return NextResponse.json(
        { error: 'CV not found or access denied' },
        { status: 404 }
      )
    }

    // Get latest version number
    const latestHistory = await CVHistory.findOne({ cvId: params.id })
      .sort({ version: -1 })
      .select('version')

    const newVersion = latestHistory ? latestHistory.version + 1 : 1

    // Create snapshot
    const snapshot = await CVHistory.create({
      cvId: params.id,
      userId: session.user.id || session.user.email,
      snapshot: cv.toObject(),
      changeDescription: changeDescription || 'Manual save',
      version: newVersion,
    })

    return NextResponse.json(
      {
        success: true,
        message: 'Snapshot created',
        data: snapshot,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error creating snapshot:', error)
    return NextResponse.json(
      { error: 'Failed to create snapshot', details: error.message },
      { status: 500 }
    )
  }
}

// PUT - Restore CV from history version
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
    const { historyId } = body

    if (!historyId) {
      return NextResponse.json(
        { error: 'History ID is required' },
        { status: 400 }
      )
    }

    await connectDB()

    // Get history snapshot
    const history = await CVHistory.findOne({
      _id: historyId,
      cvId: params.id,
      userId: session.user.id || session.user.email,
    })

    if (!history) {
      return NextResponse.json(
        { error: 'History version not found' },
        { status: 404 }
      )
    }

    // Restore CV from snapshot
    const restoredCV = await CV.findOneAndUpdate(
      {
        _id: params.id,
        userEmail: session.user.email,
      },
      { $set: history.snapshot },
      { new: true, runValidators: true }
    )

    if (!restoredCV) {
      return NextResponse.json(
        { error: 'Failed to restore CV' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Restored to version ${history.version}`,
      data: restoredCV,
    })
  } catch (error: any) {
    console.error('Error restoring from history:', error)
    return NextResponse.json(
      { error: 'Failed to restore', details: error.message },
      { status: 500 }
    )
  }
}

// DELETE - Delete specific history version
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

    const { searchParams } = new URL(request.url)
    const historyId = searchParams.get('historyId')

    if (!historyId) {
      return NextResponse.json(
        { error: 'History ID is required' },
        { status: 400 }
      )
    }

    await connectDB()

    const deleted = await CVHistory.findOneAndDelete({
      _id: historyId,
      cvId: params.id,
      userId: session.user.id || session.user.email,
    })

    if (!deleted) {
      return NextResponse.json(
        { error: 'History version not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'History version deleted',
    })
  } catch (error: any) {
    console.error('Error deleting history:', error)
    return NextResponse.json(
      { error: 'Failed to delete history', details: error.message },
      { status: 500 }
    )
  }
}
