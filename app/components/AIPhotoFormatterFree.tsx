'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-hot-toast'
import { Upload, Download, Sparkles, Loader2, Image as ImageIcon, Check } from 'lucide-react'

type BackgroundColor = {
  name: string
  value: string
  hex: string
}

const BACKGROUND_COLORS: BackgroundColor[] = [
  { name: 'Biru', value: 'blue', hex: '#1e40af' },
  { name: 'Merah', value: 'red', hex: '#dc2626' },
  { name: 'Putih', value: 'white', hex: '#ffffff' },
  { name: 'Abu-abu', value: 'gray', hex: '#6b7280' },
]

export default function AIPhotoFormatterFree({ onSave }: { onSave?: (dataUrl: string) => void }) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [processedUrl, setProcessedUrl] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedColor, setSelectedColor] = useState<BackgroundColor>(BACKGROUND_COLORS[0])
  const [progress, setProgress] = useState(0)
  const [bgRemovalModule, setBgRemovalModule] = useState<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load background removal library dynamically (client-side only)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('@imgly/background-removal')
        .then((module) => {
          setBgRemovalModule(module)
          console.log('Background removal library loaded successfully')
        })
        .catch((err) => {
          console.error('Failed to load background removal library:', err)
          toast.error('Gagal memuat library AI. Silakan refresh halaman.')
        })
    }
  }, [])

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Harap pilih file gambar yang valid')
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 10MB')
      return
    }

    setSelectedFile(file)
    setProcessedUrl('') // Reset processed image

    // Create preview URL
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    toast.success('Foto berhasil dipilih!')
  }

  const processImage = async () => {
    if (!selectedFile || !previewUrl) {
      toast.error('Pilih foto terlebih dahulu')
      return
    }

    if (!bgRemovalModule) {
      toast.error('Library AI belum siap. Silakan tunggu sebentar dan coba lagi.')
      return
    }

    setIsProcessing(true)
    setProgress(0)
    
    try {
      toast.loading('Memproses foto... (ini mungkin memakan waktu 10-30 detik)', { id: 'processing' })
      
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return prev
          return prev + 10
        })
      }, 1000)

      // Remove background using @imgly/background-removal
      const imageBlob = await bgRemovalModule.removeBackground(previewUrl, {
        progress: (key: string, current: number, total: number) => {
          const percent = Math.round((current / total) * 100)
          setProgress(Math.min(percent, 90))
        },
        model: 'small', // Use smaller, faster model
        output: {
          format: 'image/png',
          quality: 0.9
        }
      })

      clearInterval(progressInterval)
      setProgress(95)

      // Create a canvas to add the selected background color
      const img = new Image()
      img.src = URL.createObjectURL(imageBlob)
      
      await new Promise((resolve) => {
        img.onload = resolve
      })

      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')

      if (!ctx) throw new Error('Failed to get canvas context')

      // Fill background with selected color
      ctx.fillStyle = selectedColor.hex
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw the image with removed background on top
      ctx.drawImage(img, 0, 0)

      // Convert to blob and create URL
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob)
          setProcessedUrl(url)
          setProgress(100)
          toast.success('Foto berhasil diubah menjadi foto formal! 🎉', { id: 'processing' })
        }
      }, 'image/png')

    } catch (error) {
      console.error('Error processing image:', error)
      toast.error('Gagal memproses foto. Coba foto dengan pencahayaan yang lebih baik atau resolusi lebih tinggi.', { id: 'processing' })
    } finally {
      setIsProcessing(false)
    }
  }

  const downloadImage = () => {
    if (!processedUrl) return

    const link = document.createElement('a')
    link.href = processedUrl
    link.download = `foto-formal-${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    toast.success('Foto berhasil diunduh!')
  }

  const resetForm = () => {
    setSelectedFile(null)
    setPreviewUrl('')
    setProcessedUrl('')
    setProgress(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            AI Photo Formatter
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Ubah foto casual menjadi foto formal untuk CV - <span className="font-semibold text-green-600">100% GRATIS</span>
          </p>
          <p className="text-sm text-gray-500 mt-2">
            ✨ Proses di browser Anda, tanpa biaya API, tanpa upload ke server!
          </p>
          {!bgRemovalModule && (
            <div className="mt-4 inline-flex items-center space-x-2 text-blue-600 bg-blue-50 px-4 py-2 rounded-full">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm font-medium">Memuat AI library...</span>
            </div>
          )}
        </motion.div>

        {/* Upload Section */}
        {!previewUrl && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-xl p-8 mb-8"
          >
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-4 border-dashed border-gray-300 rounded-2xl p-12 text-center cursor-pointer hover:border-blue-500 transition-colors"
            >
              <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Upload Foto Anda
              </h3>
              <p className="text-gray-500 mb-4">
                Klik untuk memilih foto atau drag & drop
              </p>
              <p className="text-sm text-gray-400">
                Maksimal 10MB • Format: JPG, PNG, WEBP
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </motion.div>
        )}

        {/* Preview & Processing Section */}
        <AnimatePresence>
          {previewUrl && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-3xl shadow-xl p-8"
            >
              {/* Color Selection */}
              <div className="mb-8">
                <label className="block text-lg font-semibold text-gray-900 mb-4">
                  Pilih Warna Background
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {BACKGROUND_COLORS.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setSelectedColor(color)}
                      disabled={isProcessing}
                      className={`relative p-4 rounded-xl border-2 transition-all ${
                        selectedColor.value === color.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      } ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <div
                        className="w-full h-12 rounded-lg mb-2 border border-gray-200"
                        style={{ backgroundColor: color.hex }}
                      />
                      <p className="text-sm font-medium text-gray-900">{color.name}</p>
                      {selectedColor.value === color.value && (
                        <div className="absolute top-2 right-2 bg-blue-500 rounded-full p-1">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Images Display */}
              <div className="grid md:grid-cols-2 gap-8 mb-8">
                {/* Original Image */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <ImageIcon className="w-5 h-5 mr-2" />
                    Foto Asli
                  </h3>
                  <div className="relative aspect-[3/4] bg-gray-100 rounded-xl overflow-hidden">
                    <img
                      src={previewUrl}
                      alt="Original"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* Processed Image */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Sparkles className="w-5 h-5 mr-2" />
                    Foto Formal
                  </h3>
                  <div className="relative aspect-[3/4] bg-gray-100 rounded-xl overflow-hidden">
                    {processedUrl ? (
                      <img
                        src={processedUrl}
                        alt="Processed"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <div className="text-center">
                          <Sparkles className="w-12 h-12 mx-auto mb-2" />
                          <p>Hasil akan muncul di sini</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              {isProcessing && (
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Memproses foto...</span>
                    <span className="text-sm font-medium text-blue-600">{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <motion.div
                      className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4">
                {!processedUrl ? (
                  <>
                    <button
                      onClick={processImage}
                      disabled={isProcessing || !bgRemovalModule}
                      className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 px-6 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Memproses...
                        </>
                      ) : !bgRemovalModule ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Memuat AI...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5 mr-2" />
                          Ubah Jadi Foto Formal
                        </>
                      )}
                    </button>
                    <button
                      onClick={resetForm}
                      disabled={isProcessing}
                      className="px-6 py-4 border-2 border-gray-300 rounded-xl font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Ganti Foto
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={downloadImage}
                      className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 px-6 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center"
                    >
                      <Download className="w-5 h-5 mr-2" />
                      Download Foto Formal
                    </button>
                    {onSave && (
                      <button
                        onClick={() => {
                          onSave(processedUrl)
                          toast.success('Foto berhasil disimpan ke CV')
                        }}
                        className="px-6 py-4 border-2 border-gray-300 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                      >
                        Gunakan di CV
                      </button>
                    )}
                    <button
                      onClick={resetForm}
                      className="px-6 py-4 border-2 border-gray-300 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                    >
                      Proses Foto Lain
                    </button>
                  </>
                )}
              </div>

              {/* Info Banner */}
              <div className="mt-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
                <p className="text-sm text-green-800 text-center">
                  💚 <strong>100% Gratis & Privat:</strong> Semua proses dilakukan di browser Anda. 
                  Foto tidak di-upload ke server manapun!
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-12 grid md:grid-cols-3 gap-6"
        >
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
              <span className="text-2xl">💚</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              100% Gratis
            </h3>
            <p className="text-gray-600 text-sm">
              Tidak ada biaya API, tidak ada biaya tersembunyi. Gunakan sebanyak yang Anda mau!
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
              <span className="text-2xl">🔒</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Privasi Terjaga
            </h3>
            <p className="text-gray-600 text-sm">
              Foto diproses langsung di browser Anda. Tidak ada upload ke server eksternal.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
              <span className="text-2xl">⚡</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Teknologi AI
            </h3>
            <p className="text-gray-600 text-sm">
              Menggunakan AI untuk menghilangkan background dan menggantinya dengan warna solid.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
