'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { listingSchema } from '@/lib/utils/validate'
import { 
  X, 
  AlertCircle, 
  Loader2, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2,
  ShieldCheck,
  Camera,
  Save
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function EditListing() {
  const router = useRouter()
  const { slug } = useParams()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [categories, setCategories] = useState<any[]>([])
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    negotiable: false,
    category: '',
    condition: '',
    whatsappNumber: '',
  })
  const [currentImages, setCurrentImages] = useState<string[]>([])

  const fetchData = useCallback(async () => {
    try {
      // 1. Fetch Categories
      const catRes = await fetch('/api/categories')
      const cats = await catRes.json()
      setCategories(cats)

      // 2. Fetch Listing
      const listRes = await fetch(`/api/listings/${slug}`)
      const data = await listRes.json()
      
      if (!listRes.ok) throw new Error('Listing not found')
      
      const l = data.listing
      setFormData({
        title: l.title,
        description: l.description,
        price: l.price.toString(),
        negotiable: l.negotiable,
        category: l.category?._id || l.category,
        condition: l.condition,
        whatsappNumber: l.whatsappNumber || '',
      })
      setCurrentImages(l.images || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load listing')
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const validateStep1 = () => {
    if (formData.title.length < 3) return 'Title must be at least 3 characters'
    if (!formData.price || Number(formData.price) <= 0) return 'Enter a valid price'
    if (!formData.category) return 'Select a category'
    return null
  }

  const nextStep = () => {
    const err = validateStep1()
    if (err) {
       setError(err)
       return
    }
    setError(null)
    setStep(2)
    window.scrollTo(0, 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const rawData = {
      ...formData,
      price: Number(formData.price),
    }

    // Note: We don't re-validate images for simple text edit via PATCH
    // Since images are currently read-only in this simple edit view

    setSaving(true)

    try {
      const res = await fetch(`/api/listings/${slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rawData),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update listing')
      }

      router.push(`/listing/${slug}`)
    } catch (err: any) {
      setError(err.message)
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
        <p className="text-sm text-gray-500 mt-4 font-medium">Loading listing details...</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 flex flex-col items-center">
      
      {/* Simple Stepper */}
      <div className="w-full flex items-center justify-center gap-2 mb-10">
          <div className={cn("h-1 flex-1 rounded-full", step >= 1 ? "bg-[#16a34a]" : "bg-gray-100")} />
          <div className={cn("h-1 flex-1 rounded-full", step >= 2 ? "bg-[#16a34a]" : "bg-gray-100")} />
      </div>

      <div className="w-full bg-white border border-gray-100 rounded-xl shadow-sm p-6 sm:p-10">
        
        <header className="mb-8 text-center">
            <h1 className="text-xl lg:text-2xl font-semibold text-gray-900 leading-none">
                Edit listing
            </h1>
            <p className="text-sm text-gray-500 mt-1.5">Update your item details</p>
        </header>

        {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2 text-red-600 text-xs font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
            </div>
        )}

        {step === 1 ? (
            <div className="space-y-6">
                {/* Images (Read only for now in simple edit) */}
                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest pl-1">Photos (Current)</label>
                    <div className="flex gap-4">
                        {currentImages.map((url, i) => (
                            <div key={i} className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-lg border border-gray-100 overflow-hidden bg-gray-50">
                                <img src={url} alt="preview" className="w-full h-full object-contain p-2" />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest pl-1">Item Title</label>
                        <input 
                            placeholder="e.g. Lab Coat, Engineering Graphics Set"
                            className="w-full h-10 bg-gray-100 rounded-lg px-3 text-sm font-medium text-gray-900 border-none focus:ring-2 focus:ring-[#16a34a10] outline-none"
                            value={formData.title}
                            onChange={(e) => setFormData({...formData, title: e.target.value})}
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                             <label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest pl-1">Price (₹)</label>
                             <input 
                                type="number"
                                placeholder="0.00"
                                className="w-full h-10 bg-gray-100 rounded-lg px-3 text-sm font-medium text-gray-900 border-none focus:ring-2 focus:ring-[#16a34a10] outline-none"
                                value={formData.price}
                                onChange={(e) => setFormData({...formData, price: e.target.value})}
                             />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest pl-1">Category</label>
                            <select 
                                className="w-full h-10 bg-gray-100 rounded-lg px-3 text-sm font-medium text-gray-900 border-none focus:ring-2 focus:ring-[#16a34a10] outline-none cursor-pointer"
                                value={formData.category}
                                onChange={(e) => setFormData({...formData, category: e.target.value})}
                            >
                                <option value="">Select category...</option>
                                {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <input 
                        type="checkbox" 
                        id="neg"
                        className="w-4 h-4 accent-[#16a34a] rounded" 
                        checked={formData.negotiable}
                        onChange={(e) => setFormData({...formData, negotiable: e.target.checked})}
                    />
                    <label htmlFor="neg" className="text-xs font-semibold text-gray-600 cursor-pointer select-none">Open to price negotiation</label>
                </div>

                <button 
                    onClick={nextStep}
                    className="w-full h-10 bg-[#16a34a] text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 hover:bg-[#15803d] transition-all"
                >
                    Continue <ArrowRight className="w-4 h-4" />
                </button>
            </div>
        ) : (
            <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-500">
                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest pl-1">Description</label>
                    <textarea 
                        rows={5}
                        placeholder="Condition, defects, accessories, or pickup details..."
                        className="w-full p-3 bg-gray-100 rounded-lg text-sm font-medium text-gray-900 border-none focus:ring-2 focus:ring-[#16a34a10] outline-none resize-none"
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest pl-1">Condition</label>
                        <select 
                            className="w-full h-10 bg-gray-100 rounded-lg px-3 text-sm font-medium text-gray-900 border-none focus:ring-2 focus:ring-[#16a34a10] outline-none cursor-pointer"
                            value={formData.condition}
                            onChange={(e) => setFormData({...formData, condition: e.target.value})}
                        >
                            <option value="">Select condition...</option>
                            <option value="new">Brand New</option>
                            <option value="like-new">Like New</option>
                            <option value="good">Good</option>
                            <option value="used">Used</option>
                            <option value="damaged">Damaged</option>
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest pl-1">WhatsApp (+91)</label>
                        <input 
                            placeholder="9876543210"
                            className="w-full h-10 bg-gray-100 rounded-lg px-3 text-sm font-medium text-gray-900 border-none focus:ring-2 focus:ring-[#16a34a10] outline-none"
                            value={formData.whatsappNumber}
                            onChange={(e) => setFormData({...formData, whatsappNumber: e.target.value})}
                        />
                    </div>
                </div>

                <div className="p-4 bg-amber-50 border border-amber-100 rounded-lg flex gap-3 text-amber-700">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <div>
                        <p className="text-xs font-semibold leading-relaxed">
                            Updating your listing will move it back to the evaluation queue for moderator review.
                        </p>
                    </div>
                </div>

                <div className="flex gap-4 pt-2">
                    <button 
                        onClick={() => setStep(1)}
                        className="h-10 px-4 bg-gray-100 text-gray-500 rounded-lg text-xs font-semibold hover:bg-gray-200 transition-all"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={handleSubmit}
                        disabled={saving}
                        className="flex-1 h-10 bg-[#16a34a] text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 hover:bg-[#15803d] transition-all disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Save changes <Save className="w-4 h-4" /></>}
                    </button>
                </div>
            </div>
        )}

      </div>
    </div>
  )
}
