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
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] animate-in fade-in duration-300"
          onClick={onClose}
        />
      )}
 
      <aside className={cn(
        "fixed lg:sticky lg:top-0 inset-y-0 left-0 z-[120] w-64 bg-white border-r border-[#E5E5E5] flex flex-col h-screen transition-transform duration-300 lg:translate-x-0 lg:flex-shrink-0 shadow-2xl lg:shadow-none",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 border-b border-[#E5E5E5] flex items-center justify-between">
          <Link href="/admin" className="flex flex-col gap-1">
            <span className="text-xl font-black text-gray-950 tracking-tighter">UniDeal CMS</span>
            <span className="text-[10px] font-black tracking-widest uppercase text-emerald-600">Governance</span>
          </Link>
          <button 
            onClick={onClose}
            className="lg:hidden w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 text-gray-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

      <nav className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          
          return (
            <Link 
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-medium
                ${isActive 
                  ? 'bg-[#2D9A54]/10 text-[#2D9A54]' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
              `}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-[#E5E5E5]">
        <Link 
          href="/"
          className="flex items-center gap-2 text-gray-500 hover:text-gray-800 font-medium px-4 py-3 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Campus App
        </Link>
      </div>
      </aside>
    </>
  )
}
