'use client'

import { useState } from 'react'
import { Menu, ShieldCheck } from 'lucide-react'
import { AdminSidebar } from '@/components/admin/Sidebar'

interface AdminLayoutClientProps {
  children: React.ReactNode
}

export function AdminLayoutClient({ children }: AdminLayoutClientProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="fixed inset-0 z-[100] bg-gray-50 flex h-screen w-screen overflow-hidden text-gray-950">
      
      {/* Mobile Mini Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-200 px-4 flex items-center justify-between z-[105]">
         <button 
           onClick={() => setIsSidebarOpen(true)}
           className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 text-gray-600"
         >
           <Menu className="w-5 h-5" />
         </button>
         <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="font-black text-sm uppercase tracking-tighter">Moderation</span>
         </div>
         <div className="w-10" /> {/* Spacer */}
      </div>

      <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <div className="flex-1 flex w-full relative h-full">
        <main className="w-full h-full overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-10 relative pt-20 lg:pt-10">
          {children}
        </main>
      </div>
    </div>
  )
}
