'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'

interface Category {
  _id: string
  name: string
  slug: string
}

export function CategorySlider() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeSlug = searchParams.get('category') || ''
  
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch('/api/categories')
        if (res.ok) {
          const data = await res.json()
          setCategories(data)
        }
      } catch (err) {
        console.error('Category Slider Sync Failed:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchCategories()
  }, [])

  const handleSelect = (slug: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (slug === 'all') {
      params.delete('category')
    } else {
      params.set('category', slug)
    }
    params.delete('cursor') // Reset pagination
    router.push(`/browse?${params.toString()}`)
  }

  if (loading && categories.length === 0) {
    return (
      <div className="w-full h-12 flex gap-3 overflow-hidden px-4 mb-8">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-full w-24 bg-gray-50 rounded-full animate-pulse border border-gray-100" />
        ))}
      </div>
    )
  }

  return (
    <div className="sticky top-16 left-0 right-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 py-3 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="flex gap-3 overflow-x-auto scrollbar-none pb-1 group">
         <button 
           onClick={() => handleSelect('all')}
           className={cn(
             "flex-shrink-0 h-9 px-6 rounded-full font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 border",
             !activeSlug ? "bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-500/20" : "bg-white border-gray-100 text-gray-400 hover:border-gray-900 shadow-sm"
           )}
         >
           All Branch
         </button>
         {categories.map((cat) => (
           <button 
             key={cat._id}
             onClick={() => handleSelect(cat.slug)}
             className={cn(
               "flex-shrink-0 h-9 px-6 rounded-full font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 border",
               activeSlug === cat.slug ? "bg-[#1A1A1A] border-gray-900 text-white shadow-lg" : "bg-white border-gray-100 text-gray-400 hover:border-gray-900 shadow-sm"
             )}
           >
             {cat.name}
           </button>
         ))}
      </div>
    </div>
  )
}
