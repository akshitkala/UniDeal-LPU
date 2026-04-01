'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { 
  ArrowRight, 
  Zap, 
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

  useEffect(() => {
    async function fetchListings() {
      try {
        const res = await fetch('/api/listings?limit=12')
        if (!res.ok) throw new Error('Failed to load listings')
        const data = await res.json()
        setListings(data.listings)
      } catch (err) {
        setError('Neural Link Failure: Unable to fetch recent deals.')
      } finally {
        setLoading(false)
      }
    }
    fetchListings()
  }, [])

  return (
    <div className="flex flex-col gap-24 pb-20">
      
      {/* Hero: Minimal & Direct */}
      <section className="relative rounded-[3rem] overflow-hidden min-h-[600px] flex items-center shadow-premium-dark border border-white/10 group">
        <div className="absolute inset-0 z-0">
          <img 
            src="/hero-bg.png" 
            alt="Campus Life" 
            className="w-full h-full object-cover scale-105 group-hover:scale-110 transition-transform duration-[20s] ease-linear"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0F172A] via-[#0F172A]/80 to-transparent" />
        </div>

        <div className="relative z-10 px-8 md:px-24 max-w-4xl text-left flex flex-col gap-8">
          <h1 className="text-5xl md:text-8xl font-black text-white leading-[0.9] tracking-tighter drop-shadow-2xl">
            Buy and sell <br /> <span className="text-emerald-400">on campus.</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-slate-300 max-w-xl leading-relaxed font-medium">
            List what you have. Find what you need.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 max-w-2xl mt-4">
            <Link 
              href="/browse" 
              className="h-20 bg-white text-gray-900 px-10 rounded-[2rem] font-black text-lg flex items-center justify-center gap-3 transition-all active:scale-95 group/btn"
            >
              Browse listings
            </Link>
            <Link 
              href="/post" 
              className="h-20 bg-emerald-600 hover:bg-emerald-500 text-white px-10 rounded-[2rem] font-black text-lg flex items-center justify-center gap-3 shadow-2xl shadow-emerald-600/30 transition-all active:scale-95 group/btn"
            >
              Sell something <ArrowRight className="w-6 h-6 group-hover/btn:translate-x-2 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works: Minimal Flow */}
      <section id="how-it-works" className="grid grid-cols-1 md:grid-cols-3 gap-10 px-4 scroll-mt-24">
        {[
          { 
            step: "1", 
            title: "Post your item", 
            desc: "Add photos, set a price, and go live in under a minute.",
            color: "text-blue-500", 
            bg: "bg-blue-50/50" 
          },
          { 
            step: "2", 
            title: "Buyer finds you", 
            desc: "They browse, search, and filter to find exactly what they need.",
            color: "text-emerald-500", 
            bg: "bg-emerald-50/50" 
          },
          { 
            step: "3", 
            title: "Connect on WhatsApp", 
            desc: "They tap Contact Seller and the conversation starts.",
            color: "text-rose-500", 
            bg: "bg-rose-50/50" 
          }
        ].map((feat, i) => (
          <div key={i} className={cn("group p-10 rounded-[3rem] border border-transparent hover:border-gray-100 hover:bg-white hover:shadow-premium transition-all duration-500 flex flex-col gap-6", feat.bg)}>
            <div className="w-16 h-16 bg-white rounded-[2rem] flex items-center justify-center shadow-xl-soft group-hover:scale-110 transition-transform duration-500">
               <span className={cn("text-2xl font-black", feat.color)}>{feat.step}</span>
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="text-2xl font-black text-gray-900 tracking-tight uppercase">{feat.title}</h3>
              <p className="text-gray-500 font-medium leading-relaxed">{feat.desc}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Fresh Feed: Real-time Assets */}
      <section className="px-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
          <div className="flex flex-col gap-2">
            <h2 className="text-5xl font-black text-gray-900 tracking-tighter leading-[0.9]">Live Directory</h2>
            <p className="text-gray-500 font-medium text-lg">Fresh assets arriving in real-time from across campus.</p>
          </div>
          <div className="flex p-1.5 bg-gray-100/50 rounded-[1.5rem] backdrop-blur-sm self-start">
             <button className="px-8 py-3 bg-white text-gray-900 font-black rounded-2xl shadow-sm text-xs uppercase tracking-widest">Newest</button>
             <button className="px-8 py-3 text-gray-400 font-black text-xs uppercase tracking-widest hover:text-gray-900 transition-colors">Trending</button>
          </div>
        </div>

        {error && (
            <div className="p-8 bg-rose-50 text-rose-600 rounded-[2.5rem] font-black border border-rose-100 flex items-center justify-center gap-3">
                <AlertTriangle className="w-6 h-6" /> {error}
            </div>
        )}
        
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-10">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-[320px] bg-gray-50 rounded-[2rem] border border-gray-100 animate-pulse" />
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-40 bg-gray-50/50 rounded-[4rem] border-2 border-dashed border-gray-200 text-center">
            <div className="w-24 h-24 bg-white rounded-[2.5rem] flex items-center justify-center shadow-xl-soft mb-8">
                <PackageCheck className="w-12 h-12 text-gray-200" />
            </div>
            <h3 className="text-3xl font-black mb-4 text-gray-900 tracking-tighter uppercase">Market Offline</h3>
            <p className="text-gray-400 font-medium mb-12 max-w-sm mx-auto">Be the pioneer of this semester. List the first item and kickstart the economy.</p>
            <Link href="/post" className="h-16 px-12 bg-[#2D9A54] text-white rounded-2xl font-black text-lg hover:bg-[#258246] transition shadow-2xl active:scale-95">
              Launch Marketplace
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-16">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-10">
              {listings.map((l) => (
                <ListingCard 
                  key={l._id} 
                  listing={l} 
                />
              ))}
            </div>

            {/* View More Link */}
            <div className="flex justify-center">
              <Link 
                href="/browse" 
                className="group h-14 px-10 rounded-2xl border border-gray-200 hover:border-[#2D9A54] text-gray-700 hover:text-[#2D9A54] font-black text-sm uppercase tracking-widest transition-all flex items-center gap-3 active:scale-95"
              >
                View more listings <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* Hero 2: The Final Objective */}
      <section className="relative px-4">
        <div className="bg-gray-900 rounded-[4rem] px-8 py-24 text-center text-white relative overflow-hidden flex flex-col items-center gap-10">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500/10 blur-[120px] -mr-64 -mt-64 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-500/5 blur-[120px] -ml-64 -mb-64 pointer-events-none" />
            
            <div className="flex flex-col gap-4 relative z-10">
                <div className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-xl px-4 py-2 rounded-full border border-white/10 mx-auto">
                    <Zap className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-100 text-[10px] font-black tracking-widest uppercase">Propulsion Target</span>
                </div>
                <h2 className="text-5xl md:text-8xl font-black tracking-tighter leading-none mb-4">
                    Clear the <span className="text-emerald-400">Inventory.</span>
                </h2>
                <p className="text-slate-400 text-lg md:text-2xl max-w-2xl mx-auto font-medium leading-relaxed">
                    List your items in under 60 seconds. Reach the entire campus network instantly. Direct peer-to-peer impact.
                </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-6 relative z-10">
                <Link href="/post" className="h-20 px-16 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xl rounded-[2rem] flex items-center justify-center gap-3 shadow-2xl shadow-emerald-500/20 transition-all active:scale-95 group/last">
                  Initialize Sale <ArrowRight className="w-6 h-6 group-hover/last:translate-x-2 transition-transform" />
                </Link>
                <Link href="/browse" className="h-20 px-12 bg-white/5 hover:bg-white/10 text-white font-black text-xl rounded-[2rem] border border-white/10 flex items-center justify-center transition-all">
                  Browse Directory
                </Link>
            </div>
        </div>
      </section>

    </div>
  )
}
