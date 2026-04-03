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
      
      {/* HIGH-FIDELITY HERO SECTION */}
      <section className="w-full bg-white pt-12 pb-20 lg:pt-20 lg:pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 items-center">
            
            {/* Left Column: Premium Typography & CTAs */}
            <div className="flex flex-col items-start text-left max-w-2xl mx-auto lg:mx-0">
              
              {/* Trust Badge */}
              <div className="inline-flex items-center gap-2 bg-[#dcfce7] text-[#166534] px-4 py-2 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Exclusively for university students
              </div>
              
              {/* Dynamic Headline */}
              <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black text-gray-900 leading-[0.95] tracking-tight mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                Buy and sell <br />
                on <span className="text-[#16a34a] italic">campus.</span>
              </h1>
              
              {/* Social Proof Subheadline */}
              <p className="text-lg sm:text-xl text-gray-500 leading-relaxed max-w-lg mb-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
                List what you have. Find what you need. Connect directly on WhatsApp. 
                The safest way to trade with your peers.
              </p>
              
              {/* High-Fidelity CTAs */}
              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
                <Link 
                  href="/browse" 
                  className="bg-[#064e3b] hover:bg-emerald-900 text-white rounded-2xl h-16 px-10 font-bold text-lg flex items-center justify-center transition-all shadow-xl shadow-emerald-900/10 active:scale-95 whitespace-nowrap"
                >
                  Browse listings
                </Link>
                <Link 
                  href="/post" 
                  className="bg-white hover:bg-gray-50 text-[#064e3b] border border-gray-100 rounded-2xl h-16 px-10 font-bold text-lg flex items-center justify-center transition-all shadow-sm active:scale-95 whitespace-nowrap"
                >
                  Start selling
                </Link>
              </div>
            </div>

            {/* Right Column: Premium Visual & Stats */}
            <div className="relative w-full aspect-square sm:aspect-video lg:aspect-[4/5] animate-in fade-in slide-in-from-right-8 duration-1000">
              
              {/* Main Rounded Image */}
              <div className="relative w-full h-full rounded-[3rem] overflow-hidden shadow-[0_32px_64px_-12px_rgba(0,0,0,0.1)] border-8 border-white">
                <Image 
                  src="/images/hero/students.png" 
                  alt="Students on campus" 
                  fill
                  className="object-cover"
                  priority
                />
                
                {/* Visual Overlay for Depth */}
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/20 to-transparent pointer-events-none" />
              </div>

              {/* Floating Real-time Stats Card */}
              {stats && (
                <div className="absolute -bottom-6 -left-6 lg:-left-12 bg-white p-5 sm:p-6 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.12)] flex items-center gap-4 sm:gap-5 border border-gray-50/50 animate-in fade-in zoom-in-95 duration-700 delay-500">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-[#22c55e] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-green-500/30">
                    <Zap className="w-6 h-6 sm:w-7 sm:h-7 fill-current" />
                  </div>
                  <div className="flex flex-col pr-4 sm:pr-8">
                    <span className="text-gray-900 font-bold text-sm sm:text-base leading-tight">Fresh deals daily</span>
                    <span className="text-gray-400 font-medium text-[10px] sm:text-xs">
                      {stats.activeListings}+ items available now
                    </span>
                  </div>
                </div>
              )}

              {/* Decorative Background Glow */}
              <div className="absolute -top-12 -right-12 w-64 h-64 bg-green-100 rounded-full blur-[100px] -z-10 opacity-60" />
            </div>

          </div>
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
