'use client'

import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock,
  Copy,
  Cpu,
  Database,
  FileText,
  HardDrive,
  Info,
  Loader2,
  Power,
  RefreshCw,
  Save,
  Server,
  Settings,
  Share2,
  Siren,
  Terminal,
  
  X,
  XCircle,
} from 'lucide-react'
import { useEffect, useState, useRef, useCallback } from 'react'
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
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [systemSettings, setSystemSettings] = useState<any>(null)
  const [settingsLoading, setSettingsLoading] = useState(false)
  const [showBotLogModal, setShowBotLogModal] = useState(false)
  const [botLogs, setBotLogs] = useState<string>('')
  const [botLogsLoading, setBotLogsLoading] = useState(false)
  const [botLogsError, setBotLogsError] = useState<string | null>(null)
  const logContainerRef = useRef<HTMLDivElement | null>(null)
  

  const fetchHealthStatus = useCallback(async () => {
    setIsLoading(true)
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

      const response = await fetch('/api/health', {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        const data = await response.json()
        setHealthData(data.data)
        setLastUpdated(new Date().toISOString())
      } else {
        console.warn('Health check returned non-OK status:', response.status)
        setHealthData(null)
      }
    } catch (error) {
      const err = error as Error
      if (err.name === 'AbortError') {
        console.warn('Health check request timed out')
      } else {
        console.warn('Failed to fetch health status:', err.message || 'Unknown error')
      }
      setHealthData(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const fetchSystemSettings = async () => {
    setSettingsLoading(true)
    try {
      const response = await fetch('/api/health/settings')
      if (response.ok) {
        const data = await response.json()
        setSystemSettings(data.data)
      } else {
        setSystemSettings({ error: 'Failed to load settings' })
      }
    } catch (error) {
      setSystemSettings({ error: 'Settings service unavailable' })
    } finally {
      setSettingsLoading(false)
    }
  }

  const openSettingsModal = () => {
    setShowSettingsModal(true)
    fetchSystemSettings()
  }

  const fetchBotLogs = async () => {
    setBotLogsLoading(true)
    setBotLogsError(null)
    try {
      const response = await fetch('/api/health/logs?source=bot')
      if (response.ok) {
        const logText = await response.text()
        setBotLogs(logText)
      } else {
        setBotLogs('')
        setBotLogsError('Failed to load bot logs')
      }
    } catch (error) {
      setBotLogs('')
      setBotLogsError('Bot logs service unavailable')
    } finally {
      setBotLogsLoading(false)
    }
  }

  const openBotLogModal = () => {
    setShowBotLogModal(true)
    fetchBotLogs()
  }

  useEffect(() => {
    if (showBotLogModal && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight
    }
  }, [botLogs, showBotLogModal])

  useEffect(() => {
    fetchHealthStatus()
    const interval = setInterval(fetchHealthStatus, 30000)
    return () => clearInterval(interval)
  }, [fetchHealthStatus])

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / (3600 * 24))
    const h = Math.floor((seconds % (3600 * 24)) / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    return `${d > 0 ? `${d}d ` : ''}${h > 0 ? `${h}h ` : ''}${m}m`
  }

  const timeAgo = (isoString: string) => {
    if (!isoString) return 'N/A'
    const date = new Date(isoString)
    const now = new Date()
    const seconds = Math.round((now.getTime() - date.getTime()) / 1000)
    if (seconds < 60) return `${seconds}s ago`
    const minutes = Math.round(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.round(minutes / 60)
    return `${hours}h ago`
  }

  const getStatusPill = (status: string) => {
    const base = 'px-3 py-1 text-xs font-medium rounded-full flex items-center gap-1.5'
    switch (status) {
      case 'healthy':
        return (
          <span className={`${base} bg-green-500/10 text-green-400`}>
            <CheckCircle2 size={14} />
            Healthy
          </span>
        )
      case 'unhealthy':
        return (
          <span className={`${base} bg-red-500/10 text-red-400`}>
            <XCircle size={14} />
            Unhealthy
          </span>
        )
      default:
        return (
          <span className={`${base} bg-slate-500/10 text-slate-400`}>
            <Info size={14} />
            Unknown
          </span>
        )
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    // You might want to add a toast notification here
  }

  const restartService = async (serviceName: string) => {
    if (!confirm(`Are you sure you want to restart the ${serviceName} service?`)) return
    try {
      const token = localStorage.getItem('authToken')
      const resp = await fetch('/api/system/restart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        // Force restart target to python-bot when triggered from UI
        body: JSON.stringify({ target: 'python-bot' })
      })
      if (resp.ok) {
        alert('Restart requested for python-bot. Check system logs for status.')
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
  }

  

  if (isLoading && !healthData) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-blue-900 dark:to-indigo-900">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg text-muted-foreground">Loading System Health...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-blue-900 dark:to-indigo-900 text-foreground relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/10 to-indigo-600/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-400/10 to-blue-600/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-blue-300/5 to-indigo-300/5 rounded-full blur-3xl"></div>
      </div>
      
      <main className="container mx-auto p-4 sm:p-6 lg:p-8 relative z-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">System Health</h1>
              <p className="text-muted-foreground">
                An overview of the system status and performance.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={fetchHealthStatus} disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Refresh
            </Button>
          </div>
        </div>

        {healthData ? (
          <div className="grid gap-6">
            {/* Overall Status */}
            <Card className="backdrop-blur-sm bg-card/80 dark:bg-card/60 border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Overall Status</span>
                  {getStatusPill(healthData.status)}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-semibold">Uptime</p>
                    <p>{formatUptime(healthData.uptime)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Info className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-semibold">Version</p>
                    <p>{healthData.version}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Server className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-semibold">Environment</p>
                    <p>{healthData.environment}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-semibold">Timestamp</p>
                    <p>{new Date(healthData.timestamp).toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Services Status */}
            <Card className="backdrop-blur-sm bg-card/80 dark:bg-card/60 border-0 shadow-xl">
              <CardHeader>
                <CardTitle>Services Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(healthData.services).map(([name, service]) => (
                  <div
                    key={name}
                    className="flex items-center justify-between p-3 rounded-lg bg-card border"
                  >
                    <div className="flex items-center gap-3">
                      <Share2 className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-semibold capitalize">{name}</p>
                      </div>
                    </div>
                    {getStatusPill(service.status)}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* System & Memory removed per user request */}

            {/* Database */}
            <Card className="backdrop-blur-sm bg-card/80 dark:bg-card/60 border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" /> Database
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <p className="font-semibold">Status</p>
                  {getStatusPill(healthData.database.status)}
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card className="backdrop-blur-sm bg-card/80 dark:bg-card/60 border-0 shadow-xl">
              <CardHeader>
                <CardTitle>System Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Button variant="outline" onClick={openSettingsModal} className="w-full justify-center">
                    <Settings className="mr-2 h-4 w-4" /> View Settings
                  </Button>
                  <Button variant="outline" onClick={openBotLogModal} className="w-full justify-center">
                    <FileText className="mr-2 h-4 w-4" /> View Bot Logs
                  </Button>
                  {/* Clean Logs removed per request */}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card className="backdrop-blur-sm bg-card/80 dark:bg-card/60 border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle /> System Unreachable
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                The health check endpoint could not be reached. This might indicate that the server
                is down or there is a network issue.
              </p>
              <Button className="mt-4" onClick={fetchHealthStatus} disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Retry Connection
              </Button>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <Card className="backdrop-blur-sm bg-card/80 dark:bg-card/60 border-0 shadow-xl w-[90%] max-w-2xl max-h-[90vh] flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" /> System Configuration
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setShowSettingsModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="flex-grow overflow-y-auto">
              {settingsLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : systemSettings ? (
                <pre className="p-4 bg-muted rounded-lg text-sm overflow-x-auto">
                  {JSON.stringify(systemSettings, null, 2)}
                </pre>
              ) : (
                <p>Could not load settings.</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Bot Log Modal */}
      {showBotLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <Card className="backdrop-blur-sm bg-card/80 dark:bg-card/60 border-0 shadow-xl w-[90%] max-w-4xl h-[90vh] flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" /> Python Bot Logs
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={fetchBotLogs} disabled={botLogsLoading}>
                  {botLogsLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setShowBotLogModal(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent ref={logContainerRef} className="flex-grow overflow-y-auto bg-muted/50 p-4 rounded-b-lg">
              {botLogsLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : botLogsError ? (
                <div className="flex flex-col items-center justify-center h-full text-destructive">
                  <AlertTriangle className="h-8 w-8 mb-2" />
                  <p>{botLogsError}</p>
                </div>
              ) : (
                <pre className="text-xs whitespace-pre-wrap">{botLogs}</pre>
              )}
            </CardContent>
          </Card>
        </div>
      )}
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

// Convert uptime in seconds to a human-readable format
function formatUptime(seconds: number) {
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  return `${days}d`
}
