import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { Avatar } from '@/components/ui/Avatar'
import { useRef } from 'react'
import { getCardImageUrl } from '@/lib/utils/images'

export interface ListingCardProps {
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
  priority?: boolean
}

export function ListingCard({ listing, showSeller = true, actions, priority = false }: ListingCardProps) {

  const router = useRouter()
  const prefetchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const imageUrl = listing.images?.[0] ? getCardImageUrl(listing.images[0]) : null
  
  const handleMouseEnter = () => {
    prefetchTimer.current = setTimeout(() => {
      router.prefetch(`/listing/${listing.slug}`)
    }, 200)
  }

  const handleMouseLeave = () => {
    if (prefetchTimer.current) {
      clearTimeout(prefetchTimer.current)
    }
  }

  const getConditionStyles = (condition?: string) => {
    if (!condition) return 'bg-gray-50 text-gray-700'
    switch (condition.toLowerCase()) {
      case 'new':
      case 'like-new': return 'bg-green-50 text-green-700'
      case 'good': return 'bg-blue-50 text-blue-700'
      case 'used': return 'bg-amber-50 text-amber-700'
      case 'damaged': return 'bg-red-50 text-red-700'
      default: return 'bg-gray-50 text-gray-700'
    }
  }

  const formatCondition = (condition?: string) => {
    if (!condition) return 'Unknown'
    return condition.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
  }

  return (
    <div 
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={() => router.push(`/listing/${listing.slug}`)}
      className="rounded-xl border border-gray-100 bg-white overflow-hidden cursor-pointer hover:shadow-md transition-shadow duration-200 flex flex-col h-full"
    >
      {/* Image Area */}
      <div className="aspect-square w-full bg-gray-50 relative overflow-hidden">
        {imageUrl ? (
          <Image 
            src={imageUrl} 
            alt={listing.title} 
            fill
            priority={priority}
            loading={priority ? undefined : 'lazy'}
            className="object-contain p-3 w-full h-full" 
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />

        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-200">
            <span className="text-2xl">📦</span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-2.5 sm:p-3 flex flex-col flex-1">
        {/* Row 1 — category + condition */}
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-400 truncate max-w-[60%]">
            {listing.category?.name || 'Item'}
          </span>
          <span className={cn(
            "text-xs font-medium px-1.5 py-0.5 rounded-full",
            getConditionStyles(listing.condition)
          )}>
            {formatCondition(listing.condition).toLowerCase()}
          </span>
        </div>

        {/* Row 2 — title */}
        <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 mt-1.5">
          {listing.title}
        </h3>

        {/* Row 3 — price + negotiable */}
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-base font-bold text-gray-900">
            ₹{listing.price.toLocaleString('en-IN')}
          </span>
          {listing.negotiable && (
            <span className="text-xs bg-green-50 text-green-700 px-1.5 py-0.5 rounded-full font-medium">
              Nego
            </span>
          )}
        </div>

        {/* Row 4 — seller + timestamp */}
        <div className="flex items-center justify-between mt-2">
          {showSeller ? (
            <div className="flex items-center gap-1.5 truncate">
               <Avatar 
                src={listing.seller?.photoURL} 
                name={listing.seller?.displayName}
                className="w-4 h-4"
              />
              <span className="text-xs text-gray-400 truncate">
                {listing.seller?.displayName || 'Campus Seller'}
              </span>
            </div>
          ) : (
            <div />
          )}
          <span className="text-xs text-gray-300 shrink-0 ml-1">
            Now
          </span>
        </div>

        {/* Dashboard Actions Row (Inside Card) */}
        {actions && (
          <div className="border-t border-gray-50 mt-2.5 pt-2.5 flex items-center gap-1.5">
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}
