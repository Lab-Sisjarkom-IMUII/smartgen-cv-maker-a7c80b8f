'use client'

import { useState, useRef } from 'react'
import { Upload, Sparkles, Download, RotateCcw, Image as ImageIcon } from 'lucide-react'
import toast from 'react-hot-toast'

const BACKGROUND_PRESETS = [
  { id: 'office-luxury', label: 'Office Mewah', value: 'luxury office with bookshelves and warm lighting' },
  { id: 'studio-modern', label: 'Studio Modern', value: 'modern studio with white background' },
  { id: 'gradient-blue', label: 'Gradient Biru', value: 'professional blue gradient background' },
  { id: 'gradient-gray', label: 'Gradient Abu', value: 'professional gray gradient background' },
  { id: 'office-corporate', label: 'Office Korporat', value: 'corporate office environment' },
  { id: 'garden', label: 'Taman Hijau', value: 'outdoor garden with green trees' },
  { id: 'city', label: 'Kota Modern', value: 'modern city skyline background' },
  { id: 'library', label: 'Perpustakaan', value: 'library with books background' },
]

interface PhotoEditorProps {
  onPhotoChange?: (photoUrl: string) => void
}

export default function PhotoEditor({ onPhotoChange }: PhotoEditorProps) {
  const [originalPhoto, setOriginalPhoto] = useState<string>('')
  const [processedPhoto, setProcessedPhoto] = useState<string>('')
  const [selectedBackground, setSelectedBackground] = useState<string>(BACKGROUND_PRESETS[0].value)
  const [customBackground, setCustomBackground] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('File harus berupa gambar')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 10MB')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string
      setOriginalPhoto(dataUrl)
      setProcessedPhoto('')
      toast.success('Foto berhasil diupload')
    }
    reader.readAsDataURL(file)
  }

  const handleChangeBackground = async () => {
    if (!originalPhoto) {
      toast.error('Pilih foto terlebih dahulu')
      return
    }

    const backgroundDesc = customBackground.trim() || selectedBackground

    if (!backgroundDesc) {
      toast.error('Pilih atau masukkan deskripsi background')
      return
    }

    setIsProcessing(true)
    const loadingToast = toast.loading('Memproses foto dengan OpenAI... Harap tunggu (10-30 detik)')

    try {
      const response = await fetch('/api/photo/change-background', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: originalPhoto,
          background: backgroundDesc,
        }),
      })

      const result = await response.json()

      if (result.success && result.image) {
        setProcessedPhoto(result.image)
        toast.success('Background berhasil diganti! 🎉', { id: loadingToast })
      } else {
        throw new Error(result.error || 'Failed to change background')
      }
    } catch (error: any) {
      console.error('Error changing background:', error)
      toast.error(`Gagal mengganti background: ${error.message}`, { id: loadingToast })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDownload = () => {
    if (!processedPhoto) return

    const link = document.createElement('a')
    link.href = processedPhoto
    link.download = `photo-edited-${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Foto berhasil didownload')
  }

  const handleUseInCV = () => {
    if (!processedPhoto) return
    
    if (onPhotoChange) {
      onPhotoChange(processedPhoto)
      toast.success('Foto berhasil ditambahkan ke CV')
    }
  }

  const handleReset = () => {
    setOriginalPhoto('')
    setProcessedPhoto('')
    setCustomBackground('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Edit Foto dengan AI</h2>
            <p className="text-sm text-gray-600 mt-1">
              Ganti background foto Anda dengan AI menggunakan OpenAI
            </p>
          </div>
          <Sparkles className="w-8 h-8 text-primary-600" />
        </div>

        {/* Upload Section */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            📷 Upload Foto
          </label>
          <div className="flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Upload className="w-4 h-4" />
              Pilih Foto
            </button>
            {originalPhoto && (
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Format: JPEG, PNG | Maksimal: 10MB
          </p>
        </div>

        {/* Background Selection */}
        {originalPhoto && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              🎨 Pilih Background
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {BACKGROUND_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => {
                    setSelectedBackground(preset.value)
                    setCustomBackground('')
                  }}
                  className={`px-4 py-3 rounded-lg border-2 transition-all text-sm font-medium ${
                    selectedBackground === preset.value && !customBackground
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Atau masukkan deskripsi custom:
              </label>
              <input
                type="text"
                value={customBackground}
                onChange={(e) => setCustomBackground(e.target.value)}
                placeholder="Contoh: sunset beach with palm trees"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
        )}

        {/* Process Button */}
        {originalPhoto && (
          <button
            onClick={handleChangeBackground}
            disabled={isProcessing}
            className="w-full bg-gradient-to-r from-primary-600 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Sparkles className="w-5 h-5" />
            {isProcessing ? 'Memproses...' : 'Ganti Background dengan AI'}
          </button>
        )}
      </div>

      {/* Preview Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Original Photo */}
        {originalPhoto && (
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              Foto Asli
            </h3>
            <div className="relative aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden">
              <img
                src={originalPhoto}
                alt="Original"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}

        {/* Processed Photo */}
        {processedPhoto && (
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary-600" />
              Hasil (Background Baru)
            </h3>
            <div className="relative aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden mb-4">
              <img
                src={processedPhoto}
                alt="Processed"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
              <button
                onClick={handleUseInCV}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Upload className="w-4 h-4" />
                Gunakan di CV
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Empty State */}
      {!originalPhoto && (
        <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <ImageIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Belum ada foto
          </h3>
          <p className="text-gray-600 mb-4">
            Upload foto Anda untuk mulai mengganti background dengan AI
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Upload className="w-5 h-5" />
            Upload Foto Sekarang
          </button>
        </div>
      )}
    </div>
  )
}
