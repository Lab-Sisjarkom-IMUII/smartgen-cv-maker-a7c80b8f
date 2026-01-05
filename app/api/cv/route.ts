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
    return NextResponse.json({ success: true, cvs: [] })

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
    const newCV = { 
      _id: 'temp_' + Date.now(), 
      ...cvData,
      userEmail: session.user.email,
      createdAt: new Date(),
      updatedAt: new Date(),
      _isTemporary: true
    }
    
    return NextResponse.json({ 
      success: true, 
      data: newCV 
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

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'CV ID required for deletion' }, { status: 400 })
    }

    // Database disabled for static deployment - return success response
    return NextResponse.json({ 
      success: true,
      id: id,
      message: 'CV deleted successfully',
      _isTemporary: true,
      _operation: 'deleted'
    })

    /* MongoDB code for when database is enabled
    const client = await clientPromise
    
    if (!client) {
      return NextResponse.json({ 
        success: true,
        id: id,
        message: 'CV deleted (temp mode)',
        _isTemporary: true
      })
    }
    
    const db = client.db('cv-maker')
    
    const result = await db.collection('cvs').deleteOne({ 
      _id: new ObjectId(id), 
      userEmail: session.user.email 
    })
    
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'CV not found or access denied' }, { status: 404 })
    }
    
    return NextResponse.json({ 
      success: true,
      id: id,
      message: 'CV deleted successfully'
    })
    */
  } catch (error) {
    console.error('CV delete error:', error)
    return NextResponse.json({ error: 'Database not available' }, { status: 503 })
  }
}