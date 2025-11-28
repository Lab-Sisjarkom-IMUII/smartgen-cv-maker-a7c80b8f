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
    const history = await prisma.cVHistory.findMany({
      where: {
        cvId: params.id,
        userEmail: session.user.email
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    })
    
    return NextResponse.json({ success: true, history })
  } catch (error) {
    console.error('Error fetching CV history:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch CV history' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, description } = await request.json()
    
    const historyEntry = await prisma.cVHistory.create({
      data: {
        cvId: params.id,
        userEmail: session.user.email,
        data,
        description: description || 'CV updated'
      }
    })
    
    return NextResponse.json({ success: true, history: historyEntry })
  } catch (error) {
    console.error('Error saving CV history:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to save CV history' },
      { status: 500 }
    )
  }
}
