import { AdminSidebar } from '@/components/admin/Sidebar'
import { AdminGuard } from '@/components/admin/AdminGuard'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Admin CMS | UniDeal',
  description: 'Administrative portal for UniDeal Moderation Queue and Data Governance.',
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    // By wrapping in this isolated context, the global layout still renders <html> <body> 
    // but we hijack the page structure immediately below the RootLayout.
    // Wait, the RootLayout renders <Navbar /> unconditionally.
    // We must handle this by utilizing Next.js app router sub-layouts. 
    // Wait, our existing RootLayout uses <Navbar /> and <Footer /> directly inside layout.tsx.
    // To cleanly isolate it without rebuilding RootLayout into Route Groups, 
    // we can apply a fixed overlay style in the Admin Layout to cover the whole screen,
    // thereby hiding the global navbar/footer behind entirely absolute UI context.
    <AdminGuard>
      <div className="fixed inset-0 z-[100] bg-[#F9F9F9] flex h-screen w-screen overflow-hidden text-[#1A1A1A]">
        <AdminSidebar />
        <div className="flex-1 flex w-full relative h-full">
          <main className="w-full h-full overflow-y-auto overflow-x-hidden p-6 lg:p-10 relative">
            {children}
          </main>
        </div>
      </div>
    </AdminGuard>
  )
}
