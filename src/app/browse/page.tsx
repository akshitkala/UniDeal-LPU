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
  seller: { displayName: string, photoURL?: string }
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
      url.searchParams.set('limit', '24')

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

  useEffect(() => {
    setListings([])
    setNextCursor(null)
    setLoading(true)
    fetchListings()
  }, [searchParams])

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch('/api/categories')
        if (res.ok) {
          const data = await res.json()
          setCategories(data)
        }
      } catch (err) {
        console.error('Failed to fetch categories', err)
      }
    }
    fetchCategories()
  }, [])

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
      <div className="sticky top-16 z-30 bg-white border-b border-gray-100 shadow-sm py-3 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Desktop Filter Row */}
          <div className="hidden lg:flex items-center gap-4">
            {/* Category Chips */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth">
              <button
                onClick={() => updateFilters({ category: null })}
                className={cn(
                  "rounded-full px-5 h-9 text-xs font-bold transition-all whitespace-nowrap uppercase tracking-widest",
                  !category 
                    ? "bg-gray-900 text-white shadow-md shadow-gray-200" 
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                )}
              >
                All Items
              </button>
              {categories.map((cat) => (
                <button
                  key={cat._id}
                  onClick={() => updateFilters({ category: cat.slug || null })}
                  className={cn(
                    "rounded-full px-5 h-9 text-xs font-bold transition-all whitespace-nowrap uppercase tracking-widest",
                    category === cat.slug 
                      ? "bg-gray-900 text-white shadow-md shadow-gray-200" 
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  )}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            <div className="h-5 w-px bg-gray-200 shrink-0" />

            {/* Condition Select */}
            <select 
              value={condition}
              onChange={(e) => updateFilters({ condition: e.target.value || null })}
              className="rounded-full border border-gray-200 h-9 px-4 text-xs font-bold text-gray-600 outline-none focus:ring-2 focus:ring-green-500/10 transition-all bg-white"
            >
              <option value="">Any Condition</option>
              <option value="new">Brand New</option>
              <option value="like-new">Like New</option>
              <option value="good">Good State</option>
              <option value="used">Used/Fair</option>
              <option value="damaged">Damaged</option>
            </select>

            {/* Price Inputs */}
            <div className="flex items-center gap-2">
              <input 
                type="number" 
                placeholder="Min Price" 
                value={minPrice}
                onChange={(e) => updateFilters({ minPrice: e.target.value || null })}
                className="w-24 h-9 rounded-full border border-gray-200 px-4 text-xs font-bold text-gray-600 outline-none focus:ring-2 focus:ring-green-500/10 placeholder:text-gray-300"
              />
              <span className="text-gray-300">-</span>
              <input 
                type="number" 
                placeholder="Max Price" 
                value={maxPrice}
                onChange={(e) => updateFilters({ maxPrice: e.target.value || null })}
                className="w-24 h-9 rounded-full border border-gray-200 px-4 text-xs font-bold text-gray-600 outline-none focus:ring-2 focus:ring-green-500/10 placeholder:text-gray-300"
              />
            </div>

            {/* Sort Select */}
            <select 
              value={sort}
              onChange={(e) => updateFilters({ sort: e.target.value })}
              className="ml-auto rounded-full border border-gray-200 h-9 px-4 text-xs font-bold text-gray-600 outline-none focus:ring-2 focus:ring-green-500/10 transition-all bg-white"
            >
              <option value="newest">Newest First</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="views">Most Views</option>
            </select>
          </div>

          {/* Mobile Filter Row */}
          <div className="lg:hidden flex flex-col gap-3">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth">
              <button
                onClick={() => updateFilters({ category: null })}
                className={cn(
                  "rounded-full px-5 h-9 text-xs font-bold transition-all whitespace-nowrap uppercase tracking-widest",
                  !category 
                    ? "bg-gray-900 text-white" 
                    : "bg-gray-100 text-gray-400"
                )}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat._id}
                  onClick={() => updateFilters({ category: cat.slug || null })}
                  className={cn(
                    "rounded-full px-5 h-9 text-xs font-bold transition-all whitespace-nowrap uppercase tracking-widest",
                    category === cat.slug 
                      ? "bg-gray-900 text-white" 
                      : "bg-gray-100 text-gray-400"
                  )}
                >
                  {cat.name}
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between">
               <button 
                 onClick={() => setShowMobileFilters(true)}
                 className="flex items-center gap-2 h-9 px-4 rounded-full bg-white border border-gray-100 text-xs font-bold text-gray-600 shadow-sm"
               >
                 <SlidersHorizontal className="w-3.5 h-3.5" /> 
                 Filters {(condition || minPrice || maxPrice) && "•"}
               </button>
               <select 
                  value={sort}
                  onChange={(e) => updateFilters({ sort: e.target.value })}
                  className="h-9 px-3 rounded-full border border-gray-100 bg-white text-xs font-bold text-gray-600 outline-none"
                >
                  <option value="newest">Sort: Newest</option>
                  <option value="price_asc">Price: Lower</option>
                  <option value="price_desc">Price: Higher</option>
                </select>
            </div>
          </div>

        </div>
      </div>

      {/* RESULTS GRID */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
        
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
           <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest italic">
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
           
           <div className="flex items-center gap-2">
             {q && (
               <button 
                 onClick={() => {
                   setSearchInput('')
                   updateFilters({ q: null })
                 }}
                 className="flex items-center gap-1.5 text-xs font-bold text-gray-900 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100"
               >
                 "{q}" <X className="w-3 h-3" />
               </button>
             )}
           </div>
        </div>

        {loading && listings.length === 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-8">
            {[...Array(12)].map((_, i) => (
               <div key={i} className="aspect-[4/5] bg-gray-50 rounded-2xl animate-pulse border border-gray-100" />
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center animate-in fade-in zoom-in-95 duration-500">
             <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-8">
                <Search className="w-12 h-12 text-gray-200" />
             </div>
             <h2 className="text-2xl font-black text-gray-900 mb-2">
                {q ? `No results for "${q}"` : "No listings match these filters"}
             </h2>
             <p className="text-gray-500 font-medium max-w-sm mb-10">
                {q 
                  ? "Try a different keyword or clear your search to browse all items." 
                  : "We couldn't find any listings matching your selection. Try adjusting your filters."}
             </p>

             {q ? (
               <button 
                onClick={() => {
                  setSearchInput('')
                  updateFilters({ q: null })
                }}
                className="px-10 py-4 bg-gray-900 text-white font-bold rounded-full shadow-xl shadow-gray-200 active:scale-95 transition-all"
               >
                 Clear search
               </button>
             ) : (
               <Link 
                href="/browse"
                className="px-10 py-4 bg-gray-900 text-white font-bold rounded-full shadow-xl shadow-gray-200 active:scale-95 transition-all"
               >
                 Clear all filters
               </Link>
             )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
              className="mt-20 py-10 flex flex-col items-center justify-center w-full"
            >
              {fetchingMore && (
                <div className="flex flex-col items-center gap-4 animate-in fade-in duration-300">
                  <div className="w-8 h-8 rounded-full border-2 border-green-500 border-t-transparent animate-spin" />
                  <span className="text-[10px] font-bold uppercase text-gray-400 tracking-[0.2em] italic">Loading more listings...</span>
                </div>
              )}
              {!nextCursor && listings.length > 0 && (
                <div className="flex flex-col items-center gap-4 opacity-40">
                  <div className="h-px w-16 bg-gray-300" />
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em]">You've seen all listings</p>
                  <div className="h-px w-16 bg-gray-300" />
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* MOBILE FILTERS SHEET */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end lg:hidden">
           <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowMobileFilters(false)} />
           <div className="relative bg-white rounded-t-[2.5rem] p-8 animate-in slide-in-from-bottom-full duration-300">
              <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-8" onClick={() => setShowMobileFilters(false)} />
              
              <div className="flex items-center justify-between mb-8">
                 <h3 className="text-xl font-black text-gray-900 capitalize">Filters</h3>
                 <button onClick={() => updateFilters({ condition: null, minPrice: null, maxPrice: null })} className="text-xs font-bold text-[#16a34a] uppercase tracking-widest">Reset</button>
              </div>

              <div className="space-y-8 pb-10">
                 <div className="flex flex-col gap-4">
                    <label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">Condition</label>
                    <div className="grid grid-cols-2 gap-2">
                       {['new', 'like-new', 'good', 'used', 'damaged'].map((cond) => (
                         <button 
                           key={cond}
                           onClick={() => updateFilters({ condition: cond === condition ? null : cond })}
                           className={cn(
                             "h-11 rounded-xl text-xs font-bold transition-all capitalize px-4 border",
                             condition === cond 
                               ? "bg-green-50 border-green-500 text-green-700 shadow-sm" 
                               : "bg-gray-50 border-gray-100 text-gray-600"
                           )}
                         >
                           {cond.replace('-', ' ')}
                         </button>
                       ))}
                    </div>
                 </div>

                 <div className="flex flex-col gap-4">
                    <label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">Price range</label>
                    <div className="flex items-center gap-3">
                        <div className="relative flex-1">
                           <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">₹</span>
                           <input 
                              type="number" 
                              placeholder="Min" 
                              value={minPrice}
                              onChange={(e) => updateFilters({ minPrice: e.target.value || null })}
                              className="w-full h-12 bg-gray-50 border-none rounded-2xl pl-8 pr-4 font-bold text-sm"
                           />
                        </div>
                        <span className="text-gray-300">to</span>
                        <div className="relative flex-1">
                           <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">₹</span>
                           <input 
                              type="number" 
                              placeholder="Max" 
                              value={maxPrice}
                              onChange={(e) => updateFilters({ maxPrice: e.target.value || null })}
                              className="w-full h-12 bg-gray-50 border-none rounded-2xl pl-8 pr-4 font-bold text-sm"
                           />
                        </div>
                    </div>
                 </div>
              </div>

              <button 
                onClick={() => setShowMobileFilters(false)}
                className="w-full h-14 bg-gray-900 text-white rounded-2xl font-bold flex items-center justify-center active:scale-95 transition-all shadow-xl shadow-gray-200"
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
       <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="flex flex-col items-center gap-4">
             <div className="w-12 h-12 rounded-full border-4 border-green-500 border-t-transparent animate-spin" />
             <span className="text-[10px] font-bold uppercase text-gray-300 tracking-[0.3em]">Loading...</span>
          </div>
       </div>
    }>
      <BrowseContent />
    </Suspense>
  )
}
