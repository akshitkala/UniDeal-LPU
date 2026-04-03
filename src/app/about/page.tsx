'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'

export default function AboutPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16 sm:py-24 font-serif">
      
      {/* OPENING */}
      <div className="mb-10">
        <span className="text-xs font-semibold text-green-600 uppercase tracking-widest block mb-5">
          How it all started
        </span>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
          It wasn&apos;t a startup idea at first.
          <br />
          <span className="text-2xl sm:text-3xl font-normal text-gray-400">
            It was just something I kept noticing.
          </span>
        </h1>
      </div>

      {/* SECTION 1: THE ALMIRAH */}
      <div className="text-base leading-8 text-gray-600">
        <p className="mb-7">
          Every semester ended the same way — my almirah getting more crowded.
        </p>
        <p className="mb-7">
          Books from previous subjects. Lab instruments. Notes. Random essentials. Things I once needed badly were now just lying there, untouched.
        </p>
        <p className="mb-7">
          And I knew this wasn&apos;t just me. Every student goes through the same cycle.
        </p>

        <div className="mt-10 mb-10 pl-5 border-l-2 border-green-500 text-lg sm:text-xl font-semibold text-gray-800 leading-9 italic">
          &ldquo;Buy. Use. Forget. Repeat.&rdquo;
        </div>
      </div>

      {/* SECTION 2: THE WHATSAPP WALL */}
      <hr className="border-gray-100 my-10" />
      
      <div className="text-base leading-8 text-gray-600">
        <p className="mb-7">
          At the same time, my WhatsApp was full of messages like:
        </p>

        <div className="mt-4 mb-6 ml-4 flex flex-col gap-3">
          <div className="bg-gray-50 rounded-2xl px-4 py-3 text-sm text-gray-500 w-fit max-w-xs font-medium">
            &ldquo;Does anyone need this book?&rdquo;
          </div>
          <div className="bg-gray-50 rounded-2xl px-4 py-3 text-sm text-gray-500 w-fit max-w-xs font-medium">
            &ldquo;Selling my lab manual, DM if interested&rdquo;
          </div>
          <div className="bg-gray-50 rounded-2xl px-4 py-3 text-sm text-gray-500 w-fit max-w-xs font-medium">
            &ldquo;Anyone want my Physics notes? ₹50 only&rdquo;
          </div>
        </div>

        <p className="mb-7">
          But most of these messages went nowhere.
        </p>
        <p className="mb-7">
          No replies. No proper reach. No real transaction.
        </p>
        <p className="mb-7">
          Not because people didn&apos;t need those things — but because there was no place where students actually looked for them.
        </p>
      </div>

      {/* SECTION 3: THE OTHER SIDE */}
      <hr className="border-gray-100 my-10" />

      <div className="text-base leading-8 text-gray-600">
        <div className="text-base font-semibold text-gray-900 mb-5">
          And then there was the other side.
        </div>
        <p className="mb-7">
          There were days when I needed something urgently. A book for a subject starting next week. A lab instrument I forgot to buy. Something small, but necessary.
        </p>
        <p className="mb-7">
          And the only option?
        </p>
        <div className="text-base font-semibold text-gray-800 my-3">
          Buy it brand new.
        </div>
        <p className="mb-7">
          Even when I knew — somewhere on the same campus, someone probably had the exact same thing. Just lying unused.
        </p>
        <p className="mb-7">
          But there was no way to find them. No quick search. No trusted platform. No system. Just guesswork and luck.
        </p>
      </div>

      {/* SECTION 4: THE REALISATION */}
      <hr className="border-gray-100 my-10" />

      <div className="text-base leading-8 text-gray-600">
        <div className="text-base font-semibold text-gray-900 mb-5">
          That&apos;s when it hit me.
        </div>
        <p className="mb-7">
          This wasn&apos;t just about unused stuff. It was about a broken connection.
        </p>

        <div className="mt-8 mb-8 pl-5 border-l-2 border-green-500 text-lg sm:text-xl font-semibold text-gray-800 leading-9 italic">
          &ldquo;On one side — students trying to sell things, but no one sees it. On the other side — students needing things urgently, but no one can find them. Both sides exist. Both sides struggle. And yet, they never meet.&rdquo;
        </div>
      </div>

      {/* SECTION 5: WHAT WAS BUILT */}
      <hr className="border-gray-100 my-10" />

      <div className="text-base leading-8 text-gray-600">
        <p className="mb-7">
          So this wasn&apos;t built to be just another platform.
        </p>
        <p className="mb-7">
          It was built to fix something simple, but real:
        </p>

        <div className="mt-6 mb-8 flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-3 shrink-0" />
            <div className="text-base text-gray-700 leading-7">
              Let students sell easily — without shouting into the void.
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-3 shrink-0" />
            <div className="text-base text-gray-700 leading-7">
              Let students find what they need, exactly when they need it.
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-3 shrink-0" />
            <div className="text-base text-gray-700 leading-7">
              Reduce waste, save money, and make student life a little smarter.
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 6: THE CLOSE */}
      <hr className="border-gray-100 my-10" />

      <div className="text-base leading-8 text-gray-600">
        <p className="mb-7">
          Because in the end, the problem was never availability.
        </p>
        <div className="text-lg sm:text-xl font-semibold text-gray-900 mt-4 mb-10 leading-8">
          It was visibility and connection.
        </div>

        <div className="mt-10 flex flex-col gap-0.5">
          <span className="text-sm font-semibold text-gray-900">— Akshit Kala</span>
          <span className="text-sm text-gray-500">Founder, UniDeal</span>
          <span className="text-xs text-gray-400 mt-1">LPU, Phagwara</span>
        </div>
      </div>

      {/* CTA SECTION */}
      <div className="mt-16 pt-10 border-t border-gray-100 text-center">
        <h4 className="text-base font-semibold text-gray-900 mb-1">
          Sound familiar?
        </h4>
        <p className="text-sm text-gray-500 mb-6">
          Clear your almirah. Find what you need. It takes a minute.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link 
            href="/browse" 
            className="bg-[#16a34a] text-white rounded-full h-10 px-6 text-sm font-semibold hover:bg-green-700 flex items-center justify-center transition-all"
          >
            Browse listings
          </Link>
          <Link 
            href="/post" 
            className="border border-gray-200 text-gray-700 rounded-full h-10 px-6 text-sm font-semibold hover:bg-gray-50 flex items-center justify-center transition-all"
          >
            List an item
          </Link>
        </div>
      </div>

    </div>
  )
}
