'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { formatDistanceToNow } from 'date-fns'
import { 
  MapPin, 
  ShieldCheck, 
  ArrowLeft, 
  Flag,
  CheckCircle2,
  ChevronRight,
  Clock,
  Package
} from 'lucide-react'
import { ContactButton } from '@/components/listing/ContactButton'
import { ReportModal } from '@/components/listing/ReportModal'
import { cn } from '@/lib/utils'
import { Avatar } from '@/components/ui/Avatar'

export default function ListingDetail() {
  const { slug } = useParams()
  const [listing, setListing] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeImage, setActiveImage] = useState(0)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)

  useEffect(() => {
    async function fetchListing() {
      try {
        const res = await fetch(`/api/listings/${slug}`)
        if (!res.ok) throw new Error('Listing not found')
        const data = await res.json()
        setListing(data)
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
          <div className="aspect-square bg-gray-50 rounded-2xl"></div>
          <div className="space-y-6">
            <div className="h-10 bg-gray-100 rounded-xl w-3/4"></div>
            <div className="h-4 bg-gray-100 rounded-xl w-1/4"></div>
            <div className="h-40 bg-gray-100 rounded-2xl"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !listing) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-32 text-center">
        <div className="w-20 h-20 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center mx-auto mb-6">
           <Package className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-4">{error}</h2>
        <Link href="/browse" className="inline-flex items-center gap-2 bg-[#16a34a] text-white px-8 py-3 rounded-full font-bold shadow-lg transition">
          <ArrowLeft className="w-5 h-5" /> Back to Market
        </Link>
      </div>
    )
  }

  const formatCondition = (condition: string) => {
    return condition.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
  }

  const getConditionStyles = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'new': return 'bg-green-50 text-green-700'
      case 'like-new': return 'bg-blue-50 text-blue-700'
      case 'good': return 'bg-yellow-50 text-yellow-700'
      case 'used': return 'bg-orange-50 text-orange-700'
      case 'damaged': return 'bg-red-50 text-red-700'
      default: return 'bg-gray-50 text-gray-700'
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col gap-8">
      
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
         <Link href="/browse" className="hover:text-gray-900 transition-colors">Categories</Link>
         <ChevronRight className="w-3 h-3" />
         <Link href={`/browse?category=${listing.category.slug}`} className="hover:text-gray-900 transition-colors">{listing.category.name}</Link>
         <ChevronRight className="w-3 h-3" />
         <span className="text-gray-900 truncate max-w-[150px] sm:max-w-xs">{listing.title}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-start">
        
        {/* LEFT COLUMN: Image Gallery */}
        <div className="flex flex-col gap-6">
          <div className="relative aspect-square w-full bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 flex items-center justify-center p-8 group">
            {listing.images && listing.images.length > 0 ? (
              <Image 
                src={`${listing.images[activeImage]}?w=1200&c_limit&q=90&f_auto`}
                alt={listing.title} 
                fill
                priority
                className="object-contain p-8 group-hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 768px) 100vw, 800px"
              />
            ) : (
              <div className="text-gray-300 flex flex-col items-center gap-4">
                 <Package className="w-12 h-12" />
                 <span className="text-xs font-bold uppercase tracking-widest">Image missing</span>
              </div>
            )}
          </div>
          
          {listing.images && listing.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
              {listing.images.map((img: string, idx: number) => (
                <button 
                  key={idx} 
                  onClick={() => setActiveImage(idx)}
                  className={cn(
                    "relative w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all bg-gray-50 p-2",
                    activeImage === idx ? 'border-[#16a34a] ring-4 ring-green-500/10' : 'border-transparent hover:border-gray-200'
                  )}
                >
                  <Image src={`${img}?w=200&h=200&c_contain&q=80`} fill alt="thumbnail" className="object-contain p-2" sizes="80px" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Details (Sticky) */}
        <div className="md:sticky md:top-24 flex flex-col gap-8">
          
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
               <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-gray-900 leading-tight tracking-tight">
                 {listing.title}
               </h1>
               <p className="text-sm font-medium text-gray-500 leading-relaxed max-w-lg">
                 {listing.description}
               </p>
            </div>

            <div className="h-px bg-gray-100 w-full" />

            <div className="flex flex-col gap-1">
               <div className="flex items-start">
                   <span className="text-xl font-bold text-gray-900 mt-1 mr-1">₹</span>
                   <span className="text-2xl sm:text-4xl font-black text-gray-900 tracking-tighter">
                     {listing.price.toLocaleString('en-IN')}
                   </span>
               </div>
               {listing.negotiable && (
                 <span className="text-sm text-[#16a34a] font-bold mt-1">Price is negotiable</span>
               )}
            </div>

            <div className="h-px bg-gray-100 w-full" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
                     <Package className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col">
                     <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">State</span>
                     <span className={cn(
                        "text-xs font-bold px-2 py-0.5 rounded-full w-fit uppercase tracking-tight",
                        getConditionStyles(listing.condition)
                     )}>
                        {formatCondition(listing.condition)}
                     </span>
                  </div>
               </div>
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
                     <Clock className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col">
                     <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Listed</span>
                     <span className="text-sm font-bold text-gray-900">
                        {formatDistanceToNow(new Date(listing.createdAt))} ago
                     </span>
                  </div>
               </div>
            </div>

            <div className="h-px bg-gray-100 w-full" />

            {/* Seller */}
            <div className="flex flex-col gap-3">
               <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Market Vendor</span>
               <div className="flex items-center gap-4 bg-white p-4 rounded-3xl border border-gray-100">
                 <Avatar 
                   src={listing.seller?.photoURL} 
                   name={listing.seller?.displayName}
                   size="lg"
                 />
                 <div className="flex flex-col min-w-0">
                   <span className="font-bold text-gray-900 flex items-center gap-1.5 truncate">
                     {listing.seller?.displayName || 'Campus User'}
                     <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                   </span>
                   <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Verified Student Seller</span>
                 </div>
               </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-col gap-3 pt-4">
               <div className="w-full">
                  <ContactButton slug={listing.slug} sellerId={listing.seller?._id} />
               </div>
               <button 
                 onClick={() => setIsReportModalOpen(true)}
                 className="w-full h-12 rounded-full border border-gray-200 text-gray-400 font-bold text-sm hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
               >
                 <Flag className="w-4 h-4" /> Report this listing
               </button>
            </div>

            {/* Info Rows */}
            <div className="flex flex-col mt-4 border-t border-gray-100">
               <div className="flex items-center gap-4 py-4 border-b border-gray-50">
                  <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-[#16a34a]">
                     <MapPin className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-gray-600 uppercase tracking-widest">Campus pickup — LPU area</span>
               </div>
               <div className="flex items-center gap-4 py-4 border-b border-gray-50">
                  <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-[#16a34a]">
                     <ShieldCheck className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-gray-600 uppercase tracking-widest">Direct WhatsApp Contact Only</span>
               </div>
            </div>

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
