'use client'

import { useState, useRef } from 'react'
import { Upload, Palette, Download, RotateCcw } from 'lucide-react'
import toast from 'react-hot-toast'
import { removeBackground } from '@imgly/background-removal'

const BACKGROUND_COLORS = [
  { id: 'white', label: 'Putih', value: '#FFFFFF' },
  { id: 'light-gray', label: 'Abu Terang', value: '#F5F5F5' },
  { id: 'blue-light', label: 'Biru Muda', value: '#E3F2FD' },
  { id: 'blue', label: 'Biru', value: '#2196F3' },
  { id: 'blue-dark', label: 'Biru Tua', value: '#1565C0' },
  { id: 'gray', label: 'Abu-abu', value: '#9E9E9E' },
  { id: 'navy', label: 'Navy', value: '#0D47A1' },
  { id: 'teal', label: 'Teal', value: '#00897B' },
]

interface PhotoEditorProps {
  onPhotoChange?: (photoDataUrl: string) => void
}

export default function PhotoEditor({ onPhotoChange }: PhotoEditorProps) {
  const [originalPhoto, setOriginalPhoto] = useState<string | null>(null)
  const [processedPhoto, setProcessedPhoto] = useState<string | null>(null)
  const [selectedColor, setSelectedColor] = useState<string>('#FFFFFF')
  const [customColor, setCustomColor] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

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
      const result = event.target?.result
      
      // Ensure result is a string (data URL)
      if (typeof result !== 'string') {
        toast.error('Gagal membaca file')
        console.error('FileReader result is not a string:', typeof result)
        return
      }
      
      const dataUrl = String(result) // Explicitly convert to string
      setOriginalPhoto(dataUrl)
      setProcessedPhoto(null)
      toast.success('Foto berhasil diupload')
    }
    reader.onerror = () => {
      toast.error('Gagal membaca file')
      console.error('FileReader error')
    }
    reader.readAsDataURL(file)
  }

  const handleChangeBackground = async () => {
    if (!originalPhoto) {
      toast.error('Pilih foto terlebih dahulu')
      return
    }

    // Ensure originalPhoto is a string
    if (typeof originalPhoto !== 'string') {
      toast.error('Format foto tidak valid')
      console.error('originalPhoto is not a string:', typeof originalPhoto)
      return
    }

    const backgroundColor = customColor.trim() || selectedColor

    if (!backgroundColor) {
      toast.error('Pilih warna background')
      return
    }

    setIsProcessing(true)
    const loadingToast = toast.loading('Menghapus background dan menambahkan warna baru...')

    try {
      // Step 1: Convert data URL to Blob for removeBackground
      const dataUrlString = String(originalPhoto) // Ensure it's a string
      
      // Parse data URL
      const base64Response = await fetch(dataUrlString)
      const imageBlob = await base64Response.blob()

      console.log('Image blob created:', imageBlob.size, 'bytes')

      // Step 2: Remove background using @imgly/background-removal
      const removedBgBlob = await removeBackground(imageBlob, {
        progress: (key: string, current: number, total: number) => {
          const percentage = Math.round((current / total) * 100)
          console.log(`Removing background: ${percentage}%`)
        }
      })

      console.log('Background removed, blob size:', removedBgBlob.size, 'bytes')

      // Step 3: Convert blob to image
      const removedBgUrl = URL.createObjectURL(removedBgBlob)
      const removedBgImg = new Image()
      
      await new Promise<void>((resolve, reject) => {
        removedBgImg.onload = () => resolve()
        removedBgImg.onerror = (e) => reject(new Error('Failed to load removed background image'))
        removedBgImg.src = removedBgUrl
      })

      console.log('Image loaded:', removedBgImg.width, 'x', removedBgImg.height)

      // Step 4: Composite with solid color background
      const canvas = canvasRef.current || document.createElement('canvas')
      canvas.width = removedBgImg.width
      canvas.height = removedBgImg.height
      
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Canvas context not available')

      // Draw solid color background
      ctx.fillStyle = String(backgroundColor) // Ensure backgroundColor is string
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw person with transparent background on top
      ctx.drawImage(removedBgImg, 0, 0)

      // Step 5: Convert to data URL (ensure it's a string)
      const resultDataUrl = canvas.toDataURL('image/png', 0.95)
      
      // Validate result is a string
      if (typeof resultDataUrl !== 'string') {
        throw new Error('Failed to generate result image')
      }

      console.log('Result data URL generated, length:', resultDataUrl.length)
      
      setProcessedPhoto(resultDataUrl)
      toast.success('Background berhasil diganti! 🎉', { id: loadingToast })
      
      // Cleanup
      URL.revokeObjectURL(removedBgUrl)
    } catch (error: any) {
      console.error('Error changing background:', error)
      const errorMessage = error?.message || String(error) || 'Unknown error'
      toast.error(`Gagal: ${errorMessage}`, { id: loadingToast })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReset = () => {
    setOriginalPhoto(null)
    setProcessedPhoto(null)
    setCustomColor('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    toast.success('Reset berhasil')
  }

  const handleDownload = () => {
    if (!processedPhoto) return
    
    // Ensure processedPhoto is a string
    if (typeof processedPhoto !== 'string') {
      toast.error('Format gambar tidak valid')
      console.error('processedPhoto is not a string:', typeof processedPhoto)
      return
    }

    const link = document.createElement('a')
    link.href = String(processedPhoto) // Explicitly ensure string type
    link.download = `photo-edited-${Date.now()}.png`
    link.click()
    toast.success('Foto berhasil didownload')
  }

  const handleUseInCV = () => {
    if (!processedPhoto) return
    
    // Ensure processedPhoto is a string before passing to callback
    if (typeof processedPhoto !== 'string') {
      toast.error('Format gambar tidak valid')
      console.error('processedPhoto is not a string:', typeof processedPhoto)
      return
    }
    
    onPhotoChange?.(String(processedPhoto)) // Explicitly ensure string type
    toast.success('Foto telah digunakan di CV')
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">Edit Foto CV</h2>
        <p className="text-muted-foreground">
          Upload foto, lalu pilih warna background yang diinginkan
        </p>
        <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
          ⚠️ Proses pertama kali butuh ~30 detik download model AI (gratis, offline)
        </div>
      </div>

      {/* Upload Section */}
      <div className="border-2 border-dashed rounded-lg p-8 text-center">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          id="photo-upload"
        />
        <label htmlFor="photo-upload" className="cursor-pointer">
          <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg font-medium mb-2">Upload Foto</p>
          <p className="text-sm text-muted-foreground">
            JPG, PNG, JPEG (Max 10MB)
          </p>
        </label>
      </div>

      {/* Background Color Selection */}
      {originalPhoto && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-3">Pilih Warna Background:</label>
            <div className="grid grid-cols-4 gap-3">
              {BACKGROUND_COLORS.map((bg) => (
                <button
                  key={bg.id}
                  onClick={() => {
                    setSelectedColor(bg.value)
                    setCustomColor('')
                  }}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedColor === bg.value && !customColor
                      ? 'border-primary ring-2 ring-primary ring-offset-2'
                      : 'border-gray-300 hover:border-primary'
                  }`}
                >
                  <div
                    className="w-full h-12 rounded mb-2"
                    style={{ backgroundColor: bg.value }}
                  />
                  <p className="text-sm font-medium">{bg.label}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Atau Masukkan Warna Custom (hex code):</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={customColor}
                onChange={(e) => setCustomColor(e.target.value)}
                placeholder="Contoh: #FF5733 atau #ABCDEF"
                className="flex-1 px-4 py-2 border rounded-lg"
              />
              {customColor && (
                <div
                  className="w-12 h-12 rounded border"
                  style={{ backgroundColor: customColor }}
                />
              )}
            </div>
          </div>

          <button
            onClick={handleChangeBackground}
            disabled={isProcessing}
            className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Palette className="w-5 h-5" />
            {isProcessing ? 'Memproses...' : 'Ganti Background'}
          </button>
        </div>
      )}

      {/* Preview Section */}
      {originalPhoto && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <h3 className="font-medium">Foto Asli</h3>
            <img
              src={originalPhoto}
              alt="Original"
              className="w-full rounded-lg border"
            />
          </div>

          {processedPhoto && (
            <div className="space-y-2">
              <h3 className="font-medium">Hasil (Background Baru)</h3>
              <img
                src={processedPhoto}
                alt="Processed"
                className="w-full rounded-lg border"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleDownload}
                  className="flex-1 bg-secondary text-secondary-foreground py-2 rounded-lg font-medium hover:bg-secondary/80 flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
                <button
                  onClick={handleUseInCV}
                  className="flex-1 bg-primary text-white py-2 rounded-lg font-medium hover:bg-primary/90 flex items-center justify-center gap-2"
                >
                  Gunakan di CV
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Reset Button */}
      {originalPhoto && (
        <button
          onClick={handleReset}
          className="w-full border-2 py-2 rounded-lg font-medium hover:bg-gray-50 flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Reset Semua
        </button>
      )}
    </div>
  )
}
