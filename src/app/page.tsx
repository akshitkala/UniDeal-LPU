'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

// Types
interface Category {
  _id: string
  name: string
  slug: string
  icon: string
}

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
  category: Category
  seller: { displayName: string, photoURL?: string }
}

export default function Home() {
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchListings() {
      try {
        const res = await fetch('/api/listings?limit=12')
        if (!res.ok) throw new Error('Failed to load listings')
        const data = await res.json()
        setListings(data.listings)
      } catch (err) {
        setError('Unable to fetch recent deals. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    fetchListings()
  }, [])

  return (
    <div className="flex flex-col gap-10">
      
      {/* Hero Section */}
      <section className="bg-[#2D9A54] text-white rounded-2xl p-8 md:p-14 flex flex-col items-center justify-center text-center shadow-md relative overflow-hidden">
        {/* Abstract pattern to make it premium without gradients */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white opacity-5 rounded-full" />
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-64 h-64 bg-white opacity-5 rounded-full" />
        
        <h1 className="text-3xl md:text-5xl font-bold mb-4 z-10">
          The Trusted Marketplace for LPU Students
        </h1>
        <p className="text-lg md:text-xl font-medium opacity-90 mb-8 max-w-2xl z-10">
          Buy, sell, and trade textbooks, electronics, and dorm essentials securely on campus. No outsiders, full transparency.
        </p>
        <Link 
          href="/post" 
          className="bg-white text-[#2D9A54] px-8 py-3 rounded-full font-bold text-lg hover:bg-gray-100 transition shadow-lg z-10 focus:ring-4 focus:ring-white/30"
        >
          Start Selling Today
        </Link>
      </section>

      {/* Quick Categories Layout */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-[#1A1A1A]">Browse by Category</h2>
          <Link href="/categories" className="text-[#2D9A54] font-medium hover:underline text-sm flex items-center gap-1">
            See all
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { name: 'Electronics', slug: 'electronics', emoji: '💻' },
            { name: 'Books & Notes', slug: 'books-notes', emoji: '📚' },
            { name: 'Vehicles', slug: 'vehicles', emoji: '🚴' },
            { name: 'Fashion', slug: 'fashion', emoji: '👕' },
            { name: 'Hobbies', slug: 'hobbies', emoji: '🎸' },
            { name: 'Dorm Setup', slug: 'dorm-setup', emoji: '🏠' }
          ].map((cat, i) => (
            <Link 
              key={i} 
              href={`/browse?category=${cat.slug}&name=${encodeURIComponent(cat.name)}`}
              className="bg-[#F9F9F9] border border-[#E5E5E5] hover:border-[#2D9A54] hover:shadow-sm flex flex-col items-center justify-center p-6 rounded-xl cursor-pointer transition-all active:scale-95 group"
            >
              <span className="text-3xl mb-3 group-hover:scale-110 transition-transform">{cat.emoji}</span>
              <span className="font-semibold text-[#1A1A1A] text-sm text-center">{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Feed Layout */}
      <section>
        <div className="flex items-center justify-between mb-6 border-b border-[#E5E5E5] pb-4">
          <h2 className="text-2xl font-bold text-[#1A1A1A]">Fresh Campus Deals</h2>
          <div className="flex gap-2">
            <button className="text-sm font-medium px-4 py-2 bg-gray-100 rounded-full hover:bg-gray-200">Newest</button>
            <button className="text-sm font-medium px-4 py-2 text-gray-500 hover:text-[#1A1A1A]">Popular</button>
          </div>
        </div>

        {error && <div className="p-4 bg-red-50 text-red-600 rounded-lg">{error}</div>}
        
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:grid-cols-3 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-[280px] bg-[#F9F9F9] rounded-xl border border-[#E5E5E5] animate-pulse"></div>
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <h3 className="text-xl font-bold mb-2">No listings found</h3>
            <p>Be the first to list an item today!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {listings.map((l) => (
              <Link href={`/listing/${l.slug}`} key={l._id} className="group bg-white border border-[#E5E5E5] hover:border-[#2D9A54] hover:shadow-lg transition-all rounded-xl overflow-hidden flex flex-col h-[280px]">
                {/* Image Section (180px) */}
                <div className="relative h-[180px] w-full bg-gray-100 overflow-hidden">
                  <span className="absolute top-2 left-2 z-10 font-bold bg-[#2D9A54] text-white text-[11px] px-2 py-1 rounded-full shadow">
                    {l.category?.name || 'Item'}
                  </span>
                  <span className="absolute top-2 right-2 z-10 font-medium bg-white/90 text-gray-700 text-[11px] px-2 py-1 rounded-full shadow border border-gray-100">
                    {l.condition}
                  </span>
                  
                  {l.images && l.images.length > 0 ? (
                    <img 
                      src={l.images[0]} 
                      alt={l.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      No Image
                    </div>
                  )}
                </div>

                {/* Info Section (100px) */}
                <div className="p-3 flex flex-col justify-between flex-1">
                  <div>
                    <h3 className="text-[14px] leading-tight font-semibold text-[#1A1A1A] line-clamp-2 mb-1 group-hover:text-[#2D9A54] transition-colors">{l.title}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-[16px] font-bold text-[#2D9A54]">₹{l.price.toLocaleString('en-IN')}</span>
                      {l.negotiable && <span className="text-[11px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200">Negotiable</span>}
                    </div>
                  </div>
                  <div className="text-[12px] text-[#666666] flex justify-between items-center mt-2">
                    <span className="font-medium truncate max-w-[120px]">{l.seller?.displayName || 'User'}</span>
                    <span>{formatDistanceToNow(new Date(l.bumpedAt || l.createdAt), { addSuffix: true })}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
