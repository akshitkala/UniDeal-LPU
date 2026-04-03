import Link from 'next/link'
import { ArrowLeft, PackageSearch } from 'lucide-react'

export function ListingNotAvailable() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-32 flex flex-col items-center text-center">
      <div className="w-24 h-24 bg-gray-50 text-gray-200 rounded-full flex items-center justify-center mb-8 border border-gray-100">
        <PackageSearch className="w-12 h-12" />
      </div>
      
      <h1 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">
        No such listing available
      </h1>
      
      <p className="text-gray-500 max-w-md mx-auto leading-relaxed mb-10">
        The item you're looking for might have been sold, removed, or is currently undergoing a routine security review.
      </p>

      <div className="flex flex-col sm:flex-row gap-4">
        <Link 
          href="/browse" 
          className="inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-8 py-3.5 rounded-full font-bold shadow-lg shadow-green-200 transition-all active:scale-95"
        >
          <ArrowLeft className="w-5 h-5" /> Back to Marketplace
        </Link>
        <Link 
          href="/support" 
          className="inline-flex items-center justify-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 px-8 py-3.5 rounded-full font-bold transition-all active:scale-95"
        >
          Contact Support
        </Link>
      </div>
      
      <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-8 w-full max-w-3xl">
          <div className="flex flex-col gap-1">
              <span className="text-xl font-bold text-gray-900">100%</span>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Verified Ads</span>
          </div>
          <div className="flex flex-col gap-1">
              <span className="text-xl font-bold text-gray-900">Campus</span>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Exclusively LPU</span>
          </div>
          <div className="flex flex-col gap-1">
              <span className="text-xl font-bold text-gray-900">Safe</span>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Peer-to-Peer</span>
          </div>
      </div>
    </div>
  )
}
