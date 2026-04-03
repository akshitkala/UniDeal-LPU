'use client'

import { useEffect, useState } from 'react'
import { Trash2, Loader2, Plus, AlertTriangle, ShieldCheck } from 'lucide-react'
import { ConfirmModal } from '@/components/global/ConfirmModal'
import { cn } from '@/lib/utils'

export default function CategoryManagement() {
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [newCat, setNewCat] = useState({ name: '', slug: '', icon: '' })
  const [creating, setCreating] = useState(false)

  const [modalType, setModalType] = useState<'delete' | 'conflict' | null>(null)
  const [targetCat, setTargetCat] = useState<any>(null)
  const [conflictListingsCount, setConflictListingsCount] = useState(0)
  const [reassignTarget, setReassignTarget] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const fetchCategories = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/categories')
      if (res.ok) {
        setCategories(await res.json())
        setError(null)
      }
    } catch {
      setError('Failed to load categories.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCat)
      })
      if (res.ok) {
        setNewCat({ name: '', slug: '', icon: '' })
        setError(null)
        fetchCategories()
      } else {
        const d = await res.json()
        setError(d.error || 'Failed to create category.')
      }
    } catch {
      setError('Error creating category.')
    } finally {
      setCreating(false)
    }
  }

  const initiateDelete = async (cat: any) => {
    setTargetCat(cat)
    try {
      const res = await fetch(`/api/admin/categories/${cat._id}/check`)
      const { listingCount } = await res.json()
      
      if (listingCount > 0) {
        setConflictListingsCount(listingCount)
        setModalType('conflict')
      } else {
        setModalType('delete')
      }
      setError(null)
    } catch {
      setError('Error checking category status.')
    }
  }

  const executeDelete = async (mode: 'cascade' | 'reassign') => {
    if (!targetCat) return
    setActionLoading(true)
    try {
      const query = mode === 'reassign' ? `?mode=reassign&reassignToId=${reassignTarget}` : '?mode=cascade'
      const res = await fetch(`/api/admin/categories/${targetCat._id}${query}`, { method: 'DELETE' })
      
      if (res.ok) {
        setModalType(null)
        setTargetCat(null)
        setReassignTarget('')
        setError(null)
        fetchCategories()
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to delete category.')
      }
    } catch {
      setError('Error deleting category.')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      
      <header className="mb-8">
        <h1 className="text-xl lg:text-2xl font-semibold text-gray-900">Categories</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage platform listing categories</p>
      </header>

      {error && (
        <div className="mb-6 p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-red-600 text-xs font-semibold">
           <AlertTriangle className="w-4 h-4" /> {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left: Add Category Form */}
        <div className="lg:col-span-4 self-start">
           <form onSubmit={handleCreate} className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Plus className="w-4 h-4 text-gray-400" /> Add category
              </h3>
              
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest pl-1">Name</label>
                  <input 
                    required 
                    type="text" 
                    value={newCat.name} 
                    onChange={e => setNewCat({ name: e.target.value, slug: '', icon: '' })} 
                    className="w-full h-10 px-3 bg-gray-100 border-none rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-[#16a34a10]" 
                    placeholder="e.g. Electronics" 
                  />
                </div>

                <p className="text-[10px] text-gray-400 font-medium">
                  Slug and icon will be generated automatically.
                </p>
                
                <button 
                  disabled={creating} 
                  type="submit" 
                  className="w-full h-10 bg-[#16a34a] text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all hover:bg-[#15803d] disabled:opacity-50"
                >
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create category'}
                </button>
              </div>
           </form>
        </div>

        {/* Right: Category Table */}
        <div className="lg:col-span-8 bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden min-h-[400px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3 opacity-50">
               <Loader2 className="w-8 h-8 text-[#16a34a] animate-spin" />
               <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Syncing...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Category Name</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Items</th>
                    <th className="px-6 py-4 text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {categories.map((c) => (
                    <tr key={c._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-gray-900">{c.name}</span>
                          <span className="text-[10px] text-gray-400 font-mono">/{c.slug}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                         {c.listingCount > 0 ? (
                           <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                             {c.listingCount}
                           </span>
                         ) : (
                           <span className="text-xs font-medium text-gray-300 italic">Empty</span>
                         )}
                      </td>
                      <td className="px-6 py-4">
                         <div className="flex justify-end">
                            <button 
                              onClick={() => initiateDelete(c)} 
                              className="h-9 w-9 bg-red-50 text-red-600 rounded-lg flex items-center justify-center hover:bg-red-100 transition-all"
                              title="Delete category"
                            >
                              <Trash2 className="w-4 h-4"/>
                            </button>
                         </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {modalType === 'delete' && (
         <ConfirmModal
           title="Delete category"
           description={<p className="text-gray-600 text-sm">Category <strong>{targetCat.name}</strong> is empty and safe to remove.</p>}
           actionText="Delete permanently"
           onConfirm={() => executeDelete('cascade')}
           onCancel={() => { setModalType(null); setTargetCat(null) }}
           loading={actionLoading}
         />
      )}

      {modalType === 'conflict' && (
         <ConfirmModal
           title="Category Conflict"
           description={
             <div className="space-y-4 py-2">
               <p className="text-gray-600 text-sm leading-relaxed">
                 The category <span className="font-semibold text-gray-900">{targetCat.name}</span> contains <span className="font-semibold text-gray-900">{conflictListingsCount} listings</span>. 
               </p>

               <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl space-y-3">
                 <p className="text-xs font-semibold text-orange-800">Move listings to another category:</p>
                 <select 
                   value={reassignTarget}
                   onChange={(e) => setReassignTarget(e.target.value)}
                   className="w-full h-10 px-3 border border-orange-200 rounded-lg text-sm font-medium outline-none bg-white"
                 >
                   <option value="" disabled>Select destination...</option>
                   {categories.filter(c => c._id !== targetCat._id).map((c) => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                   ))}
                 </select>
                 <button 
                   onClick={() => executeDelete('reassign')} 
                   disabled={!reassignTarget || actionLoading}
                   className="w-full h-9 bg-orange-600 text-white rounded-lg text-xs font-semibold disabled:opacity-50 transition-all hover:bg-orange-700"
                 >
                   {actionLoading ? 'Moving...' : 'Move & safe delete'}
                 </button>
               </div>
               
               <p className="text-[10px] text-gray-400 text-center uppercase font-bold tracking-widest pt-2">Or delete everything</p>
             </div>
           }
           actionText="Delete all listings"
           actionVariant="danger"
           requireText="DELETE"
           loading={actionLoading}
           onConfirm={() => executeDelete('cascade')}
           onCancel={() => { setModalType(null); setTargetCat(null) }}
         />
      )}

    </div>
  )
}
