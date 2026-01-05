'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { 
  FileText, 
  MessageSquare, 
  Download, 
  Settings, 
  LogOut,
  Plus,
  Eye,
  Edit,
  Sparkles,
  Save,
  Check,
  History,
  Camera
} from 'lucide-react'
import AIChat from './AIChat'
import CVBuilder from './CVBuilder'
import TemplateSelector from './TemplateSelector'
import CVPreview from './CVPreview'
import SimplePhotoUploader from './SimplePhotoUploader'
import CVHistoryPanel from './CVHistoryPanel'
// import PWAInstallPrompt from './PWAInstallPrompt'
// import PWAStatus from './PWAStatus'
// import ServiceWorkerRegistration from './ServiceWorkerRegistration'
import { useCVData } from '@/hooks/useCVData'

type TabType = 'chat' | 'builder' | 'templates' | 'photo' | 'preview'

interface DashboardProps {
  onLogout?: () => void
}

export default function Dashboard({ onLogout }: DashboardProps) {
  const { data: session } = useSession()
  // Initialize activeTab from localStorage immediately
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    if (typeof window !== 'undefined') {
      const savedTab = localStorage.getItem('activeTab')
      return (savedTab as TabType) || 'chat'
    }
    return 'chat'
  })
  // Initialize selectedTemplate from localStorage
  const [selectedTemplate, setSelectedTemplate] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const savedTemplate = localStorage.getItem('selectedTemplate')
      console.log('🎨 Loading template from localStorage:', savedTemplate)
      return savedTemplate || 'modern'
    }
    return 'modern'
  })
  const [showHistory, setShowHistory] = useState(false)
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Use MySQL database via Prisma for CV data
  const {
    cvData,
    setCVData,
    allCVs,
    isLoading,
    isSaving,
    lastSaved,
    createCV,
    updateCV,
    deleteCV,
    autoSave,
    fetchCV,
    fetchAllCVs,
  } = useCVData()
  
  // Load data from localStorage on mount and when localStorage changes
  useEffect(() => {
    const loadDataFromLocalStorage = () => {
      console.log('🔄 Loading CV data from localStorage')
      const savedCV = localStorage.getItem('currentCV')
      if (savedCV) {
        try {
          const parsedCV = JSON.parse(savedCV)
          console.log('📦 Loaded CV from localStorage:', parsedCV.personalInfo?.name || 'No name')
          console.log('📸 Photo in loaded CV:', parsedCV.personalInfo?.photo ? 'Yes' : 'No')
          console.log('🎨 Template in loaded CV:', parsedCV.template?.id || 'No template')
          setCVData(parsedCV)
          
          // Set template from loaded CV data
          if (parsedCV.template?.id) {
            setSelectedTemplate(parsedCV.template.id)
            localStorage.setItem('selectedTemplate', parsedCV.template.id)
          }
        } catch (error) {
          console.error('❌ Error parsing localStorage CV:', error)
        }
      } else {
        // No saved CV, load template from localStorage if available
        const savedTemplate = localStorage.getItem('selectedTemplate')
        if (savedTemplate) {
          console.log('🎨 Loading saved template:', savedTemplate)
          setSelectedTemplate(savedTemplate)
        }
      }
    }

    // Load on mount
    loadDataFromLocalStorage()

    // Listen for localStorage changes (for when data is restored)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'currentCV') {
        console.log('🔔 localStorage currentCV changed, reloading...')
        loadDataFromLocalStorage()
      }
    }

    window.addEventListener('storage', handleStorageChange)

    // Also listen for manual localStorage updates (same-tab changes)
    const originalSetItem = localStorage.setItem
    localStorage.setItem = function(key, value) {
      originalSetItem.apply(this, [key, value])
      if (key === 'currentCV') {
        console.log('🔔 localStorage currentCV manually updated')
        // Small delay to ensure the data is set
        setTimeout(loadDataFromLocalStorage, 10)
      }
    }

    // Also listen for data restoration events
    const handleDataRestored = (e: any) => {
      console.log('🔔 Data restoration event received')
      setTimeout(() => {
        loadDataFromLocalStorage()
        
        // Also sync template
        const savedTemplate = localStorage.getItem('selectedTemplate')
        if (savedTemplate) {
          setSelectedTemplate(savedTemplate)
        }
      }, 50)
    }

    window.addEventListener('dataRestored', handleDataRestored)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('dataRestored', handleDataRestored)
      localStorage.setItem = originalSetItem
    }
  }, [setCVData])

  // Load template from CV data when CV changes
  useEffect(() => {
    try {
      if (cvData?.template?.id) {
        console.log('🎨 Loading template from CV data:', cvData.template.id)
        setSelectedTemplate(cvData.template.id)
        localStorage.setItem('selectedTemplate', cvData.template.id)
      } else if (cvData && !cvData.template) {
        // Set default template if CV exists but has no template
        console.log('🎨 Setting default template: modern')
        setSelectedTemplate('modern')
        localStorage.setItem('selectedTemplate', 'modern')
      }
    } catch (error) {
      console.error('Error loading template:', error)
      setSelectedTemplate('modern') // Fallback to modern
      localStorage.setItem('selectedTemplate', 'modern')
    }
  }, [cvData])

  // Save active tab to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('activeTab', activeTab)
  }, [activeTab])

  // Save selected template to localStorage when it changes
  useEffect(() => {
    if (selectedTemplate) {
      localStorage.setItem('selectedTemplate', selectedTemplate)
      console.log('🎨 Template saved to localStorage:', selectedTemplate)
    }
  }, [selectedTemplate])

  // Cleanup auto-save timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
    }
  }, [])

  const handleLogout = async () => {
    // Clear localStorage
    if (onLogout) {
      onLogout()
    }
    // Sign out from NextAuth if there's a session
    if (session) {
      await signOut({ redirect: false })
    }
  }

  const tabs = [
    { id: 'chat', label: 'Asisten AI', icon: MessageSquare },
    { id: 'builder', label: 'Pembuat CV', icon: FileText },
    { id: 'photo', label: 'Foto Profesional', icon: Camera },
    { id: 'templates', label: 'Template', icon: Eye },
    { id: 'preview', label: 'Pratinjau', icon: Download },
  ]

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab)
  }

  const handleCVDataUpdate = (data: any) => {
    console.log('Received CV data update:', data)
    
    // Merge new data with existing data (don't overwrite existing fields)
    // Remove duplicates by checking if item already exists
    const existingExperiences = cvData?.experiences || []
    const newExperiences = data?.experiences || data?.experience || []
    const mergedExperiences = [...existingExperiences]
    
    // Only add new experiences that don't already exist
    newExperiences.forEach((newExp: any) => {
      const isDuplicate = existingExperiences.some((existing: any) => 
        existing.company === newExp.company && existing.position === newExp.position
      )
      if (!isDuplicate) {
        mergedExperiences.push(newExp)
      }
    })
    
    const existingEducation = cvData?.education || []
    const newEducation = data?.education || []
    const mergedEducation = [...existingEducation]
    
    // Only add new education that don't already exist
    newEducation.forEach((newEdu: any) => {
      const isDuplicate = existingEducation.some((existing: any) => 
        existing.institution === newEdu.institution && existing.field === newEdu.field
      )
      if (!isDuplicate) {
        mergedEducation.push(newEdu)
      }
    })
    
    const existingSkills = cvData?.skills || []
    const newSkills = data?.skills || []
    const mergedSkills = Array.from(new Set([...existingSkills, ...newSkills])) // Remove duplicate skills
    
    const mergedData = {
      title: cvData?.title || 'My CV',
      personalInfo: {
        ...(cvData?.personalInfo || {}),
        ...(data?.personalInfo || {}),
        // Preserve photo from existing data if new data doesn't have photo
        photo: data?.personalInfo?.photo || cvData?.personalInfo?.photo
      },
      experiences: mergedExperiences,
      education: mergedEducation,
      skills: mergedSkills,
      template: cvData?.template || data?.template || { id: 'modern', name: 'Modern' }
    }
    
    console.log('Merged CV data:', mergedData)
    setCVData(mergedData)
    
    // Save to localStorage immediately (instant backup)
    localStorage.setItem('currentCV', JSON.stringify(mergedData))
    
    // Auto-save to MySQL database via API (debounced)
    if (mergedData && session?.user?.email) {
      // Clear existing timeout
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
      
      // Set new timeout
      autoSaveTimeoutRef.current = setTimeout(() => {
        autoSave(mergedData) // Use merged data, not the raw input
      }, 2000) // Save after 2 seconds of inactivity
    }
  }

  const handlePhotoChange = (photoDataUrl: string) => {
    if (cvData) {
      const updatedCVData = {
        ...cvData,
        personalInfo: {
          ...cvData.personalInfo,
          photo: photoDataUrl
        }
      }
      
      setCVData(updatedCVData)
      localStorage.setItem('currentCV', JSON.stringify(updatedCVData))
      
      toast.success('Foto berhasil disimpan ke CV')
      
      // Auto-save with timeout
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
      autoSaveTimeoutRef.current = setTimeout(() => {
        autoSave(updatedCVData)
      }, 1000)
    } else {
      console.log('❌ No CV data available to attach photo')
    }
  }

  const handleTemplateSelect = (template: string) => {
    console.log('🎯 Template selected:', template)
    
    // Update state immediately
    setSelectedTemplate(template)
    localStorage.setItem('selectedTemplate', template)
    
    // Update CV data dengan template baru
    if (cvData) {
      const updatedData = {
        ...cvData,
        template: {
          id: template,
          name: template.charAt(0).toUpperCase() + template.slice(1)
        }
      }
      
      console.log('🔄 Updating CV data with new template:', updatedData)
      setCVData(updatedData)
      localStorage.setItem('currentCV', JSON.stringify(updatedData))
      
      // Auto-save dengan delay
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
      autoSaveTimeoutRef.current = setTimeout(() => {
        autoSave(updatedData)
      }, 500)
    } else {
      // Create new CV with template
      const newData = {
        title: 'My CV',
        personalInfo: {},
        experiences: [],
        education: [],
        skills: [],
        template: {
          id: template,
          name: template.charAt(0).toUpperCase() + template.slice(1)
        }
      }
      
      console.log('🆕 Creating new CV with template:', newData)
      setCVData(newData)
      localStorage.setItem('currentCV', JSON.stringify(newData))
    }
    
    // Redirect to Preview
    setActiveTab('preview')
    toast.success(`Template "${template}" berhasil dipilih!`)
  }

  return (
    <div className="min-h-screen bg-gray-50 w-full overflow-x-hidden">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 hidden xs:block">SmartGen CV Maker</h1>
                <h1 className="text-lg font-bold text-gray-900 block xs:hidden">SmartGen CV</h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Save Status Indicator */}
              {session?.user?.email && (
                <div className="flex items-center space-x-2">
                  {isSaving ? (
                    <>
                      <Save className="w-4 h-4 text-blue-500 animate-pulse" />
                      <span className="text-xs text-gray-500">Saving...</span>
                    </>
                  ) : lastSaved ? (
                    <>
                      <Check className="w-4 h-4 text-green-500" />
                      <span className="text-xs text-gray-500">
                        Saved {new Date(lastSaved).toLocaleTimeString()}
                      </span>
                    </>
                  ) : null}
                </div>
              )}
              
              <div className="flex items-center space-x-2 sm:space-x-3">
                <img
                  src={session?.user?.image || '/default-avatar.png'}
                  alt={session?.user?.name || 'User'}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full"
                />
                <span className="text-sm font-medium text-gray-700 hidden sm:block">
                  {session?.user?.name || 'Demo User'}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b overflow-x-auto">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center min-w-max sm:min-w-0">
            <nav className="flex space-x-4 sm:space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id as TabType)}
                    className={`flex items-center space-x-1 sm:space-x-2 py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden xs:block">{tab.label}</span>
                  </button>
                )
              })}
            </nav>
            
            {/* Empty space for cleaner navigation */}
            <div></div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'chat' && (
            <AIChat onCVDataUpdate={handleCVDataUpdate} />
          )}
          
          {activeTab === 'builder' && (
            <CVBuilder 
              cvData={cvData} 
              template={selectedTemplate}
              onDataUpdate={handleCVDataUpdate}
            />
          )}

          {activeTab === 'photo' && (
            <SimplePhotoUploader 
              onPhotoComplete={(imageUrl: string) => {
                if (cvData) {
                  const updatedData = {
                    ...cvData,
                    personalInfo: {
                      ...(cvData.personalInfo || {}),
                      photo: imageUrl
                    }
                  }
                  
                  setCVData(updatedData)
                  localStorage.setItem('currentCV', JSON.stringify(updatedData))
                  
                  // Auto-save with timeout
                  if (autoSaveTimeoutRef.current) {
                    clearTimeout(autoSaveTimeoutRef.current)
                  }
                  autoSaveTimeoutRef.current = setTimeout(() => {
                    autoSave(updatedData)
                  }, 1000)
                } else {
                  // Create new CV if none exists
                  const newCVData = {
                    title: 'My CV',
                    personalInfo: {
                      photo: imageUrl
                    },
                    experiences: [],
                    education: [],
                    skills: [],
                    template: { id: 'modern', name: 'Modern' }
                  }
                  setCVData(newCVData)
                  localStorage.setItem('currentCV', JSON.stringify(newCVData))
                }
                
                toast.success('Foto profesional berhasil ditambahkan ke CV!')
              }}
              className="max-w-none"
            />
          )}

          {activeTab === 'templates' && (
            <TemplateSelector 
              onTemplateSelect={handleTemplateSelect} 
              selectedTemplate={selectedTemplate}
            />
          )}
          
          {activeTab === 'preview' && (
            <CVPreview 
              cvData={cvData} 
              template={selectedTemplate}
              onClear={() => {
                setCVData(null)
                localStorage.removeItem('currentCV')
                setActiveTab('builder')
              }}
            />
          )}
        </motion.div>
      </main>

      {/* History Panel Modal */}
      {showHistory && cvData?._id && (
        <CVHistoryPanel
          cvId={cvData._id}
          onRestore={(restoredData) => {
            setCVData(restoredData)
            localStorage.setItem('currentCV', JSON.stringify(restoredData))
          }}
          onClose={() => setShowHistory(false)}
        />
      )}

      {/* PWA Components */}
      {/* <PWAStatus /> */}
      {/* <PWAInstallPrompt /> */}
      {/* <ServiceWorkerRegistration /> */}
    </div>
  )
}

