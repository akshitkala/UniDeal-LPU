'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

interface User {
  uid: string
  email: string
  displayName: string
  photoURL?: string
  role: 'user' | 'admin'
  isActive: boolean
  dbId: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  setUser: (user: User | null) => void
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
 * Authenticates against /api/user/me.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/user/me')
      if (res.ok) {
        const data = await res.json()
        setUser(data)
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error('[AuthProvider] Fetch Failure:', error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    setLoading(true)
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      setUser(null)
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
