'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, ShieldAlert } from 'lucide-react'

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const [authorized, setAuthorized] = useState<boolean | null>(null)
  const router = useRouter()

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/user/me')
        if (res.ok) {
          const user = await res.json()
          if (user.role === 'admin') {
            setAuthorized(true)
          } else {
            console.warn('[AdminGuard] Unauthorized: Insufficient privileges.')
            setAuthorized(false)
          }
        } else {
          console.warn('[AdminGuard] Unauthorized: Session invalid.')
          setAuthorized(false)
        }
      } catch (err) {
        console.error('[AdminGuard] Auth Check Fault:', err)
        setAuthorized(false)
      }
    }
    checkAuth()
  }, [])

  if (authorized === null) {
    return (
      <div className="fixed inset-0 z-[200] bg-white flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-[#2D9A54] animate-spin" />
        <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Verifying Authorization...</p>
      </div>
    )
  }

  if (authorized === false) {
    return (
      <div className="fixed inset-0 z-[200] bg-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-6">
          <ShieldAlert className="w-8 h-8 text-red-600" />
        </div>
        <h1 className="text-2xl font-black text-gray-900 mb-2">Access Terminated</h1>
        <p className="text-gray-500 max-w-sm mb-8">
          You do not have administrative clearance to access this sector of the UniDeal network.
        </p>
        <button 
          onClick={() => router.push('/')}
          className="px-8 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition-all"
        >
          Return to Base
        </button>
      </div>
    )
  }

  return <>{children}</>
}
