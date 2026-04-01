'use client'

import { useState } from 'react'
import { X, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react'

const REASONS = [
  { value: 'fake_listing', label: 'Fake listing' },
  { value: 'wrong_price', label: 'Wrong price' },
  { value: 'inappropriate', label: 'Inappropriate content' },
  { value: 'already_sold', label: 'Already sold' },
  { value: 'spam', label: 'Spam' },
  { value: 'other', label: 'Other' },
] as const

interface ReportModalProps {
  slug: string
  onClose: () => void
}

/**
 * S-10: Report Listing Modal (Fix 16).
 * Features: reason selection, description, and success state.
 */
export function ReportModal({ slug, onClose }: ReportModalProps) {
  const [reason, setReason] = useState<string>('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    if (!reason) return
    setLoading(true)
    setError(null)
    
    try {
      const res = await fetch(`/api/listings/${slug}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, description })
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        setError(data.error || 'Submission failed')
      } else {
        setDone(true)
      }
    } catch (err) {
      setError('Network disruption')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h2 className="text-xl font-bold text-gray-900">Report Listing</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {done ? (
          <div className="p-8 text-center flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-[#2D9A54]" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Feedback Recorded</h3>
              <p className="text-gray-500 mt-1 max-w-xs mx-auto">
                Our moderation team will review this listing shortly. Thank you for keeping the campus safe.
              </p>
            </div>
            <button 
              onClick={onClose}
              className="mt-4 px-8 py-2 bg-gray-900 text-white font-bold rounded-lg hover:bg-gray-800 transition-colors"
            >
              Close
            </button>
          </div>
        ) : (
          <div className="p-6 space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm font-medium">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Primary Reason</label>
              <select 
                value={reason} 
                onChange={e => setReason(e.target.value)}
                className="w-full h-11 border border-gray-200 rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-[#2D9A54]/20 focus:border-[#2D9A54] transition-all bg-white"
              >
                <option value="">Select a reason</option>
                {REASONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Additional Context (Optional)</label>
              <textarea 
                value={description} 
                onChange={e => setDescription(e.target.value.slice(0, 500))}
                placeholder="Provide details about why this listing violates campus policy..."
                className="w-full h-32 border border-gray-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#2D9A54]/20 focus:border-[#2D9A54] transition-all resize-none text-sm"
              />
              <div className="text-right text-[10px] text-gray-400 mt-1">
                {description.length}/500 characters
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button 
                onClick={onClose} 
                className="h-11 border border-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSubmit} 
                disabled={!reason || loading}
                className="h-11 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit Report'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
