'use client'

import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { CheckCircle, X, Trash2, ShieldAlert, Loader2, Search, ShieldCheck, AlertTriangle, Eye, Mail, Clock, ChevronRight, Ban, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { Avatar } from '@/components/ui/Avatar'
import Image from 'next/image'
import { ConfirmModal } from '@/components/global/ConfirmModal'

export default function ModerationQueue() {
  const [status, setStatus] = useState<string>('pending')
  const [aiFlag, setAiFlag] = useState<string>('all')
  const [sort, setSort] = useState<string>('newest')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [listings, setListings] = useState<any[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const [error, setError] = useState<string | null>(null)

  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean
    type: 'approve' | 'reject' | 'delete'
    slug: string | null
    title: string
  }>({ isOpen: false, type: 'approve', slug: null, title: '' })

  const [reasonInput, setReasonInput] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400)
    return () => clearTimeout(timer)
  }, [search])

  const fetchQueue = async (pageNum: number = 1, append: boolean = false) => {
    if (append) setLoadingMore(true)
    else setLoading(true)

    try {
      const params = new URLSearchParams({
        status,
        aiFlag,
        sort,
        q: debouncedSearch,
        page: pageNum.toString(),
        limit: '20'
      })
      const res = await fetch(`/api/admin/listings?${params.toString()}`)
      const data = await res.json()
      if (res.ok) {
        if (append) {
          setListings(prev => {
            const existingIds = new Set(prev.map(l => l._id))
            const newItems = data.listings.filter((l: any) => !existingIds.has(l._id))
            return [...prev, ...newItems]
          })
        } else {
          setListings(data.listings)
          setTotalCount(data.pagination.total)
        }
        setError(null)
      }
    } catch {
      setError('Failed to load listings.')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  useEffect(() => {
    setPage(1)
    fetchQueue(1, false)
  }, [status, aiFlag, sort, debouncedSearch])

  const handleLoadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    fetchQueue(nextPage, true)
  }

  const handleAction = async () => {
    if (!modalConfig.slug) return
    setActionLoading(true)
    
    try {
      let res
      if (modalConfig.type === 'delete') {
         res = await fetch(`/api/admin/listings/${modalConfig.slug}?reason=${encodeURIComponent(reasonInput)}`, {
           method: 'DELETE'
         })
      } else {
         res = await fetch(`/api/admin/listings/${modalConfig.slug}`, {
           method: 'PATCH',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ action: modalConfig.type, reason: reasonInput })
         })
      }

      if (res.ok) {
         setModalConfig({ isOpen: false, type: 'approve', slug: null, title: '' })
         setReasonInput('')
         setError(null)
         setPage(1)
         fetchQueue(1, false)
      } else {
         const data = await res.json()
         setError(data.error || 'Action failed.')
      }
    } catch (e) {
      setError('Error performing action.')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      
      {/* Header & Controls */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
        <div>
          <h1 className="text-xl lg:text-2xl font-semibold text-gray-900">Moderation queue</h1>
          <p className="text-sm text-gray-500 mt-0.5">Review and approve campus listings</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
            <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search listings..."
                    className="w-full h-10 pl-9 pr-4 bg-gray-100 border-none rounded-full text-sm font-medium outline-none focus:ring-2 focus:ring-[#16a34a10]"
                />
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto no-scrollbar">
                <select 
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="h-10 px-3 bg-white border border-gray-100 rounded-full text-xs font-semibold outline-none"
                >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="all">All</option>
                </select>

                <select 
                    value={aiFlag}
                    onChange={(e) => setAiFlag(e.target.value)}
                    className="h-10 px-3 bg-white border border-gray-100 rounded-full text-xs font-semibold outline-none"
                >
                    <option value="all">AI: All</option>
                    <option value="flagged">Flagged</option>
                    <option value="no">Clean</option>
                </select>

                <select 
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                    className="h-10 px-3 bg-white border border-gray-100 rounded-full text-xs font-semibold outline-none"
                >
                    <option value="newest">Newest</option>
                    <option value="oldest">Oldest</option>
                </select>
            </div>
        </div>
      </header>

      {error && (
        <div className="mb-6 p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-red-600 text-xs font-semibold">
           <AlertTriangle className="w-4 h-4" /> {error}
        </div>
      )}

      {/* Main Table Container */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3 opacity-50">
             <Loader2 className="w-8 h-8 text-[#16a34a] animate-spin" />
             <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Syncing...</span>
          </div>
        ) : listings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center opacity-50">
            <ShieldCheck className="w-12 h-12 text-gray-200 mb-4" />
            <p className="text-sm font-semibold text-gray-400">Queue is clear</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Listing</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Seller</th>
                  <th className="px-6 py-4 text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {listings.map((list) => (
                  <tr key={list._id} className={cn(
                    "hover:bg-gray-50/50 transition-colors",
                    list.aiFlagged && "bg-red-50/10"
                  )}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="relative w-16 h-16 bg-gray-50 rounded-lg overflow-hidden border border-gray-100 flex-shrink-0">
                           {list.images?.[0] ? (
                             <Image 
                               src={list.images[0]} 
                               fill 
                               alt="" 
                               className="object-contain"
                               sizes="64px"
                             />
                           ) : (
                             <div className="w-full h-full flex items-center justify-center text-gray-300">
                               <ShieldAlert className="w-6 h-6 opacity-20" />
                             </div>
                           )}
                        </div>
                        
                        <div className="min-w-0">
                           <div className="flex items-center gap-2 mb-0.5">
                               <span className="text-sm font-semibold text-gray-900 truncate">{list.title}</span>
                               <Link href={`/listing/${list.slug}`} className="text-gray-400 hover:text-gray-600">
                                  <ChevronRight className="w-3.5 h-3.5" />
                               </Link>
                           </div>
                           <div className="flex items-center gap-2 text-xs font-medium">
                              <span className="text-green-600 font-semibold">₹{list.price}</span>
                              <span className="text-gray-300">•</span>
                              <span className="text-gray-400">{formatDistanceToNow(new Date(list.createdAt))} ago</span>
                           </div>
                           {list.aiFlagged && (
                             <div className="mt-2 text-[10px] font-bold text-red-600 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" /> Flagged: {list.aiVerification?.reason || 'Safety violation'}
                             </div>
                           )}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar 
                           src={list.seller?.photoURL} 
                           name={list.seller?.displayName}
                           size="sm"
                         />
                        <div className="min-w-0">
                           <span className="text-xs font-semibold text-gray-900 block truncate">{list.seller?.displayName}</span>
                           <span className="text-[10px] text-gray-400 block truncate">{list.seller?.email}</span>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                       <div className="flex items-center justify-end gap-2">
                          {status === 'pending' && (
                             <button 
                                onClick={() => setModalConfig({ isOpen: true, type: 'approve', slug: list.slug, title: list.title })}
                                className="h-9 px-4 bg-[#16a34a] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
                             >
                                <CheckCircle className="w-3.5 h-3.5"/> Approve
                             </button>
                          )}
                          <button 
                             onClick={() => setModalConfig({ isOpen: true, type: 'reject', slug: list.slug, title: list.title })}
                             className="h-9 w-9 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center hover:bg-orange-100 transition-all font-semibold"
                             title="Reject"
                          >
                             <Ban className="w-3.5 h-3.5"/>
                          </button>
                          <button 
                             onClick={() => setModalConfig({ isOpen: true, type: 'delete', slug: list.slug, title: list.title })}
                             className="h-9 w-9 bg-red-50 text-red-600 rounded-lg flex items-center justify-center hover:bg-red-100 transition-all font-semibold"
                             title="Delete"
                          >
                             <Trash2 className="w-3.5 h-3.5"/>
                          </button>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {listings.length < totalCount && (
              <div className="p-4 border-t border-gray-100 flex justify-center">
                 <button 
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="h-10 px-6 bg-white border border-gray-200 rounded-full text-xs font-bold text-gray-600 hover:bg-gray-50 transition-all flex items-center gap-2 disabled:opacity-50"
                 >
                    {loadingMore ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        Load More ({totalCount - listings.length} remaining)
                        <ChevronRight className="w-3.5 h-3.5 rotate-90" />
                      </>
                    )}
                 </button>
              </div>
            )}
          </div>
        )}
      </div>

      {modalConfig.isOpen && (
        <ConfirmModal 
          title={
            modalConfig.type === 'approve' ? 'Approve listing' :
            modalConfig.type === 'reject' ? 'Reject listing' :
            'Delete listing'
          }
          description={
            <div className="space-y-4 py-2">
               <p className="text-gray-600 text-sm">
                 Item: <span className="font-semibold text-gray-900">{modalConfig.title}</span>
               </p>
               
               {(modalConfig.type === 'reject' || modalConfig.type === 'delete') && (
                 <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest pl-1">Reason for rejection</label>
                    <textarea 
                      value={reasonInput}
                      onChange={(e) => setReasonInput(e.target.value)}
                      className="w-full h-24 p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-[#16a34a10] text-sm font-medium transition-all resize-none"
                      placeholder="Explain the reason..."
                    />
                 </div>
               )}
            </div>
          }
          actionText={
            modalConfig.type === 'approve' ? 'Approve' :
            modalConfig.type === 'reject' ? 'Reject' :
            'Delete permanently'
          }
          actionVariant={modalConfig.type === 'approve' ? 'primary' : 'danger'}
          requireText={modalConfig.type === 'delete' ? 'DELETE' : undefined}
          loading={actionLoading}
          onConfirm={handleAction}
          onCancel={() => {
            setModalConfig({ isOpen: false, type: 'approve', slug: null, title: '' })
            setReasonInput('')
          }}
        />
      )}

    </div>
  )
}
