'use client'

import { useEffect, useState } from 'react'
import { 
  Inbox, 
  Mail, 
  CheckCircle, 
  Calendar, 
  User, 
  MessageSquare, 
  ChevronRight, 
  Loader2, 
  Search,
  Filter,
  ShieldCheck,
  BrainCircuit,
  Clock,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  History,
  Archive
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'

interface ContactMessage {
  _id: string
  name: string
  email: string
  subject: string
  message: string
  status: 'open' | 'resolved'
  createdAt: string
}

export default function AdminContactsPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [activeTab, setActiveTab] = useState<'open' | 'resolved'>('open')
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const fetchMessages = async (status: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/contacts?status=${status}`)
      const data = await res.json()
      setMessages(data.messages || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMessages(activeTab)
  }, [activeTab])

  const handleResolve = async (id: string) => {
    setActionLoading(id)
    try {
      const res = await fetch(`/api/admin/contacts/${id}`, {
        method: 'PATCH'
      })
      if (res.ok) {
        setMessages(prev => prev.filter(m => m._id !== id))
        setSelectedId(null)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setActionLoading(null)
    }
  }

  const selectedMessage = messages.find(m => m._id === selectedId)

  return (
    <div className="max-w-[1440px] mx-auto flex flex-col h-[calc(100vh-120px)] px-6 md:px-12 mb-10 overflow-hidden">
      
      {/* Neural Header */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 py-8 shrink-0">
        <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-widest rounded-full border border-blue-100 w-fit">
                <BrainCircuit className="w-3.5 h-3.5" /> Support Vector v2.0
            </div>
            <h1 className="text-5xl font-black text-gray-900 tracking-tighter leading-none">Command Inbox</h1>
            <p className="text-gray-500 font-medium text-lg">
                Manage user feedback, ban appeals, and platform inquiries with extreme prejudice.
            </p>
        </div>

        <div className="flex items-center gap-2 p-1.5 bg-gray-100/50 backdrop-blur-md border border-gray-200 rounded-[2rem]">
            {[
                { id: 'open', label: 'Active Signals', icon: Inbox, color: 'text-blue-600' },
                { id: 'resolved', label: 'Archived Logs', icon: Archive, color: 'text-emerald-600' }
            ].map(tab => (
                <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'open' | 'resolved')}
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

      <div className="flex-1 flex flex-col lg:flex-row gap-8 min-h-0 overflow-hidden">
        
        {/* Signal Stream (Sidebar) */}
        <div className="w-full lg:w-[400px] flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar shrink-0">
           {loading ? (
             <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Scanning Frequencies</p>
             </div>
           ) : messages.length === 0 ? (
             <div className="flex flex-col items-center justify-center p-20 text-center bg-gray-50/50 border-2 border-dashed border-gray-100 rounded-[3rem]">
                <ShieldCheck className="w-12 h-12 text-gray-200 mb-4" />
                <h3 className="text-xl font-black text-gray-400">Zero Signals</h3>
                <p className="text-gray-400 text-xs mt-1 italic">The support vector is currently quiet.</p>
             </div>
           ) : (
             messages.map(m => (
               <button 
                 key={m._id}
                 onClick={() => setSelectedId(m._id)}
                 className={cn(
                    "p-6 rounded-[2.5rem] border text-left transition-all relative group overflow-hidden",
                    selectedId === m._id 
                      ? 'bg-white border-blue-500 shadow-premium ring-1 ring-blue-500/10' 
                      : 'bg-white border-gray-50 hover:border-gray-200'
                 )}
               >
                  <div className="flex justify-between items-start mb-2">
                     <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest px-2 py-0.5 bg-blue-50 rounded-lg">
                        {m.subject.replace('_', ' ')}
                     </span>
                     <span className="text-[10px] text-gray-300 font-bold flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {formatDistanceToNow(new Date(m.createdAt))}
                     </span>
                  </div>
                  <div className="font-black text-gray-900 text-lg tracking-tight group-hover:translate-x-1 transition-transform">{m.name}</div>
                  <p className="text-sm text-gray-500 mt-2 line-clamp-2 leading-relaxed font-medium">"{m.message}"</p>
                  
                  {selectedId === m._id && (
                      <div className="absolute top-0 right-0 p-4 opacity-10">
                          <BrainCircuit className="w-12 h-12" />
                      </div>
                  )}
               </button>
             ))
           )}
        </div>

        {/* Intelligence Detail View */}
        <div className="flex-1 bg-white border border-gray-100 rounded-[3rem] shadow-premium-dark flex flex-col relative overflow-hidden">
           
           {!selectedMessage ? (
             <div className="flex-1 flex flex-col items-center justify-center text-center gap-6 opacity-20 p-20">
                <div className="relative">
                    <MessageSquare className="w-24 h-24 text-gray-300" />
                    <div className="absolute top-0 right-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center animate-ping" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 uppercase tracking-[0.3em]">Standby</h3>
                <p className="font-bold text-gray-500 max-w-xs">Select a user signal from the stream to begin standard interrogation protocols.</p>
             </div>
           ) : (
             <div className="flex-1 flex flex-col min-h-0 animate-in fade-in slide-in-from-bottom-8 duration-700">
                
                {/* Dossier Header */}
                <div className="p-10 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-8 bg-gray-50/20">
                   <div className="flex items-center gap-6">
                      <div className="w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center border border-gray-100 shadow-xl-soft flex-shrink-0 text-3xl font-black text-gray-200 uppercase">
                         {selectedMessage.name.charAt(0)}
                      </div>
                      <div className="flex flex-col">
                         <h2 className="text-4xl font-black text-gray-900 tracking-tighter leading-none">{selectedMessage.name}</h2>
                         <div className="flex items-center gap-2 mt-2">
                             <Mail className="w-4 h-4 text-blue-500" />
                             <span className="text-sm font-bold text-gray-400">{selectedMessage.email}</span>
                         </div>
                      </div>
                   </div>
                   
                   <div className="flex flex-col md:items-end gap-2">
                      <div className="text-[10px] font-black uppercase text-gray-300 tracking-[0.2em]">Signal Timestamp</div>
                      <div className="px-5 py-2 bg-white border border-gray-100 rounded-2xl font-black text-gray-900 flex items-center gap-3 shadow-sm">
                         <Calendar className="w-4 h-4 text-emerald-500" />
                         {new Date(selectedMessage.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </div>
                   </div>
                </div>

                {/* Message Body Block */}
                <div className="flex-1 p-10 md:p-16 overflow-y-auto custom-scrollbar relative">
                   <div className="absolute top-0 right-0 p-20 opacity-5 pointer-events-none">
                       <MessageSquare className="w-64 h-64" />
                   </div>
                   <div className="relative flex flex-col gap-8 max-w-4xl">
                        <div className="flex items-center gap-3">
                            <History className="w-5 h-5 text-blue-500" />
                            <span className="text-[10px] font-black uppercase text-blue-500 tracking-widest">Inquiry Context: {selectedMessage.subject.replace('_', ' ')}</span>
                        </div>
                        <p className="text-2xl md:text-3xl font-medium text-gray-800 leading-[1.6] text-justify">
                            {selectedMessage.message}
                        </p>
                   </div>
                </div>

                {/* Tactical Actions */}
                {activeTab === 'open' && (
                  <div className="p-10 bg-gray-50/50 backdrop-blur-xl border-t border-gray-50 flex items-center justify-between">
                     <div className="flex items-center gap-3 text-[10px] font-black text-amber-600 uppercase tracking-widest">
                        <AlertTriangle className="w-4 h-4" />
                        Awaiting Resolution Directive
                     </div>
                     <button 
                       onClick={() => handleResolve(selectedId!)}
                       disabled={!!actionLoading}
                       className="h-16 px-12 bg-gray-900 text-white font-black rounded-[1.5rem] flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-2xl-soft hover:bg-emerald-600"
                     >
                       {actionLoading === selectedId ? (
                         <Loader2 className="w-6 h-6 animate-spin" />
                       ) : (
                         <>
                           <CheckCircle2 className="w-5 h-5" />
                           Commit to Archives
                         </>
                       )}
                     </button>
                  </div>
                )}

             </div>
           )}
        </div>
      </div>

    </div>
  )
}
