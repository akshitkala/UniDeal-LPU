import { AdminGuard } from '@/components/admin/AdminGuard'
import { Metadata } from 'next'
import { AdminLayoutClient } from '@/components/admin/AdminLayoutClient'

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
    <AdminGuard>
      <AdminLayoutClient>
        {children}
      </AdminLayoutClient>
    </AdminGuard>
  )
}
