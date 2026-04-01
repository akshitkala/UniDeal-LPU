'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Search, PlusCircle, User, Compass } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/components/auth/AuthProvider'

/**
 * MOBILE TAB BAR: Fixed bottom navigation for 1-handed campus browsing.
 * - Glassmorphism blur effect.
 * - Active state indicators.
 * - Hidden on desktop (lg:hidden).
 */
export function MobileTabBar() {
  const pathname = usePathname()
  const { user } = useAuth()

  const tabs = [
    { label: 'Home', icon: Home, href: '/' },
    { label: 'Browse', icon: Compass, href: '/browse' },
    { label: 'Sell', icon: PlusCircle, href: '/post', primary: true },
    { label: 'Profile', icon: User, href: user ? '/dashboard' : '/login' },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[60] lg:hidden">
      <div className="absolute inset-0 bg-white/80 backdrop-blur-xl border-t border-gray-100 shadow-[0_-1px_10px_rgba(0,0,0,0.05)]" />
      
      <div className="relative flex items-center justify-around h-16 pb-safe px-4">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href
          const Icon = tab.icon

          return (
            <Link 
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 min-w-[60px] transition-all duration-200",
                isActive ? "text-emerald-600" : "text-gray-400 hover:text-gray-600",
                tab.primary && "relative -top-4 bg-emerald-600 text-white w-14 h-14 rounded-full shadow-lg shadow-emerald-500/20 active:scale-95 transition-transform"
              )}
            >
              <div className={cn(
                "flex items-center justify-center",
                tab.primary ? "w-10 h-10" : "w-6 h-6"
              )}>
                <Icon className={cn(
                  tab.primary ? "w-7 h-7" : "w-5 h-5",
                  isActive && !tab.primary && "fill-emerald-600/10"
                )} />
              </div>
              {!tab.primary && (
                <span className="text-[10px] font-black uppercase tracking-widest leading-none">
                  {tab.label}
                </span>
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
