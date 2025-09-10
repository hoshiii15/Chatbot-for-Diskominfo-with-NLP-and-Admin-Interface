'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface HealthData {
  status: string
  timestamp: string
  uptime: number
  version: string
  environment: string
  memory: {
    used: number
    total: number
    rss: number
    external: number
  }
  system: {
    platform: string
    arch: string
    nodeVersion: string
    cpus: number
    loadAverage: number[]
    totalMemory: number
    freeMemory: number
  }
  database: {
    status: string
    connections: number
    lastQuery: string | null
  }
  services: {
    chatbot: { status: string; lastCheck: string | null }
    fileSystem: { status: string; lastCheck: string | null }
    nlpProcessor: { status: string; lastCheck: string | null }
  }
}

export default function SystemHealthPage() {
  const [healthData, setHealthData] = useState<HealthData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<string>('')

  const fetchHealthStatus = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/health')
      if (response.ok) {
        const data = await response.json()
        setHealthData(data.data)
        setLastUpdated(new Date().toLocaleString())
      }
    } catch (error) {
      console.error('Failed to fetch health status:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchHealthStatus()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchHealthStatus, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800'
      case 'warning':
        return 'bg-yellow-100 text-yellow-800'
      case 'unhealthy':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return '✅'
      case 'warning':
        return '⚠️'
      case 'unhealthy':
        return '❌'
      default:
        return '❓'
    }
  }

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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <div className="text-lg font-medium text-gray-700">Loading system health...</div>
          <div className="text-sm text-gray-500 mt-2">Please wait while we check system status</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  System Health
                </h1>
              </div>
              <p className="text-gray-600 text-lg">Monitor system status and performance</p>
            </div>
            <div className="flex gap-3">
              <Button 
                onClick={fetchHealthStatus}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-sm hover:shadow-md transition-all duration-200"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </Button>
              <Button 
                variant="outline" 
                onClick={async () => {
                  try {
                    const resp = await fetch('http://localhost:3001/api/health/restart', { method: 'POST' });
                    const json = await resp.json();
                    alert(json.message || 'Restart requested');
                  } catch (e) {
                    alert('Failed to request restart');
                  }
                }}
                className="bg-white/80 backdrop-blur-sm border-orange-200 hover:bg-orange-50 text-orange-700 hover:text-orange-900 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Restart
              </Button>
              <Link href="/dashboard">
                <Button 
                  variant="outline" 
                  className="bg-white/80 backdrop-blur-sm border-gray-200 hover:bg-gray-50 text-gray-700 hover:text-gray-900 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  ← Back to Dashboard
                </Button>
              </Link>
            </div>
          </div>

        {/* Last Updated */}
        {lastUpdated && (
          <div className="mb-8">
            <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 shadow-sm border border-gray-100 text-center">
              <span className="text-sm text-gray-600 flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Last updated: {lastUpdated}
              </span>
            </div>
          </div>
        )}

        <div className="grid gap-6">
          {!healthData ? (
            <Card className="bg-white/80 backdrop-blur-sm border-gray-100 shadow-sm">
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.99-.833-2.732 0L2.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <p className="text-gray-500 text-lg">No health data available</p>
                <p className="text-gray-400 text-sm mt-2">Unable to retrieve system status</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Overall System Status */}
              <Card className="bg-white/80 backdrop-blur-sm border-gray-100 shadow-sm hover:shadow-md transition-all duration-200">
                <CardHeader className="border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      System Status
                    </CardTitle>
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{getStatusIcon(healthData.status)}</div>
                      <span className={`px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor(healthData.status)} ${
                        healthData.status === 'healthy' ? 'border-green-200' : 
                        healthData.status === 'warning' ? 'border-yellow-200' : 
                        'border-red-200'
                      }`}>
                        {healthData.status.charAt(0).toUpperCase() + healthData.status.slice(1)}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                      <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Uptime
                      </h4>
                      <p className="text-gray-700 font-semibold">{Math.floor(healthData.uptime / 3600)}h {Math.floor((healthData.uptime % 3600) / 60)}m</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                      <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                        <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        Version
                      </h4>
                      <p className="text-gray-700 font-semibold">{healthData.version}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                      <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Environment
                      </h4>
                      <p className="text-gray-700 font-semibold capitalize">{healthData.environment}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Services Status */}
              <div className="grid gap-4 md:grid-cols-3">
                {Object.entries(healthData.services).map(([serviceName, service]) => (
                  <Card key={serviceName} className="bg-white/80 backdrop-blur-sm border-gray-100 shadow-sm hover:shadow-md transition-all duration-200">
                    <CardHeader className="border-b border-gray-100">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-semibold text-gray-900 capitalize flex items-center gap-2">
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          {serviceName.replace(/([A-Z])/g, ' $1').trim()}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getStatusIcon(service.status)}</span>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(service.status)} ${
                            service.status === 'healthy' ? 'border-green-200' : 
                            service.status === 'warning' ? 'border-yellow-200' : 
                            'border-red-200'
                          }`}>
                            {service.status.charAt(0).toUpperCase() + service.status.slice(1)}
                          </span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                        <h4 className="font-medium text-gray-900 mb-2 text-sm flex items-center gap-2">
                          <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Last Check
                        </h4>
                        <p className="text-gray-600 text-xs">{service.lastCheck ? new Date(service.lastCheck).toLocaleString() : 'Never'}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Database Status */}
              <Card className="bg-white/80 backdrop-blur-sm border-gray-100 shadow-sm hover:shadow-md transition-all duration-200">
                <CardHeader className="border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                      </svg>
                      Database
                    </CardTitle>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getStatusIcon(healthData.database.status)}</span>
                      <span className={`px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor(healthData.database.status)} ${
                        healthData.database.status === 'healthy' ? 'border-green-200' : 
                        healthData.database.status === 'warning' ? 'border-yellow-200' : 
                        'border-red-200'
                      }`}>
                        {healthData.database.status.charAt(0).toUpperCase() + healthData.database.status.slice(1)}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                      <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Last Query
                    </h4>
                    <p className="text-gray-700 font-medium">{healthData.database.lastQuery ? new Date(healthData.database.lastQuery).toLocaleString() : 'Never'}</p>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* System Actions */}
        <div className="mt-8">
          <Card className="bg-white/80 backdrop-blur-sm border-gray-100 shadow-sm">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                System Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button 
                  variant="outline" 
                  className="h-auto p-6 bg-white/60 backdrop-blur-sm border-orange-200 hover:bg-orange-50 hover:border-orange-300 transition-all duration-200" 
                  onClick={async () => {
                    try {
                      const resp = await fetch('http://localhost:3001/api/health/restart', { method: 'POST' });
                      const json = await resp.json();
                      alert(json.message || 'Restart requested');
                    } catch (e) {
                      alert('Failed to request restart');
                    }
                  }}
                >
                  <div className="text-center">
                    <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </div>
                    <div className="font-medium text-gray-900">Restart Services</div>
                    <div className="text-sm text-gray-500 mt-1">Restart all system services</div>
                  </div>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-auto p-6 bg-white/60 backdrop-blur-sm border-blue-200 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200" 
                  onClick={() => window.open('http://localhost:3001/api/health/logs?source=bot', '_blank')}
                >
                  <div className="text-center">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div className="font-medium text-gray-900">View Bot Log</div>
                    <div className="text-sm text-gray-500 mt-1">Open recent bot log tail</div>
                  </div>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-auto p-6 bg-white/60 backdrop-blur-sm border-green-200 hover:bg-green-50 hover:border-green-300 transition-all duration-200" 
                  onClick={async () => {
                    try {
                      const resp = await fetch('http://localhost:3001/api/health/settings');
                      if (!resp.ok) throw new Error('Failed');
                      const json = await resp.json();
                      const s = JSON.stringify(json.data, null, 2);
                      alert('Settings:\n' + s);
                    } catch (e) {
                      alert('Failed to load settings');
                    }
                  }}
                >
                  <div className="text-center">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div className="font-medium text-gray-900">System Settings</div>
                    <div className="text-sm text-gray-500 mt-1">View runtime settings</div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Attribution */}
        <div className="mt-12 text-center">
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-gray-100 max-w-md mx-auto">
            <p className="text-gray-600 text-sm">
              Made with{' '}
              <span className="text-red-500 animate-pulse inline-block transform hover:scale-110 transition-transform duration-200">
                ❤️
              </span>{' '}
              by{' '}
              <span className="font-semibold text-gray-900">
                Hosea Raka
              </span>
            </p>
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}
