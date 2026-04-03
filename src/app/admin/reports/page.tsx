'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { 
  AlertTriangle, 
  CheckCircle, 
  Flag, 
  User, 
  ExternalLink,
  Loader2,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertOctagon,
  Eye,
  Trash2,
  Archive,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'

interface Report {
  _id: string
  listing: {
    _id: string
    title: string
    slug: string
    images: string[]
  }
  reportedBy: {
    displayName: string
    email: string
  }
  reason: string
  description?: string
  status: 'pending' | 'reviewed' | 'dismissed'
  createdAt: string
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [activeTab, setActiveTab] = useState<'pending' | 'reviewed' | 'dismissed'>('pending')
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchReports = async (status: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/reports?status=${status}`)
      const data = await res.json()
      setReports(data.reports || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReports(activeTab)
  }, [activeTab])

  const handleAction = async (id: string, action: 'resolve' | 'dismiss') => {
    setActionLoading(id)
    try {
      const res = await fetch(`/api/admin/reports/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, note: `Handled via admin dashboard` })
      })
      if (res.ok) {
        setReports(prev => prev.filter(r => r._id !== id))
      }
    } catch (err) {
      console.error(err)
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      
      {/* Header & Tabs */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
        <div>
          <h1 className="text-xl lg:text-2xl font-semibold text-gray-900">Reports</h1>
          <p className="text-sm text-gray-500 mt-0.5">Review listing violations and user reports</p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-full">
            {[
                { id: 'pending', label: 'Pending', icon: ShieldAlert },
                { id: 'reviewed', label: 'Reviewed', icon: CheckCircle2 },
                { id: 'dismissed', label: 'Dismissed', icon: Archive }
            ].map(tab => (
                <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'pending' | 'reviewed' | 'dismissed')}
                  className={cn(
                    "px-6 h-9 rounded-full text-xs font-semibold transition-all flex items-center gap-2",
                    activeTab === tab.id ? "bg-white shadow-sm text-gray-900" : "text-gray-400 hover:text-gray-600"
                  )}
                >
                    <tab.icon className="w-3.5 h-3.5" />
                    {tab.label}
                </button>
            ))}
        </div>
      </header>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-40 gap-3 opacity-50">
          <Loader2 className="w-8 h-8 animate-spin text-[#16a34a]" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Syncing...</span>
        </div>
      ) : reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-40 px-10 text-center opacity-50">
            <ShieldCheck className="w-12 h-12 text-gray-200 mb-4" />
            <p className="text-sm font-semibold text-gray-400">No {activeTab} reports</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reports.map(report => (
            <div key={report._id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:border-gray-200 transition-all flex gap-4">
               
               {/* Listing Image */}
               <div className="relative w-24 h-24 sm:w-32 sm:h-32 shrink-0 rounded-lg overflow-hidden border border-gray-50 flex items-center justify-center bg-gray-50">
                    {report.listing?.images?.[0] ? (
                        <Image 
                            src={report.listing.images[0]} 
                            fill 
                            alt="" 
                            className="object-contain"
                            sizes="128px"
                        />
                    ) : (
                        <Flag className="w-8 h-8 text-gray-200" />
                    )}
               </div>

               {/* Report Detail */}
               <div className="flex-1 min-w-0 flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-4">
                     <div className="min-w-0">
                        <span className={cn(
                            "px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border",
                            report.reason === 'inappropriate' || report.reason === 'fake_listing' ? 'bg-red-50 border-red-100 text-red-600' : 'bg-orange-50 border-orange-100 text-orange-600'
                        )}>
                            {report.reason.replace('_', ' ')}
                        </span>
                        <h3 className="text-sm font-semibold text-gray-900 truncate mt-1">
                            {report.listing?.title}
                        </h3>
                     </div>
                     <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap">
                        {formatDistanceToNow(new Date(report.createdAt))} ago
                     </span>
                  </div>

                  <div className="flex items-center gap-2">
                     <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                         <User className="w-3.5 h-3.5 text-gray-400" />
                     </div>
                     <span className="text-[10px] font-semibold text-gray-500">Reported by {report.reportedBy.displayName}</span>
                  </div>

                  <div className="p-3 bg-gray-50 border border-gray-100 rounded-lg">
                     <p className="text-[11px] text-gray-600 leading-relaxed font-medium italic line-clamp-2">
                        "{report.description || 'No description provided.'}"
                     </p>
                  </div>

                  {activeTab === 'pending' && (
                     <div className="flex items-center gap-2 mt-auto">
                        <button 
                            onClick={() => handleAction(report._id, 'resolve')}
                            disabled={!!actionLoading}
                            className="flex-1 h-9 bg-[#16a34a] text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 hover:bg-[#15803d] transition-all disabled:opacity-50"
                        >
                            {actionLoading === report._id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                            Resolve
                        </button>
                        <button 
                            onClick={() => handleAction(report._id, 'dismiss')}
                            disabled={!!actionLoading}
                            className="h-9 w-9 bg-red-50 text-red-600 rounded-lg flex items-center justify-center hover:bg-red-100 transition-all text-xs font-semibold"
                            title="Dismiss report"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                     </div>
                  )}
               </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
