import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const cvs = await prisma.cV.findMany({
      where: { userEmail: session.user.email },
      orderBy: { updatedAt: 'desc' },
      take: 10
    })
    
    return NextResponse.json({ success: true, cvs })
  } catch (error) {
    console.error('Error fetching CVs:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch CVs' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    
    const cv = await prisma.cV.create({
      data: {
        ...data,
        userEmail: session.user.email
      }
    })
    
    return NextResponse.json({ success: true, cv })
  } catch (error) {
    console.error('Error creating CV:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create CV' },
      { status: 500 }
    )
  }
}
