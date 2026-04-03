'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  ShieldAlert, 
  Users, 
  FolderTree, 
  Activity, 
  ArrowLeft,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { name: 'Overview', href: '/admin', icon: LayoutDashboard },
  { name: 'Moderation Queue', href: '/admin/queue', icon: ShieldAlert },
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
          
          return (
            <Link 
              key={item.href}
              href={item.href}
              className={cn(
                "h-9 px-3 rounded-lg text-sm font-medium flex items-center gap-3 transition-colors",
                isActive 
                  ? "bg-green-50 text-green-700" 
                  : "text-gray-600 hover:bg-gray-50"
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.name}
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
