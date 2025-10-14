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
    if (!confirm(`Hapus kategori "${name}" di environment ${effectiveEnv}?`)) return
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
                <button onClick={() => handleDelete(c)} className="text-sm text-red-600">Delete</button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="mt-6 text-sm text-muted">This is an isolated Manage Categories page to reproduce and debug category fetch/add/delete without modifying the main FAQ page.</p>
    </div>
  )
}
