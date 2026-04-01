'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Search, Menu, X, User } from 'lucide-react'

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  // TODO: Add auth state check later

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-50">
        <div className="max-w-[1280px] mx-auto px-4 h-full flex items-center justify-between">
          
          {/* Left: Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold text-[#2D9A54]">UniDeal</span>
            <span className="hidden sm:inline-block text-xs font-medium bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
              LPU
            </span>
          </Link>

          {/* Center: Search Bar (Desktop) */}
          <div className="hidden md:flex flex-1 max-w-[480px] px-8">
            <div className="relative w-full">
              <input 
                type="text" 
                placeholder="Search laptops, books, cycles..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const val = e.currentTarget.value
                    if (val) window.location.href = `/browse?q=${encodeURIComponent(val)}`
                  }
                }}
                className="w-full h-10 pl-4 pr-10 rounded-lg bg-[#F9F9F9] border border-[#E5E5E5] focus:outline-none focus:border-[#2D9A54] focus:ring-1 focus:ring-[#2D9A54] transition-all"
              />
              <button 
                onClick={(e) => {
                  const input = e.currentTarget.parentElement?.querySelector('input')
                  if (input?.value) window.location.href = `/browse?q=${encodeURIComponent(input.value)}`
                }}
                className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-[#2D9A54]"
              >
                <Search className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Right: Actions (Desktop) */}
          <div className="hidden md:flex items-center gap-4">
            <Link 
              href="/post" 
              className="bg-[#2D9A54] hover:bg-[#258246] text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              List an Item
            </Link>
            
            {/* Avatar / Login button */}
            <div className="relative cursor-pointer w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center border border-gray-200 hover:border-[#2D9A54] transition-colors">
              <User className="w-5 h-5 text-gray-600" />
            </div>
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden p-2 text-gray-600"
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
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="absolute right-0 top-0 bottom-0 w-[280px] bg-white shadow-xl flex flex-col">
            <div className="p-4 flex items-center justify-between border-b border-gray-100">
              <span className="font-bold text-lg">Menu</span>
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 flex-1 flex flex-col gap-6">
              <div className="relative w-full">
                <input 
                  type="text" 
                  placeholder="Search..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const val = e.currentTarget.value
                      if (val) window.location.href = `/browse?q=${encodeURIComponent(val)}`
                    }
                  }}
                  className="w-full h-10 pl-4 pr-10 rounded-lg bg-[#F9F9F9] border border-[#E5E5E5] focus:outline-none focus:border-[#2D9A54]"
                />
                <Search className="absolute right-3 top-2.5 w-5 h-5 text-gray-400" />
              </div>

              <div className="flex flex-col gap-4">
                <Link href="/post" className="bg-[#2D9A54] text-white text-center py-2.5 rounded-lg font-medium">
                  List an Item
                </Link>
                <button className="border border-[#E5E5E5] bg-[#F9F9F9] text-gray-700 text-center py-2.5 rounded-lg font-medium">
                  Sign In
                </button>
              </div>

              <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-gray-100">
                <Link href="/categories" className="py-2 text-gray-600 font-medium">Browse Categories</Link>
                <Link href="/about" className="py-2 text-gray-600 font-medium">About UniDeal</Link>
                <Link href="/contact" className="py-2 text-gray-600 font-medium">Contact Support</Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
