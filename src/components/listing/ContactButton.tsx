'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { MessageCircle, Lock, Loader2, AlertCircle } from 'lucide-react'
import { useAuth } from '@/components/auth/AuthProvider'
import { cn } from '@/lib/utils'

interface ContactButtonProps {
  slug: string
  sellerId: string
}

export function ContactButton({ slug, sellerId }: ContactButtonProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, loading: authLoading } = useAuth()
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<'rate_limited' | 'no_number' | 'error' | null>(null)

  const isOwnListing = user?.dbId === sellerId

  const handleContact = async () => {
    if (!user) {
      router.push(`/login?returnTo=${encodeURIComponent(pathname)}`)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/listings/${slug}/contact`, { method: 'POST' })
      const data = await res.json()

      if (res.status === 429) {
        setError('rate_limited')
      } else if (data.error === 'no_number') {
        setError('no_number')
      } else if (!res.ok) {
        setError('error')
      } else {
        window.open(data.waLink, '_blank')
      }
    } catch (err) {
      setError('error')
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="w-full h-16 bg-gray-100 rounded-2xl animate-pulse" />
    )
  }

  if (isOwnListing) {
    return (
      <button 
        disabled
        className="w-full h-16 bg-gray-50 border border-gray-200 text-gray-400 rounded-2xl font-black text-lg flex items-center justify-center gap-3"
      >
        Your own listing
      </button>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <button 
        onClick={handleContact}
        disabled={loading || error === 'rate_limited' || error === 'no_number'}
        className={cn(
          "w-full group h-14 sm:h-16 rounded-2xl font-bold sm:font-black text-base sm:text-lg flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl",
          !user ? "bg-gray-200 text-gray-500 hover:bg-gray-300 shadow-none border border-gray-300" :
          loading ? "bg-emerald-600/80 text-white cursor-wait" :
          error === 'rate_limited' ? "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed shadow-none" :
          error === 'no_number' ? "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed shadow-none" :
          "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20"
        )}
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : !user ? (
          <>
            <Lock className="w-4 h-4 opacity-40" /> 
            Sign in to Contact
          </>
        ) : error === 'rate_limited' ? (
          <>Daily limit reached</>
        ) : error === 'no_number' ? (
          <>Unavailable</>
        ) : (
          <>
            <MessageCircle className="w-5 h-5 group-hover:scale-110 transition-transform" /> 
            Contact on WhatsApp
          </>
        )}
      </button>

      {error === 'rate_limited' && (
        <p className="text-[10px] text-center font-bold text-gray-400 uppercase tracking-widest flex items-center justify-center gap-1">
          <AlertCircle className="w-3 h-3" /> Try again tomorrow
        </p>
      )}
    </div>
  )
}
