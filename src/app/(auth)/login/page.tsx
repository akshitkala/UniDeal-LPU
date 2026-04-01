'use client'

import { useState, Suspense } from 'react'
import { signInWithGoogle } from '@/lib/auth/firebase'
import { useRouter, useSearchParams } from 'next/navigation'
import { LogIn, Loader2, ShieldCheck, Mail } from 'lucide-react'
import Image from 'next/image'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const returnTo = searchParams.get('returnTo') || '/'

  async function handleGoogleLogin() {
    setLoading(true)
    setError(null)
    try {
      // 1. Firebase Auth Client Sign-In
      const idToken = await signInWithGoogle()
      
      // 2. Exchange for Session Cookies
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firebaseIdToken: idToken })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Identity Verification Failed.')
      } else {
        // Redirection with local refresh
        router.push(returnTo)
        router.refresh()
      }
    } catch (err: any) {
      console.error('[Login Error]', err)
      setError(err.message || 'Network disruption during authentication.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      {/* Login Card */}
      <div className="bg-white w-full max-w-md rounded-3xl shadow-xl overflow-hidden border border-gray-100 p-8 flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Brand/Logo Section */}
        <div className="text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mb-4">
             <div className="text-3xl font-extrabold text-[#2D9A54]">UD</div>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">UniDeal</h1>
          <p className="text-gray-500 mt-1 font-medium italic">Exclusive LPU Marketplace</p>
        </div>

        {/* Security Alert Header */}
        <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex gap-3 items-start">
           <ShieldCheck className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
           <p className="text-xs text-blue-700 leading-relaxed font-medium">
             Authentication is restricted to verified <span className="font-bold">@lpu.in</span> addresses. Ensure your Google account is pre-authenticated with your student identity.
           </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm font-bold animate-in shake duration-300">
            {error}
          </div>
        )}

        {/* Action Button */}
        <button 
          onClick={handleGoogleLogin} 
          disabled={loading}
          className="w-full h-14 bg-gray-900 hover:bg-black text-white px-6 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          {loading ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <>
              <Image 
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
                width={20} 
                height={20} 
                alt="Google" 
                className="group-hover:opacity-90"
              />
              Continue with LPU Mail
            </>
          )}
        </button>

        {/* Footer Info */}
        <div className="text-center space-y-4">
           <p className="text-xs text-gray-400 max-w-xs mx-auto">
             By continuing, you agree to our <a href="/terms" className="text-gray-900 font-bold hover:underline">Terms of Service</a> and <a href="/privacy" className="text-gray-900 font-bold hover:underline">Privacy Policy</a>.
           </p>
           
           <div className="flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest text-[#2D9A54] font-black opacity-60">
              <LogIn className="w-3 h-3" />
              Secure LPU Link
           </div>
        </div>

      </div>
    </div>
  )
}

/**
 * S-01: Dedicated Login Page (Fix 16).
 * Features: Exclusive Google Auth, strict LPU warning, error handling.
 */
export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-10 h-10 text-[#2D9A54] animate-spin" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
