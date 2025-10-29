'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Eye, Check, Star } from 'lucide-react'

interface Template {
  id: string
  name: string
  description: string
  category: string
  preview: string
  isPopular?: boolean
  isNew?: boolean
}

const templates: Template[] = [
  {
    id: 'modern',
    name: 'Modern Professional',
    description: 'Clean and contemporary design perfect for tech professionals',
    category: 'Professional',
    preview: '/templates/modern-preview.png',
    isPopular: true
  },
  {
    id: 'creative',
    name: 'Creative Portfolio',
    description: 'Bold and colorful design for creative professionals',
    category: 'Creative',
    preview: '/templates/creative-preview.png',
    isNew: true
  },
  {
    id: 'minimalist',
    name: 'Minimalist',
    description: 'Simple and elegant design focusing on content',
    category: 'Professional',
    preview: '/templates/minimalist-preview.png'
  },
  {
    id: 'executive',
    name: 'Executive',
    description: 'Formal and sophisticated design for senior positions',
    category: 'Executive',
    preview: '/templates/executive-preview.png',
    isPopular: true
  },
  {
    id: 'academic',
    name: 'Academic',
    description: 'Traditional design perfect for academic positions',
    category: 'Academic',
    preview: '/templates/academic-preview.png'
  },
  {
    id: 'startup',
    name: 'Startup',
    description: 'Modern and dynamic design for startup professionals',
    category: 'Tech',
    preview: '/templates/startup-preview.png'
  }
]

interface TemplateSelectorProps {
  onTemplateSelect: (templateId: string) => void
}

export default function TemplateSelector({ onTemplateSelect }: TemplateSelectorProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [filter, setFilter] = useState<string>('all')

  const categories = ['all', 'Professional', 'Creative', 'Executive', 'Academic', 'Tech']
  const filteredTemplates = filter === 'all' 
    ? templates 
    : templates.filter(template => template.category === filter)

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId)
    onTemplateSelect(templateId)
  }

  // Template preview mini designs - MATCH ACTUAL TEMPLATE COLORS
  const renderTemplatePreview = (templateId: string) => {
    const previewStyles: Record<string, JSX.Element> = {
      modern: (
        // Modern template: Blue primary color (#4F46E5)
        <div className="w-full h-full p-3 bg-white">
          <div className="bg-blue-600 text-white p-2 rounded-t-lg mb-2">
            <div className="h-2 bg-white/80 rounded w-2/3 mb-1"></div>
            <div className="h-1 bg-white/60 rounded w-1/2"></div>
          </div>
          <div className="space-y-2">
            <div>
              <div className="h-1.5 bg-blue-600 rounded w-1/3 mb-1"></div>
              <div className="h-1 bg-gray-300 rounded w-full mb-0.5"></div>
              <div className="h-1 bg-gray-300 rounded w-3/4"></div>
            </div>
            <div className="flex flex-wrap gap-1">
              <div className="h-4 bg-blue-100 rounded-full px-2 flex items-center">
                <div className="h-1 bg-blue-600 rounded w-8"></div>
              </div>
              <div className="h-4 bg-blue-100 rounded-full px-2 flex items-center">
                <div className="h-1 bg-blue-600 rounded w-8"></div>
              </div>
            </div>
          </div>
        </div>
      ),
      creative: (
        // Creative template: Purple & Pink gradient
        <div className="w-full h-full p-3 bg-white">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-2 rounded-t-lg mb-2">
            <div className="h-2 bg-white/90 rounded w-2/3 mb-1"></div>
            <div className="h-1 bg-white/70 rounded w-1/2"></div>
          </div>
          <div className="space-y-2">
            <div>
              <div className="h-1.5 bg-purple-600 rounded w-1/3 mb-1"></div>
              <div className="h-1 bg-gray-300 rounded w-full mb-0.5"></div>
              <div className="h-1 bg-gray-300 rounded w-3/4"></div>
            </div>
            <div className="grid grid-cols-2 gap-1">
              <div className="bg-gradient-to-r from-purple-100 to-pink-100 p-1.5 rounded">
                <div className="h-1 bg-purple-600 rounded"></div>
              </div>
              <div className="bg-gradient-to-r from-purple-100 to-pink-100 p-1.5 rounded">
                <div className="h-1 bg-pink-600 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      ),
      minimalist: (
        // Minimalist template: Simple gray with borders
        <div className="w-full h-full p-3 bg-white border-2 border-gray-300">
          <div className="border-b-2 border-gray-800 pb-2 mb-2">
            <div className="h-2 bg-gray-800 rounded w-2/3 mb-1"></div>
            <div className="h-1 bg-gray-500 rounded w-1/2"></div>
          </div>
          <div className="space-y-2">
            <div>
              <div className="h-1.5 bg-gray-700 rounded w-1/3 mb-1 border-b border-gray-300"></div>
              <div className="h-1 bg-gray-300 rounded w-full mb-0.5"></div>
              <div className="h-1 bg-gray-300 rounded w-3/4"></div>
            </div>
            <div className="flex flex-wrap gap-1">
              <div className="border border-gray-300 px-1.5 py-0.5 rounded">
                <div className="h-1 bg-gray-600 rounded w-6"></div>
              </div>
              <div className="border border-gray-300 px-1.5 py-0.5 rounded">
                <div className="h-1 bg-gray-600 rounded w-6"></div>
              </div>
            </div>
          </div>
        </div>
      ),
      executive: (
        // Executive template: Dark gray/black professional
        <div className="w-full h-full p-3 bg-white">
          <div className="border-l-4 border-gray-800 pl-2 mb-2">
            <div className="h-2 bg-gray-800 rounded w-2/3 mb-1"></div>
            <div className="h-1 bg-gray-600 rounded w-1/2"></div>
          </div>
          <div className="space-y-2">
            <div>
              <div className="h-1.5 bg-gray-800 rounded w-1/3 mb-1"></div>
              <div className="h-1 bg-gray-300 rounded w-full mb-0.5"></div>
              <div className="h-1 bg-gray-300 rounded w-3/4"></div>
            </div>
            <div className="grid grid-cols-2 gap-1">
              <div className="bg-gray-100 p-1.5 rounded">
                <div className="h-1 bg-gray-700 rounded"></div>
              </div>
              <div className="bg-gray-100 p-1.5 rounded">
                <div className="h-1 bg-gray-700 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      ),
      academic: (
        // Academic template: Green with top border
        <div className="w-full h-full p-3 bg-white border-t-4 border-green-600">
          <div className="text-center mb-2 border-b border-gray-300 pb-2">
            <div className="h-2 bg-green-600 rounded w-2/3 mx-auto mb-1"></div>
            <div className="h-1 bg-gray-500 rounded w-1/2 mx-auto"></div>
          </div>
          <div className="space-y-2">
            <div>
              <div className="h-1.5 bg-green-600 rounded w-1/3 mb-1"></div>
              <div className="h-1 bg-gray-300 rounded w-full mb-0.5"></div>
              <div className="h-1 bg-gray-300 rounded w-3/4"></div>
            </div>
            <div className="flex flex-wrap gap-1">
              <div className="bg-gray-100 px-1.5 py-0.5 rounded">
                <div className="h-1 bg-gray-700 rounded w-6"></div>
              </div>
              <div className="bg-gray-100 px-1.5 py-0.5 rounded">
                <div className="h-1 bg-gray-700 rounded w-6"></div>
              </div>
            </div>
          </div>
        </div>
      ),
      startup: (
        // Startup template: Orange gradient with rounded style
        <div className="w-full h-full p-3 bg-white">
          <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-2 rounded-xl mb-2 shadow-lg">
            <div className="flex items-center gap-1 mb-1">
              <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
              <div className="h-1.5 bg-white/90 rounded flex-1"></div>
            </div>
            <div className="h-1 bg-white/70 rounded w-1/2"></div>
          </div>
          <div className="space-y-2">
            <div>
              <div className="h-1.5 bg-orange-600 rounded w-1/3 mb-1"></div>
              <div className="h-1 bg-gray-300 rounded w-full mb-0.5"></div>
              <div className="h-1 bg-gray-300 rounded w-3/4"></div>
            </div>
            <div className="grid grid-cols-3 gap-1">
              <div className="bg-gradient-to-br from-orange-100 to-yellow-100 p-1 rounded-lg">
                <div className="h-1 bg-orange-600 rounded"></div>
              </div>
              <div className="bg-gradient-to-br from-red-100 to-orange-100 p-1 rounded-lg">
                <div className="h-1 bg-red-600 rounded"></div>
              </div>
              <div className="bg-gradient-to-br from-yellow-100 to-orange-100 p-1 rounded-lg">
                <div className="h-1 bg-yellow-600 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return previewStyles[templateId] || previewStyles.modern
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Pilih Template CV
        </h2>
        <p className="text-lg text-gray-600">
          Pilih template yang sesuai dengan profesi dan preferensi Anda
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setFilter(category)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === category
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {category === 'all' ? 'Semua' : category}
          </button>
        ))}
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template, index) => (
          <motion.div
            key={template.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className={`template-card relative bg-white rounded-lg shadow-sm border-2 cursor-pointer ${
              selectedTemplate === template.id
                ? 'border-primary-500 ring-2 ring-primary-200'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => handleTemplateSelect(template.id)}
          >
            {/* Template Preview */}
            <div className="aspect-[3/4] bg-gray-100 rounded-t-lg relative overflow-hidden">
              {renderTemplatePreview(template.id)}
              
              {/* Badges */}
              <div className="absolute top-3 left-3 flex space-x-2 z-10">
                {template.isPopular && (
                  <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full flex items-center space-x-1 shadow-lg">
                    <Star className="w-3 h-3" />
                    <span>Popular</span>
                  </span>
                )}
                {template.isNew && (
                  <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full shadow-lg">
                    New
                  </span>
                )}
              </div>

              {/* Selection Indicator */}
              {selectedTemplate === template.id && (
                <div className="absolute top-3 right-3 w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center shadow-lg z-10">
                  <Check className="w-5 h-5 text-white" />
                </div>
              )}
              
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-all duration-200 flex items-center justify-center opacity-0 hover:opacity-100">
                <Eye className="w-8 h-8 text-white drop-shadow-lg" />
              </div>
            </div>

            {/* Template Info */}
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 mb-1">
                {template.name}
              </h3>
              <p className="text-sm text-gray-600 mb-2">
                {template.description}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {template.category}
                </span>
                <button
                  className={`text-sm font-medium transition-colors ${
                    selectedTemplate === template.id
                      ? 'text-primary-600'
                      : 'text-gray-500 hover:text-primary-600'
                  }`}
                >
                  {selectedTemplate === template.id ? 'Dipilih' : 'Pilih'}
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Selected Template Actions */}
      {selectedTemplate && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 text-center"
        >
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-primary-900 mb-2">
              Template Dipilih: {templates.find(t => t.id === selectedTemplate)?.name}
            </h3>
            <p className="text-primary-700 mb-4">
              Template telah dipilih. Klik "CV Builder" untuk mulai mengisi data CV Anda.
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => onTemplateSelect(selectedTemplate)}
                className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors"
              >
                Mulai Buat CV
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
