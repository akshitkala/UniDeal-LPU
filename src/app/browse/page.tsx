'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Search, SlidersHorizontal, Loader2, ArrowLeft, ChevronRight } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface Listing {
  _id: string
  slug: string
  title: string
  price: number
  condition: string
  images: string[]
  negotiable: boolean
  bumpedAt?: string
  createdAt: string
  category: { name: string, slug: string }
  seller: { displayName: string, photoURL?: string, isLpuVerified?: boolean }
}

function BrowseContent() {
  const searchParams = useSearchParams()
  const initialCategory = searchParams.get('category') || ''
  const initialCategoryName = searchParams.get('name') || 'All Listings'
  const initialQuery = searchParams.get('q') || ''

  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [fetchingMore, setFetchingMore] = useState(false)

  const fetchListings = async (cursor?: string) => {
    if (cursor) setFetchingMore(true)
    else setLoading(true)

    try {
      const url = new URL('/api/listings', window.location.origin)
      if (initialCategory) url.searchParams.set('category', initialCategory)
      if (initialQuery) url.searchParams.set('q', initialQuery)
      if (cursor) url.searchParams.set('cursor', cursor)
      url.searchParams.set('limit', '12')

      const res = await fetch(url.toString())
      if (!res.ok) throw new Error('API Sync Failed')
      const data = await res.json()
      
      if (cursor) {
        setListings(prev => [...prev, ...data.listings])
      } else {
        setListings(data.listings)
      }
      setNextCursor(data.nextCursor)
    } catch (err) {
      console.error('[Browse] Connectivity Fault:', err)
    } finally {
      setLoading(false)
      setFetchingMore(false)
    }
  }

  useEffect(() => {
    fetchListings()
  }, [searchParams])

  return (
    <div className="max-w-[1280px] mx-auto px-4 py-8">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div className="flex flex-col gap-2">
          <Link href="/categories" className="inline-flex items-center gap-2 text-sm text-[#2D9A54] font-bold hover:gap-3 transition-all mb-2">
            <ArrowLeft className="w-4 h-4" /> All Branches
          </Link>
          <h1 className="text-4xl font-black text-gray-900 leading-none">
            {initialQuery ? `Results for "${initialQuery}"` : initialCategoryName}
          </h1>
          <p className="text-gray-500 font-medium">Found {listings.length}{nextCursor ? '+' : ''} active opportunities</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Refine search..." 
              defaultValue={initialQuery}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                   const val = e.currentTarget.value
                   window.location.href = `/browse?q=${encodeURIComponent(val)}`
                }
              }}
              className="w-full h-12 bg-white border border-[#E5E5E5] rounded-xl pl-11 pr-4 focus:outline-none focus:border-[#2D9A54] focus:ring-2 focus:ring-[#2D9A54]/20 transition-all font-medium"
            />
          </div>
          <button className="h-12 w-12 flex items-center justify-center bg-white border border-[#E5E5E5] rounded-xl hover:border-gray-900 transition-colors">
            <SlidersHorizontal className="w-5 h-5 text-gray-700" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
             <div key={i} className="h-[300px] bg-gray-50 rounded-2xl animate-pulse border border-gray-100" />
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in duration-500">
           <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
              <Search className="w-10 h-10 text-gray-200" />
           </div>
           <h2 className="text-2xl font-bold text-gray-900 mb-2">Signal Lost in Branch</h2>
           <p className="text-gray-500 max-w-sm mb-8">No active listings match your current filters in the {initialCategoryName} sector.</p>
           <Link href="/categories" className="px-8 py-3 bg-[#2D9A54] text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-95">
              Switch Branch
           </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {listings.map((l) => (
              <Link 
                href={`/listing/${l.slug}`} 
                key={l._id} 
                className="group bg-white border border-[#E5E5E5] hover:border-[#2D9A54] hover:shadow-2xl transition-all duration-300 rounded-2xl overflow-hidden flex flex-col h-[300px] relative"
              >
                {/* Image & Badges */}
                <div className="relative h-[180px] w-full bg-gray-100 overflow-hidden">
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300 z-1" />
                  
                  <span className="absolute top-3 left-3 z-10 font-bold bg-[#2D9A54] text-white text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-lg shadow-sm">
                    {l.category?.name || 'Item'}
                  </span>
                  
                  {l.images && l.images.length > 0 ? (
                    <img 
                      src={l.images[0]} 
                      alt={l.title} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <Search className="w-10 h-10 opacity-20" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4 flex flex-col justify-between flex-1 relative z-10">
                  <div>
                    <h3 className="text-[15px] leading-tight font-bold text-gray-900 line-clamp-2 mb-1.5 group-hover:text-[#2D9A54] transition-colors">
                      {l.title}
                    </h3>
                    <div className="flex items-center gap-3">
                      <span className="text-[18px] font-black text-gray-900 tracking-tight">₹{l.price.toLocaleString('en-IN')}</span>
                      {l.negotiable && <span className="text-[10px] font-bold bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded-md border border-amber-200 uppercase tracking-tighter">Neg</span>}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center pt-3 border-t border-gray-50">
                    <span className="text-[12px] font-bold text-gray-500 truncate max-w-[120px]">{l.seller?.displayName || 'User'}</span>
                    <span className="text-[11px] font-medium text-gray-400 capitalize">
                      {formatDistanceToNow(new Date(l.bumpedAt || l.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {nextCursor && (
            <div className="mt-16 flex justify-center">
              <button 
                onClick={() => fetchListings(nextCursor)}
                disabled={fetchingMore}
                className="h-12 px-10 bg-white border border-[#E5E5E5] hover:border-[#2D9A54] text-gray-900 font-bold rounded-xl transition-all shadow-sm hover:shadow-md disabled:opacity-50 flex items-center gap-3"
              >
                {fetchingMore ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Load More Infrastructure'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default function BrowsePage() {
  return (
    <Suspense fallback={
       <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-[#2D9A54] animate-spin" />
       </div>
    }>
      <BrowseContent />
    </Suspense>
  )
}
