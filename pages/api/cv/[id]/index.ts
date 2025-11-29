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
      const cv = await prisma.cV.findFirst({
        where: {
          id,
          userEmail: session.user.email
        }
      })

      if (!cv) {
        return res.status(404).json({ error: 'CV not found' })
      }

      return res.status(200).json({ success: true, cv })
    } catch (error) {
      console.error('Error fetching CV:', error)
      return res.status(500).json({ success: false, error: 'Failed to fetch CV' })
    }
  }

  if (req.method === 'PUT') {
    try {
      const data = req.body

      const updatedCV = await prisma.cV.updateMany({
        where: {
          id,
          userEmail: session.user.email
        },
        data
      })

      if (updatedCV.count === 0) {
        return res.status(404).json({ error: 'CV not found' })
      }

      return res.status(200).json({ success: true })
    } catch (error) {
      console.error('Error updating CV:', error)
      return res.status(500).json({ success: false, error: 'Failed to update CV' })
    }
  }

  if (req.method === 'DELETE') {
    try {
      const deletedCV = await prisma.cV.deleteMany({
        where: {
          id,
          userEmail: session.user.email
        }
      })

      if (deletedCV.count === 0) {
        return res.status(404).json({ error: 'CV not found' })
      }

      return res.status(200).json({ success: true })
    } catch (error) {
      console.error('Error deleting CV:', error)
      return res.status(500).json({ success: false, error: 'Failed to delete CV' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
