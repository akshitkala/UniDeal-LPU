import Link from 'next/link'
import { cn } from '@/lib/utils'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white selection:bg-green-100 selection:text-green-900">
      <div className="max-w-2xl mx-auto px-4 pt-20 pb-24">
        
        {/* --- SECTION 1: THE ALMIRAH --- */}
        <section className="mb-12 py-12">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-8 block">
            THE ALMIRAH
          </span>
          <h1 className="text-4xl sm:text-6xl font-bold text-gray-950 leading-[1.1] tracking-tight mb-12">
            Every semester, my almirah got a little more crowded.
          </h1>
          <div className="space-y-8 text-gray-700 leading-relaxed font-sans text-base">
            <p className="leading-loose">
              Textbooks I&apos;d finished. Lab instruments I&apos;d never touch again. Notes photocopied in a rush during exams. Things I&apos;d once paid full price for — sometimes anxiously, because money was tight — now just taking up space.
            </p>
            <p className="leading-loose">
              I&apos;d look at the stack and think: someone needs exactly this right now. A junior somewhere is about to buy the same book brand new. And I have no way to reach them.
            </p>
          </div>
          
          <div className="mt-16 pl-6 border-l-2 border-[#16a34a]">
             <blockquote className="text-xl sm:text-2xl font-serif italic text-gray-800 leading-relaxed">
               &ldquo;Buy. Use. Forget. Repeat. It was a cycle that made no sense.&rdquo;
             </blockquote>
          </div>
        </section>

        <hr className="border-t border-gray-100 mb-12" />

        {/* --- SECTION 2: THE WALL --- */}
        <section className="mb-12 py-12">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-8 block">
            THE WALL
          </span>
          
          <div className="space-y-8 mb-16 text-gray-700 leading-relaxed font-sans text-base">
            <p className="leading-loose">
              The listings weren&apos;t the problem. Students were trying. Every week, someone posted something in a group. But WhatsApp groups aren&apos;t marketplaces — they&apos;re conversations.
            </p>
          </div>

          {/* WhatsApp Chat UI */}
          <div className="w-full bg-gray-950 rounded-[2rem] p-6 sm:p-8 overflow-hidden relative shadow-2xl shadow-gray-200">
            <div className="space-y-6">
              <div className="flex flex-col items-start max-w-[85%]">
                <span className="text-[10px] text-gray-500 mb-1 ml-2 uppercase font-medium">Rahul (B.Tech)</span>
                <div className="bg-gray-800 text-gray-100 rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm shadow-sm">
                  Selling my sem-3 Physics book. Brand new condition. Anyone interested?
                </div>
                <span className="text-[9px] text-gray-600 mt-1 ml-2 uppercase">11:47 AM</span>
              </div>

              <div className="flex flex-col items-start max-w-[85%]">
                <span className="text-[10px] text-gray-500 mb-1 ml-2 uppercase font-medium">Isha P.</span>
                <div className="bg-gray-800 text-gray-100 rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm shadow-sm">
                  Does anyone have a Drafter for sale?
                </div>
                <span className="text-[9px] text-gray-600 mt-1 ml-2 uppercase">11:49 AM</span>
              </div>

              <div className="flex flex-col items-start max-w-[85%] opacity-60">
                <span className="text-[10px] text-gray-500 mb-1 ml-2 uppercase font-medium">Aman Deep</span>
                <div className="bg-gray-800 text-gray-100 rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm shadow-sm">
                  Lab coat available. Never used. ₹200.
                </div>
                <span className="text-[9px] text-gray-600 mt-1 ml-2 uppercase">2:03 PM</span>
              </div>

              <div className="flex flex-col items-start max-w-[85%] opacity-30">
                <span className="text-[10px] text-gray-500 mb-1 ml-2 uppercase font-medium">Sneha Gupta</span>
                <div className="bg-gray-800 text-gray-100 rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm shadow-sm">
                   Giving away my previous year notes for free. Hostal 4, Room 302.
                </div>
              </div>
            </div>

            {/* Gradient Overlay */}
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-gray-950 via-gray-950/80 to-transparent" />
          </div>
          <p className="text-[11px] text-gray-400 text-center mt-6 italic">
            &ldquo;And then, new messages pushed them all out of view.&rdquo;
          </p>

          <div className="mt-16 space-y-8 text-gray-700 leading-relaxed font-sans text-base">
            <p className="leading-loose">
              A listing lives for a few hours before 200 new messages bury it. There&apos;s no search. No filter. No way to find a book from three weeks ago. It just disappears. And the seller gives up, keeps the item, or throws it away.
            </p>
          </div>
        </section>

        <hr className="border-t border-gray-100 mb-12" />

        {/* --- SECTION 3: THE GAP --- */}
        <section className="mb-12 py-12">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-8 block">
            THE GAP
          </span>

          <div className="space-y-8 mb-16 text-gray-700 leading-relaxed font-sans text-base">
            <p className="leading-loose">
              I started paying attention and realised this was everywhere. A third-year student with a barely-used cycle no one would buy. A fresher arriving on campus spending ₹3,000 on a mattress that five seniors would have sold for ₹500.
            </p>
          </div>

          {/* Gap Visual Divider */}
          <div className="w-full max-w-md mx-auto my-16 select-none">
             <div className="flex items-center justify-between gap-4 sm:gap-8">
                <div className="flex-1 aspect-[4/3] flex flex-col items-center justify-center border border-gray-200 rounded-2xl p-4 text-center group hover:border-[#16a34a] transition-colors">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 group-hover:text-[#16a34a]">The Supply</span>
                  <span className="text-sm font-medium text-gray-600">Students with stuff to sell</span>
                </div>
                
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-300">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                </div>

                <div className="flex-1 aspect-[4/3] flex flex-col items-center justify-center border border-gray-200 rounded-2xl p-4 text-center group hover:border-[#16a34a] transition-colors">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 group-hover:text-[#16a34a]">The Demand</span>
                  <span className="text-sm font-medium text-gray-600">Students who need it now</span>
                </div>
             </div>
             <p className="text-[10px] text-gray-400 text-center mt-6 italic tracking-tight">
                Same campus. Same items. Never finding each other.
             </p>
          </div>

          <div className="pl-6 border-l-2 border-[#16a34a] my-16">
             <blockquote className="text-xl sm:text-2xl font-serif italic text-gray-800 leading-relaxed">
               &ldquo;The items existed. The demand existed. The only thing missing was a connection.&rdquo;
             </blockquote>
          </div>

          <div className="space-y-8 text-gray-700 leading-relaxed font-sans text-base">
            <p className="leading-loose">
              The only thing missing was a place for them to find each other. And for some reason, no one had built it for campus.
            </p>
          </div>
        </section>

        <hr className="border-t border-gray-100 mb-12" />

        {/* --- SECTION 4: WHY --- */}
        <section className="mb-12 py-12">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-950 tracking-tight mb-8">
            OLX works for cities. Not for hostels.
          </h2>
          <div className="space-y-8 text-gray-700 leading-relaxed font-sans text-base">
            <p className="leading-loose">
              The existing platforms have no concept of campus. No trust signal between a buyer and a seller who live two buildings apart. No awareness that you can just walk over and check the condition yourself.
            </p>
            <p className="leading-loose font-medium text-gray-900 border-l-2 border-gray-100 pl-6">
              They&apos;re built for strangers across a city. We&apos;re neighbours. That&apos;s a fundamentally different transaction, and it deserves a fundamentally different platform.
            </p>
          </div>
        </section>

        <hr className="border-t border-gray-100 mb-12" />

        {/* --- SECTION 5: WHAT WAS BUILT --- */}
        <section className="mb-12 py-12">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-12 block">
            WHAT WAS BUILT
          </span>

          <div className="space-y-20">
            {[
              { num: '01', title: 'A structured, searchable feed', body: 'So listings don&apos;t disappear after 6 hours. Every item gets its own space, indexed by category and price.' },
              { num: '02', title: 'Contact protection that works', body: 'Your number is never public. It is revealed only when a real student, verified by the platform, asks for it.' },
              { num: '03', title: 'A bump system', body: 'Brings your listing back to the top of the feed once a week for free. No paid ads required for students.' }
            ].map((step, i) => (
              <div key={i} className="relative pl-12 sm:pl-16">
                <span className="absolute left-0 top-0 text-5xl sm:text-7xl font-black text-gray-50 -translate-y-4 select-none -z-10">
                  {step.num}
                </span>
                <h3 className="text-base font-bold text-gray-950 mb-3">{step.title}</h3>
                <p className="text-sm text-gray-600 leading-loose max-w-lg" dangerouslySetInnerHTML={{ __html: step.body }} />
              </div>
            ))}
          </div>
        </section>

        <hr className="border-t border-gray-100 mb-12" />

        {/* --- SECTION 6: WHO BUILT IT --- */}
        <section className="mb-12 py-12">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-8 block">
            WHO BUILT IT
          </span>
          
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mt-8">
            <div className="w-14 h-14 rounded-full bg-green-50 text-[#16a34a] flex items-center justify-center font-black text-xl shrink-0 border border-green-100">
               AK
            </div>
            <div className="text-center sm:text-left">
              <h4 className="text-base font-bold text-gray-950">Akshit Kala</h4>
              <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mt-1">Founder, Solo Developer</p>
              <p className="mt-4 text-sm text-gray-700 leading-relaxed italic">
                &ldquo;I built this in my room, at zero budget, because I kept running into the same wall. Figured if it annoyed me this much, it was probably worth fixing.&rdquo;
              </p>
              <span className="text-[10px] text-gray-400 block mt-6 font-medium">March 2026 &middot; LPU, Phagwara</span>
            </div>
          </div>
        </section>

        {/* --- CTA SECTION --- */}
        <div className="mt-24 pt-16 border-t border-gray-100 text-center">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
            <Link 
              href="/browse" 
              className="w-full sm:w-auto h-11 px-8 bg-[#16a34a] text-white rounded-xl font-bold text-sm hover:bg-green-700 transition-all active:scale-95 flex items-center justify-center"
            >
              Browse listings
            </Link>
            <Link 
              href="/post" 
              className="w-full sm:w-auto h-11 px-8 border border-gray-200 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all active:scale-95 flex items-center justify-center"
            >
              List an item
            </Link>
          </div>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">
            It takes about 60 seconds to list something.
          </p>
        </div>

      </div>
    </div>
  )
}
