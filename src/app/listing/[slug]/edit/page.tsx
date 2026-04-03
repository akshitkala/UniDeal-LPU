'use client'

import { useState, useEffect, useRef, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ChevronLeft, 
  Loader2, 
  Camera, 
  X, 
  AlertCircle, 
  ShieldCheck, 
  CheckCircle2,
  Trash2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { compressImage } from '@/lib/utils/compressImage'

interface EditListingProps {
  params: Promise<{ slug: string }>
}

export default function EditListing({ params }: EditListingProps) {
  const router = useRouter()
  const { slug } = use(params)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Data States
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [categories, setCategories] = useState<any[]>([])
  
  // Listing States
  const [existingImages, setExistingImages] = useState<string[]>([])
  const [newImages, setNewImages] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    negotiable: false,
    category: '',
    condition: '',
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, listRes] = await Promise.all([
          fetch('/api/categories'),
          fetch(`/api/listings/${slug}`)
        ])

        if (!catRes.ok || !listRes.ok) throw new Error('Failed to load data')

        const cats = await catRes.json()
        const { listing } = await listRes.json()

        setCategories(cats)
        setExistingImages(listing.images || [])
        setFormData({
          title: listing.title,
          description: listing.description,
          price: listing.price.toString(),
          negotiable: listing.negotiable,
          category: listing.category?._id || listing.category,
          condition: listing.condition,
        })
      } catch (err) {
        setError('Could not load listing details.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [slug])

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    const files = Array.from(e.target.files)
    const availableSlots = 2 - existingImages.length - newImages.length
    if (availableSlots <= 0) return

    const filesToAdd = files.slice(0, availableSlots)
    
    try {
      setSubmitting(true)
      const compressed = await Promise.all(filesToAdd.map(f => compressImage(f)))
      setNewImages(prev => [...prev, ...compressed])
      const urls = compressed.map(f => URL.createObjectURL(f))
      setPreviewUrls(prev => [...prev, ...urls])
    } catch (err) {
      setError('Failed to process images.')
    } finally {
      setSubmitting(false)
    }
  }

  const removeExistingImage = (url: string) => {
    setExistingImages(prev => prev.filter(u => u !== url))
  }

  const removeNewImage = (index: number) => {
    setNewImages(prev => prev.filter((_, i) => i !== index))
    setPreviewUrls(prev => {
      URL.revokeObjectURL(prev[index])
      return prev.filter((_, i) => i !== index)
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const data = new FormData()
      data.append('title', formData.title)
      data.append('description', formData.description)
      data.append('price', formData.price)
      data.append('negotiable', formData.negotiable.toString())
      data.append('category', formData.category)
      data.append('condition', formData.condition)

      existingImages.forEach(url => data.append('existingImages', url))
      newImages.forEach(file => data.append('images', file))

      const res = await fetch(`/api/listings/${slug}`, {
        method: 'PATCH',
        body: data
      })

      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error || 'Update failed')
      }

      router.push('/dashboard')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-8 h-8 text-[#16a34a] animate-spin" />
        <p className="text-sm text-gray-500 font-medium">Loading listing details...</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      
      {/* Back link */}
      <Link 
        href="/dashboard" 
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-8 font-medium transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>

      <header className="mb-10">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Edit listing</h1>
        <p className="text-sm text-gray-500 mt-1.5">
          Changes will go back under review before going live.
        </p>
      </header>

      {error && (
        <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-700 text-sm font-medium">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Visual Assets */}
        <section className="space-y-4">
            <label className="text-[11px] font-bold uppercase text-gray-400 tracking-widest px-1">Listing Photos (Max 2)</label>
            <div className="flex gap-4">
                {/* Existing Images */}
                {existingImages.map((url, i) => (
                    <div key={url} className="relative w-32 h-32 rounded-2xl border border-gray-100 overflow-hidden bg-gray-50 group shadow-sm">
                        <img src={url} alt="listing" className="w-full h-full object-cover" />
                        <button 
                            type="button"
                            onClick={() => removeExistingImage(url)} 
                            className="absolute top-2 right-2 bg-white/90 text-red-500 p-1.5 rounded-full hover:bg-red-500 hover:text-white transition-all shadow-sm"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                ))}

                {/* New Image Previews */}
                {previewUrls.map((url, i) => (
                    <div key={url} className="relative w-32 h-32 rounded-2xl border border-gray-100 overflow-hidden bg-gray-50 group shadow-sm">
                        <img src={url} alt="preview" className="w-full h-full object-cover" />
                        <button 
                            type="button"
                            onClick={() => removeNewImage(i)} 
                            className="absolute top-2 right-2 bg-white/90 text-red-500 p-1.5 rounded-full hover:bg-red-500 hover:text-white transition-all shadow-sm"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                ))}

                {/* Add Button */}
                {(existingImages.length + newImages.length) < 2 && (
                    <button 
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-32 h-32 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-[#16a34a] hover:text-[#16a34a] hover:bg-green-50 transition-all group"
                    >
                        <Camera className="w-6 h-6 group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-bold uppercase tracking-tight">Add Photo</span>
                    </button>
                )}
            </div>
            <input 
                ref={fileInputRef} 
                type="file" 
                accept="image/*" 
                multiple 
                className="hidden" 
                onChange={handleImageSelect} 
            />
        </section>

        {/* Basic Info */}
        <section className="space-y-5">
            <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase text-gray-400 tracking-widest px-1">Item Title</label>
                <input 
                    required
                    maxLength={100}
                    className="w-full h-12 bg-gray-50 rounded-xl px-4 text-sm font-semibold text-gray-900 border border-gray-100 focus:ring-2 focus:ring-[#16a34a10] focus:border-[#16a34a] outline-none transition-all placeholder:text-gray-300"
                    placeholder="What are you selling?"
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase text-gray-400 tracking-widest px-1">Price (₹)</label>
                    <input 
                        required
                        type="number"
                        className="w-full h-12 bg-gray-50 rounded-xl px-4 text-sm font-semibold text-gray-900 border border-gray-100 focus:ring-2 focus:ring-[#16a34a10] focus:border-[#16a34a] outline-none transition-all"
                        placeholder="0.00"
                        value={formData.price}
                        onChange={e => setFormData({...formData, price: e.target.value})}
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase text-gray-400 tracking-widest px-1">Category</label>
                    <select 
                        required
                        className="w-full h-12 bg-gray-50 rounded-xl px-4 text-sm font-semibold text-gray-900 border border-gray-100 focus:ring-2 focus:ring-[#16a34a10] focus:border-[#16a34a] outline-none transition-all cursor-pointer"
                        value={formData.category}
                        onChange={e => setFormData({...formData, category: e.target.value})}
                    >
                        <option value="">Select category</option>
                        {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase text-gray-400 tracking-widest px-1">Condition</label>
                <select 
                    required
                    className="w-full h-12 bg-gray-50 rounded-xl px-4 text-sm font-semibold text-gray-900 border border-gray-100 focus:ring-2 focus:ring-[#16a34a10] focus:border-[#16a34a] outline-none transition-all cursor-pointer"
                    value={formData.condition}
                    onChange={e => setFormData({...formData, condition: e.target.value})}
                >
                    <option value="">Select condition</option>
                    <option value="new">Brand New</option>
                    <option value="like-new">Like New</option>
                    <option value="good">Good</option>
                    <option value="used">Used</option>
                    <option value="damaged">Damaged</option>
                </select>
            </div>
        </section>

        {/* Detailed Description */}
        <section className="space-y-2">
            <label className="text-[11px] font-bold uppercase text-gray-400 tracking-widest px-1">Description</label>
            <textarea 
                required
                rows={6}
                maxLength={2000}
                className="w-full p-4 bg-gray-50 rounded-2xl text-sm font-semibold text-gray-900 border border-gray-100 focus:ring-2 focus:ring-[#16a34a10] focus:border-[#16a34a] outline-none transition-all resize-none placeholder:text-gray-300"
                placeholder="Describe your item details, defects, and pickup location..."
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
            />
        </section>

        <section className="flex items-center gap-3 p-5 bg-gray-50 rounded-2xl border border-gray-100 shadow-sm transition-all hover:bg-gray-100/50">
            <input 
                type="checkbox" 
                id="neg"
                className="w-5 h-5 accent-[#16a34a] rounded-lg cursor-pointer" 
                checked={formData.negotiable}
                onChange={(e) => setFormData({...formData, negotiable: e.target.checked})}
            />
            <label htmlFor="neg" className="text-xs font-bold text-gray-700 cursor-pointer select-none">
                Open to price negotiation
            </label>
        </section>

        {/* Safety Note */}
        <div className="p-5 bg-green-50 border border-green-100 rounded-2xl flex gap-4 text-green-700">
            <ShieldCheck className="w-6 h-6 shrink-0 mt-0.5" />
            <div className="space-y-1">
                <p className="text-sm font-bold tracking-tight">Trust & Safety</p>
                <p className="text-xs font-medium leading-relaxed opacity-80">
                    Edits are re-verified by AI and moderators. Your listing will be temporarily hidden from the public feed until it passes verification.
                </p>
            </div>
        </div>

        {/* Final Actions */}
        <div className="flex gap-4 pt-6">
            <button 
                type="button"
                onClick={() => router.back()}
                className="h-12 px-6 bg-gray-100 text-gray-600 rounded-full text-sm font-bold hover:bg-gray-200 transition-all active:scale-95"
            >
                Cancel
            </button>
            <button 
                type="submit"
                disabled={submitting}
                className="flex-1 h-12 bg-[#16a34a] text-white rounded-full text-sm font-bold flex items-center justify-center gap-2 hover:bg-green-700 transition-all disabled:opacity-50 active:scale-[0.98] shadow-lg shadow-green-600/10"
            >
                {submitting ? (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Updating...
                    </>
                ) : (
                    <>
                        Save Changes
                        <CheckCircle2 className="w-4 h-4" />
                    </>
                )}
            </button>
        </div>
      </form>

    </div>
  )
}
