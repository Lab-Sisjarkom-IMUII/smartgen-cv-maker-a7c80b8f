import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions)
  
  if (!session?.user?.email) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  if (req.method === 'GET') {
    try {
      const cvs = await prisma.cV.findMany({
        where: { userEmail: session.user.email },
        orderBy: { updatedAt: 'desc' },
        take: 10
      })

      return res.status(200).json({ success: true, cvs })
    } catch (error) {
      console.error('Error fetching CVs:', error)
      return res.status(500).json({ success: false, error: 'Failed to fetch CVs' })
    }
  }

  if (req.method === 'POST') {
    try {
      const data = req.body

      const newCV = await prisma.cV.create({
        data: {
          ...data,
          userEmail: session.user.email
        }
      })

      return res.status(201).json({ success: true, cv: newCV })
    } catch (error) {
      console.error('Error creating CV:', error)
      return res.status(500).json({ success: false, error: 'Failed to create CV' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
