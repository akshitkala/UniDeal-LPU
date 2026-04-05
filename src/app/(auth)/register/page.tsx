'use client'

import { useState, useEffect, Suspense } from 'react'
import { signInWithGoogle, registerWithEmail } from '@/lib/auth/firebase'
import { getAuthErrorMessage } from '@/lib/utils/authErrors'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 18 18">
      <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 002.38-5.88c0-.57-.05-.66-.15-1.18z"/>
      <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 01-7.18-2.54H1.83v2.07A8 8 0 008.98 17z"/>
      <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 010-3.04V5.41H1.83a8 8 0 000 7.18l2.67-2.07z"/>
      <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 001.83 5.4L4.5 7.49a4.77 4.77 0 014.48-3.3z"/>
    </svg>
  )
}

function RegisterContent() {
  const { user, loading: authLoading, setUser } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Form states
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  useEffect(() => {
    if (!authLoading && user) {
      const returnTo = searchParams.get('returnTo') || '/'
      router.replace(returnTo)
    }
  }, [user, authLoading, router, searchParams])

  async function handleAuthSuccess(idToken: string) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firebaseIdToken: idToken })
    })
    const data = await res.json()

    if (!res.ok) {
      throw new Error(data.error || 'Identity Verification Failed.')
    } else {
      setUser(data.user)
      const returnTo = searchParams.get('returnTo') || '/'
      router.push(returnTo)
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirmPassword) {
      setError(getAuthErrorMessage('Passwords do not match'))
      return
    }
    setLoading(true)
    setError(null)
    try {
      const idToken = await registerWithEmail(email, password)
      await handleAuthSuccess(idToken)
    } catch (err: any) {
      console.error('[Register Error]', err)
      setError(getAuthErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleLogin() {
    setLoading(true)
    setError(null)
    try {
      const idToken = await signInWithGoogle()
      await handleAuthSuccess(idToken)
    } catch (err: any) {
      console.error('[Google Auth Error]', err)
      setError(getAuthErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || user) return null

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-white">
      <div className="w-full max-w-[400px]">
        {/* Logo */}
        <div className="text-center mb-8">
          <span className="text-2xl font-bold text-[#16a34a]">UniDeal</span>
          <p className="text-sm text-gray-500 mt-1">Join the community</p>
        </div>

        {/* Card */}
        <div className="border border-gray-100 rounded-2xl p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-500">
          <form onSubmit={handleRegister} className="space-y-4">
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
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 ml-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-11 px-4 rounded-xl border border-gray-200 focus:border-[#16a34a] focus:ring-1 focus:ring-[#16a34a] outline-none transition-all text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 ml-1">
                Confirm Password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
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
              {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Create account'}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-gray-400 font-bold tracking-widest">or</span>
            </div>
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="h-10 w-full max-w-[280px] flex items-center justify-center gap-2.5 
                       border border-gray-200 rounded-full bg-white text-sm font-medium 
                       hover:bg-gray-50 transition-colors mx-auto"
          >
            <GoogleIcon />
            Continue with Google
          </button>

          <p className="text-center text-sm text-gray-500 mt-8">
            Already have an account?{' '}
            <Link href="/login" className="text-[#16a34a] font-bold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterContent />
    </Suspense>
  )
}
