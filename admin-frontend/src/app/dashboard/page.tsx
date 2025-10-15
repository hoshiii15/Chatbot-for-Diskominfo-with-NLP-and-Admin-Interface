'use client'

import { useEffect, useState } from 'react'
import { Power } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface DashboardStats {
  totalQuestions?: number
  totalFAQs?: number
  activeUsers?: number
  systemHealth?: string
  totalSessions?: number
  totalUsers?: number
}

interface SystemStatus {
  backend: 'Running' | 'Error' | 'Unknown'
  database: 'Connected' | 'Disconnected' | 'Unknown'
  pythonBot: 'Running' | 'Check Required' | 'Error' | 'Unknown'
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    backend: 'Unknown',
    database: 'Unknown',
    pythonBot: 'Unknown'
  })
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  const quickActions = [
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: 'Manage FAQs',
      description: 'Add, edit, and organize frequently asked questions',
      href: '/dashboard/faqs',
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      title: 'View Analytics',
      description: 'Track usage metrics and user interactions',
      href: '/dashboard/analytics',
      color: 'from-indigo-500 to-indigo-600'
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      title: 'Chat Logs',
      description: 'Monitor real-time chat interactions',
      href: '/dashboard/logs',
      color: 'from-purple-500 to-purple-600'
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      title: 'System Health',
      description: 'Check system status and performance',
      href: '/dashboard/health',
      color: 'from-green-500 to-green-600'
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Running':
      case 'Connected':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'Check Required':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'Error':
      case 'Disconnected':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    router.push('/login')
  }

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('authToken')
        console.log('Token retrieved:', token ? 'Token exists' : 'No token found')
        
        if (!token) {
          console.log('No token found, redirecting to login')
          window.location.href = '/login'
          return
        }

  const response = await fetch('/api/dashboard/stats', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.ok) {
          const result = await response.json()
          setStats(result.data)
          setSystemStatus(prev => ({ ...prev, backend: 'Running', database: 'Connected' }))
        } else if (response.status === 401) {
          localStorage.removeItem('authToken')
          window.location.href = '/login'
        } else {
          setSystemStatus(prev => ({ ...prev, backend: 'Error' }))
        }
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error)
        setSystemStatus(prev => ({ ...prev, backend: 'Error' }))
      }
    }

        const fetchSystemHealth = async () => {
      try {
        const healthResponse = await fetch('/api/health')
        if (healthResponse.ok) {
          const healthResult = await healthResponse.json()
          setSystemStatus(prev => ({
            ...prev,
            backend: 'Running',
            database: healthResult.data.database.status === 'healthy' ? 'Connected' : 'Disconnected',
            pythonBot: healthResult.data.services.chatbot.status === 'healthy' ? 'Running' : 'Check Required'
          }))
        }
      } catch (error) {
        console.error('Failed to fetch system health:', error)
      }
    }

    const fetchAnalyticsTotals = async () => {
      try {
        const token = localStorage.getItem('authToken')
        if (!token) return

        const resp = await fetch('/api/analytics?environment=all&days=30', {
          headers: { Authorization: `Bearer ${token}` }
        })

        if (resp.ok) {
          const json = await resp.json()
          const analytics = json.data
          setStats(prev => ({ ...(prev || {}), totalQuestions: analytics?.total_questions || 0, totalSessions: analytics?.total_sessions || 0 }))
        } else if (resp.status === 401) {
          localStorage.removeItem('authToken')
          window.location.href = '/login'
        }
      } catch (error) {
        console.error('Failed to fetch analytics totals:', error)
      }
    }

    const loadData = async () => {
      await Promise.all([fetchStats(), fetchSystemHealth(), fetchAnalyticsTotals()])
      setIsLoading(false)
    }

    loadData()
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-indigo-600/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-400/20 to-blue-600/20 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg mb-4">
            <svg className="w-8 h-8 text-white animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <div className="text-lg font-medium text-gray-700">Loading dashboard...</div>
          <div className="text-sm text-gray-500 mt-2">Please wait while we fetch your data</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-blue-900 dark:to-indigo-900 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/10 to-indigo-600/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-400/10 to-blue-600/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-blue-300/5 to-indigo-300/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
                  Admin Dashboard
                </h1>
              </div>
              <p className="text-muted-foreground text-lg">FAQ Chatbot Management System</p>
            </div>
            <Button 
              onClick={handleLogout}
              variant="outline"
              className="bg-card/80 dark:bg-card/60 backdrop-blur-sm border-border/20 hover:bg-accent/50 transition-all duration-200"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="backdrop-blur-sm bg-card/80 dark:bg-card/60 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 group">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                  Total Questions
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </CardTitle>
                <CardDescription className="text-3xl font-bold text-foreground">
                  {stats?.totalQuestions || 0}
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="backdrop-blur-sm bg-card/80 dark:bg-card/60 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 group">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                  Total FAQs
                  <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </CardTitle>
                <CardDescription className="text-3xl font-bold text-foreground">
                  {stats?.totalFAQs || 0}
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="backdrop-blur-sm bg-card/80 dark:bg-card/60 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 group">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                  Total Sessions
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                </CardTitle>
                <CardDescription className="text-3xl font-bold text-foreground">
                  {stats?.totalSessions || 0}
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="backdrop-blur-sm bg-card/80 dark:bg-card/60 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 group">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                  System Health
                  <div className={`w-8 h-8 bg-gradient-to-r rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300 ${
                    stats?.systemHealth === 'Healthy' ? 'from-green-500 to-green-600' : 'from-red-500 to-red-600'
                  }`}>
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                </CardTitle>
                <CardDescription className={`text-3xl font-bold ${
                  stats?.systemHealth === 'Healthy' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stats?.systemHealth || 'Unknown'}
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Quick Actions */}
            <Card className="backdrop-blur-sm bg-card/80 dark:bg-card/60 border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-foreground flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {quickActions.map((action, index) => (
                    <Link key={index} href={action.href}>
                      <div className="group p-4 border border-border/20 rounded-xl hover:bg-accent/50 cursor-pointer transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg">
                        <div className="flex items-center space-x-4">
                          <div className={`w-12 h-12 bg-gradient-to-r ${action.color} rounded-xl flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                            {action.icon}
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-foreground group-hover:text-primary transition-colors duration-200">
                              {action.title}
                            </div>
                            <div className="text-sm text-muted-foreground group-hover:text-muted-foreground/80 transition-colors duration-200">
                              {action.description}
                            </div>
                          </div>
                          <svg className="w-5 h-5 text-muted-foreground group-hover:text-primary transform group-hover:translate-x-1 transition-all duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* System Status */}
            <Card className="backdrop-blur-sm bg-card/80 dark:bg-card/60 border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-foreground flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  System Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-accent/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      <span className="font-medium text-foreground">Backend API</span>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(systemStatus.backend)}`}>
                      {systemStatus.backend}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-accent/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="font-medium text-foreground">Python Chatbot</span>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(systemStatus.pythonBot)}`}>
                      {systemStatus.pythonBot}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-accent/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                      <span className="font-medium text-foreground">Database</span>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(systemStatus.database)}`}>
                      {systemStatus.database}
                    </span>
                  </div>
                  {/* Restart System Action */}
                  <div className="flex justify-between items-center p-3">
                    <div className="flex items-center gap-3">
                      <Power className="h-5 w-5 text-muted-foreground" />
                      <span className="font-medium text-foreground">Restart System</span>
                    </div>
                    <Button
                      variant="destructive"
                      onClick={async () => {
                        if (!confirm('Are you sure you want to request a system restart?')) return
                        try {
                          const token = localStorage.getItem('authToken')
                          const resp = await fetch('/api/system/restart', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              ...(token ? { Authorization: `Bearer ${token}` } : {})
                            },
                            // Only request restart for the python bot from the frontend
                            body: JSON.stringify({ target: 'python-bot' })
                          })
                          if (resp.ok) {
                            alert('Restart request submitted. Check system logs for progress.')
                          } else if (resp.status === 401) {
                            localStorage.removeItem('authToken')
                            window.location.href = '/login'
                          } else {
                            const js = await resp.json().catch(() => ({}))
                            alert('Failed to request restart: ' + (js.error || resp.statusText))
                          }
                        } catch (error) {
                          console.error('Restart request failed', error)
                          alert('Failed to send restart request. See console for details.')
                        }
                      }}
                    >
                      Restart
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Attribution */}
          <div className="text-center mt-12 pb-6">
              <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                Made with
                <span className="text-red-500 animate-pulse">❤️</span>
                for
                <span className="font-semibold text-foreground">diskominfo sukoharjo</span>
              </p>
          </div>
        </div>
      </div>
    </div>
  )
}
