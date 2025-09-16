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
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalRange, setModalRange] = useState<'1day'|'1week'|'1month'|'pickmonth'>('1day')
  const [pickedMonth, setPickedMonth] = useState<string>('')
  const [modalLogs, setModalLogs] = useState<ChatLog[] | null>(null)
  const [isModalLoading, setIsModalLoading] = useState(false)

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
            <div className="flex justify-between items-end gap-4 flex-wrap">
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Export</label>
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
              <div className="flex flex-col">
                <label className="block text-sm font-medium text-gray-700 mb-2">Danger Zone</label>
                <Button
                  onClick={() => setIsModalOpen(true)}
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-sm hover:shadow-md transition-all duration-200 border-red-500"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.963-.833-2.732 0L5.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  Manage Logs
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Modal for viewing/deleting logs */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-2xl shadow-2xl w-[90%] max-w-3xl p-6 max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Manage Chat Logs</h3>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={() => { setIsModalOpen(false); setModalLogs(null); }} className="border-gray-200">Close</Button>
                </div>
              </div>

              <div className="grid gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium">Range:</label>
                  <select value={modalRange} onChange={(e) => setModalRange(e.target.value as any)} className="px-3 py-2 border rounded">
                    <option value="1day">Last 1 day</option>
                    <option value="1week">Last 1 week</option>
                    <option value="1month">Last 1 month</option>
                    <option value="pickmonth">Pick month</option>
                  </select>
                  {modalRange === 'pickmonth' && (
                    <input type="month" value={pickedMonth} onChange={(e) => setPickedMonth(e.target.value)} className="ml-3 px-3 py-2 border rounded" />
                  )}
                  <Button onClick={async () => {
                    // fetch logs for modal preview
                    setIsModalLoading(true)
                    try {
                      const token = localStorage.getItem('authToken')
                      const params = new URLSearchParams()
                      params.set('range', modalRange)
                      params.set('environment', selectedEnv)
                      if (modalRange === 'pickmonth' && pickedMonth) params.set('month', pickedMonth)
                      const res = await fetch(`/api/logs?preview=true&${params.toString()}`, { headers: token ? { Authorization: `Bearer ${token}` } : undefined })
                      if (res.ok) {
                        const data = await res.json()
                        setModalLogs(data?.data?.logs || [])
                      } else if (res.status === 401) {
                        localStorage.removeItem('authToken')
                        window.location.href = '/login'
                        return
                      } else {
                        const txt = await res.text()
                        console.error('Preview logs failed', txt)
                        window.alert('Failed to preview logs')
                      }
                    } catch (err) {
                      console.error(err)
                      window.alert('Failed to preview logs')
                    } finally {
                      setIsModalLoading(false)
                    }
                  }} className="ml-2 bg-blue-600 text-white">Preview</Button>
                </div>

                <div className="flex items-center gap-2">
                  <Button onClick={async () => {
                    if (!confirm('Are you sure you want to delete logs for the selected range? This cannot be undone.')) return
                    try {
                      const token = localStorage.getItem('authToken')
                      // Send parameters in the POST body so the backend can read them from req.body
                      const payload: any = { range: modalRange, environment: selectedEnv }
                      if (modalRange === 'pickmonth' && pickedMonth) payload.month = pickedMonth
                      const headers: any = { 'Content-Type': 'application/json' }
                      if (token) headers.Authorization = `Bearer ${token}`
                      const res = await fetch(`/api/logs/delete`, { method: 'POST', headers, body: JSON.stringify(payload) })
                      if (res.ok) {
                        window.alert('Logs deleted for selected range')
                        // refresh main list
                        setModalLogs(null)
                        // reload page-level logs
                        setCurrentPage(1)
                        setSelectedEnv('all')
                      } else {
                        const txt = await res.text()
                        console.error('Delete failed', txt)
                        window.alert('Failed to delete logs')
                      }
                    } catch (err) {
                      console.error(err)
                      window.alert('Failed to delete logs')
                    }
                  }} className="bg-red-600 text-white">Delete Selected Range</Button>
                  <Button onClick={async () => {
                    if (!confirm('Delete ALL logs? This cannot be undone.')) return
                    try {
                      const token = localStorage.getItem('authToken')
                      const res = await fetch(`/api/logs/deleteAll`, { method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : undefined })
                      if (res.ok) {
                        window.alert('All logs deleted')
                        setModalLogs(null)
                        setCurrentPage(1)
                        setSelectedEnv('all')
                      } else {
                        const txt = await res.text()
                        console.error('Delete all failed', txt)
                        window.alert('Failed to delete all logs')
                      }
                    } catch (err) {
                      console.error(err)
                      window.alert('Failed to delete all logs')
                    }
                  }} className="bg-red-50 text-red-700 border border-red-200">Delete All Logs</Button>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-3">Preview</h4>
                {isModalLoading ? (
                  <p>Loading...</p>
                ) : modalLogs === null ? (
                  <p className="text-sm text-gray-500">No preview loaded. Click Preview to fetch logs for the selected range.</p>
                ) : modalLogs.length === 0 ? (
                  <p className="text-sm text-gray-500">No logs found for selected range.</p>
                ) : (
                  <div className="space-y-4">
                    {modalLogs.map(m => (
                      <div key={m.id} className="p-3 border rounded bg-gray-50">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm font-medium max-w-[70%] break-words">{m.question}</div>
                          <div className="text-xs text-gray-500">{new Date(m.createdAt).toLocaleString()}</div>
                        </div>
                        <div className="text-sm text-gray-700 whitespace-pre-wrap break-words max-h-48 overflow-auto">{sanitizeLogText(m.answer)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

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
                        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap break-words">{sanitizeLogText(log.answer)}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t border-gray-100">
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Response Time: {typeof log.responseTime === 'number' ? `${log.responseTime}ms` : '—'}
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

// Remove ANSI escape sequences and other non-printable control characters
function sanitizeLogText(input: string | undefined | null) {
  if (!input) return ''
  // ANSI escape sequences regex
  const ansi = /\x1B\[[0-?]*[ -\/]*[@-~]/g
  // Remove ANSI sequences
  let s = input.replace(ansi, '')
  // Remove other control chars except common whitespace (tab, newline, carriage return)
  s = s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
  return s
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
