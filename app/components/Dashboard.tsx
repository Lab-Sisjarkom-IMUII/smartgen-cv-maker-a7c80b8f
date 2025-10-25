'use client'

import { useState } from 'react'
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
  Sparkles
} from 'lucide-react'
import AIChat from './AIChat'
import CVBuilder from './CVBuilder'
import TemplateSelector from './TemplateSelector'
import CVPreview from './CVPreview'
import AIPhotoFormatterFree from './AIPhotoFormatterFree'

type TabType = 'chat' | 'builder' | 'templates' | 'preview' | 'photo'

interface DashboardProps {
  onLogout?: () => void
}

export default function Dashboard({ onLogout }: DashboardProps) {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState<TabType>('chat')
  const [cvData, setCvData] = useState<any>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')

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
    setCvData(data)
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
