'use client'

import { useState, Suspense } from 'react'
import { signInWithGoogle } from '@/lib/auth/firebase'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import { LogIn, Loader2, ShieldCheck, Mail, ArrowRight } from 'lucide-react'
import Image from 'next/image'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { setUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const returnTo = searchParams.get('returnTo') || '/'

  async function handleGoogleLogin() {
    setLoading(true)
    setError(null)
    try {
      const idToken = await signInWithGoogle()
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firebaseIdToken: idToken })
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Identity Verification Failed.')
      } else {
        setUser(data.user)
        router.push(returnTo)
      }
    } catch (err: any) {
      console.error('[Login Error]', err)
      setError(err.message || 'Network disruption during authentication.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center relative p-6 bg-white overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute inset-0 z-0">
         <img 
           src="/hero-bg.png" 
           alt="Campus Backdrop" 
           className="w-full h-full object-cover opacity-10 blur-xl scale-125"
         />
         <div className="absolute inset-0 bg-gradient-to-tr from-emerald-50 via-white to-white" />
      </div>

      <div className="absolute top-20 left-10 w-96 h-96 bg-emerald-300/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl" />

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-lg animate-in fade-in zoom-in-95 duration-700">
        <div className="bg-white/80 backdrop-blur-2xl rounded-[2.5rem] sm:rounded-[3rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.12)] border border-white p-6 sm:p-10 md:p-14 flex flex-col items-center">
          
          {/* Logo & Headline */}
          <div className="w-20 h-20 bg-emerald-600 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-emerald-600/30 mb-8 border-4 border-white">
             <div className="text-3xl font-black text-white italic">UD</div>
          </div>
          
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-950 tracking-tighter mb-2">Welcome Back!</h1>
          <p className="text-gray-500 font-bold text-center mb-10 max-w-xs text-sm sm:text-base leading-relaxed">
            Sign in to access the campus <br /> marketplace.
          </p>

          {error && (
            <div className="w-full bg-rose-50 border border-rose-100 text-rose-600 px-6 py-4 rounded-2xl text-sm font-bold mb-6">
              {error}
            </div>
          )}

          {/* Core Action */}
          <button 
            onClick={handleGoogleLogin} 
            disabled={loading}
            className="w-full h-16 bg-[#1A1A1A] hover:bg-black text-white rounded-[1.5rem] font-bold text-lg flex items-center justify-center gap-4 transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-gray-900/10 disabled:opacity-50 disabled:cursor-wait group"
          >
            {loading ? (
              <Loader2 className="w-7 h-7 animate-spin" />
            ) : (
              <>
                <div className="bg-white p-1.5 rounded-lg shadow-sm">
                  <Image 
                    src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
                    width={20} 
                    height={20} 
                    alt="Google" 
                  />
                </div>
                Sign in with Google
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform opacity-50" />
              </>
            )}
          </button>

          {/* Social Proof/Trust */}
          <div className="mt-12 pt-8 border-t border-gray-100 w-full text-center">
             <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Trusted by 5,000+ Users</p>
             <div className="flex justify-center gap-2">
                {[1,2,3,4].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 -ml-2" />
                ))}
                <div className="w-8 h-8 rounded-full border-2 border-white bg-emerald-50 text-[10px] font-black text-emerald-600 flex items-center justify-center -ml-2">
                  +5k
                </div>
             </div>
          </div>

          <p className="mt-10 text-[10px] font-bold text-gray-300 uppercase tracking-widest hover:text-emerald-500 cursor-pointer transition-colors">
            Secure Infrastructure • Peer-to-Peer
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <div className="w-16 h-16 border-4 border-emerald-500 border-t-white rounded-full animate-spin" />
        <p className="mt-6 text-emerald-950 font-bold animate-pulse">Initializing Secure Tunnel...</p>
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
