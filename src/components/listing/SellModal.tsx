'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  X, 
  Camera, 
  ArrowRight, 
  ArrowLeft, 
  Loader2, 
  CheckCircle2, 
  ShieldCheck,
  AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { compressImage } from '@/lib/utils/compressImage'
import { listingSchema } from '@/lib/utils/validate'

interface SellModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SellModal({ isOpen, onClose }: SellModalProps) {
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
    if (!isOpen) {
        // Reset state on close
        setStep(1)
        setError(null)
    } else {
        fetchCategories()
    }
  }, [isOpen])

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
      setError('Image compression bottleneck.')
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

  const handleSubmit = async () => {
    setError(null)
    const rawData = { ...formData, price: Number(formData.price) }
    const validation = listingSchema.safeParse(rawData)
    if (!validation.success) {
      setError(validation.error.issues[0].message)
      return
    }

    setLoading(true)
    try {
      const dbFormData = new FormData()
      Object.entries(rawData).forEach(([key, val]) => dbFormData.append(key, val.toString()))
      images.forEach((file) => dbFormData.append('images', file))

      const res = await fetch('/api/listings', { method: 'POST', body: dbFormData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Publishing fault')

      onClose()
      router.push(`/listing/${data.slug}`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div className={cn(
        "relative w-full bg-white shadow-2xl flex flex-col overflow-hidden transition-all duration-500",
        "md:max-w-xl md:rounded-[2.5rem] md:h-auto md:max-h-[85vh]",
        "rounded-t-[2.5rem] h-[92vh] max-h-[92vh] animate-in slide-in-from-bottom duration-500"
      )}>
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gray-100">
           <div 
             className="h-full bg-emerald-600 transition-all duration-500"
             style={{ width: `${(step / 2) * 100}%` }}
           />
        </div>

        {/* Header */}
        <div className="p-6 md:p-8 flex items-center justify-between border-b border-gray-100">
           <div>
              <h2 className="text-xl font-black text-gray-950 tracking-tight">
                {step === 1 ? 'Step 1: Basics' : 'Step 2: Details'}
              </h2>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Listing Creation Wizard</p>
           </div>
           <button 
             onClick={onClose}
             className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:text-gray-900 transition-colors"
           >
             <X className="w-5 h-5" />
           </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 hide-scrollbar focus-none">
           {error && (
               <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-sm font-bold animate-shake">
                   <AlertCircle className="w-5 h-5 shrink-0" /> {error}
               </div>
           )}

           {step === 1 ? (
               <div className="flex flex-col gap-8 animate-in slide-in-from-right-4 duration-300">
                  <div className="flex flex-col gap-3">
                     <label className="text-[10px] uppercase font-black tracking-widest text-gray-400">Add Photos (Max 2)</label>
                     <div className="flex gap-4">
                        {previewUrls.map((url, i) => (
                           <div key={i} className="relative w-24 h-24 rounded-2xl border-2 border-white shadow-lg overflow-hidden group">
                              <img src={url} alt="preview" className="w-full h-full object-cover" />
                              <button onClick={() => removeImage(i)} className="absolute top-1 right-1 bg-black/60 text-white p-1 rounded-full opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                <X className="w-2.5 h-2.5" />
                              </button>
                           </div>
                        ))}
                        {previewUrls.length < 2 && (
                           <button 
                             onClick={() => fileInputRef.current?.click()}
                             className="w-24 h-24 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-emerald-600 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
                           >
                             <Camera className="w-5 h-5" />
                             <span className="text-[8px] font-black uppercase">Add Photo</span>
                           </button>
                        )}
                        <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageSelect} />
                     </div>
                  </div>

                  <div className="flex flex-col gap-6">
                      <div className="flex flex-col gap-2">
                          <label className="text-[10px] uppercase font-black tracking-widest text-gray-400">Product Title</label>
                          <input 
                              placeholder="E.g. Macbook Pro M1 2020"
                              className="w-full h-12 bg-gray-50 rounded-xl px-4 font-bold text-sm border-none focus:ring-2 focus:ring-emerald-500/20 outline-none"
                              value={formData.title}
                              onChange={(e) => setFormData({...formData, title: e.target.value})}
                          />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div className="flex flex-col gap-2">
                             <label className="text-[10px] uppercase font-black tracking-widest text-gray-400">Price (₹)</label>
                             <input 
                                 type="number"
                                 placeholder="Amount"
                                 className="w-full h-12 bg-gray-50 rounded-xl px-4 font-bold text-sm border-none outline-none"
                                 value={formData.price}
                                 onChange={(e) => setFormData({...formData, price: e.target.value})}
                             />
                          </div>
                          <div className="flex flex-col gap-2">
                              <label className="text-[10px] uppercase font-black tracking-widest text-gray-400">Sector</label>
                              <select 
                                  className="w-full h-12 bg-gray-50 rounded-xl px-4 font-bold text-sm border-none outline-none appearance-none"
                                  value={formData.category}
                                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                              >
                                  <option value="">Select</option>
                                  {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                              </select>
                          </div>
                      </div>
                  </div>
               </div>
           ) : (
               <div className="flex flex-col gap-8 animate-in slide-in-from-right-4 duration-300">
                  <div className="flex flex-col gap-2">
                      <label className="text-[10px] uppercase font-black tracking-widest text-gray-400">Description</label>
                      <textarea 
                          rows={4}
                          placeholder="Condition, accessories, etc."
                          className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-sm border-none outline-none resize-none"
                          value={formData.description}
                          onChange={(e) => setFormData({...formData, description: e.target.value})}
                      />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-2">
                          <label className="text-[10px] uppercase font-black tracking-widest text-gray-400">Condition</label>
                          <select 
                              className="w-full h-12 bg-gray-50 rounded-xl px-4 font-bold text-sm border-none outline-none"
                              value={formData.condition}
                              onChange={(e) => setFormData({...formData, condition: e.target.value})}
                          >
                              <option value="">Select</option>
                              <option value="new">Brand New</option>
                              <option value="like-new">Like New</option>
                              <option value="good">Good</option>
                              <option value="used">Used</option>
                              <option value="damaged">Damaged</option>
                          </select>
                      </div>
                      <div className="flex flex-col gap-2">
                          <label className="text-[10px] uppercase font-black tracking-widest text-gray-400">WhatsApp</label>
                          <input 
                              placeholder="Mobile No."
                              className="w-full h-12 bg-gray-50 rounded-xl px-4 font-bold text-sm border-none outline-none"
                              value={formData.whatsappNumber}
                              onChange={(e) => setFormData({...formData, whatsappNumber: e.target.value})}
                          />
                      </div>
                  </div>
                  <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex gap-3">
                      <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                      <p className="text-[10px] text-emerald-800 font-bold leading-relaxed">
                        All items are reviewed by campus moderators. Duplicate listings or spam will result in a ban.
                      </p>
                  </div>
               </div>
           )}
        </div>

        {/* Footer */}
        <div className="p-6 md:px-8 md:pb-8 flex gap-3 border-t border-gray-50 bg-white">
           {step === 2 && (
               <button 
                 onClick={() => setStep(1)}
                 className="h-14 w-14 flex items-center justify-center bg-gray-100 text-gray-600 rounded-2xl font-black transition-all active:scale-95"
               >
                 <ArrowLeft className="w-5 h-5" />
               </button>
           )}
           <button 
             onClick={step === 1 ? nextStep : handleSubmit}
             disabled={loading}
             className="flex-1 h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-base flex items-center justify-center gap-2 shadow-xl shadow-emerald-600/20 transition-all active:scale-95 disabled:opacity-50"
           >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>
                    {step === 1 ? 'Next Phase' : 'Publish Asset'}
                    {step === 1 ? <ArrowRight className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                  </>
              )}
           </button>
        </div>
      </div>
    </div>
  )
}
