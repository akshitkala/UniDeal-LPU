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
  ArrowRight, 
  Loader2, 
  Info,
  BrainCircuit,
  Zap,
  TrendingUp,
  ShieldCheck,
  ZapOff,
  History,
  Terminal,
  ChevronRight,
  Database,
  Radio,
  Eye,
  AlertTriangle,
  PackageCheck,
  Clock
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
        setMessage({ text: 'Interception policy updated successfully.', type: 'success' })
      } else {
        setMessage({ text: 'Failed to update policy.', type: 'error' })
      }
    } catch (err) {
      setMessage({ text: 'Network Error: Command transmission failed.', type: 'error' })
    } finally {
      setIsUpdatingMode(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-12 py-12 px-6 max-w-[1440px] mx-auto min-h-screen">
         <div className="flex flex-col gap-4 animate-pulse">
            <div className="h-4 w-40 bg-gray-100 rounded-full" />
            <div className="h-12 w-96 bg-gray-100 rounded-2xl" />
            <div className="h-6 w-1/2 bg-gray-100 rounded-xl" />
         </div>
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {[...Array(4)].map((_, i) => <div key={i} className="h-44 bg-gray-50 rounded-[2.5rem] border border-gray-100 animate-pulse" />)}
         </div>
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 h-[500px] bg-gray-50 rounded-[3rem] animate-pulse" />
            <div className="h-[500px] bg-gray-50 rounded-[3rem] animate-pulse" />
         </div>
      </div>
    )
  }

  if (!data) {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center p-20 text-center gap-6">
              <div className="w-24 h-24 bg-rose-50 rounded-[3rem] flex items-center justify-center border border-rose-100 animate-bounce">
                  <ShieldAlert className="w-12 h-12 text-rose-500" />
              </div>
              <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase">Clearance Required</h1>
              <p className="text-gray-500 max-w-sm font-medium">Your biometric ID does not match the administrative registry for this sector.</p>
              <Link href="/" className="h-16 px-12 bg-gray-900 text-white font-black rounded-2xl flex items-center justify-center hover:bg-gray-800 transition-all active:scale-95">
                  Evacuate to Home
              </Link>
          </div>
      )
  }

  const StatCard = ({ title, value, icon, gradient, textColor }: any) => (
    <div className={cn(
        "relative group p-8 rounded-[2.5rem] border border-gray-100 bg-white shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden"
    )}>
       <div className={cn("absolute top-0 right-0 w-32 h-32 blur-[60px] opacity-10 rounded-full -mr-16 -mt-16", gradient)} />
       
       <div className="flex flex-col gap-6 relative z-10">
          <div className="flex items-center justify-between">
              <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl-soft transition-transform group-hover:scale-110 duration-500 bg-white border border-gray-100", textColor)}>
                  {icon}
              </div>
              <span className="text-[10px] font-black tracking-[0.2em] uppercase text-gray-300">Live Feed</span>
          </div>
          <div className="flex flex-col gap-1">
             <span className="text-sm font-black text-gray-400 uppercase tracking-widest">{title}</span>
             <div className="flex items-end gap-3">
                 <span className="text-5xl font-black text-gray-900 tracking-tighter leading-none">{value}</span>
                 <span className="text-[10px] font-black text-emerald-500 mb-1 flex items-center gap-1">
                     <TrendingUp className="w-3 h-3" /> +12%
                 </span>
             </div>
          </div>
       </div>
    </div>
  )

  return (
    <div className="flex flex-col gap-10 sm:gap-16 py-6 sm:py-12 px-4 sm:px-6 max-w-[1440px] mx-auto mb-24 overflow-hidden">
      
      {message && (
        <Banner 
          message={message.text} 
          variant={message.type === 'success' ? 'success' : 'error'} 
          onClose={() => setMessage(null)} 
        />
      )}

      {/* Neural Header */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-10 relative">
        <div className="flex flex-col gap-3 sm:gap-4 relative z-10">
            <div className="flex items-center gap-3 px-4 py-1.5 bg-gray-900 text-white rounded-full text-[10px] font-black uppercase tracking-[0.2em] w-fit shadow-xl">
                <BrainCircuit className="w-4 h-4 text-emerald-400 animate-pulse" /> Neural Strategy Engine v2.0
            </div>
            <h1 className="text-4xl sm:text-6xl md:text-8xl font-black text-gray-950 tracking-tighter leading-[0.8] mb-2 sm:mb-0">
                Guardian <br /> <span className="text-emerald-600">Command.</span>
            </h1>
            <p className="text-gray-500 font-medium text-lg sm:text-xl max-w-xl leading-snug">
                Platform-wide intelligence and high-priority tactical interventions.
            </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 relative z-10 mb-2">
            <div className="px-6 sm:px-8 py-5 sm:py-6 bg-white border border-gray-100 rounded-[2rem] sm:rounded-[2.5rem] shadow-premium flex flex-col gap-2 min-w-[200px]">
                <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Network Status</span>
                <div className="flex items-center gap-2 font-black text-gray-950 text-sm sm:text-base">
                    <Radio className="w-4 h-4 text-emerald-500 animate-ping" /> GLOBAL SYNCHRONIZED
                </div>
            </div>
            <div className="px-6 sm:px-8 py-5 sm:py-6 bg-white border border-gray-100 rounded-[2rem] sm:rounded-[2.5rem] shadow-premium flex flex-col gap-2 min-w-[200px]">
                <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Security Protocol</span>
                <div className="flex items-center gap-2 font-black text-blue-600 text-sm sm:text-base">
                    <ShieldCheck className="w-4 h-4" /> AI-ENHANCED AUDIT
                </div>
            </div>
        </div>
      </header>

      {/* Intelligence Matrix */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <StatCard title="Total Registries" value={data.stats.totalUsers} icon={<Users className="w-6 h-6"/>} gradient="bg-blue-500" textColor="text-blue-600" />
        <StatCard title="Active Listings" value={data.stats.activeListings} icon={<LayoutList className="w-6 h-6"/>} gradient="bg-emerald-500" textColor="text-emerald-600" />
        <StatCard title="Awaiting Validation" value={data.stats.pendingListings} icon={<ShieldAlert className="w-6 h-6"/>} gradient="bg-amber-500" textColor="text-amber-600" />
        <StatCard title="Open Signals" value={data.stats.openReports} icon={<Flag className="w-6 h-6"/>} gradient="bg-rose-500" textColor="text-rose-600" />
      </section>

      {/* Mode Interlink */}
       <nav className="relative group overflow-hidden bg-gray-900 rounded-[3rem] p-10 flex flex-col lg:flex-row lg:items-center justify-between gap-10 shadow-2xl-soft">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 blur-[100px] -mr-64 -mt-64" />
          <div className="flex flex-col gap-2 relative z-10">
             <h3 className="text-3xl font-black text-white tracking-tighter flex items-center gap-4 uppercase">
                 Tactical Sweep Configuration
             </h3>
             <p className="text-slate-400 font-medium max-w-lg">Configures the global listing ingestion policy. Manual review vs AI-assisted filtering.</p>
          </div>
           <div className="flex items-center gap-3 p-1.5 sm:p-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[1.5rem] sm:rounded-[2rem] relative z-10 shrink-0">
             {[
               { id: 'automatic', label: 'Auto Approve', icon: Zap },
               { id: 'ai_flagging', label: 'AI Moderation', icon: BrainCircuit },
               { id: 'manual', label: 'Manual Review', icon: ShieldAlert }
             ].map(mode => (
               <button 
                 key={mode.id}
                 disabled={isUpdatingMode}
                 onClick={() => handleModeChange(mode.id)}
                 className={cn(
                   "px-6 py-4 rounded-[1.2rem] font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2",
                   approvalMode === mode.id 
                     ? "bg-white text-gray-900 shadow-xl" 
                     : "text-slate-400 hover:text-white"
                 )}
               >
                 {isUpdatingMode && approvalMode === mode.id ? (
                   <Loader2 className="w-3.5 h-3.5 animate-spin" />
                 ) : (
                   <mode.icon className={cn("w-3.5 h-3.5", approvalMode === mode.id ? "text-emerald-500" : "text-slate-500")} />
                 )}
                 {mode.label}
               </button>
             ))}
           </div>
       </nav>

      {/* Operation Centers */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* Urgent Moderation Vector */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          <div className="flex items-center justify-between px-4">
            <div className="flex flex-col gap-1">
                <h2 className="text-4xl font-black text-gray-900 tracking-tighter flex items-center gap-4 uppercase">
                    Intervention Queue
                </h2>
                <div className="text-[10px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-2">
                    <AlertTriangle className="w-3 h-3" /> High Priority Interception Required
                </div>
            </div>
            <Link href="/admin/queue" className="h-14 px-8 bg-gray-50 hover:bg-emerald-600 hover:text-white transition-all text-gray-900 font-black rounded-2xl flex items-center gap-3 text-xs uppercase tracking-widest group shadow-sm">
              Enter Operations <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
            </Link>
          </div>

          <div className="bg-white border border-gray-100 rounded-[3rem] shadow-premium overflow-hidden min-h-[400px]">
             {data.pendingQueue.length === 0 ? (
               <div className="flex flex-col items-center justify-center py-32 text-center gap-6 opacity-40">
                  <PackageCheck className="w-20 h-20 text-gray-300" />
                  <p className="text-xl font-black text-gray-900 uppercase tracking-[0.2em]">Zero Threats Detected</p>
               </div>
             ) : (
               <div className="flex flex-col divide-y divide-gray-50">
                 {data.pendingQueue.map((item: any) => (
                    <div key={item._id} className="p-8 flex items-center gap-8 hover:bg-gray-50/50 transition-all group/item">
                      <div className="w-24 h-24 bg-gray-100 rounded-[2rem] flex-shrink-0 relative overflow-hidden border border-gray-100 shadow-xl-soft group-hover/item:scale-105 transition-transform duration-500">
                         {item.images?.[0] ? (
                             <Image 
                               src={item.images[0]} 
                               fill 
                               className="object-cover" 
                               alt={item.title}
                               sizes="96px"
                             />
                         ) : (
                             <Terminal className="w-10 h-10 text-gray-300 m-auto mt-7" />
                         )}
                         {item.aiFlagged && (
                             <div className="absolute inset-0 bg-rose-500/10 flex items-center justify-center">
                                 <ZapOff className="w-8 h-8 text-rose-500 animate-pulse" />
                             </div>
                         )}
                      </div>

                      <div className="flex-1 min-w-0 flex flex-col gap-2">
                         <div className="flex items-center gap-3">
                            <h4 className="text-2xl font-black text-gray-900 tracking-tight truncate uppercase leading-none">
                                {item.title}
                            </h4>
                            {item.aiFlagged && (
                                <span className="bg-rose-50 text-rose-600 text-[9px] font-black px-3 py-1 rounded-full border border-rose-100 uppercase tracking-widest animate-pulse">
                                    Critical Risk
                                </span>
                            )}
                         </div>
                         <div className="flex items-center gap-6 text-sm">
                             <div className="flex items-center gap-3">
                                 <Avatar 
                                   src={item.seller?.photoURL}
                                   name={item.seller?.displayName}
                                   size="xs"
                                 />
                                 <div className="flex flex-col">
                                     <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Origin</span>
                                     <span className="font-bold text-gray-700">{item.seller?.displayName || 'Unknown Signal'}</span>
                                 </div>
                             </div>
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Asset Value</span>
                                <span className="font-black text-emerald-600">₹{item.price.toLocaleString('en-IN')}</span>
                            </div>
                        </div>
                     </div>

                      <Link 
                        href={`/admin/queue`} 
                        className="w-full sm:w-auto h-14 sm:h-16 px-8 sm:px-10 bg-gray-900 text-white rounded-[1.2rem] sm:rounded-[1.5rem] font-black text-[10px] sm:text-xs uppercase tracking-widest hover:bg-emerald-600 transition-all flex items-center justify-center group/btn shadow-xl"
                      >
                        Investigate <Eye className="ml-3 w-4 h-4 group-hover/btn:scale-125 transition-transform" />
                      </Link>
                   </div>
                 ))}
               </div>
             )}
          </div>
        </div>

        {/* Tactical Feed (Logging) */}
        <div className="lg:col-span-4 flex flex-col gap-8">
          <div className="flex items-center justify-between px-4">
            <h2 className="text-4xl font-black text-gray-900 tracking-tighter flex items-center gap-4 uppercase leading-none">
                Audit Log
            </h2>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl shadow-sm">
                <Database className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-[3rem] p-10 flex flex-col gap-10 shadow-premium-dark relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:scale-125 transition-transform duration-[10s] pointer-events-none">
                 <Terminal className="w-64 h-64 text-blue-900" />
             </div>
             {data.recentActivity.length === 0 ? (
                 <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
                     <History className="w-12 h-12 text-gray-300" />
                     <p className="text-[9px] font-black mt-4 uppercase tracking-[0.3em]">No Active Patterns</p>
                 </div>
             ) : (
                <div className="flex flex-col gap-10 relative z-10">
                    {data.recentActivity.map((log: any) => (
                        <div key={log._id} className="flex gap-6 group/log animate-in fade-in slide-in-from-right-4 duration-500">
                           <div className="relative flex flex-col items-center">
                               <div className="w-4 h-4 rounded-full bg-blue-500 flex-shrink-0 shadow-[0_0_15px_#3b82f6] group-hover/log:scale-150 transition-transform" />
                               <div className="w-[1px] h-[calc(100%+40px)] bg-blue-100 absolute top-4" />
                           </div>
                           <div className="flex flex-col gap-2 -mt-1">
                             <span className="text-xs font-black text-gray-900 uppercase tracking-widest leading-none pt-1">
                                 {log.action.replace(/_/g, ' ')}
                             </span>
                             <p className="text-sm text-gray-500 leading-relaxed font-medium">
                               {log.actorType === 'deleted_user' ? 'System Cascade triggered by Self-Delete Registry' : 
                                 log.actorType === 'user' ? `External user mapping fired` : 
                                 `Operator: ${log.actor?.displayName || log.actor?.email}`
                               }
                             </p>
                             <div className="flex items-center gap-2 text-[10px] text-gray-300 font-bold uppercase tracking-widest">
                                <Clock className="w-3 h-3" /> {formatDistanceToNow(new Date(log.timestamp))}
                             </div>
                           </div>
                        </div>
                    ))}
                    <Link href="/admin/audit" className="mt-4 flex items-center justify-center gap-2 text-[10px] font-black text-blue-600 uppercase tracking-widest hover:text-blue-800 transition-colors">
                        Access Full Binary Log <ChevronRight className="w-4 h-4" />
                    </Link>
                </div>
             )}
          </div>
        </div>
      </div>

    </div>
  )
}
