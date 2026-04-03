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
        const res = await fetch('/api/user/profile')
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
    router.push('/')
    return null
  }

  return <>{children}</>
}
