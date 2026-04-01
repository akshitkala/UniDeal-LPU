'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { Users, LayoutList, ShieldAlert, Flag, Activity, ArrowRight, Loader2, Info } from 'lucide-react'

export default function AdminOverview() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/admin/overview')
        if (res.ok) {
          setData(await res.json())
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col gap-8 animate-pulse">
         <div className="h-40 bg-gray-100 rounded-2xl w-full"></div>
         <div className="flex gap-6"><div className="flex-1 h-64 bg-gray-100 rounded-2xl"></div><div className="w-1/3 h-64 bg-gray-100 rounded-2xl"></div></div>
      </div>
    )
  }

  if (!data) return <div>Failed to load payload. You might not have admin clearance.</div>

  const StatCard = ({ title, value, icon, bg, text }: any) => (
    <div className={`p-6 rounded-2xl flex items-center justify-between border ${bg} ${text} shadow-sm`}>
      <div className="flex flex-col gap-1">
        <span className="font-semibold text-sm opacity-80 uppercase tracking-wider">{title}</span>
        <span className="text-4xl font-extrabold">{value}</span>
      </div>
      <div className="p-3 bg-white/40 backdrop-blur rounded-full">
        {icon}
      </div>
    </div>
  )

  return (
    <div className="flex flex-col gap-8 mb-20 max-w-7xl mx-auto">
      <div>
        <h1 className="text-4xl font-extrabold text-[#1A1A1A] tracking-tight">Mission Control</h1>
        <p className="text-gray-500 mt-2 text-lg">High-level statistics and urgent moderation tasks requiring administrative action.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Users" value={data.stats.totalUsers} icon={<Users className="w-6 h-6"/>} bg="bg-blue-50 border-blue-100" text="text-blue-900" />
        <StatCard title="Active Listings" value={data.stats.activeListings} icon={<LayoutList className="w-6 h-6"/>} bg="bg-green-50 border-green-100" text="text-[#2D9A54]" />
        <StatCard title="Pending Review" value={data.stats.pendingListings} icon={<ShieldAlert className="w-6 h-6"/>} bg="bg-amber-50 border-amber-100" text="text-amber-700" />
        <StatCard title="Open Reports" value={data.stats.openReports} icon={<Flag className="w-6 h-6"/>} bg="bg-red-50 border-red-100" text="text-red-700" />
      </div>

      {/* Moderation Mode Switcher */}
      <div className="p-6 bg-white border border-[#E5E5E5] rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
         <div>
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">Global AI Moderation Logic <Info className="w-4 h-4 text-gray-400"/></h3>
            <p className="text-gray-500 text-sm mt-1">Controls whether incoming student listings require manual approval or AI sweeping.</p>
         </div>
         <div className="flex bg-gray-100 p-1.5 rounded-xl self-start md:self-auto">
            <button className="px-5 py-2 rounded-lg bg-white shadow-sm font-bold text-[#2D9A54] border border-gray-200">
              AI-Flagging Mode
            </button>
            <button className="px-5 py-2 rounded-lg text-gray-500 font-semibold hover:text-gray-800 transition-colors">
              Manual Mode
            </button>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Col: Pending Queue preview */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold flex items-center gap-2"><ShieldAlert className="w-6 h-6 text-amber-500"/> Urgent Action Required</h2>
            <Link href="/admin/queue" className="text-sm font-semibold text-[#2D9A54] hover:underline flex items-center gap-1">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="bg-white border border-[#E5E5E5] rounded-2xl shadow-sm overflow-hidden">
             {data.pendingQueue.length === 0 ? (
               <div className="p-10 text-center text-gray-500">The moderation queue is completely empty.</div>
             ) : (
               <div className="flex flex-col divide-y divide-gray-100">
                 {data.pendingQueue.map((item: any) => (
                   <div key={item._id} className="p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                     <div className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden">
                        {item.images?.[0] ? <img src={item.images[0]} className="w-full h-full object-cover" alt="item" /> : <div className="text-xs text-gray-400">No Img</div>}
                     </div>
                     <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                           <h4 className="font-bold text-[#1A1A1A] truncate text-lg">{item.title}</h4>
                           {item.aiFlagged && <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded border border-red-200">AI-Flagged</span>}
                        </div>
                        <p className="text-sm text-gray-500 truncate mt-0.5">By {item.seller?.displayName || 'Unknown'} • ₹{item.price.toLocaleString('en-IN')}</p>
                     </div>
                     <Link href={`/admin/queue`} className="ml-auto bg-[#F9F9F9] border border-[#E5E5E5] px-4 py-2 rounded-lg font-semibold hover:bg-white text-sm transition-colors text-gray-700">
                       Review
                     </Link>
                   </div>
                 ))}
               </div>
             )}
          </div>
        </div>

        {/* Right Col: Recent Activity */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold flex items-center gap-2"><Activity className="w-6 h-6 text-blue-500"/> Audit Stream</h2>
            <Link href="/admin/audit" className="text-sm font-semibold text-[#2D9A54] hover:underline flex items-center gap-1">
              Full Log <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="bg-white border border-[#E5E5E5] rounded-2xl shadow-sm p-5 flex flex-col gap-4">
             {data.recentActivity.length === 0 ? <p className="text-sm text-gray-500 text-center py-4">No recent signals.</p> : null}
             {data.recentActivity.map((log: any) => (
                <div key={log._id} className="flex gap-3 text-sm">
                   <div className="mt-1 w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                   <div className="flex flex-col">
                     <span className="font-bold text-gray-800">{log.action.replace(/_/g, ' ')}</span>
                     <span className="text-gray-500 leading-snug">
                       {log.actorType === 'deleted_user' ? 'System Cascade triggered by Self-Delete' : 
                         log.actorType === 'user' ? `Frontend user fired contact mapping` : 
                         `Admin: ${log.actor?.email}`
                       }
                     </span>
                     <span className="text-xs text-gray-400 mt-1">{formatDistanceToNow(new Date(log.timestamp))} ago</span>
                   </div>
                </div>
             ))}
          </div>
        </div>
      </div>

    </div>
  )
}
