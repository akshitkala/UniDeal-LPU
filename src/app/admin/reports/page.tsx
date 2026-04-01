'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { 
  AlertTriangle, 
  CheckCircle, 
  XSquare, 
  Flag, 
  User, 
  ExternalLink,
  Loader2,
  ChevronRight,
  MoreVertical,
  Calendar
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

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

/**
 * A-03: Admin Reports Review (Fix 15).
 * Features: status tabs, quick resolution, and detailed context view.
 */
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
        body: JSON.stringify({ action, note: `Handled via dashboard` })
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
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
             <Flag className="w-8 h-8 text-amber-500" />
             Reports Queue
          </h1>
          <p className="text-gray-500 mt-1">Review student reports and listing violations.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200">
        {(['pending', 'reviewed', 'dismissed'] as const).map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 font-semibold text-sm transition-all border-b-2 capitalize ${
              activeTab === tab 
                ? 'border-[#2D9A54] text-[#2D9A54]' 
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[#2D9A54]" />
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-32 bg-white rounded-3xl border border-dashed border-gray-200 flex flex-col items-center">
           <CheckCircle className="w-12 h-12 text-gray-200 mb-4" />
           <p className="text-gray-400 font-medium">Clear Queue: No {activeTab} reports found.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {reports.map(report => (
            <div key={report._id} className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col lg:flex-row gap-6 relative overflow-hidden group">
               {/* Marker */}
               <div className={`absolute top-0 left-0 bottom-0 w-1 ${
                  report.reason === 'inappropriate' || report.reason === 'fake_listing' ? 'bg-red-500' : 'bg-amber-400'
               }`} />

               {/* Target Listing Card Component Concept */}
               <div className="flex-shrink-0 w-full lg:w-72">
                  <div className="relative aspect-video rounded-2xl overflow-hidden bg-gray-100 border border-gray-50 mb-3">
                    <Image 
                       src={report.listing?.images?.[0] || '/placeholder.png'} 
                       fill 
                       alt="listing preview" 
                       className="object-cover"
                    />
                  </div>
                  <h3 className="font-bold text-gray-900 line-clamp-1">{report.listing?.title}</h3>
                  <Link 
                    href={`/listing/${report.listing?.slug}`} 
                    target="_blank"
                    className="inline-flex items-center gap-1.5 text-xs text-blue-600 font-bold mt-1 hover:underline"
                  >
                    View Global Post <ExternalLink className="w-3 h-3" />
                  </Link>
               </div>

               {/* Report Detail */}
               <div className="flex-1 space-y-4">
                  <div className="flex flex-wrap gap-4 items-center justify-between">
                     <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-gray-900 text-white text-[10px] uppercase font-black tracking-widest rounded-full">
                           {report.reason.replace('_', ' ')}
                        </span>
                        <div className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                           <Calendar className="w-3 h-3" />
                           {formatDistanceToNow(new Date(report.createdAt))} ago
                        </div>
                     </div>
                     <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
                        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                           <User className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex flex-col">
                           <span className="text-gray-900 font-bold">{report.reportedBy.displayName}</span>
                           <span className="text-[10px]">{report.reportedBy.email}</span>
                        </div>
                     </div>
                  </div>

                  <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                     <p className="text-sm text-gray-700 leading-relaxed italic">
                        "{report.description || 'No additional description provided by reporter.'}"
                     </p>
                  </div>
               </div>

               {/* Quick Actions */}
               <div className="lg:w-48 flex lg:flex-col justify-end gap-2 p-1 pt-4 lg:pt-1 border-t lg:border-t-0 lg:border-l border-gray-100">
                  <button 
                    onClick={() => handleAction(report._id, 'resolve')}
                    disabled={activeTab !== 'pending' || !!actionLoading}
                    className="flex-1 lg:flex-none flex items-center justify-center gap-2 h-11 bg-[#2D9A54] text-white rounded-xl text-sm font-bold hover:bg-[#258246] transition-all disabled:opacity-50"
                  >
                    {actionLoading === report._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    Resolve
                  </button>
                  <button 
                    onClick={() => handleAction(report._id, 'dismiss')}
                    disabled={activeTab !== 'pending' || !!actionLoading}
                    className="flex-1 lg:flex-none flex items-center justify-center gap-2 h-11 border border-gray-200 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all disabled:opacity-50"
                  >
                    {actionLoading === report._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XSquare className="w-4 h-4" />}
                    Dismiss
                  </button>
               </div>

            </div>
          ))}
        </div>
      )}
    </div>
  )
}
