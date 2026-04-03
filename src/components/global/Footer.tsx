import Link from 'next/link'

export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 pt-16 pb-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12 pb-12">
          
          {/* Column 1: Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-[#16a34a] rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-white font-black text-xl">U</span>
              </div>
              <span className="text-xl font-bold text-gray-900 tracking-tight">UniDeal</span>
            </Link>
            <p className="text-xs text-gray-400 leading-relaxed mb-4">
              Campus marketplace — buy and sell, simply.
            </p>
            <p className="text-[10px] text-gray-400 font-medium italic">
              © 2026 UniDeal. Not affiliated with any university.
            </p>
          </div>

          {/* Column 2: Explore */}
          <div>
            <h3 className="text-sm font-bold text-gray-900 mb-4 tracking-tight uppercase">Explore</h3>
            <ul className="flex flex-col gap-3">
              <li><Link href="/browse" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Browse Listings</Link></li>
              <li><Link href="/#how-it-works" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">How it works</Link></li>
            </ul>
          </div>

          {/* Column 3: Account */}
          <div>
            <h3 className="text-sm font-bold text-gray-900 mb-4 tracking-tight uppercase">Account</h3>
            <ul className="flex flex-col gap-3">
              <li><Link href="/login" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Sign In</Link></li>
              <li><Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">My Dashboard</Link></li>
              <li><Link href="/profile" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Profile</Link></li>
            </ul>
          </div>

          {/* Column 4: Support */}
          <div>
            <h3 className="text-sm font-bold text-gray-900 mb-4 tracking-tight uppercase">Support</h3>
            <ul className="flex flex-col gap-3">
              <li><Link href="/contact" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Contact Us</Link></li>
              <li><Link href="/privacy" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-gray-50 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] text-gray-400 font-medium uppercase tracking-widest text-center sm:text-left">
          <p>Handcrafted for the campus community</p>
          <div className="flex items-center gap-4">
             <Link href="/terms" className="hover:text-gray-900 transition-colors">Terms</Link>
             <Link href="/safety" className="hover:text-gray-900 transition-colors">Safety</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
