'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { MapPin, ShieldCheck, Tag, Clock, ArrowLeft, MessageCircle } from 'lucide-react'

export default function ListingDetail() {
  const { slug } = useParams()
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
        // Automatically open the link
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
      <div className="flex flex-col gap-8 animate-pulse mt-8">
        <div className="h-8 bg-gray-100 rounded w-1/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="h-[400px] bg-gray-100 rounded-xl"></div>
          <div className="flex flex-col gap-4">
            <div className="h-10 bg-gray-100 rounded w-1/2"></div>
            <div className="h-6 bg-gray-100 rounded w-1/4"></div>
            <div className="h-32 bg-gray-100 rounded w-full mt-4"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !listing) {
    return (
      <div className="text-center py-20 mt-10">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">{error}</h2>
        <Link href="/" className="text-[#2D9A54] hover:underline flex items-center justify-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Feed
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 mt-4">
      <Link href="/" className="text-gray-500 hover:text-[#2D9A54] flex items-center gap-2 w-fit mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Feed
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Left Column: Images */}
        <div className="flex flex-col gap-4">
          <div className="w-full h-[300px] md:h-[450px] bg-gray-100 rounded-2xl overflow-hidden border border-[#E5E5E5] flex items-center justify-center">
            {listing.images && listing.images.length > 0 ? (
              <img 
                src={listing.images[activeImage]} 
                alt={listing.title} 
                className="w-full h-full object-contain bg-black/5" 
              />
            ) : (
              <span className="text-gray-400">No images provided</span>
            )}
          </div>
          
          {/* Thumbnails if > 1 image */}
          {listing.images && listing.images.length > 1 && (
            <div className="flex gap-4">
              {listing.images.map((img: string, idx: number) => (
                <button 
                  key={idx} 
                  onClick={() => setActiveImage(idx)}
                  className={`w-20 h-20 rounded-lg overflow-hidden border-2 ${activeImage === idx ? 'border-[#2D9A54]' : 'border-transparent'} transition-all`}
                >
                  <img src={img} className="w-full h-full object-cover" alt="thumbnail" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Details & Actions */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <span className="bg-[#2D9A54] text-white text-xs font-bold px-3 py-1 rounded-full w-fit">
              {listing.category?.name || 'Category'}
            </span>
            <h1 className="text-3xl md:text-4xl font-bold text-[#1A1A1A] leading-tight">
              {listing.title}
            </h1>
            <div className="flex items-center gap-4 text-gray-500 mt-2 text-sm">
              <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> Posted {formatDistanceToNow(new Date(listing.createdAt))} ago</span>
              <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> LPU Campus</span>
              <span className="flex items-center gap-1"><ShieldCheck className="w-4 h-4" /> Verified Student</span>
            </div>
          </div>

          <div className="flex items-end gap-3 pb-6 border-b border-[#E5E5E5]">
            <span className="text-4xl font-bold text-[#2D9A54]">₹{listing.price.toLocaleString('en-IN')}</span>
            {listing.negotiable && (
              <span className="text-sm font-medium bg-gray-100 text-gray-600 px-2 py-1 rounded mb-1 border border-gray-200">
                Price is negotiable
              </span>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <h3 className="text-lg font-bold text-[#1A1A1A]">Description</h3>
            <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">
              {listing.description}
            </p>
          </div>

          <div className="flex items-center gap-2 mt-2 bg-[#F9F9F9] p-4 rounded-xl border border-[#E5E5E5]">
            <Tag className="w-5 h-5 text-gray-400" />
            <span className="text-gray-600 font-medium mr-2">Condition:</span>
            <span className="bg-white px-3 py-1 border border-[#E5E5E5] rounded shadow-sm text-sm font-bold text-[#1A1A1A] uppercase tracking-wider">
              {listing.condition.replace('-', ' ')}
            </span>
          </div>

          <div className="mt-6 flex flex-col gap-4 bg-green-50/50 p-6 rounded-2xl border border-green-100">
            <h3 className="font-bold text-gray-800">Seller Information</h3>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                {listing.seller?.photoURL ? (
                  <img src={listing.seller.photoURL} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="font-bold text-gray-500">{listing.seller?.displayName?.charAt(0) || 'U'}</span>
                )}
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-[#1A1A1A]">{listing.seller?.displayName || 'Student Profile'}</span>
                <span className="text-sm text-gray-500">Member since {new Date(listing.seller?.createdAt).getFullYear() || '2026'}</span>
              </div>
            </div>
            
            <button 
              onClick={handleContact}
              disabled={contactLoading || contactStatus === 'rate_limited' || contactStatus === 'no_number'}
              className={`w-full mt-2 font-bold py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-colors
                ${contactStatus === 'success' ? 'bg-[#2D9A54] hover:bg-[#258246] text-white' : 
                  contactStatus === 'unauthorized' ? 'bg-[#1A1A1A] hover:bg-black text-white' :
                  contactStatus === 'rate_limited' ? 'bg-gray-200 text-gray-500 cursor-not-allowed' :
                  contactStatus === 'error' ? 'bg-red-500 hover:bg-red-600 text-white' :
                  contactStatus === 'no_number' ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed' :
                  'bg-[#2D9A54] hover:bg-[#258246] text-white'
                }
              `}
            >
              {contactLoading ? (
                <span className="animate-pulse">Loading contact...</span>
              ) : contactStatus === 'success' ? (
                <>Opening WhatsApp...</>
              ) : contactStatus === 'unauthorized' ? (
                <>Sign in to Contact</>
              ) : contactStatus === 'rate_limited' ? (
                <>Daily Limit Reached (50)</>
              ) : contactStatus === 'no_number' ? (
                <>No WhatsApp Provided</>
              ) : (
                <><MessageCircle className="w-5 h-5" /> Contact Seller on WhatsApp</>
              )}
            </button>
            {contactError && (
              <p className="text-xs text-center text-red-500 font-medium">
                {contactError}
              </p>
            )}
            <p className="text-xs text-center text-gray-500">
              Only verified LPU students can view contact details.
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}
