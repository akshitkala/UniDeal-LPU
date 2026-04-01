'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { compressImage } from '@/lib/utils/compressImage'
import { validators } from '@/lib/utils/validate'
import { ImagePlus, X, AlertCircle, Loader2 } from 'lucide-react'

export default function PostListing() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [images, setImages] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    negotiable: false,
    category: '',
    condition: '',
    whatsappNumber: '',
  })

  // Basic categories (mock array for MVP, ideally fetched from DB)
  const categories = [
    { name: 'Electronics', slug: 'electronics' },
    { name: 'Books & Notes', slug: 'books-notes' },
    { name: 'Vehicles', slug: 'vehicles' },
    { name: 'Fashion', slug: 'fashion' },
    { name: 'Hobbies & Sports', slug: 'hobbies-sports' },
    { name: 'Dorm Setup', slug: 'dorm-setup' }
  ]

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    
    // Convert FileList to Array and cap at 2 maximum overall
    const files = Array.from(e.target.files)
    const combinedFiles = [...images, ...files].slice(0, 2)
    
    try {
      setLoading(true)
      // Compress immediately on client-side
      const compressedFiles = await Promise.all(combinedFiles.map(async (file) => {
         // Re-compress existing previously compressed ones? No, just compress the new ones
         // Actually simpler to compress all files just to be safe if array changed
         return compressImage(file)
      }))

      setImages(compressedFiles)
      
      // Generate preview URLs
      const urls = compressedFiles.map(f => URL.createObjectURL(f))
      setPreviewUrls(prev => {
        prev.forEach(u => URL.revokeObjectURL(u)) // cleanup memory
        return urls
      })
      
      setError(null)
    } catch (err) {
      setError('Failed to compress one or more images.')
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Data prep
    const rawData = {
      ...formData,
      price: Number(formData.price),
    }

    // Client Validation
    const validation = validators.createListing.safeParse(rawData)
    if (!validation.success) {
      // Pick the first error message
      setError(validation.error.issues[0].message)
      return
    }

    if (images.length === 0) {
      setError('Please add at least 1 image of your item.')
      return
    }

    setLoading(true)

    try {
      const dbFormData = new FormData()
      dbFormData.append('title', rawData.title)
      dbFormData.append('description', rawData.description)
      dbFormData.append('price', rawData.price.toString())
      dbFormData.append('negotiable', rawData.negotiable.toString())
      dbFormData.append('category', rawData.category)
      dbFormData.append('condition', rawData.condition)
      if (rawData.whatsappNumber) {
        dbFormData.append('whatsappNumber', rawData.whatsappNumber)
      }

      images.forEach((file) => {
        dbFormData.append('images', file)
      })

      const res = await fetch('/api/listings', {
        method: 'POST',
        body: dbFormData,
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to post listing')
      }

      // Success
      router.push(`/listing/${data.slug}`)
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto mt-8 mb-16">
      <h1 className="text-3xl font-bold text-[#1A1A1A] mb-2">Post a Deal</h1>
      <p className="text-gray-500 mb-8 border-b border-gray-200 pb-4">
        Items listed here enter a secure AI checking queue to prevent spam and scams before appearing in the campus feed.
      </p>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-start gap-3 mb-6 border border-red-100">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p className="font-medium text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        
        {/* Images */}
        <div className="flex flex-col gap-2">
          <label className="font-bold text-[#1A1A1A]">Item Images <span className="text-red-500">*</span></label>
          <span className="text-xs text-gray-500 mb-2">Max 2 images. Images will be vertically aligned in the thumbnail crop.</span>
          
          <div className="flex gap-4 flex-wrap">
            {previewUrls.map((url, i) => (
              <div key={i} className="relative w-32 h-32 rounded-xl border border-gray-200 overflow-hidden group">
                <img src={url} alt="upload preview" className="w-full h-full object-cover" />
                <button 
                  type="button" 
                  onClick={() => removeImage(i)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 shadow hover:bg-red-600 transition"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            
            {previewUrls.length < 2 && (
              <button 
                type="button"
                className="w-32 h-32 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-2 hover:border-[#2D9A54] hover:bg-green-50/30 transition text-gray-500 hover:text-[#2D9A54] disabled:opacity-50"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
              >
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <ImagePlus className="w-6 h-6" />}
                <span className="text-xs font-medium">Add Photo</span>
              </button>
            )}
          </div>
          <input 
            type="file" 
            accept="image/*" 
            multiple 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleImageSelect} 
          />
        </div>

        {/* Title & Price */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 flex flex-col gap-2">
            <label className="font-bold text-[#1A1A1A]">Title <span className="text-red-500">*</span></label>
            <input 
              required
              maxLength={100}
              placeholder="E.g. Macbook Pro M1 2020 Mint Condition"
              className="w-full p-3 bg-[#F9F9F9] border border-[#E5E5E5] rounded-lg focus:outline-none focus:border-[#2D9A54]"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
            />
          </div>
          <div className="flex flex-col gap-2 relative">
            <label className="font-bold text-[#1A1A1A]">Price (₹) <span className="text-red-500">*</span></label>
            <input 
              required
              type="number"
              min="0"
              max="999999"
              placeholder="2500"
              className="w-full p-3 bg-[#F9F9F9] border border-[#E5E5E5] rounded-lg focus:outline-none focus:border-[#2D9A54]"
              value={formData.price}
              onChange={(e) => setFormData({...formData, price: e.target.value})}
            />
            <label className="flex items-center gap-2 mt-2 cursor-pointer">
              <input 
                type="checkbox" 
                className="w-4 h-4 accent-[#2D9A54]" 
                checked={formData.negotiable}
                onChange={(e) => setFormData({...formData, negotiable: e.target.checked})}
              />
              <span className="text-sm text-gray-600 font-medium select-none">Negotiable</span>
            </label>
          </div>
        </div>

        {/* Category & Condition */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <label className="font-bold text-[#1A1A1A]">Category <span className="text-red-500">*</span></label>
            <select 
              required
              className="w-full p-3 bg-[#F9F9F9] border border-[#E5E5E5] rounded-lg focus:outline-none focus:border-[#2D9A54] appearance-none"
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
            >
              <option value="" disabled>Select a Category...</option>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>{c.name}</option>
              ))}
            </select>
          </div>
          
          <div className="flex flex-col gap-2">
            <label className="font-bold text-[#1A1A1A]">Condition <span className="text-red-500">*</span></label>
            <select 
              required
              className="w-full p-3 bg-[#F9F9F9] border border-[#E5E5E5] rounded-lg focus:outline-none focus:border-[#2D9A54] appearance-none"
              value={formData.condition}
              onChange={(e) => setFormData({...formData, condition: e.target.value})}
            >
              <option value="" disabled>Select Item Condition...</option>
              <option value="new">Brand New (Unopened)</option>
              <option value="like-new">Like New (Barely used)</option>
              <option value="good">Good (Normal wear)</option>
              <option value="used">Used (Noticeable wear)</option>
              <option value="damaged">Damaged (Needs repair)</option>
            </select>
          </div>
        </div>

        {/* Description */}
        <div className="flex flex-col gap-2">
          <label className="font-bold text-[#1A1A1A]">Description <span className="text-red-500">*</span></label>
          <textarea 
            required
            rows={5}
            placeholder="Provide all essential details. Mention battery health, warranty status, accessories included, or any defects to avoid buyer disputes."
            className="w-full p-3 bg-[#F9F9F9] border border-[#E5E5E5] rounded-lg focus:outline-none focus:border-[#2D9A54] resize-none"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
          />
        </div>

        {/* Contact Info */}
        <div className="flex flex-col gap-2 bg-gray-50 p-4 rounded-xl border border-gray-200 mt-2">
          <label className="font-bold text-[#1A1A1A]">WhatsApp Contact Number</label>
          <span className="text-xs text-gray-500 mb-2">We will never display your number publicly. Buyers click a button to initiate a chat with you. Must include country code (+91).</span>
          <input 
            type="text"
            placeholder="+919876543210"
            className="w-full p-3 bg-white border border-[#E5E5E5] rounded-lg focus:outline-none focus:border-[#2D9A54]"
            value={formData.whatsappNumber}
            onChange={(e) => setFormData({...formData, whatsappNumber: e.target.value})}
          />
        </div>

        {/* Submission */}
        <button 
          type="submit" 
          disabled={loading}
          className="w-full mt-4 bg-[#2D9A54] hover:bg-[#258246] transition-colors text-white font-bold text-lg py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 disabled:opacity-75"
        >
          {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Publishing...</> : 'Publish Listing'}
        </button>

      </form>
    </div>
  )
}
