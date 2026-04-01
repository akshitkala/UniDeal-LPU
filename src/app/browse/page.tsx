'use client'

import { useEffect, useState, Suspense, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Search, SlidersHorizontal, Loader2, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ListingCard } from '@/components/listing/ListingCard'

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
  const router = useRouter()
  const searchParams = useSearchParams()
  const sentinelRef = useRef<HTMLDivElement>(null)
  const isFetchingRef = useRef(false)
  
  // URL States
  const q = searchParams.get('q') || ''
  const category = searchParams.get('category') || ''
  const condition = searchParams.get('condition') || ''
  const minPrice = searchParams.get('minPrice') || ''
  const maxPrice = searchParams.get('maxPrice') || ''
  const sort = searchParams.get('sort') || 'newest'

  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [fetchingMore, setFetchingMore] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  const updateFilters = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([key, value]) => {
      if (value) params.set(key, value)
      else params.delete(key)
    })
    params.delete('cursor') // Reset pagination on filter change
    router.push(`/browse?${params.toString()}`)
  }

  const fetchListings = async (cursor?: string) => {
    if (isFetchingRef.current) return
    
    isFetchingRef.current = true
    if (cursor) setFetchingMore(true)
    else setLoading(true)

    try {
      const url = new URL('/api/listings', window.location.origin)
      if (q) url.searchParams.set('q', q)
      if (category) url.searchParams.set('category', category)
      if (condition) url.searchParams.set('condition', condition)
      if (minPrice) url.searchParams.set('minPrice', minPrice)
      if (maxPrice) url.searchParams.set('maxPrice', maxPrice)
      if (sort) url.searchParams.set('sort', sort)
      if (cursor) url.searchParams.set('cursor', cursor)
      url.searchParams.set('limit', '24')

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
      isFetchingRef.current = false
    }
  }

  useEffect(() => {
    // STRICT RESET: Clear all items and cursor before fetching new filtered results
    setListings([])
    setNextCursor(null)
    setLoading(true)
    fetchListings()
  }, [searchParams])

  // Infinite Scroll Intersection Guard
  useEffect(() => {
    const sensor = sentinelRef.current
    if (!sensor || !nextCursor || loading) return

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !isFetchingRef.current && nextCursor) {
        fetchListings(nextCursor)
      }
    }, { threshold: 0, rootMargin: '400px' })

    observer.observe(sensor)
    return () => observer.disconnect()
  }, [nextCursor, loading])

  return (
    <div className="max-w-[1280px] mx-auto px-4 py-8">
      {/* Header & Controls */}
      <div className="flex flex-col gap-8 mb-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex flex-col gap-2">
            <Link href="/" className="inline-flex items-center gap-2 text-sm text-[#2D9A54] font-bold hover:gap-3 transition-all mb-2">
                <ArrowLeft className="w-4 h-4" /> All Branches
            </Link>
            <h1 className="text-4xl font-black text-gray-900 leading-none tracking-tight">
                {q ? `Results for "${q}"` : category ? `Sector: ${category}` : 'Campus Feed'}
            </h1>
            <p className="text-gray-500 font-medium">Found {listings.length}{nextCursor ? '+' : ''} listings</p>
            </div>

            <div className="flex items-center gap-3">
            <div className="relative flex-1 md:w-80">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                type="text" 
                placeholder="Search laptops, books..." 
                defaultValue={q}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                    updateFilters({ q: e.currentTarget.value })
                    }
                }}
                className="w-full h-12 bg-gray-50 border-none rounded-2xl pl-11 pr-4 focus:ring-2 focus:ring-[#2D9A54]/20 transition-all font-bold text-sm"
                />
            </div>
            <button 
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                    "h-12 w-12 flex items-center justify-center rounded-2xl transition-all border",
                    showFilters ? "bg-[#1A1A1A] border-gray-900 text-white" : "bg-white border-gray-200 text-gray-700 hover:border-gray-900"
                )}
            >
                <SlidersHorizontal className="w-5 h-5" />
            </button>
            </div>
        </div>

        {/* Dynamic Filters Bar */}
        {showFilters && (
            <div className="p-6 bg-gray-50 border border-gray-100 rounded-3xl grid grid-cols-1 md:grid-cols-4 gap-6 animate-in slide-in-from-top-4 duration-300">
                <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-1">Condition</label>
                    <select 
                        value={condition}
                        onChange={(e) => updateFilters({ condition: e.target.value || null })}
                        className="h-10 bg-white border-gray-200 rounded-xl px-3 text-sm font-bold focus:ring-[#2D9A54] outline-none"
                    >
                        <option value="">Any Condition</option>
                        <option value="new">Brand New</option>
                        <option value="like-new">Like New</option>
                        <option value="good">Good State</option>
                        <option value="used">Used/Fair</option>
                        <option value="damaged">Damaged</option>
                    </select>
                </div>
                <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-1">Price Range</label>
                    <div className="flex items-center gap-2">
                        <input 
                            type="number" 
                            placeholder="Min" 
                            value={minPrice}
                            onChange={(e) => updateFilters({ minPrice: e.target.value || null })}
                            className="w-full h-10 bg-white border-gray-200 rounded-xl px-3 text-sm font-bold outline-none"
                        />
                        <span className="text-gray-300">-</span>
                        <input 
                            type="number" 
                            placeholder="Max" 
                            value={maxPrice}
                            onChange={(e) => updateFilters({ maxPrice: e.target.value || null })}
                            className="w-full h-10 bg-white border-gray-200 rounded-xl px-3 text-sm font-bold outline-none"
                        />
                    </div>
                </div>
                <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-1">Sort By</label>
                    <select 
                        value={sort}
                        onChange={(e) => updateFilters({ sort: e.target.value })}
                        className="h-10 bg-white border-gray-200 rounded-xl px-3 text-sm font-bold focus:ring-[#2D9A54] outline-none"
                    >
                        <option value="newest">Recently Bumped</option>
                        <option value="price_asc">Price: Low to High</option>
                        <option value="price_desc">Price: High to Low</option>
                        <option value="views">Most Popular</option>
                    </select>
                </div>
                <div className="flex items-end pb-0.5">
                    <button 
                        onClick={() => window.location.href = '/browse'}
                        className="w-full h-10 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl text-xs font-bold transition-colors"
                    >
                        Reset All Filters
                    </button>
                </div>
            </div>
        )}
      </div>

      {loading && listings.length === 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
             <div key={i} className="h-[320px] bg-gray-50 rounded-2xl animate-pulse border border-gray-100" />
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in duration-500">
           <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
              <Search className="w-10 h-10 text-gray-200" />
           </div>
           <h2 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">Nothing found</h2>
           <p className="text-gray-500 font-medium max-w-sm mb-8">No listings yet. Be the first to sell something.</p>
           <button 
             onClick={() => window.location.href = '/post'}
             className="px-8 py-3 bg-[#2D9A54] text-white font-black rounded-xl shadow-lg shadow-[#2D9A54]/20 hover:scale-105 transition-all active:scale-95"
           >
              Sell something
           </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {listings.map((l) => (
              <ListingCard 
                key={l._id} 
                listing={l} 
              />
            ))}
          </div>

          {/* Pagination Sentinel */}
          <div 
            ref={sentinelRef}
            className="mt-16 py-10 flex flex-col items-center justify-center w-full"
          >
            {fetchingMore && (
              <div className="flex flex-col items-center gap-3 animate-in fade-in duration-300">
                <Loader2 className="w-10 h-10 animate-spin text-[#2D9A54]" />
                <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest italic animate-pulse">Gleaning more assets...</span>
              </div>
            )}
            {!nextCursor && listings.length > 0 && (
              <div className="flex flex-col items-center gap-4 animate-in zoom-in duration-500">
                <div className="h-px w-12 bg-gray-200" />
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">You've seen all listings</p>
                <div className="h-px w-12 bg-gray-200" />
              </div>
            )}
          </div>
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
