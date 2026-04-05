'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { 
  Calendar, 
  Package, 
  ShieldCheck, 
  Mail, 
  Loader2, 
  ArrowLeft, 
  CheckCircle2, 
  Clock, 
  ExternalLink, 
  Share2,
  BadgeCheck,
  Zap,
  Info
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'
import { Avatar } from '@/components/ui/Avatar'

interface PublicProfileData {
  seller: {
    _id: string
    displayName: string
    photoURL: string
    bio: string
    createdAt: Date
    isLpuVerified: boolean
  }
  listings: any[]
}

export default function PublicProfilePage() {
  const params = useParams()
  const [data, setData] = useState<PublicProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/users/${params.uid}/public`)
        if (!res.ok) throw new Error('User Not Found')
        const result = await res.json()
        setData(result)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [params.uid])

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 gap-4">
        <Loader2 className="w-12 h-12 text-[#2D9A54] animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Loading Profile</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 gap-6 text-center">
        <div className="w-20 h-20 bg-rose-50 rounded-[2.5rem] flex items-center justify-center border border-rose-100">
            <Info className="w-10 h-10 text-rose-500" />
        </div>
        <h1 className="text-4xl font-black text-gray-900 tracking-tight">User Not Found</h1>
        <p className="text-gray-500 max-w-sm">The requested profile is either unavailable or has been removed from the marketplace.</p>
        <Link href="/" className="h-14 px-8 bg-gray-900 text-white rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-gray-800 transition-all active:scale-95">
           <ArrowLeft className="w-5 h-5" /> Back to Home
        </Link>
      </div>
    )
  }

  const { seller, listings } = data

  return (
    <div className="max-w-6xl mx-auto py-12 px-6 flex flex-col gap-12 min-h-screen mb-24">
      
      {/* Navigation */}
      <nav className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 text-gray-400 hover:text-gray-900 transition-all font-black text-xs uppercase tracking-widest group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Marketplace
          </Link>
          <button className="p-3 bg-gray-50 rounded-2xl text-gray-400 hover:text-gray-900 transition-all">
             <Share2 className="w-5 h-5" />
          </button>
      </nav>

      {/* Hero Profile Card */}
      <div className="relative bg-white border border-gray-100 rounded-[3rem] p-8 md:p-16 shadow-premium overflow-hidden">
        {/* Glow Decos */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 blur-[120px] -mr-64 -mt-64 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/5 blur-[100px] -ml-40 -mb-40 pointer-events-none" />

        <div className="relative flex flex-col md:flex-row gap-12 items-center md:items-start">
            {/* Avatar Cluster */}
            <div className="relative flex-shrink-0 group">
                <div className="absolute inset-0 bg-emerald-500/20 blur-2xl group-hover:blur-3xl transition-all opacity-0 group-hover:opacity-100 duration-700" />
                <div className="relative w-40 h-40 md:w-56 md:h-56 rounded-[4rem] overflow-hidden border-8 border-white shadow-2xl-soft ring-1 ring-gray-100">
                    <Avatar 
                        src={seller.photoURL} 
                        name={seller.displayName}
                        size="xl"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                </div>
            </div>

            {/* Seller Intel */}
            <div className="flex flex-col flex-1 text-center md:text-left gap-6">
                <div className="flex flex-col gap-2">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <h1 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tighter leading-none">
                            {seller.displayName}
                        </h1>
                    </div>
                </div>

                <div className="bg-gray-50/50 backdrop-blur-sm border border-gray-100 p-6 md:p-8 rounded-[2.5rem] relative">
                    <p className="text-gray-600 text-lg md:text-xl font-medium leading-relaxed italic">
                        "{seller.bio || 'Campus community member.'}"
                    </p>
                </div>

                <div className="flex flex-wrap justify-center md:justify-start gap-8 mt-4">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Joined</span>
                        <div className="flex items-center gap-2 font-black text-gray-800">
                            <Clock className="w-4 h-4 text-emerald-500" /> {formatDistanceToNow(new Date(seller.createdAt))} ago
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Active Listings</span>
                        <div className="flex items-center gap-2 font-black text-gray-800">
                            <Package className="w-4 h-4 text-emerald-500" /> {listings.length}
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Community</span>
                        <div className="flex items-center gap-2 font-black text-emerald-600">
                            <Zap className="w-4 h-4" /> Member
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* Product Matrix */}
      <div className="flex flex-col gap-8">
        <div className="flex items-end justify-between border-b border-gray-100 pb-8 px-2">
            <h2 className="text-4xl font-black text-gray-900 tracking-tighter">Current Inventory</h2>
            <div className="px-4 py-2 bg-gray-900 text-white rounded-full text-[10px] font-black uppercase tracking-widest">
                Items: {listings.length}
            </div>
        </div>

        {listings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 bg-gray-50/50 rounded-[3rem] border-2 border-dashed border-gray-200 text-center">
             <Package className="w-16 h-16 text-gray-200 mb-4" />
             <h3 className="text-xl font-black text-gray-400">Inventory Status: Empty</h3>
             <p className="text-gray-400 text-sm mt-1">This seller is currently out of stock.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
             {listings.map(l => (
                <Link 
                   key={l._id} 
                   href={`/listing/${l.slug}`}
                   className="group block"
                >
                  <div className="relative bg-white border border-gray-100 rounded-[2.5rem] overflow-hidden p-3 shadow-sm hover:shadow-2xl hover:border-emerald-100 transition-all duration-500 hover:-translate-y-2">
                    <div className="aspect-[4/5] relative rounded-[2rem] overflow-hidden bg-gray-100 ring-1 ring-gray-100">
                        <Image 
                        src={l.images?.[0] || '/placeholder-listing.png'} 
                        fill 
                        alt={l.title}
                        className="object-cover group-hover:scale-110 transition-transform duration-700"
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        />
                        {/* Status Overlay */}
                        <div className="absolute top-4 left-4">
                            <span className={cn(
                                "px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-full border shadow-sm backdrop-blur-md",
                                l.condition === 'new' ? "bg-emerald-500/90 text-white border-emerald-400" : "bg-white/90 text-gray-900 border-gray-100"
                            )}>
                                {l.condition}
                            </span>
                        </div>
                    </div>
                    
                    <div className="p-5 flex flex-col gap-2">
                        <h3 className="font-black text-gray-900 text-xl tracking-tight line-clamp-1 group-hover:text-emerald-600 transition-colors uppercase">
                            {l.title}
                        </h3>
                        <div className="flex items-center justify-between">
                            <div className="text-2xl font-black text-[#2D9A54] leading-none">₹{l.price.toLocaleString('en-IN')}</div>
                            <div className="w-10 h-10 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                                <ExternalLink className="w-4 h-4" />
                            </div>
                        </div>
                    </div>
                  </div>
                </Link>
             ))}
          </div>
        )}
      </div>

    </div>
  )
}
