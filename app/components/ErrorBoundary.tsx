'use client'

import React from 'react'
import { AlertCircle } from 'lucide-react'

interface Props {
  children: React.ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Store component stack for better debugging and still log to console
    console.error('Error caught by boundary:', error, errorInfo)
    try {
      // update state with component stack if available
      // eslint-disable-next-line react/no-did-mount-set-state
      this.setState({ error: error })
      // Attach componentStack to window for quick inspection if needed
      ;(window as any).__lastComponentStack = errorInfo.componentStack
    } catch (e) {
      // ignore
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <AlertCircle className="w-6 h-6 text-red-500" />
              <h2 className="text-xl font-semibold text-gray-900">
                Terjadi Kesalahan
              </h2>
            </div>
            <p className="text-gray-600 mb-4">
              Maaf, aplikasi mengalami kesalahan. Silakan refresh halaman atau hubungi support jika masalah berlanjut.
            </p>
            <div className="bg-red-50 border border-red-200 rounded p-3 mb-4 max-h-48 overflow-auto">
              <p className="text-sm text-red-800 font-mono whitespace-pre-wrap">
                {this.state.error?.message || 'Unknown error'}
              </p>
              {this.state.error?.stack && (
                <pre className="text-xs text-red-700 mt-2 font-mono whitespace-pre-wrap">{this.state.error.stack}</pre>
              )}
              {/* Show last captured component stack if available on window */}
              {(window as any).__lastComponentStack && (
                <pre className="text-xs text-red-700 mt-2 font-mono whitespace-pre-wrap">{(window as any).__lastComponentStack}</pre>
              )}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
              >
                Refresh Halaman
              </button>
              <button
                onClick={() => this.setState({ hasError: false })}
                className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Coba Lagi
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
