'use client'

import { useState, Suspense } from 'react'
import { sendResetEmail } from '@/lib/auth/firebase'
import { getAuthErrorMessage } from '@/lib/utils/authErrors'
import Link from 'next/link'
import { Loader2, ArrowLeft, MailCheck } from 'lucide-react'

function ForgotPasswordContent() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await sendResetEmail(email)
      setSuccess(true)
    } catch (err: any) {
      console.error('[Reset Password Error]', err)
      setError(getAuthErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-white">
        <div className="w-full max-w-[400px] text-center">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <MailCheck className="w-8 h-8 text-[#16a34a]" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Check your email</h1>
          <p className="text-gray-500 mb-8">
            We've sent a password reset link to <span className="font-semibold text-gray-900">{email}</span>.
          </p>
          <Link 
            href="/login" 
            className="inline-flex items-center justify-center h-11 px-8 bg-[#16a34a] hover:bg-green-700 text-white rounded-full font-bold text-sm transition-all"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-white">
      <div className="w-full max-w-[400px]">
        {/* Logo */}
        <div className="text-center mb-8">
          <span className="text-2xl font-bold text-[#16a34a]">UniDeal</span>
          <p className="text-sm text-gray-500 mt-1">Reset your password</p>
        </div>

        {/* Card */}
        <div className="border border-gray-100 rounded-2xl p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-500">
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-gray-500 mb-2">
              Enter your email address and we'll send you a link to reset your password.
            </p>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 ml-1">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                className="w-full h-11 px-4 rounded-xl border border-gray-200 focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a] outline-none transition-all text-sm"
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-[11px] font-bold text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-[#16a34a] hover:bg-green-700 text-white rounded-full font-bold text-sm transition-all active:scale-[0.98] disabled:opacity-50 mt-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Send reset link'}
            </button>
          </form>

          <Link 
            href="/login" 
            className="flex items-center justify-center gap-2 text-sm text-gray-500 font-bold hover:text-gray-900 mt-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ForgotPasswordContent />
    </Suspense>
  )
}
