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

      // Post-process: smooth the alpha channel to reduce artifacts and harsh edges
      const refinedBlob = await refineAlphaAndComposite(imageBlob, selectedColor.hex)

      // Create object URL for processed image
      if (refinedBlob) {
        const url = URL.createObjectURL(refinedBlob)
        setProcessedUrl(url)
        setProgress(100)
        toast.success('Foto berhasil diubah menjadi foto formal! 🎉', { id: 'processing' })
      }

    } catch (error) {
      console.error('Error processing image:', error)
      toast.error('Gagal memproses foto. Coba foto dengan pencahayaan yang lebih baik atau resolusi lebih tinggi.', { id: 'processing' })
    } finally {
      setIsProcessing(false)
    }
  }

  const serverProcessImage = async () => {
    if (!previewUrl) {
      toast.error('Pilih foto terlebih dahulu')
      return
    }

    setIsProcessing(true)
    setProgress(0)

    try {
      toast.loading('Mengirim foto ke OpenAI DALL-E...', { id: 'processing' })
      setProgress(10)

      const resp = await fetch('/api/ai/photo/remove-bg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: previewUrl })
      })

      if (!resp.ok) {
        const t = await resp.text()
        console.error('OpenAI remove-bg failed:', t)
        toast.error('OpenAI gagal memproses foto')
        return
      }

      const json = await resp.json()
      if (!json?.image) {
        toast.error('OpenAI tidak mengembalikan gambar')
        return
      }

      setProgress(60)
      // fetch blob from returned data URL and refine/composite locally
      const r = await fetch(json.image)
      const blob = await r.blob()
      setProgress(75)
      const refined = await refineAlphaAndComposite(blob, selectedColor.hex)
      if (refined) {
        const url = URL.createObjectURL(refined)
        setProcessedUrl(url)
        setProgress(100)
        toast.success('Foto berhasil diubah menggunakan OpenAI DALL-E! 🎉', { id: 'processing' })
      } else {
        toast.error('Gagal melakukan post-process gambar')
      }
    } catch (err) {
      console.error('serverProcessImage error:', err)
      toast.error('Gagal memproses foto di server')
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

  // Helper: perform separable box blur on alpha channel to smooth edges
  async function refineAlphaAndComposite(imageBlob: Blob, backgroundHex: string): Promise<Blob | null> {
    try {
      const img = new Image()
      img.src = URL.createObjectURL(imageBlob)

      await new Promise((resolve, reject) => {
        img.onload = () => resolve(null)
        img.onerror = (e) => reject(e)
      })

      const w = img.width
      const h = img.height

      // Draw removed-bg image to temp canvas
      const temp = document.createElement('canvas')
      temp.width = w
      temp.height = h
      const tctx = temp.getContext('2d')
      if (!tctx) throw new Error('Failed to get temp canvas context')
      tctx.clearRect(0, 0, w, h)
      tctx.drawImage(img, 0, 0, w, h)

      // Get image data
      const imageData = tctx.getImageData(0, 0, w, h)
      const data = imageData.data

      // Extract alpha channel as integer 0-255
      const alpha = new Uint8ClampedArray(w * h)
      for (let i = 0, p = 0; i < data.length; i += 4, p++) {
        alpha[p] = data[i + 3]
      }

      // --- Connected-component filter: keep largest blob, remove small speckles ---
      const visited = new Uint8Array(w * h)
      let largestLabel = -1
      let largestSize = 0
      for (let i = 0; i < w * h; i++) {
        if (visited[i] || alpha[i] < 16) continue // treat low alpha as background
        // flood fill
        let size = 0
        const stack = [i]
        visited[i] = 1
        while (stack.length) {
          const idx = stack.pop() as number
          size++
          const x = idx % w
          const y = (idx / w) | 0
          // neighbors 4-connected
          if (x > 0) {
            const n = idx - 1
            if (!visited[n] && alpha[n] >= 16) { visited[n] = 1; stack.push(n) }
          }
          if (x < w - 1) {
            const n = idx + 1
            if (!visited[n] && alpha[n] >= 16) { visited[n] = 1; stack.push(n) }
          }
          if (y > 0) {
            const n = idx - w
            if (!visited[n] && alpha[n] >= 16) { visited[n] = 1; stack.push(n) }
          }
          if (y < h - 1) {
            const n = idx + w
            if (!visited[n] && alpha[n] >= 16) { visited[n] = 1; stack.push(n) }
          }
        }
        if (size > largestSize) {
          largestSize = size
          largestLabel = i
        }
      }

      // If we found a largest label, create a mask keeping only that component
      if (largestLabel !== -1) {
        // Re-run flood fill from largestLabel to mark kept pixels
        const keep = new Uint8Array(w * h)
        const stack = [largestLabel]
        keep[largestLabel] = 1
        while (stack.length) {
          const idx = stack.pop() as number
          const x = idx % w
          const y = (idx / w) | 0
          if (x > 0) {
            const n = idx - 1
            if (!keep[n] && alpha[n] >= 16) { keep[n] = 1; stack.push(n) }
          }
          if (x < w - 1) {
            const n = idx + 1
            if (!keep[n] && alpha[n] >= 16) { keep[n] = 1; stack.push(n) }
          }
          if (y > 0) {
            const n = idx - w
            if (!keep[n] && alpha[n] >= 16) { keep[n] = 1; stack.push(n) }
          }
          if (y < h - 1) {
            const n = idx + w
            if (!keep[n] && alpha[n] >= 16) { keep[n] = 1; stack.push(n) }
          }
        }
        // Apply keep mask: zero alpha for others
        for (let p = 0; p < alpha.length; p++) {
          if (!keep[p]) alpha[p] = 0
        }
      }

      // --- Morphological cleanup: small opening then closing ---
      const morphIterations = 1
      // simple 3x3 dilation/erosion
      const dilate = (src: Uint8ClampedArray) => {
        const out = new Uint8ClampedArray(src.length)
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const idx = y * w + x
            let v = 0
            for (let yy = Math.max(0, y - 1); yy <= Math.min(h - 1, y + 1); yy++) {
              for (let xx = Math.max(0, x - 1); xx <= Math.min(w - 1, x + 1); xx++) {
                if (src[yy * w + xx] > 128) { v = 255; break }
              }
              if (v) break
            }
            out[idx] = v
          }
        }
        return out
      }
      const erode = (src: Uint8ClampedArray) => {
        const out = new Uint8ClampedArray(src.length)
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const idx = y * w + x
            let v = 255
            for (let yy = Math.max(0, y - 1); yy <= Math.min(h - 1, y + 1); yy++) {
              for (let xx = Math.max(0, x - 1); xx <= Math.min(w - 1, x + 1); xx++) {
                if (src[yy * w + xx] <= 128) { v = 0; break }
              }
              if (!v) break
            }
            out[idx] = v
          }
        }
        return out
      }

      let mask = new Uint8ClampedArray(alpha.length)
      for (let i = 0; i < alpha.length; i++) mask[i] = alpha[i] > 128 ? 255 : 0
      // opening (erode then dilate)
      for (let it = 0; it < morphIterations; it++) {
        mask = erode(mask)
        mask = dilate(mask)
      }
      // closing (dilate then erode)
      for (let it = 0; it < morphIterations; it++) {
        mask = dilate(mask)
        mask = erode(mask)
      }

      // Convert mask back into float alpha array for blurring
      const alphaF = new Float32Array(w * h)
      for (let i = 0; i < alpha.length; i++) alphaF[i] = mask[i]

      // Multi-pass separable box blur to approximate gaussian (3 passes)
      const radius = Math.max(1, Math.round(Math.min(w, h) / 120))
      const boxBlurInPlace = (buf: Float32Array, r: number) => {
        const tmp = new Float32Array(buf.length)
        // horizontal
        for (let y = 0; y < h; y++) {
          let sum = 0
          let count = 0
          const row = y * w
          for (let x = 0; x <= r && x < w; x++) { sum += buf[row + x]; count++ }
          for (let x = 0; x < w; x++) {
            tmp[row + x] = sum / count
            const left = x - r
            const right = x + r + 1
            if (left >= 0) { sum -= buf[row + left]; count-- }
            if (right < w) { sum += buf[row + right]; count++ }
          }
        }
        // vertical into buf
        for (let x = 0; x < w; x++) {
          let sum = 0
          let count = 0
          for (let y = 0; y <= r && y < h; y++) { sum += tmp[y * w + x]; count++ }
          for (let y = 0; y < h; y++) {
            buf[y * w + x] = sum / count
            const top = y - r
            const bottom = y + r + 1
            if (top >= 0) { sum -= tmp[top * w + x]; count-- }
            if (bottom < h) { sum += tmp[bottom * w + x]; count++ }
          }
        }
      }

      // apply 3 passes
      boxBlurInPlace(alphaF, radius)
      boxBlurInPlace(alphaF, radius)
      boxBlurInPlace(alphaF, Math.max(1, Math.round(radius / 2)))

      // Write alpha back and clamp
      for (let p = 0, i = 0; p < alphaF.length; p++, i += 4) {
        const v = Math.max(0, Math.min(255, Math.round(alphaF[p])))
        data[i + 3] = v
      }
      tctx.putImageData(imageData, 0, 0)

      // Composite onto background color
      const out = document.createElement('canvas')
      out.width = w
      out.height = h
      const octx = out.getContext('2d')
      if (!octx) throw new Error('Failed to get output canvas context')

      octx.fillStyle = backgroundHex
      octx.fillRect(0, 0, w, h)
      octx.drawImage(temp, 0, 0)

      // Convert to blob
      return await new Promise<Blob | null>((resolve) => {
        out.toBlob((b) => resolve(b), 'image/png')
      })
    } catch (err) {
      console.error('refineAlphaAndComposite failed:', err)
      return null
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
                      onClick={serverProcessImage}
                      disabled={isProcessing}
                      className="flex-1 bg-gradient-to-r from-indigo-500 to-blue-600 text-white py-4 px-6 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      <Sparkles className="w-5 h-5 mr-2" />
                      Gunakan DALL-E (OpenAI)
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
