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
    let cvData = null

    // Prepare full conversation for extraction
    const fullConversation = conversationHistory
      .map((msg: any) => msg.content)
      .join(' ') + ' ' + message

    // Check if there's relevant CV info
    const hasRelevantInfo = 
      fullConversation.toLowerCase().includes('nama') || 
      fullConversation.toLowerCase().includes('saya') ||
      fullConversation.toLowerCase().includes('pengalaman') || 
      fullConversation.toLowerCase().includes('pendidikan') || 
      fullConversation.toLowerCase().includes('skill')

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

      // Use direct fetch to OpenAI API instead of SDK to avoid connection issues in some server environments
      try {
        const payload = {
          model: 'gpt-3.5-turbo',
          messages: messages,
          max_tokens: RATE_LIMIT.maxTokensPerRequest,
          temperature: 0.7
        }

        const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
          },
          body: JSON.stringify(payload)
        })

        const openaiJson = await openaiRes.json()
        response = openaiJson?.choices?.[0]?.message?.content || null
        if (!response && openaiJson?.error) {
          throw new Error(openaiJson.error.message || 'OpenAI API error')
        }
      } catch (fetchErr) {
        // If direct fetch fails, fallback to SDK call (if available) to capture more details
        console.warn('Direct fetch to OpenAI failed, attempting SDK call as fallback', fetchErr)
        const completion = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: messages as any,
          max_tokens: RATE_LIMIT.maxTokensPerRequest,
          temperature: 0.7
        })
        response = completion.choices[0].message.content
      }
      
      // NEW: Ask OpenAI to also extract structured CV data
      if (hasRelevantInfo) {
        try {
          const extractionPrompt = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
              {
                role: 'system',
                content: 'Extract CV data from conversation into JSON format. Return ONLY valid JSON with fields: personalInfo (name, email, phone, address, summary), experiences (array with company, position, duration, description), education (array with institution, degree, field, year), skills (array of strings). If field not found, use empty string/array. DO NOT include placeholder text like "Informasi dari chat".'
              },
              {
                role: 'user',
                content: fullConversation
              }
            ],
            max_tokens: 500,
            temperature: 0.1,
          })
          
          const jsonResponse = extractionPrompt.choices[0].message.content
          if (jsonResponse) {
            try {
              const extracted = JSON.parse(jsonResponse.replace(/```json|```/g, '').trim())
              if (extracted && typeof extracted === 'object') {
                cvData = extracted
                console.log('OpenAI Extracted CV Data:', JSON.stringify(cvData, null, 2))
              }
            } catch (parseError) {
              console.error('Failed to parse OpenAI extraction:', parseError)
            }
          }
        } catch (extractError) {
          console.error('OpenAI extraction failed, using fallback:', extractError)
        }
      }
    } else {
      // Fallback response when OpenAI is not available
      response = generateFallbackResponse(message)
    }

    // Only use manual extraction if OpenAI extraction failed
    if (!cvData && hasRelevantInfo) {
      // Extract from full conversation context
      const extractedData = {
        personalInfo: {
          name: extractName(fullConversation),
          email: extractEmail(fullConversation),
          phone: extractPhone(fullConversation),
          address: extractAddress(fullConversation),
          summary: extractSummary(fullConversation)
        },
        experiences: extractExperience(fullConversation),
        education: extractEducation(fullConversation),
        skills: extractSkills(fullConversation)
      }
      
      // Only return cvData if at least name or some content is extracted
      if (extractedData.personalInfo.name || 
          extractedData.experiences.length > 0 || 
          extractedData.education.length > 0 || 
          extractedData.skills.length > 0) {
        cvData = extractedData
        console.log('Manual Extracted CV Data:', JSON.stringify(cvData, null, 2))
      }
    }

    console.log('API Response:', { 
      hasResponse: !!response, 
      hasCvData: !!cvData,
      cvDataKeys: cvData ? Object.keys(cvData) : []
    })

    return NextResponse.json({
      response,
      cvData
    })

  } catch (error: any) {
    console.error('AI Chat API error:', error)
    
    // Return a friendly fallback response. Do NOT expose internal error details to clients in production.
    return NextResponse.json({
      response: 'Maaf, terjadi kesalahan saat memproses pesan Anda. Silakan coba lagi atau lanjutkan dengan mengisi form CV secara manual.',
      cvData: null,
      warning: 'Terjadi kesalahan pada sistem AI. Anda masih bisa mengisi CV secara manual.'
    })
  }
}

// Helper functions for data extraction
function extractName(text: string): string {
  // Try multiple patterns to extract name
  const patterns = [
    /(?:nama\s+(?:saya|aku|adalah|:)?\s*)([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
    /(?:saya\s+(?:adalah|bernama)?\s*)([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
    /(?:perkenalkan|introduce)\s+(?:nama\s+)?(?:saya\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
  ]
  
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      const name = match[1].trim()
      // Validate name (should be 2-50 chars, letters and spaces only)
      if (name.length >= 2 && name.length <= 50 && /^[A-Za-z\s]+$/.test(name)) {
        return name
      }
    }
  }
  return ''
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
  const experienceKeywords = ['pengalaman', 'kerja', 'bekerja', 'perusahaan', 'posisi', 'jabatan', 'pekerjaan', 'karir']
  const hasExperience = experienceKeywords.some(keyword => 
    text.toLowerCase().includes(keyword)
  )
  
  if (hasExperience) {
    const experiences = []
    
    // Try to extract company names
    const companyPatterns = [
      /(?:di|pada|perusahaan)\s+([A-Z][A-Za-z\s&.]+?)(?:\s+sebagai|\s+selama|\.|,|$)/gi,
      /(?:bekerja\s+di|kerja\s+di)\s+([A-Z][A-Za-z\s&.]+?)(?:\s+sebagai|\s+selama|\.|,|$)/gi,
    ]
    
    let company = ''
    for (const pattern of companyPatterns) {
      const match = text.match(pattern)
      if (match && match[0]) {
        company = match[0].replace(/(?:di|pada|perusahaan|bekerja\s+di|kerja\s+di)\s+/i, '')
          .replace(/\s+(?:sebagai|selama).*/i, '')
          .trim()
        break
      }
    }
    
    // Try to extract position
    const positionPatterns = [
      /(?:sebagai|posisi|jabatan)\s+([A-Za-z\s]+?)(?:\s+di|\s+pada|\s+selama|\.|,|$)/gi,
      /(?:bekerja\s+sebagai|kerja\s+sebagai)\s+([A-Za-z\s]+?)(?:\s+di|\s+pada|\s+selama|\.|,|$)/gi,
    ]
    
    let position = ''
    for (const pattern of positionPatterns) {
      const match = text.match(pattern)
      if (match && match[0]) {
        position = match[0].replace(/(?:sebagai|posisi|jabatan|bekerja\s+sebagai|kerja\s+sebagai)\s+/i, '')
          .replace(/\s+(?:di|pada|selama).*/i, '')
          .trim()
        break
      }
    }
    
    // Try to extract duration
    const durationPatterns = [
      /(\d+)\s*(?:tahun)/gi,
      /(\d+)\s*(?:bulan)/gi,
      /(?:selama|pengalaman)\s+(\d+)\s*(?:tahun|bulan)/gi,
    ]
    
    let duration = ''
    for (const pattern of durationPatterns) {
      const match = text.match(pattern)
      if (match) {
        duration = match[0].trim()
        break
      }
    }
    
    if (company || position) {
      experiences.push({
        company: company || 'Nama Perusahaan',
        position: position || 'Posisi',
        duration: duration || 'Durasi',
        description: text.substring(0, 200) // Take relevant portion
      })
    } else {
      // Fallback: at least indicate there's experience mentioned
      experiences.push({
        company: 'Informasi perusahaan dari chat',
        position: 'Informasi posisi dari chat',
        duration: 'Informasi durasi dari chat',
        description: 'Silakan edit dan lengkapi detail pengalaman kerja Anda'
      })
    }
    
    return experiences
  }
  
  return []
}

function extractEducation(text: string): any[] {
  const educationKeywords = ['pendidikan', 'lulusan', 'universitas', 'sekolah', 'jurusan', 'fakultas', 'kuliah', 'kampus', 'institusi']
  const hasEducation = educationKeywords.some(keyword => 
    text.toLowerCase().includes(keyword)
  )
  
  if (hasEducation) {
    const educations = []
    
    // Try to extract institution
    const institutionPatterns = [
      /(?:dari|di|universitas|kampus)\s+([A-Z][A-Za-z\s]+?)(?:\s+jurusan|\s+fakultas|\.|,|$)/gi,
      /(?:lulusan)\s+([A-Z][A-Za-z\s]+?)(?:\s+jurusan|\s+fakultas|\.|,|$)/gi,
    ]
    
    let institution = ''
    for (const pattern of institutionPatterns) {
      const match = text.match(pattern)
      if (match && match[0]) {
        institution = match[0].replace(/(?:dari|di|universitas|kampus|lulusan)\s+/i, '')
          .replace(/\s+(?:jurusan|fakultas).*/i, '')
          .trim()
        break
      }
    }
    
    // Try to extract field/major
    const fieldPatterns = [
      /(?:jurusan|prodi|program studi|fakultas)\s+([A-Za-z\s]+?)(?:\s+di|\s+pada|\.|,|$)/gi,
    ]
    
    let field = ''
    for (const pattern of fieldPatterns) {
      const match = text.match(pattern)
      if (match && match[0]) {
        field = match[0].replace(/(?:jurusan|prodi|program studi|fakultas)\s+/i, '')
          .replace(/\s+(?:di|pada).*/i, '')
          .trim()
        break
      }
    }
    
    // Try to extract degree
    const degreePatterns = [
      /(S1|S2|S3|D3|D4|Sarjana|Master|Doktor)/gi,
    ]
    
    let degree = ''
    for (const pattern of degreePatterns) {
      const match = text.match(pattern)
      if (match) {
        degree = match[0]
        break
      }
    }
    
    if (institution || field) {
      educations.push({
        institution: institution || 'Nama Institusi',
        degree: degree || 'Gelar',
        field: field || 'Bidang Studi',
        year: 'Tahun Lulus'
      })
    } else {
      // Fallback
      educations.push({
        institution: 'Informasi pendidikan dari chat',
        degree: 'Gelar',
        field: 'Bidang studi',
        year: 'Tahun'
      })
    }
    
    return educations
  }
  
  return []
}

function extractSkills(text: string): string[] {
  const skillKeywords = ['skill', 'kemampuan', 'keahlian', 'teknologi', 'bahasa pemrograman', 'menguasai', 'mahir']
  const hasSkills = skillKeywords.some(keyword => 
    text.toLowerCase().includes(keyword)
  )
  
  if (hasSkills) {
    const skills: string[] = []
    
    // Common programming languages
    const programmingSkills = ['Python', 'JavaScript', 'Java', 'C++', 'C#', 'PHP', 'Ruby', 'Go', 'Rust', 'TypeScript', 'Swift', 'Kotlin']
    programmingSkills.forEach(skill => {
      if (text.toLowerCase().includes(skill.toLowerCase())) {
        skills.push(skill)
      }
    })
    
    // Common frameworks and tools
    const frameworkSkills = ['React', 'Vue', 'Angular', 'Node.js', 'Django', 'Flask', 'Laravel', 'Spring', 'Express', 'Next.js', 'Nuxt.js']
    frameworkSkills.forEach(skill => {
      if (text.toLowerCase().includes(skill.toLowerCase())) {
        skills.push(skill)
      }
    })
    
    // Common soft skills
    const softSkills = ['komunikasi', 'leadership', 'teamwork', 'problem solving', 'critical thinking', 'time management']
    softSkills.forEach(skill => {
      if (text.toLowerCase().includes(skill.toLowerCase())) {
        skills.push(skill.charAt(0).toUpperCase() + skill.slice(1))
      }
    })
    
    // If no specific skills found, extract general mentions
    if (skills.length === 0) {
      // Try to extract skills after certain keywords
      const skillPatterns = [
        /(?:skill|kemampuan|keahlian|menguasai)\s+(?:di|dalam)?\s*([A-Za-z\s,&]+?)(?:\.|$)/gi,
      ]
      
      for (const pattern of skillPatterns) {
        const match = text.match(pattern)
        if (match && match[0]) {
          const extracted = match[0]
            .replace(/(?:skill|kemampuan|keahlian|menguasai)\s+(?:di|dalam)?\s*/i, '')
            .trim()
          
          // Split by comma or 'dan'
          const splitSkills = extracted.split(/,|\s+dan\s+/).map(s => s.trim()).filter(s => s.length > 0)
          skills.push(...splitSkills)
          break
        }
      }
    }
    
    // Remove duplicates and return
    return Array.from(new Set(skills)).slice(0, 10) // Max 10 skills
  }
  
  return []
}

function extractSummary(text: string): string {
  // Extract a brief summary from the first meaningful sentences
  const sentences = text.split(/[.!?]/).filter(s => s.trim().length > 20)
  if (sentences.length > 0) {
    const summary = sentences.slice(0, 2).join('. ').trim()
    return summary.length > 200 ? summary.substring(0, 200) + '...' : summary + '.'
  }
  return ''
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
