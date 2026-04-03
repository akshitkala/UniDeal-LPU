'use client'

import Link from 'next/link'
import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Search, Menu, X, User, ChevronDown, LayoutDashboard, ShieldCheck, LogOut, Settings } from 'lucide-react'
import { useAuth } from '@/components/auth/AuthProvider'
import { cn } from '@/lib/utils'
import { Avatar } from '@/components/ui/Avatar'

export function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const { user, loading, logout } = useAuth()

  const loginUrl = `/login?returnTo=${encodeURIComponent(pathname)}`

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
       router.push(`/browse?q=${encodeURIComponent(searchQuery.trim())}`)
       setIsSearchOpen(false)
    }
  }

  return (
    <>
      <nav className="sticky top-0 left-0 right-0 h-14 sm:h-16 bg-white border-b border-gray-100 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between gap-4">
          
          {/* Left: Logo */}
          <Link href="/" className="flex items-center gap-2 group shrink-0 min-w-[44px] min-h-[44px]">
            <div className="w-7 h-7 sm:w-8 h-8 bg-[#16a34a] rounded-lg flex items-center justify-center transform group-hover:rotate-12 transition-transform shadow-sm">
               <span className="text-white font-bold text-lg sm:text-xl">U</span>
            </div>
            <span className="text-lg font-bold text-gray-900 tracking-tight sm:text-xl">UniDeal</span>
          </Link>
          
          {/* Center: Nav Links & Search (Desktop) */}
          <div className="hidden lg:flex items-center flex-1 justify-center gap-6 lg:gap-8 px-8">
            <div className="flex items-center gap-6 lg:gap-8">
              <Link href="/browse" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Browse</Link>
              <Link href="/about" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">About Story</Link>
              <Link href="/#how-it-works" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">How it works</Link>
            </div>

            <div className="relative w-full max-w-xs flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearch}
                className="w-full h-9 pl-10 pr-4 rounded-full bg-gray-100 border-none focus:ring-2 focus:ring-[#16a34a]/20 transition-all font-medium text-sm"
              />
            </div>
          </div>
          
          {/* Right: Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Search Icon Button (Tablet/Mobile) */}
            <button 
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className={cn(
                "lg:hidden w-9 h-9 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 transition-colors",
                isSearchOpen && "bg-gray-100"
              )}
            >
              <Search className="w-4 h-4" />
            </button>

            {loading ? (
              <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse border border-gray-200" />
            ) : user ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <Link 
                  href="/post" 
                  className="hidden lg:flex h-9 px-5 items-center bg-[#16a34a] hover:bg-green-700 text-white rounded-full font-semibold text-sm transition-all"
                >
                  Sell
                </Link>

                {/* Avatar (Click opens profile or menu) */}
                <div className="relative group/avatar">
                  <button 
                    onClick={() => {
                        if (window.innerWidth < 1024) {
                            setIsMobileMenuOpen(true)
                        } else {
                            setIsProfileOpen(!isProfileOpen)
                        }
                    }}
                    className="flex items-center gap-1 p-1 hover:bg-gray-50 rounded-full transition-all"
                  >
                    <Avatar 
                      src={user.photoURL} 
                      name={user.displayName}
                      className="w-8 h-8"
                    />
                    <ChevronDown className={cn("w-4 h-4 text-gray-500 transition-transform hidden lg:block", isProfileOpen && "rotate-180")} />
                  </button>

                  {/* Desktop Dropdown */}
                  {isProfileOpen && (
                    <div className="hidden lg:block">
                      <div className="fixed inset-0 z-10" onClick={() => setIsProfileOpen(false)} />
                      <div className="absolute right-0 mt-3 w-64 bg-white border border-gray-100 rounded-2xl shadow-xl z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                        <div className="p-4 bg-gray-50/50 border-b border-gray-100">
                          <p className="text-sm font-bold text-gray-900 truncate">{user.displayName}</p>
                          <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        </div>
                        <div className="p-2">
                          <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-xl text-gray-700 hover:bg-gray-50 font-medium text-sm transition-colors">
                            <LayoutDashboard className="w-4 h-4" /> My Dashboard
                          </Link>
                          <Link href="/profile" className="flex items-center gap-3 px-3 py-2 rounded-xl text-gray-700 hover:bg-gray-50 font-medium text-sm transition-colors">
                            <User className="w-4 h-4" /> Profile
                          </Link>
                          {user.role === 'admin' && (
                            <Link href="/admin" className="flex items-center gap-3 px-3 py-2 rounded-xl text-emerald-700 hover:bg-emerald-50 font-medium text-sm transition-colors">
                              <ShieldCheck className="w-4 h-4" /> Admin Panel
                            </Link>
                          )}
                          <hr className="my-1 border-gray-100" />
                          <button 
                            onClick={logout}
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-red-600 hover:bg-red-50 font-medium text-sm transition-colors"
                          >
                            <LogOut className="w-4 h-4" /> Logout
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
                <div className="flex items-center gap-2">
                    <Link 
                    href={loginUrl} 
                    className="text-sm font-semibold text-gray-600 px-3 py-2 hover:text-gray-900 transition-all"
                    >
                    Sign In
                    </Link>
                    <Link 
                    href="/post" 
                    className="h-9 px-5 flex items-center bg-[#16a34a] hover:bg-green-700 text-white rounded-full font-semibold text-sm transition-all shadow-sm"
                    >
                    Sell
                    </Link>
                </div>
            )}

            {/* Hamburger (Mobile Only) */}
            <button 
              className="lg:hidden w-10 h-10 flex items-center justify-center text-gray-500 hover:bg-gray-50 rounded-full"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Mobile Search Bar Expansion */}
        {isSearchOpen && (
            <div className="absolute top-14 left-0 right-0 bg-white border-b border-gray-100 px-4 py-3 animate-slide-down z-40 lg:hidden">
                <div className="relative w-full max-w-2xl mx-auto">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                        type="text" 
                        autoFocus
                        placeholder="Search items..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={handleSearch}
                        className="w-full h-10 pl-11 pr-4 rounded-full bg-gray-100 border-none focus:ring-2 focus:ring-[#16a34a]/20 transition-all font-medium text-sm"
                    />
                </div>
            </div>
        )}
      </nav>

      {/* Mobile Right Side Sheet */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[70] flex lg:hidden">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="absolute right-0 top-0 bottom-0 w-[280px] sm:w-[320px] bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-5 flex items-center justify-between border-b border-gray-100">
              <span className="font-bold text-lg text-gray-900">Menu</span>
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-900 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 flex-1 flex flex-col gap-6 overflow-y-auto">
              <div className="flex flex-col gap-1">
                <Link onClick={() => setIsMobileMenuOpen(false)} href="/browse" className="px-4 py-3 rounded-xl font-semibold text-gray-600 hover:bg-gray-50 hover:text-gray-900">Browse Listings</Link>
                <Link onClick={() => setIsMobileMenuOpen(false)} href="/about" className="px-4 py-3 rounded-xl font-semibold text-gray-600 hover:bg-gray-50 hover:text-gray-900">About Story</Link>
                <Link onClick={() => setIsMobileMenuOpen(false)} href="/#how-it-works" className="px-4 py-3 rounded-xl font-semibold text-gray-600 hover:bg-gray-50 hover:text-gray-900">How it works</Link>
                <hr className="my-2 border-gray-50" />
                {!loading && !user && (
                  <Link onClick={() => setIsMobileMenuOpen(false)} href={loginUrl} className="px-4 py-3 rounded-xl font-semibold text-gray-600 hover:bg-gray-50 hover:text-gray-900">Sign In</Link>
                )}
              </div>

              {user ? (
                 <div className="flex flex-col gap-1">
                    <p className="px-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Account</p>
                    <Link onClick={() => setIsMobileMenuOpen(false)} href="/dashboard" className="px-4 py-3 rounded-xl font-semibold text-gray-600 hover:bg-gray-50">Dashboard</Link>
                    <Link onClick={() => setIsMobileMenuOpen(false)} href="/profile" className="px-4 py-3 rounded-xl font-semibold text-gray-600 hover:bg-gray-50">Profile</Link>
                    {user.role === 'admin' && (
                      <Link onClick={() => setIsMobileMenuOpen(false)} href="/admin" className="px-4 py-3 rounded-xl font-semibold text-emerald-700 hover:bg-emerald-50">Admin Panel</Link>
                    )}
                    <button 
                      onClick={() => {
                          logout()
                          setIsMobileMenuOpen(false)
                      }}
                      className="px-4 py-3 rounded-xl font-semibold text-red-600 hover:bg-red-50 text-left"
                    >
                      Logout
                    </button>
                 </div>
              ) : null}
            </div>

            <div className="p-6 border-t border-gray-100">
              <Link 
                href="/post" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full bg-[#16a34a] text-white h-12 rounded-full font-bold flex items-center justify-center shadow-lg shadow-green-600/20"
              >
                Sell Now
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
