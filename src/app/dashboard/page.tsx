'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { PlusCircle, Search, Edit3, Trash2, ArrowUpCircle, CheckCircle, AlertTriangle, XCircle, Loader2 } from 'lucide-react'
import { Banner } from '@/components/global/Banner'
import { ConfirmModal } from '@/components/admin/ConfirmModal'

type TabState = 'active' | 'pending' | 'blocked'

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabState>('active')
  const [listings, setListings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Confirmation modal states
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [listingToDelete, setListingToDelete] = useState<string | null>(null)
  
  // Action Loading states
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const fetchListings = async (tab: TabState) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/user/listings?status=${tab}`)
      const data = await res.json()
      if (res.ok) {
        setListings(data.listings)
      } else {
        setListings([])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchListings(activeTab)
  }, [activeTab])

  const handleBump = async (slug: string) => {
    setActionLoading(`bump-${slug}`)
    try {
      const res = await fetch(`/api/listings/${slug}/bump`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Bump Protocol Failure: Rate limit exceeded or internal error.')
      } else {
        setSuccess('Listing successfully prioritized in the global live feed.')
        setError(null)
        fetchListings(activeTab)
      }
    } catch (error) {
      setError('Vector Disruption: Network anomaly during priority bump.')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeleteExecute = async () => {
    if (!listingToDelete) return
    setActionLoading(`delete-${listingToDelete}`)
    try {
      const res = await fetch(`/api/listings/${listingToDelete}`, { method: 'DELETE' })
      if (res.ok) {
        setDeleteModalOpen(false)
        setListingToDelete(null)
        setSuccess('Payload evacuated. Listing document has been soft-deleted.')
        setError(null)
        fetchListings(activeTab)
      } else {
        const data = await res.json()
        setError(data.error || 'Vector Deletion Failure: Persistence error during evacuation.')
      }
    } catch (error) {
      setError('Communication Interruption: Network error during deletion sequence.')
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto mt-6 mb-20">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#1A1A1A]">Seller Dashboard</h1>
          <p className="text-gray-500 mt-1">Manage your active campus deals, check pending AI verifications, and bump old listings.</p>
        </div>
        <Link 
          href="/post" 
          className="bg-[#2D9A54] hover:bg-[#258246] text-white px-6 py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 whitespace-nowrap shadow-md w-fit"
        >
          <PlusCircle className="w-5 h-5" /> Post New Deal
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E5E5E5] w-full mt-2">
        <button 
          onClick={() => setActiveTab('active')}
          className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 ${activeTab === 'active' ? 'border-[#2D9A54] text-[#2D9A54]' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
        >
          <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4"/> Active</div>
        </button>
        <button 
          onClick={() => setActiveTab('pending')}
          className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 ${activeTab === 'pending' ? 'border-amber-500 text-amber-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
        >
          <div className="flex items-center gap-2"><Loader2 className="w-4 h-4"/> Pending</div>
        </button>
        <button 
          onClick={() => setActiveTab('blocked')}
          className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 ${activeTab === 'blocked' ? 'border-red-500 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
        >
          <div className="flex items-center gap-2"><AlertTriangle className="w-4 h-4"/> Action Required</div>
        </button>
      </div>

      {error && (
        <Banner 
          message={error} 
          variant="error" 
          onClose={() => setError(null)} 
        />
      )}

      {success && (
        <Banner 
          message={success} 
          variant="success" 
          onClose={() => setSuccess(null)} 
        />
      )}

      {/* Content Area */}
      <div className="flex flex-col gap-4">
        {loading ? (
          <div className="flex flex-col gap-4 animate-pulse">
            <div className="w-full h-32 bg-gray-100 rounded-xl"></div>
            <div className="w-full h-32 bg-gray-100 rounded-xl"></div>
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-20 bg-[#F9F9F9] border border-[#E5E5E5] rounded-xl flex flex-col items-center">
            <Search className="w-12 h-12 text-gray-300 mb-4" />
            <h3 className="text-xl font-bold text-gray-800">No {activeTab} listings found</h3>
            <p className="text-gray-500 mt-2 mb-6 max-w-sm">You dont have any items in this category currently.</p>
            {activeTab === 'active' && (
              <Link href="/post" className="text-[#2D9A54] font-bold hover:underline">Start selling now →</Link>
            )}
          </div>
        ) : (
          listings.map((list) => (
            <div key={list.slug} className="flex flex-col sm:flex-row bg-white border border-[#E5E5E5] rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              
              {/* Image Box */}
              <div className="w-full sm:w-48 h-40 sm:h-auto bg-gray-100 flex-shrink-0 flex justify-center items-center border-b sm:border-b-0 sm:border-r border-gray-200">
                 {list.images && list.images.length > 0 ? (
                    <img src={list.images[0]} className="w-full h-full object-cover" alt="item" />
                 ) : (
                    <span className="text-gray-400 text-xs font-medium">No Image</span>
                 )}
              </div>

              {/* Data Box */}
              <div className="p-5 flex flex-col flex-1 justify-between gap-4">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-2">
                  <div>
                    <h3 className="text-xl font-bold text-[#1A1A1A] line-clamp-1">
                      <Link href={`/listing/${list.slug}`} className="hover:underline">{list.title}</Link>
                    </h3>
                    <div className="text-lg font-bold text-[#2D9A54] mt-1">₹{list.price.toLocaleString('en-IN')}</div>
                    
                    <div className="flex gap-4 mt-2 text-xs text-gray-500">
                      <span>Posted {formatDistanceToNow(new Date(list.createdAt))} ago</span>
                      <span>{list.bumpCount} / 3 Bumps Used</span>
                    </div>
                  </div>
                  
                  {/* Status Badge */}
                  <div className="flex-shrink-0">
                    {list.aiFlagged ? (
                      <span className="bg-red-50 text-red-600 border border-red-200 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Flagged
                      </span>
                    ) : list.status === 'approved' ? (
                      <span className="bg-green-50 text-[#2D9A54] border border-green-200 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Live
                      </span>
                    ) : list.status === 'pending' ? (
                      <span className="bg-amber-50 text-amber-600 border border-amber-200 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" /> In Review
                      </span>
                    ) : (
                      <span className="bg-gray-100 text-gray-600 border border-gray-200 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                        {list.status}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                  {list.status === 'approved' && !list.aiFlagged && (
                     <button 
                       onClick={() => handleBump(list.slug)}
                       disabled={actionLoading === `bump-${list.slug}` || list.bumpCount >= 3}
                       title={list.bumpCount >= 3 ? "Max bumps reached" : "Push to top of feed"}
                       className="flex items-center gap-1.5 text-sm font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                     >
                       {actionLoading === `bump-${list.slug}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUpCircle className="w-4 h-4" />}
                       Bump
                     </button>
                  )}
                  {/* <Link 
                    href={`/edit/${list.slug}`}
                    className="flex items-center gap-1.5 text-sm font-semibold bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-900 border border-gray-200 px-4 py-2 rounded-lg transition-colors"
                  >
                    <Edit3 className="w-4 h-4" /> Edit
                  </Link> */}
                  <button 
                    onClick={() => {
                       setListingToDelete(list.slug)
                       setDeleteModalOpen(true)
                    }}
                    className="flex items-center gap-1.5 text-sm font-semibold text-red-500 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors ml-auto md:ml-0"
                  >
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                </div>
              </div>

            </div>
          ))
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <ConfirmModal 
          title="Evacuate Listing?"
          description="Are you sure you want to retire this listing? It will immediately be suppressed from global feeds. This action is irreversible for standard users."
          actionText="Confirm Deletion"
          actionVariant="danger"
          onConfirm={handleDeleteExecute}
          onCancel={() => {
            setDeleteModalOpen(false)
            setListingToDelete(null)
          }}
          loading={actionLoading?.startsWith('delete')}
        />
      )}

    </div>
  )
}
