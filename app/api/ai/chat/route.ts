import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

// Initialize OpenAI only if API key is available
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null

// Rate limiting configuration
const RATE_LIMIT = {
  maxRequestsPerMinute: 10,  // Max 10 requests per minute per user
  maxTokensPerRequest: 500,   // Limit response length to save cost
  maxContextMessages: 5,      // Only keep last 5 messages for context
}

// Simple in-memory rate limiting (for production, use Redis/database)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const userLimit = rateLimitMap.get(ip)

  if (!userLimit || now > userLimit.resetTime) {
    // Reset or create new limit
    rateLimitMap.set(ip, { count: 1, resetTime: now + 60000 }) // 1 minute
    return true
  }

  if (userLimit.count >= RATE_LIMIT.maxRequestsPerMinute) {
    return false // Rate limit exceeded
  }

  userLimit.count++
  return true
}

export async function POST(request: NextRequest) {
  try {
    // Get user IP for rate limiting
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown'

    // Check rate limit
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Terlalu banyak request. Tunggu sebentar ya! ⏳' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { message, conversationHistory } = body

    let response: string | null = null

    // Check if OpenAI is available
    if (openai && process.env.OPENAI_API_KEY) {
      // Limit conversation history to save tokens and cost
      const limitedHistory = conversationHistory.slice(-RATE_LIMIT.maxContextMessages)
      
      // Create conversation context for OpenAI
      const messages = [
        {
          role: 'system',
          content: `Anda adalah AI Assistant untuk SmartGen CV Maker. Tugas Anda adalah:
1. Membantu pengguna membuat CV profesional
2. Mengekstrak informasi CV dari percakapan (nama, pengalaman, pendidikan, skill, dll)
3. Memberikan saran untuk meningkatkan CV
4. Berbicara dalam bahasa Indonesia yang ramah dan profesional

Format respons:
- Berikan saran yang konstruktif dan ringkas
- Jika ada informasi CV yang lengkap, ekstrak dan struktur data tersebut
- Tanyakan detail yang kurang jika diperlukan
- Berikan tips untuk membuat CV yang menarik`
        },
        ...limitedHistory.map((msg: any) => ({
          role: msg.role,
          content: msg.content
        })),
        {
          role: 'user',
          content: message
        }
      ]

      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',  // Use GPT-3.5 (cheaper than GPT-4)
        messages: messages as any,
        max_tokens: RATE_LIMIT.maxTokensPerRequest,  // Limit response length
        temperature: 0.7,
      })

      response = completion.choices[0].message.content
    } else {
      // Fallback response when OpenAI is not available
      response = generateFallbackResponse(message)
    }

    // Try to extract CV data from the conversation
    let cvData = null
    if (message.toLowerCase().includes('nama') || 
        message.toLowerCase().includes('pengalaman') || 
        message.toLowerCase().includes('pendidikan') || 
        message.toLowerCase().includes('skill')) {
      
      // Simple extraction logic - in a real app, you'd use more sophisticated NLP
      cvData = {
        personalInfo: {
          name: extractName(message),
          email: extractEmail(message),
          phone: extractPhone(message),
          address: extractAddress(message)
        },
        experience: extractExperience(message),
        education: extractEducation(message),
        skills: extractSkills(message),
        summary: extractSummary(message)
      }
    }

    return NextResponse.json({
      response,
      cvData
    })

  } catch (error: any) {
    console.error('AI Chat API error:', error)
    
    // Return a friendly fallback response
    return NextResponse.json({
      response: 'Maaf, terjadi kesalahan saat memproses pesan Anda. Silakan coba lagi atau lanjutkan dengan mengisi form CV secara manual.',
      cvData: null,
      warning: 'Terjadi kesalahan pada sistem AI. Anda masih bisa mengisi CV secara manual.'
    })
  }
}

// Helper functions for data extraction
function extractName(text: string): string {
  const nameMatch = text.match(/(?:nama|saya|saya adalah)\s+([A-Za-z\s]+)/i)
  return nameMatch ? nameMatch[1].trim() : ''
}

function extractEmail(text: string): string {
  const emailMatch = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/)
  return emailMatch ? emailMatch[1] : ''
}

function extractPhone(text: string): string {
  const phoneMatch = text.match(/(\+?[\d\s\-\(\)]{10,})/)
  return phoneMatch ? phoneMatch[1] : ''
}

function extractAddress(text: string): string {
  // Simple address extraction - could be improved
  return ''
}

function extractExperience(text: string): any[] {
  const experienceKeywords = ['pengalaman', 'kerja', 'bekerja', 'perusahaan', 'posisi', 'jabatan']
  const hasExperience = experienceKeywords.some(keyword => 
    text.toLowerCase().includes(keyword)
  )
  
  if (hasExperience) {
    return [{
      company: 'Perusahaan yang disebutkan',
      position: 'Posisi yang disebutkan',
      duration: 'Durasi yang disebutkan',
      description: 'Deskripsi pengalaman'
    }]
  }
  
  return []
}

function extractEducation(text: string): any[] {
  const educationKeywords = ['pendidikan', 'lulusan', 'universitas', 'sekolah', 'jurusan', 'fakultas']
  const hasEducation = educationKeywords.some(keyword => 
    text.toLowerCase().includes(keyword)
  )
  
  if (hasEducation) {
    return [{
      institution: 'Institusi yang disebutkan',
      degree: 'Gelar yang disebutkan',
      field: 'Bidang studi yang disebutkan',
      year: 'Tahun lulus'
    }]
  }
  
  return []
}

function extractSkills(text: string): string[] {
  const skillKeywords = ['skill', 'kemampuan', 'keahlian', 'teknologi', 'bahasa pemrograman']
  const hasSkills = skillKeywords.some(keyword => 
    text.toLowerCase().includes(keyword)
  )
  
  if (hasSkills) {
    // Extract skills mentioned in the text
    const skills = text.match(/(?:skill|kemampuan|keahlian)[\s\S]*?(?=\n|$)/i)
    return skills ? [skills[0].trim()] : []
  }
  
  return []
}

function extractSummary(text: string): string {
  // Extract a brief summary from the text
  return text.length > 100 ? text.substring(0, 100) + '...' : text
}

function generateFallbackResponse(message: string): string {
  const lowerMessage = message.toLowerCase()
  
  // Check for greetings
  if (lowerMessage.includes('halo') || lowerMessage.includes('hai') || lowerMessage.includes('hello')) {
    return 'Halo! Saya siap membantu Anda membuat CV profesional. Silakan ceritakan tentang diri Anda - nama, pengalaman kerja, pendidikan, dan keahlian yang Anda miliki.'
  }
  
  // Check for name
  if (lowerMessage.includes('nama')) {
    return 'Bagus! Informasi nama Anda sudah saya catat. Sekarang, bisakah Anda ceritakan tentang pengalaman kerja Anda? Misalnya, di perusahaan mana Anda bekerja, posisi apa, dan berapa lama?'
  }
  
  // Check for experience
  if (lowerMessage.includes('pengalaman') || lowerMessage.includes('kerja') || lowerMessage.includes('bekerja')) {
    return 'Terima kasih atas informasi pengalaman kerja Anda! Pengalaman tersebut akan sangat bagus untuk CV Anda. Sekarang, bisakah Anda ceritakan tentang latar belakang pendidikan Anda? Dari universitas mana dan jurusan apa?'
  }
  
  // Check for education
  if (lowerMessage.includes('pendidikan') || lowerMessage.includes('lulusan') || lowerMessage.includes('universitas')) {
    return 'Sempurna! Latar belakang pendidikan Anda sudah saya catat. Sekarang, apa saja keahlian atau skill yang Anda kuasai? Misalnya bahasa pemrograman, tools, atau soft skills?'
  }
  
  // Check for skills
  if (lowerMessage.includes('skill') || lowerMessage.includes('keahlian') || lowerMessage.includes('kemampuan')) {
    return 'Bagus sekali! Keahlian Anda sudah saya catat. Informasi yang Anda berikan sudah cukup lengkap. Anda bisa melanjutkan ke bagian form untuk menambahkan detail lebih lanjut. Jika ada yang ingin ditambahkan, silakan beritahu saya!'
  }
  
  // Default response
  return 'Terima kasih atas informasinya! Saya telah mencatat detail yang Anda berikan. Silakan lanjutkan dengan informasi lainnya, atau Anda bisa langsung mengisi form CV yang tersedia. Apakah ada yang ingin Anda tambahkan?'
}
