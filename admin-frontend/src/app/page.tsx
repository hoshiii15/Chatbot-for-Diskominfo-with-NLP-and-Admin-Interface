import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-indigo-600/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-400/20 to-blue-600/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-blue-300/10 to-indigo-300/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen">
        <div className="text-center space-y-12 p-8 max-w-6xl mx-auto">
          {/* Logo/Brand section */}
          <div className="space-y-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-2xl mb-6 transform hover:scale-105 transition-transform duration-300">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-600 bg-clip-text text-transparent leading-tight">
              FAQ Chatbot
              <span className="block text-4xl md:text-5xl mt-2">Admin Dashboard</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Professional admin interface for managing your FAQ chatbot system.
              <span className="block mt-2">Monitor analytics, manage FAQs, and track system health.</span>
            </p>
          </div>
          
          {/* CTA Section */}
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/login">
                <Button 
                  size="lg" 
                  className="w-full sm:w-auto px-8 py-4 text-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  Admin Login
                </Button>
              </Link>
            </div>
            
            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 max-w-5xl mx-auto">
              <div className="group bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-bold text-xl mb-3 text-gray-800">FAQ Management</h3>
                <p className="text-gray-600 leading-relaxed">Add, edit, and organize frequently asked questions with an intuitive interface</p>
              </div>
              
              <div className="group bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="font-bold text-xl mb-3 text-gray-800">Analytics Dashboard</h3>
                <p className="text-gray-600 leading-relaxed">Track usage metrics and user interactions with detailed analytics and insights</p>
              </div>
              
              <div className="group bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="font-bold text-xl mb-3 text-gray-800">Real-time Monitoring</h3>
                <p className="text-gray-600 leading-relaxed">Monitor system health and chat logs with real-time updates and notifications</p>
              </div>
            </div>
          </div>
          
          {/* API Info removed for production/demo */}

          {/* Attribution */}
            <div className="pt-8">
              <p className="text-sm text-gray-500 flex items-center justify-center gap-1">
                Made with
                <span className="text-red-500 animate-pulse">❤️</span>
                for
                <span className="font-semibold text-gray-700">diskomindo sukoharjo</span>
              </p>
            </div>
        </div>
      </div>
    </div>
  )
}
