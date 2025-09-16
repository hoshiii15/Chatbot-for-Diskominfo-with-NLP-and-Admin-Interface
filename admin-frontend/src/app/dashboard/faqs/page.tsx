'use client'

import { useRef, useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface FAQ {
  id: string
  question: string
  answer: string
  category?: string
  environment: 'stunting' | 'ppid'
  isActive: boolean
  views: number
  createdAt: string
  metadata?: { text: string; url: string; question?: string | number | null }[] | null
}

export default function FAQsPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedEnvironment, setSelectedEnvironment] = useState<'stunting' | 'ppid' | 'all'>('all')
  const [isMutating, setIsMutating] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isCrudModalOpen, setIsCrudModalOpen] = useState(false)
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null)
  const [formState, setFormState] = useState({
    id: '',
    environment: 'stunting',
    question: '',
    questionsText: '',
    answer: '',
    category: '',
    isActive: true,
    links: [] as { text: string; url: string }[],
  })
  const [categories, setCategories] = useState<string[]>([])

  // Load categories from localStorage saat pertama kali render
  useEffect(() => {
    const saved = localStorage.getItem('faqCategories')
    if (saved) setCategories(JSON.parse(saved))
  }, [])

  // Simpan ke localStorage setiap kali categories berubah
  useEffect(() => {
    localStorage.setItem('faqCategories', JSON.stringify(categories))
  }, [categories])

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [newCategory, setNewCategory] = useState("")
  const [editingCategoryIdx, setEditingCategoryIdx] = useState<number | null>(null)
  const [editingCategoryValue, setEditingCategoryValue] = useState("")

  const fetchFAQs = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/faq')
      if (response.ok) {
        const data = await response.json()
        setFaqs(data.data || [])
      } else {
        console.error('Failed to load FAQs', response.status)
      }
    } catch (error) {
      console.error('Failed to fetch FAQs:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { void fetchFAQs() }, [])

  // --- mutation helpers ---
  const handleAdd = async () => {
    // open modal in add mode
    setEditingFaq(null)
    setFormState({
      id: '', environment: 'stunting', question: '', questionsText: '', answer: '', category: '', isActive: true, links: []
    })
    setIsModalOpen(true)
  }

  const handleEdit = async (faq: FAQ) => {
    // open modal in edit mode
    setEditingFaq(faq)
    const linksArr = (faq.metadata || []).map((m: any) => ({ text: m.text || '', url: m.url || '' }))
    setFormState({
      id: faq.id,
      environment: faq.environment,
      question: faq.question,
      questionsText: Array.isArray((faq as any).questions) ? (faq as any).questions.join('\n') : faq.question,
      answer: faq.answer,
      category: faq.category || '',
      isActive: faq.isActive,
      links: linksArr,
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (faq: FAQ) => {
    const ok = window.confirm(`Delete FAQ: "${faq.question}" ? This cannot be undone.`)
    if (!ok) return
    const token = localStorage.getItem('authToken')
    if (!token) {
      window.alert('You must be logged in to delete FAQs. Please login first.')
      return
    }

    setIsMutating(true)
    try {
      const res = await fetch(`/api/faq/${encodeURIComponent(faq.id)}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      })
      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem('authToken')
          window.alert('Session expired or invalid. You will be redirected to login.')
          window.location.href = '/login'
          return
        }
        const errText = await res.text()
        throw new Error(`Delete failed: ${res.status} ${errText}`)
      }
      await fetchFAQs()
    } catch (err) {
      console.error(err)
      window.alert('Failed to delete FAQ')
    } finally {
      setIsMutating(false)
    }
  }

  const filteredFaqs = faqs.filter(faq => 
    selectedEnvironment === 'all' || faq.environment === selectedEnvironment
  )

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
          <div className="text-lg font-medium text-gray-700">Loading FAQs...</div>
          <div className="text-sm text-gray-500 mt-2">Please wait while we fetch your data</div>
        </div>
      </div>
    )
  }

  // Modal CRUD Category
  function CategoryCrudModal() {
    const addInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
      if (isCategoryModalOpen && addInputRef.current && editingCategoryIdx === null) {
        addInputRef.current.focus()
      }
      // Fokus hanya saat modal dibuka dan tidak sedang edit kategori
    }, [isCategoryModalOpen, editingCategoryIdx])

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white/95 rounded-2xl shadow-2xl w-[90%] max-w-md p-8 max-h-[90vh] overflow-y-auto border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-900">Manage Categories</h3>
            <Button variant="outline" onClick={() => setIsCategoryModalOpen(false)} className="rounded-full w-10 h-10 p-0 border-gray-300 hover:border-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Add Category</label>
              <div className="flex gap-2">
                <input
                  ref={addInputRef}
                  className="flex-1 border border-gray-300 p-2 rounded-lg"
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value)}
                  placeholder="Category name"
                />
                <Button
                  onClick={() => {
                    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
                      setCategories([...categories, newCategory.trim()])
                      setNewCategory("")
                      setTimeout(() => {
                        if (addInputRef.current) addInputRef.current.focus()
                      }, 0)
                    }
                  }}
                  disabled={!newCategory.trim()}
                >
                  Add
                </Button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Existing Categories</label>
              <ul className="space-y-2">
                {categories.map((cat, idx) => (
                  <li key={cat} className="flex items-center gap-2">
                    {editingCategoryIdx === idx ? (
                      <>
                        <input
                          className="border border-gray-300 p-1 rounded-lg"
                          value={editingCategoryValue}
                          onChange={e => setEditingCategoryValue(e.target.value)}
                          autoFocus
                        />
                        <Button
                          size="default"
                          onClick={() => {
                            if (!editingCategoryValue.trim()) return;
                            setCategories(categories =>
                              categories.map((cat, i) =>
                                i === editingCategoryIdx ? editingCategoryValue.trim() : cat
                              )
                            );
                            setEditingCategoryIdx(null);
                            setEditingCategoryValue("");
                          }}
                          disabled={!editingCategoryValue.trim()}
                        >Save</Button>
                        <Button size="default" variant="outline" onClick={() => setEditingCategoryIdx(null)}>Cancel</Button>
                      </>
                    ) : (
                      <>
                        <span className="px-3 py-1 bg-gray-100 rounded">{cat}</span>
                        <Button size="default" variant="outline" onClick={() => { setEditingCategoryIdx(idx); setEditingCategoryValue(cat) }}>Edit</Button>
                        <Button size="default" variant="outline" className="border-red-200 text-red-700"
                          onClick={() => setCategories(categories.filter((_, i) => i !== idx))}
                        >Delete</Button>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
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
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                      FAQ Management
                    </h1>
                  </div>
                  <p className="text-gray-600 text-lg">Manage frequently asked questions</p>
                </div>
                <Link href="/dashboard">
                  <Button 
                    variant="outline" 
                    className="bg-white/80 backdrop-blur-sm border-gray-200 hover:bg-white hover:border-gray-300 transition-all duration-200 shadow-lg"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to Dashboard
                  </Button>
                </Link>
              </div>
            </div>

            {/* Controls */}
            <div className="mb-8">
              <Card className="backdrop-blur-sm bg-white/80 border-0 shadow-xl">
                <CardContent className="p-6">
                  <div className="flex gap-4 items-center flex-wrap">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
                      </svg>
                      <label className="text-sm font-medium text-gray-700">Filter by Environment:</label>
                    </div>
                    <select 
                      value={selectedEnvironment} 
                      onChange={(e) => setSelectedEnvironment(e.target.value as any)}
                      className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 backdrop-blur-sm transition-all duration-200"
                    >
                      <option value="all">All Environments</option>
                      <option value="stunting">Stunting</option>
                      <option value="ppid">PPID</option>
                    </select>
                    <Button 
                      onClick={handleAdd} 
                      disabled={isMutating}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add New FAQ
                    </Button>
                    <Button
                      onClick={() => setIsCategoryModalOpen(true)}
                      disabled={isMutating}
                      className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4h16v16H4z" />
                      </svg>
                      Manage Category
                    </Button>
                    <div className="ml-auto text-sm text-gray-600 bg-gray-100/50 px-3 py-2 rounded-lg">
                      <span className="font-medium">{filteredFaqs.length}</span> FAQ{filteredFaqs.length !== 1 ? 's' : ''} found
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* FAQ List */}
            <div className="grid gap-6">
              {filteredFaqs.length === 0 ? (
                <Card className="backdrop-blur-sm bg-white/80 border-0 shadow-xl">
                  <CardContent className="p-12 text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-gray-400 to-gray-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">No FAQs Found</h3>
                    <p className="text-gray-500 mb-4">
                      {selectedEnvironment === 'all' 
                        ? "You haven't created any FAQs yet. Click 'Add New FAQ' to get started." 
                        : `No FAQs found for ${selectedEnvironment.toUpperCase()} environment.`
                      }
                    </p>
                    <Button 
                      onClick={handleAdd}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                    >
                      Create Your First FAQ
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                filteredFaqs.map((faq) => (
                  <Card key={faq.id} className="backdrop-blur-sm bg-white/80 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 group">
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-xl font-semibold text-gray-800 group-hover:text-blue-700 transition-colors duration-200 mb-3">
                            {faq.question}
                          </CardTitle>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                              faq.environment === 'stunting' 
                                ? 'bg-blue-100 text-blue-800 border-blue-200' 
                                : 'bg-green-100 text-green-800 border-green-200'
                            }`}>
                              {faq.environment.toUpperCase()}
                            </span>
                            {faq.category && (
                              <span className="px-3 py-1 bg-gray-100 text-gray-800 border border-gray-200 rounded-full text-xs font-medium">
                                {faq.category}
                              </span>
                            )}
                            {/* Removed Active status and views badges as requested */}
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button 
                            variant="outline" 
                            onClick={() => handleEdit(faq)} 
                            disabled={isMutating}
                            className="bg-white/80 border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={() => handleDelete(faq)} 
                            disabled={isMutating}
                            className="bg-white/80 border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300 transition-all duration-200"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="bg-gray-50/50 rounded-lg p-4 mb-4 border border-gray-100">
                        <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                      </div>
                      {faq.metadata && Array.isArray((faq as any).metadata) && (faq as any).metadata.length > 0 && (
                        <div className="mb-4 bg-blue-50/50 rounded-lg p-4 border border-blue-100">
                          <h4 className="text-sm font-semibold text-blue-800 mb-3 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                            Related Links
                          </h4>
                          <ul className="space-y-2">
                            {(faq as any).metadata.map((m: any, idx: number) => (
                              <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                                <svg className="w-3 h-3 mt-1 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                </svg>
                                <div>
                                  {m.question && <strong className="text-gray-800 mr-2">(Q: {m.question})</strong>}
                                  {m.url ? (
                                    <a className="text-blue-600 hover:text-blue-800 underline hover:no-underline transition-all duration-200" href={m.url} target="_blank" rel="noreferrer">
                                      {m.text || m.url}
                                    </a>
                                  ) : (
                                    <span>{m.text}</span>
                                  )}
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-sm text-gray-500 pt-3 border-t border-gray-100">
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Created: {new Date(faq.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* Attribution */}
            <div className="text-center mt-12 pb-6">
              <p className="text-sm text-gray-500 flex items-center justify-center gap-1">
                Made with
                <span className="text-red-500 animate-pulse">❤️</span>
                for
                <span className="font-semibold text-gray-700">diskomindo sukoharjo</span>
              </p>
            </div>
          </div>
        </div>

        {/* Enhanced Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl w-[90%] max-w-4xl p-8 max-h-[90vh] overflow-y-auto border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  {editingFaq ? 'Edit FAQ' : 'Add New FAQ'}
                </h3>
                <Button 
                  variant="outline" 
                  onClick={() => { setIsModalOpen(false); setEditingFaq(null); }}
                  className="rounded-full w-10 h-10 p-0 border-gray-300 hover:border-gray-400"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Button>
              </div>

              <div className="grid gap-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Environment</label>
                    <select 
                      value={formState.environment} 
                      onChange={(e) => setFormState({...formState, environment: e.target.value as 'stunting' | 'ppid'})} 
                      className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 backdrop-blur-sm transition-all duration-200"
                    >
                      <option value="stunting">Stunting</option>
                      <option value="ppid">PPID</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                    <select
                      className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 backdrop-blur-sm transition-all duration-200"
                      value={formState.category}
                      onChange={(e) => setFormState({ ...formState, category: e.target.value })}
                    >
                      <option value="">Pilih kategori</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Questions (one per line)</label>
                    <textarea 
                      className="w-full border border-gray-300 p-3 rounded-lg h-32 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 backdrop-blur-sm transition-all duration-200 resize-none" 
                      value={formState.questionsText} 
                      onChange={(e) => setFormState({...formState, questionsText: e.target.value})}
                      placeholder="Enter each question on a new line..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Answer</label>
                    <textarea 
                      className="w-full border border-gray-300 p-3 rounded-lg h-32 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 backdrop-blur-sm transition-all duration-200 resize-none" 
                      value={formState.answer} 
                      onChange={(e) => setFormState({...formState, answer: e.target.value})}
                      placeholder="Enter the answer..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Related Links</label>
                    <div className="space-y-3">
                      {(formState.links || []).map((ln, i) => (
                        <div key={i} className="flex gap-3 p-4 bg-gray-50/50 rounded-lg border border-gray-200">
                          <input 
                            className="flex-1 border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all duration-200" 
                            value={ln.text} 
                            placeholder="Link text" 
                            onChange={(e) => {
                              const copy = [...formState.links]; 
                              copy[i] = { ...copy[i], text: e.target.value }; 
                              setFormState({ ...formState, links: copy })
                            }} 
                          />
                          <input 
                            className="flex-1 border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all duration-200" 
                            value={ln.url} 
                            placeholder="https://..." 
                            onChange={(e) => {
                              const copy = [...formState.links]; 
                              copy[i] = { ...copy[i], url: e.target.value }; 
                              setFormState({ ...formState, links: copy })
                            }} 
                          />
                          <Button 
                            variant="outline" 
                            onClick={() => { 
                              const copy = [...formState.links]; 
                              copy.splice(i, 1); 
                              setFormState({ ...formState, links: copy }) 
                            }}
                            className="border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </Button>
                        </div>
                      ))}
                      <Button 
                        onClick={() => setFormState({ ...formState, links: [...(formState.links || []), { text: '', url: '' }] })}
                        variant="outline"
                        className="w-full border-dashed border-2 border-gray-300 hover:border-blue-400 hover:bg-blue-50 transition-all duration-200"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Link
                      </Button>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                    <Button 
                      variant="outline" 
                      onClick={() => { setIsModalOpen(false); setEditingFaq(null); }}
                      className="px-6 py-2 border-gray-300 hover:border-gray-400 transition-all duration-200"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={async () => {
                        // submit form
                        const token = localStorage.getItem('authToken')
                        if (!token) { window.alert('Login required'); return }
                        const questions = formState.questionsText.split('\n').map(s => s.trim()).filter(Boolean)
                        const links = (formState.links || []).map(l => ({ text: l.text || '', url: l.url || '' }))
                        const payload: any = { 
                          question: questions[0] || formState.question, 
                          questions, 
                          answer: formState.answer, 
                          category: formState.category || null, 
                          isActive: formState.isActive, 
                          links 
                        }
                        setIsMutating(true)
                        try {
                          if (editingFaq) {
                            const res = await fetch(`/api/faq/${encodeURIComponent(editingFaq.id)}`, { 
                              method: 'PUT', 
                              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, 
                              body: JSON.stringify(payload) 
                            })
                            if (!res.ok) throw new Error('Edit failed')
                          } else {
                            const res = await fetch('/api/faq', { 
                              method: 'POST', 
                              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, 
                              body: JSON.stringify({ ...payload, environment: formState.environment }) 
                            })
                            if (!res.ok) throw new Error('Add failed')
                          }
                          await fetchFAQs()
                          setIsModalOpen(false)
                          setEditingFaq(null)
                        } catch (e) {
                          console.error(e)
                          window.alert('Save failed')
                        } finally { 
                          setIsMutating(false) 
                        }
                      }} 
                      disabled={isMutating}
                      className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                    >
                      {isMutating ? (
                        <div className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Saving...
                        </div>
                      ) : (
                        'Save FAQ'
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {isCategoryModalOpen && <CategoryCrudModal />}
      </div>
    </>
  )
}
