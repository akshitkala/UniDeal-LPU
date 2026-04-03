'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { addDays, isAfter } from 'date-fns'
import { getRelativeTime } from '@/lib/utils/time'
import { Edit, Trash2, ArrowUpCircle, CheckCircle, Clock, Inbox, ChevronRight, AlertTriangle } from 'lucide-react'
import { ConfirmModal } from '@/components/global/ConfirmModal'
import { cn } from '@/lib/utils'
import { ListingCard } from '@/components/listing/ListingCard'

type TabState = 'active' | 'pending' | 'sold' | 'expired'

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
      // Mapping sold/expired to the underlying API status if needed, but assuming direct mapping for now
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

  const handleDeleteExecute = async () => {
    if (!listingToDelete) return
    setActionLoading(`delete-${listingToDelete}`)
    try {
      const res = await fetch(`/api/listings/${listingToDelete}`, { method: 'DELETE' })
      if (res.ok) {
        setDeleteModalOpen(false)
        setListingToDelete(null)
        setSuccess('Listing deleted.')
        setError(null)
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
          <h1 className="text-xl lg:text-2xl font-semibold text-gray-900">My Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage your campus listings</p>
        </div>

        <Link 
          href="/post" 
          className="h-10 lg:h-11 px-5 lg:px-6 bg-[#16a34a] hover:bg-green-700 text-white rounded-full font-semibold text-sm flex items-center justify-center transition-all"
        >
          Sell item
        </Link>
      </header>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 scrollbar-none">
        {[
          { id: 'active', label: 'Active' },
          { id: 'pending', label: 'Pending' },
          { id: 'sold', label: 'Sold' },
          { id: 'expired', label: 'Expired' }
        ].map((tab) => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabState)}
            className={cn(
              "h-8 lg:h-9 px-3 lg:px-4 text-xs lg:text-sm font-semibold rounded-full transition-all whitespace-nowrap",
              activeTab === tab.id 
                ? "bg-gray-900 text-white" 
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            )}
          >
            {tab.label}
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
                  <div className="flex items-center w-full">
                    {/* Status badge (left) */}
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

                    {/* Action buttons (right, ml-auto) */}
                    <div className="ml-auto flex items-center gap-1.5">
                      {item.status === 'approved' ? (
                        <>
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
                          <Link 
                            href={`/post/edit/${item.slug}`}
                            onClick={(e) => e.stopPropagation()}
                            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Link>
                          <button 
                            onClick={(e) => {
                                e.stopPropagation()
                                setListingToDelete(item.slug)
                                setDeleteModalOpen(true)
                            }}
                            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-red-50 text-red-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <button 
                          onClick={(e) => {
                              e.stopPropagation()
                              setListingToDelete(item.slug)
                              setDeleteModalOpen(true)
                          }}
                          className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-red-50 text-red-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
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
            setListingToDelete(null)
          }}
          loading={!!actionLoading?.startsWith('delete')}
        />
      )}

    </div>
  )
}
