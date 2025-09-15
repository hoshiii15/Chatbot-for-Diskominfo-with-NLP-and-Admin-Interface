'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface ChatLog {
  id: string
  sessionId?: string
  createdAt: string
  question: string
  answer: string
  confidence: number
  category?: string
  environment: string
  status: string
  responseTime: number
}

export default function ChatLogsPage() {
  const [logs, setLogs] = useState<ChatLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedEnv, setSelectedEnv] = useState('all')
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const token = localStorage.getItem('authToken')
        const response = await fetch(
          `/api/logs?page=${currentPage}&limit=20&environment=${selectedEnv}`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          }
        )
        if (response.ok) {
          const data = await response.json()
          // backend returns { success, data: { logs, pagination } }
          const logsFromServer = data?.data?.logs || []
          setLogs(logsFromServer)
          const pagination = data?.data?.pagination
          setTotalPages(pagination?.totalPages || 1)
          setCurrentPage(pagination?.page || currentPage)
        } else if (response.status === 401) {
          localStorage.removeItem('authToken')
          window.location.href = '/login'
          return
        }
      } catch (error) {
        console.error('Failed to fetch logs:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchLogs()
  }, [currentPage, selectedEnv])

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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <div className="text-lg font-medium text-gray-700">Loading chat logs...</div>
          <div className="text-sm text-gray-500 mt-2">Please wait while we fetch your data</div>
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Chat Logs
                </h1>
              </div>
              <p className="text-gray-600 text-lg">Monitor real-time chat interactions</p>
            </div>
            <Link href="/dashboard">
              <Button 
                variant="outline" 
                className="bg-white/80 backdrop-blur-sm border-gray-200 hover:bg-gray-50 text-gray-700 hover:text-gray-900 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                ← Back to Dashboard
              </Button>
            </Link>
          </div>

        {/* Filters and Export */}
        <div className="mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex gap-4 items-center flex-wrap">
              <div className="flex flex-col">
                <label className="block text-sm font-medium text-gray-700 mb-2">Environment Filter</label>
                <select 
                  value={selectedEnv} 
                  onChange={(e) => setSelectedEnv(e.target.value)}
                  className="px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all duration-200"
                >
                  <option value="all">All Environments</option>
                  <option value="stunting">Stunting</option>
                  <option value="ppid">PPID</option>
                </select>
              </div>
              <div className="flex flex-col">
                <label className="block text-sm font-medium text-gray-700 mb-2">Actions</label>
                <Button 
                  onClick={() => exportLogsAsCSV(logs)}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export Logs
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Logs */}
        <div className="space-y-6">
          {logs.length === 0 ? (
            <Card className="bg-white/80 backdrop-blur-sm border-gray-100 shadow-sm">
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p className="text-gray-500 text-lg">No chat logs found</p>
                <p className="text-gray-400 text-sm mt-2">Try adjusting your filters or check back later</p>
              </CardContent>
            </Card>
          ) : (
            logs.map((log) => (
              <Card key={log.id} className="bg-white/80 backdrop-blur-sm border-gray-100 shadow-sm hover:shadow-md transition-all duration-200">
                <CardHeader className="border-b border-gray-100">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg text-gray-900 mb-3">{log.question}</CardTitle>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          log.environment === 'stunting' 
                            ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                            : 'bg-green-100 text-green-700 border border-green-200'
                        }`}>
                          {log.environment.toUpperCase()}
                        </span>
                        {log.category && (
                          <span className="px-3 py-1 bg-gray-100 text-gray-700 border border-gray-200 rounded-full text-xs font-medium">
                            {log.category}
                          </span>
                        )}
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          log.status === 'success' 
                            ? 'bg-green-100 text-green-700 border border-green-200' 
                            : 'bg-red-100 text-red-700 border border-red-200'
                        }`}>
                          {log.status}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          log.confidence >= 0.8 
                            ? 'bg-green-100 text-green-700 border border-green-200' 
                            : log.confidence >= 0.6 
                            ? 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                            : 'bg-red-100 text-red-700 border border-red-200'
                        }`}>
                          {(log.confidence * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                        Answer:
                      </h4>
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                        <p className="text-gray-700 leading-relaxed">{log.answer}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t border-gray-100">
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Response Time: {log.responseTime}ms
                      </span>
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4h4a1 1 0 011 1v2a1 1 0 01-1 1h-4v8a1 1 0 01-1 1H9a1 1 0 01-1-1v-8H4a1 1 0 01-1-1V8a1 1 0 011-1h4z" />
                        </svg>
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Pagination */}
        {logs.length > 0 && (
          <div className="mt-8 flex items-center justify-center gap-4">
            <Button 
              variant="outline" 
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="bg-white/80 backdrop-blur-sm border-gray-200 hover:bg-gray-50 text-gray-700 hover:text-gray-900 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Previous
            </Button>
            <span className="bg-white/80 backdrop-blur-sm px-4 py-2 rounded-lg border border-gray-100 text-gray-700 font-medium">
              Page {currentPage} of {totalPages}
            </span>
            <Button 
              variant="outline" 
              onClick={() => setCurrentPage(prev => prev + 1)}
              disabled={currentPage >= totalPages}
              className="bg-white/80 backdrop-blur-sm border-gray-200 hover:bg-gray-50 text-gray-700 hover:text-gray-900 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Button>
          </div>
        )}

        {/* Attribution */}
        <div className="mt-12 text-center">
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-gray-100 max-w-md mx-auto">
            <p className="text-gray-600 text-sm">
              Made with{' '}
              <span className="text-red-500 animate-pulse inline-block transform hover:scale-110 transition-transform duration-200">
                ❤️
              </span>{' '}
              for diskomindo sukoharjo
            </p>
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}

// CSV export helper
function exportLogsAsCSV(logs: ChatLog[]) {
  if (!logs || logs.length === 0) return

  const headers = ['id','sessionId','question','answer','confidence','category','environment','status','responseTime','createdAt']
  const rows = logs.map(l => [
    l.id,
    l.sessionId || '',
    l.question.replace(/"/g, '""'),
    l.answer.replace(/"/g, '""'),
    l.confidence?.toString() ?? '',
    l.category || '',
    l.environment || '',
    l.status || '',
    l.responseTime?.toString() ?? '',
    l.createdAt || ''
  ])

  const csv = [headers.join(','), ...rows.map(r => r.map(cell => `"${cell}"`).join(','))].join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `chat-logs-${new Date().toISOString()}.csv`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
