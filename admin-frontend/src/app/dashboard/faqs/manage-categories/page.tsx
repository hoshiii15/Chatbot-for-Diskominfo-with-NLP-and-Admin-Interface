"use client"
import React, { useEffect, useState } from 'react'

export default function ManageCategoriesPage() {
  const [env, setEnv] = useState<string>('stunting')
  const [customEnv, setCustomEnv] = useState<string>('')
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rateLimitedUntil, setRateLimitedUntil] = useState<number | null>(null)
  const [newCategory, setNewCategory] = useState('')
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null)

  const envOptions = ['stunting', 'ppid', 'test-tambah']

  const effectiveEnv = customEnv.trim() !== '' ? customEnv.trim() : env

  async function fetchCategories(targetEnv: string) {
    setError(null)
    setLoading(true)
    try {
      const res = await fetch(`/api/faq/${encodeURIComponent(targetEnv)}/categories`)
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
      setCategories(cats)
    } catch (e: any) {
      setError(e?.message || String(e))
      setCategories([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Fetch when effective env changes, but guard against very frequent changes
    let cancelled = false
    ;(async () => {
      if (rateLimitedUntil && Date.now() < rateLimitedUntil) {
        setError('Rate limited — coba lagi nanti')
        setCategories([])
        return
      }
      if (!cancelled) await fetchCategories(effectiveEnv)
    })()
    return () => { cancelled = true }
  }, [effectiveEnv])

  async function handleAdd() {
    if (!newCategory.trim()) return
    try {
      const res = await fetch(`/api/faq/${encodeURIComponent(effectiveEnv)}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategory.trim() }),
      })
      if (res.status === 429) {
        setError('Rate limited when adding category')
        return
      }
      if (!res.ok) {
        const t = await res.text()
        throw new Error(t || 'Add failed')
      }
      setNewCategory('')
      await fetchCategories(effectiveEnv)
    } catch (e: any) {
      setError(e?.message || String(e))
    }
  }

  async function handleDelete(name: string) {
    try {
      const res = await fetch(`/api/faq/${encodeURIComponent(effectiveEnv)}/categories`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      if (!res.ok) {
        const t = await res.text()
        throw new Error(t || 'Delete failed')
      }
      await fetchCategories(effectiveEnv)
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

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Manage Categories (isolated)</h2>

      <div className="mb-4 flex gap-2 items-center">
        <label className="text-sm mr-2">Environment:</label>
        <select value={env} onChange={e => setEnv(e.target.value)} className="border p-1 rounded">
          {envOptions.map(e => <option key={e} value={e}>{e}</option>)}
        </select>
        <span className="text-sm mx-2">or</span>
        <input placeholder="Custom env" value={customEnv} onChange={e => setCustomEnv(e.target.value)} className="border p-1 rounded" />
        <button onClick={() => fetchCategories(effectiveEnv)} className="ml-2 px-3 py-1 bg-blue-600 text-white rounded">Refresh</button>
      </div>

      <div className="mb-4">
        <strong>Selected env:</strong> {effectiveEnv}
      </div>

      <div className="mb-4">
        <input placeholder="New category" value={newCategory} onChange={e => setNewCategory(e.target.value)} className="border p-1 rounded mr-2" />
        <button onClick={handleAdd} className="px-3 py-1 bg-green-600 text-white rounded">Add</button>
      </div>

      {error && <div className="mb-4 text-red-600">Error: {error}</div>}

      <div className="bg-white border p-4 rounded">
        <h3 className="font-semibold mb-2">Categories ({categories.length}) {loading && <span className="text-sm text-muted">Loading...</span>}</h3>
        {categories.length === 0 ? (
          <div className="text-sm text-muted">No categories</div>
        ) : (
          <ul className="space-y-2">
            {categories.map(c => (
              <li key={c} className="flex justify-between items-center">
                <span>{c}</span>
                <button onClick={() => openDeleteModal(c)} className="text-sm text-red-600">Delete</button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="mt-6 text-sm text-muted">This is an isolated Manage Categories page to reproduce and debug category fetch/add/delete without modifying the main FAQ page.</p>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60]">
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
              Hapus kategori <span className="font-mono bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-2 py-1 rounded">"{categoryToDelete}"</span> di environment <span className="font-semibold">{effectiveEnv}</span>? This action cannot be undone.
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
