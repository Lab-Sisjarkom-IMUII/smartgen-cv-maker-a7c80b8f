import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import clientPromise from '@/lib/mongodb'
import { authOptions } from '@/lib/auth'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid ID' })
  }

  const session = await getServerSession(req, res, authOptions)
  
  if (!session?.user?.email) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const client = await clientPromise
  const db = client.db('smartgen-cv')
  const historyCollection = db.collection('cv_history')

  if (req.method === 'GET') {
    try {
      const history = await historyCollection
        .find({
          cvId: id,
          userEmail: session.user.email
        })
        .sort({ createdAt: -1 })
        .limit(50)
        .toArray()
      
      return res.status(200).json({ success: true, history })
    } catch (error) {
      console.error('Error fetching CV history:', error)
      return res.status(500).json({ success: false, error: 'Failed to fetch CV history' })
    }
  }

  if (req.method === 'POST') {
    try {
      const { data, description } = req.body
      
      const historyEntry = await historyCollection.insertOne({
        cvId: id,
        userEmail: session.user.email,
        data,
        description: description || 'CV updated',
        createdAt: new Date()
      })

      const insertedHistory = await historyCollection.findOne({ _id: historyEntry.insertedId })
      
      return res.status(200).json({ success: true, history: insertedHistory })
    } catch (error) {
      console.error('Error saving CV history:', error)
      return res.status(500).json({ success: false, error: 'Failed to save CV history' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
