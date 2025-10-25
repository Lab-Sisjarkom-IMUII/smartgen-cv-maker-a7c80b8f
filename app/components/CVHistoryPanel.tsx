'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { History, Clock, RotateCcw, Trash2, X, Eye, AlertCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface HistoryVersion {
  _id: string
  version: number
  changeDescription: string
  createdAt: string
  snapshot: any
}

interface CVHistoryPanelProps {
  cvId: string
  onRestore: (snapshot: any) => void
  onClose: () => void
}

export default function CVHistoryPanel({ cvId, onRestore, onClose }: CVHistoryPanelProps) {
  const [history, setHistory] = useState<HistoryVersion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedVersion, setSelectedVersion] = useState<HistoryVersion | null>(null)

  // Fetch history on mount
  useEffect(() => {
    fetchHistory()
  }, [cvId])

  const fetchHistory = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/cv/${cvId}/history`)
      const result = await response.json()

      if (result.success) {
        setHistory(result.data)
      } else {
        toast.error('Failed to load history')
      }
    } catch (error) {
      console.error('Error fetching history:', error)
      toast.error('Failed to load history')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRestore = async (historyId: string, version: number) => {
    if (!confirm(`Restore to version ${version}? Current changes will be saved as a new version.`)) {
      return
    }

    try {
      toast.loading('Restoring version...', { id: 'restore' })

      const response = await fetch(`/api/cv/${cvId}/history`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ historyId }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success(`Restored to version ${version}!`, { id: 'restore' })
        onRestore(result.data)
        onClose()
      } else {
        toast.error(result.error || 'Failed to restore', { id: 'restore' })
      }
    } catch (error) {
      console.error('Error restoring:', error)
      toast.error('Failed to restore version', { id: 'restore' })
    }
  }

  const handleDelete = async (historyId: string, version: number) => {
    if (!confirm(`Delete version ${version}?`)) {
      return
    }

    try {
      const response = await fetch(`/api/cv/${cvId}/history?historyId=${historyId}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (result.success) {
        toast.success(`Version ${version} deleted`)
        setHistory(history.filter(h => h._id !== historyId))
      } else {
        toast.error('Failed to delete')
      }
    } catch (error) {
      console.error('Error deleting:', error)
      toast.error('Failed to delete version')
    }
  }

  const formatDate = (date: string) => {
    const d = new Date(date)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    
    if (hours < 1) return 'Just now'
    if (hours < 24) return `${hours}h ago`
    
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                <History className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Version History</h2>
                <p className="text-blue-100 text-sm">
                  {history.length} saved versions
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-500">Loading history...</p>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg font-medium">No history yet</p>
              <p className="text-gray-400 text-sm mt-2">
                Version snapshots will appear here as you make changes
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((version, index) => (
                <motion.div
                  key={version._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`border-2 rounded-xl p-4 hover:shadow-md transition-all ${
                    index === 0
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      {/* Version Badge */}
                      <div className={`px-3 py-1 rounded-lg font-bold text-sm ${
                        index === 0
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-700'
                      }`}>
                        v{version.version}
                      </div>

                      {/* Details */}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <p className="font-semibold text-gray-900">
                            {version.changeDescription}
                          </p>
                          {index === 0 && (
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">
                              Current
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{formatDate(version.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    {index !== 0 && (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setSelectedVersion(version)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Preview"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRestore(version._id, version.version)}
                          className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Restore this version"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(version._id, version.version)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete version"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <p className="text-xs text-gray-500 text-center">
            💡 Tip: Last 20 versions are kept automatically. Older versions are deleted.
          </p>
        </div>
      </motion.div>
    </motion.div>
  )
}
