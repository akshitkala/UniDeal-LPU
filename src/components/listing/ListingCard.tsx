import Link from 'next/link'
import Image from 'next/image'
import { formatDistanceToNow } from 'date-fns'
import { Search, MapPin, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ListingCardProps {
  listing: {
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
  showSeller?: boolean
  actions?: React.ReactNode
}

/**
 * UNIFIED LISTING CARD: High-fidelity preview for campus assets.
 * - Optimized for mobile-first 2-column layout.
 * - Next.js Image with Cloudinary q_85 transformations.
 */
export function ListingCard({ listing, showSeller = true, actions }: ListingCardProps) {
  const imageUrl = listing.images?.[0] 
    ? `${listing.images[0]}?w=600&h=600&c_fill&q=85&f_auto` 
    : null

  return (
    <Link 
      href={`/listing/${listing.slug}`}
      className="group bg-white border border-gray-100/50 hover:border-emerald-500 hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300 rounded-[2rem] overflow-hidden flex flex-col h-full relative"
    >
      {/* Media Container: Square Locked */}
      <div className="relative aspect-square w-full bg-gray-50 overflow-hidden">
        {imageUrl ? (
          <Image 
            src={imageUrl} 
            alt={listing.title} 
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-700" 
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-200">
            <Search className="w-8 h-8 opacity-20" />
          </div>
        )}
        
        {/* Category Badge */}
        <span className="absolute top-4 left-4 z-10 font-black bg-white/90 backdrop-blur-md text-gray-900 text-[9px] uppercase tracking-[0.2em] px-2.5 py-1.5 rounded-xl shadow-sm border border-gray-100">
          {listing.category?.name || 'Asset'}
        </span>
      </div>

      {/* Content Cluster: Informational Signal */}
      <div className="p-4 flex flex-col justify-between flex-1 relative z-10">
        <div className="mb-4">
          <h3 className="text-xs sm:text-sm md:text-base leading-tight font-bold text-gray-900 line-clamp-2 mb-1.5 group-hover:text-[#2D9A54] transition-colors uppercase tracking-tight">
            {listing.title}
          </h3>
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-base sm:text-lg md:text-xl font-black text-gray-900 tracking-tighter">₹{listing.price.toLocaleString('en-IN')}</span>
            {listing.negotiable && (
              <span className="text-[8px] sm:text-[10px] font-bold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-md border border-emerald-100 uppercase tracking-tighter">
                Neg
              </span>
            )}
          </div>
        </div>
        
        {actions ? (
          <div className="pt-3 border-t border-gray-50 mt-auto" onClick={(e) => e.preventDefault()}>
            {actions}
          </div>
        ) : showSeller ? (
          <div className="flex justify-between items-center pt-3 border-t border-gray-50 mt-auto">
            <span className="text-[11px] font-bold text-gray-500 truncate max-w-[100px]">
              {listing.seller?.displayName || 'User'}
            </span>
            <span className="text-[10px] font-medium text-gray-400 capitalize">
              {formatDistanceToNow(new Date(listing.bumpedAt || listing.createdAt), { addSuffix: true })}
            </span>
          </div>
        ) : null}
      </div>
    </Link>
  )
}
