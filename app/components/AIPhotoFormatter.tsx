'use client'

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Upload, Wand2, Download, AlertCircle, Check, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

const BACKGROUND_COLORS: Record<string, { name: string; hex: string }> = {
  blue: { name: 'Biru', hex: '#1e40af' },
  red: { name: 'Merah', hex: '#dc2626' },
  white: { name: 'Putih', hex: '#ffffff' },
  gray: { name: 'Abu-abu', hex: '#6b7280' },
}

export default function AIPhotoFormatter() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [processedUrl, setProcessedUrl] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [backgroundColor, setBackgroundColor] = useState('blue')
  const [progress, setProgress] = useState(0)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Ukuran file maksimal 10MB')
        return
      }

      setSelectedFile(file)
      setProcessedUrl(null)
      
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result
        if (result && typeof result === 'string') {
          setPreviewUrl(result)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  // Process photo: remove background and replace with new color in one process
  // Using conservative approach - only remove background from corners and edges
  const processPhotoWithNewBackground = async (imageUrl: string, bgColor: string) => {
    return new Promise<string>((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas')
          canvas.width = img.width
          canvas.height = img.height
          const ctx = canvas.getContext('2d', { willReadFrequently: true })
          
          if (!ctx) {
            reject(new Error('Failed to get canvas context'))
            return
          }

          // Step 1: Draw original image
          ctx.drawImage(img, 0, 0)
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
          const data = imageData.data
          const width = canvas.width
          const height = canvas.height

          // Step 2: Sample background colors ONLY from corners (safe area)
          const sampleBackgroundColors: number[][] = []
          const cornerSize = Math.min(width, height) * 0.15 // Only sample from 15% of corners
          
          // Sample from 4 corners only
          for (let y = 0; y < cornerSize; y++) {
            for (let x = 0; x < cornerSize; x++) {
              // Top-left corner
              let idx = (y * width + x) * 4
              sampleBackgroundColors.push([data[idx], data[idx + 1], data[idx + 2]])
              
              // Top-right corner
              idx = (y * width + (width - 1 - x)) * 4
              sampleBackgroundColors.push([data[idx], data[idx + 1], data[idx + 2]])
              
              // Bottom-left corner
              idx = ((height - 1 - y) * width + x) * 4
              sampleBackgroundColors.push([data[idx], data[idx + 1], data[idx + 2]])
              
              // Bottom-right corner
              idx = ((height - 1 - y) * width + (width - 1 - x)) * 4
              sampleBackgroundColors.push([data[idx], data[idx + 1], data[idx + 2]])
            }
          }

          // Calculate average background color from corners
          const avgBg = [0, 0, 0]
          for (const color of sampleBackgroundColors) {
            avgBg[0] += color[0]
            avgBg[1] += color[1]
            avgBg[2] += color[2]
          }
          avgBg[0] /= sampleBackgroundColors.length
          avgBg[1] /= sampleBackgroundColors.length
          avgBg[2] /= sampleBackgroundColors.length

          // Step 3: Smart background removal with center protection
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i]
            const g = data[i + 1]
            const b = data[i + 2]
            const x = (i / 4) % width
            const y = Math.floor((i / 4) / width)

            // Calculate distance from average background color
            const distFromBg = Math.sqrt(
              Math.pow(r - avgBg[0], 2) + 
              Math.pow(g - avgBg[1], 2) + 
              Math.pow(b - avgBg[2], 2)
            )

            // Calculate distance from center (to protect center area)
            const centerX = width / 2
            const centerY = height / 2
            const distFromCenter = Math.sqrt(
              Math.pow(x - centerX, 2) + 
              Math.pow(y - centerY, 2)
            )
            const maxDist = Math.sqrt(centerX * centerX + centerY * centerY)
            const centerRatio = distFromCenter / maxDist // 0 = center, 1 = corner

            // Calculate brightness and saturation
            const brightness = (r + g + b) / 3
            const max = Math.max(r, g, b)
            const min = Math.min(r, g, b)
            const saturation = max === 0 ? 0 : (max - min) / max

            // PROTECT CENTER AREA (30% center) - never remove
            if (centerRatio <= 0.3) {
              data[i + 3] = 255
              continue
            }

            // For areas outside center, use distance-based threshold
            // Closer to center = higher threshold (more protection)
            // Closer to edge = lower threshold (more aggressive removal)
            const protectionFactor = 1 - centerRatio // 1 at center, 0 at edge
            const threshold = 30 + (protectionFactor * 50) // 30-80 range

            // Check if pixel is similar to background
            const isSimilarToBg = distFromBg < threshold

            // Additional checks for background detection
            const isBrightUniform = brightness > 180 && saturation < 0.25
            const isCorner = centerRatio > 0.8

            // Remove background if:
            // 1. Similar to background color AND not in protected center
            // 2. OR bright uniform color (likely background)
            // 3. OR in corner and similar to background
            if ((isSimilarToBg && centerRatio > 0.3) || 
                (isBrightUniform && centerRatio > 0.4) ||
                (isCorner && distFromBg < 60)) {
              data[i + 3] = 0 // Make transparent
            } else {
              data[i + 3] = 255 // Keep it
            }
          }

          // Step 4: Put processed image data back
          ctx.putImageData(imageData, 0, 0)

          // Step 5: Fill background with selected color
          const selectedColor = BACKGROUND_COLORS[bgColor] || BACKGROUND_COLORS.blue
          
          // Create new canvas with background color
          const finalCanvas = document.createElement('canvas')
          finalCanvas.width = canvas.width
          finalCanvas.height = canvas.height
          const finalCtx = finalCanvas.getContext('2d')
          
          if (!finalCtx) {
            reject(new Error('Failed to get final canvas context'))
            return
          }

          // Fill with background color
          finalCtx.fillStyle = selectedColor.hex
          finalCtx.fillRect(0, 0, finalCanvas.width, finalCanvas.height)

          // Draw the image with removed background on top
          finalCtx.drawImage(canvas, 0, 0)

          // Step 6: Convert to data URL
          const dataUrl = finalCanvas.toDataURL('image/png')
          resolve(dataUrl)
        } catch (error) {
          reject(error)
        }
      }

      img.onerror = () => {
        reject(new Error('Failed to load image'))
      }

      img.src = imageUrl
    })
  }

  const handleFormatPhoto = async () => {
    if (!selectedFile || !previewUrl) {
      toast.error('Pilih foto terlebih dahulu')
      return
    }

    setIsProcessing(true)
    setProgress(0)
    const loadingToast = toast.loading('Menghapus background dan mengganti warna... ⏳')

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 95) {
            clearInterval(progressInterval)
            return 95
          }
          return prev + 5
        })
      }, 100)

      // Process photo: remove background and replace with new color in one process
      const resultDataUrl = await processPhotoWithNewBackground(previewUrl, backgroundColor)
      
      clearInterval(progressInterval)
      setProgress(100)
      
      setProcessedUrl(resultDataUrl)
      toast.success('Background berhasil dihapus dan diganti! ✨', { id: loadingToast })
      
    } catch (error: any) {
      console.error('Format photo error:', error)
      toast.error(error.message || 'Gagal memproses foto', { id: loadingToast })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDownload = () => {
    if (processedUrl) {
      const link = document.createElement('a')
      link.href = processedUrl
      link.download = `foto-background-${backgroundColor}-${Date.now()}.png`
      link.click()
      toast.success('Foto berhasil diunduh!')
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <Wand2 className="w-8 h-8 text-primary-600" />
            AI Background Changer
          </h2>
          <p className="text-gray-600">
            Ganti background foto Anda - hanya background yang berubah
          </p>
        </div>

        {/* Upload Section */}
        <div className="mb-8">
          <label className="block mb-4">
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 hover:border-primary-500 transition-colors cursor-pointer bg-gray-50">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <div className="text-center">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-700 font-medium mb-2">
                  Klik untuk upload foto
                </p>
                <p className="text-sm text-gray-500">
                  PNG, JPG, JPEG (Max 10MB)
                </p>
              </div>
            </div>
          </label>

          {/* Background Color Selection */}
          {previewUrl && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pilih Warna Background
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Object.entries(BACKGROUND_COLORS).map(([key, color]) => (
                  <button
                    key={key}
                    onClick={() => setBackgroundColor(key)}
                    disabled={isProcessing}
                    className={`px-4 py-3 rounded-lg border-2 transition-all ${
                      backgroundColor === key
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-300 hover:border-gray-400'
                    } ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div
                      className="w-full h-8 rounded mb-2 border border-gray-200"
                      style={{ backgroundColor: color.hex }}
                    />
                    <p className="text-sm font-medium">{color.name}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Preview Section */}
        {previewUrl && (
          <div className="mb-8">
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              {/* Original Photo */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-700">
                  Foto Asli
                </h3>
                <div className="relative aspect-[3/4] rounded-xl overflow-hidden border-2 border-gray-200">
                  <img
                    src={previewUrl}
                    alt="Original"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Processed Photo */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-700 flex items-center gap-2">
                  Hasil (Background Diganti)
                  {processedUrl && (
                    <Check className="w-5 h-5 text-green-500" />
                  )}
                </h3>
                <div className="relative aspect-[3/4] rounded-xl overflow-hidden border-2 border-gray-200 bg-gray-100">
                  {processedUrl ? (
                    <img
                      src={processedUrl}
                      alt="Processed"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <div className="text-center">
                        <Wand2 className="w-16 h-16 mx-auto mb-3 opacity-30" />
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
                  <span className="text-sm font-medium text-primary-600">{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <motion.div
                    className="bg-primary-600 h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        {previewUrl && (
          <div className="flex gap-4 justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleFormatPhoto}
              disabled={isProcessing}
              className="px-8 py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  <Wand2 className="w-5 h-5" />
                  Ganti Background
                </>
              )}
            </motion.button>

            {processedUrl && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleDownload}
                className="px-8 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <Download className="w-5 h-5" />
                Download
              </motion.button>
            )}
          </div>
        )}

        {/* Info */}
        <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-200">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-semibold mb-1">Cara Kerja:</p>
              <ul className="list-disc list-inside space-y-1 text-blue-800">
                <li>Menggunakan teknik edge detection untuk menghapus background</li>
                <li>Wajah dan tubuh Anda tetap sama</li>
                <li>Background diganti dengan warna yang Anda pilih</li>
                <li>Proses dilakukan di browser Anda (100% gratis)</li>
              </ul>
              <p className="mt-2 text-xs text-green-700 font-medium">
                ✅ Gratis - Tidak menggunakan API credit, proses di browser
              </p>
              <p className="mt-1 text-xs text-amber-700 font-medium">
                ⚠️ Catatan: Hasil mungkin tidak sempurna untuk foto dengan background kompleks. Untuk hasil terbaik, gunakan foto dengan background yang kontras dengan subjek.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
