'use client'

import Image from 'next/image'
import Link from 'next/link'
import { 
  Heart, 
  Target, 
  Users, 
  Sparkles, 
  ChevronRight, 
  History,
  Rocket,
  ShieldCheck,
  CheckCircle2,
  ArrowRight
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function AboutPage() {
  return (
    <div className="flex flex-col gap-16 lg:gap-24 pb-20">
      
      {/* Hero Section */}
      <section className="relative h-[60vh] sm:h-[70vh] flex items-center justify-center overflow-hidden bg-gray-900">
        <Image 
          src="/images/about/campus.png" 
          alt="LPU Campus" 
          fill 
          className="object-cover opacity-50 transition-transform duration-1000"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-900/20 to-transparent" />
        
        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center space-y-6 flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-white text-[10px] font-bold uppercase tracking-widest">
             <Sparkles className="w-3 h-3 text-yellow-400" /> Our Origin Story
          </div>
          <h1 className="text-3xl md:text-4xl xl:text-5xl font-bold text-white tracking-tight leading-tight">
             Building a better <br className="hidden sm:block" /> campus marketplace.
          </h1>
          <p className="text-gray-300 max-w-xl text-sm sm:text-base font-medium leading-relaxed">
             UniDeal was born from a simple realization: finding affordable campus essentials shouldn't be a struggle. We built this for the LPU community.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        <div className="relative">
          <div className="relative aspect-[4/5] rounded-xl overflow-hidden border border-gray-100 shadow-sm">
            <Image 
               src="/images/about/founder.png" 
               alt="Founder of UniDeal" 
               fill 
               className="object-cover" 
            />
          </div>
          <div className="absolute -bottom-4 -right-4 h-24 w-24 bg-white rounded-xl p-4 shadow-lg border border-gray-100 flex flex-col items-center justify-center text-center">
               <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Est.<br/>2024</span>
          </div>
        </div>

        <div className="flex flex-col gap-8">
          <div className="space-y-3">
            <h2 className="text-[10px] font-bold text-[#16a34a] uppercase tracking-widest">Our Mission</h2>
            <h3 className="text-xl lg:text-2xl font-semibold text-gray-900 leading-tight">
               Sustainable commerce for every student.
            </h3>
          </div>

          <div className="space-y-4 text-sm sm:text-base text-gray-500 leading-relaxed font-medium">
             <p>
               Every semester, thousands of textbooks, lab kits, and dorm essentials are left behind. At the same time, new students face the high costs of university life.
             </p>
             <p>
               UniDeal provides a dedicated, safe space for LPU students to connect. By recycling resources within our community, we help students save money and reduce waste.
             </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
             <div className="flex gap-3 items-center">
                <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center text-[#16a34a]">
                   <Target className="w-5 h-5" />
                </div>
                <div>
                   <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wide">Focused</h4>
                   <p className="text-[11px] text-gray-500">Exclusively for LPU students.</p>
                </div>
             </div>
             <div className="flex gap-3 items-center">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                   <Users className="w-5 h-5" />
                </div>
                <div>
                   <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wide">Community</h4>
                   <p className="text-[11px] text-gray-500">Built on trust and mutual aid.</p>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="bg-gray-50/50 py-20 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 flex flex-col gap-12">
          <div className="flex flex-col items-center text-center gap-2">
             <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Our Values</h2>
             <h3 className="text-xl lg:text-2xl font-semibold text-gray-900">What we believe in.</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             {[
               {
                 title: 'Safety',
                 desc: 'Every user is verified via campus credentials for a secure experience.',
                 icon: ShieldCheck,
                 color: 'emerald'
               },
               {
                 title: 'Sustainability',
                 desc: 'We promote a circular economy to reduce campus environmental impact.',
                 icon: Heart,
                 color: 'rose'
               },
               {
                 title: 'Accessibility',
                 desc: 'Making university life more affordable for every student.',
                 icon: Sparkles,
                 color: 'blue'
               }
             ].map((item, i) => (
                <div key={i} className="p-8 bg-white border border-gray-100 rounded-xl shadow-sm">
                   <div className={cn(
                      "w-12 h-12 rounded-lg flex items-center justify-center mb-6",
                      item.color === 'emerald' ? 'bg-emerald-50 text-emerald-600' : 
                      item.color === 'rose' ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'
                   )}>
                      <item.icon className="w-6 h-6" />
                   </div>
                   <h4 className="text-base font-semibold text-gray-900 mb-2">{item.title}</h4>
                   <p className="text-sm text-gray-500 font-medium leading-relaxed">{item.desc}</p>
                </div>
             ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 w-full">
         <div className="bg-[#16a34a] rounded-xl p-8 sm:p-16 flex flex-col items-center text-center gap-8 shadow-lg shadow-green-100">
            <h3 className="text-xl sm:text-3xl font-bold text-white tracking-tight max-w-lg">
               Join the campus marketplace today.
            </h3>
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
               <Link href="/browse" className="h-11 px-8 bg-white text-[#16a34a] rounded-lg text-sm font-semibold flex items-center justify-center gap-2 hover:bg-gray-50 transition-all">
                  Browse products
               </Link>
               <Link href="/post" className="h-11 px-8 bg-[#15803d] text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[#14532d] transition-all border border-white/10">
                  Start selling
               </Link>
            </div>
         </div>
      </section>

    </div>
  )
}
