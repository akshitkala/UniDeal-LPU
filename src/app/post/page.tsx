'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { compressImage } from '@/lib/utils/compressImage'
import { validators, listingSchema } from '@/lib/utils/validate'
import { 
  ImagePlus, 
  X, 
  AlertCircle, 
  Loader2, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2,
  ShieldCheck,
  Tag,
  MessageCircle,
  Clock,
  Camera
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function PostListing() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [images, setImages] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
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

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch('/api/categories')
        if (res.ok) {
          const data = await res.json()
          setCategories(data)
        }
      } catch (err) {
        console.error('Category Sync Failed:', err)
      }
    }
    fetchCategories()
  }, [])

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    const files = Array.from(e.target.files)
    const combinedFiles = [...images, ...files].slice(0, 2)
    
    try {
      setLoading(true)
      const compressedFiles = await Promise.all(combinedFiles.map(async (file) => compressImage(file)))
      setImages(compressedFiles)
      const urls = compressedFiles.map(f => URL.createObjectURL(f))
      setPreviewUrls(prev => {
        prev.forEach(u => URL.revokeObjectURL(u))
        return urls
      })
      setError(null)
    } catch (err) {
      setError('Image compression bottleneck. Try smaller files.')
    } finally {
      setLoading(false)
    }
  }

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
    setPreviewUrls(prev => {
      URL.revokeObjectURL(prev[index])
      return prev.filter((_, i) => i !== index)
    })
  }

  const validateStep1 = () => {
    if (images.length === 0) return 'Add at least one photo.'
    if (formData.title.length < 3) return 'Title too short.'
    if (!formData.price || Number(formData.price) <= 0) return 'Invalid price.'
    if (!formData.category) return 'Select a category.'
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
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const rawData = {
      ...formData,
      price: Number(formData.price),
    }

    const validation = listingSchema.safeParse(rawData)
    if (!validation.success) {
      setError(validation.error.issues[0].message)
      return
    }

    setLoading(true)

    try {
      const dbFormData = new FormData()
      Object.entries(rawData).forEach(([key, val]) => {
        dbFormData.append(key, val.toString())
      })

      images.forEach((file) => {
        dbFormData.append('images', file)
      })

      const res = await fetch('/api/listings', {
        method: 'POST',
        body: dbFormData,
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Publishing fault')

      router.push(`/listing/${data.slug}`)
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="max-w-[1280px] mx-auto px-4 py-12 flex flex-col items-center">
      
      {/* Progress Stepper */}
      <div className="w-full max-w-lg flex items-center justify-between mb-12 relative px-4">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-100 -translate-y-1/2 z-0" />
          <div className={cn("absolute top-1/2 left-0 h-0.5 bg-[#2D9A54] -translate-y-1/2 transition-all duration-500 z-0", step === 1 ? "w-0" : "w-full")} />
          
          <div className={cn("relative z-10 w-10 h-10 rounded-full flex items-center justify-center font-black transition-all duration-500", step >= 1 ? "bg-[#2D9A54] text-white scale-110 shadow-lg shadow-[#2D9A54]/20" : "bg-white border-2 border-gray-100 text-gray-300")}>1</div>
          <div className={cn("relative z-10 w-10 h-10 rounded-full flex items-center justify-center font-black transition-all duration-500", step === 2 ? "bg-[#2D9A54] text-white scale-110 shadow-lg shadow-[#2D9A54]/20" : "bg-white border-2 border-gray-100 text-gray-300")}>2</div>
      </div>

      <div className="w-full max-w-2xl bg-white border border-gray-100 rounded-[3rem] shadow-premium p-8 md:p-14 animate-in fade-in zoom-in-95 duration-500">
        
        <header className="mb-10 text-center">
            <h1 className="text-4xl font-black text-gray-900 tracking-tighter mb-2">
                {step === 1 ? 'List your item' : 'Final Details'}
            </h1>
            <p className="text-gray-500 font-medium">Add your item to the campus marketplace.</p>
        </header>

        {error && (
            <div className="mb-8 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-sm font-bold animate-shake">
                <AlertCircle className="w-5 h-5 shrink-0" />
                {error}
            </div>
        )}

        {step === 1 ? (
            <div className="flex flex-col gap-8 animate-in slide-in-from-right-4 duration-500">
                {/* Images */}
                <div className="flex flex-col gap-3">
                    <label className="text-[10px] uppercase font-black tracking-widest text-gray-400 pl-1">Photos (Max 2)</label>
                    <div className="flex gap-4">
                        {previewUrls.map((url, i) => (
                            <div key={i} className="relative w-32 h-32 rounded-[2rem] border-4 border-white shadow-xl overflow-hidden group">
                                <img src={url} alt="preview" className="w-full h-full object-cover" />
                                <button onClick={() => removeImage(i)} className="absolute top-2 right-2 bg-black/60 backdrop-blur-md text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                        {previewUrls.length < 2 && (
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="w-32 h-32 rounded-[2rem] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-[#2D9A54] hover:text-[#2D9A54] hover:bg-emerald-50 transition-all active:scale-95"
                            >
                                <Camera className="w-6 h-6" />
                                <span className="text-[10px] font-black uppercase">Add Photo</span>
                            </button>
                        )}
                    </div>
                    <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageSelect} />
                </div>

                <div className="flex flex-col gap-6">
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] uppercase font-black tracking-widest text-gray-400 pl-1 text-sm font-bold">Item Headline</label>
                        <input 
                            placeholder="E.g. Macbook Pro M1 2020 Mint Condition"
                            className="w-full h-14 bg-gray-50 rounded-2xl px-6 font-bold text-gray-900 border-none focus:ring-4 focus:ring-[#2D9A54]/10 transition-all outline-none"
                            value={formData.title}
                            onChange={(e) => setFormData({...formData, title: e.target.value})}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex flex-col gap-2">
                             <label className="text-[10px] uppercase font-black tracking-widest text-gray-400 pl-1 text-sm font-bold">Ask Price (₹)</label>
                             <div className="relative">
                                <input 
                                    type="number"
                                    placeholder="2500"
                                    className="w-full h-14 bg-gray-50 rounded-2xl pl-12 pr-6 font-bold text-gray-900 border-none focus:ring-4 focus:ring-[#2D9A54]/10 transition-all outline-none"
                                    value={formData.price}
                                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                                />
                                <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-gray-400">₹</span>
                             </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] uppercase font-black tracking-widest text-gray-400 pl-1 text-sm font-bold">Sector/Category</label>
                            <select 
                                className="w-full h-14 bg-gray-50 rounded-2xl px-6 font-bold text-gray-900 border-none focus:ring-4 focus:ring-[#2D9A54]/10 transition-all outline-none appearance-none"
                                value={formData.category}
                                onChange={(e) => setFormData({...formData, category: e.target.value})}
                            >
                                <option value="">Select Category</option>
                                {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <input 
                        type="checkbox" 
                        id="neg"
                        className="w-5 h-5 accent-[#2D9A54]" 
                        checked={formData.negotiable}
                        onChange={(e) => setFormData({...formData, negotiable: e.target.checked})}
                    />
                    <label htmlFor="neg" className="text-sm font-bold text-gray-700 cursor-pointer select-none">Open to price negotiation</label>
                </div>

                <button 
                    onClick={nextStep}
                    className="w-full h-16 bg-[#1A1A1A] hover:bg-black text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-xl transition-all active:scale-95 mt-4"
                >
                    Continue to Step 2 <ArrowRight className="w-5 h-5" />
                </button>
            </div>
        ) : (
            <div className="flex flex-col gap-8 animate-in slide-in-from-right-4 duration-500">
                <div className="flex flex-col gap-2">
                    <label className="text-[10px] uppercase font-black tracking-widest text-gray-400 pl-1 text-sm font-bold">Description</label>
                    <textarea 
                        rows={5}
                        placeholder="Battery health, defects, accessories, etc."
                        className="w-full p-6 bg-gray-50 rounded-[2rem] font-bold text-gray-900 border-none focus:ring-4 focus:ring-[#2D9A54]/10 transition-all outline-none resize-none"
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] uppercase font-black tracking-widest text-gray-400 pl-1 text-sm font-bold">State/Condition</label>
                        <select 
                            className="w-full h-14 bg-gray-50 rounded-2xl px-6 font-bold text-gray-900 border-none focus:ring-4 focus:ring-[#2D9A54]/10 transition-all outline-none appearance-none"
                            value={formData.condition}
                            onChange={(e) => setFormData({...formData, condition: e.target.value})}
                        >
                            <option value="">Select Condition</option>
                            <option value="new">Brand New</option>
                            <option value="like-new">Like New</option>
                            <option value="good">Good State</option>
                            <option value="used">Used/Fair</option>
                            <option value="damaged">Damaged</option>
                        </select>
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] uppercase font-black tracking-widest text-gray-400 pl-1 text-sm font-bold">WhatsApp (+91)</label>
                        <input 
                            placeholder="9876543210"
                            className="w-full h-14 bg-gray-50 rounded-2xl px-6 font-bold text-gray-900 border-none focus:ring-4 focus:ring-[#2D9A54]/10 transition-all outline-none"
                            value={formData.whatsappNumber}
                            onChange={(e) => setFormData({...formData, whatsappNumber: e.target.value})}
                        />
                    </div>
                </div>

                <div className="bg-emerald-50/50 p-6 rounded-3xl border border-emerald-100 flex gap-4">
                    <ShieldCheck className="w-6 h-6 text-[#2D9A54] shrink-0" />
                    <div className="flex flex-col gap-1">
                        <span className="text-sm font-black text-emerald-950">Secure Connect</span>
                        <p className="text-xs text-emerald-800/60 font-bold leading-relaxed">
                            Buyers reach you via WhatsApp. No middlemen involved.
                        </p>
                    </div>
                </div>

                <div className="flex gap-4 mt-4">
                    <button 
                        onClick={() => setStep(1)}
                        className="h-16 px-8 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl font-black transition-all active:scale-95"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <button 
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex-1 h-16 bg-[#2D9A54] hover:bg-[#258246] text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-xl transition-all active:scale-95 disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <>Publish Listing <CheckCircle2 className="w-6 h-6" /></>}
                    </button>
                </div>
            </div>
        )}

      </div>
    </div>
  )
}
