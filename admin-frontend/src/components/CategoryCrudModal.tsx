"use client"
import React, { useEffect, useRef, useState } from 'react'

interface Props {
  isOpen: boolean
  onClose: () => void
  envs: string[]
  initialEnv: string
  manageOpenedFromAdd?: boolean
  onCreatedCategory?: (name: string) => void
}

export default function CategoryCrudModal({ isOpen, onClose, envs, initialEnv, manageOpenedFromAdd, onCreatedCategory }: Props) {
  const [selectedEnv, setSelectedEnv] = useState<string>(initialEnv || (envs && envs.length > 0 ? envs[0] : 'stunting'))
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rateLimitedUntil, setRateLimitedUntil] = useState<number | null>(null)
  const [newCategory, setNewCategory] = useState('')
  const [editingIdx, setEditingIdx] = useState<number | null>(null)
  const [editingValue, setEditingValue] = useState('')
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) setSelectedEnv(initialEnv || (envs && envs.length > 0 ? envs[0] : 'stunting'))
  }, [isOpen, initialEnv, envs])

  useEffect(() => {
    if (!isOpen) return
    let cancelled = false
    ;(async () => {
      if (rateLimitedUntil && Date.now() < rateLimitedUntil) {
        setError('Rate limited — coba lagi nanti')
        setCategories([])
        return
      }
      setLoading(true)
      setError(null)
      try {
        const token = localStorage.getItem('authToken')
        const res = await fetch(`/api/faq/${encodeURIComponent(selectedEnv)}/categories`, {
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        })
        if (res.status === 429) {
          const retry = res.headers.get('Retry-After')
          const sec = retry ? Number(retry) : 60
          setRateLimitedUntil(Date.now() + sec * 1000)
          setCategories([])
          setError('Rate limited — coba lagi nanti')
          return
        }
        if (!res.ok) {
          const t = await res.text()
          throw new Error(`Status ${res.status}: ${t}`)
        }
        const data = await res.json()
        const cats = Array.isArray(data?.data) ? data.data.filter((c: any) => typeof c === 'string') : []
        if (!cancelled) setCategories(cats)
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message || String(e))
          setCategories([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [isOpen, selectedEnv])

  useEffect(() => { if (isOpen && inputRef.current) inputRef.current.focus() }, [isOpen])

  async function handleAdd() {
    if (!newCategory.trim()) return
    try {
      const token = localStorage.getItem('authToken')
      const res = await fetch(`/api/faq/${encodeURIComponent(selectedEnv)}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ name: newCategory.trim() }),
      })
      if (res.status === 401) {
        localStorage.removeItem('authToken')
        window.location.href = '/login'
        return
      }
      if (res.status === 429) {
        setError('Rate limited when adding category')
        return
      }
      if (!res.ok) {
        const t = await res.text()
        throw new Error(t || 'Add failed')
      }
      const refreshed = await (async () => {
        try {
          const r2 = await fetch(`/api/faq/${encodeURIComponent(selectedEnv)}/categories`)
          if (!r2.ok) return []
          const jd = await r2.json()
          return Array.isArray(jd?.data) ? jd.data.filter((c: any) => typeof c === 'string') : []
        } catch (_e) { return [] }
      })()
      setCategories(Array.isArray(refreshed) ? refreshed : categories)
      const createdName = newCategory.trim()
      setNewCategory('')
      if (manageOpenedFromAdd && onCreatedCategory) {
        onCreatedCategory(createdName)
        onClose()
      }
    } catch (e: any) {
      setError(e?.message || String(e))
    }
  }

  async function handleDelete(name: string) {
    try {
      const token = localStorage.getItem('authToken')
      const res = await fetch(`/api/faq/${encodeURIComponent(selectedEnv)}/categories`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ name }),
      })
      if (res.status === 401) {
        localStorage.removeItem('authToken')
        window.location.href = '/login'
        return
      }
      if (!res.ok) {
        const t = await res.text()
        throw new Error(t || 'Delete failed')
      }
      // refresh
      const r2 = await fetch(`/api/faq/${encodeURIComponent(selectedEnv)}/categories`)
      if (r2.ok) {
        const jd = await r2.json()
        setCategories(Array.isArray(jd?.data) ? jd.data.filter((c: any) => typeof c === 'string') : [])
      }
    } catch (e: any) {
      setError(e?.message || String(e))
    }
  }

  function openDeleteModal(name: string) {
    setCategoryToDelete(name)
    setIsDeleteModalOpen(true)
  }

  function closeDeleteModal() {
    setIsDeleteModalOpen(false)
    setCategoryToDelete(null)
  }

  async function confirmDelete() {
    if (!categoryToDelete) return
    await handleDelete(categoryToDelete)
    closeDeleteModal()
  }

  async function handleRename(oldName: string) {
    if (!editingValue.trim()) return
    try {
      const token = localStorage.getItem('authToken')
      const res = await fetch(`/api/faq/${encodeURIComponent(selectedEnv)}/categories`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ oldName, newName: editingValue.trim() }),
      })
      if (res.status === 401) {
        localStorage.removeItem('authToken')
        window.location.href = '/login'
        return
      }
      if (!res.ok) {
        const t = await res.text()
        throw new Error(t || 'Rename failed')
      }
      // refresh
      const r2 = await fetch(`/api/faq/${encodeURIComponent(selectedEnv)}/categories`)
      if (r2.ok) {
        const jd = await r2.json()
        setCategories(Array.isArray(jd?.data) ? jd.data.filter((c: any) => typeof c === 'string') : [])
      }
      setEditingIdx(null)
      setEditingValue('')
    } catch (e: any) {
      setError(e?.message || String(e))
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-card/95 rounded-2xl shadow-2xl w-[90%] max-w-md p-8 max-h-[90vh] overflow-y-auto border border-border">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-foreground">Manage Categories</h3>
          <button className="rounded-full w-10 h-10 p-0 border-border hover:border-border/80" onClick={onClose}>×</button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-muted-foreground mb-2">Environment</label>
            <select value={selectedEnv} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedEnv(e.target.value)} className="w-full border border-border p-2 rounded-lg mb-2">
              {envs.map(ev => <option key={ev} value={ev}>{ev}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-muted-foreground mb-2">Add Category</label>
            <div className="flex gap-2">
              <input ref={inputRef} value={newCategory} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewCategory(e.target.value)} placeholder="Category name" className="flex-1 px-3 py-2 border rounded-lg" />
              <button onClick={handleAdd} disabled={!newCategory.trim()} className="px-3 py-1 bg-blue-600 text-white rounded">Add</button>
            </div>
          </div>

          {error && <div className="text-red-600">Error: {error}</div>}

          <div>
            <h4 className="text-sm font-semibold mb-2">Existing Categories</h4>
            {loading ? <div className="text-sm text-muted">Loading...</div> : (
              <ul className="space-y-2">
                {categories.length === 0 ? <li className="text-sm text-muted">No categories</li> : categories.map((cat, idx) => (
                  <li key={cat} className="flex items-center gap-2">
                    {editingIdx === idx ? (
                      <>
                        <input className="px-2 py-1 border rounded" value={editingValue} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingValue(e.target.value)} />
                        <button onClick={() => handleRename(cat)} className="px-2 py-1 bg-green-600 text-white rounded">Save</button>
                        <button onClick={() => { setEditingIdx(null); setEditingValue('') }} className="px-2 py-1 border rounded">Cancel</button>
                      </>
                    ) : (
                      <>
                        <span className="px-3 py-1 bg-muted text-foreground rounded font-medium">{cat}</span>
                        <button onClick={() => { setEditingIdx(idx); setEditingValue(cat) }} className="px-2 py-1 border rounded">Edit</button>
                        <button onClick={() => openDeleteModal(cat)} className="px-2 py-1 text-red-600">Delete</button>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70]">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-red-600 to-rose-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Delete Category</h3>
            </div>
            
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Hapus kategori <span className="font-mono bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-2 py-1 rounded">"{categoryToDelete}"</span> di environment <span className="font-semibold">{selectedEnv}</span>? This action cannot be undone.
            </p>
            
            <div className="flex gap-3 justify-end">
              <button 
                onClick={closeDeleteModal}
                className="px-4 py-2 border border-gray-300 text-gray-600 hover:bg-gray-50 font-medium rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
                className="px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
