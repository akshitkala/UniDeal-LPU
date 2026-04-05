'use client'

import { useState, useRef, useEffect } from 'react'
import { ListingCard } from './ListingCard'
import { addDays, isAfter } from 'date-fns'
import { Edit, Trash2, CheckCircle, Info, ArrowUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface DashboardCardProps {
  item: any
  actionLoading: string | null
  onBump: (slug: string) => void
  onSold: (slug: string) => void
  onDelete: (slug: string) => void
  activeTab: string
}

export function DashboardCard({ 
  item, 
  actionLoading, 
  onBump, 
  onSold, 
  onDelete,
  activeTab 
}: DashboardCardProps) {
  const [showPopover, setShowPopover] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const [isOnCooldown, setIsOnCooldown] = useState(false)
  const canBump = item.bumpCount < 3 && item.status === 'approved' && !item.aiFlagged

  useEffect(() => {
    const nextBumpDate = item.lastBumpAt ? addDays(new Date(item.lastBumpAt), 7) : null
    setIsOnCooldown(!!(nextBumpDate && isAfter(nextBumpDate, new Date())))
  }, [item.lastBumpAt])

  // Close popover on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node) && 
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setShowPopover(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <ListingCard 
      listing={item} 
      showSeller={false}
      actions={
        <div className="flex flex-col gap-2 w-full">
          {/* Status badge & Bump */}
          <div className="flex items-center justify-between w-full relative">
            <span className={cn(
              "text-[10px] lg:text-xs font-medium px-2 py-0.5 rounded-full",
              item.status === 'approved' ? "bg-green-50 text-green-700" :
              item.status === 'pending' || item.status === 'under_review' ? "bg-yellow-50 text-yellow-700" :
              item.status === 'rejected' ? "bg-red-50 text-red-700" :
              item.status === 'sold' ? "bg-gray-100 text-gray-500" :
              "bg-gray-100 text-gray-500"
            )}>
              {item.status === 'approved' ? 'Active' : 
               item.status === 'under_review' || item.status === 'pending' ? 'Under review' :
               item.status === 'rejected' ? 'Rejected' :
               item.status === 'sold' ? 'Sold' : 'Expired'}
            </span>
            
            {item.status === 'approved' && item.bumpCount < 3 && (
              <div className="flex items-center gap-1">
                <button 
                  onClick={(e) => {
                    e.stopPropagation()
                    onBump(item.slug)
                  }}
                  disabled={!!actionLoading || !canBump || isOnCooldown}
                  className={cn(
                    "h-7 px-2.5 text-[11px] font-bold rounded-full transition-all flex items-center gap-1",
                    isOnCooldown || !canBump ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-[#16a34a] text-white"
                  )}
                >
                  <ArrowUp className="w-3 h-3" />
                  Bump
                </button>
                
                {/* Info Icon Button */}
                <button
                  ref={buttonRef}
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowPopover(!showPopover)
                  }}
                  onMouseEnter={() => setShowPopover(true)}
                  className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <Info className="w-4 h-4" />
                </button>

                {/* Popover Implementation (Custom shadcn-like) */}
                {showPopover && (
                  <div 
                    ref={popoverRef}
                    className="absolute bottom-full right-0 mb-2 z-50 w-56 bg-white border border-gray-100 rounded-xl shadow-xl p-4 animate-in fade-in slide-in-from-bottom-1 duration-200"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <h4 className="text-[11px] font-bold text-gray-900 uppercase tracking-widest mb-3">How bumping works</h4>
                    <ul className="flex flex-col gap-2">
                       <li className="flex items-start gap-2.5 text-[12px] text-gray-600">
                          <div className="w-1 h-1 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                          Free — no cost
                       </li>
                       <li className="flex items-start gap-2.5 text-[12px] text-gray-600">
                          <div className="w-1 h-1 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                          Once every 7 days
                       </li>
                       <li className="flex items-start gap-2.5 text-[12px] text-gray-600">
                          <div className="w-1 h-1 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                          Max 3 bumps per listing
                       </li>
                       <li className="flex items-start gap-2.5 text-[12px] text-gray-600">
                          <div className="w-1 h-1 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                          Resets your 60-day expiry
                       </li>
                    </ul>
                    {/* Arrow down */}
                    <div className="absolute top-full right-2 w-3 h-3 bg-white border-r border-b border-gray-100 rotate-45 -mt-1.5" />
                  </div>
                )}
              </div>
            )}
            
            {item.status === 'approved' && item.bumpCount >= 3 && (
               <span className="text-[10px] text-gray-400 font-medium italic">Max bumps reached</span>
            )}
          </div>

          {/* Action buttons Row */}
          <div className={cn(
            "w-full gap-1.5",
            activeTab === 'active' ? "grid grid-cols-2 lg:flex lg:items-center" : "flex items-center"
          )}>
            {activeTab === 'active' && item.status === 'approved' && (
              <>
                <button 
                  onClick={(e) => {
                      e.stopPropagation()
                      onSold(item.slug)
                  }}
                  className="flex-1 lg:flex-none lg:w-8 h-8 flex items-center justify-center rounded-full bg-green-50 hover:bg-green-100 text-green-600 transition-all border border-green-100"
                  title="Mark as sold"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span className="lg:hidden ml-1.5 text-[10px] font-bold uppercase tracking-tight">Sold</span>
                </button>
                <Link 
                  href={`/listing/${item.slug}/edit`}
                  onClick={(e) => e.stopPropagation()}
                  className="flex-1 lg:flex-none lg:w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 hover:bg-gray-100 text-gray-600 transition-all border border-gray-100"
                  title="Edit"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span className="lg:hidden ml-1.5 text-[10px] font-bold uppercase tracking-tight">Edit</span>
                </Link>
                <button 
                  onClick={(e) => {
                      e.stopPropagation()
                      onDelete(item.slug)
                  }}
                  className="flex-1 lg:flex-none lg:w-8 h-8 flex items-center justify-center rounded-full bg-red-50 hover:bg-red-100 text-red-500 transition-all border border-red-100"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="lg:hidden ml-1.5 text-[10px] font-bold uppercase tracking-tight">Delete</span>
                </button>
              </>
            )}

            {/* If pending/rejected, still allow delete */}
            {activeTab !== 'active' && (
              <button 
                onClick={(e) => {
                    e.stopPropagation()
                    onDelete(item.slug)
                }}
                className="flex items-center gap-2 h-8 px-3 rounded-full bg-red-50 hover:bg-red-100 text-red-500 transition-all border border-red-100 text-[10px] font-bold uppercase tracking-widest"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            )}
          </div>
        </div>
      }
    />
  )
}
