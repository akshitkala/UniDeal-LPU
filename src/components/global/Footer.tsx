import Link from 'next/link'
import { HelpCircle, Mail, MapPin } from 'lucide-react'

export function Footer() {
  return (
    <footer className="w-full bg-[#1A1A1A] text-white pt-12 pb-6 mt-auto">
      <div className="max-w-[1280px] mx-auto px-4">
        {/* 4-Column Grid on Desktop / Stack on Mobile */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8 border-b border-gray-800 pb-8">
          
          {/* Column 1: Brand */}
          <div className="flex flex-col gap-4">
            <h2 className="text-2xl font-bold text-[#2D9A54]">UniDeal</h2>
            <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
              Your exclusive campus marketplace. Buy and sell second-hand goods safely within the LPU community.
            </p>
            <div className="flex items-center gap-2 text-gray-400 mt-2">
              <MapPin className="w-4 h-4 text-[#2D9A54]" />
              <span className="text-sm">Lovely Professional University</span>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="flex flex-col gap-3">
            <h3 className="font-semibold text-lg mb-2">Platform</h3>
            <Link href="/" className="text-gray-400 hover:text-white transition-colors text-sm">Browse Listings</Link>
            <Link href="/post" className="text-gray-400 hover:text-white transition-colors text-sm">List an Item</Link>
            <Link href="/categories" className="text-gray-400 hover:text-white transition-colors text-sm">All Categories</Link>
            <Link href="/dashboard" className="text-gray-400 hover:text-white transition-colors text-sm">My Dashboard</Link>
          </div>

          {/* Column 3: Trust & Safety */}
          <div className="flex flex-col gap-3">
            <h3 className="font-semibold text-lg mb-2">Trust & Safety</h3>
            <Link href="/safety" className="text-gray-400 hover:text-white transition-colors text-sm">Safety Guidelines</Link>
            <Link href="/verification" className="text-gray-400 hover:text-white transition-colors text-sm">Student Verification</Link>
            <Link href="/report" className="text-gray-400 hover:text-white transition-colors text-sm">Report a Listing</Link>
            <div className="flex items-center gap-2 text-gray-400 mt-2">
              <span className="text-xs px-2 py-1 bg-gray-800 rounded font-medium text-gray-300 border border-gray-700">AI Moderated</span>
            </div>
          </div>

          {/* Column 4: Support */}
          <div className="flex flex-col gap-3">
            <h3 className="font-semibold text-lg mb-2">Support</h3>
            <Link href="/contact" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm">
              <Mail className="w-4 h-4" />
              Contact Us
            </Link>
            <Link href="/faq" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm">
              <HelpCircle className="w-4 h-4" />
              FAQs
            </Link>
            <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors text-sm">Privacy Policy</Link>
            <Link href="/terms" className="text-gray-400 hover:text-white transition-colors text-sm">Terms of Service</Link>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center text-xs text-gray-500 gap-4">
          <p>© {new Date().getFullYear()} UniDeal Marketplace. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Built with ♥ for <span className="font-semibold text-gray-400">LPU Students</span>
          </p>
        </div>
      </div>
    </footer>
  )
}
