'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Search, PlusCircle, LayoutDashboard, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const tabs = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Browse', href: '/browse', icon: Search },
  { name: 'Sell', href: '/post', icon: PlusCircle },
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Profile', href: '/profile', icon: User },
]

export function Tabbar() {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-14 bg-white border-t border-gray-100 flex items-center justify-around z-50">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href
        return (
          <Link 
            key={tab.name}
            href={tab.href}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 pt-1"
          >
            <tab.icon className={cn("w-5 h-5", isActive ? "text-[#16a34a]" : "text-gray-400")} />
            <span className={cn("text-[10px] font-medium", isActive ? "text-[#16a34a]" : "text-gray-400")}>
              {tab.name}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
