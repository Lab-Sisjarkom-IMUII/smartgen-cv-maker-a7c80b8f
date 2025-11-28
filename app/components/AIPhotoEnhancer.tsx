'use client'

import { useState, useRef } from 'react'
import { Upload, Sparkles, Download, RotateCcw, Wand2, Camera } from 'lucide-react'
import toast from 'react-hot-toast'

interface AIPhotoEnhancerProps {
  onPhotoChange?: (photoDataUrl: string) => void
}

const PRESET_PROMPTS = [
  {
    id: 'professional',
    title: 'Profesional Standar',
    description: 'Foto profil yang bersih dan profesional untuk CV',
    prompt: 'Transform this photo into a professional headshot suitable for a CV. Enhance lighting, remove distractions in background, improve image quality while maintaining natural appearance.'
  },
  {
    id: 'corporate',
    title: 'Corporate Executive',
    description: 'Gaya eksekutif yang lebih formal dan berwibawa',
    prompt: 'Transform this into a high-end corporate executive headshot. Professional lighting, clean corporate background, sharp professional appearance while keeping facial features natural.'
  },
  {
    id: 'linkedin',
    title: 'LinkedIn Ready',
    description: 'Siap untuk profil LinkedIn dan media sosial profesional',
    prompt: 'Create a LinkedIn-ready professional profile photo. Enhance lighting, add subtle professional background, improve overall quality while maintaining authentic facial appearance.'
  },
  {
    id: 'academic',
    title: 'Academic Professional',
    description: 'Untuk dunia akademis dan penelitian',
    prompt: 'Transform into an academic professional photo suitable for university or research profiles. Clean, approachable, intellectual appearance with professional lighting.'
  }
]

export default function AIPhotoEnhancer({ onPhotoChange }: AIPhotoEnhancerProps) {
  const [originalPhoto, setOriginalPhoto] = useState<string | null>(null)
  const [enhancedPhoto, setEnhancedPhoto] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedPrompt, setSelectedPrompt] = useState(PRESET_PROMPTS[0].id)
  const [customPrompt, setCustomPrompt] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('File harus berupa gambar')
      return
    }

    if (file.size > 4 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 4MB')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const result = event.target?.result
      if (typeof result === 'string') {
        setOriginalPhoto(result)
        setEnhancedPhoto(null)
        toast.success('Foto berhasil diupload')
      }
    }
    reader.onerror = () => {
      toast.error('Gagal membaca file')
    }
    reader.readAsDataURL(file)
  }

  const handleEnhancePhoto = async () => {
    if (!originalPhoto) {
      toast.error('Pilih foto terlebih dahulu')
      return
    }

    const selectedPreset = PRESET_PROMPTS.find(p => p.id === selectedPrompt)
    const promptToUse = customPrompt.trim() || selectedPreset?.prompt || PRESET_PROMPTS[0].prompt

    setIsProcessing(true)
    const loadingToast = toast.loading('Meningkatkan kualitas foto dengan AI... (10-30 detik)')

    try {
      console.log('Sending enhancement request...')
      
      const response = await fetch('/api/ai/enhance-photo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: originalPhoto,
          prompt: promptToUse
        })
      })

      const result = await response.json()
      console.log('Enhancement response:', result)

      if (!response.ok || !result.success) {
        throw new Error(result.details || result.error || 'Failed to enhance photo')
      }

      setEnhancedPhoto(result.image)
      toast.success('Foto berhasil ditingkatkan dengan AI! ✨', { id: loadingToast })
      
    } catch (error: any) {
      console.error('Error enhancing photo:', error)
      const errorMessage = error?.message || 'Gagal meningkatkan foto'
      toast.error(`Error: ${errorMessage}`, { id: loadingToast })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReset = () => {
    setOriginalPhoto(null)
    setEnhancedPhoto(null)
    setCustomPrompt('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    toast.success('Reset berhasil')
  }

  const handleDownload = () => {
    if (!enhancedPhoto) return
    
    const link = document.createElement('a')
    link.href = enhancedPhoto
    link.download = `photo-enhanced-${Date.now()}.png`
    link.click()
    toast.success('Foto berhasil didownload')
  }

  const handleUseInCV = () => {
    if (!enhancedPhoto) return
    onPhotoChange?.(enhancedPhoto)
    toast.success('Foto telah digunakan di CV')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4 py-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full shadow-lg">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              AI Photo Enhancer
            </h2>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Tingkatkan kualitas foto CV Anda menjadi lebih profesional menggunakan teknologi AI terdepan
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-blue-200 rounded-full text-blue-700 shadow-sm">
            <Wand2 className="w-4 h-4" />
            <span className="font-medium">Powered by OpenAI DALL-E 2</span>
          </div>
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center m-6 hover:border-blue-400 hover:bg-blue-50 transition-all duration-300">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              id="photo-upload"
            />
            <label htmlFor="photo-upload" className="cursor-pointer">
              <div className="mb-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <Camera className="w-8 h-8 text-white" />
                </div>
              </div>
              <p className="text-xl font-semibold text-gray-800 mb-2">Upload Foto CV Anda</p>
              <p className="text-gray-500">
                Pilih foto terbaik Anda • JPG, PNG, JPEG • Maksimal 4MB
              </p>
            </label>
          </div>
        </div>

        {/* Enhancement Options */}
        {originalPhoto && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-6">Pilih Gaya Enhancement:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {PRESET_PROMPTS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => {
                      setSelectedPrompt(preset.id)
                      setCustomPrompt('')
                    }}
                    className={`p-6 rounded-xl border-2 text-left transition-all duration-200 hover:shadow-md ${
                      selectedPrompt === preset.id && !customPrompt
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-gray-200 hover:border-blue-300 bg-white'
                    }`}
                  >
                    <h4 className="font-semibold text-gray-800 mb-2">{preset.title}</h4>
                    <p className="text-sm text-gray-600 leading-relaxed">{preset.description}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <label className="block text-lg font-semibold text-gray-800 mb-3">Atau Tulis Prompt Custom:</label>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Contoh: Buat foto ini terlihat lebih profesional dengan pencahayaan yang baik dan background yang bersih..."
                className="w-full px-4 py-4 border border-gray-300 rounded-xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                rows={4}
              />
            </div>

            <button
              onClick={handleEnhancePhoto}
              disabled={isProcessing}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Wand2 className="w-6 h-6" />
              {isProcessing ? 'Sedang Memproses...' : 'Tingkatkan dengan AI'}
            </button>
          </div>
        )}

        {/* Preview Section */}
        {originalPhoto && (
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Foto Asli</h3>
                <div className="relative">
                  <img
                    src={originalPhoto}
                    alt="Original"
                    className="w-full rounded-xl shadow-md"
                  />
                </div>
              </div>
            </div>

            {enhancedPhoto && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Hasil AI Enhancement</h3>
                  <div className="relative mb-6">
                    <img
                      src={enhancedPhoto}
                      alt="Enhanced"
                      className="w-full rounded-xl shadow-md"
                    />
                    <div className="absolute top-3 right-3 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg">
                      ✨ Enhanced
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleDownload}
                      className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-200 flex items-center justify-center gap-2 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                    <button
                      onClick={handleUseInCV}
                      className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 text-white py-3 rounded-xl font-medium hover:from-green-700 hover:to-blue-700 flex items-center justify-center gap-2 transition-all shadow-md"
                    >
                      Gunakan di CV
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Reset Button */}
        {originalPhoto && (
          <div className="text-center">
            <button
              onClick={handleReset}
              className="bg-white border-2 border-gray-300 text-gray-700 px-8 py-3 rounded-xl font-medium hover:bg-gray-50 hover:border-gray-400 flex items-center justify-center gap-2 transition-all mx-auto shadow-sm"
            >
              <RotateCcw className="w-4 h-4" />
              Reset Semua
            </button>
          </div>
        )}

        {/* Info Box */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-blue-500 rounded-full">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-blue-800 mb-2">Tentang AI Photo Enhancer</h4>
              <p className="text-sm text-blue-700 leading-relaxed">
                Fitur ini menggunakan OpenAI DALL-E 2 untuk meningkatkan kualitas foto CV Anda. 
                AI akan mempertahankan struktur wajah asli sambil memperbaiki pencahayaan, 
                background, dan kualitas keseluruhan foto untuk hasil yang lebih profesional.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}