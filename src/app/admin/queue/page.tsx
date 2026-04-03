'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { 
  CheckCircle, 
  X, 
  Trash2, 
  ShieldAlert, 
  Loader2, 
  ArrowUpRight, 
  Search, 
  BrainCircuit, 
  UserCheck, 
  ShieldCheck, 
  History, 
  AlertTriangle,
  XCircle,
  Eye,
  MoreVertical,
  ExternalLink,
  Ban,
  Clock,
  BadgeAlert,
  ChevronRight,
  Mail
} from 'lucide-react'
import { ConfirmModal } from '@/components/global/ConfirmModal'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { Avatar } from '@/components/ui/Avatar'
import Image from 'next/image'

type TabState = 'pending' | 'flagged' | 'live'

export default function ModerationQueue() {
  const [status, setStatus] = useState<string>('pending')
  const [aiFlag, setAiFlag] = useState<string>('all')
  const [sort, setSort] = useState<string>('newest')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  const [loading, setLoading] = useState(true)
  const [listings, setListings] = useState<any[]>([])
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

  const fetchQueue = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        status,
        aiFlag,
        sort,
        q: debouncedSearch
      })
      const res = await fetch(`/api/admin/listings?${params.toString()}`)
      const data = await res.json()
      if (res.ok) {
        setListings(data.listings)
        setError(null)
      }
    } catch {
      setError('Neural Sync Error: Failed to retrieve moderation data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchQueue()
  }, [status, aiFlag, sort, debouncedSearch])

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

      const data = await res.json()
      if (res.ok) {
         setModalConfig({ isOpen: false, type: 'approve', slug: null, title: '' })
         setReasonInput('')
         setError(null)
         fetchQueue()
      } else {
         setError(data.error || 'Directives rejected by server.')
      }
    } catch (e) {
      setError('Communication Vector Breakdown: Action failed.')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-10 max-w-[1440px] mx-auto mb-24 px-6 md:px-12">
      
      {/* Header */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pt-8 px-0 sm:px-0">
        <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-widest rounded-full border border-indigo-100 w-fit">
                <BrainCircuit className="w-3.5 h-3.5" /> Moderation Engine v3.1
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-950 tracking-tighter leading-none">Moderation Queue</h1>
            <p className="text-gray-500 font-medium text-base sm:text-lg max-w-2xl">
                Manual oversight of campus deals. AI handles 95% of traffic; you handle the edge cases.
            </p>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center gap-6 mt-6">
            <div className="flex-1 relative group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                <input 
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by Title, ID, or Seller..."
                    className="w-full h-16 pl-14 pr-6 bg-white border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-300 font-bold text-gray-900 transition-all shadow-sm placeholder:text-gray-300"
                />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 shrink-0">
                <select 
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="h-16 px-6 bg-white border border-gray-100 rounded-2xl outline-none font-bold text-sm text-gray-900 shadow-sm focus:border-indigo-300"
                >
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="sold">Sold</option>
                    <option value="expired">Expired</option>
                </select>

                <select 
                    value={aiFlag}
                    onChange={(e) => setAiFlag(e.target.value)}
                    className="h-16 px-6 bg-white border border-gray-100 rounded-2xl outline-none font-bold text-sm text-gray-900 shadow-sm focus:border-indigo-300"
                >
                    <option value="all">AI: All</option>
                    <option value="flagged">AI Flagged</option>
                    <option value="no">Not Flagged</option>
                    <option value="unavailable">AI Unavailable</option>
                </select>

                <select 
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                    className="h-16 px-6 bg-white border border-gray-100 rounded-2xl outline-none font-bold text-sm text-gray-900 shadow-sm focus:border-indigo-300"
                >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="price_high">Price: High to Low</option>
                    <option value="price_low">Price: Low to High</option>
                </select>
            </div>
        </div>
      </header>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-100 rounded-3xl flex items-center gap-3 text-rose-600 text-sm font-bold animate-in slide-in-from-top-4">
           <AlertTriangle className="w-5 h-5 shrink-0" /> {error}
        </div>
      )}

      {/* Main Command Center */}
      <div className="bg-white border border-gray-100 rounded-[3rem] shadow-premium overflow-hidden min-h-[500px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-96 gap-4">
             <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Loading Queue</p>
          </div>
        ) : listings.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-32 text-center">
            <div className="w-20 h-20 bg-emerald-50 rounded-[2.5rem] flex items-center justify-center mb-8 border border-emerald-100">
                <ShieldCheck className="w-10 h-10 text-emerald-500" />
            </div>
            <h3 className="text-3xl font-black text-gray-900 mb-2">Queue Clear</h3>
            <p className="text-gray-500 font-medium max-w-sm">No listings are currently awaiting manual intervention.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50/50 border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                <tr>
                  <th className="px-4 sm:px-8 py-6 min-w-[300px]">Item Details</th>
                  <th className="px-4 sm:px-8 py-6 min-w-[200px]">Seller Information</th>
                  <th className="px-4 sm:px-8 py-6 text-right min-w-[150px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {listings.map((list) => (
                  <tr key={list._id} className={cn(
                    "group transition-all duration-300",
                    list.aiFlagged ? "bg-rose-50/20 hover:bg-rose-50/40" : "hover:bg-gray-50/50"
                  )}>
                    
                    <td className="px-4 sm:px-8 py-6 sm:py-8">
                      <div className="flex items-start gap-4 sm:gap-6">
                        <div className="relative w-20 h-20 sm:w-32 sm:h-32 bg-gray-50 rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden flex-shrink-0 border-4 border-white shadow-xl">
                           {list.images?.[0] ? (
                             <Image 
                               src={list.images[0]} 
                               fill 
                               alt="listing preview" 
                               className="object-cover group-hover:scale-110 transition-transform duration-700"
                               sizes="(max-width: 768px) 80px, 128px"
                             />
                           ) : (
                             <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-300">
                               <ShieldAlert className="w-8 h-8 opacity-20" />
                             </div>
                           )}
                           {list.aiFlagged && (
                             <div className="absolute inset-0 bg-rose-600/10 backdrop-blur-[1px] flex items-center justify-center z-10">
                                <BadgeAlert className="w-10 h-10 text-white drop-shadow-lg" />
                             </div>
                           )}
                        </div>
                        
                        <div className="flex flex-col gap-1 pr-8">
                           <div className="flex items-center gap-3 mb-1">
                               <span className="text-[18px] font-black text-gray-900 line-clamp-1">{list.title}</span>
                               <Link href={`/listing/${list.slug}`} className="p-1.5 bg-gray-100 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all">
                                  <ExternalLink className="w-3.5 h-3.5" />
                               </Link>
                           </div>
                           <p className="text-sm font-black text-emerald-600 mb-2">₹{list.price.toLocaleString('en-IN')}</p>
                           
                           {list.aiFlagged && list.aiVerification && (
                             <div className="p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-rose-100 shadow-sm flex flex-col gap-1.5 mt-2 max-w-md">
                                <div className="flex items-center gap-2">
                                    <BrainCircuit className="w-3.5 h-3.5 text-rose-500" />
                                    <span className="text-[9px] font-black uppercase text-rose-500 tracking-widest">AI Audit Found Violations</span>
                                </div>
                                <p className="text-[11px] font-bold text-gray-700 leading-relaxed italic">
                                    "{list.aiVerification.reason || 'Safety parameters exceeded baseline thresholds.'}"
                                </p>
                             </div>
                           )}
                           <div className="flex items-center gap-4 mt-3">
                              <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter flex items-center gap-1.5">
                                 <Clock className="w-3.5 h-3.5" /> {formatDistanceToNow(new Date(list.createdAt))} ago
                              </span>
                           </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 sm:px-8 py-6 sm:py-8">
                      <div className="flex flex-col gap-2">
                         <div className="flex items-center gap-3">
                            <Avatar 
                               src={list.seller?.photoURL} 
                               name={list.seller?.displayName}
                               size="sm"
                             />
                            <div className="flex flex-col">
                               <div className="flex items-center gap-2">
                                  <span className="font-black text-gray-900 leading-tight">{list.seller?.displayName || 'Campus User'}</span>
                                  <a 
                                    href={`mailto:${list.seller?.email}?subject=Regarding your UniDeal listing: ${list.title}`}
                                    className="p-1 bg-gray-100 rounded-md text-gray-400 hover:text-[#2D9A54] hover:bg-emerald-50 transition-all"
                                    title="Contact Seller"
                                  >
                                     <Mail className="w-3 h-3" />
                                  </a>
                               </div>
                               <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{list.seller?.email || 'unverified@email.com'}</span>
                            </div>
                         </div>
                         <div className="flex flex-wrap gap-2 mt-1">
                            {list.seller?.roles?.includes('admin') && (
                                <span className="bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1 border border-indigo-100">
                                   <ShieldCheck className="w-3 h-3" /> Staff
                                </span>
                            )}
                         </div>
                      </div>
                    </td>

                    <td className="px-4 sm:px-8 py-6 sm:py-8">
                       <div className="flex items-center justify-end gap-2 sm:gap-3">
                          {(list.status === 'pending' || list.status === 'rejected') && (
                             <button 
                                onClick={() => setModalConfig({ isOpen: true, type: 'approve', slug: list.slug, title: list.title })}
                                className="h-12 sm:h-14 px-4 sm:px-6 bg-emerald-600 text-white rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-xs flex items-center gap-2 hover:bg-emerald-700 shadow-lg"
                             >
                                <CheckCircle className="w-4 h-4"/> Approve
                             </button>
                          )}
                          <button 
                             onClick={() => setModalConfig({ isOpen: true, type: 'reject', slug: list.slug, title: list.title })}
                             className="h-12 w-12 sm:h-14 sm:w-14 bg-amber-50 text-amber-600 rounded-xl sm:rounded-2xl flex items-center justify-center hover:bg-amber-100"
                             title="Reject (Return to Seller)"
                          >
                             <Ban className="w-4 h-4 sm:w-5 h-5"/>
                          </button>
                          <button 
                             onClick={() => setModalConfig({ isOpen: true, type: 'delete', slug: list.slug, title: list.title })}
                             className="h-12 w-12 sm:h-14 sm:w-14 bg-rose-50 text-rose-600 rounded-xl sm:rounded-2xl flex items-center justify-center hover:bg-rose-100"
                             title="Destroy Listing"
                          >
                             <Trash2 className="w-4 h-4 sm:w-5 h-5"/>
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

      {/* Dynamic Action Matrix */}
      {modalConfig.isOpen && (
        <ConfirmModal 
          title={
            modalConfig.type === 'approve' ? 'Neural Authorization' :
            modalConfig.type === 'reject' ? 'Rejection Protocol' :
            'Destruction Sequence'
          }
          description={
            <div className="flex flex-col gap-6 py-4">
               <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                   <p className="text-gray-600 text-sm font-medium">
                     Target Object: <strong className="text-gray-900">{modalConfig.title}</strong>
                   </p>
               </div>
               
               {(modalConfig.type === 'reject' || modalConfig.type === 'delete') && (
                 <div className="flex flex-col gap-3">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-1">Reason (Buyer Notification)</label>
                    <textarea 
                      value={reasonInput}
                      onChange={(e) => setReasonInput(e.target.value)}
                      className="w-full h-32 p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-rose-300 font-bold text-gray-900 transition-all resize-none text-sm"
                      placeholder="Explain why this listing is being suppressed..."
                    />
                    <div className="flex items-center gap-2 text-[10px] font-bold text-rose-500">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Buyer will see this reason in their dashboard logs.
                    </div>
                 </div>
               )}
            </div>
          }
          actionText={
            modalConfig.type === 'approve' ? 'Authorize Publication' :
            modalConfig.type === 'reject' ? 'Confirm Rejection' :
            'Execute Destruction'
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
