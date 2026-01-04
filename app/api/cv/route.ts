import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
// MongoDB disabled for static deployment
// import clientPromise from '@/lib/mongodb'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Database disabled for static deployment - return empty array
    return NextResponse.json([])

    /* MongoDB code disabled
    const client = await clientPromise
    
    // Handle case when MongoDB is not configured (static deployment)
    if (!client) {
      return NextResponse.json([])
    }
    
    const db = client.db('cv-maker')
    
    const cvs = await db.collection('cvs').find({ 
      userEmail: session.user.email 
    }).toArray()

    return NextResponse.json(cvs)
    */
  } catch (error) {
    console.error('CV fetch error:', error)
    return NextResponse.json({ error: 'Database not available', data: [] }, { status: 503 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const cvData = await request.json()
    
    // Database disabled for static deployment - return temp response
    return NextResponse.json({ 
      id: 'temp_' + Date.now(), 
      ...cvData,
      userEmail: session.user.email,
      createdAt: new Date(),
      updatedAt: new Date(),
      _isTemporary: true
    })

    /* MongoDB code disabled
    const client = await clientPromise
    
    // Handle case when MongoDB is not configured (static deployment)
    if (!client) {
      // Return success but with temp ID for client-side storage
      return NextResponse.json({ 
        id: 'temp_' + Date.now(), 
        ...cvData,
        userEmail: session.user.email,
        createdAt: new Date(),
        updatedAt: new Date(),
        _isTemporary: true
      })
    }
    
    const db = client.db('cv-maker')
    
    const newCV = {
      ...cvData,
      userEmail: session.user.email,
      userId: session.user.id,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    const result = await db.collection('cvs').insertOne(newCV)
    
    return NextResponse.json({ 
      id: result.insertedId, 
      ...newCV 
    })
    */
  } catch (error) {
    console.error('CV save error:', error)
    return NextResponse.json({ error: 'Database not available' }, { status: 503 })
  }
}