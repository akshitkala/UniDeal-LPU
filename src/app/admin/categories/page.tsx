'use client'

import { useEffect, useState } from 'react'
import { FolderTree, Trash2, Loader2, Plus } from 'lucide-react'
import { ConfirmModal } from '@/components/admin/ConfirmModal'
import { Banner } from '@/components/global/Banner'

export default function CategoryManagement() {
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Create Category State
  const [newCat, setNewCat] = useState({ name: '', slug: '', icon: '' })
  const [creating, setCreating] = useState(false)

  // Delete/Conflict State
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
      setError('Taxonomy Sync Error: Failed to retrieve category branches.')
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
        setError(d.error || 'Taxonomy Deployment Failure')
      }
    } catch {
      setError('Vector Disruption: Network error during branch creation.')
    } finally {
      setCreating(false)
    }
  }

  const initiateDelete = async (cat: any) => {
    setTargetCat(cat)
    // Checking collision metric before deleting
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
      setError('Collision Engine Exception: Strategy check failed.')
    }
  }

  const executeDelete = async (mode: 'cascade' | 'reassign') => {
    if (!targetCat) return
    setActionLoading(true)
    try {
      const query = mode === 'reassign' ? `?mode=reassign&reassignToId=${reassignTarget}` : '?mode=cascade'
      const res = await fetch(`/api/admin/categories/${targetCat._id}${query}`, { method: 'DELETE' })
      const data = await res.json()
      
      if (res.ok) {
        setModalType(null)
        setTargetCat(null)
        setReassignTarget('')
        setError(null)
        fetchCategories()
      } else {
        setError(data.error || 'Destruction Routine Failure')
      }
    } catch {
      setError('Critical Sector Interference: Network disruption during deletion.')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto mb-20">
      
      <div>
        <h1 className="text-3xl font-extrabold text-[#1A1A1A]">Taxonomy & Branches</h1>
        <p className="text-gray-500 mt-1">Manage platform categories and manipulate content architecture trees.</p>
      </div>

      {error && (
        <Banner 
          message={error} 
          variant="error" 
          onClose={() => setError(null)} 
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Creation Panel */}
        <div className="lg:col-span-1 flex flex-col gap-4">
           <form onSubmit={handleCreate} className="bg-white rounded-2xl border border-[#E5E5E5] p-6 shadow-sm flex flex-col gap-4">
              <h3 className="font-bold flex items-center gap-2 text-xl text-gray-900 border-b border-gray-100 pb-3"><Plus className="w-5 h-5"/> New Branch</h3>
              
              <label className="flex flex-col gap-1 text-sm font-semibold text-gray-700">
                Display Name
                <input required type="text" value={newCat.name} onChange={e => setNewCat({...newCat, name: e.target.value})} className="border border-gray-300 rounded-lg h-10 px-3 font-normal" placeholder="e.g. Graphic Cards" />
              </label>

              <label className="flex flex-col gap-1 text-sm font-semibold text-gray-700">
                URL Slug
                <input required type="text" value={newCat.slug} onChange={e => setNewCat({...newCat, slug: e.target.value.toLowerCase().replace(/\s+/g, '-')})} className="border border-gray-300 rounded-lg h-10 px-3 font-mono font-normal" placeholder="e.g. graphic-cards" />
              </label>

              <label className="flex flex-col gap-1 text-sm font-semibold text-gray-700">
                Icon String (Lucide)
                <input required type="text" value={newCat.icon} onChange={e => setNewCat({...newCat, icon: e.target.value})} className="border border-gray-300 rounded-lg h-10 px-3 font-mono text-sm font-normal" placeholder="e.g. Cpu" />
              </label>
              
              <button disabled={creating} type="submit" className="mt-2 bg-[#2D9A54] hover:bg-[#258246] text-white font-bold h-11 rounded-lg transition disabled:opacity-50">
                {creating ? 'Committing...' : 'Deploy Taxonomy'}
              </button>
           </form>
        </div>

        {/* Categories Table */}
        <div className="lg:col-span-2 bg-white border border-[#E5E5E5] rounded-2xl shadow-sm overflow-hidden min-h-[400px]">
          {loading ? (
            <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 text-[#2D9A54] animate-spin" /></div>
          ) : (
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-[#F9F9F9] border-b border-[#E5E5E5] text-gray-500 uppercase text-xs font-bold tracking-wider">
                <tr>
                  <th className="p-4">Branch Map</th>
                  <th className="p-4 text-center">Volume</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E5]">
                {categories.map((c) => (
                  <tr key={c._id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-[#1A1A1A]">{c.name}</span>
                        <span className="text-xs text-gray-400 font-mono mt-0.5">/{c.slug}</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                       {c.listingCount > 0 ? (
                         <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-bold border border-blue-200">{c.listingCount} items</span>
                       ) : (
                         <span className="text-gray-400 font-medium tracking-wide">Empty</span>
                       )}
                    </td>
                    <td className="p-4 flex justify-end">
                       <button onClick={() => initiateDelete(c)} className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors title='Evacuate & Destroy'">
                         <Trash2 className="w-5 h-5"/>
                       </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>

      {modalType === 'delete' && (
         <ConfirmModal
           title="Wipe Empty Category?"
           description={<>Branch <strong>{targetCat.name}</strong> contains 0 items. It is safe to delete.</>}
           actionText="Delete Category"
           onConfirm={() => executeDelete('cascade')}
           onCancel={() => { setModalType(null); setTargetCat(null) }}
           loading={actionLoading}
         />
      )}

      {modalType === 'conflict' && (
         <ConfirmModal
           title="Category Conflict Resolution!"
           description={
             <div className="flex flex-col gap-4 text-left">
               <p className="text-gray-800 leading-relaxed font-medium">
                 You are attempting to delete the <strong className="text-red-600">{targetCat.name}</strong> branch, but it currently hosts <strong>{conflictListingsCount} active listings.</strong> 
                 <br/><br/>
                 You must resolve this tree conflict by choosing an evacuation target OR forcing a catastrophic Cloudinary/MongoDB cascade wipe across all resident items.
               </p>

               <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex flex-col gap-3">
                 <h4 className="font-bold text-amber-900 border-b border-amber-200 pb-2">Evacuation Protocol (Safe)</h4>
                 <label className="flex flex-col gap-1">
                   <span className="text-xs font-bold text-amber-800 uppercase tracking-widest">Migrate items to:</span>
                   <select 
                     value={reassignTarget}
                     onChange={(e) => setReassignTarget(e.target.value)}
                     className="w-full h-10 border border-amber-300 rounded font-semibold text-gray-700 outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                   >
                     <option value="" disabled>Select a destination category</option>
                     {categories.filter(c => c._id !== targetCat._id).map((c) => (
                        <option key={c._id} value={c._id}>{c.name}</option>
                     ))}
                   </select>
                 </label>
                 <button 
                   onClick={() => executeDelete('reassign')} 
                   disabled={!reassignTarget || actionLoading}
                   className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 transition text-white font-bold h-10 rounded-lg"
                 >
                   {actionLoading ? 'Migrating...' : 'Reassign & Delete Safely'}
                 </button>
               </div>
             </div>
           }
           actionText="Force Master Wipe"
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
