'use client'

import React from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { Search } from 'lucide-react'
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
 * UNIFIED LISTING CARD: The single source of truth for item previews.
 * - Used on Homepage, /browse, and /dashboard.
 * - Responsive: Supports 2 columns on mobile seamlessly.
 * - Interaction: Supports custom onClick or standard link behavior.
 */
export function ListingCard({ listing, showSeller = true, actions }: ListingCardProps) {
  return (
    <Link 
      href={`/listing/${listing.slug}`}
      className="group cursor-pointer bg-white border border-[#E5E5E5] hover:border-[#2D9A54] hover:shadow-2xl transition-all duration-300 rounded-2xl overflow-hidden flex flex-col h-full relative min-h-[320px]"
    >
      {/* Media: Squared Aspect */}
      <div className="relative aspect-square w-full bg-gray-100 overflow-hidden">
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300 z-1" />
        
        <span className="absolute top-3 left-3 z-10 font-black bg-[#2D9A54] text-white text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-lg shadow-sm">
          {listing.category?.name || 'Item'}
        </span>
        
        {listing.images && listing.images.length > 0 ? (
          <img 
            src={listing.images[0]} 
            alt={listing.title} 
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <Search className="w-10 h-10 opacity-20" />
          </div>
        )}
      </div>

      {/* Content Cluster: Informational Signal */}
      <div className="p-4 flex flex-col justify-between flex-1 relative z-10">
        <div className="mb-4">
          <h3 className="text-[14px] leading-tight font-bold text-gray-900 line-clamp-2 mb-1.5 group-hover:text-[#2D9A54] transition-colors uppercase tracking-tight">
            {listing.title}
          </h3>
          <div className="flex items-center gap-3">
            <span className="text-[17px] font-black text-gray-900 tracking-tighter">₹{listing.price.toLocaleString('en-IN')}</span>
            {listing.negotiable && (
              <span className="text-[9px] font-bold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-md border border-emerald-100 uppercase tracking-tighter">
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
