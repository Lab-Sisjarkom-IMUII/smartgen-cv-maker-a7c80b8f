import React, { useState } from 'react'
import { Camera, Upload, Wand2, Download, ArrowLeft, ArrowRight } from 'lucide-react'
import EnhancedPhotoCapture from './EnhancedPhotoCapture'
import MobileCropTool from './MobileCropTool'
import CVPhotoTemplates from './CVPhotoTemplates'
import BackgroundRemoval, { ImageProcessor } from './ImageProcessor'
import toast from 'react-hot-toast'

interface MasterPhotoCaptureProps {
  onPhotoComplete?: (imageUrl: string) => void
  className?: string
}

type WorkflowStep = 'capture' | 'crop' | 'enhance' | 'templates' | 'final'

export default function MasterPhotoCapture({
  onPhotoComplete,
  className = ''
}: MasterPhotoCaptureProps) {
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('capture')
  const [capturedImage, setCapturedImage] = useState<string>('')
  const [croppedImage, setCroppedImage] = useState<string>('')
  const [enhancedImage, setEnhancedImage] = useState<string>('')
  const [finalImage, setFinalImage] = useState<string>('')
  
  const [selectedAspectRatio, setSelectedAspectRatio] = useState(4/6)
  const [processingStep, setProcessingStep] = useState('')

  const stepTitles = {
    capture: 'Capture or Upload Photo',
    crop: 'Crop & Adjust',
    enhance: 'Enhance & Filter',
    templates: 'Apply CV Template',
    final: 'Final Review'
  }

  const stepIcons = {
    capture: <Camera className="w-5 h-5" />,
    crop: <Upload className="w-5 h-5" />,
    enhance: <Wand2 className="w-5 h-5" />,
    templates: <Camera className="w-5 h-5" />,
    final: <Download className="w-5 h-5" />
  }

  // Handle photo capture/upload
  const handlePhotoCaptured = (imageUrl: string) => {
    setCapturedImage(imageUrl)
    setCurrentStep('crop')
    toast.success('Photo captured! Now crop and adjust.')
  }

  // Handle crop completion
  const handleCropComplete = async (croppedUrl: string) => {
    setProcessingStep('Optimizing image...')
    
    try {
      // Auto-resize and optimize the cropped image
      const optimizedUrl = await ImageProcessor.resizeImage(croppedUrl, 800, 1200, 0.9)
      setCroppedImage(optimizedUrl)
      setCurrentStep('enhance')
      toast.success('Photo cropped! Apply enhancements.')
    } catch (error) {
      toast.error('Error processing image')
    } finally {
      setProcessingStep('')
    }
  }

  // Handle enhancement
  const handleEnhanceComplete = async (enhancedUrl: string) => {
    setProcessingStep('Applying background removal...')
    
    try {
      // Auto-apply subtle enhancements for CV photos
      const filters = {
        brightness: 105,
        contrast: 108,
        saturation: 95,
        blur: 0
      }
      
      const filteredUrl = await ImageProcessor.applyFilters(enhancedUrl, filters)
      setEnhancedImage(filteredUrl)
      setCurrentStep('templates')
      toast.success('Photo enhanced! Choose a professional template.')
    } catch (error) {
      toast.error('Error enhancing image')
    } finally {
      setProcessingStep('')
    }
  }

  // Handle template application
  const handleTemplateApplied = (templateUrl: string) => {
    setFinalImage(templateUrl)
    setCurrentStep('final')
    toast.success('Template applied! Your CV photo is ready.')
  }

  // Handle final completion
  const handleFinalComplete = () => {
    if (onPhotoComplete && finalImage) {
      onPhotoComplete(finalImage)
    }
    
    // Download the final image
    const link = document.createElement('a')
    link.href = finalImage
    link.download = `professional-cv-photo-${Date.now()}.jpg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    toast.success('CV photo saved successfully!')
  }

  // Navigation helpers
  const canGoNext = () => {
    switch (currentStep) {
      case 'capture': return capturedImage !== ''
      case 'crop': return croppedImage !== ''
      case 'enhance': return enhancedImage !== ''
      case 'templates': return finalImage !== ''
      case 'final': return true
      default: return false
    }
  }

  const canGoPrev = () => currentStep !== 'capture'

  const goNext = () => {
    const steps: WorkflowStep[] = ['capture', 'crop', 'enhance', 'templates', 'final']
    const currentIndex = steps.indexOf(currentStep)
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1])
    }
  }

  const goPrev = () => {
    const steps: WorkflowStep[] = ['capture', 'crop', 'enhance', 'templates', 'final']
    const currentIndex = steps.indexOf(currentStep)
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1])
    }
  }

  const resetWorkflow = () => {
    setCapturedImage('')
    setCroppedImage('')
    setEnhancedImage('')
    setFinalImage('')
    setCurrentStep('capture')
    toast('Workflow reset. Start with a new photo.', { icon: 'ℹ️' })
  }

  return (
    <div className={`bg-white rounded-xl shadow-xl ${className}`}>
      {/* Header with step indicator */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-t-xl">
        <h2 className="text-2xl font-bold mb-4">Professional CV Photo Creator</h2>
        
        {/* Step Progress */}
        <div className="flex items-center justify-between">
          {Object.entries(stepTitles).map(([step, title], index) => (
            <div key={step} className="flex items-center">
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                currentStep === step 
                  ? 'bg-white/20 text-white' 
                  : 'text-white/70'
              }`}>
                {stepIcons[step as keyof typeof stepIcons]}
                <span className="hidden sm:inline font-medium">{title}</span>
              </div>
              {index < Object.keys(stepTitles).length - 1 && (
                <ArrowRight className="w-4 h-4 mx-2 text-white/50" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {processingStep && (
          <div className="mb-6 text-center">
            <div className="inline-flex items-center gap-2 text-blue-600">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              {processingStep}
            </div>
          </div>
        )}

        {/* Step Content */}
        {currentStep === 'capture' && (
          <EnhancedPhotoCapture 
            onPhotoComplete={handlePhotoCaptured}
            className="border-0 shadow-none bg-transparent"
          />
        )}

        {currentStep === 'crop' && capturedImage && (
          <div>
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">Crop Your Photo</h3>
              <p className="text-gray-600">Adjust the crop area and zoom to get the perfect framing.</p>
            </div>
            <MobileCropTool
              imageUrl={capturedImage}
              onCropComplete={handleCropComplete}
              aspectRatio={selectedAspectRatio}
              className="max-w-lg mx-auto"
            />
            
            {/* Aspect Ratio Selector */}
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600 mb-2">Photo Type:</p>
              <div className="flex gap-2 justify-center">
                <button
                  onClick={() => setSelectedAspectRatio(4/6)}
                  className={`px-3 py-1 rounded-full text-sm ${
                    selectedAspectRatio === 4/6 ? 'bg-blue-500 text-white' : 'bg-gray-200'
                  }`}
                >
                  Passport
                </button>
                <button
                  onClick={() => setSelectedAspectRatio(1)}
                  className={`px-3 py-1 rounded-full text-sm ${
                    selectedAspectRatio === 1 ? 'bg-blue-500 text-white' : 'bg-gray-200'
                  }`}
                >
                  Square
                </button>
                <button
                  onClick={() => setSelectedAspectRatio(3/4)}
                  className={`px-3 py-1 rounded-full text-sm ${
                    selectedAspectRatio === 3/4 ? 'bg-blue-500 text-white' : 'bg-gray-200'
                  }`}
                >
                  Portrait
                </button>
              </div>
            </div>
          </div>
        )}

        {currentStep === 'enhance' && croppedImage && (
          <div>
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">Enhance Your Photo</h3>
              <p className="text-gray-600">We'll automatically optimize your photo for professional use.</p>
            </div>
            
            <div className="text-center">
              <img 
                src={croppedImage} 
                alt="Cropped photo" 
                className="max-w-xs mx-auto rounded-lg shadow-md mb-4"
              />
              
              <button
                onClick={() => handleEnhanceComplete(croppedImage)}
                className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center gap-2 mx-auto"
              >
                <Wand2 className="w-5 h-5" />
                Auto-Enhance Photo
              </button>
            </div>
          </div>
        )}

        {currentStep === 'templates' && enhancedImage && (
          <div>
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">Choose Professional Template</h3>
              <p className="text-gray-600">Select a background template that matches your industry.</p>
            </div>
            
            <CVPhotoTemplates
              imageUrl={enhancedImage}
              onTemplateApplied={handleTemplateApplied}
              className="border-0 shadow-none bg-transparent"
            />
          </div>
        )}

        {currentStep === 'final' && finalImage && (
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-4">Your Professional CV Photo</h3>
            
            <div className="max-w-sm mx-auto">
              <img 
                src={finalImage} 
                alt="Final CV photo" 
                className="w-full rounded-lg shadow-lg mb-6"
              />
              
              <div className="space-y-3">
                <button
                  onClick={handleFinalComplete}
                  className="w-full px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2 justify-center"
                >
                  <Download className="w-5 h-5" />
                  Download & Use Photo
                </button>
                
                <button
                  onClick={resetWorkflow}
                  className="w-full px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Create Another Photo
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Footer */}
      {currentStep !== 'final' && (
        <div className="flex justify-between items-center p-6 bg-gray-50 rounded-b-xl">
          <button
            onClick={goPrev}
            disabled={!canGoPrev()}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-4 h-4" />
            Previous
          </button>
          
          <div className="text-sm text-gray-500">
            Step {Object.keys(stepTitles).indexOf(currentStep) + 1} of {Object.keys(stepTitles).length}
          </div>
          
          <button
            onClick={goNext}
            disabled={!canGoNext()}
            className="flex items-center gap-2 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Background removal component (hidden, used for processing) */}
      {enhancedImage && (
        <BackgroundRemoval
          imageUrl={enhancedImage}
          onProcessed={(url) => {
            // This will be used internally for background processing
            setEnhancedImage(url)
          }}
          backgroundColor="#ffffff"
        />
      )}
    </div>
  )
}