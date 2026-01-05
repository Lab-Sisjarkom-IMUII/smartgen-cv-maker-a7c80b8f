import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Camera, Upload, RotateCcw, Crop, Palette, Download, X, ZoomIn, ZoomOut, Move, Check } from 'lucide-react'
import toast from 'react-hot-toast'

interface EnhancedPhotoCaptureProps {
  onPhotoComplete?: (imageUrl: string) => void
  className?: string
}

interface CropArea {
  x: number
  y: number
  width: number
  height: number
}

export default function EnhancedPhotoCapture({ 
  onPhotoComplete, 
  className = '' 
}: EnhancedPhotoCaptureProps) {
  // States
  const [activeMode, setActiveMode] = useState<'capture' | 'upload' | 'edit'>('capture')
  const [isStreaming, setIsStreaming] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [editedImage, setEditedImage] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState<'capture' | 'crop' | 'enhance' | 'template'>('capture')
  
  // Crop states
  const [cropArea, setCropArea] = useState<CropArea>({ x: 0, y: 0, width: 300, height: 400 })
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  
  // Enhancement states
  const [filters, setFilters] = useState({
    brightness: 100,
    contrast: 100,
    saturation: 100,
    blur: 0
  })
  
  // Template states
  const [selectedTemplate, setSelectedTemplate] = useState<string>('white')
  
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // CV Photo Templates
  const photoTemplates = [
    { id: 'white', name: 'White Background', color: '#ffffff', description: 'Clean professional look' },
    { id: 'gray', name: 'Gray Background', color: '#f5f5f5', description: 'Modern corporate style' },
    { id: 'blue', name: 'Blue Background', color: '#e8f4fd', description: 'Traditional formal look' },
    { id: 'gradient', name: 'Gray Gradient', color: 'linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%)', description: 'Professional depth' }
  ]

  // Photo ratios for CV
  const photoRatios = [
    { id: 'passport', name: 'Passport (4:6)', ratio: 4/6, description: 'Standard CV photo' },
    { id: 'square', name: 'Square (1:1)', ratio: 1, description: 'Social media style' },
    { id: 'headshot', name: 'Headshot (3:4)', ratio: 3/4, description: 'Professional portrait' }
  ]

  // Camera initialization
  const startCamera = useCallback(async () => {
    try {
      const constraints = {
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user' // Front camera for selfie
        }
      }
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
        setIsStreaming(true)
        setActiveMode('capture')
      }
    } catch (error) {
      console.error('Camera access error:', error)
      toast.error('Tidak dapat mengakses kamera. Gunakan upload file sebagai alternatif.')
    }
  }, [])

  // Stop camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
      setIsStreaming(false)
    }
  }, [])

  // Capture photo from camera
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return
    
    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')
    
    if (!context) return
    
    // Set canvas size to video dimensions
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    
    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height)
    
    // Convert to blob and create URL
    canvas.toBlob(blob => {
      if (blob) {
        const imageUrl = URL.createObjectURL(blob)
        setSelectedImage(imageUrl)
        setCurrentStep('crop')
        stopCamera()
      }
    }, 'image/jpeg', 0.9)
  }, [stopCamera])

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Support multiple formats
    const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic']
    if (!supportedTypes.includes(file.type)) {
      toast.error('Format tidak didukung. Gunakan JPEG, PNG, WebP, atau HEIC.')
      return
    }

    // Max file size 10MB
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File terlalu besar. Maksimal 10MB.')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      if (e.target?.result) {
        setSelectedImage(e.target.result as string)
        setCurrentStep('crop')
        setActiveMode('edit')
      }
    }
    reader.readAsDataURL(file)
  }

  // Crop functions
  const handleCropMouseDown = (e: React.MouseEvent) => {
    if (!imageRef.current) return
    
    const rect = imageRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    setIsDragging(true)
    setDragStart({ x: x - cropArea.x, y: y - cropArea.y })
  }

  const handleCropMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !imageRef.current) return
    
    const rect = imageRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    setCropArea(prev => ({
      ...prev,
      x: Math.max(0, Math.min(x - dragStart.x, rect.width - prev.width)),
      y: Math.max(0, Math.min(y - dragStart.y, rect.height - prev.height))
    }))
  }

  const handleCropMouseUp = () => {
    setIsDragging(false)
  }

  // Apply crop
  const applyCrop = () => {
    if (!imageRef.current || !canvasRef.current) return
    
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')
    const img = imageRef.current
    
    if (!context) return
    
    // Calculate scaling
    const scaleX = img.naturalWidth / img.width
    const scaleY = img.naturalHeight / img.height
    
    // Set canvas size to crop area
    canvas.width = cropArea.width * scaleX
    canvas.height = cropArea.height * scaleY
    
    // Draw cropped image
    context.drawImage(
      img,
      cropArea.x * scaleX, cropArea.y * scaleY,
      cropArea.width * scaleX, cropArea.height * scaleY,
      0, 0,
      canvas.width, canvas.height
    )
    
    // Convert to URL
    canvas.toBlob(blob => {
      if (blob) {
        const croppedUrl = URL.createObjectURL(blob)
        setEditedImage(croppedUrl)
        setCurrentStep('enhance')
      }
    }, 'image/jpeg', 0.9)
  }

  // Apply filters
  const applyFilters = () => {
    if (!canvasRef.current) return
    
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')
    
    if (!context) return
    
    // Apply CSS filters to canvas
    context.filter = `
      brightness(${filters.brightness}%)
      contrast(${filters.contrast}%)
      saturate(${filters.saturation}%)
      blur(${filters.blur}px)
    `
    
    // Redraw with filters
    const img = new Image()
    img.onload = () => {
      context.clearRect(0, 0, canvas.width, canvas.height)
      context.drawImage(img, 0, 0, canvas.width, canvas.height)
      
      canvas.toBlob(blob => {
        if (blob) {
          const filteredUrl = URL.createObjectURL(blob)
          setEditedImage(filteredUrl)
        }
      }, 'image/jpeg', 0.9)
    }
    img.src = editedImage || selectedImage || ''
  }

  // Apply template background
  const applyTemplate = (templateId: string) => {
    if (!canvasRef.current || !editedImage) return
    
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')
    
    if (!context) return
    
    const template = photoTemplates.find(t => t.id === templateId)
    if (!template) return
    
    // This would need a proper background removal algorithm
    // For now, we'll just add a colored border/frame effect
    const img = new Image()
    img.onload = () => {
      // Add padding for background
      const padding = 20
      canvas.width = img.width + padding * 2
      canvas.height = img.height + padding * 2
      
      // Fill background
      if (template.id === 'gradient') {
        const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height)
        gradient.addColorStop(0, '#f5f5f5')
        gradient.addColorStop(1, '#e0e0e0')
        context.fillStyle = gradient
      } else {
        context.fillStyle = template.color
      }
      context.fillRect(0, 0, canvas.width, canvas.height)
      
      // Draw image centered
      context.drawImage(img, padding, padding, img.width, img.height)
      
      canvas.toBlob(blob => {
        if (blob) {
          const finalUrl = URL.createObjectURL(blob)
          setEditedImage(finalUrl)
        }
      }, 'image/jpeg', 0.9)
    }
    img.src = editedImage
    setSelectedTemplate(templateId)
  }

  // Download final image
  const downloadImage = () => {
    if (!editedImage) return
    
    const link = document.createElement('a')
    link.href = editedImage
    link.download = `cv-photo-${Date.now()}.jpg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    if (onPhotoComplete) {
      onPhotoComplete(editedImage)
    }
    
    toast.success('Foto berhasil disimpan!')
  }

  // Reset all
  const resetAll = () => {
    setSelectedImage(null)
    setEditedImage(null)
    setCurrentStep('capture')
    setActiveMode('capture')
    setCropArea({ x: 0, y: 0, width: 300, height: 400 })
    setFilters({ brightness: 100, contrast: 100, saturation: 100, blur: 0 })
    setSelectedTemplate('white')
  }

  // Cleanup
  useEffect(() => {
    return () => {
      stopCamera()
      if (selectedImage) URL.revokeObjectURL(selectedImage)
      if (editedImage) URL.revokeObjectURL(editedImage)
    }
  }, [stopCamera, selectedImage, editedImage])

  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      <div className="p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Enhanced Photo Capture</h3>
        
        {/* Step indicator */}
        <div className="flex items-center justify-center mb-6 space-x-2">
          <div className={`w-3 h-3 rounded-full ${currentStep === 'capture' ? 'bg-blue-500' : 'bg-gray-300'}`} />
          <div className="w-8 h-0.5 bg-gray-300" />
          <div className={`w-3 h-3 rounded-full ${currentStep === 'crop' ? 'bg-blue-500' : 'bg-gray-300'}`} />
          <div className="w-8 h-0.5 bg-gray-300" />
          <div className={`w-3 h-3 rounded-full ${currentStep === 'enhance' ? 'bg-blue-500' : 'bg-gray-300'}`} />
          <div className="w-8 h-0.5 bg-gray-300" />
          <div className={`w-3 h-3 rounded-full ${currentStep === 'template' ? 'bg-blue-500' : 'bg-gray-300'}`} />
        </div>

        {/* Step 1: Capture/Upload */}
        {currentStep === 'capture' && (
          <div className="space-y-4">
            <div className="flex gap-3 justify-center">
              <button
                onClick={startCamera}
                disabled={isStreaming}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
              >
                <Camera className="w-4 h-4" />
                {isStreaming ? 'Camera Active' : 'Open Camera'}
              </button>
              
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                <Upload className="w-4 h-4" />
                Upload Photo
              </button>
            </div>

            {/* Camera view */}
            {isStreaming && (
              <div className="relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full max-w-md mx-auto rounded-lg"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-64 h-80 border-2 border-white border-dashed rounded-lg"></div>
                </div>
                <button
                  onClick={capturePhoto}
                  className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-100"
                >
                  <div className="w-8 h-8 bg-red-500 rounded-full"></div>
                </button>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        )}

        {/* Step 2: Crop */}
        {currentStep === 'crop' && selectedImage && (
          <div className="space-y-4">
            <div className="relative inline-block">
              <img
                ref={imageRef}
                src={selectedImage}
                alt="Selected"
                className="max-w-full h-auto rounded-lg"
                onMouseDown={handleCropMouseDown}
                onMouseMove={handleCropMouseMove}
                onMouseUp={handleCropMouseUp}
              />
              
              {/* Crop overlay */}
              <div
                className="absolute border-2 border-blue-500 bg-blue-500/20"
                style={{
                  left: cropArea.x,
                  top: cropArea.y,
                  width: cropArea.width,
                  height: cropArea.height,
                  cursor: 'move'
                }}
              >
                <div className="absolute -right-2 -bottom-2 w-4 h-4 bg-blue-500 cursor-se-resize"></div>
              </div>
            </div>
            
            <div className="flex gap-2 justify-center">
              <button
                onClick={applyCrop}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                <Crop className="w-4 h-4" />
                Apply Crop
              </button>
              <button
                onClick={resetAll}
                className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                <RotateCcw className="w-4 h-4" />
                Start Over
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Enhance */}
        {currentStep === 'enhance' && editedImage && (
          <div className="space-y-4">
            <img src={editedImage} alt="Cropped" className="max-w-full h-auto rounded-lg mx-auto" />
            
            {/* Filter controls */}
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Brightness</label>
                <input
                  type="range"
                  min="50"
                  max="150"
                  value={filters.brightness}
                  onChange={(e) => setFilters(prev => ({ ...prev, brightness: Number(e.target.value) }))}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Contrast</label>
                <input
                  type="range"
                  min="50"
                  max="150"
                  value={filters.contrast}
                  onChange={(e) => setFilters(prev => ({ ...prev, contrast: Number(e.target.value) }))}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Saturation</label>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={filters.saturation}
                  onChange={(e) => setFilters(prev => ({ ...prev, saturation: Number(e.target.value) }))}
                  className="w-full"
                />
              </div>
            </div>
            
            <div className="flex gap-2 justify-center">
              <button
                onClick={applyFilters}
                className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
              >
                <Palette className="w-4 h-4" />
                Apply Filters
              </button>
              <button
                onClick={() => setCurrentStep('template')}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Next: Background
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Template */}
        {currentStep === 'template' && editedImage && (
          <div className="space-y-4">
            <img src={editedImage} alt="Enhanced" className="max-w-full h-auto rounded-lg mx-auto" />
            
            {/* Template selection */}
            <div className="grid grid-cols-2 gap-3">
              {photoTemplates.map(template => (
                <button
                  key={template.id}
                  onClick={() => applyTemplate(template.id)}
                  className={`p-3 border-2 rounded-lg text-left transition-colors ${
                    selectedTemplate === template.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div
                    className="w-full h-12 rounded mb-2"
                    style={{ background: template.color }}
                  />
                  <h4 className="font-medium text-sm">{template.name}</h4>
                  <p className="text-xs text-gray-600">{template.description}</p>
                </button>
              ))}
            </div>
            
            <div className="flex gap-2 justify-center">
              <button
                onClick={downloadImage}
                className="flex items-center gap-2 px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                <Download className="w-4 h-4" />
                Download Photo
              </button>
              <button
                onClick={() => setCurrentStep('enhance')}
                className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                Back to Edit
              </button>
            </div>
          </div>
        )}

        {/* Hidden canvas for processing */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  )
}