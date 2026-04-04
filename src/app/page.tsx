'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { 
  ArrowRight, 
  ChevronRight, 
  PackageCheck,
  AlertTriangle,
  CheckCircle2,
  Zap
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
      
      {/* HERO SECTION */}
      <section className="w-full bg-white py-12 lg:py-16 overflow-hidden">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-6">
          <div className="grid lg:grid-cols-[45%_55%] gap-12 items-center">
            
            {/* Left Column */}
            <div className="flex flex-col items-start text-left max-w-2xl mx-auto lg:mx-0">
              
              <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-medium mb-6">
                <CheckCircle2 className="w-3.5 h-3.5" />
                University marketplace
              </div>
              
              <h1 className="text-3xl md:text-4xl xl:text-5xl font-bold text-gray-900 leading-tight tracking-tight mb-6">
                Buy and sell <br />
                on <span className="text-[#16a34a]">campus.</span>
              </h1>
              
              <p className="text-sm text-gray-700 leading-6 max-w-lg mb-8">
                List what you have. Find what you need. 
                The safest way to trade with your peers.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <Link 
                  href="/browse" 
                  className="h-10 lg:h-11 px-5 lg:px-6 bg-[#16a34a] hover:bg-green-700 text-white rounded-full font-semibold text-sm flex items-center justify-center transition-all"
                >
                  Browse listings
                </Link>
                <Link 
                  href="/post" 
                  className="h-10 lg:h-11 px-5 lg:px-6 border border-gray-200 bg-white text-gray-900 rounded-full font-semibold text-sm flex items-center justify-center transition-all hover:bg-gray-50"
                >
                  Start selling →
                </Link>
              </div>
            </div>

            {/* Right Column */}
            <div className="relative w-full aspect-square lg:aspect-video">
              <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-md border border-gray-100">
                <Image 
                  src="/images/hero/hero.webp" 
                  alt="Students on campus" 
                  fill
                  className="object-cover"
                  priority
                />
              </div>
              {stats && (
                <div className="absolute -bottom-4 -left-4 bg-white p-4 rounded-xl shadow-md border border-gray-100 flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center text-white">
                    <Zap className="w-5 h-5 fill-current" />
                  </div>
                  <div className="pr-4">
                    <span className="text-sm font-bold text-gray-900 block">Active deals</span>
                    <span className="text-xs text-gray-400 font-medium">
                      {stats.activeListings}+ items available
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* LISTINGS SECTION */}
      <section className="bg-white py-10 lg:py-16">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-6">
          
          <div className="flex justify-between items-end mb-8">
            <div>
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest block mb-1">Latest Listings</span>
              <h2 className="text-base lg:text-lg font-semibold text-gray-900">Fresh on campus</h2>
            </div>
            <Link 
              href="/browse" 
              className="text-sm font-semibold text-[#16a34a] hover:text-green-700 flex items-center gap-1 transition-colors"
            >
              View all <ChevronRight className="w-4 h-4" />
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

      {/* WHY SECTION */}
      <section className="bg-white py-10 lg:py-16">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-6">
          <div className="text-center mb-10">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest block mb-1">
              Why UniDeal
            </span>
            <h2 className="text-base lg:text-lg font-semibold text-gray-900 leading-tight">
              A better way to trade on campus
            </h2>
            <p className="text-sm text-gray-500 mt-2 max-w-xl mx-auto">
              UniDeal is built to solve the mess of WhatsApp groups and fragmented campus deals.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                icon: "📉",
                title: "Listings stay clear",
                body: "Structured listings mean your items never get buried in a sea of chat messages."
              },
              {
                icon: "🔍",
                title: "Search & Filter",
                body: "Find exactly what you need with price, category, and condition filters."
              },
              {
                icon: "🛡️",
                title: "Verified Students",
                body: "Trade safely with peers from your own university community."
              }
            ].map((card, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-6 border-l-2 border-[#16a34a] h-full flex flex-col">
                <span className="text-2xl mb-3 select-none">{card.icon}</span>
                <h3 className="text-sm font-semibold text-gray-900">{card.title}</h3>
                <p className="text-xs text-gray-500 mt-2 leading-relaxed">{card.body}</p>
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
      <section id="how-it-works" className="bg-gray-50 py-10 lg:py-16 border-y border-gray-100">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-6">
          
          <div className="text-center mb-10">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest block mb-1">Simple steps</span>
            <h2 className="text-base lg:text-lg font-semibold text-gray-900">How it works</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { 
                num: "01", 
                icon: "📸", 
                title: "Post your item", 
                body: "Add photos and a price to go live in seconds." 
              },
              { 
                num: "02", 
                icon: "🔍", 
                title: "Buyers find you", 
                body: "Local students discover your listing instantly in the feed." 
              },
              { 
                num: "03", 
                icon: "💬", 
                title: "Meet on campus", 
                body: "Connect on WhatsApp to finalize the deal safely." 
              }
            ].map((step, i) => (
              <div key={i} className="bg-white rounded-xl p-8 border border-gray-100 shadow-sm">
                <div className="text-green-600 text-xs font-bold mb-4">{step.num}</div>
                <div className="text-3xl mb-4">{step.icon}</div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SELL CTA */}
      <section className="bg-white py-10 lg:py-16">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-6">
          <div className="bg-[#16a34a] rounded-2xl p-10 lg:p-16 text-center text-white">
            <h2 className="text-2xl lg:text-3xl font-bold mb-4">
              Turn your clutter into cash
            </h2>
            <p className="text-sm opacity-90 max-w-xl mx-auto mb-8">
              The fastest way to sell on campus. Join thousands of students buying and selling locally.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/post" className="h-10 lg:h-11 px-6 bg-white text-[#16a34a] font-semibold text-sm rounded-full flex items-center justify-center transition-all hover:bg-gray-50">
                Post an item
              </Link>
              <Link href="/browse" className="h-10 lg:h-11 px-6 bg-green-700 text-white font-semibold text-sm rounded-full flex items-center justify-center transition-all hover:bg-green-800">
                Browse feed
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
