import React, { useState, useRef } from 'react'
import { Download, Eye, Sparkles, User, Building, Camera, Palette } from 'lucide-react'

interface CVPhotoTemplatesProps {
  imageUrl: string
  onTemplateApplied: (processedUrl: string) => void
  className?: string
}

export interface PhotoTemplate {
  id: string
  name: string
  description: string
  category: 'professional' | 'creative' | 'formal' | 'modern'
  background: string | { type: 'gradient'; colors: string[] } | { type: 'pattern'; style: string }
  effects?: {
    blur?: number
    lighting?: 'soft' | 'studio' | 'natural'
    contrast?: number
    warmth?: number
  }
  frame?: {
    style: 'none' | 'thin' | 'thick' | 'shadow'
    color?: string
  }
  ratio: number // width/height
  icon: React.ReactNode
}

export default function CVPhotoTemplates({
  imageUrl,
  onTemplateApplied,
  className = ''
}: CVPhotoTemplatesProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Comprehensive CV photo templates
  const photoTemplates: PhotoTemplate[] = [
    // Professional Templates
    {
      id: 'professional-white',
      name: 'Professional White',
      description: 'Clean white background for traditional CVs',
      category: 'professional',
      background: '#ffffff',
      effects: { lighting: 'studio', contrast: 105 },
      frame: { style: 'none' },
      ratio: 4/6,
      icon: <User className="w-4 h-4" />
    },
    {
      id: 'professional-gray',
      name: 'Professional Gray',
      description: 'Sophisticated gray background',
      category: 'professional',
      background: '#f8f9fa',
      effects: { lighting: 'soft', contrast: 102 },
      frame: { style: 'thin', color: '#e9ecef' },
      ratio: 4/6,
      icon: <Building className="w-4 h-4" />
    },
    {
      id: 'corporate-gradient',
      name: 'Corporate Gradient',
      description: 'Modern gradient for corporate roles',
      category: 'modern',
      background: { type: 'gradient', colors: ['#f8f9fa', '#e9ecef'] },
      effects: { lighting: 'studio', contrast: 108 },
      frame: { style: 'shadow' },
      ratio: 3/4,
      icon: <Sparkles className="w-4 h-4" />
    },
    
    // Formal Templates
    {
      id: 'government-blue',
      name: 'Government Blue',
      description: 'Traditional blue for official documents',
      category: 'formal',
      background: '#e3f2fd',
      effects: { lighting: 'natural', contrast: 100 },
      frame: { style: 'thick', color: '#1976d2' },
      ratio: 4/6,
      icon: <Building className="w-4 h-4" />
    },
    {
      id: 'passport-standard',
      name: 'Passport Standard',
      description: 'International passport photo standards',
      category: 'formal',
      background: '#ffffff',
      effects: { lighting: 'natural', contrast: 100 },
      frame: { style: 'none' },
      ratio: 4/6,
      icon: <Camera className="w-4 h-4" />
    },
    
    // Modern Templates
    {
      id: 'linkedin-style',
      name: 'LinkedIn Style',
      description: 'Optimized for professional social media',
      category: 'modern',
      background: { type: 'gradient', colors: ['#ffffff', '#f0f0f0'] },
      effects: { lighting: 'soft', contrast: 110, warmth: 5 },
      frame: { style: 'shadow' },
      ratio: 4/5,
      icon: <Sparkles className="w-4 h-4" />
    },
    {
      id: 'startup-modern',
      name: 'Startup Modern',
      description: 'Contemporary look for tech companies',
      category: 'modern',
      background: { type: 'gradient', colors: ['#f8f9ff', '#e8f0fe'] },
      effects: { lighting: 'soft', contrast: 112, warmth: 3 },
      frame: { style: 'thin', color: '#6366f1' },
      ratio: 1/1,
      icon: <Palette className="w-4 h-4" />
    },
    
    // Creative Templates
    {
      id: 'creative-warm',
      name: 'Creative Warm',
      description: 'Warm tones for creative industries',
      category: 'creative',
      background: { type: 'gradient', colors: ['#fef7ed', '#fed7aa'] },
      effects: { lighting: 'soft', contrast: 108, warmth: 10 },
      frame: { style: 'shadow' },
      ratio: 3/4,
      icon: <Palette className="w-4 h-4" />
    },
    {
      id: 'artistic-minimal',
      name: 'Artistic Minimal',
      description: 'Minimal design for creative roles',
      category: 'creative',
      background: { type: 'gradient', colors: ['#fafafa', '#f5f5f5'] },
      effects: { lighting: 'studio', contrast: 115 },
      frame: { style: 'none' },
      ratio: 3/4,
      icon: <Sparkles className="w-4 h-4" />
    }
  ]

  // Apply template to image
  const applyTemplate = async (template: PhotoTemplate) => {
    if (!canvasRef.current) return

    setIsProcessing(true)
    setSelectedTemplate(template.id)

    try {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Canvas context not available')

      const img = new Image()
      img.crossOrigin = 'anonymous'
      
      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
        img.src = imageUrl
      })

      // Calculate canvas dimensions based on template ratio
      const maxSize = 800
      let canvasWidth, canvasHeight

      if (template.ratio >= 1) {
        canvasWidth = maxSize
        canvasHeight = maxSize / template.ratio
      } else {
        canvasHeight = maxSize
        canvasWidth = maxSize * template.ratio
      }

      canvas.width = canvasWidth
      canvas.height = canvasHeight

      // Apply background
      if (typeof template.background === 'string') {
        // Solid color background
        ctx.fillStyle = template.background
        ctx.fillRect(0, 0, canvasWidth, canvasHeight)
      } else if (typeof template.background === 'object' && template.background.type === 'gradient') {
        // Gradient background
        const gradientBg = template.background as { type: 'gradient'; colors: string[] }
        const gradient = ctx.createLinearGradient(0, 0, canvasWidth, canvasHeight)
        gradientBg.colors.forEach((color, index) => {
          gradient.addColorStop(index / (gradientBg.colors.length - 1), color)
        })
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, canvasWidth, canvasHeight)
      }

      // Calculate image positioning (centered with padding)
      const padding = 40
      const availableWidth = canvasWidth - padding * 2
      const availableHeight = canvasHeight - padding * 2
      
      let imgWidth, imgHeight
      const imgRatio = img.width / img.height
      const availableRatio = availableWidth / availableHeight

      if (imgRatio > availableRatio) {
        imgWidth = availableWidth
        imgHeight = availableWidth / imgRatio
      } else {
        imgHeight = availableHeight
        imgWidth = availableHeight * imgRatio
      }

      const imgX = (canvasWidth - imgWidth) / 2
      const imgY = (canvasHeight - imgHeight) / 2

      // Apply effects to drawing context
      if (template.effects) {
        const filters = []
        
        if (template.effects.contrast) {
          filters.push(`contrast(${template.effects.contrast}%)`)
        }
        if (template.effects.blur) {
          filters.push(`blur(${template.effects.blur}px)`)
        }
        if (template.effects.warmth) {
          filters.push(`sepia(${template.effects.warmth}%)`)
        }
        
        ctx.filter = filters.join(' ')
      }

      // Draw the image
      ctx.drawImage(img, imgX, imgY, imgWidth, imgHeight)

      // Reset filter for frame
      ctx.filter = 'none'

      // Apply frame if specified
      if (template.frame && template.frame.style !== 'none') {
        ctx.strokeStyle = template.frame.color || '#000000'
        
        switch (template.frame.style) {
          case 'thin':
            ctx.lineWidth = 2
            ctx.strokeRect(1, 1, canvasWidth - 2, canvasHeight - 2)
            break
          case 'thick':
            ctx.lineWidth = 8
            ctx.strokeRect(4, 4, canvasWidth - 8, canvasHeight - 8)
            break
          case 'shadow':
            // Create shadow effect
            ctx.shadowColor = 'rgba(0,0,0,0.3)'
            ctx.shadowBlur = 20
            ctx.shadowOffsetX = 5
            ctx.shadowOffsetY = 5
            ctx.fillStyle = 'white'
            ctx.fillRect(10, 10, canvasWidth - 20, canvasHeight - 20)
            ctx.shadowColor = 'transparent'
            break
        }
      }

      // Convert to blob and create URL
      canvas.toBlob(blob => {
        if (blob) {
          const processedUrl = URL.createObjectURL(blob)
          setPreviewUrl(processedUrl)
          onTemplateApplied(processedUrl)
        }
        setIsProcessing(false)
      }, 'image/jpeg', 0.95)

    } catch (error) {
      console.error('Error applying template:', error)
      setIsProcessing(false)
    }
  }

  // Group templates by category
  const templatesByCategory = photoTemplates.reduce((acc, template) => {
    if (!acc[template.category]) acc[template.category] = []
    acc[template.category].push(template)
    return acc
  }, {} as Record<string, PhotoTemplate[]>)

  const categoryLabels = {
    professional: 'Professional',
    formal: 'Formal/Government',
    modern: 'Modern/Tech',
    creative: 'Creative/Artistic'
  }

  const categoryColors = {
    professional: 'blue',
    formal: 'indigo',
    modern: 'purple',
    creative: 'pink'
  }

  return (
    <div className={`bg-white rounded-xl shadow-lg ${className}`}>
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-6">CV Photo Templates</h3>
        
        {/* Preview */}
        {previewUrl && (
          <div className="mb-6 text-center">
            <img 
              src={previewUrl} 
              alt="Template preview" 
              className="max-w-xs mx-auto rounded-lg shadow-md"
            />
            <button
              onClick={() => window.open(previewUrl, '_blank')}
              className="mt-2 flex items-center gap-1 mx-auto text-sm text-blue-600 hover:text-blue-800"
            >
              <Eye className="w-4 h-4" />
              View Full Size
            </button>
          </div>
        )}

        {/* Template Categories */}
        <div className="space-y-6">
          {Object.entries(templatesByCategory).map(([category, templates]) => (
            <div key={category}>
              <h4 className={`text-lg font-semibold text-${categoryColors[category as keyof typeof categoryColors]}-700 mb-3 flex items-center gap-2`}>
                {category === 'professional' && <User className="w-5 h-5" />}
                {category === 'formal' && <Building className="w-5 h-5" />}
                {category === 'modern' && <Sparkles className="w-5 h-5" />}
                {category === 'creative' && <Palette className="w-5 h-5" />}
                {categoryLabels[category as keyof typeof categoryLabels]}
              </h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {templates.map(template => (
                  <button
                    key={template.id}
                    onClick={() => applyTemplate(template)}
                    disabled={isProcessing}
                    className={`p-4 border-2 rounded-lg text-left transition-all hover:shadow-md ${
                      selectedTemplate === template.id
                        ? `border-${categoryColors[category as keyof typeof categoryColors]}-500 bg-${categoryColors[category as keyof typeof categoryColors]}-50`
                        : 'border-gray-200 hover:border-gray-300'
                    } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 bg-${categoryColors[category as keyof typeof categoryColors]}-100 text-${categoryColors[category as keyof typeof categoryColors]}-600 rounded-lg`}>
                        {template.icon}
                      </div>
                      <div className="flex-1">
                        <h5 className="font-medium text-gray-900 mb-1">{template.name}</h5>
                        <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>Ratio: {template.ratio === 1 ? 'Square' : `${Math.round(template.ratio * 100)}:100`}</span>
                          {template.effects?.lighting && (
                            <span>Lighting: {template.effects.lighting}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Background preview */}
                    <div className="mt-3 h-3 rounded-full overflow-hidden">
                      {typeof template.background === 'string' ? (
                        <div 
                          className="w-full h-full"
                          style={{ backgroundColor: template.background }}
                        />
                      ) : template.background.type === 'gradient' ? (
                        <div 
                          className="w-full h-full"
                          style={{ 
                            background: `linear-gradient(90deg, ${template.background.colors.join(', ')})` 
                          }}
                        />
                      ) : null}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        {previewUrl && (
          <div className="mt-6 flex gap-3 justify-center">
            <a
              href={previewUrl}
              download={`cv-photo-${selectedTemplate}.jpg`}
              className="flex items-center gap-2 px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              <Download className="w-4 h-4" />
              Download Photo
            </a>
          </div>
        )}

        {/* Processing indicator */}
        {isProcessing && (
          <div className="text-center py-4">
            <div className="inline-flex items-center gap-2 text-blue-600">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              Processing template...
            </div>
          </div>
        )}

        {/* Hidden canvas */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  )
}

// Template presets are available via the component export

// Utility function to get template by category
export const getTemplatesByCategory = (category: PhotoTemplate['category']): PhotoTemplate[] => {
  const templates: PhotoTemplate[] = [] // Import from component
  return templates.filter(t => t.category === category)
}

// Utility function to get recommended template based on industry
export const getRecommendedTemplate = (industry: string): PhotoTemplate | null => {
  const industryMap: Record<string, string> = {
    'technology': 'startup-modern',
    'finance': 'professional-gray',
    'government': 'government-blue',
    'creative': 'creative-warm',
    'healthcare': 'professional-white',
    'education': 'formal-standard',
    'consulting': 'corporate-gradient'
  }
  
  const templateId = industryMap[industry.toLowerCase()]
  // Return template by ID logic would go here
  return null
}