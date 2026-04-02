'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Compass, PlusCircle, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/components/auth/AuthProvider'
import { useState } from 'react'
import { SellModal } from '@/components/listing/SellModal'

/**
 * MOBILE TAB BAR: Fixed bottom navigation for 1-handed campus browsing.
 * - Glassmorphism blur effect.
 * - Active state indicators.
 * - Hidden on desktop (lg:hidden).
 */
export function MobileTabBar() {
  const pathname = usePathname()
  const { user } = useAuth()
  const [isSellModalOpen, setIsSellModalOpen] = useState(false)
 
  const tabs = [
    { label: 'Home', icon: Home, href: '/' },
    { label: 'Browse', icon: Compass, href: '/browse' },
    { label: 'Sell', icon: PlusCircle, href: '/post', modal: true },
    { label: 'Profile', icon: User, href: user ? '/dashboard' : '/login' },
  ]
 
  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden h-16 bg-white/80 backdrop-blur-md border-t border-gray-200">
        <div className="flex items-center justify-around h-full px-2">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href && !tab.modal
            const Icon = tab.icon
 
            const content = (
                <div className={cn(
                    "flex flex-col items-center justify-center gap-1 w-full h-full min-w-[64px] min-h-[44px] transition-all",
                    isActive ? "text-[#2D9A54]" : "text-gray-400 hover:text-gray-600"
                )}>
                    <Icon className={cn("w-5 h-5", isActive && "fill-[#2D9A54]/10")} />
                    <span className="text-[10px] font-black uppercase tracking-widest">{tab.label}</span>
                </div>
            )
 
            if (tab.modal) {
                return (
                    <button 
                        key={tab.label}
                        onClick={() => {
                            if (!user) window.location.href = '/login'
                            else setIsSellModalOpen(true)
                        }}
                        className="flex flex-col items-center justify-center gap-1 w-full h-full min-w-[64px] min-h-[44px] text-gray-400"
                    >
                        <div className="w-11 h-11 bg-[#2D9A54] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-[#2D9A54]/20 -mt-6">
                            <PlusCircle className="w-6 h-6" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest mt-1">{tab.label}</span>
                    </button>
                )
            }
 
            return (
              <Link 
                key={tab.href}
                href={tab.href}
                className="flex-1 h-full"
              >
                {content}
              </Link>
            )
          })}
        </div>
      </nav>
 
      {/* Sell Modal Integration */}
      <SellModal 
        isOpen={isSellModalOpen} 
        onClose={() => setIsSellModalOpen(false)} 
      />
    </>
  )
}
