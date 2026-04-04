'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase/client'
import { getSessionHint, clearLocalSessionHint } from '@/lib/auth/sessionHint'

// Standard User type synced with DB models
interface User {
  uid: string
  email: string
  displayName: string
  photoURL?: string
  role: 'user' | 'admin'
  isActive: boolean
  dbId: string
  bio?: string
  createdAt: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  setUser: React.Dispatch<React.SetStateAction<User | null>>
  refresh: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  setUser: () => {},
  refresh: async () => {},
  logout: async () => {},
})

/**
 * Global Auth Provider to manage student sessions via the custom JWT cookie system.
 * Uses a non-httpOnly "session_hint" cookie for instant UI hydration.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Sync initialization from JS-readable cookie hint
  const sessionHint = getSessionHint()
  const [user, setUser] = useState<any>(sessionHint)
  const [loading, setLoading] = useState(!sessionHint) // Skip loading if hint exists

  const initAuth = async () => {
    try {
      const res = await fetch('/api/user/profile')
      
      if (res.ok) {
        const data = await res.json()
        setUser(data)
        setLoading(false)
        return
      }

      // If unauthorized, attempt one silent refresh
      if (res.status === 401) {
        const refreshRes = await fetch('/api/auth/refresh', { method: 'POST' })
        if (refreshRes.ok) {
          const retryRes = await fetch('/api/user/profile')
          if (retryRes.ok) {
            const data = await retryRes.json()
            setUser(data)
            setLoading(false)
            return
          }
        }
      }

      // Genuinely logged out or refresh failed
      setUser(null)
      clearLocalSessionHint()
    } catch (error) {
      console.error('[AuthProvider] Auth check failed:', error)
      // Keep hint if network matches, but update loading
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    setLoading(true)
    try {
      // 1. Clear server-side JWT cookies and hint
      await fetch('/api/auth/logout', { method: 'POST' })
      // 2. Clear Firebase client-side session
      await signOut(auth)
      // 3. Clear local hint and state
      clearLocalSessionHint()
      setUser(null)
      // 4. Redirect home
      window.location.href = '/'
    } catch (err) {
      console.error('[AuthProvider] Logout Fault:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    initAuth()

    // Handle laptop wake/sleep by refreshing on visibility change
    const handleVisibility = async () => {
        if (document.visibilityState === 'visible' && getSessionHint()) {
           // Proactively renew access tokens in background
           await fetch('/api/auth/refresh', { method: 'POST' })
        }
    }

    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, setUser, refresh: initAuth, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
