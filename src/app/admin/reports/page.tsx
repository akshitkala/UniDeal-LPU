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
  Calendar,
  ShieldAlert,
  BrainCircuit,
  Zap,
  Clock,
  CheckCircle2,
  AlertOctagon,
  Eye,
  Trash2,
  Archive,
  ShieldCheck
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
        body: JSON.stringify({ action, note: `Handled via tactical dashboard` })
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
    <div className="max-w-[1440px] mx-auto flex flex-col gap-12 px-6 md:px-12 mb-20 overflow-hidden">
      
      {/* Neural Header */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 py-8 shrink-0">
        <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 px-3 py-1 bg-rose-50 text-rose-700 text-[10px] font-black uppercase tracking-widest rounded-full border border-rose-100 w-fit">
                <AlertOctagon className="w-3.5 h-3.5" /> Integrity Violation Vector
            </div>
            <h1 className="text-5xl font-black text-gray-900 tracking-tighter leading-none">Intelligence Queue</h1>
            <p className="text-gray-500 font-medium text-lg">
                Neutralize reports, resolve conflicts, and maintain campus marketplace standards.
            </p>
        </div>

        <div className="flex items-center gap-2 p-1.5 bg-gray-100/50 backdrop-blur-md border border-gray-200 rounded-[2rem]">
            {[
                { id: 'pending', label: 'Active Alerts', icon: ShieldAlert, color: 'text-rose-600' },
                { id: 'reviewed', label: 'Case Studies', icon: CheckCircle2, color: 'text-emerald-600' },
                { id: 'dismissed', label: 'Archived Signal', icon: Archive, color: 'text-gray-600' }
            ].map(tab => (
                <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'pending' | 'reviewed' | 'dismissed')}
                  className={cn(
                    "px-8 py-3 rounded-[1.5rem] font-black text-xs transition-all flex items-center gap-2",
                    activeTab === tab.id ? "bg-white shadow-sm text-gray-900" : "text-gray-400 hover:text-gray-600"
                  )}
                >
                    <tab.icon className={cn("w-4 h-4", activeTab === tab.id ? tab.color : "text-gray-300")} />
                    {tab.label}
                </button>
            ))}
        </div>
      </header>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-40 gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-rose-600" />
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Synchronizing Violation Data</p>
        </div>
      ) : reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-40 px-10 text-center bg-white border border-gray-100 rounded-[4rem] shadow-premium">
           <div className="w-24 h-24 bg-emerald-50 rounded-[3rem] flex items-center justify-center mb-8 border border-emerald-100">
                <CheckCircle2 className="w-12 h-12 text-emerald-500" />
           </div>
           <h3 className="text-3xl font-black text-gray-900 tracking-tighter uppercase mb-4">Registry Secure</h3>
           <p className="text-gray-500 font-medium max-w-sm">No {activeTab} violations detected in this sector. Integrity levels at 100%.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {reports.map(report => (
            <div key={report._id} className="group relative bg-white border border-gray-100 rounded-[3.5rem] p-4 shadow-sm hover:shadow-premium transition-all duration-500 hover:-translate-y-2 overflow-hidden">
               
               {/* Risk Indicator */}
               <div className={cn(
                   "absolute top-0 left-0 bottom-0 w-2",
                   report.reason === 'inappropriate' || report.reason === 'fake_listing' ? 'bg-rose-500' : 'bg-amber-400'
               )} />

               <div className="flex flex-col md:flex-row gap-8">
                  {/* Asset Preview */}
                  <div className="relative w-full md:w-56 h-56 shrink-0 rounded-[2.5rem] overflow-hidden border border-gray-100 shadow-xl-soft">
                        <Image 
                        src={report.listing?.images?.[0] || '/placeholder.png'} 
                        fill 
                        alt="listing preview" 
                        className="object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors pointer-events-none" />
                        <Link 
                            href={`/listing/${report.listing?.slug}`} 
                            target="_blank"
                            className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        >
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-2xl">
                                <ExternalLink className="w-5 h-5 text-gray-900" />
                            </div>
                        </Link>
                  </div>

                  {/* Intelligence Report */}
                  <div className="flex-1 flex flex-col gap-6 py-4 pr-4">
                     <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <span className={cn(
                                "px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border",
                                report.reason === 'inappropriate' || report.reason === 'fake_listing' ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-amber-50 border-amber-200 text-amber-700'
                            )}>
                                {report.reason.replace('_', ' ')}
                            </span>
                            <div className="text-[10px] text-gray-300 font-bold flex items-center gap-2">
                                <Clock className="w-3 h-3" /> {formatDistanceToNow(new Date(report.createdAt))}
                            </div>
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 tracking-tighter uppercase line-clamp-1 truncate group-hover:text-rose-600 transition-colors">
                            {report.listing?.title}
                        </h3>
                     </div>

                     <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100 shrink-0">
                                <User className="w-5 h-5 text-gray-300" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Reporter</span>
                                <span className="text-xs font-black text-gray-900">{report.reportedBy.displayName}</span>
                            </div>
                        </div>
                     </div>

                     <div className="p-6 bg-gray-50/50 rounded-[2rem] border border-gray-100 relative group-hover:bg-white transition-colors duration-500">
                        <p className="text-sm text-gray-600 leading-relaxed font-medium italic">
                           "{report.description || 'No binary context provided by agent.'}"
                        </p>
                     </div>

                     {/* Tactical Actions */}
                     {activeTab === 'pending' && (
                        <div className="flex items-center gap-4 mt-2">
                            <button 
                                onClick={() => handleAction(report._id, 'resolve')}
                                disabled={!!actionLoading}
                                className="flex-1 h-16 bg-gray-900 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all hover:bg-emerald-600 active:scale-95 shadow-xl-soft"
                            >
                                {actionLoading === report._id ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                                Commit Resolve
                            </button>
                            <button 
                                onClick={() => handleAction(report._id, 'dismiss')}
                                disabled={!!actionLoading}
                                className="h-16 px-10 border border-gray-100 hover:border-rose-100 hover:bg-rose-50 hover:text-rose-600 rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all text-gray-400"
                            >
                                {actionLoading === report._id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                            </button>
                        </div>
                     )}
                  </div>
               </div>

            </div>
          ))}
        </div>
      )}
    </div>
  )
}
