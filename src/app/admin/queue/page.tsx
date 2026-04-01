'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CheckCircle, XCircle, Trash2, ShieldAlert, Loader2, ArrowUpRight, Search } from 'lucide-react'
import { ConfirmModal } from '@/components/admin/ConfirmModal'
import { Banner } from '@/components/global/Banner'
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
      setError('Global Sync Error: Failed to retrieve moderation queue.')
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
         setError(data.error || 'Directive failure')
      }
    } catch (e) {
      setError('Vector Exception: Network disruption during action.')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto mb-20">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-[#1A1A1A]">Moderation Queue</h1>
        <p className="text-gray-500 mt-1">Review new submissions, evaluate AI-flagged content, and manage marketplace integrity.</p>
      </div>

      {error && (
        <Banner 
          message={error} 
          variant="error" 
          onClose={() => setError(null)} 
        />
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E5E5E5] w-full">
        <button onClick={() => setActiveTab('pending')} className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 ${activeTab === 'pending' ? 'border-[#2D9A54] text-[#2D9A54]' : 'border-transparent text-gray-500'}`}>
           <div className="flex items-center gap-2">Needs Review</div>
        </button>
        <button onClick={() => setActiveTab('flagged')} className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 ${activeTab === 'flagged' ? 'border-red-500 text-red-600' : 'border-transparent text-gray-500'}`}>
           <div className="flex items-center gap-2"><ShieldAlert className="w-4 h-4"/> AI Flagged</div>
        </button>
        <button onClick={() => setActiveTab('live')} className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 ${activeTab === 'live' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'}`}>
           <div className="flex items-center gap-2">Live Directory</div>
        </button>
      </div>

      {/* Main Table */}
      <div className="bg-white border border-[#E5E5E5] rounded-2xl shadow-sm overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 text-[#2D9A54] animate-spin" /></div>
        ) : listings.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-20 text-center">
            <Search className="w-12 h-12 text-gray-300 mb-4" />
            <h3 className="text-xl font-bold text-gray-800">Queue Clear</h3>
            <p className="text-gray-500 mt-2">Zero listings matching this filter. Good job.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-[#F9F9F9] border-b border-[#E5E5E5] text-gray-500 uppercase text-xs font-bold tracking-wider">
                <tr>
                  <th className="p-4">Listing Details</th>
                  <th className="p-4">Seller Info</th>
                  <th className="p-4">Submission</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E5]">
                {listings.map((list) => (
                  <tr key={list.slug} className={`hover:bg-gray-50 transition-colors ${list.aiFlagged ? 'bg-red-50/30' : ''}`}>
                    
                    <td className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0 border border-gray-200">
                           {list.images && list.images[0] ? <img src={list.images[0]} alt="tb" className="w-full h-full object-cover"/> : <span className="text-[10px] text-gray-400 font-bold uppercase">No Img</span>}
                        </div>
                        <div className="flex flex-col w-[280px]">
                           <span className="font-bold text-[#1A1A1A] truncate">{list.title}</span>
                           <span className="text-green-600 font-bold mt-0.5">₹{list.price.toLocaleString('en-IN')}</span>
                           <div className="flex items-center gap-2 mt-1">
                             {list.aiFlagged && <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-widest border border-red-200">Flagged</span>}
                             <Link href={`/listing/${list.slug}`} target="_blank" className="text-xs text-blue-500 hover:underline flex items-center gap-0.5 font-medium">View Public <ArrowUpRight className="w-3 h-3"/></Link>
                           </div>
                        </div>
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="flex flex-col">
                         <span className="font-bold text-gray-800">{list.seller?.displayName || 'Unknown'}</span>
                         <span className="text-gray-500 mt-0.5">{list.seller?.email || 'N/A'}</span>
                         {list.seller?.isLpuVerified && <span className="text-[10px] text-[#2D9A54] font-bold uppercase tracking-wider mt-1">LPU Verified</span>}
                      </div>
                    </td>

                    <td className="p-4">
                       <span className="font-medium">{formatDistanceToNow(new Date(list.createdAt))} ago</span>
                    </td>

                    <td className="p-4">
                       <div className="flex items-center justify-end gap-2">
                          {(list.status === 'pending' || list.aiFlagged) && (
                            <>
                              <button 
                                onClick={() => setModalConfig({ isOpen: true, type: 'approve', slug: list.slug, title: list.title })}
                                className="p-2 text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors title='Approve'"
                              >
                                <CheckCircle className="w-5 h-5"/>
                              </button>
                              <button 
                                onClick={() => setModalConfig({ isOpen: true, type: 'reject', slug: list.slug, title: list.title })}
                                className="p-2 text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors title='Reject'"
                              >
                                <XCircle className="w-5 h-5"/>
                              </button>
                            </>
                          )}
                          <button 
                             onClick={() => setModalConfig({ isOpen: true, type: 'delete', slug: list.slug, title: list.title })}
                             className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors title='Hard Delete'"
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

      {/* Dynamic Action Modal */}
      {modalConfig.isOpen && (
        <ConfirmModal 
          title={
            modalConfig.type === 'approve' ? 'Approve Listing?' :
            modalConfig.type === 'reject' ? 'Reject Submission?' :
            'Execute Hard Delete?'
          }
          description={
            <div className="flex flex-col gap-4 text-left">
               <p className="text-gray-600">
                 You are about to {modalConfig.type} <strong>{modalConfig.title}</strong>. 
                 {modalConfig.type === 'delete' && ' This will irreversibly purge the asset from MongoDB and physically destroy images in Cloudinary.'}
               </p>
               
               {/* Custom Reason Injection for Destructive Paths */}
               {(modalConfig.type === 'reject' || modalConfig.type === 'delete') && (
                 <label className="flex flex-col gap-1.5 mt-2">
                   <span className="text-sm font-bold text-gray-800">Mandatory Reason</span>
                   <input 
                     type="text"
                     value={reasonInput}
                     onChange={(e) => setReasonInput(e.target.value)}
                     className="w-full h-11 px-3 border border-gray-300 focus:border-red-500 rounded-lg outline-none bg-gray-50"
                     placeholder="e.g. Scraped images, scam URL included"
                   />
                 </label>
               )}
            </div>
          }
          actionText={`Confirm ${modalConfig.type.toUpperCase()}`}
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
