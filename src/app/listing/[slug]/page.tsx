'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { getRelativeTime } from '@/lib/utils/time'
import { 
  MapPin, 
  ShieldCheck, 
  ShieldAlert,
  ArrowLeft, 
  Flag,
  CheckCircle2,
  ChevronRight,
  Clock,
  Package,
  Share2,
  AlertCircle
} from 'lucide-react'
import { ContactButton } from '@/components/listing/ContactButton'
import { ReportModal } from '@/components/listing/ReportModal'
import { ListingNotAvailable } from '@/components/listing/ListingNotAvailable'
import { cn } from '@/lib/utils'
import { Avatar } from '@/components/ui/Avatar'

export default function ListingDetail() {
  const { slug } = useParams()
  const router = useRouter()
  const [listing, setListing] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeImage, setActiveImage] = useState(0)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)

  useEffect(() => {
    async function fetchListing() {
      try {
        const res = await fetch(`/api/listings/${slug}`)
        const data = await res.json()
        
        if (data.error === 'not_available') {
           setListing({ status: 'not_available' })
           setLoading(false)
           return
        }

        if (!res.ok) throw new Error('Listing not found')
        setListing(data.listing)
      } catch (err) {
        setError('Listing could not be retrieved.')
      } finally {
        setLoading(false)
      }
    }
    fetchListing()
  }, [slug])

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-pulse">
        <div className="h-4 bg-gray-100 rounded w-48 mb-8"></div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="aspect-square bg-gray-50 rounded-xl"></div>
          <div className="space-y-6">
            <div className="h-10 bg-gray-100 rounded-lg w-3/4"></div>
            <div className="h-4 bg-gray-100 rounded-lg w-1/4"></div>
            <div className="h-40 bg-gray-100 rounded-xl"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !listing) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-32 text-center flex flex-col items-center">
        <div className="w-16 h-16 bg-gray-50 text-gray-200 rounded-full flex items-center justify-center mb-6">
           <Package className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">{error || 'Something went wrong'}</h2>
        <p className="text-sm text-gray-500 mb-8">This listing might have been removed or is no longer available.</p>
        <Link href="/browse" className="inline-flex items-center gap-2 bg-[#16a34a] text-white h-11 px-6 rounded-lg text-sm font-semibold transition-all hover:bg-[#15803d]">
          <ArrowLeft className="w-4 h-4" /> Back to browse
        </Link>
      </div>
    )
  }

  if (listing.status === 'not_available') {
     return <ListingNotAvailable />
  }

  const formatCondition = (condition: string) => {
    return condition.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
  }

  const getConditionStyles = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'new': return 'bg-green-50 text-green-700 border-green-100'
      case 'like-new': return 'bg-blue-50 text-blue-700 border-blue-100'
      case 'good': return 'bg-yellow-50 text-yellow-700 border-yellow-100'
      case 'used': return 'bg-orange-50 text-orange-700 border-orange-100'
      case 'damaged': return 'bg-red-50 text-red-700 border-red-100'
      default: return 'bg-gray-50 text-gray-700 border-gray-100'
    }
  }

  const isPending = listing.status === 'pending'
  const isBanned = listing.status === 'banned' || listing.sellerBanned
  const isFlagged = listing.aiFlagged

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
      
      {/* Status Banners */}
      {(isPending || isBanned || isFlagged) && (
        <div className="flex flex-col gap-3 mb-8">
            {isPending && (
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-center gap-3 text-blue-700 text-sm font-medium">
                    <Clock className="w-5 h-5 shrink-0" /> This listing is pending approval and is only visible to you.
                </div>
            )}
            {isBanned && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-700 text-sm font-medium">
                    <AlertCircle className="w-5 h-5 shrink-0" /> This listing has been removed for violating our community guidelines.
                </div>
            )}
            {isFlagged && (
                <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex items-center gap-3 text-amber-700 text-sm font-medium">
                    <ShieldAlert className="w-5 h-5 shrink-0" /> This listing is under review and is currently hidden from other users.
                </div>
            )}
        </div>
      )}

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-8">
         <Link href="/browse" className="hover:text-gray-900 transition-colors">Market</Link>
         <ChevronRight className="w-3 h-3" />
         <Link href={`/browse?category=${listing.category.slug}`} className="hover:text-gray-900 transition-colors">{listing.category.name}</Link>
         <ChevronRight className="w-3 h-3" />
         <span className="text-gray-900 truncate max-w-[150px] sm:max-w-xs">{listing.title}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-16 items-start">
        
        {/* Gallery Column */}
        <div className="md:col-span-12 lg:col-span-7 flex flex-col gap-4">
          <div className="relative aspect-square w-full bg-gray-50 rounded-xl overflow-hidden border border-gray-100 flex items-center justify-center">
            {listing.images && listing.images.length > 0 ? (
              <Image 
                src={`${listing.images[activeImage]}?w=1200&c_limit&q=90&f_auto`}
                alt={listing.title} 
                fill
                priority
                className="object-contain p-4"
                sizes="(max-width: 1024px) 100vw, 800px"
              />
            ) : (
              <div className="text-gray-300 flex flex-col items-center gap-3">
                 <Package className="w-10 h-10" />
                 <span className="text-[10px] font-bold uppercase tracking-widest">No image provided</span>
              </div>
            )}
          </div>
          
          {listing.images && listing.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {listing.images.map((img: string, idx: number) => (
                <button 
                  key={idx} 
                  onClick={() => setActiveImage(idx)}
                  className={cn(
                    "relative w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all bg-gray-50 p-1.5",
                    activeImage === idx ? 'border-[#16a34a]' : 'border-transparent hover:border-gray-200'
                  )}
                >
                  <Image src={`${img}?w=200&h=200&c_contain&q=80`} fill alt="" className="object-contain p-1.5" sizes="80px" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details Column */}
        <div className="md:col-span-12 lg:col-span-5 flex flex-col gap-6 lg:sticky lg:top-24">
          
          <div className="space-y-4">
             <div className="flex flex-col gap-1.5">
                <span className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded border w-fit uppercase tracking-wider",
                    getConditionStyles(listing.condition)
                )}>
                    {formatCondition(listing.condition)}
                </span>
                <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 leading-tight">
                  {listing.title}
                </h1>
                <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-bold text-gray-900 tracking-tight">₹{listing.price.toLocaleString('en-IN')}</span>
                    {listing.negotiable && (
                        <span className="text-[10px] font-bold text-[#16a34a] uppercase tracking-wider ml-1">Negotiable</span>
                    )}
                </div>
             </div>

             <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                  {listing.description}
                </p>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-white border border-gray-100 rounded-xl flex items-center gap-3">
                   <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
                      <Clock className="w-4 h-4" />
                   </div>
                   <div className="flex flex-col">
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Listed</span>
                      <span className="text-xs font-semibold text-gray-900">{getRelativeTime(listing.createdAt)}</span>
                   </div>
                </div>
                <div className="p-3 bg-white border border-gray-100 rounded-xl flex items-center gap-3">
                   <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
                      <MapPin className="w-4 h-4" />
                   </div>
                   <div className="flex flex-col">
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Pickup</span>
                      <span className="text-xs font-semibold text-gray-900">LPU Campus</span>
                   </div>
                </div>
          </div>

          <div className="p-4 border border-gray-100 rounded-xl bg-white space-y-4">
             <div className="flex items-center gap-3">
                <Avatar 
                  src={listing.seller?.photoURL} 
                  name={listing.seller?.displayName}
                  size="md"
                  className="w-10 h-10"
                />
                <div className="flex flex-col min-w-0">
                   <span className="text-sm font-semibold text-gray-900 truncate">
                     {listing.seller?.displayName || 'User'}
                   </span>
                   <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Student Seller</span>
                </div>
             </div>
             
             <ContactButton slug={listing.slug} sellerId={listing.seller?._id} />
          </div>

          <div className="flex items-center justify-between pt-2">
             <button 
               onClick={() => setIsReportModalOpen(true)}
               className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5 hover:text-red-500 transition-colors"
             >
               <Flag className="w-3.5 h-3.5" /> Report listing
             </button>
             <button 
               className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5 hover:text-indigo-500 transition-colors"
             >
               <Share2 className="w-3.5 h-3.5" /> Share
             </button>
          </div>

        </div>
      </div>

      <ReportModal 
        slug={listing.slug} 
        isOpen={isReportModalOpen} 
        onClose={() => setIsReportModalOpen(false)} 
      />

    </div>
  )
}
