import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { Avatar } from '@/components/ui/Avatar'
import { useRef } from 'react'

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
  const imageUrl = listing.images?.[0] 
  
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
      case 'new': return 'bg-green-50 text-green-700'
      case 'like-new': return 'bg-blue-50 text-blue-700'
      case 'good': return 'bg-yellow-50 text-yellow-700'
      case 'used': return 'bg-orange-50 text-orange-700'
      case 'damaged': return 'bg-red-50 text-red-700'
      default: return 'bg-gray-50 text-gray-700'
    }
  }

  const formatCondition = (condition?: string) => {
    if (!condition) return 'Unknown'
    return condition.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
  }

  return (
    <div className="h-full flex flex-col">
      <div 
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={() => router.push(`/listing/${listing.slug}`)}
        className="group rounded-2xl bg-white border border-gray-100 hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden flex flex-col flex-1"
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
              className="object-contain p-2 sm:p-4 w-full h-full group-hover:scale-105 transition-transform duration-500" 
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-200">
              <span className="text-4xl">📦</span>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="px-3 pb-4 pt-2 flex flex-col flex-1">
          <div className="flex justify-between items-start gap-2 mb-1">
            <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider truncate">
              {listing.category?.name || 'Item'}
            </span>
            <span className={cn(
              "text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-tight whitespace-nowrap",
              getConditionStyles(listing.condition)
            )}>
              {formatCondition(listing.condition)}
            </span>
          </div>

          <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug h-9">
            {listing.title}
          </h3>

          <div className="flex items-center justify-between mt-3">
            <div className="flex items-start">
              <span className="text-[10px] font-bold text-gray-900 mt-0.5 mr-0.5">₹</span>
              <span className="text-base font-black text-gray-900">
                {listing.price.toLocaleString('en-IN')}
              </span>
            </div>
            {listing.negotiable && (
              <span className="bg-green-50 text-green-700 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter">
                Nego
              </span>
            )}
          </div>

          {showSeller && (
            <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-gray-50">
              <Avatar 
                src={listing.seller?.photoURL} 
                name={listing.seller?.displayName}
                size="xs"
              />
              <span className="text-[10px] text-gray-400 font-medium truncate">
                {listing.seller?.displayName || 'Campus Seller'}
              </span>
            </div>
          )}
        </div>
      </div>

      {actions && (
        <div className="px-3 pb-4">
          <div className="pt-3 border-t border-gray-100">
            {actions}
          </div>
        </div>
      )}
    </div>
  )
}
