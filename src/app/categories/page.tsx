import Link from 'next/link'
import { ChevronRight, Cpu, BookOpen, Bike, Shirt, Music, Home as HomeIcon } from 'lucide-react'

export const metadata = {
  title: 'Categories | UniDeal',
  description: 'Explore the full range of campus-approved categories on the UniDeal marketplace.'
}

export default function CategoriesPage() {
  const categories = [
    { name: 'Electronics', slug: 'electronics', icon: <Cpu className="w-8 h-8 text-blue-600" />, desc: 'Laptops, peripherals, and high-performance gadgets.' },
    { name: 'Books & Notes', slug: 'books-notes', icon: <BookOpen className="w-8 h-8 text-indigo-600" />, desc: 'Textbooks, lab manuals, and shared academic records.' },
    { name: 'Vehicles', slug: 'vehicles', icon: <Bike className="w-8 h-8 text-emerald-600" />, desc: 'Bicycles, scooty, and campus-ready commutes.' },
    { name: 'Fashion', slug: 'fashion', icon: <Shirt className="w-8 h-8 text-pink-600" />, desc: 'Branded apparel, accessories, and thrifted style.' },
    { name: 'Hobbies', slug: 'hobbies', icon: <Music className="w-8 h-8 text-amber-600" />, desc: 'Music gear, sports equipment, and creative tools.' },
    { name: 'Dorm Setup', slug: 'dorm-setup', icon: <HomeIcon className="w-8 h-8 text-cyan-600" />, desc: 'Cozy essentials for your hostel room upgrade.' },
  ]

  return (
    <div className="max-w-[1280px] mx-auto px-4 py-16">
      <div className="mb-12">
        <h1 className="text-4xl font-black text-gray-900 mb-2">Category Registry</h1>
        <p className="text-gray-500 font-medium tracking-tight uppercase text-xs">Explore the UniDeal Taxonomy</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((cat) => (
          <Link 
            key={cat.slug} 
            href={`/browse?category=${cat.slug}&name=${encodeURIComponent(cat.name)}`}
            className="group bg-white border border-[#E5E5E5] p-8 rounded-3xl hover:border-[#2D9A54] hover:shadow-xl transition-all duration-300 relative overflow-hidden"
          >
            <div className="relative z-10">
              <div className="w-16 h-16 bg-[#F9F9F9] rounded-2xl flex items-center justify-center mb-6 group-hover:bg-white transition-colors border border-transparent group-hover:border-gray-100 group-hover:scale-110 transition-transform duration-300">
                {cat.icon}
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{cat.name}</h2>
              <p className="text-gray-500 text-sm leading-relaxed mb-6">{cat.desc}</p>
              <div className="flex items-center gap-2 text-[#2D9A54] font-bold text-sm">
                Enter Branch <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
            
            {/* Background design element */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#2D9A54]/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
          </Link>
        ))}
      </div>
    </div>
  )
}
