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
import { ConfirmModal } from '@/components/admin/ConfirmModal'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'

type TabState = 'pending' | 'flagged' | 'live'

export default function ModerationQueue() {
  const [activeTab, setActiveTab] = useState<TabState>('pending')
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

  const fetchQueue = async (tab: TabState) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/listings?status=${tab}`)
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
    fetchQueue(activeTab)
  }, [activeTab])

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
         fetchQueue(activeTab)
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
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pt-8">
        <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-widest rounded-full border border-indigo-100 w-fit">
                <BrainCircuit className="w-3.5 h-3.5" /> Moderation Engine v3.1
            </div>
            <h1 className="text-5xl font-black text-gray-900 tracking-tighter leading-none">Moderation Queue</h1>
            <p className="text-gray-500 font-medium text-lg max-w-2xl">
                Manual oversight of campus deals. AI handles 95% of traffic; you handle the edge cases.
            </p>
        </div>

        <div className="flex items-center gap-2 p-1.5 bg-gray-100/50 backdrop-blur-md border border-gray-200 rounded-[2rem]">
            {[
                { id: 'pending', label: 'Human Review', icon: Clock, color: 'text-amber-600' },
                { id: 'flagged', label: 'AI Blocked', icon: BadgeAlert, color: 'text-rose-600' },
                { id: 'live', label: 'Active Feed', icon: ShieldCheck, color: 'text-emerald-600' }
            ].map(tab => (
                <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabState)}
                  className={cn(
                    "px-6 py-3 rounded-[1.5rem] font-black text-xs transition-all flex items-center gap-2",
                    activeTab === tab.id ? "bg-white shadow-sm text-gray-900" : "text-gray-400 hover:text-gray-600"
                  )}
                >
                    <tab.icon className={cn("w-4 h-4", activeTab === tab.id ? tab.color : "text-gray-300")} />
                    {tab.label}
                </button>
            ))}
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
                  <th className="px-8 py-6">Item Details</th>
                  <th className="px-8 py-6">Seller Information</th>
                  <th className="px-8 py-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {listings.map((list) => (
                  <tr key={list.slug} className={cn(
                    "group transition-all duration-300",
                    list.aiFlagged ? "bg-rose-50/20 hover:bg-rose-50/40" : "hover:bg-gray-50/50"
                  )}>
                    
                    <td className="px-8 py-8">
                      <div className="flex items-start gap-6">
                        <div className="relative w-32 h-32 bg-gray-50 rounded-[2rem] overflow-hidden flex-shrink-0 border-4 border-white shadow-xl">
                           {list.images?.[0] ? (
                             <img src={list.images[0]} alt="tb" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"/>
                           ) : (
                             <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-300">
                               <ShieldAlert className="w-8 h-8 opacity-20" />
                             </div>
                           )}
                           {list.aiFlagged && (
                             <div className="absolute inset-0 bg-rose-600/10 backdrop-blur-[1px] flex items-center justify-center">
                                <BadgeAlert className="w-10 h-10 text-white drop-shadow-lg" />
                             </div>
                           )}
                        </div>
                        
                        <div className="flex flex-col gap-1 pr-8">
                           <div className="flex items-center gap-3 mb-1">
                               <span className="text-[18px] font-black text-gray-900 line-clamp-1">{list.title}</span>
                               <Link href={`/listing/${list.slug}`} target="_blank" className="p-1.5 bg-gray-100 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all">
                                  <ExternalLink className="w-3.5 h-3.5" />
                               </Link>
                           </div>
                           <p className="text-sm font-black text-emerald-600 mb-2">₹{list.price.toLocaleString('en-IN')}</p>
                           
                           {activeTab === 'flagged' && list.aiVerification && (
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

                    <td className="px-8 py-8">
                      <div className="flex flex-col gap-2">
                         <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-100 rounded-2xl flex items-center justify-center font-black text-gray-400 text-sm border border-white shadow-sm">
                               {list.seller?.displayName?.charAt(0) || '?'}
                            </div>
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

                    <td className="px-8 py-8">
                       <div className="flex items-center justify-end gap-3">
                          {activeTab !== 'live' && (
                             <button 
                                onClick={() => setModalConfig({ isOpen: true, type: 'approve', slug: list.slug, title: list.title })}
                                className="h-14 px-6 bg-emerald-600 text-white rounded-2xl font-black text-xs flex items-center gap-2 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 active:scale-95 transition-all"
                             >
                                <CheckCircle className="w-4 h-4"/> Approve
                             </button>
                          )}
                          <button 
                             onClick={() => setModalConfig({ isOpen: true, type: 'reject', slug: list.slug, title: list.title })}
                             className="h-14 w-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center hover:bg-amber-100 active:scale-95 transition-all"
                             title="Reject (Return to Seller)"
                          >
                             <Ban className="w-5 h-5"/>
                          </button>
                          <button 
                             onClick={() => setModalConfig({ isOpen: true, type: 'delete', slug: list.slug, title: list.title })}
                             className="h-14 w-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center hover:bg-rose-100 active:scale-95 transition-all"
                             title="Destroy Listing"
                          >
                             <Trash2 className="w-5 h-5"/>
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
