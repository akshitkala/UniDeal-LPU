'use client'

import { useState } from 'react'
import { X, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ReportModalProps {
  slug: string
  isOpen: boolean
  onClose: () => void
}

const REASONS = [
  { id: 'fake_listing', label: 'Fake listing or misleading' },
  { id: 'wrong_price', label: 'Suspicious or incorrect price' },
  { id: 'already_sold', label: 'Item already sold' },
  { id: 'spam', label: 'Spam or offensive content' },
  { id: 'inappropriate', label: 'Forbidden or restricted item' },
  { id: 'other', label: 'Other' }
]

export function ReportModal({ slug, isOpen, onClose }: ReportModalProps) {
  const [reason, setReason] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async () => {
    if (!reason) return
    setLoading(true)
    setErrorMsg('')

    try {
      const res = await fetch(`/api/listings/${slug}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, description })
      })
      const data = await res.json()

      if (!res.ok) {
        setStatus('error')
        setErrorMsg(data.error || 'Failed to submit report')
      } else {
        setStatus('success')
        setTimeout(onClose, 2000)
      }
    } catch (err) {
      setStatus('error')
      setErrorMsg('Network error')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-8 border-b border-gray-50 flex items-center justify-between">
          <div className="flex flex-col">
            <h3 className="text-2xl font-black text-gray-950">Report Listing</h3>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Help us keep campus safe</span>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-950 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-8 flex flex-col gap-6">
          {status === 'success' ? (
            <div className="py-10 text-center flex flex-col items-center gap-4 animate-in fade-in slide-in-from-bottom-4">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="text-xl font-black text-emerald-950">Report Submitted</h4>
              <p className="text-sm font-medium text-emerald-900/60">Thank you. Our moderation team will review this shortly.</p>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-3">
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Select a Reason</p>
                <div className="grid grid-cols-1 gap-2">
                  {REASONS.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => setReason(r.id)}
                      className={cn(
                        "w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between",
                        reason === r.id ? "bg-emerald-50 border-emerald-500 text-emerald-950 font-bold" : "bg-white border-gray-100 text-gray-600 hover:border-gray-300"
                      )}
                    >
                      {r.label}
                      {reason === r.id && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                 <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Additional details (Optional)</p>
                 <textarea 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Tell us more about the issue..."
                    className="w-full h-24 p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all text-sm font-medium"
                 />
              </div>

              {status === 'error' && (
                <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 animate-shake">
                   <AlertCircle className="w-5 h-5 flex-shrink-0" />
                   <p className="text-xs font-bold">{errorMsg}</p>
                </div>
              )}

              <button 
                onClick={handleSubmit}
                disabled={loading || !reason}
                className={cn(
                  "w-full h-14 rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl disabled:opacity-50 disabled:shadow-none",
                  "bg-gray-900 border border-gray-900 hover:bg-black text-white shadow-gray-900/20"
                )}
              >
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Submit Report"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
