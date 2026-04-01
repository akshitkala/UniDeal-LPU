'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ShieldAlert, Users, FolderTree, Activity, ArrowLeft } from 'lucide-react'

const navItems = [
  { name: 'Overview', href: '/admin', icon: LayoutDashboard },
  { name: 'Moderation Queue', href: '/admin/queue', icon: ShieldAlert },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Categories', href: '/admin/categories', icon: FolderTree },
  { name: 'Audit Log', href: '/admin/audit', icon: Activity },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-white border-r border-[#E5E5E5] flex flex-col h-screen sticky top-0 flex-shrink-0">
      <div className="p-6 border-b border-[#E5E5E5]">
        <Link href="/admin" className="flex flex-col gap-1">
          <span className="text-2xl font-bold text-[#1A1A1A]">UniDeal CMS</span>
          <span className="text-xs font-bold tracking-widest uppercase text-[#2D9A54]">Admin Portal</span>
        </Link>
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
  )
}
