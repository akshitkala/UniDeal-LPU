'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Search, PlusCircle, User, LayoutDashboard } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Mobile-only bottom navigation bar.
 * Consistent with UniDeal_UI_v2.1_FINAL.md specification.
 */
export function MobileTabBar() {
  const pathname = usePathname()

  const navItems = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Browse', href: '/browse', icon: Search },
    { label: 'Sell', href: '#', icon: PlusCircle, isAction: true }, // Action to trigger SellSheet
    { label: 'Social', href: '/dashboard', icon: LayoutDashboard }, // "Social" label for dashboard as per some common UI patterns, or just "Dashboard"
    { label: 'Profile', href: '/profile', icon: User },
  ]

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-t border-gray-200 z-[60] px-6 flex items-center justify-between pb-safe">
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href

        if (item.isAction) {
          return (
            <button
              key={item.label}
              onClick={() => {
                // TODO: Open SellSheet modal (Phase 3)
                window.dispatchEvent(new CustomEvent('open-sell-sheet'))
              }}
              className="flex flex-col items-center justify-center gap-1 group active:scale-95 transition-transform"
            >
              <div className="p-2 bg-[#2D9A54] rounded-full shadow-lg shadow-[#2D9A54]/20 -translate-y-4 border-4 border-white">
                <Icon className="w-6 h-6 text-white" />
              </div>
              <span className="text-[10px] font-bold text-gray-400 group-active:text-[#2D9A54] -translate-y-3">
                {item.label}
              </span>
            </button>
          )
        }

        return (
          <Link
            key={item.label}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center gap-1 group transition-all",
              isActive ? "text-[#2D9A54]" : "text-gray-400 hover:text-gray-600"
            )}
          >
            <Icon className={cn("w-6 h-6", isActive && "stroke-[2.5px]")} />
            <span className={cn("text-[10px] font-bold tracking-tight", !isActive && "opacity-80")}>
              {item.label}
            </span>
            {isActive && (
              <div className="w-1 h-1 bg-[#2D9A54] rounded-full mt-0.5" />
            )}
          </Link>
        )
      })}
    </div>
  )
}
