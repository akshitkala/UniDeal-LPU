'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { 
  MapPin, 
  ShieldCheck, 
  Tag, 
  Clock, 
  ArrowLeft, 
  MessageCircle, 
  Share2, 
  Flag,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Info
} from 'lucide-react'

export default function ListingDetail() {
  const { slug } = useParams()
  const router = useRouter()
  const [listing, setListing] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeImage, setActiveImage] = useState(0)
  const [contactStatus, setContactStatus] = useState<'idle' | 'loading' | 'success' | 'unauthorized' | 'rate_limited' | 'error' | 'no_number'>('idle')
  const [contactLoading, setContactLoading] = useState(false)
  const [contactError, setContactError] = useState('')

  const handleContact = async () => {
    setContactLoading(true)
    setContactError('')
    
    try {
      const res = await fetch(`/api/listings/${slug}/contact`, { method: 'POST' })
      const data = await res.json()
      
      if (res.status === 401) {
        setContactStatus('unauthorized')
      } else if (res.status === 429) {
        setContactStatus('rate_limited')
      } else if (res.status === 400 && data.error?.includes('number')) {
        setContactStatus('no_number')
      } else if (!res.ok) {
        setContactStatus('error')
        setContactError(data.error || 'Failed to retreive contact')
      } else {
        setContactStatus('success')
        if (typeof window !== 'undefined') {
          window.open(data.waLink, '_blank')
        }
      }
    } catch (err) {
      setContactStatus('error')
      setContactError('Network error')
    } finally {
      setContactLoading(false)
    }
  }

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
      <div className="flex flex-col gap-10 mt-8 animate-pulse">
        <div className="h-6 bg-gray-100 rounded w-48"></div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-7 h-[500px] bg-gray-100 rounded-[2.5rem]"></div>
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
      <div className="text-center py-32">
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
    <div className="flex flex-col gap-8 pb-20">
      
      {/* Breadcrumbs & Actions */}
      <div className="flex items-center justify-between mt-4">
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
           <button className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-all border border-transparent hover:border-rose-100">
              <Flag className="w-4 h-4" />
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* Left: Media & Details Container */}
        <div className="lg:col-span-7 flex flex-col gap-10">
          
          {/* Enhanced Image Gallery */}
          <div className="flex flex-col gap-6">
            <div className="relative aspect-square md:aspect-video w-full bg-gray-50 rounded-[2.5rem] overflow-hidden border border-gray-100 flex items-center justify-center shadow-premium">
              {listing.images && listing.images.length > 0 ? (
                <img 
                  src={listing.images[activeImage]} 
                  alt={listing.title} 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <div className="flex flex-col items-center gap-4 text-gray-300">
                   <Info className="w-12 h-12" />
                   <span className="font-bold uppercase tracking-widest text-xs">No media available</span>
                </div>
              )}
              
              {/* Image Navigation Dots if multiple */}
              {listing.images && listing.images.length > 1 && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 bg-black/20 backdrop-blur-md p-2 rounded-full">
                   {listing.images.map((_: any, i: number) => (
                     <div 
                       key={i} 
                       className={`h-2 rounded-full transition-all duration-300 ${activeImage === i ? 'w-6 bg-white' : 'w-2 bg-white/50'}`}
                     />
                   ))}
                </div>
              )}
            </div>
            
            {/* Thumbnails Grid */}
            {listing.images && listing.images.length > 1 && (
              <div className="grid grid-cols-5 gap-4">
                {listing.images.map((img: string, idx: number) => (
                  <button 
                    key={idx} 
                    onClick={() => setActiveImage(idx)}
                    className={`aspect-square rounded-2xl overflow-hidden border-2 transition-all hover:scale-105 active:scale-95 ${activeImage === idx ? 'border-emerald-500 shadow-lg' : 'border-gray-100'}`}
                  >
                    <img src={img} className="w-full h-full object-cover" alt="thumbnail" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Detailed Info */}
          <div className="bg-white rounded-[2.5rem] p-8 md:p-12 border border-gray-100 shadow-premium">
            <div className="flex flex-col gap-8">
              <div>
                <h3 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-3">
                  Description
                  <div className="h-px bg-gray-100 flex-1 ml-4" />
                </h3>
                <p className="text-gray-600 text-lg leading-relaxed whitespace-pre-wrap font-medium">
                  {listing.description}
                </p>
              </div>

              {/* Specs Table-like grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8 border-t border-gray-50">
                <div className="bg-emerald-50/50 p-6 rounded-3xl border border-emerald-100/50 flex flex-col gap-1">
                   <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Ownership & Condition</span>
                   <span className="text-xl font-black text-emerald-950 uppercase tracking-tight">
                     {listing.condition.replace('-', ' ')}
                   </span>
                </div>
                <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 flex flex-col gap-1">
                   <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Pick-up Location</span>
                   <span className="text-xl font-black text-gray-900 flex items-center gap-2">
                     <MapPin className="w-5 h-5 text-emerald-600" />
                     Campus
                   </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Pricing & Meta Sidebar */}
        <div className="lg:col-span-5 flex flex-col gap-8">
          
          <div className="sticky top-24 flex flex-col gap-8">
            
            {/* Main Action Card */}
            <div className="bg-white rounded-[2.5rem] p-10 border border-gray-100 shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16" />
               
               <div className="relative z-10 flex flex-col gap-6">
                 <div className="flex items-center justify-between">
                    <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest border border-emerald-200">
                      {listing.category?.name || 'Campus Exclusive'}
                    </span>
                    <div className="flex items-center gap-1.5 text-gray-400 font-bold text-[10px] uppercase tracking-widest">
                       <Clock className="w-3.5 h-3.5" />
                       {formatDistanceToNow(new Date(listing.createdAt))} ago
                    </div>
                 </div>

                 <h1 className="text-3xl md:text-4xl font-black text-gray-950 leading-tight">
                   {listing.title}
                 </h1>

                 <div className="flex items-baseline gap-3 mt-2">
                   <span className="text-5xl font-black text-emerald-600 tracking-tighter">
                     ₹{listing.price.toLocaleString('en-IN')}
                   </span>
                   {listing.negotiable && (
                     <span className="text-xs font-bold bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-100 animate-pulse">
                        Negotiable
                     </span>
                   )}
                 </div>

                 <div className="h-px bg-gray-50 w-full my-2" />

                 {/* Seller Snippet */}
                 <div className="flex items-center gap-4 bg-gray-50/50 p-4 rounded-3xl border border-gray-100">
                   <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center overflow-hidden shadow-sm border border-gray-100">
                     {listing.seller?.photoURL ? (
                       <img src={listing.seller.photoURL} alt="avatar" className="w-full h-full object-cover" />
                     ) : (
                       <span className="font-black text-emerald-600 text-xl">{listing.seller?.displayName?.charAt(0) || 'U'}</span>
                     )}
                   </div>
                   <div className="flex flex-col">
                     <span className="font-black text-gray-900 flex items-center gap-1.5">
                       {listing.seller?.displayName || 'Campus User'}
                       <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                     </span>
                     <span className="text-xs font-bold text-gray-500 uppercase tracking-tighter">Seller</span>
                   </div>
                 </div>

                 <button 
                   onClick={handleContact}
                   disabled={contactLoading || contactStatus === 'rate_limited' || contactStatus === 'no_number'}
                   className={`w-full group h-16 rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl
                     ${contactStatus === 'success' ? 'bg-emerald-600 text-white shadow-emerald-500/20' : 
                       contactStatus === 'unauthorized' ? 'bg-gray-900 hover:bg-black text-white shadow-gray-900/20' :
                       contactStatus === 'rate_limited' ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none' :
                       contactStatus === 'error' ? 'bg-rose-600 text-white shadow-rose-500/20' :
                       contactStatus === 'no_number' ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed shadow-none' :
                       'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
                     }
                   `}
                 >
                   {contactLoading ? (
                     <LoaderOverlay />
                   ) : contactStatus === 'success' ? (
                     <>Connecting...</>
                   ) : contactStatus === 'unauthorized' ? (
                     <>Sign in to Contact</>
                   ) : contactStatus === 'rate_limited' ? (
                     <>Rate Limited</>
                   ) : (
                     <>
                        <MessageCircle className="w-6 h-6 group-hover:scale-110 transition-transform" /> 
                        Contact on WhatsApp
                     </>
                   )}
                 </button>

                 {contactError && <p className="text-xs text-center text-rose-500 font-bold">{contactError}</p>}
                 
               </div>
            </div>

            {/* Buying Safety Checklist */}
            <div className="bg-emerald-50/30 rounded-[2.5rem] p-10 border border-emerald-100/50">
               <h4 className="text-lg font-black text-emerald-950 mb-6 flex items-center gap-2">
                 <ShieldCheck className="w-5 h-5 text-emerald-600" />
                 Buy Safely on Campus
               </h4>
               <ul className="flex flex-col gap-4">
                 {[
                   "Meet the seller in well-lit public areas on campus.",
                   "Inspect the item thoroughly before paying.",
                   "Do not transfer money in advance or to unknown links.",
                   "Prefer cash or UPI during the face-to-face hand-over."
                 ].map((tip, i) => (
                   <li key={i} className="flex gap-4 items-start group">
                      <div className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                         <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full" />
                      </div>
                      <p className="text-sm font-medium text-emerald-900/70 group-hover:text-emerald-950 transition-colors">{tip}</p>
                   </li>
                 ))}
               </ul>
               <div className="mt-10 p-5 bg-white rounded-3xl border border-emerald-100 flex gap-4 items-center cursor-pointer hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                     <AlertCircle className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col">
                     <span className="text-xs font-bold text-emerald-950 uppercase tracking-widest">Suspicious activity?</span>
                     <span className="text-sm font-black text-emerald-700 underline flex items-center gap-1">
                        Report Listing <ChevronRight className="w-4 h-4" />
                     </span>
                  </div>
               </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  )
}

function LoaderOverlay() {
  return (
    <div className="flex items-center gap-2">
       <div className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:-0.3s]"></div>
       <div className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:-0.15s]"></div>
       <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
    </div>
  )
}
