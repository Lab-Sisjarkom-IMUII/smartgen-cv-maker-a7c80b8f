import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const cv = await prisma.cV.findFirst({
      where: {
        id: params.id,
        userEmail: session.user.email
      }
    })
    
    if (!cv) {
      return NextResponse.json({ error: 'CV not found' }, { status: 404 })
    }
    
    return NextResponse.json({ success: true, cv })
  } catch (error) {
    console.error('Error fetching CV:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch CV' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    
    const cv = await prisma.cV.updateMany({
      where: {
        id: params.id,
        userEmail: session.user.email
      },
      data: {
        ...data,
        updatedAt: new Date()
      }
    })
    
    if (cv.count === 0) {
      return NextResponse.json({ error: 'CV not found' }, { status: 404 })
    }
    
    const updatedCV = await prisma.cV.findUnique({
      where: { id: params.id }
    })
    
    return NextResponse.json({ success: true, cv: updatedCV })
  } catch (error) {
    console.error('Error updating CV:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update CV' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const cv = await prisma.cV.deleteMany({
      where: {
        id: params.id,
        userEmail: session.user.email
      }
    })
    
    if (cv.count === 0) {
      return NextResponse.json({ error: 'CV not found' }, { status: 404 })
    }
    
    return NextResponse.json({ success: true, message: 'CV deleted' })
  } catch (error) {
    console.error('Error deleting CV:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete CV' },
      { status: 500 }
    )
  }
}
