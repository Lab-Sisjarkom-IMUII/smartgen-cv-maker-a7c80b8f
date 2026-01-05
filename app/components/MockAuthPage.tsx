'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { FileText, Sparkles, Users, Shield, Mail, Lock, User, Camera, MessageSquare, Download } from 'lucide-react'
import { signIn } from 'next-auth/react'
import toast from 'react-hot-toast'

interface MockAuthPageProps {
  onLogin: () => void
}

export default function MockAuthPage({ onLogin }: MockAuthPageProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    // Simulate API call
    setTimeout(() => {
      toast.success(isSignUp ? 'Akun berhasil dibuat!' : 'Login berhasil!')
      onLogin()
    }, 1000)
  }

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    try {
      // Call NextAuth signIn with Google provider
      // This will redirect to Google's OAuth consent screen
      await signIn('google', { 
        callbackUrl: '/',
        redirect: true // This will redirect the page to Google OAuth
      })
      // Note: The page will redirect, so code after this won't execute
    } catch (error) {
      console.error('Google OAuth error:', error)
      setIsLoading(false)
      toast.error('Gagal menghubungkan dengan Google. Coba lagi.')
    }
  }

  const features = [
    {
      icon: <MessageSquare className="w-8 h-8 text-primary-600" />,
      title: "Asisten AI Chat",
      description: "Dapatkan panduan CV personal dan saran konten dari AI"
    },
    {
      icon: <FileText className="w-8 h-8 text-primary-600" />,
      title: "6 Template Profesional",
      description: "Modern, Kreatif, Minimalis, Eksekutif, Akademik, Startup"
    },
    {
      icon: <Camera className="w-8 h-8 text-primary-600" />,
      title: "Upload Foto Profesional",
      description: "Upload foto untuk CV Anda dengan format JPEG, PNG, atau WebP"
    },
    {
      icon: <Download className="w-8 h-8 text-primary-600" />,
      title: "Export & Download",
      description: "Download CV dalam format PDF, PNG, atau bagikan langsung ke sosial media"
    }
  ]

  return (
    <div className="min-h-screen gradient-bg">
      {/* Mobile Header - Visible only on mobile */}
      <div className="lg:hidden px-4 py-6 text-white text-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-2xl font-bold mb-3">
            SmartGen CV Maker
          </h1>
          <p className="text-sm text-blue-100">
            Buat CV profesional dengan bantuan AI
          </p>
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row min-h-screen lg:min-h-auto">
        {/* Left Side - Branding & Features - Hidden on mobile, shown on lg+ */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-8 xl:px-12 text-white">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl xl:text-5xl font-bold mb-6">
              SmartGen CV Maker
            </h1>
            <p className="text-lg xl:text-xl mb-8 text-blue-100">
              Buat CV profesional dengan bantuan AI chat, upload foto profesional, 
              dan 6+ template premium. Export ke PDF atau berbagi langsung.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 xl:gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="glass-effect rounded-lg p-4 xl:p-6"
              >
                <div className="mb-3">{feature.icon}</div>
                <h3 className="text-base xl:text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-blue-100 text-xs xl:text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Right Side - Auth Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8 lg:py-0">
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="w-full max-w-md"
          >
            <div className="glass-effect rounded-xl lg:rounded-2xl p-6 lg:p-8">
              <div className="text-center mb-6 lg:mb-8">
                <h2 className="text-2xl lg:text-3xl font-bold text-white mb-2">
                  {isSignUp ? 'Buat Akun' : 'Selamat Datang'}
                </h2>
              <p className="text-blue-100">
                {isSignUp ? 'Bergabung dengan SmartGen CV Maker hari ini' : 'Masuk ke akun Anda'}
              </p>
            </div>

            {/* Google Login Button */}
            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full bg-white text-gray-900 font-semibold py-3 px-6 rounded-lg hover:bg-gray-100 transition-colors duration-200 flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed mb-6"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900"></div>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span>Lanjutkan dengan Google</span>
                </>
              )}
            </button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-blue-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-transparent text-blue-100">Atau lanjutkan dengan email</span>
              </div>
            </div>

            {/* Email/Password Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && (
                <div>
                  <label className="block text-sm font-medium text-blue-100 mb-2">
                    Nama Lengkap
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 bg-white/10 border border-blue-300 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      placeholder="Nama Lengkap"
                      required={isSignUp}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-blue-100 mb-2">
                  Alamat Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full pl-10 pr-4 py-3 bg-white/10 border border-blue-300 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="nama@email.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-blue-100 mb-2">
                  Kata Sandi
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full pl-10 pr-4 py-3 bg-white/10 border border-blue-300 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  </div>
                ) : (
                  <span>{isSignUp ? 'Buat Akun' : 'Masuk'}</span>
                )}
              </button>
            </form>

            {/* Toggle Sign Up / Login */}
            <div className="mt-6 text-center">
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-blue-100 hover:text-white transition-colors text-sm"
              >
                {isSignUp ? (
                  <>Sudah punya akun? <span className="font-semibold">Masuk</span></>
                ) : (
                  <>Belum punya akun? <span className="font-semibold">Daftar</span></>
                )}
              </button>
            </div>

            <div className="mt-4 text-center">
              <p className="text-blue-100 text-xs">
                Mode Demo: Email/password apapun bisa digunakan untuk testing
              </p>
            </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Mobile Features Section - Only visible on mobile */}
      <div className="lg:hidden px-4 py-8 text-white">
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold mb-2">Fitur Unggulan</h3>
          <p className="text-blue-100 text-sm">
            Semua yang Anda butuhkan untuk membuat CV profesional
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="glass-effect rounded-lg p-4 text-center"
            >
              <div className="mb-3 flex justify-center">{feature.icon}</div>
              <h4 className="text-sm font-semibold mb-2">{feature.title}</h4>
              <p className="text-blue-100 text-xs">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
