'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { formatDistanceToNow, addDays, isAfter } from 'date-fns'
import { 
  PlusCircle, 
  Trash2, 
  ArrowUpCircle, 
  CheckCircle, 
  AlertTriangle, 
  Loader2,
  Clock,
  ExternalLink,
  ShieldAlert,
  ChevronRight,
  TrendingUp,
  Inbox
} from 'lucide-react'
import { ConfirmModal } from '@/components/admin/ConfirmModal'
import { cn } from '@/lib/utils'
import { ListingCard } from '@/components/listing/ListingCard'

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
        setError(data.error || 'Rate limit exceeded.')
      } else {
        setSuccess('Listing prioritized in the feed.')
        setError(null)
        fetchListings(activeTab)
      }
    } catch (error) {
      setError('Network error during bump.')
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
      setError('Network error during deletion.')
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="flex flex-col gap-10 max-w-[1280px] mx-auto mt-8 mb-24 px-4">
      
      {/* Header Strategy */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="flex flex-col gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-widest rounded-full border border-emerald-100 mb-2 w-fit">
                <TrendingUp className="w-3 h-3" /> Marketplace
            </div>
            <h1 className="text-5xl font-black text-gray-900 tracking-tighter leading-none mb-1">My Dashboard</h1>
            <p className="text-gray-500 font-medium text-lg">Manage your campus listings and interactions.</p>
        </div>

        <Link 
          href="/post" 
          className="h-16 px-10 bg-[#2D9A54] hover:bg-[#258246] text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl shadow-[#2D9A54]/20"
        >
          <PlusCircle className="w-6 h-6" /> Sell Another Item
        </Link>
      </header>

      {/* Persistence Tabs */}
      <div className="flex items-center gap-1 p-1.5 bg-gray-50 border border-gray-100 rounded-2xl w-fit">
        {[
          { id: 'active', label: 'Live', icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-[#2D9A54]' },
          { id: 'pending', label: 'Review', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-500' },
          { id: 'blocked', label: 'Blocked', icon: ShieldAlert, color: 'text-red-600', bg: 'bg-red-500' }
        ].map((tab) => (
            <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabState)}
                className={cn(
                    "relative px-6 py-3 rounded-xl font-black text-sm transition-all flex items-center gap-2",
                    activeTab === tab.id ? "bg-white shadow-sm text-gray-900" : "text-gray-400 hover:text-gray-600"
                )}
            >
                <tab.icon className={cn("w-4 h-4", activeTab === tab.id ? tab.color : "text-gray-300")} />
                {tab.label}
                {activeTab === tab.id && <span className={cn("absolute -top-1 -right-1 w-2 h-2 rounded-full", tab.bg)} />}
            </button>
        ))}
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-sm font-bold animate-in slide-in-from-top-4 duration-300">
           <AlertTriangle className="w-5 h-5 shrink-0" /> {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3 text-emerald-600 text-sm font-bold animate-in slide-in-from-top-4 duration-300">
           <CheckCircle className="w-5 h-5 shrink-0" /> {success}
        </div>
      )}

      {/* Grid Architecture */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
        {loading ? (
          <>
            {[1,2,3,4].map(i => (
                <div key={i} className="h-80 bg-gray-50 rounded-[2.5rem] border border-gray-100 animate-pulse" />
            ))}
          </>
        ) : listings.length === 0 ? (
          <div className="col-span-full p-20 bg-gray-50/50 border border-dashed border-gray-200 rounded-[3rem] flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center shadow-sm mb-6">
                <Inbox className="w-8 h-8 text-gray-200" />
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-2">No listings found</h3>
            <p className="text-gray-500 font-medium mb-8 max-w-xs">You have no {activeTab} listings at the moment.</p>
            {activeTab === 'active' && (
              <Link href="/post" className="font-black text-[#2D9A54] hover:gap-3 transition-all flex items-center gap-2 group">
                 Post your first item <ChevronRight className="w-4 h-4 group-hover:translate-x-1" />
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
                key={item.slug} 
                listing={item} 
                showSeller={false}
                actions={
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                        <span className={cn(
                            "px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tighter border",
                            item.status === 'approved' ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                            item.status === 'pending' ? "bg-amber-50 text-amber-700 border-amber-100" :
                            "bg-rose-50 text-rose-700 border-rose-100"
                        )}>
                            {item.status === 'approved' ? 'Live' : item.status === 'pending' ? 'Review' : 'Blocked'}
                        </span>
                        <span className="text-[9px] font-bold text-gray-400 flex items-center gap-1 uppercase tracking-widest leading-none">
                            <Clock className="w-3 h-3" />
                            {formatDistanceToNow(new Date(item.createdAt))}
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        {item.status === 'approved' && (
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation()
                                    handleBump(item.slug)
                                }}
                                disabled={!!actionLoading || !canBump || isOnCooldown}
                                className={cn(
                                    "h-9 rounded-lg font-black text-[10px] flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50",
                                    isOnCooldown || item.bumpCount >= 3 ? "bg-gray-100 text-gray-400" : "bg-emerald-600 text-white shadow-md shadow-emerald-500/10"
                                )}
                            >
                                {actionLoading === `bump-${item.slug}` ? <Loader2 className="w-3 h-3 animate-spin" /> : <ArrowUpCircle className="w-3.5 h-3.5" />}
                                {isOnCooldown ? 'Cooldown' : 'Bump'}
                            </button>
                        )}
                        <Link 
                            href={`/listing/${item.slug}`} 
                            onClick={(e) => e.stopPropagation()}
                            className="h-9 px-3 bg-gray-50 text-gray-700 rounded-lg font-black text-[10px] flex items-center justify-center gap-2 hover:bg-gray-100"
                        >
                            <ExternalLink className="w-3.5 h-3.5" /> View
                        </Link>
                    </div>
                    
                    <button 
                        onClick={(e) => {
                            e.stopPropagation()
                            setListingToDelete(item.slug)
                            setDeleteModalOpen(true)
                        }}
                        className="w-full h-9 text-rose-500 hover:bg-rose-50 rounded-lg font-black text-[10px] transition-colors border border-transparent hover:border-rose-100"
                    >
                        <Trash2 className="w-3.5 h-3.5 mx-auto" />
                    </button>
                  </div>
                }
              />
            )
          })
        )}
      </div>

      {/* Delete Confirmation Overlay */}
      {deleteModalOpen && (
        <ConfirmModal 
          title="Evacuate Listing?"
          description="Confirm immediate extraction of this listing from all campus feeds. This action is final for users."
          actionText="Confirm Extraction"
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
