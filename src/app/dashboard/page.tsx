'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { addDays, isAfter } from 'date-fns'
import { getRelativeTime } from '@/lib/utils/time'
import { Edit, Trash2, ArrowUpCircle, CheckCircle, Clock, Inbox, ChevronRight, AlertTriangle } from 'lucide-react'
import { ConfirmModal } from '@/components/global/ConfirmModal'
import { cn } from '@/lib/utils'
import { ListingCard } from '@/components/listing/ListingCard'

type TabState = 'active' | 'review' | 'rejected' | 'sold'

function DashboardContent() {
  const [activeTab, setActiveTab] = useState<TabState>('active')
  const [listings, setListings] = useState<any[]>([])
  const [counts, setCounts] = useState<any>({ active: 0, review: 0, rejected: 0, sold: 0 })
  const [loading, setLoading] = useState(true)

  // Confirmation modal states
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [soldModalOpen, setSoldModalOpen] = useState(false)
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null)
  
  // Action Loading states
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  const searchParams = useSearchParams()

  useEffect(() => {
    const msg = searchParams.get('success')
    if (msg) {
      setSuccess(msg)
      // Clear URL after showing message
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [searchParams])

  const fetchCounts = async () => {
    try {
      const res = await fetch('/api/user/listings/counts')
      const data = await res.json()
      if (res.ok) setCounts(data)
    } catch (e) {
      console.error('Failed to fetch counts', e)
    }
  }

  const fetchListings = async (tab: TabState) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/user/listings?status=${tab}&limit=50`)
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
    fetchCounts()
    fetchListings(activeTab)
  }, [activeTab])

  const handleBump = async (slug: string) => {
    setActionLoading(`bump-${slug}`)
    try {
      const res = await fetch(`/api/listings/${slug}/bump`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Rate limit exceeded.')
      } else {
        setSuccess('Listing prioritized.')
        setError(null)
        fetchListings(activeTab)
      }
    } catch (error) {
      setError('Network error.')
    } finally {
      setActionLoading(null)
    }
  }

  const handleSoldExecute = async () => {
    if (!selectedSlug) return
    setActionLoading(`sold-${selectedSlug}`)
    try {
      const res = await fetch(`/api/listings/${selectedSlug}/sold`, { method: 'POST' })
      if (res.ok) {
        setSoldModalOpen(false)
        setSelectedSlug(null)
        setSuccess('Marked as sold.')
        setError(null)
        fetchCounts()
        fetchListings(activeTab)
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to mark as sold.')
      }
    } catch (error) {
      setError('Network error.')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeleteExecute = async () => {
    if (!selectedSlug) return
    setActionLoading(`delete-${selectedSlug}`)
    try {
      const res = await fetch(`/api/listings/${selectedSlug}`, { method: 'DELETE' })
      if (res.ok) {
        setDeleteModalOpen(false)
        setSelectedSlug(null)
        setSuccess('Listing deleted.')
        setError(null)
        fetchCounts()
        fetchListings(activeTab)
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to delete listing.')
      }
    } catch (error) {
      setError('Network error.')
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
      
      {/* Header */}
      <header className="flex items-center justify-between gap-4 mb-6 lg:mb-8">
        <div>
          <h1 className="text-xl lg:text-2xl font-semibold text-gray-900 tracking-tight">My Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage your active deals and history</p>
        </div>

        <Link 
          href="/post" 
          className="h-10 lg:h-11 px-5 lg:px-6 bg-[#16a34a] hover:bg-green-700 text-white rounded-full font-bold text-sm flex items-center justify-center transition-all active:scale-95 shadow-lg shadow-green-600/10"
        >
          List an item
        </Link>
      </header>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 no-scrollbar">
        {[
          { id: 'active', label: 'Active', count: counts.active },
          { id: 'review', label: 'Under Review', count: counts.review },
          { id: 'rejected', label: 'Rejected', count: counts.rejected },
          { id: 'sold', label: 'Sold', count: counts.sold }
        ].map((tab) => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabState)}
            className={cn(
              "h-8 px-4 text-[11px] font-bold rounded-full transition-all whitespace-nowrap flex items-center gap-2 uppercase tracking-widest",
              activeTab === tab.id 
                ? "bg-gray-900 text-white" 
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            )}
          >
            {tab.label}
            <span className={cn(
                "w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold",
                activeTab === tab.id ? "bg-white text-gray-900" : "bg-gray-200 text-gray-500"
            )}>
                {tab.count}
            </span>
          </button>
        ))}
      </div>

      {(error || success) && (
        <div className={cn(
          "mb-6 p-3 rounded-xl text-sm font-medium border",
          error ? "bg-red-50 text-red-800 border-red-100" : "bg-green-50 text-green-800 border-green-100"
        )}>
          {error || success}
        </div>
      )}

      {/* Listing Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
        {loading ? (
          <>
            {[1,2,3,4].map(i => (
                <div key={i} className="aspect-[3/4] bg-gray-50 rounded-xl border border-gray-100 animate-pulse" />
            ))}
          </>
        ) : listings.length === 0 ? (
          <div className="col-span-full py-16 sm:py-24 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-4 mx-auto">
                <Inbox className="w-6 h-6 text-gray-300" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">No listings found</h3>
            <p className="text-sm text-gray-400 max-w-xs mx-auto">You have no {activeTab} listings at the moment.</p>
            {activeTab === 'active' && (
              <Link href="/post" className="inline-flex items-center justify-center h-10 px-5 text-sm font-semibold rounded-full bg-[#16a34a] text-white mt-5">
                 Post an item
              </Link>
            )}
          </div>
        ) : (
          listings.map((item) => {
            const canBump = item.bumpCount < 3 && item.status === 'approved' && !item.aiFlagged
            const nextBumpDate = item.lastBumpAt ? addDays(new Date(item.lastBumpAt), 7) : null
            const isOnCooldown = !!(nextBumpDate && isAfter(nextBumpDate, new Date()))

            return (
              <ListingCard 
                key={item._id} 
                listing={item} 
                showSeller={false}
                actions={
                  <div className="flex flex-col gap-2 w-full">
                    {/* Status badge (left) */}
                    <div className="flex items-center justify-between w-full">
                        <span className={cn(
                        "text-[10px] lg:text-xs font-medium px-2 py-0.5 rounded-full",
                        item.status === 'approved' ? "bg-green-50 text-green-700" :
                        item.status === 'pending' || item.status === 'under_review' ? "bg-yellow-50 text-yellow-700" :
                        item.status === 'blocked' ? "bg-red-50 text-red-700" :
                        item.status === 'sold' ? "bg-gray-100 text-gray-500" :
                        "bg-gray-100 text-gray-500"
                        )}>
                            {item.status === 'approved' ? 'Active' : 
                            item.status === 'under_review' || item.status === 'pending' ? 'Under review' :
                            item.status === 'blocked' ? 'Not approved' :
                            item.status === 'sold' ? 'Sold' : 'Expired'}
                        </span>
                        
                        {item.status === 'approved' && (
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation()
                                    handleBump(item.slug)
                                }}
                                disabled={!!actionLoading || !canBump || isOnCooldown}
                                className={cn(
                                    "h-7 px-2.5 text-xs font-medium rounded-full transition-all",
                                    isOnCooldown || !canBump ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-[#16a34a] text-white"
                                )}
                            >
                                Bump
                            </button>
                        )}
                    </div>

                    {/* Action buttons Row */}
                    <div className={cn(
                      "w-full gap-1.5",
                      activeTab === 'active' ? "grid grid-cols-2 lg:flex lg:items-center" : "flex items-center"
                    )}>
                      {activeTab === 'active' && (
                        <>
                          <Link 
                            href={`/post/edit/${item.slug}`}
                            onClick={(e) => e.stopPropagation()}
                            className="flex-1 lg:flex-none lg:w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 hover:bg-gray-100 text-gray-600 transition-all border border-gray-100"
                            title="Edit"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span className="lg:hidden ml-1.5 text-[10px] font-bold uppercase tracking-tight">Edit</span>
                          </Link>
                          <button 
                            onClick={(e) => {
                                e.stopPropagation()
                                setSelectedSlug(item.slug)
                                setDeleteModalOpen(true)
                            }}
                            className="flex-1 lg:flex-none lg:w-8 h-8 flex items-center justify-center rounded-full bg-red-50 hover:bg-red-100 text-red-500 transition-all border border-red-100"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span className="lg:hidden ml-1.5 text-[10px] font-bold uppercase tracking-tight">Delete</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                }
              />
            )
          })
        )}
      </div>

      {/* Delete Confirmation */}
      {deleteModalOpen && (
        <ConfirmModal 
          title="Delete listing?"
          description="This action cannot be undone."
          actionText="Delete"
          actionVariant="danger"
          onConfirm={handleDeleteExecute}
          onCancel={() => {
            setDeleteModalOpen(false)
            setSelectedSlug(null)
          }}
          loading={!!actionLoading?.startsWith('delete')}
        />
      )}

    </div>
  )
}

export default function Dashboard() {
  return (
    <Suspense fallback={
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
            <div className="h-8 bg-gray-100 rounded w-48 mb-8 animate-pulse"></div>
            <div className="h-8 bg-gray-100 rounded w-full mb-8 animate-pulse"></div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {[1,2,3,4].map(i => (
                    <div key={i} className="aspect-[3/4] bg-gray-50 rounded-xl border border-gray-100 animate-pulse" />
                ))}
            </div>
        </div>
    }>
      <DashboardContent />
    </Suspense>
  )
}
