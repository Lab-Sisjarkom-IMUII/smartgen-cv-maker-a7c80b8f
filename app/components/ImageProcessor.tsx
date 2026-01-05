import React, { useRef, useCallback } from 'react'

interface BackgroundRemovalProps {
  imageUrl: string
  onProcessed: (imageUrl: string) => void
  backgroundColor?: string
}

export default function BackgroundRemoval({ 
  imageUrl, 
  onProcessed, 
  backgroundColor = '#ffffff' 
}: BackgroundRemovalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Simple edge detection and masking for background removal
  const removeBackground = useCallback(async () => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = new Image()
    img.crossOrigin = 'anonymous'
    
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      
      // Draw original image
      ctx.drawImage(img, 0, 0)
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data
      
      // Simple background removal algorithm
      // This is a basic implementation - for production, you'd want to use ML models
      const tolerance = 30
      const edgeThreshold = 50
      
      // Convert to grayscale for edge detection
      const grayscale = new Uint8ClampedArray(data.length / 4)
      for (let i = 0; i < data.length; i += 4) {
        grayscale[i / 4] = (data[i] + data[i + 1] + data[i + 2]) / 3
      }
      
      // Simple edge detection using Sobel operator
      const edges = new Uint8ClampedArray(grayscale.length)
      const width = canvas.width
      const height = canvas.height
      
      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          const idx = y * width + x
          
          // Sobel X
          const sobelX = 
            -1 * grayscale[idx - width - 1] + 1 * grayscale[idx - width + 1] +
            -2 * grayscale[idx - 1] + 2 * grayscale[idx + 1] +
            -1 * grayscale[idx + width - 1] + 1 * grayscale[idx + width + 1]
          
          // Sobel Y
          const sobelY = 
            -1 * grayscale[idx - width - 1] - 2 * grayscale[idx - width] - 1 * grayscale[idx - width + 1] +
            1 * grayscale[idx + width - 1] + 2 * grayscale[idx + width] + 1 * grayscale[idx + width + 1]
          
          const magnitude = Math.sqrt(sobelX * sobelX + sobelY * sobelY)
          edges[idx] = magnitude > edgeThreshold ? 255 : 0
        }
      }
      
      // Create mask based on position and edges
      // Assume subject is in center and background is at edges
      const centerX = width / 2
      const centerY = height / 2
      const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY)
      
      for (let i = 0; i < data.length; i += 4) {
        const pixelIndex = i / 4
        const x = pixelIndex % width
        const y = Math.floor(pixelIndex / width)
        
        // Distance from center (subject likely to be in center)
        const distanceFromCenter = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2)
        const centerWeight = 1 - (distanceFromCenter / maxDistance)
        
        // Edge weight
        const edgeWeight = edges[pixelIndex] / 255
        
        // Combine weights to determine if pixel is foreground
        const isSubject = centerWeight > 0.3 || edgeWeight > 0.5
        
        if (!isSubject) {
          // Replace with background color
          const bgColor = hexToRgb(backgroundColor)
          data[i] = bgColor.r
          data[i + 1] = bgColor.g
          data[i + 2] = bgColor.b
          data[i + 3] = 255 // Full opacity
        }
      }
      
      // Put modified image data back
      ctx.putImageData(imageData, 0, 0)
      
      // Convert to blob and callback
      canvas.toBlob(blob => {
        if (blob) {
          const processedUrl = URL.createObjectURL(blob)
          onProcessed(processedUrl)
        }
      }, 'image/jpeg', 0.9)
    }
    
    img.src = imageUrl
  }, [imageUrl, onProcessed, backgroundColor])

  // Hex to RGB converter
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 255, g: 255, b: 255 }
  }

  // Auto-run background removal when component mounts
  React.useEffect(() => {
    removeBackground()
  }, [removeBackground])

  return (
    <canvas 
      ref={canvasRef} 
      className="hidden"
    />
  )
}

// Advanced image processing utilities
export class ImageProcessor {
  static async resizeImage(
    imageUrl: string, 
    maxWidth: number, 
    maxHeight: number, 
    quality: number = 0.9
  ): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        // Calculate new dimensions maintaining aspect ratio
        let { width, height } = img
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }
        if (height > maxHeight) {
          width = (width * maxHeight) / height
          height = maxHeight
        }

        canvas.width = width
        canvas.height = height
        
        // Enable image smoothing for better quality
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        
        ctx.drawImage(img, 0, 0, width, height)
        
        canvas.toBlob(blob => {
          if (blob) {
            resolve(URL.createObjectURL(blob))
          }
        }, 'image/jpeg', quality)
      }
      img.src = imageUrl
    })
  }

  static async convertFormat(
    imageUrl: string, 
    format: 'jpeg' | 'png' | 'webp', 
    quality: number = 0.9
  ): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        canvas.width = img.width
        canvas.height = img.height
        ctx.drawImage(img, 0, 0)
        
        canvas.toBlob(blob => {
          if (blob) {
            resolve(URL.createObjectURL(blob))
          }
        }, `image/${format}`, quality)
      }
      img.src = imageUrl
    })
  }

  static async cropToRatio(
    imageUrl: string,
    ratio: number, // width/height ratio
    quality: number = 0.9
  ): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const imgRatio = img.width / img.height
        let cropWidth = img.width
        let cropHeight = img.height
        let cropX = 0
        let cropY = 0

        if (imgRatio > ratio) {
          // Image is wider than target ratio
          cropWidth = img.height * ratio
          cropX = (img.width - cropWidth) / 2
        } else {
          // Image is taller than target ratio
          cropHeight = img.width / ratio
          cropY = (img.height - cropHeight) / 2
        }

        canvas.width = cropWidth
        canvas.height = cropHeight
        
        ctx.drawImage(
          img, 
          cropX, cropY, cropWidth, cropHeight,
          0, 0, cropWidth, cropHeight
        )
        
        canvas.toBlob(blob => {
          if (blob) {
            resolve(URL.createObjectURL(blob))
          }
        }, 'image/jpeg', quality)
      }
      img.src = imageUrl
    })
  }

  static async applyFilters(
    imageUrl: string,
    filters: {
      brightness?: number
      contrast?: number
      saturation?: number
      blur?: number
      sepia?: number
      hue?: number
    }
  ): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        canvas.width = img.width
        canvas.height = img.height
        
        // Build filter string
        const filterParts = []
        if (filters.brightness !== undefined) filterParts.push(`brightness(${filters.brightness}%)`)
        if (filters.contrast !== undefined) filterParts.push(`contrast(${filters.contrast}%)`)
        if (filters.saturation !== undefined) filterParts.push(`saturate(${filters.saturation}%)`)
        if (filters.blur !== undefined) filterParts.push(`blur(${filters.blur}px)`)
        if (filters.sepia !== undefined) filterParts.push(`sepia(${filters.sepia}%)`)
        if (filters.hue !== undefined) filterParts.push(`hue-rotate(${filters.hue}deg)`)
        
        ctx.filter = filterParts.join(' ')
        ctx.drawImage(img, 0, 0)
        
        canvas.toBlob(blob => {
          if (blob) {
            resolve(URL.createObjectURL(blob))
          }
        }, 'image/jpeg', 0.9)
      }
      img.src = imageUrl
    })
  }
}