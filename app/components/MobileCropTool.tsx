import React, { useState, useRef, useCallback, useEffect } from 'react'
import { ZoomIn, ZoomOut, RotateCcw, Crop, Move, Check } from 'lucide-react'

interface MobileCropToolProps {
  imageUrl: string
  onCropComplete: (croppedUrl: string) => void
  aspectRatio?: number // width/height ratio
  className?: string
}

interface TouchPoint {
  x: number
  y: number
}

interface CropData {
  x: number
  y: number
  width: number
  height: number
  zoom: number
  rotation: number
}

export default function MobileCropTool({
  imageUrl,
  onCropComplete,
  aspectRatio = 4/6, // Default passport ratio
  className = ''
}: MobileCropToolProps) {
  const [cropData, setCropData] = useState<CropData>({
    x: 0,
    y: 0,
    width: 300,
    height: 450,
    zoom: 1,
    rotation: 0
  })
  
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [isPinching, setIsPinching] = useState(false)
  const [lastTouchDistance, setLastTouchDistance] = useState(0)
  const [dragStart, setDragStart] = useState<TouchPoint>({ x: 0, y: 0 })
  const [touchStart, setTouchStart] = useState<TouchPoint[]>([])
  
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Calculate distance between two touch points
  const getTouchDistance = (touches: React.TouchList): number => {
    if (touches.length < 2) return 0
    const touch1 = touches[0]
    const touch2 = touches[1]
    return Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) +
      Math.pow(touch2.clientY - touch1.clientY, 2)
    )
  }

  // Get touch position relative to container
  const getTouchPosition = (touch: React.Touch): TouchPoint => {
    if (!containerRef.current) return { x: 0, y: 0 }
    const rect = containerRef.current.getBoundingClientRect()
    return {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    }
  }

  // Touch start handler
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault()
    
    const touches = Array.from(e.touches).map(touch => getTouchPosition(touch))
    setTouchStart(touches)

    if (e.touches.length === 1) {
      // Single touch - start dragging
      setIsDragging(true)
      const touch = getTouchPosition(e.touches[0])
      setDragStart({
        x: touch.x - cropData.x,
        y: touch.y - cropData.y
      })
    } else if (e.touches.length === 2) {
      // Two touches - start pinching
      setIsPinching(true)
      setIsDragging(false)
      setLastTouchDistance(getTouchDistance(e.touches))
    }
  }, [cropData.x, cropData.y])

  // Touch move handler
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault()

    if (e.touches.length === 1 && isDragging && !isPinching) {
      // Single touch drag - move crop area
      const touch = getTouchPosition(e.touches[0])
      const newX = touch.x - dragStart.x
      const newY = touch.y - dragStart.y

      setCropData(prev => ({
        ...prev,
        x: Math.max(0, Math.min(newX, (containerRef.current?.clientWidth || 0) - prev.width)),
        y: Math.max(0, Math.min(newY, (containerRef.current?.clientHeight || 0) - prev.height))
      }))
    } else if (e.touches.length === 2 && isPinching) {
      // Two touch pinch - zoom
      const currentDistance = getTouchDistance(e.touches)
      const scaleFactor = currentDistance / lastTouchDistance
      
      setCropData(prev => ({
        ...prev,
        zoom: Math.max(0.5, Math.min(3, prev.zoom * scaleFactor))
      }))
      
      setLastTouchDistance(currentDistance)
    }
  }, [isDragging, isPinching, dragStart, lastTouchDistance])

  // Touch end handler
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault()
    
    if (e.touches.length === 0) {
      setIsDragging(false)
      setIsPinching(false)
    } else if (e.touches.length === 1 && isPinching) {
      // Transition from pinch to single touch
      setIsPinching(false)
      setIsDragging(true)
      const touch = getTouchPosition(e.touches[0])
      setDragStart({
        x: touch.x - cropData.x,
        y: touch.y - cropData.y
      })
    }
  }, [isPinching, cropData.x, cropData.y])

  // Mouse events for desktop support
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return
    
    const rect = containerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    setIsDragging(true)
    setDragStart({
      x: x - cropData.x,
      y: y - cropData.y
    })
  }, [cropData.x, cropData.y])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return
    
    const rect = containerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    const newX = x - dragStart.x
    const newY = y - dragStart.y

    setCropData(prev => ({
      ...prev,
      x: Math.max(0, Math.min(newX, rect.width - prev.width)),
      y: Math.max(0, Math.min(newY, rect.height - prev.height))
    }))
  }, [isDragging, dragStart])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Zoom controls
  const zoomIn = () => {
    setCropData(prev => ({ ...prev, zoom: Math.min(3, prev.zoom + 0.1) }))
  }

  const zoomOut = () => {
    setCropData(prev => ({ ...prev, zoom: Math.max(0.5, prev.zoom - 0.1) }))
  }

  // Rotation controls
  const rotateImage = () => {
    setCropData(prev => ({ ...prev, rotation: (prev.rotation + 90) % 360 }))
  }

  // Reset crop
  const resetCrop = () => {
    setCropData({
      x: 0,
      y: 0,
      width: 300,
      height: 300 / aspectRatio,
      zoom: 1,
      rotation: 0
    })
  }

  // Apply crop
  const applyCrop = useCallback(async () => {
    if (!imageRef.current || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const img = imageRef.current

    if (!ctx) return

    // Set canvas size to desired output size
    const outputWidth = 400
    const outputHeight = outputWidth / aspectRatio
    canvas.width = outputWidth
    canvas.height = outputHeight

    // Calculate scaling factors
    const imgDisplayRect = img.getBoundingClientRect()
    const containerRect = containerRef.current?.getBoundingClientRect()
    
    if (!containerRect) return

    const scaleX = img.naturalWidth / imgDisplayRect.width
    const scaleY = img.naturalHeight / imgDisplayRect.height

    // Apply transformations
    ctx.save()
    
    // Translate to center for rotation
    ctx.translate(outputWidth / 2, outputHeight / 2)
    
    // Apply rotation
    ctx.rotate((cropData.rotation * Math.PI) / 180)
    
    // Scale for zoom
    ctx.scale(cropData.zoom, cropData.zoom)

    // Calculate crop area in image coordinates
    const cropX = cropData.x * scaleX
    const cropY = cropData.y * scaleY
    const cropWidth = cropData.width * scaleX
    const cropHeight = cropData.height * scaleY

    // Draw the cropped and transformed image
    ctx.drawImage(
      img,
      cropX, cropY, cropWidth, cropHeight,
      -outputWidth / (2 * cropData.zoom), 
      -outputHeight / (2 * cropData.zoom),
      outputWidth / cropData.zoom, 
      outputHeight / cropData.zoom
    )

    ctx.restore()

    // Convert to blob
    canvas.toBlob(blob => {
      if (blob) {
        const croppedUrl = URL.createObjectURL(blob)
        onCropComplete(croppedUrl)
      }
    }, 'image/jpeg', 0.9)
  }, [cropData, aspectRatio, onCropComplete])

  // Initialize crop area when image loads
  useEffect(() => {
    if (imageRef.current && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect()
      const cropWidth = Math.min(300, containerRect.width * 0.8)
      const cropHeight = cropWidth / aspectRatio
      
      setCropData(prev => ({
        ...prev,
        width: cropWidth,
        height: cropHeight,
        x: (containerRect.width - cropWidth) / 2,
        y: (containerRect.height - cropHeight) / 2
      }))
    }
  }, [aspectRatio])

  return (
    <div className={`relative overflow-hidden bg-black rounded-lg ${className}`}>
      {/* Image container */}
      <div
        ref={containerRef}
        className="relative w-full h-96 touch-none select-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <img
          ref={imageRef}
          src={imageUrl}
          alt="Crop preview"
          className="w-full h-full object-contain select-none"
          style={{
            transform: `scale(${cropData.zoom}) rotate(${cropData.rotation}deg)`,
            transformOrigin: 'center center'
          }}
          draggable={false}
        />
        
        {/* Crop overlay */}
        <div
          className="absolute border-2 border-blue-400 bg-blue-400/20 backdrop-blur-sm"
          style={{
            left: cropData.x,
            top: cropData.y,
            width: cropData.width,
            height: cropData.height,
            cursor: isDragging ? 'grabbing' : 'grab'
          }}
        >
          {/* Corner handles for resize */}
          <div className="absolute -top-1 -left-1 w-6 h-6 bg-blue-400 rounded-full border-2 border-white shadow-lg"></div>
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-400 rounded-full border-2 border-white shadow-lg"></div>
          <div className="absolute -bottom-1 -left-1 w-6 h-6 bg-blue-400 rounded-full border-2 border-white shadow-lg"></div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-400 rounded-full border-2 border-white shadow-lg"></div>
          
          {/* Center indicator */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <Move className="w-6 h-6 text-white drop-shadow-lg" />
          </div>
        </div>

        {/* Grid lines */}
        <div
          className="absolute border border-white/30 pointer-events-none"
          style={{
            left: cropData.x,
            top: cropData.y,
            width: cropData.width,
            height: cropData.height
          }}
        >
          {/* Rule of thirds grid */}
          <div className="absolute w-full h-full">
            {/* Vertical lines */}
            <div className="absolute left-1/3 top-0 w-px h-full bg-white/20"></div>
            <div className="absolute left-2/3 top-0 w-px h-full bg-white/20"></div>
            {/* Horizontal lines */}
            <div className="absolute top-1/3 left-0 w-full h-px bg-white/20"></div>
            <div className="absolute top-2/3 left-0 w-full h-px bg-white/20"></div>
          </div>
        </div>
      </div>

      {/* Control buttons */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2 px-4">
        <button
          onClick={zoomOut}
          className="p-2 bg-black/50 text-white rounded-full backdrop-blur-sm"
        >
          <ZoomOut className="w-5 h-5" />
        </button>
        
        <button
          onClick={zoomIn}
          className="p-2 bg-black/50 text-white rounded-full backdrop-blur-sm"
        >
          <ZoomIn className="w-5 h-5" />
        </button>
        
        <button
          onClick={rotateImage}
          className="p-2 bg-black/50 text-white rounded-full backdrop-blur-sm"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
        
        <button
          onClick={resetCrop}
          className="p-2 bg-black/50 text-white rounded-full backdrop-blur-sm"
        >
          <Crop className="w-5 h-5" />
        </button>
        
        <button
          onClick={applyCrop}
          className="p-3 bg-blue-500 text-white rounded-full shadow-lg"
        >
          <Check className="w-6 h-6" />
        </button>
      </div>

      {/* Info display */}
      <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-lg text-sm backdrop-blur-sm">
        Zoom: {Math.round(cropData.zoom * 100)}% | Rotation: {cropData.rotation}°
      </div>

      {/* Hidden canvas for processing */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}

// Preset aspect ratios for different CV photo types
export const CVPhotoRatios = {
  passport: 4/6,      // Standard passport ratio
  square: 1/1,        // Social media style
  headshot: 3/4,      // Professional headshot
  id: 2/3,           // ID card style
  linkedin: 4/5       // LinkedIn recommended
} as const

// Touch gesture helper hook
export function useTouchGestures() {
  const [gestureState, setGestureState] = useState({
    isSwipe: false,
    swipeDirection: null as 'left' | 'right' | 'up' | 'down' | null,
    isPinch: false,
    pinchScale: 1,
    isTap: false,
    tapCount: 0
  })

  const handleGesture = useCallback((e: TouchEvent) => {
    // Implementation for various touch gestures
    // This would include swipe detection, pinch-to-zoom, double-tap, etc.
  }, [])

  return {
    gestureState,
    handleGesture
  }
}