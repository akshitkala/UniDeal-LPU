'use client'

import { useState, useEffect } from 'react'
import { Send, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react'

export default function ContactPage() {
  const [user, setUser] = useState<{ displayName?: string, email?: string } | null>(null)
  
  const [formData, setFormData] = useState({ name: '', email: '', subject: 'general', message: '' })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'rate_limited' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    // Native manual fetch for active session
    let mounted = true
    const checkSession = async () => {
      try {
        const res = await fetch('/api/user/me')
        if (res.ok) {
          const data = await res.json()
          if (mounted) {
            setUser(data)
            setFormData(prev => ({ ...prev, name: data.displayName || '', email: data.email || '' }))
          }
        }
      } catch (e) { /* silent fail on guest */ }
    }
    checkSession()
    return () => { mounted = false }
  }, [])

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
        throw new Error(data.error || 'Transmission failed')
      }

      setStatus('success')
    } catch (err: any) {
      setStatus('error')
      setErrorMsg(err.message || 'Network anomaly detected')
    }
  }

  return (
    <div className="min-h-screen bg-[#FBFBFB] flex flex-col items-center justify-center p-4">
      
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-sm border border-[#E5E5E5] overflow-hidden p-8">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-[#1A1A1A]">Contact Support</h1>
          <p className="text-gray-500 mt-2 text-sm leading-relaxed">
            Need to dispute a listing moderation or report fraudulent activity? Securely submit a ticket directly to the administration.
          </p>
        </div>

        {status === 'success' ? (
          <div className="flex flex-col items-center justify-center py-10 text-center animate-in fade-in zoom-in duration-500">
             <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
               <CheckCircle className="w-8 h-8 text-[#2D9A54]"/>
             </div>
             <h2 className="text-2xl font-bold text-gray-900">Message Sent</h2>
             <p className="text-gray-500 mt-2">Your inquiry has been received. Expect a response from UniDeal Support within 48 hours to your associated email.</p>
             <button 
               onClick={() => { setStatus('idle'); setFormData({ name: '', email: '', subject: 'general', message: '' }) }}
               className="mt-6 font-semibold text-[#2D9A54] border border-[#2D9A54] px-6 py-2 rounded-xl hover:bg-green-50 transition"
             >
               Submit Another Inquiry
             </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-gray-700">Full Name</label>
              <input 
                required
                type="text" 
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                readOnly={!!user && !!user.displayName}
                className={`h-12 rounded-xl px-4 border ${user ? 'bg-gray-100 text-gray-500 border-gray-200' : 'bg-white border-[#E5E5E5] focus:border-[#2D9A54] focus:ring-1 focus:ring-[#2D9A54] outline-none transition'}`}
                placeholder="Enter your name"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-gray-700">Email Address</label>
              <input 
                required
                type="email" 
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                readOnly={!!user && !!user.email}
                className={`h-12 rounded-xl px-4 border ${user ? 'bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed' : 'bg-white border-[#E5E5E5] focus:border-[#2D9A54] focus:ring-1 focus:ring-[#2D9A54] outline-none transition'}`}
                placeholder="Enter your email"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-gray-700">Message</label>
              <textarea 
                required
                minLength={10}
                maxLength={1000}
                rows={5}
                value={formData.message}
                onChange={e => setFormData({...formData, message: e.target.value})}
                className="rounded-xl p-4 border border-[#E5E5E5] bg-white text-gray-900 focus:border-[#2D9A54] focus:ring-1 focus:ring-[#2D9A54] outline-none transition resize-none"
                placeholder="How can we help you?"
              />
              <span className="text-xs text-right text-gray-400 font-mono">{formData.message.length}/1000</span>
            </div>

            {(status === 'error' || status === 'rate_limited') && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-2 border border-red-100">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                {errorMsg}
              </div>
            )}

            <button 
              disabled={status === 'loading'}
              type="submit" 
              className="mt-2 h-12 w-full bg-[#1A1A1A] hover:bg-black text-white font-bold rounded-xl transition-all shadow-[0_4px_14px_0_rgba(0,0,0,0.1)] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {status === 'loading' ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-4 h-4"/> Send Message</>}
            </button>

          </form>
        )}

      </div>
    </div>
  )
}
