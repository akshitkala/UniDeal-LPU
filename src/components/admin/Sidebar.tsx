'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  ShieldAlert, 
  Users, 
  FolderTree, 
  Activity, 
  ArrowLeft,
  X,
  Flag
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { name: 'Overview', href: '/admin', icon: LayoutDashboard },
  { name: 'Moderation Queue', href: '/admin/queue', icon: ShieldAlert, badgeKey: 'pendingListings' },
  { name: 'Reports', href: '/admin/reports', icon: Flag, badgeKey: 'openReports' },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Categories', href: '/admin/categories', icon: FolderTree },
  { name: 'Audit Log', href: '/admin/audit', icon: Activity },
]

interface AdminSidebarProps {
  isOpen?: boolean
  onClose?: () => void
}
 
export function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname()
  const [stats, setStats] = useState<{ pendingListings?: number, openReports?: number }>({})

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/overview')
      if (res.ok) {
        const data = await res.json()
        setStats(data.stats || {})
      }
    } catch (err) {
      console.error('Failed to fetch admin stats', err)
    }
  }

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 60000) // Revalidate every 60 seconds
    return () => clearInterval(interval)
  }, [])

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-[110] animate-in fade-in duration-300"
          onClick={onClose}
        />
      )}
 
      <aside className={cn(
        "fixed lg:sticky lg:top-0 inset-y-0 left-0 z-[120] w-60 bg-white border-r border-gray-100 flex flex-col h-screen transition-transform duration-300 lg:translate-x-0 lg:flex-shrink-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="py-6 px-3 flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-2 group px-3">
            <div className="w-7 h-7 bg-[#16a34a] rounded-lg flex items-center justify-center transform group-hover:rotate-12 transition-transform shadow-sm">
               <span className="text-white font-bold text-lg">U</span>
            </div>
            <span className="text-lg font-bold text-gray-900 tracking-tight">Admin</span>
          </Link>
          <button 
            onClick={onClose}
            className="lg:hidden w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 text-gray-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

      <div className="px-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest px-3 mb-1 mt-4">Main Menu</p>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-2 flex flex-col gap-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const badgeCount = item.badgeKey ? (stats as any)[item.badgeKey] : 0
          
          return (
            <Link 
              key={item.href}
              href={item.href}
              className={cn(
                "h-10 px-3 rounded-lg text-sm font-medium flex items-center justify-between group transition-colors",
                isActive 
                  ? "bg-green-50 text-green-700" 
                  : "text-gray-600 hover:bg-gray-50"
              )}
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-4 h-4" />
                {item.name}
              </div>
              
              {badgeCount > 0 && (
                <span className={cn(
                  "px-1.5 py-0.5 rounded-full text-[10px] font-bold min-w-[18px] text-center",
                  isActive ? "bg-green-200 text-green-800" : "bg-red-50 text-red-600 border border-red-100"
                )}>
                  {badgeCount}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <Link 
          href="/"
          className="flex items-center gap-2 text-gray-500 hover:text-gray-800 text-sm font-medium px-3 py-2 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Campus App
        </Link>
      </div>
      </aside>
    </>
  )
}
