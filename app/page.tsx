'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import MockAuthPage from './components/MockAuthPage'
import Dashboard from './components/Dashboard'
import ErrorBoundary from './components/ErrorBoundary'

export default function Home() {
  const { data: session, status } = useSession()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    console.log('📍 useEffect triggered, session:', session?.user?.email)
    
    // If there's a NextAuth session, always show dashboard
    if (session) {
      localStorage.setItem('isLoggedIn', 'true')
      setIsLoggedIn(true)
      
      // Try to restore all user data when session is available
      const userEmail = session?.user?.email
      if (userEmail) {
        const backupKey = `user_backup_${userEmail}`
        const savedData = localStorage.getItem(backupKey)
        
        console.log('🔍 Auto-restore check for user:', userEmail)
        console.log('📦 Backup data exists:', savedData ? 'Yes' : 'No')
        
        if (savedData) {
          try {
            const parsedData = JSON.parse(savedData)
            console.log('🔄 Auto-restoring user data for:', userEmail)
            
            // Restore each piece of data if it doesn't already exist
            if (parsedData.currentCV && !localStorage.getItem('currentCV')) {
              localStorage.setItem('currentCV', parsedData.currentCV)
              
              // Check if photo is restored
              try {
                const restoredCV = JSON.parse(parsedData.currentCV)
                console.log('📸 Photo auto-restored:', restoredCV.personalInfo?.photo ? 'Yes' : 'No')
              } catch (e) {
                console.log('❌ Error checking auto-restored photo:', e)
              }
              
              console.log('✅ CV data auto-restored')
            }
            
            if (parsedData.activeTab) {
              localStorage.setItem('activeTab', parsedData.activeTab)
              console.log('✅ Active tab auto-restored')
            }
            
            if (parsedData.aiChatHistory && !localStorage.getItem('aiChatHistory')) {
              localStorage.setItem('aiChatHistory', parsedData.aiChatHistory)
              console.log('✅ AI chat history auto-restored')
            }
            
            if (parsedData.selectedTemplate) {
              localStorage.setItem('selectedTemplate', parsedData.selectedTemplate)
              console.log('✅ Template selection auto-restored:', parsedData.selectedTemplate)
            }
            
            console.log('🎯 All user data auto-restoration completed')
            
            // Trigger custom event to notify components about data restore
            window.dispatchEvent(new CustomEvent('dataRestored', { detail: parsedData }))
            
          } catch (error) {
            console.error('❌ Error auto-restoring user data:', error)
          }
        } else {
          console.log('ℹ️ No backup data found for auto-restore')
        }
      }
      
      setIsLoading(false)
      return
    }
    
    // If no NextAuth session, check localStorage for demo mode
    const loggedIn = localStorage.getItem('isLoggedIn') === 'true'
    console.log('📍 No session, checking localStorage. Logged in:', loggedIn)
    setIsLoggedIn(loggedIn)
    setIsLoading(false)
  }, [session])

  const handleLogin = () => {
    localStorage.setItem('isLoggedIn', 'true')
    setIsLoggedIn(true)
    
    // Try to restore user data after manual login
    const userEmail = session?.user?.email
    console.log('🚪 Login triggered for user:', userEmail)
    
    if (userEmail) {
      const backupKey = `user_backup_${userEmail}`
      const savedData = localStorage.getItem(backupKey)
      
      console.log('🔍 Looking for backup data with key:', backupKey)
      console.log('📦 Found backup data:', savedData ? 'Yes' : 'No')
      
      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData)
          console.log('🔄 Restoring user data after login for:', userEmail)
          console.log('📋 Data to restore:', parsedData)
          
          // Restore data
          if (parsedData.currentCV) {
            localStorage.setItem('currentCV', parsedData.currentCV)
            
            // Check if photo is restored
            try {
              const restoredCV = JSON.parse(parsedData.currentCV)
              console.log('📸 Photo restored after login:', restoredCV.personalInfo?.photo ? 'Yes' : 'No')
            } catch (e) {
              console.log('❌ Error checking restored photo:', e)
            }
            
            console.log('✅ CV data restored')
          }
          if (parsedData.activeTab) {
            localStorage.setItem('activeTab', parsedData.activeTab)
            console.log('✅ Active tab restored')
          }
          if (parsedData.aiChatHistory) {
            localStorage.setItem('aiChatHistory', parsedData.aiChatHistory)
            console.log('✅ AI chat history restored')
          }
          if (parsedData.selectedTemplate) {
            localStorage.setItem('selectedTemplate', parsedData.selectedTemplate)
            console.log('✅ Template selection restored:', parsedData.selectedTemplate)
          }
          
          console.log('✅ All user data restored after login')
          
          // Trigger custom event to notify components about data restore
          window.dispatchEvent(new CustomEvent('dataRestored', { detail: parsedData }))
          
        } catch (error) {
          console.error('❌ Error restoring user data after login:', error)
        }
      } else {
        console.log('ℹ️ No backup data found for user:', userEmail)
      }
    } else {
      console.log('❌ No user email available for restore')
    }
  }

  const handleLogout = () => {
    // Get user email from current session before logout
    const userEmail = session?.user?.email
    console.log('🚪 Logout triggered for user:', userEmail)
    
    if (userEmail) {
      // Get current CV data and check if photo exists
      const currentCVData = localStorage.getItem('currentCV')
      if (currentCVData) {
        try {
          const parsedCV = JSON.parse(currentCVData)
          console.log('📸 Photo in CV before backup:', parsedCV.personalInfo?.photo ? 'Yes' : 'No')
          if (parsedCV.personalInfo?.photo) {
            console.log('📸 Photo data length:', parsedCV.personalInfo.photo.length)
          }
        } catch (e) {
          console.log('❌ Error parsing CV data for photo check:', e)
        }
      }
      
      // Backup all important user data before logout
      const dataToBackup = {
        currentCV: localStorage.getItem('currentCV'),
        activeTab: localStorage.getItem('activeTab'),
        aiChatHistory: localStorage.getItem('aiChatHistory'),
        selectedTemplate: localStorage.getItem('selectedTemplate'),
        backupTimestamp: new Date().toISOString()
      }
      
      console.log('📦 Data to backup:', {
        currentCV: dataToBackup.currentCV ? 'Present' : 'Missing',
        activeTab: dataToBackup.activeTab,
        aiChatHistory: dataToBackup.aiChatHistory ? 'Present' : 'Missing',
        selectedTemplate: dataToBackup.selectedTemplate
      })
      
      // Check if photo is in backup data
      if (dataToBackup.currentCV) {
        try {
          const parsedBackupCV = JSON.parse(dataToBackup.currentCV)
          console.log('📸 Photo in backup data:', parsedBackupCV.personalInfo?.photo ? 'Yes' : 'No')
        } catch (e) {
          console.log('❌ Error parsing backup CV data:', e)
        }
      }
      
      // Only backup if there's actual data
      const hasData = Object.values(dataToBackup).some(val => val !== null && val !== undefined && val !== '')
      
      if (hasData) {
        localStorage.setItem(`user_backup_${userEmail}`, JSON.stringify(dataToBackup))
        console.log('💾 All user data backed up for:', userEmail)
      } else {
        console.log('⚠️ No data to backup')
      }
    } else {
      console.log('❌ No user email available for backup')
    }
    
    localStorage.removeItem('isLoggedIn')
    setIsLoggedIn(false)
  }

  if (isLoading || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-bg">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    )
  }

  if (!isLoggedIn && !session) {
    return <MockAuthPage onLogin={handleLogin} />
  }

  return (
    <ErrorBoundary>
      <Dashboard onLogout={handleLogout} />
    </ErrorBoundary>
  )
}
