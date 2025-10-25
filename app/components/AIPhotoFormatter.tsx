'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Upload, Wand2, Download, AlertCircle, Check } from 'lucide-react'
import Image from 'next/image'
import toast from 'react-hot-toast'

export default function AIPhotoFormatter() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [professionalUrl, setProfessionalUrl] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [backgroundColor, setBackgroundColor] = useState('blue')

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error('Ukuran file maksimal 10MB')
        return
      }

      setSelectedFile(file)
      setProfessionalUrl(null)
      
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const uploadToCloudinary = async (file: File): Promise<string> => {
    // For demo, using Cloudinary free tier
    // In production, you should use your own image hosting
    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', 'ml_default') // Use your preset
    
    const response = await fetch(
      'https://api.cloudinary.com/v1_1/demo/image/upload', // Replace 'demo' with your cloud name
      {
        method: 'POST',
        body: formData
      }
    )
    
    if (!response.ok) {
      throw new Error('Upload gagal')
    }
    
    const data = await response.json()
    return data.secure_url
  }

  const handleFormatPhoto = async () => {
    if (!selectedFile || !previewUrl) {
      toast.error('Pilih foto terlebih dahulu')
      return
    }

    setIsProcessing(true)
    const loadingToast = toast.loading('Mengubah foto menjadi formal... ⏳')

    try {
      // For demo, we'll use the preview URL directly
      // In production, upload to cloud storage first
      const response = await fetch('/api/ai/photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: previewUrl,
          backgroundColor: backgroundColor,
          style: 'professional'
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Gagal mengubah foto')
      }

      setProfessionalUrl(data.professionalImage)
      toast.success('Foto berhasil diubah menjadi formal! ✨', { id: loadingToast })
    } catch (error: any) {
      console.error('Format photo error:', error)
      toast.error(error.message || 'Gagal mengubah foto', { id: loadingToast })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDownload = () => {
    if (professionalUrl) {
      const link = document.createElement('a')
      link.href = professionalUrl
      link.download = 'foto-formal-cv.jpg'
      link.click()
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <Wand2 className="w-8 h-8 text-primary-600" />
            AI Photo Formatter
          </h2>
          <p className="text-gray-600">
            Ubah foto casual Anda menjadi foto formal profesional untuk CV dengan AI
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
                Warna Background
              </label>
              <div className="flex gap-3">
                {['blue', 'red', 'white', 'gray'].map((color) => (
                  <button
                    key={color}
                    onClick={() => setBackgroundColor(color)}
                    className={`px-4 py-2 rounded-lg border-2 capitalize transition-all ${
                      backgroundColor === color
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {color === 'blue' && '🔵'} 
                    {color === 'red' && '🔴'}
                    {color === 'white' && '⚪'}
                    {color === 'gray' && '⚫'}
                    {' '}{color}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Preview Section */}
        {previewUrl && (
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Original Photo */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-gray-700">
                Foto Asli
              </h3>
              <div className="relative aspect-square rounded-xl overflow-hidden border-2 border-gray-200">
                <img
                  src={previewUrl}
                  alt="Original"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Formatted Photo */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-gray-700 flex items-center gap-2">
                Foto Formal
                {professionalUrl && (
                  <Check className="w-5 h-5 text-green-500" />
                )}
              </h3>
              <div className="relative aspect-square rounded-xl overflow-hidden border-2 border-gray-200 bg-gray-100">
                {professionalUrl ? (
                  <img
                    src={professionalUrl}
                    alt="Professional"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <div className="text-center">
                      <Wand2 className="w-16 h-16 mx-auto mb-3 opacity-30" />
                      <p>Foto formal akan muncul di sini</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
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
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                  Processing...
                </>
              ) : (
                <>
                  <Wand2 className="w-5 h-5" />
                  Ubah Jadi Formal
                </>
              )}
            </motion.button>

            {professionalUrl && (
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
              <p className="font-semibold mb-1">Tips untuk hasil terbaik:</p>
              <ul className="list-disc list-inside space-y-1 text-blue-800">
                <li>Gunakan foto dengan wajah terlihat jelas</li>
                <li>Pencahayaan yang cukup</li>
                <li>Wajah menghadap kamera</li>
                <li>Background tidak terlalu ramai</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
