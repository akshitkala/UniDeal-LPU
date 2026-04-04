'use client'

import { useEffect, useState, useCallback } from 'react'
import { 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  ExternalLink, 
  History, 
  UserX, 
  MoreVertical,
  Loader2,
  Trash2,
  Check,
  X,
  AlertTriangle,
  User
} from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ConfirmModal } from '@/components/global/ConfirmModal'
import { Banner } from '@/components/global/Banner'
import { getRelativeTime } from '@/lib/utils/time'
import { Avatar } from '@/components/ui/Avatar'
import { cn } from '@/lib/utils'

type ReportStatus = 'pending' | 'reviewed' | 'dismissed'

interface Report {
  _id: string
  reason: string
  description?: string
  status: ReportStatus
  createdAt: string
  reportedBy: {
    uid: string
    email: string
    displayName: string
    photoURL?: string
    createdAt: string
  }
  listing: {
    _id: string
    title: string
    slug: string
    images: string[]
    price: number
    condition: string
    status: string
    isDeleted: boolean
    sellerBanned: boolean
    seller: {
      uid: string
      email: string
      displayName: string
    }
  } | null
  reviewedBy?: {
    displayName: string
    email: string
  }
  reviewedAt?: string
}

const REASON_COLORS: Record<string, string> = {
  fake_listing: 'bg-red-100 text-red-700 border-red-200',
  spam: 'bg-orange-100 text-orange-700 border-orange-200',
  inappropriate: 'bg-red-100 text-red-700 border-red-200',
  wrong_price: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  already_sold: 'bg-gray-100 text-gray-700 border-gray-200',
  other: 'bg-gray-100 text-gray-700 border-gray-200',
}

const REASON_LABELS: Record<string, string> = {
  fake_listing: 'Fake Listing',
  spam: 'Spam',
  inappropriate: 'Inappropriate',
  wrong_price: 'Wrong Price',
  already_sold: 'Already Sold',
  other: 'Other',
}

export default function ReportsManagement() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [reports, setReports] = useState<Report[]>([])
  const [counts, setCounts] = useState({ pending: 0, reviewed: 0, dismissed: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  
  const currentStatus = (searchParams.get('status') || 'pending') as ReportStatus
  const [page, setPage] = useState(1)

  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean
    type: 'reviewed' | 'dismissed' | 'ban'
    reportId: string | null
    displayName: string
    sellerUid?: string
  }>({ isOpen: false, type: 'reviewed', reportId: null, displayName: '' })

  const [reasonInput, setReasonInput] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const fetchReports = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/reports?status=${currentStatus}&page=${page}&limit=20`)
      if (res.ok) {
        const data = await res.json()
        setReports(data.reports)
        setCounts(data.counts)
        setError(null)
      } else {
        setError('Failed to load reports.')
      }
    } catch {
      setError('Connection failed.')
    } finally {
      setLoading(false)
    }
  }, [currentStatus, page])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  const handleStatusChange = (status: ReportStatus) => {
    const params = new URLSearchParams(searchParams)
    params.set('status', status)
    params.delete('page')
    router.push(`/admin/reports?${params.toString()}`)
    setPage(1)
  }

  const handleAction = async () => {
    if (!modalConfig.reportId && modalConfig.type !== 'ban') return
    setActionLoading(true)

    try {
      if (modalConfig.type === 'ban') {
        const res = await fetch(`/api/admin/users/${modalConfig.sellerUid}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'ban', reason: reasonInput || 'Reporting moderation action' })
        })
        if (res.ok) {
          setSuccessMessage('Seller banned successfully')
          fetchReports()
        } else {
          const data = await res.json()
          setError(data.error || 'Failed to ban seller')
        }
      } else {
        const res = await fetch(`/api/admin/reports/${modalConfig.reportId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: modalConfig.type, note: reasonInput })
        })
        if (res.ok) {
          setSuccessMessage(`Report ${modalConfig.type === 'reviewed' ? 'reviewed' : 'dismissed'}`)
          fetchReports()
        } else {
          const data = await res.json()
          setError(data.error || 'Action failed')
        }
      }
      
      setModalConfig({ isOpen: false, type: 'reviewed', reportId: null, displayName: '' })
      setReasonInput('')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch {
      setError('Connection failed.')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <header className="mb-8">
        <h1 className="text-xl lg:text-2xl font-semibold text-gray-900 flex items-center gap-3">
          Reports
          {counts.pending > 0 && (
            <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">
              {counts.pending}
            </span>
          )}
        </h1>
        <p className="text-sm text-gray-500 mt-1">Review and manage user-submitted listing reports</p>
      </header>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-gray-100/50 p-1 rounded-xl w-fit mb-8">
        {(['pending', 'reviewed', 'dismissed'] as const).map((status) => (
          <button
            key={status}
            onClick={() => handleStatusChange(status)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2",
              currentStatus === status 
                ? "bg-white text-gray-900 shadow-sm" 
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
            <span className={cn(
              "text-[10px] px-1.5 py-0.5 rounded-full",
              currentStatus === status ? "bg-gray-100 text-gray-600" : "bg-gray-200/50 text-gray-400"
            )}>
              {counts[status]}
            </span>
          </button>
        ))}
      </div>

      {(error || successMessage) && (
        <div className="mb-6">
          {error && <Banner variant="error" message={error} onClose={() => setError(null)} />}
          {successMessage && <Banner variant="success" message={successMessage} onClose={() => setSuccessMessage(null)} />}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 opacity-50">
          <Loader2 className="w-8 h-8 text-[#16a34a] animate-spin mb-4" />
          <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Loading Reports...</span>
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center">
          {currentStatus === 'pending' ? (
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">No pending reports</h3>
                <p className="text-sm text-gray-500 mt-1">All reports have been reviewed.</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 opacity-50">
               <ShieldAlert className="w-12 h-12 text-gray-300" />
               <p className="text-sm font-semibold text-gray-400">No reports in this category yet.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="grid gap-6">
          {reports.map((report) => (
            <div key={report._id} className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden flex flex-col md:flex-row">
              {/* Left Column: The Report */}
              <div className="flex-1 p-6 border-b md:border-b-0 md:border-r border-gray-50">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex flex-col gap-2">
                    <span className={cn(
                      "text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border w-fit",
                      REASON_COLORS[report.reason] || 'bg-gray-100 text-gray-700 border-gray-200'
                    )}>
                      {REASON_LABELS[report.reason] || report.reason}
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium">
                      Submitted {getRelativeTime(report.createdAt)}
                    </span>
                  </div>
                  {report.status !== 'pending' && (
                    <div className="text-right">
                       <span className={cn(
                         "text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded",
                         report.status === 'reviewed' ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-500"
                       )}>
                         {report.status}
                       </span>
                    </div>
                  )}
                </div>

                {report.description && (
                  <div className="bg-gray-50 p-3 rounded-xl mb-4 border border-gray-100">
                    <p className="text-sm text-gray-600 italic leading-relaxed">
                      "{report.description}"
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <Avatar 
                    src={report.reportedBy.photoURL} 
                    name={report.reportedBy.displayName} 
                    size="xs"
                    className="border border-white shadow-sm"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                       <span className="text-xs font-bold text-gray-900">{report.reportedBy.displayName}</span>
                       <span className="text-[10px] text-gray-400">•</span>
                       <span className="text-[10px] text-gray-400">Reported By</span>
                    </div>
                    <p className="text-[10px] text-gray-500">
                      {report.reportedBy.email} • Joined {new Date(report.reportedBy.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column: The Listing */}
              <div className="flex-1 p-6 bg-gray-50/30 flex flex-col justify-between">
                <div>
                  <div className="flex gap-4 mb-4">
                    <div className="w-20 h-20 flex-shrink-0 bg-gray-100 rounded-xl overflow-hidden border border-gray-200 relative">
                       {report.listing?.images?.[0] ? (
                         <img 
                            src={report.listing.images[0]} 
                            alt={report.listing.title}
                            className="w-full h-full object-cover"
                         />
                       ) : (
                         <div className="w-full h-full flex flex-col items-center justify-center text-center p-2">
                           <Trash2 className="w-5 h-5 text-gray-300 mb-1" />
                           <span className="text-[8px] font-bold text-gray-400 uppercase leading-none">Listing deleted</span>
                         </div>
                       )}
                    </div>

                    <div className="flex-1 min-w-0">
                      {report.listing ? (
                        <a 
                          href={`/listing/${report.listing.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn(
                            "text-sm font-bold text-gray-900 hover:text-[#16a34a] transition-colors flex items-center gap-1.5 group",
                            report.listing.isDeleted && "line-through text-gray-400"
                          )}
                        >
                          {report.listing.title}
                          {!report.listing.isDeleted && <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />}
                        </a>
                      ) : (
                        <span className="text-sm font-bold text-gray-400 italic">Listing no longer exists</span>
                      )}

                      {report.listing?.seller && (
                        <div className="mt-1 flex flex-col gap-0.5">
                          <span className="text-[10px] font-medium text-gray-500">Seller: {report.listing.seller.displayName}</span>
                          <span className="text-[10px] text-gray-400">{report.listing.seller.email}</span>
                        </div>
                      )}

                      <div className="mt-2 flex items-center gap-2 flex-wrap">
                        {report.listing?.status && (
                          <span className={cn(
                            "text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded",
                            report.listing.status === 'approved' ? "bg-green-100 text-green-700" :
                            report.listing.status === 'pending' ? "bg-yellow-100 text-yellow-700" :
                            report.listing.status === 'rejected' ? "bg-red-100 text-red-700" :
                            "bg-gray-200 text-gray-600"
                          )}>
                            {report.listing.status}
                          </span>
                        )}
                        {report.listing?.sellerBanned && (
                          <span className="bg-red-50 text-red-600 text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border border-red-100 flex items-center gap-1">
                            <ShieldAlert className="w-2.5 h-2.5" />
                            Seller banned
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 mt-4">
                  {currentStatus === 'pending' ? (
                    <>
                      <button 
                        onClick={() => setModalConfig({ 
                          isOpen: true, 
                          type: 'dismissed', 
                          reportId: report._id, 
                          displayName: report.listing?.title || 'this listing'
                        })}
                        className="h-9 px-4 rounded-lg bg-white border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-all shadow-sm"
                      >
                        Dismiss
                      </button>
                      <button 
                        onClick={() => setModalConfig({ 
                          isOpen: true, 
                          type: 'reviewed', 
                          reportId: report._id, 
                          displayName: report.listing?.title || 'this listing'
                        })}
                        className="h-9 px-4 rounded-lg bg-[#16a34a] text-xs font-bold text-white hover:bg-[#15803d] transition-all shadow-sm shadow-green-100"
                      >
                        Mark Reviewed
                      </button>
                      {report.listing && !report.listing.isDeleted && (
                        <a 
                          href={`/listing/${report.listing.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="h-9 w-9 flex items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-400 hover:text-gray-900 transition-all shadow-sm"
                          title="View Listing"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                      {report.listing?.seller && !report.listing.sellerBanned && (
                        <button 
                          onClick={() => setModalConfig({ 
                            isOpen: true, 
                            type: 'ban', 
                            reportId: report._id, 
                            displayName: report.listing?.seller.displayName || 'Seller',
                            sellerUid: report.listing?.seller.uid
                          })}
                          className="h-9 px-4 rounded-lg bg-white border border-red-200 text-xs font-bold text-red-600 hover:bg-red-50 transition-all shadow-sm"
                        >
                          Ban Seller
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center gap-2 text-gray-400 bg-gray-100/50 px-3 py-1.5 rounded-lg border border-gray-100">
                       <CheckCircle2 className="w-3.5 h-3.5 text-gray-400" />
                       <span className="text-[10px] font-medium italic">
                        {report.status === 'reviewed' ? 'Reviewed' : 'Dismissed'} by {report.reviewedBy?.displayName || 'Admin'}
                        {report.reviewedAt && ` • ${new Date(report.reviewedAt).toLocaleDateString()}`}
                       </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalConfig.isOpen && (
        <ConfirmModal
          title={
            modalConfig.type === 'reviewed' ? 'Mark as Reviewed' :
            modalConfig.type === 'dismissed' ? 'Dismiss Report' :
            'Ban Seller'
          }
          description={
            <div className="space-y-4 py-2">
              <div className="text-sm text-gray-600">
                {modalConfig.type === 'reviewed' && (
                  <p>Are you sure you want to mark the report for <strong>{modalConfig.displayName}</strong> as reviewed?</p>
                )}
                {modalConfig.type === 'dismissed' && (
                  <p>Dismissing this report means no action will be taken. Proceed?</p>
                )}
                {modalConfig.type === 'ban' && (
                  <p>Banning <strong>{modalConfig.displayName}</strong> will hide all their listings and prevent them from making new ones.</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest pl-1">
                  {modalConfig.type === 'ban' ? 'Reason for ban' : 'Optional note'}
                </label>
                <textarea 
                  value={reasonInput}
                  onChange={(e) => setReasonInput(e.target.value)}
                  className="w-full h-24 p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-[#16a34a10] text-sm font-medium transition-all resize-none"
                  placeholder={modalConfig.type === 'ban' ? "Why is this user being banned?" : "Add a note for other admins..."}
                  maxLength={200}
                />
              </div>
            </div>
          }
          actionText={
            modalConfig.type === 'reviewed' ? 'Mark Reviewed' :
            modalConfig.type === 'dismissed' ? 'Dismiss' :
            'Ban Seller'
          }
          actionVariant={modalConfig.type === 'ban' ? 'danger' : 'primary'}
          loading={actionLoading}
          onConfirm={handleAction}
          onCancel={() => {
            setModalConfig({ isOpen: false, type: 'reviewed', reportId: null, displayName: '' })
            setReasonInput('')
          }}
        />
      )}
    </div>
  )
}
