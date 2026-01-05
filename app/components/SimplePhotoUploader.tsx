import React, { useState, useRef } from 'react'
import { Upload, Camera, Download, X, Crop, Palette } from 'lucide-react'
import toast from 'react-hot-toast'

interface SimplePhotoUploaderProps {
  onPhotoComplete?: (imageUrl: string) => void
  className?: string
}

export default function SimplePhotoUploader({ 
  onPhotoComplete, 
  className = '' 
}: SimplePhotoUploaderProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Handle file selection - support multiple formats
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Support multiple formats (not just PNG)
    const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!supportedTypes.includes(file.type.toLowerCase())) {
      toast.error('Format tidak didukung. Gunakan JPEG, PNG, atau WebP.')
      return
    }

    // Max size 10MB
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File terlalu besar. Maksimal 10MB.')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      if (e.target?.result) {
        setSelectedImage(e.target.result as string)
      }
    }
    reader.readAsDataURL(file)
  }

  // Process image with basic enhancements
  const processImage = async () => {
    if (!selectedImage || !canvasRef.current) return

    setIsProcessing(true)
    
    try {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Canvas not available')

      const img = new Image()
      img.onload = () => {
        // Set optimal size for CV photo
        const maxSize = 800
        let width = img.width
        let height = img.height

        // Resize if too large
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = (height * maxSize) / width
            width = maxSize
          } else {
            width = (width * maxSize) / height
            height = maxSize
          }
        }

        canvas.width = width
        canvas.height = height
        
        // Apply basic professional photo enhancements
        ctx.filter = 'contrast(110%) brightness(105%) saturate(95%)'
        ctx.drawImage(img, 0, 0, width, height)
        
        // Convert to base64 data URL for storage
        canvas.toBlob(blob => {
          if (blob) {
            // Convert blob to base64 data URL
            const reader = new FileReader()
            reader.onload = () => {
              const base64DataUrl = reader.result as string
              if (onPhotoComplete) {
                onPhotoComplete(base64DataUrl)
              }
              toast.success('Foto berhasil diproses!')
              setIsProcessing(false)
            }
            reader.readAsDataURL(blob)
          } else {
            setIsProcessing(false)
          }
        }, 'image/png', 0.9) // Use PNG for better quality and transparency support
      }
      
      img.src = selectedImage
    } catch (error) {
      toast.error('Error memproses foto')
      setIsProcessing(false)
    }
  }

  // Reset
  const reset = () => {
    setSelectedImage(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className={`bg-gradient-to-br from-purple-100 to-pink-100 border-4 border-purple-500 rounded-xl shadow-xl ${className}`}>
      <div className="p-6">
        <h3 className="text-2xl font-bold text-purple-800 mb-4 flex items-center gap-2">
          <Camera className="w-8 h-8 text-purple-600 animate-pulse" />
          🆕 BRAND NEW PHOTO UPLOADER V2.0
        </h3>
        
        <div className="space-y-4">
          {/* Upload area */}
          {!selectedImage && (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
            >
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-700 mb-2">
                📸 Upload Foto CV Anda (SEMUA FORMAT DIDUKUNG!)
              </p>
              <p className="text-sm text-gray-500">
                ✅ Mendukung JPEG, PNG, WebP • Maksimal 10MB
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Foto akan dioptimalkan secara otomatis untuk CV profesional
              </p>
            </div>
          )}

          {/* Preview and controls */}
          {selectedImage && (
            <div className="space-y-4">
              <div className="text-center">
                <img 
                  src={selectedImage} 
                  alt="Preview" 
                  className="max-w-xs mx-auto rounded-lg shadow-md"
                />
              </div>
              
              <div className="flex gap-3 justify-center">
                <button
                  onClick={processImage}
                  disabled={isProcessing}
                  className="flex items-center gap-2 px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Palette className="w-4 h-4" />
                      Optimize for CV
                    </>
                  )}
                </button>
                
                <button
                  onClick={reset}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                  Reset
                </button>
              </div>
            </div>
          )}

          {/* Features list */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-800 mb-2">Features:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>✅ Multiple format support (JPEG, PNG, WebP)</li>
              <li>✅ Auto optimization for professional look</li>
              <li>✅ Smart resizing and compression</li>
              <li>✅ No AI API required - works offline</li>
            </ul>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
        />

        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  )
}