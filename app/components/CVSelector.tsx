'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, Plus, Trash2, Calendar, ChevronDown } from 'lucide-react'

interface CV {
  _id?: string
  title: string
  updatedAt?: Date
  [key: string]: any
}

interface CVSelectorProps {
  cvs: CV[]
  currentCV: CV | null
  onSelect: (cv: CV) => void
  onCreateNew: () => void
  onDelete: (id: string) => void
  isLoading?: boolean
}

export default function CVSelector({
  cvs,
  currentCV,
  onSelect,
  onCreateNew,
  onDelete,
  isLoading = false,
}: CVSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      {/* Current CV Display */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <FileText className="w-4 h-4 text-gray-600" />
        <span className="text-sm font-medium text-gray-700">
          {currentCV?.title || 'Select CV'}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full mt-2 right-0 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-y-auto"
          >
            {/* Create New CV Button */}
            <button
              onClick={() => {
                onCreateNew()
                setIsOpen(false)
              }}
              className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-blue-50 transition-colors border-b border-gray-200"
            >
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Plus className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-blue-600">Create New CV</p>
                <p className="text-xs text-gray-500">Start with a blank CV</p>
              </div>
            </button>

            {/* CV List */}
            {isLoading ? (
              <div className="px-4 py-8 text-center">
                <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Loading CVs...</p>
              </div>
            ) : cvs.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No CVs yet</p>
                <p className="text-xs text-gray-400">Click "Create New CV" to start</p>
              </div>
            ) : (
              <div className="py-2">
                {cvs.map((cv) => (
                  <div
                    key={cv._id}
                    className={`flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors ${
                      currentCV?._id === cv._id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <button
                      onClick={() => {
                        onSelect(cv)
                        setIsOpen(false)
                      }}
                      className="flex-1 flex items-center space-x-3 text-left"
                    >
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <FileText className={`w-5 h-5 ${
                          currentCV?._id === cv._id ? 'text-blue-600' : 'text-gray-600'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${
                          currentCV?._id === cv._id ? 'text-blue-600' : 'text-gray-900'
                        }`}>
                          {cv.title}
                        </p>
                        <div className="flex items-center space-x-1 text-xs text-gray-500">
                          <Calendar className="w-3 h-3" />
                          <span>
                            {cv.updatedAt ? new Date(cv.updatedAt).toLocaleDateString() : 'Today'}
                          </span>
                        </div>
                      </div>
                    </button>
                    
                    {/* Delete Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        if (cv._id && confirm(`Delete "${cv.title}"?`)) {
                          onDelete(cv._id)
                        }
                      }}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Delete CV"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay to close dropdown */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}
