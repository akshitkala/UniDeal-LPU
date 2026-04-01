'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Calendar, Package, ShieldCheck, Mail, Loader2, ArrowLeft } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

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

/**
 * S-09 Public Profile (Fix 16).
 * Features: seller info, identity badge, and approved listing grid.
 */
export default function PublicProfilePage() {
  const params = useParams()
  const [data, setData] = useState<PublicProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/users/${params.uid}/public`)
        if (!res.ok) throw new Error('Seller Not Found')
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
      <div className="min-h-screen flex items-center justify-center p-8">
        <Loader2 className="w-10 h-10 text-[#2D9A54] animate-spin" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Vector Lost: Seller Not Found</h1>
        <Link href="/" className="text-[#2D9A54] font-bold hover:underline">Return to Home</Link>
      </div>
    )
  }

  const { seller, listings } = data

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 flex flex-col gap-10 min-h-screen mb-12">
      
      {/* Breadcrumb / Back Link */}
      <Link href="/" className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors text-sm group">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to Marketplace
      </Link>

      {/* Profile Header */}
      <div className="bg-white border border-gray-100 rounded-[32px] p-8 md:p-12 shadow-sm flex flex-col md:flex-row gap-8 items-center md:items-start relative overflow-hidden">
        
        {/* Glow Deco */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/5 blur-[80px] -mr-32 -mt-32 pointer-events-none" />

        {/* Avatar */}
        <div className="relative w-32 h-32 md:w-44 md:h-44 rounded-full overflow-hidden border-4 border-white shadow-xl flex-shrink-0">
          <Image 
            src={seller.photoURL || 'https://www.gravatar.com/avatar/0?d=mp'} 
            fill 
            alt={seller.displayName}
            className="object-cover"
          />
        </div>

        {/* Info */}
        <div className="flex flex-col flex-1 text-center md:text-left gap-4">
          <div className="flex flex-col md:flex-row md:items-center gap-3">
             <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900">{seller.displayName}</h1>
             {seller.isLpuVerified && (
               <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#2D9A54]/10 text-[#2D9A54] rounded-full text-xs font-bold uppercase tracking-wider mx-auto md:mx-0">
                 <ShieldCheck className="w-3 h-3" />
                 LPU Verified
               </div>
             )}
          </div>

          <p className="text-gray-500 text-sm leading-relaxed max-w-2xl italic">
            "{seller.bio || 'This student seller is letting their products do the talking.'}"
          </p>

          <div className="flex flex-wrap justify-center md:justify-start gap-4 md:gap-8 mt-4 pt-6 border-t border-gray-50">
             <div className="flex items-center gap-2 text-gray-400 text-sm font-medium">
               <Calendar className="w-4 h-4 text-green-600" />
               Member since {formatDistanceToNow(new Date(seller.createdAt))}
             </div>
             <div className="flex items-center gap-2 text-gray-400 text-sm font-medium">
               <Package className="w-4 h-4 text-green-600" />
               {listings.length} Active Deals
             </div>
          </div>
        </div>
      </div>

      {/* Listing Grid */}
      <div className="space-y-6">
        <div className="flex justify-between items-end border-b border-gray-100 pb-4">
           <h2 className="text-2xl font-bold text-gray-900">Current Collection</h2>
           <span className="text-sm font-bold text-[#2D9A54]">{listings.length} Listed Items</span>
        </div>

        {listings.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
             <p className="text-gray-400 font-medium">This seller currently has no active listings.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
             {listings.map(l => (
                <Link 
                   key={l.slug} 
                   href={`/listing/${l.slug}`}
                   className="group flex flex-col bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1"
                >
                  <div className="aspect-square relative overflow-hidden bg-gray-100">
                    <Image 
                      src={l.images?.[0] || '/placeholder-listing.png'} 
                      fill 
                      alt={l.title}
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-4 flex flex-col gap-1">
                    <h3 className="font-bold text-gray-900 line-clamp-1 text-sm md:text-base">{l.title}</h3>
                    <div className="text-[#2D9A54] font-black text-lg">₹{l.price.toLocaleString('en-IN')}</div>
                    <div className="text-[10px] text-gray-400 mt-1 uppercase font-bold tracking-widest">{l.condition}</div>
                  </div>
                </Link>
             ))}
          </div>
        )}
      </div>

    </div>
  )
}
