'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { Send, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function ContactPage() {
  const { user } = useAuth()
  
  const [formData, setFormData] = useState({ name: '', email: '', subject: 'general', message: '' })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'rate_limited' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  // Prefill when user state changes
  useEffect(() => {
    if (user) {
      setFormData(prev => ({ 
          ...prev, 
          name: prev.name || user.displayName || '', 
          email: prev.email || user.email || '' 
      }))
    }
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await res.json()

      if (res.status === 429) {
        setStatus('rate_limited')
        setErrorMsg(data.error)
        return
      }

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send message')
      }

      setStatus('success')
    } catch (err: any) {
      setStatus('error')
      setErrorMsg(err.message || 'Check your connection')
    }
  }

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
      
      <div className="w-full max-w-lg bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden p-8 lg:p-10">
        
        <header className="text-center mb-8">
          <h1 className="text-xl lg:text-2xl font-semibold text-gray-900">Contact us</h1>
          <p className="text-sm text-gray-500 mt-1 leading-relaxed">
            Have a question or need help with a listing? Send us a message and we'll get back to you soon.
          </p>
        </header>

        {status === 'success' ? (
          <div className="flex flex-col items-center justify-center py-10 text-center animate-in fade-in zoom-in duration-500">
             <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-6">
               <CheckCircle className="w-8 h-8 text-[#16a34a]"/>
             </div>
             <h2 className="text-lg font-semibold text-gray-900">Message sent</h2>
             <p className="text-sm text-gray-500 mt-2 max-w-sm">We've received your inquiry and will respond within 48 hours to your registered email address.</p>
             <button 
               onClick={() => { setStatus('idle'); setFormData({ name: '', email: '', subject: 'general', message: '' }) }}
               className="mt-8 text-xs font-semibold text-[#16a34a] border border-[#16a34a10] bg-green-50 px-6 py-2.5 rounded-lg hover:bg-green-100 transition-all"
             >
               Send another message
             </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest ml-1">Full Name</label>
              <input 
                required
                type="text" 
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                readOnly={!!user && !!user.displayName}
                className={cn(
                    "w-full h-10 px-3 rounded-lg border-none text-sm font-medium outline-none transition-all",
                    user ? "bg-gray-50 text-gray-400 cursor-not-allowed" : "bg-gray-100 focus:ring-2 focus:ring-[#16a34a10]"
                )}
                placeholder="Your name"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest ml-1">Email Address</label>
              <input 
                required
                type="email" 
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                readOnly={!!user && !!user.email}
                className={cn(
                    "w-full h-10 px-3 rounded-lg border-none text-sm font-medium outline-none transition-all",
                    user ? "bg-gray-50 text-gray-400 cursor-not-allowed" : "bg-gray-100 focus:ring-2 focus:ring-[#16a34a10]"
                )}
                placeholder="Your email"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest ml-1">Subject</label>
              <select 
                required
                value={formData.subject}
                onChange={e => setFormData({...formData, subject: e.target.value})}
                className="w-full h-10 px-3 bg-gray-100 border-none rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-[#16a34a10] cursor-pointer"
              >
                <option value="general">General Inquiry</option>
                <option value="complaint">Report a Problem</option>
                <option value="bug_report">Bug Report</option>
                <option value="ban_appeal">Ban Appeal</option>
                <option value="listing_dispute">Listing Dispute</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest ml-1">Message</label>
              <textarea 
                required
                minLength={10}
                maxLength={1000}
                rows={4}
                value={formData.message}
                onChange={e => setFormData({...formData, message: e.target.value})}
                className="w-full p-3 bg-gray-100 border-none rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-[#16a34a10] resize-none"
                placeholder="How can we help you?"
              />
              <div className="text-right">
                <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">{formData.message.length}/1000</span>
              </div>
            </div>

            {(status === 'error' || status === 'rate_limited') && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2 text-red-600 text-[11px] font-semibold">
                <AlertTriangle className="w-4 h-4 shrink-0" /> {errorMsg}
              </div>
            )}

            <button 
              disabled={status === 'loading'}
              type="submit" 
              className="w-full h-10 bg-[#16a34a] text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all hover:bg-[#15803d] disabled:opacity-50"
            >
              {status === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-3.5 h-3.5"/> Send message</>}
            </button>

          </form>
        )}

      </div>
    </div>
  )
}
