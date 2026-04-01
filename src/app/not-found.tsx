import Link from 'next/link'
import { Home, Search, Ghost } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 text-center">
      <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-8 animate-bounce">
        <Ghost className="w-12 h-12 text-[#2D9A54]" />
      </div>
      
      <h1 className="text-6xl font-black text-gray-900 mb-2">404</h1>
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Signal Lost in Taxonomy</h2>
      
      <p className="text-gray-500 max-w-md mx-auto mb-10 leading-relaxed font-medium">
        The listing or category branch you are looking for has been either evacuated, deleted, or never existed in the UniDeal registry.
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        <Link 
          href="/" 
          className="flex items-center gap-2 px-8 py-3 bg-[#2D9A54] hover:bg-[#258246] text-white font-bold rounded-xl transition-all shadow-lg active:scale-95"
        >
          <Home className="w-5 h-5" /> Back to Base
        </Link>
        
        <Link 
          href="/categories" 
          className="flex items-center gap-2 px-8 py-3 bg-white border border-gray-200 hover:border-[#2D9A54] text-gray-700 hover:text-[#2D9A54] font-bold rounded-xl transition-all shadow-sm active:scale-95"
        >
          <Search className="w-5 h-5" /> Browse Branches
        </Link>
      </div>
      
      <div className="mt-20 flex items-center gap-8 text-gray-300">
        <div className="flex flex-col items-center gap-1">
          <span className="text-[10px] font-bold uppercase tracking-widest">Latency</span>
          <span className="font-mono text-sm leading-none">0.02ms</span>
        </div>
        <div className="w-px h-8 bg-gray-200"></div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-[10px] font-bold uppercase tracking-widest">Protocol</span>
          <span className="font-mono text-sm leading-none">HTTPS/3</span>
        </div>
        <div className="w-px h-8 bg-gray-200"></div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-[10px] font-bold uppercase tracking-widest">Registry</span>
          <span className="font-mono text-sm leading-none">LPU-CENT-01</span>
        </div>
      </div>
    </div>
  )
}
