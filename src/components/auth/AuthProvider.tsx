'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase/client'

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
 * Authenticates against /api/user/profile.
 * Authenticates against /api/user/profile.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchUser = async (isRetry = false) => {
    try {
      const res = await fetch('/api/user/profile')
      if (res.ok) {
        const data = await res.json()
        setUser(data)
      } else if (res.status === 401 && !isRetry) {
        // Access token expired — attempt silent refresh
        const refreshRes = await fetch('/api/auth/refresh', { method: 'POST' })
        if (refreshRes.ok) {
          // Refresh succeeded — retry user fetch once
          return fetchUser(true)
        } else {
          setUser(null)
        }
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error('[AuthProvider] Fetch Failure:', error)
      setUser(null)
    } finally {
      if (!isRetry) setLoading(false)
    }
  }

  const logout = async () => {
    setLoading(true)
    try {
      // 1. Clear server-side JWT cookies
      await fetch('/api/auth/logout', { method: 'POST' })
      // 2. Clear Firebase client-side session
      await signOut(auth)
      // 3. Clear global state
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
    fetchUser()
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, setUser, refresh: fetchUser, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
