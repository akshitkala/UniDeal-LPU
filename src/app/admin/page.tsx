'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { 
  Users, 
  LayoutList, 
  ShieldAlert, 
  Flag, 
  Activity, 
  ChevronRight, 
  PackageCheck, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Search,
  Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Banner } from '@/components/global/Banner'
import { Avatar } from '@/components/ui/Avatar'
import Image from 'next/image'

export default function AdminOverview() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [approvalMode, setApprovalMode] = useState<string>('ai_flagging')
  const [isUpdatingMode, setIsUpdatingMode] = useState(false)
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const [ovRes, configRes] = await Promise.all([
          fetch('/api/admin/overview'),
          fetch('/api/admin/config')
        ])
        
        if (ovRes.ok) {
           setData(await ovRes.json())
        }
        if (configRes.ok) {
           const config = await configRes.json()
           setApprovalMode(config.approvalMode)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleModeChange = async (newMode: string) => {
    setIsUpdatingMode(true)
    setMessage(null)
    try {
      const res = await fetch('/api/admin/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approvalMode: newMode })
      })
      if (res.ok) {
        setApprovalMode(newMode)
        setMessage({ text: 'Approval policy updated.', type: 'success' })
      } else {
        setMessage({ text: 'Failed to update policy.', type: 'error' })
      }
    } catch (err) {
      setMessage({ text: 'Error updating policy.', type: 'error' })
    } finally {
      setIsUpdatingMode(false)
    }
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
         <div className="animate-pulse space-y-8">
            <div className="h-8 w-64 bg-gray-100 rounded-lg" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
               {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-50 rounded-xl border border-gray-100" />)}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
               <div className="lg:col-span-8 h-96 bg-gray-50 rounded-xl" />
               <div className="lg:col-span-4 h-96 bg-gray-50 rounded-xl" />
            </div>
         </div>
      </div>
    )
  }

  if (!data) return null

  const StatCard = ({ title, value, icon, color }: any) => (
    <div className="h-24 px-4 rounded-xl border border-gray-100 bg-white flex items-center gap-4">
       <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", color)}>
           {icon}
       </div>
       <div>
          <span className="text-xs text-gray-500 font-medium block">{title}</span>
          <span className="text-lg font-semibold text-gray-900">{value}</span>
       </div>
    </div>
  )

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      
      {message && (
        <div className={cn(
          "mb-6 p-3 rounded-xl text-sm font-medium border",
          message.type === 'success' ? "bg-green-50 text-green-800 border-green-100" : "bg-red-50 text-red-800 border-red-100"
        )}>
          {message.text}
        </div>
      )}

      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-xl lg:text-2xl font-semibold text-gray-900">Admin dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage campus activity and moderation</p>
        </div>

        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-full overflow-x-auto no-scrollbar">
          {[
            { id: 'automatic', label: 'Auto', icon: Zap },
            { id: 'ai_flagging', label: 'AI Moderation', icon: ShieldAlert },
            { id: 'manual', label: 'Manual', icon: Clock }
          ].map(mode => (
            <button 
              key={mode.id}
              disabled={isUpdatingMode}
              onClick={() => handleModeChange(mode.id)}
              className={cn(
                "h-8 px-4 rounded-full text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap",
                approvalMode === mode.id 
                  ? "bg-white text-gray-900 shadow-sm" 
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              <mode.icon className="w-3.5 h-3.5" />
              {mode.label}
            </button>
          ))}
        </div>
      </header>

      {/* Stats Grid */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <StatCard title="Total Users" value={data.stats.totalUsers} icon={<Users className="w-5 h-5"/>} color="bg-blue-50 text-blue-600" />
        <StatCard title="Active Listings" value={data.stats.activeListings} icon={<LayoutList className="w-5 h-5"/>} color="bg-green-50 text-green-600" />
        <StatCard title="Review Queue" value={data.stats.pendingListings} icon={<Clock className="w-5 h-5"/>} color="bg-orange-50 text-orange-600" />
        <StatCard title="Reports" value={data.stats.openReports} icon={<Flag className="w-5 h-5"/>} color="bg-red-50 text-red-600" />
      </section>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Moderation Queue Preview */}
        <div className="lg:col-span-8">
          <div className="flex items-center justify-between mb-4">
              <h2 className="text-base lg:text-lg font-semibold text-gray-900">Pending review</h2>
              <Link href="/admin/queue" className="text-xs font-semibold text-[#16a34a] flex items-center gap-1">
                View all <ChevronRight className="w-4 h-4" />
              </Link>
          </div>

          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
             {data.pendingQueue.length === 0 ? (
               <div className="py-20 flex flex-col items-center justify-center text-center opacity-50">
                  <PackageCheck className="w-12 h-12 text-gray-200 mb-3" />
                  <p className="text-sm font-medium text-gray-400">Queue is empty</p>
               </div>
             ) : (
                <div className="divide-y divide-gray-50">
                  {data.pendingQueue.map((item: any) => (
                    <div key={item._id} className="p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0 relative overflow-hidden border border-gray-100">
                         {item.images?.[0] && (
                             <Image 
                               src={item.images[0]} 
                               fill 
                               className="object-contain" 
                               alt={item.title}
                               sizes="64px"
                             />
                         )}
                      </div>

                      <div className="flex-1 min-w-0">
                         <h4 className="text-sm font-semibold text-gray-900 truncate">{item.title}</h4>
                         <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                             <span className="font-semibold text-green-600">₹{item.price}</span>
                             <span>•</span>
                             <span>{item.seller?.displayName}</span>
                             {item.aiFlagged && (
                                <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded-full text-[10px] font-bold">AI Flagged</span>
                             )}
                         </div>
                      </div>

                      <Link 
                        href={`/admin/queue`} 
                        className="h-8 px-3 bg-gray-900 text-white rounded-lg text-xs font-semibold flex items-center justify-center transition-all"
                      >
                        Review
                      </Link>
                    </div>
                  ))}
                </div>
             )}
          </div>
        </div>

        {/* Audit Log Preview */}
        <div className="lg:col-span-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base lg:text-lg font-semibold text-gray-900">Activity</h2>
            <Link href="/admin/audit" className="text-xs font-semibold text-[#16a34a]">
              View all
            </Link>
          </div>

          <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
             {data.recentActivity.length === 0 ? (
                 <div className="py-12 flex flex-col items-center justify-center text-center opacity-50">
                     <Clock className="w-10 h-10 text-gray-200 mb-3" />
                     <p className="text-xs font-medium text-gray-400">No activity</p>
                 </div>
             ) : (
                <div className="space-y-6">
                    {data.recentActivity.map((log: any) => (
                        <div key={log._id} className="flex gap-4 group">
                           <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                           <div className="flex-1 min-w-0">
                             <span className="text-xs font-bold text-gray-900 block truncate">
                                 {log.action.replace(/_/g, ' ')}
                             </span>
                             <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                               {log.actor?.displayName || log.actor?.email || 'System'}
                             </p>
                             <span className="text-[10px] text-gray-300 font-medium block mt-1">
                                {formatDistanceToNow(new Date(log.timestamp))} ago
                             </span>
                           </div>
                        </div>
                    ))}
                </div>
             )}
          </div>
        </div>
      </div>
    </div>
  )
}
