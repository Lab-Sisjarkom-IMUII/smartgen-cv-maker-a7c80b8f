import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
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

  if (req.method === 'GET') {
    try {
      const history = await prisma.cVHistory.findMany({
        where: {
          cvId: id,
          userEmail: session.user.email
        },
        orderBy: { createdAt: 'desc' },
        take: 50
      })
      
      return res.status(200).json({ success: true, history })
    } catch (error) {
      console.error('Error fetching CV history:', error)
      return res.status(500).json({ success: false, error: 'Failed to fetch CV history' })
    }
  }

  if (req.method === 'POST') {
    try {
      const { data, description } = req.body
      
      const historyEntry = await prisma.cVHistory.create({
        data: {
          cvId: id,
          userEmail: session.user.email,
          data,
          description: description || 'CV updated'
        }
      })
      
      return res.status(200).json({ success: true, history: historyEntry })
    } catch (error) {
      console.error('Error saving CV history:', error)
      return res.status(500).json({ success: false, error: 'Failed to save CV history' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
