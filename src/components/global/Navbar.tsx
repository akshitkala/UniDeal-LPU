'use client'

import Link from 'next/link'
import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Search, Menu, X, User, ChevronDown, LayoutDashboard, ShieldCheck, LogOut, Settings } from 'lucide-react'
import { useAuth } from '@/components/auth/AuthProvider'
import { cn } from '@/lib/utils'

export function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const { user, loading, logout } = useAuth()

  const loginUrl = `/login?returnTo=${encodeURIComponent(pathname)}`

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
       router.push(`/browse?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-gray-200 z-50">
        <div className="max-w-[1280px] mx-auto px-4 h-full flex items-center justify-between">
          
          {/* Left: Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-[#2D9A54] rounded-lg flex items-center justify-center transform group-hover:rotate-12 transition-transform">
               <span className="text-white font-black text-xl">U</span>
            </div>
            <span className="text-2xl font-black text-gray-900 tracking-tighter">UniDeal</span>
          </Link>

          {/* Center: Search Bar (Desktop) */}
          <div className="hidden md:flex flex-1 max-w-[480px] px-8">
            <div className="relative w-full">
              <input 
                type="text" 
                placeholder="Search laptops, books, cycles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearch}
                className="w-full h-10 pl-11 pr-4 rounded-xl bg-[#F5F5F5] border-transparent focus:bg-white focus:border-[#2D9A54] focus:ring-4 focus:ring-[#2D9A54]/10 transition-all font-medium text-sm"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>

          {/* Right: Actions (Desktop) */}
          <div className="hidden md:flex items-center gap-6">
            <Link 
              href="/#how-it-works" 
              className="text-sm font-bold text-gray-600 hover:text-[#2D9A54] transition-colors"
            >
              How it works
            </Link>
            
            <Link 
              href="/post" 
              className="bg-[#2D9A54] hover:bg-[#258246] text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-[#2D9A54]/20 active:scale-95 transition-all"
            >
              Sell Now
            </Link>

            {loading ? (
              <div className="w-10 h-10 bg-gray-100 rounded-full animate-pulse" />
            ) : user ? (
              <div className="relative">
                <button 
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2 p-1 pl-1 pr-3 bg-gray-50 border border-gray-200 rounded-full hover:border-[#2D9A54] transition-all active:scale-95"
                >
                  <img 
                    src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} 
                    className="w-8 h-8 rounded-full border border-gray-200 object-cover" 
                    alt="profile" 
                  />
                  <ChevronDown className={cn("w-4 h-4 text-gray-500 transition-transform", isProfileOpen && "rotate-180")} />
                </button>

                {isProfileOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsProfileOpen(false)} />
                    <div className="absolute right-0 mt-3 w-64 bg-white border border-gray-200 rounded-2xl shadow-xl z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                      <div className="p-4 bg-gray-50 border-b border-gray-100">
                        <p className="text-sm font-black text-gray-900 truncate">{user.displayName}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                      <div className="p-2">
                        {user.role === 'admin' && (
                          <Link href="/admin" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-amber-700 hover:bg-amber-50 font-bold text-sm transition-colors">
                            <ShieldCheck className="w-4 h-4" /> Admin Console
                          </Link>
                        )}
                        <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-700 hover:bg-gray-50 font-bold text-sm transition-colors">
                          <LayoutDashboard className="w-4 h-4" /> My Dashboard
                        </Link>
                        <Link href="/profile" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-700 hover:bg-gray-50 font-bold text-sm transition-colors">
                          <User className="w-4 h-4" /> Account Profile
                        </Link>
                        <hr className="my-2 border-gray-100" />
                        <button 
                          onClick={logout}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-600 hover:bg-red-50 font-bold text-sm transition-colors"
                        >
                          <LogOut className="w-4 h-4" /> Sign Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link 
                href={loginUrl} 
                className="text-sm font-bold text-gray-900 px-4 py-2 hover:bg-gray-50 rounded-xl transition-all"
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden p-2 text-gray-600 bg-gray-50 rounded-xl"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </nav>

      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[60] flex md:hidden">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="absolute right-0 top-0 bottom-0 w-[300px] bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-6 flex items-center justify-between border-b border-gray-100">
              <span className="font-black text-xl tracking-tight text-gray-900">Navigation</span>
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 text-gray-400 bg-gray-50 hover:text-gray-900 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 flex-1 flex flex-col gap-6">
              {user && (
                <div className="flex items-center gap-4 p-4 bg-[#2D9A54]/5 rounded-2xl border border-[#2D9A54]/10">
                   <img 
                      src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} 
                      className="w-12 h-12 rounded-full border-2 border-white shadow-sm" 
                      alt="user" 
                   />
                   <div className="min-w-0">
                      <p className="font-black text-gray-900 truncate leading-none mb-1">{user.displayName}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                   </div>
                </div>
              )}

              <div className="flex flex-col gap-2">
                <Link onClick={() => setIsMobileMenuOpen(false)} href="/" className="px-4 py-3 rounded-xl font-bold text-gray-700 hover:bg-gray-50 transition-colors">Home</Link>
                <Link onClick={() => setIsMobileMenuOpen(false)} href="/browse" className="px-4 py-3 rounded-xl font-bold text-gray-700 hover:bg-gray-50 transition-colors">Browse Marketplace</Link>
                <Link onClick={() => setIsMobileMenuOpen(false)} href="/categories" className="px-4 py-3 rounded-xl font-bold text-gray-700 hover:bg-gray-50 transition-colors">Categories</Link>
                {user?.role === 'admin' && (
                  <Link onClick={() => setIsMobileMenuOpen(false)} href="/admin" className="px-4 py-3 rounded-xl font-bold text-amber-700 bg-amber-50 transition-colors">Admin Console</Link>
                )}
              </div>

              <div className="mt-auto space-y-3">
                {user ? (
                   <button 
                    onClick={() => {
                        logout()
                        setIsMobileMenuOpen(false)
                    }}
                    className="w-full bg-red-50 text-red-600 h-12 rounded-xl font-bold flex items-center justify-center gap-2"
                   >
                     <LogOut className="w-4 h-4" /> Sign Out
                   </button>
                ) : (
                  <Link 
                    href={loginUrl} 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full bg-[#2D9A54] text-white h-12 rounded-xl font-bold flex items-center justify-center shadow-lg shadow-[#2D9A54]/20"
                  >
                    Sign In to Account
                  </Link>
                )}
                <p className="text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest">Campus Marketplace Community</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
