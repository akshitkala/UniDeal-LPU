'use client'

import { useEffect, useState, Suspense, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Search, SlidersHorizontal, Loader2, PackageCheck, X, ChevronDown } from 'lucide-react'
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
  seller: { displayName: string, email: string }
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-gray-100 overflow-hidden animate-pulse bg-white">
      <div className="aspect-square bg-gray-100" />
      <div className="p-3 space-y-2">
        <div className="h-3 bg-gray-100 rounded w-3/4" />
        <div className="h-3 bg-gray-100 rounded w-1/2" />
        <div className="h-4 bg-gray-100 rounded w-1/3 mt-2" />
      </div>
    </div>
  )
}

interface Category {
  _id: string
  name: string
  slug: string
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
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [fetchingMore, setFetchingMore] = useState(false)
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  const [searchInput, setSearchInput] = useState(q)

  // 1. Debounce Search to URL (Fix 1)
  useEffect(() => {
    // skip first mount if q is already set
    if (searchInput === q) return

    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (searchInput) {
        params.set('q', searchInput)
      } else {
        params.delete('q')
      }
      params.delete('cursor') // reset pagination
      router.replace(`/browse?${params.toString()}`)
    }, 400)

    return () => clearTimeout(timer)
  }, [searchInput])

  // Sync state if URL changes (navbar search)
  useEffect(() => {
    setSearchInput(q)
  }, [q])

  const updateFilters = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== null && value !== undefined) params.set(key, value)
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
      url.searchParams.set('limit', '12')

      const res = await fetch(url.toString())
      if (!res.ok) throw new Error('Refresh failed')
      const data = await res.json()
      
      if (cursor) {
        setListings(prev => {
          // Deduplicate by _id before appending (Fix)
          const existingIds = new Set(prev.map(l => l._id))
          const newItems = data.listings.filter((l: any) => !existingIds.has(l._id))
          return [...prev, ...newItems]
        })
      } else {
        setListings(data.listings)
        setTotalCount(data.total || 0)
      }
      setNextCursor(data.nextCursor)
    } catch (err) {
      console.error('[Browse] Connectivity error:', err)
    } finally {
      setLoading(false)
      setFetchingMore(false)
      isFetchingRef.current = false
    }
  }

  // 2. Stable Fetch: Categories + Initial Listings (Fix 4.2)
  useEffect(() => {
    async function initBrowse() {
      // Parallel fetch for initial load (Fix 4.2)
      try {
        const [catRes, listRes] = await Promise.all([
          fetch('/api/categories'),
          fetch(`/api/listings?${searchParams.toString()}`)
        ])

        if (catRes.ok) {
          const catData = await catRes.json()
          setCategories(catData)
        }

        if (listRes.ok) {
          const listData = await listRes.json()
          setListings(listData.listings)
          setTotalCount(listData.total || 0)
          setNextCursor(listData.nextCursor)
        }
      } catch (err) {
        console.error('[Browse Init] Error:', err)
      } finally {
        setLoading(false)
      }
    }

    // Guard against multiple simultaneous fetches
    if (isFetchingRef.current) return
    initBrowse()
  }, [searchParams.toString()]) // Stable dependency (Fix 4.1)


  useEffect(() => {
    const sensor = sentinelRef.current
    if (!sensor || !nextCursor || loading) return

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !isFetchingRef.current && nextCursor) {
        fetchListings(nextCursor)
      }
    }, { threshold: 0, rootMargin: '600px' })

    observer.observe(sensor)
    return () => observer.disconnect()
  }, [nextCursor, loading])

  return (
    <div className="flex flex-col min-h-screen bg-white">
      
      {/* STICKY FILTER BAR */}
      <div className="sticky top-14 sm:top-16 z-30 bg-white border-b border-gray-100 py-2 lg:py-3 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Desktop Filter Row */}
          <div className="hidden lg:flex items-center gap-3">
            {/* Category Chips */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth">
              <button
                onClick={() => updateFilters({ category: null })}
                className={cn(
                  "rounded-full px-4 h-9 text-xs font-bold transition-all whitespace-nowrap uppercase tracking-wide",
                  !category 
                    ? "bg-[#16a34a] text-white" 
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                )}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat._id}
                  onClick={() => updateFilters({ category: cat.slug || null })}
                  className={cn(
                    "rounded-full px-4 h-9 text-xs font-bold transition-all whitespace-nowrap uppercase tracking-wide",
                    category === cat.slug 
                      ? "bg-[#16a34a] text-white" 
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  )}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            <div className="h-4 w-px bg-gray-100 shrink-0 mx-1" />

            {/* Condition Select */}
            <select 
              value={condition}
              onChange={(e) => updateFilters({ condition: e.target.value || null })}
              className="rounded-full border border-gray-100 h-9 px-3 text-xs font-bold text-gray-600 outline-none transition-all bg-white"
            >
              <option value="">Condition</option>
              <option value="new">New</option>
              <option value="like-new">Like New</option>
              <option value="good">Good</option>
              <option value="used">Used</option>
            </select>

            {/* Price Inputs */}
            <div className="flex items-center gap-2">
              <input 
                type="number" 
                placeholder="Min" 
                value={minPrice}
                onChange={(e) => updateFilters({ minPrice: e.target.value || null })}
                className="w-20 h-9 rounded-full border border-gray-100 px-3 text-xs font-bold text-gray-600 outline-none placeholder:text-gray-300"
              />
              <input 
                type="number" 
                placeholder="Max" 
                value={maxPrice}
                onChange={(e) => updateFilters({ maxPrice: e.target.value || null })}
                className="w-20 h-9 rounded-full border border-gray-100 px-3 text-xs font-bold text-gray-600 outline-none placeholder:text-gray-300"
              />
            </div>

            {/* Sort Select */}
            <select 
              value={sort}
              onChange={(e) => updateFilters({ sort: e.target.value })}
              className="ml-auto rounded-full border border-gray-100 h-9 px-3 text-xs font-bold text-gray-600 outline-none transition-all bg-white"
            >
              <option value="newest">Newest</option>
              <option value="price_asc">Price: Low</option>
              <option value="price_desc">Price: High</option>
            </select>
          </div>

          {/* Mobile Filter Row */}
          <div className="lg:hidden flex flex-col gap-2">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth">
              <button
                onClick={() => updateFilters({ category: null })}
                className={cn(
                  "rounded-full px-3 h-8 text-[10px] font-bold transition-all whitespace-nowrap uppercase tracking-wide",
                  !category 
                    ? "bg-[#16a34a] text-white" 
                    : "bg-gray-100 text-gray-500"
                )}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat._id}
                  onClick={() => updateFilters({ category: cat.slug || null })}
                  className={cn(
                    "rounded-full px-3 h-8 text-[10px] font-bold transition-all whitespace-nowrap uppercase tracking-wide",
                    category === cat.slug 
                      ? "bg-[#16a34a] text-white" 
                      : "bg-gray-100 text-gray-500"
                  )}
                >
                  {cat.name}
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between">
               <button 
                 onClick={() => setShowMobileFilters(true)}
                 className="flex items-center gap-1.5 h-8 px-3 rounded-full bg-white border border-gray-100 text-[10px] font-bold text-gray-600"
               >
                 <SlidersHorizontal className="w-3 h-3" /> 
                 Filters {(condition || minPrice || maxPrice) && "•"}
               </button>
               <select 
                  value={sort}
                  onChange={(e) => updateFilters({ sort: e.target.value })}
                  className="h-8 px-2 rounded-full border border-gray-100 bg-white text-[10px] font-bold text-gray-600 outline-none"
                >
                  <option value="newest">Newest</option>
                  <option value="price_asc">Price: Low</option>
                  <option value="price_desc">Price: High</option>
                </select>
            </div>
          </div>

        </div>
      </div>

      {/* RESULTS GRID */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        
        <div className="mb-6">
           <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
              {q ? (
                <>
                   {totalCount} results for "{q}"
                </>
              ) : category ? (
                <>
                   {totalCount} items in {categories.find(c => c.slug === category)?.name || category}
                </>
              ) : (
                <>
                   {totalCount} items found
                </>
              )}
           </h2>
        </div>

        {loading && listings.length === 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] bg-gray-50 rounded-xl border border-gray-100 animate-pulse" />
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
             <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                <Search className="w-8 h-8 text-gray-200" />
             </div>
             <h2 className="text-base font-semibold text-gray-900 mb-1">
                No results found
             </h2>
             <p className="text-sm text-gray-400 max-w-xs mx-auto mb-8">
                Try a different keyword or clear your filters.
             </p>

             <button 
              onClick={() => {
                setSearchInput('')
                updateFilters({ q: null, category: null, condition: null, minPrice: null, maxPrice: null })
              }}
              className="h-10 px-6 bg-[#16a34a] text-white font-semibold text-sm rounded-full transition-all"
             >
               Clear all
             </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
              {listings.map((listing, index) => (
                <ListingCard 
                  key={listing._id} 
                  listing={listing} 
                  priority={index < 4}
                />
              ))}
            </div>

            {/* Pagination Sentinel */}
            <div 
              ref={sentinelRef}
              className="mt-16 py-8 flex flex-col items-center justify-center w-full"
            >
              {fetchingMore && (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-6 h-6 rounded-full border-2 border-green-500 border-t-transparent animate-spin" />
                  <span className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">Loading...</span>
                </div>
              )}
              {!nextCursor && listings.length > 0 && (
                <p className="text-[10px] font-bold uppercase text-gray-300 tracking-widest">End of results</p>
              )}
            </div>
          </>
        )}
      </main>

      {/* MOBILE FILTERS SHEET */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end lg:hidden">
           <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowMobileFilters(false)} />
           <div className="relative bg-white rounded-t-2xl p-6 animate-in slide-in-from-bottom-full duration-300">
              <div className="w-10 h-1 bg-gray-100 rounded-full mx-auto mb-6" onClick={() => setShowMobileFilters(false)} />
              
              <div className="flex items-center justify-between mb-6">
                 <h3 className="text-base font-semibold text-gray-900">Filters</h3>
                 <button onClick={() => updateFilters({ condition: null, minPrice: null, maxPrice: null })} className="text-xs font-bold text-[#16a34a] uppercase tracking-wide">Reset</button>
              </div>

              <div className="space-y-6 pb-6">
                 <div>
                    <label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest block mb-3">Condition</label>
                    <div className="flex flex-wrap gap-2">
                       {['new', 'like-new', 'good', 'used'].map((cond) => (
                         <button 
                           key={cond}
                           onClick={() => updateFilters({ condition: cond === condition ? null : cond })}
                           className={cn(
                             "h-8 px-4 rounded-full text-xs font-semibold transition-all border",
                             condition === cond 
                               ? "bg-green-50 border-green-500 text-green-700" 
                               : "bg-gray-50 border-gray-100 text-gray-600"
                           )}
                         >
                           {cond.replace('-', ' ')}
                         </button>
                       ))}
                    </div>
                 </div>

                 <div>
                    <label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest block mb-3">Price range</label>
                    <div className="flex items-center gap-2">
                        <input 
                            type="number" 
                            placeholder="Min" 
                            value={minPrice}
                            onChange={(e) => updateFilters({ minPrice: e.target.value || null })}
                            className="flex-1 h-10 bg-gray-50 border border-gray-100 rounded-lg px-3 text-sm font-semibold"
                        />
                        <span className="text-gray-300 text-xs">to</span>
                        <input 
                            type="number" 
                            placeholder="Max" 
                            value={maxPrice}
                            onChange={(e) => updateFilters({ maxPrice: e.target.value || null })}
                            className="flex-1 h-10 bg-gray-50 border border-gray-100 rounded-lg px-3 text-sm font-semibold"
                        />
                    </div>
                 </div>
              </div>

              <button 
                onClick={() => setShowMobileFilters(false)}
                className="w-full h-11 bg-gray-900 text-white rounded-full font-semibold text-sm transition-all"
              >
                Apply filters
              </button>
           </div>
        </div>
      )}
    </div>
  )
}

export default function BrowsePage() {
  return (
    <Suspense fallback={
       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-8">
            {Array.from({ length: 12 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
       </div>
    }>
      <BrowseContent />
    </Suspense>
  )
}

