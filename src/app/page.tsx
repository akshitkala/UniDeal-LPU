'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { 
  ArrowRight, 
  Zap, 
  ChevronRight, 
  PackageCheck,
  AlertTriangle,
  Compass,
  PlusCircle,
  MessageCircle,
  TrendingUp,
  Clock
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ListingCard } from '@/components/listing/ListingCard'
import { CategorySlider } from '@/components/listing/CategorySlider'

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
        setError('Market synchronization failure. Retrying...')
      } finally {
        setLoading(false)
      }
    }
    fetchListings()
  }, [])

  return (
    <div className="flex flex-col gap-24 pb-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Hero Section: High-Impact */}
      <section className="relative rounded-[2.5rem] md:rounded-[4rem] overflow-hidden min-h-[500px] md:h-[700px] flex items-center shadow-2xl shadow-gray-200/50 group border border-gray-100">
        <div className="absolute inset-0 z-0">
          <Image 
            src="/hero-bg.png" 
            alt="Campus Marketplace" 
            fill
            priority
            className="object-cover scale-105 group-hover:scale-110 transition-transform duration-[20s] ease-linear"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-gray-950 via-gray-900/40 to-transparent" />
        </div>

        <div className="relative z-10 px-8 md:px-20 max-w-4xl text-left flex flex-col gap-8">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-xl px-4 py-1.5 rounded-full border border-white/20 self-start animate-in fade-in slide-in-from-left-4 duration-700">
            <Zap className="w-4 h-4 text-emerald-400 fill-emerald-400" />
            <span className="text-white text-[10px] font-black tracking-[0.2em] uppercase">Live Campus Directory</span>
          </div>
          
          <h1 className="text-5xl md:text-8xl font-black text-white leading-[0.9] tracking-tighter drop-shadow-2xl animate-in fade-in slide-in-from-left-4 duration-700 delay-100">
            Trade with <br /> <span className="text-emerald-400 drop-shadow-[0_0_30px_rgba(52,211,153,0.3)]">your campus.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-gray-300 max-w-lg leading-relaxed font-medium animate-in fade-in slide-in-from-left-4 duration-700 delay-200">
            The direct peer-to-peer marketplace for students. List your items and find local deals instantly.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 mt-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
            <Link 
              href="/browse" 
              className="h-16 px-10 bg-white text-gray-900 rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all hover:bg-gray-50 active:scale-95 shadow-xl shadow-black/10 group/btn"
            >
              Explore Feed <Compass className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            </Link>
            <Link 
              href="/post" 
              className="h-16 px-10 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-2xl shadow-emerald-600/30 transition-all active:scale-95 group/btn"
            >
              Start Selling <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      <CategorySlider />

      {/* Features: Value Signal */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { 
            icon: PlusCircle, 
            title: "Quick Post", 
            description: "List anything in under 60 seconds with simple campus-optimized fields.",
            color: "text-emerald-600",
            bg: "bg-emerald-50"
          },
          { 
            icon: Compass, 
            title: "Smart Discovery", 
            description: "Filter by category, price, and condition to find verified local assets.",
            color: "text-blue-600",
            bg: "bg-blue-50"
          },
          { 
            icon: MessageCircle, 
            title: "Direct Chat", 
            description: "Connect instantly via WhatsApp. No middlemen, no commissions.",
            color: "text-amber-600",
            bg: "bg-amber-50"
          }
        ].map((feature, i) => (
          <div key={i} className="group p-10 rounded-[2.5rem] bg-white border border-gray-100 hover:border-emerald-200 hover:shadow-2xl hover:shadow-emerald-500/5 transition-all duration-500">
             <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500 shadow-sm", feature.bg)}>
                <feature.icon className={cn("w-6 h-6", feature.color)} />
             </div>
             <h3 className="text-xl font-black text-gray-950 mb-3 tracking-tight">{feature.title}</h3>
             <p className="text-gray-500 font-medium leading-relaxed text-sm">
               {feature.description}
             </p>
          </div>
        ))}
      </section>

      {/* Fresh Directory: Main Grid */}
      <section className="flex flex-col gap-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="flex flex-col gap-2">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-gray-950 tracking-tighter leading-none flex items-center gap-4">
              Fresh Deals
              <span className="hidden md:flex relative h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            </h2>
            <p className="text-gray-500 font-medium text-lg leading-tight">Verified items from the LPU community.</p>
          </div>
          
          <div className="flex items-center gap-2 p-1.5 bg-gray-100 rounded-2xl self-start">
             <button className="flex items-center gap-2 px-6 py-2.5 bg-white text-gray-950 font-black text-[10px] uppercase tracking-widest rounded-xl shadow-sm border border-gray-200/50">
               <TrendingUp className="w-3.5 h-3.5 text-emerald-600" /> Newest
             </button>
             <button className="flex items-center gap-2 px-6 py-2.5 text-gray-400 font-black text-[10px] uppercase tracking-widest hover:text-gray-600 transition-colors">
               <Clock className="w-3.5 h-3.5" /> Ending Soon
             </button>
          </div>
        </div>

        {error && (
            <div className="p-8 bg-rose-50 text-rose-600 rounded-[2.5rem] font-bold border border-rose-100 flex items-center justify-center gap-3 animate-shake">
                <AlertTriangle className="w-6 h-6" /> {error}
            </div>
        )}
        
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="aspect-square bg-gray-50 rounded-[2rem] border border-gray-100 animate-pulse" />
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 bg-gray-50/50 rounded-[3rem] border-2 border-dashed border-gray-200 text-center">
            <PackageCheck className="w-16 h-16 text-gray-200 mb-6" />
            <h3 className="text-2xl font-black text-gray-900 mb-2">Feed is quiet today</h3>
            <p className="text-gray-500 font-medium mb-10 max-w-sm">Be the first to list an item this week!</p>
            <Link href="/post" className="h-14 px-10 bg-emerald-600 text-white rounded-2xl font-black hover:bg-emerald-700 transition active:scale-95 shadow-xl shadow-emerald-500/20">
              List Item Now
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-16">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
              {listings.map((l) => (
                <ListingCard key={l._id} listing={l} />
              ))}
            </div>

            <div className="flex justify-center mt-4">
              <Link 
                href="/browse" 
                className="group h-14 px-10 rounded-2xl border border-gray-200 hover:border-emerald-500 text-gray-600 hover:text-emerald-700 font-black text-xs uppercase tracking-[0.15em] transition-all flex items-center gap-3 active:scale-95 bg-white shadow-sm"
              >
                View all campus deals <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* Sell CTA: Action Oriented */}
      <section className="relative group">
        <div className="absolute inset-0 bg-emerald-600 rounded-[3rem] md:rounded-[4rem] rotate-1 group-hover:rotate-0 transition-transform duration-500" />
        <div className="relative bg-gray-950 rounded-[3rem] md:rounded-[4rem] px-8 py-20 md:py-32 text-center text-white overflow-hidden flex flex-col items-center gap-10 shadow-2xl border border-white/5">
            <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 blur-[100px] -mr-32 -mt-32 pointer-events-none" />
            
            <div className="flex flex-col gap-6 relative z-10">
                <div className="inline-flex items-center gap-2 bg-emerald-500/10 backdrop-blur-xl px-4 py-2 rounded-full border border-emerald-500/20 mx-auto">
                    <Zap className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400 text-[10px] font-black tracking-widest uppercase">Propulsion Enabled</span>
                </div>
                <h2 className="text-5xl md:text-8xl font-black tracking-tighter leading-none">
                    Sell to the <br /> <span className="text-emerald-400">community.</span>
                </h2>
                <p className="text-gray-400 text-lg md:text-2xl max-w-2xl mx-auto font-medium leading-relaxed px-4">
                    List in 60 seconds. Reach the entire campus network instantly. No middlemen, no commissions, just impact.
                </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 relative z-10 w-full justify-center px-4">
                <Link href="/post" className="w-full sm:w-auto h-20 px-16 bg-white text-gray-950 font-black text-xl rounded-[2rem] flex items-center justify-center gap-3 shadow-2xl shadow-emerald-500/20 transition-all hover:bg-emerald-50 active:scale-95 group/last">
                  Post Now <ArrowRight className="w-6 h-6 group-hover/last:translate-x-2 transition-transform" />
                </Link>
                <Link href="/browse" className="w-full sm:w-auto h-20 px-12 bg-white/5 hover:bg-white/10 text-white font-black text-xl rounded-[2rem] border border-white/10 flex items-center justify-center transition-all">
                  Browse Directory
                </Link>
            </div>
        </div>
      </section>

    </div>
  )
}
