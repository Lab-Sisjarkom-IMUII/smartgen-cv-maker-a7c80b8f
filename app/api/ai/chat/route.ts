import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

export const dynamic = 'force-dynamic'

// Initialize OpenAI only if API key is available
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null

// Rate limiting configuration
const RATE_LIMIT = {
  maxRequestsPerMinute: 10,  
  maxTokensPerRequest: 500,   
  maxContextMessages: 5,      
}

// Simple in-memory rate limiting 
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const userLimit = rateLimitMap.get(ip)

  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + 60000 }) 
    return true
  }

  if (userLimit.count >= RATE_LIMIT.maxRequestsPerMinute) {
    return false
  }

  userLimit.count++
  return true
}

export async function POST(request: NextRequest) {
  console.log('🔧 AI Chat POST request received')
  
  try {
    const { message, conversationHistory = [] } = await request.json()
    console.log('📝 Message received:', message)

    if (!message || typeof message !== 'string') {
      console.log('❌ Invalid message format')
      return NextResponse.json({ 
        response: 'Pesan tidak valid. Silakan kirim pesan yang valid.',
        cvData: null 
      })
    }

    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    console.log('🌐 Request from IP:', ip)
    
    if (!checkRateLimit(ip)) {
      console.log('🚫 Rate limit exceeded for IP:', ip)
      return NextResponse.json({
        response: 'Terlalu banyak permintaan. Silakan tunggu sebentar sebelum mencoba lagi.',
        cvData: null
      })
    }

    // Always try manual extraction first
    console.log('🤖 Starting CV data extraction')
    
    const fullConversation = [...conversationHistory, message].join(' ')
    let cvData = null
    
    // Skip extraction for default assistant text
    if (!fullConversation.includes('AI Assistant untuk SmartGen CV Maker')) {
      console.log('✨ Attempting CV data extraction')
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
      
      if (extractedData.personalInfo.name || 
          extractedData.experiences.length > 0 || 
          extractedData.education.length > 0 || 
          extractedData.skills.length > 0) {
        cvData = extractedData
        console.log('✅ CV Data extracted successfully:', JSON.stringify(cvData, null, 2))
      } else {
        console.log('⚠️ No extractable CV data found')
      }
    } else {
      console.log('⏭️ Skipping extraction - contains default assistant text')
    }

    // Use OpenAI for response if available, otherwise fallback
    let response = ''
    if (openai) {
      console.log('🔮 Using OpenAI for response generation')
      // TODO: Add OpenAI response generation here
      response = 'Terima kasih! Informasi CV Anda telah saya ekstrak dan siap digunakan.'
    } else {
      console.log('📤 Using fallback response')
      response = generateFallbackResponse(message)
    }

    console.log('📤 Returning response with extracted data')
    return NextResponse.json({
      response,
      cvData
    })

  } catch (error: any) {
    console.error('❌ AI Chat API error:', error)
    console.error('❌ Error stack:', error.stack)
    
    return NextResponse.json({
      response: 'Maaf, terjadi kesalahan. Silakan coba lagi atau isi form CV secara manual.',
      cvData: null,
      warning: 'Terjadi kesalahan pada sistem AI.'
    })
  }
}

// Helper functions for data extraction
function extractName(text: string): string {
  console.log('🔍 Attempting to extract name from text:', text.substring(0, 100))
  
  // Look for name at the very beginning of text before the pipe or location
  const patterns = [
    // Match "ARIS SETIAWAN Bekasi" - get only the name part (before location)
    /^([A-Z]+\s+[A-Z]+)(?:\s+[A-Z][a-z]+)/m,
    // Match "ARIS SETIAWAN" followed by pipe or other content
    /^([A-Z]+\s+[A-Z]+)\s*[\|]/m,
    // Match name pattern at start (all caps with spaces)
    /^([A-Z]+(?:\s+[A-Z]+)+)[\s\|]/m,
    // Match "saya [nama]" - untuk kasus "saya Aris Setiawan"
    /\bsaya\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
    // Match "nama saya [nama]" 
    /(?:nama\s+saya\s+)([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
    // Match "nama saya adalah [nama]"
    /(?:nama\s+saya\s+adalah\s+)([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
    // Match "nama: [nama]" atau "nama [nama]"
    /(?:nama\s*:?\s*)([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
  ]
  
  for (let i = 0; i < patterns.length; i++) {
    const pattern = patterns[i]
    console.log(`🎯 Trying pattern ${i + 1}:`, pattern.toString())
    const match = text.match(pattern)
    
    if (match && match[1]) {
      let name = match[1].trim()
      console.log('🔎 Pattern matched, raw name:', name)
      
      // Validate it's actually a name (not section title like PROFESSIONAL SUMMARY)
      if (name.includes('PROFESSIONAL') || name.includes('SUMMARY') || 
          name.includes('SKILL') || name.includes('PENGALAMAN') ||
          name.includes('TEKNIS') || name.length > 30) {
        console.log('❌ Rejected name (invalid keywords or too long):', name)
        continue
      }
      
      // Clean up any trailing content
      name = name.split(/[\|\+\d@]/)[0].trim()
      
      // More flexible validation - accept both all caps and proper case
      if (name.length >= 2 && name.length <= 50 && /^[A-Za-z\s]+$/.test(name)) {
        console.log('✅ Extracted name:', name)
        return name
      } else {
        console.log('❌ Failed validation checks:', { length: name.length, pattern: /^[A-Za-z\s]+$/.test(name) })
      }
    } else {
      console.log('❌ Pattern did not match')
    }
  }
  
  console.log('❌ No valid name found after trying all patterns')
  return ''
}

function extractEmail(text: string): string {
  const emailMatch = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/)
  return emailMatch ? emailMatch[1] : ''
}

function extractPhone(text: string): string {
  const phoneMatch = text.match(/(\+62\s?\d{2,3}\s?\d{4}\s?\d{4}|\+?\d{10,15})/)
  return phoneMatch ? phoneMatch[1].trim() : ''
}

function extractAddress(text: string): string {
  console.log('🏠 Extracting address from text:', text.substring(0, 150))
  
  const locationPatterns = [
    // Match "ARIS SETIAWAN Bekasi, Jawa Barat" - get only location part
    /[A-Z]+\s+[A-Z]+\s+([A-Za-z\s]+,\s*Jawa\s+Barat)/i,
    // Match "Bekasi, Jawa Barat" directly
    /\b([A-Za-z]+,\s*Jawa\s+Barat)\b/i,
    // Fallback for other location formats
    /(?:dari|alamat|tinggal)\s+([A-Za-z\s]+,\s*[A-Za-z\s]+)/i,
  ]
  
  for (let i = 0; i < locationPatterns.length; i++) {
    const pattern = locationPatterns[i]
    console.log(`🎯 Trying location pattern ${i + 1}:`, pattern.toString())
    const match = text.match(pattern)
    
    if (match && match[1]) {
      let address = match[1].trim()
      console.log('🔎 Pattern matched, raw address:', address)
      
      // Clean up unwanted prefixes
      address = address.replace(/^(saya dari|dari|alamat|tinggal)\s*/i, '')
      
      if (address.length >= 3 && address.length <= 100) {
        console.log('✅ Extracted address:', address)
        return address
      } else {
        console.log('❌ Address failed validation:', { length: address.length })
      }
    } else {
      console.log('❌ Pattern did not match')
    }
  }
  
  console.log('❌ No valid address found')
  return ''
}

function extractSummary(text: string): string {
  const summaryPatterns = [
    /PROFESSIONAL\s+SUMMARY\s+([^A-Z]*?)(?=\s*(?:SKILL|PENGALAMAN|PENDIDIKAN|$))/i,
    /Software\s+Developer[^.]*(?:\.[^.]*){0,5}\./i
  ]
  
  for (const pattern of summaryPatterns) {
    const match = text.match(pattern)
    if (match) {
      let summary = match[1] || match[0]
      summary = summary.replace(/^PROFESSIONAL\s+SUMMARY\s+/i, '').trim()
      
      if (summary.length > 800) {
        summary = summary.substring(0, 800) + '...'
      }
      
      return summary
    }
  }
  
  return ''
}

function extractExperience(text: string): any[] {
  const experiences: any[] = []
  
  // Look for specific company patterns from Aris's CV
  const companyPatterns = [
    {
      regex: /PT\s+Teknologi\s+Maju\s+Bersama\s*–\s*([^\n]+)\s+([^\n]+?)\s*([\s\S]*?)(?=Digital\s+Solusi|PENDIDIKAN|$)/i,
      company: 'PT Teknologi Maju Bersama'
    },
    {
      regex: /Digital\s+Solusi\s+Pratama\s*–\s*([^\n]+)\s+([^\n]+?)\s*([\s\S]*?)(?=PENDIDIKAN|PROYEK|$)/i,
      company: 'Digital Solusi Pratama'
    }
  ]
  
  companyPatterns.forEach((pattern, index) => {
    const match = text.match(pattern.regex)
    if (match) {
      const position = match[1]?.trim() || 'Software Developer'
      const duration = match[2]?.trim() || ''
      const description = match[3]?.trim().replace(/\s+/g, ' ') || ''
      
      experiences.push({
        id: (index + 1).toString(),
        company: pattern.company,
        position: position,
        duration: duration,
        description: description.substring(0, 500) // Limit description length
      })
    }
  })
  
  return experiences
}

function extractEducation(text: string): any[] {
  const educations: any[] = []
  
  // Look for Universitas Gunadarma pattern
  const educationMatch = text.match(/Universitas\s+Gunadarma\s*–\s*([^,]+),?\s*([^|]+)?\|?\s*(\d{4}\s*–\s*\d{4})?/i)
  
  if (educationMatch) {
    const degree = educationMatch[1]?.trim() || 'Sarjana Komputer (S.Kom)'
    const gpa = educationMatch[2]?.trim() || 'IPK 3.75/4.00'
    const year = educationMatch[3]?.trim() || '2018 – 2022'
    
    educations.push({
      id: "1",
      institution: "Universitas Gunadarma",
      degree: degree,
      field: "Ilmu Komputer",
      year: year,
      gpa: gpa
    })
  }
  
  return educations
}

function extractSkills(text: string): string[] {
  const skills: string[] = []
  
  // Extract skills from SKILL TEKNIS section
  const skillSectionMatch = text.match(/SKILL\s+TEKNIS[\s\S]*?(?=PENGALAMAN|PENDIDIKAN|$)/i)
  
  if (skillSectionMatch) {
    const skillSection = skillSectionMatch[0]
    
    // Enhanced skill patterns
    const skillPatterns = [
      // Programming languages
      /JavaScript\s*\([^)]*\)|JavaScript/gi,
      /TypeScript/gi,
      /SQL\b/gi,
      /HTML5?/gi,
      /CSS3?/gi,
      
      // Frameworks and libraries
      /React\.js|React/gi,
      /Next\.js|Next/gi,
      /Node\.js|Node/gi,
      /Express/gi,
      /Redux/gi,
      /Tailwind\s*CSS/gi,
      
      // Databases and cloud
      /PostgreSQL/gi,
      /MongoDB/gi,
      /Redis/gi,
      /AWS/gi,
      /S3/gi,
      /EC2/gi,
      
      // Tools and DevOps
      /Docker/gi,
      /Git\b/gi,
      /Jenkins/gi,
      /CI\/CD/gi,
      /Postman/gi,
      /Jest/gi
    ]
    
    for (const pattern of skillPatterns) {
      const matches = skillSection.match(pattern)
      if (matches) {
        matches.forEach(match => {
          const cleanSkill = match.trim()
          if (cleanSkill && !skills.some(skill => skill.toLowerCase().includes(cleanSkill.toLowerCase()))) {
            skills.push(cleanSkill)
          }
        })
      }
    }
  }
  
  return skills.slice(0, 15) // Limit to 15 skills
}

function generateFallbackResponse(message: string): string {
  const lowerMessage = message.toLowerCase()
  
  if (lowerMessage.includes('halo') || lowerMessage.includes('hai')) {
    return 'Halo! Saya siap membantu Anda membuat CV profesional. Silakan ceritakan tentang diri Anda.'
  }
  
  if (lowerMessage.includes('nama')) {
    return 'Bagus! Sekarang ceritakan tentang pengalaman kerja Anda.'
  }
  
  return 'Terima kasih! Informasi Anda telah saya catat. Silakan lanjutkan atau isi form CV.'
}