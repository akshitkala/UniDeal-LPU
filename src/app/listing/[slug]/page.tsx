'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { formatDistanceToNow } from 'date-fns'
import { 
  MapPin, 
  ShieldCheck, 
  Clock, 
  ArrowLeft, 
  Share2, 
  Flag,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Info
} from 'lucide-react'
import { ContactButton } from '@/components/listing/ContactButton'
import { ReportModal } from '@/components/listing/ReportModal'

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
        if (!res.ok) throw new Error('Listing not found or unavailable')
        const data = await res.json()
        setListing(data)
      } catch (err) {
        setError('Listing not found or has been removed.')
      } finally {
        setLoading(false)
      }
    }
    fetchListing()
  }, [slug])

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
        <div className="h-6 bg-gray-100 rounded w-48 mb-8"></div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-7 h-[600px] bg-gray-50 rounded-[2.5rem]"></div>
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="h-12 bg-gray-100 rounded-2xl w-3/4"></div>
            <div className="h-40 bg-gray-100 rounded-2xl"></div>
            <div className="h-20 bg-gray-100 rounded-2xl"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !listing) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-32 text-center">
        <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
           <AlertCircle className="w-10 h-10" />
        </div>
        <h2 className="text-3xl font-black text-gray-900 mb-4">{error}</h2>
        <p className="text-gray-500 font-medium mb-10">The item might have been sold or the link is invalid.</p>
        <Link href="/" className="inline-flex items-center gap-2 bg-emerald-600 text-white px-8 py-3 rounded-2xl font-bold shadow-lg hover:bg-emerald-700 transition">
          <ArrowLeft className="w-5 h-5" /> Back to Marketplace
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8 pb-32">
      
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <Link href="/" className="group flex items-center gap-2 text-gray-400 hover:text-emerald-600 transition-colors font-bold text-sm">
          <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-emerald-50 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </div>
          Back to Deals
        </Link>
        <div className="flex gap-3">
           <button className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all border border-transparent hover:border-emerald-100">
              <Share2 className="w-4 h-4" />
           </button>
           <button 
             onClick={() => setIsReportModalOpen(true)}
             className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-all border border-transparent hover:border-rose-100"
            >
              <Flag className="w-4 h-4" />
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        
        {/* Left Cloud: Images & Specs (60% on desktop) */}
        <div className="lg:col-span-7 flex flex-col gap-10">
          
          <div className="flex flex-col gap-6">
            <div className="relative aspect-square md:aspect-video w-full bg-gray-50 rounded-[2.5rem] overflow-hidden border border-gray-100 flex items-center justify-center shadow-sm">
              {listing.images && listing.images.length > 0 ? (
                <Image 
                  src={`${listing.images[activeImage]}?w=1200&c_limit&q=90&f_auto`}
                  alt={listing.title} 
                  fill
                  priority
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 800px"
                />
              ) : (
                <div className="flex flex-col items-center gap-4 text-gray-300">
                   <Info className="w-12 h-12" />
                   <span className="font-bold uppercase tracking-widest text-xs">No media available</span>
                </div>
              )}
            </div>
            
            {listing.images && listing.images.length > 1 && (
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
                {listing.images.map((img: string, idx: number) => (
                  <button 
                    key={idx} 
                    onClick={() => setActiveImage(idx)}
                    className={`relative w-24 h-24 flex-shrink-0 rounded-2xl overflow-hidden border-2 transition-all hover:scale-105 ${activeImage === idx ? 'border-emerald-500 shadow-md' : 'border-gray-100'}`}
                  >
                    <Image src={`${img}?w=200&h=200&c_fill&q=80`} fill alt="thumbnail" className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-[2.5rem] p-8 md:p-12 border border-gray-100 shadow-sm">
            <h3 className="text-2xl font-black text-gray-900 mb-8 flex items-center gap-3">
              Description
              <div className="h-px bg-gray-100 flex-1 ml-4" />
            </h3>
            <p className="text-gray-600 text-lg leading-relaxed whitespace-pre-wrap font-medium">
              {listing.description}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12 pt-8 border-t border-gray-50">
              <div className="bg-emerald-50/50 p-6 rounded-3xl border border-emerald-100/50 flex flex-col gap-1">
                 <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Ownership & Condition</span>
                 <span className="text-xl font-black text-emerald-950 uppercase tracking-tight">
                   {listing.condition.replace('-', ' ')}
                 </span>
              </div>
              <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 flex flex-col gap-1">
                 <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Pick-up Location</span>
                 <span className="text-xl font-black text-gray-900 flex items-center gap-2">
                   <MapPin className="w-5 h-5 text-emerald-600" />
                   Campus
                 </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Cloud: Pricing & CTA (40% on desktop) */}
        <div className="lg:col-span-5 relative">
          <div className="lg:sticky lg:top-24 flex flex-col gap-8">
            
            <div className="bg-white rounded-[2.5rem] p-10 border border-gray-100 shadow-2xl shadow-gray-200/50">
               <div className="flex flex-col gap-6">
                 <div className="flex items-center justify-between">
                    <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest border border-emerald-200">
                      {listing.category?.name || 'Item'}
                    </span>
                    <div className="flex items-center gap-1.5 text-gray-400 font-bold text-[10px] uppercase tracking-widest">
                       <Clock className="w-3.5 h-3.5" />
                       {formatDistanceToNow(new Date(listing.createdAt))} ago
                    </div>
                 </div>

                 <h1 className="text-3xl font-black text-gray-950 leading-tight tracking-tight">
                   {listing.title}
                 </h1>

                 <div className="flex items-baseline gap-3">
                   <span className="text-5xl font-black text-emerald-600 tracking-tighter">
                     ₹{listing.price.toLocaleString('en-IN')}
                   </span>
                   {listing.negotiable && (
                     <span className="text-xs font-bold bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-100 animate-pulse">
                        Negotiable
                     </span>
                   )}
                 </div>

                 <div className="h-px bg-gray-50 w-full" />

                 <div className="flex items-center gap-4 bg-gray-50/50 p-4 rounded-3xl border border-gray-100">
                   <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center overflow-hidden shadow-sm border border-gray-100 relative">
                     {listing.seller?.photoURL ? (
                       <Image src={listing.seller.photoURL} fill alt="avatar" className="object-cover" />
                     ) : (
                       <span className="font-black text-emerald-600 text-xl">{listing.seller?.displayName?.charAt(0) || 'U'}</span>
                     )}
                   </div>
                   <div className="flex flex-col min-w-0">
                     <span className="font-black text-gray-900 flex items-center gap-1.5 truncate">
                       {listing.seller?.displayName || 'Campus User'}
                       <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                     </span>
                     <span className="text-xs font-bold text-gray-400 uppercase tracking-tighter">Verified Seller</span>
                   </div>
                 </div>

                 <ContactButton slug={listing.slug} sellerId={listing.seller?._id} />
               </div>
            </div>

            <div className="bg-emerald-50/30 rounded-[2.5rem] p-8 border border-emerald-100/50 flex flex-col gap-6">
               <h4 className="text-lg font-black text-emerald-950 flex items-center gap-2">
                 <ShieldCheck className="w-5 h-5 text-emerald-600" />
                 Buy Safely on Campus
               </h4>
               <ul className="flex flex-col gap-4">
                 {[
                   "Meet in well-lit public campus areas.",
                   "Inspect the item before paying.",
                   "No advance transfers to unknown links.",
                   "Prefer UPI/Cash during face-to-face handover."
                 ].map((tip, i) => (
                   <li key={i} className="flex gap-3 items-start group">
                      <div className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                      <p className="text-xs font-bold text-emerald-900/60 leading-tight">{tip}</p>
                   </li>
                 ))}
               </ul>
                  <button 
                    onClick={() => setIsReportModalOpen(true)}
                    className="mt-4 p-5 bg-white rounded-3xl border border-emerald-100 flex gap-4 items-center group transition-all hover:bg-rose-50 hover:border-rose-100 w-full"
                  >
                     <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-rose-500 group-hover:text-white transition-colors">
                        <AlertCircle className="w-5 h-5" />
                     </div>
                     <div className="flex flex-col text-left">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest group-hover:text-rose-500 transition-colors">Suspicious?</span>
                        <span className="text-sm font-black text-gray-900 flex items-center gap-1 group-hover:text-rose-700 transition-colors">
                           Report Listing <ChevronRight className="w-4 h-4" />
                        </span>
                     </div>
                  </button>
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
