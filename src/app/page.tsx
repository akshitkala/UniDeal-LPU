'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { 
  ArrowRight, 
  ChevronRight, 
  PackageCheck,
  AlertTriangle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ListingCard } from '@/components/listing/ListingCard'

// Types
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

export default function Home() {
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [stats, setStats] = useState<{ activeListings: number, totalUsers: number, totalCategories: number } | null>(null)
  const [loadingStats, setLoadingStats] = useState(true)

  useEffect(() => {
    async function fetchListings() {
      try {
        const res = await fetch('/api/listings?limit=12')
        if (!res.ok) throw new Error('Failed to load listings')
        const data = await res.json()
        setListings(data.listings)
      } catch (err) {
        setError('Connection error. Please refresh the page.')
      } finally {
        setLoading(false)
      }
    }

    async function fetchStats() {
      try {
        const res = await fetch('/api/stats')
        if (res.ok) {
          const data = await res.json()
          setStats(data)
        }
      } catch (err) {
        console.error('Failed to load stats')
      } finally {
        setLoadingStats(false)
      }
    }

    fetchListings()
    fetchStats()
  }, [])

  return (
    <div className="flex flex-col">
      
      {/* HERO SECTION: Redesigned (Fix: Simple & Clean) */}
      <section className="w-full bg-[#f0f6f0] pt-20 pb-16 sm:pt-28 sm:pb-20 lg:pt-32 lg:pb-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 bg-white rounded-full px-4 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 shadow-sm mb-8 mx-auto animate-in fade-in slide-in-from-bottom-2 duration-500">
            <span className="w-2 h-2 bg-[#16a34a] rounded-full" />
            Campus Marketplace
          </div>
          
          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight tracking-tight mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            Buy and sell on campus.
          </h1>
          
          {/* Context Subheadline */}
          <p className="text-base sm:text-lg text-gray-500 leading-relaxed max-w-xl mx-auto mb-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
            List what you have. Find what you need. <br className="hidden sm:block" />
            Connect directly on WhatsApp.
          </p>
          
          {/* Main CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <Link 
              href="/browse" 
              className="bg-[#16a34a] text-white rounded-full h-12 px-8 font-semibold text-sm flex items-center justify-center hover:bg-green-700 transition-all active:scale-95"
            >
              Browse listings
            </Link>
            <Link 
              href="/post" 
              className="bg-white text-gray-900 border border-gray-200 rounded-full h-12 px-8 font-semibold text-sm flex items-center justify-center hover:bg-gray-50 transition-all active:scale-95"
            >
              Start selling →
            </Link>
          </div>

          {/* Real-time Stats Row (Fix: Fetches dynamic data) */}
          {(loadingStats || stats) && (
            <div className="pt-10 border-t border-gray-200/60 flex flex-wrap items-center justify-center gap-8 sm:gap-12 animate-in fade-in duration-1000 delay-300">
              {/* Stat 1: Listings */}
              <div className="flex flex-col flex-1 sm:flex-none min-w-[100px]">
                {loadingStats ? (
                  <div className="w-16 h-6 bg-gray-200 animate-pulse rounded mx-auto" />
                ) : (
                  <span className="text-2xl font-bold text-gray-900">{stats?.activeListings} listings</span>
                )}
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Market Activity</span>
              </div>

              <div className="hidden sm:block h-8 w-px bg-gray-200" />

              {/* Stat 2: Students */}
              <div className="flex flex-col flex-1 sm:flex-none min-w-[100px]">
                {loadingStats ? (
                  <div className="w-16 h-6 bg-gray-200 animate-pulse rounded mx-auto" />
                ) : (
                  <span className="text-2xl font-bold text-gray-900">{stats?.totalUsers} students</span>
                )}
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Verified Users</span>
              </div>

              <div className="hidden sm:block h-8 w-px bg-gray-200" />

              {/* Stat 3: Pricing */}
              <div className="flex flex-col flex-1 sm:flex-none min-w-[100px]">
                <span className="text-2xl font-bold text-gray-900">Free</span>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Always</span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* WHY UNIDEAL: PROBLEM SECTION */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-xs font-semibold text-[#16a34a] uppercase tracking-widest text-center mb-3 block">
              WHY UNIDEAL
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-gray-900 text-center leading-tight">
              WhatsApp groups weren't built for this.
            </h2>
            <p className="text-base text-gray-400 text-center mt-3 max-w-xl mx-auto leading-relaxed">
              Every semester, thousands of students buy and sell on campus through 
              WhatsApp groups. It works — until it doesn't.
            </p>
          </div>

          {/* Problems Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-12">
            {[
              {
                icon: "📉",
                title: "Listings get buried",
                body: "A new message every minute pushes your listing out of sight within hours. Buyers never find it."
              },
              {
                icon: "🔍",
                title: "No search. No filters.",
                body: "No way to filter by price, category, or condition. Finding a specific item means scrolling through hundreds of messages."
              },
              {
                icon: "😶",
                title: "No trust signal",
                body: "You have no idea who you're buying from. No profile, no history, no way to tell a genuine seller from a fake one."
              }
            ].map((card, i) => (
              <div key={i} className="bg-gray-50 rounded-2xl p-8 border-l-4 border-[#16a34a] pl-6 h-full flex flex-col">
                <span className="text-3xl mb-4 select-none">{card.icon}</span>
                <h3 className="text-base font-bold text-gray-900">{card.title}</h3>
                <p className="text-sm text-gray-500 mt-2 leading-relaxed">{card.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-lg font-semibold text-gray-900">
              UniDeal fixes all of this.
            </p>
            <div className="w-12 h-1 bg-[#16a34a] rounded-full mx-auto mt-2" />
          </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section id="how-it-works" className="bg-gray-50 py-24 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center mb-16">
            <span className="text-xs font-bold text-[#16a34a] uppercase tracking-[0.2em]">How it works</span>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mt-3 tracking-tight">Simple. Fast. Done.</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { 
                num: "01", 
                icon: "📸", 
                title: "Post your item", 
                body: "Add photos, set a price, and go live in seconds directly from your phone." 
              },
              { 
                num: "02", 
                icon: "🔍", 
                title: "Buyer finds you", 
                body: "Local students browse the directory and discover your listing instantly." 
              },
              { 
                num: "03", 
                icon: "💬", 
                title: "Connect on WhatsApp", 
                body: "Tap Contact Seller. Chat directly to finalize details and meeting place." 
              }
            ].map((step, i) => (
              <div key={i} className="group relative bg-white rounded-3xl p-10 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300">
                <span className="absolute top-6 right-8 text-7xl font-black text-gray-50 pointer-events-none group-hover:text-green-50/50 transition-colors">
                  {step.num}
                </span>
                <div className="text-4xl mb-6 relative z-10">{step.icon}</div>
                <h3 className="text-xl font-black text-gray-900 mb-3 relative z-10">{step.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed relative z-10">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LISTINGS SECTION */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-6 sm:px-6 lg:px-8">
          
          <div className="flex justify-between items-end mb-10">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold text-[#16a34a] uppercase tracking-[0.2em]">Latest Listings</span>
              <h2 className="text-3xl font-black text-gray-900 tracking-tight leading-none">Fresh on campus</h2>
            </div>
            <Link 
              href="/browse" 
              className="group flex items-center gap-1.5 text-sm font-bold text-[#16a34a] hover:text-green-700 transition-all border-b-2 border-transparent hover:border-[#16a34a] pb-1"
            >
              View all <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {error && (
            <div className="p-10 bg-red-50 text-red-600 rounded-3xl border border-red-100 flex items-center justify-center gap-3">
              <AlertTriangle className="w-6 h-6" /> {error}
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-8">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="aspect-[4/5] bg-gray-50 rounded-2xl border border-gray-100 animate-pulse" />
              ))}
            </div>
          ) : listings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
              <PackageCheck className="w-16 h-16 text-gray-200 mb-4" />
              <h3 className="text-xl font-bold text-gray-900">No active deals right now</h3>
              <p className="text-gray-500 text-sm mt-1 mb-8">Be the first to list an item today!</p>
              <Link href="/post" className="h-12 px-8 bg-[#16a34a] text-white rounded-full font-bold shadow-lg shadow-green-600/10 active:scale-95 transition-all">
                Post Item
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-8">
              {listings.map((listing, index) => (
                <ListingCard key={listing._id} listing={listing} priority={index < 4} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Sell CTA Section */}
      <section className="bg-white py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#16a34a] rounded-[3rem] px-8 py-16 lg:py-24 text-center text-white relative overflow-hidden group">
            <div className="absolute inset-0 bg-green-700 opacity-0 group-hover:opacity-10 transition-opacity" />
            <div className="relative z-10">
              <h2 className="text-3xl lg:text-6xl font-black tracking-tight mb-6">
                Turn your clutter <br className="sm:hidden" /> into cash.
              </h2>
              <p className="text-lg opacity-90 max-w-2xl mx-auto mb-10 font-medium">
                The fastest way to sell on campus. Join 2,000+ students already buying and selling locally.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/post" className="w-full sm:w-auto h-16 px-12 bg-white text-[#16a34a] font-bold text-lg rounded-full flex items-center justify-center transition-all hover:bg-gray-50 active:scale-95 shadow-xl shadow-green-900/20">
                  Post My Item Sekarang
                </Link>
                <Link href="/browse" className="w-full sm:w-auto h-16 px-10 bg-green-700/50 hover:bg-green-700 text-white font-bold text-lg rounded-full flex items-center justify-center transition-all">
                  Browse Feed
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
