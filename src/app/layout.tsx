import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Navbar } from '@/components/global/Navbar'
import { Footer } from '@/components/global/Footer'

// Only loading Inter as requested by system guidelines for modern typography and no custom imports from UI spec
const inter = Inter({ subsets: ['latin'], display: 'swap' })

export const metadata: Metadata = {
  title: 'UniDeal | LPU Student Marketplace',
  description: 'Buy and sell second-hand laptops, books, cycles, and more securely within the Lovely Professional University campus. Verified students only.',
  keywords: 'LPU, lovely professional university, campus marketplace, used books, second hand electronics, student deals',
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
      <body className={`${inter.className} min-h-screen flex flex-col bg-[#FFFFFF] text-[#1A1A1A] antialiased pt-16`}>
        <Navbar />
        <main className="flex-1 w-full max-w-[1280px] mx-auto pt-6 pb-20 px-4 md:px-6">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}
