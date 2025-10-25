'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { motion } from 'framer-motion'
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
  Check
} from 'lucide-react'
import AIChat from './AIChat'
import CVBuilder from './CVBuilder'
import TemplateSelector from './TemplateSelector'
import CVPreview from './CVPreview'
import AIPhotoFormatterFree from './AIPhotoFormatterFree'
import { useCVData } from '@/hooks/useCVData'

type TabType = 'chat' | 'builder' | 'templates' | 'preview' | 'photo'

interface DashboardProps {
  onLogout?: () => void
}

export default function Dashboard({ onLogout }: DashboardProps) {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState<TabType>('chat')
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Use MongoDB CV data hook
  const {
    cvData,
    setCVData,
    allCVs,
    isLoading,
    isSaving,
    lastSaved,
    createCV,
    updateCV,
    autoSave,
  } = useCVData()

  // Load active tab from localStorage on mount
  useEffect(() => {
    const savedTab = localStorage.getItem('activeTab')
    if (savedTab) {
      setActiveTab(savedTab as TabType)
    }
  }, [])

  // Save active tab to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('activeTab', activeTab)
  }, [activeTab])

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
    { id: 'chat', label: 'AI Assistant', icon: MessageSquare },
    { id: 'builder', label: 'CV Builder', icon: FileText },
    { id: 'templates', label: 'Templates', icon: Eye },
    { id: 'photo', label: 'AI Photo', icon: Sparkles },
    { id: 'preview', label: 'Preview', icon: Download },
  ]

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab)
  }

  const handleCVDataUpdate = (data: any) => {
    setCVData(data)
    
    // Save to localStorage immediately (instant backup)
    localStorage.setItem('currentCV', JSON.stringify(data))
    
    // Debounced auto-save to MongoDB (after 2 seconds of no changes)
    if (data && session?.user?.email) {
      // Clear existing timeout
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
      
      // Set new timeout
      autoSaveTimeoutRef.current = setTimeout(() => {
        autoSave(data)
      }, 2000) // Save after 2 seconds of inactivity
    }
  }

  const handleTemplateSelect = (template: string) => {
    setSelectedTemplate(template)
    setActiveTab('builder')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-xl font-bold text-gray-900">SmartGen CV Maker</h1>
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
              
              <div className="flex items-center space-x-3">
                <img
                  src={session?.user?.image || '/default-avatar.png'}
                  alt={session?.user?.name || 'User'}
                  className="w-8 h-8 rounded-full"
                />
                <span className="text-sm font-medium text-gray-700">
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
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <nav className="flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id as TabType)}
                    className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </nav>
            
            {/* New CV Button */}
            {session?.user?.email && activeTab === 'builder' && (
              <button
                onClick={async () => {
                  const newCV = await createCV({
                    title: 'New CV',
                    personalInfo: {
                      fullName: session?.user?.name || '',
                      email: session?.user?.email || '',
                    },
                    experiences: [],
                    education: [],
                    skills: [],
                    template: {
                      id: 'modern',
                      name: 'Modern',
                    },
                  })
                  if (newCV) {
                    setCVData(newCV)
                  }
                }}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                <span>New CV</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
          
          {activeTab === 'templates' && (
            <TemplateSelector onTemplateSelect={handleTemplateSelect} />
          )}
          
          {activeTab === 'photo' && (
            <AIPhotoFormatterFree />
          )}
          
          {activeTab === 'preview' && (
            <CVPreview cvData={cvData} template={selectedTemplate} />
          )}
        </motion.div>
      </main>
    </div>
  )
}
