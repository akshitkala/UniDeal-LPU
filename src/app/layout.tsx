import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Navbar } from '@/components/global/Navbar'
import { MobileTabBar } from '@/components/global/MobileTabBar'
import { Footer } from '@/components/global/Footer'
import { AuthProvider } from '@/components/auth/AuthProvider'

// Only loading Inter as requested by system guidelines for modern typography and no custom imports from UI spec
const inter = Inter({ subsets: ['latin'], display: 'swap' })

export const metadata: Metadata = {
  title: 'UniDeal | Campus Marketplace',
  description: 'The direct campus-to-campus marketplace. Buy and sell second-hand goods safely within your community.',
  keywords: 'campus marketplace, campus deals, second hand electronics, used books, university marketplace',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      {/* 
        Add SEO semantic tags and min-h-screen to ensure footer sticks to the bottom
      */}
      <body className={`${inter.className} min-h-screen flex flex-col bg-white text-gray-950 antialiased pt-16 pb-16 md:pb-0`}>
        <AuthProvider>
          <Navbar />
          <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
            {children}
          </main>
          <MobileTabBar />
          <Footer />
        </AuthProvider>
      </body>
    </html>
  )
}
