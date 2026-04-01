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
  Filter
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface ContactMessage {
  _id: string
  name: string
  email: string
  subject: string
  message: string
  status: 'open' | 'resolved'
  createdAt: string
}

/**
 * A-08: Admin Contact Inbox (Fix 15).
 * Features: inquiry management, status toggling, and rich context views.
 */
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

  return (
    <div className="max-w-6xl mx-auto space-y-8 flex flex-col h-full overflow-hidden">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-gray-100 pb-8">
        <div>
          <h1 className="text-3xl font-extrabold flex items-center gap-3">
             <Inbox className="w-8 h-8 text-[#2D9A54]" />
             User Inquiries
          </h1>
          <p className="text-gray-500 mt-2">Manage support tickets, ban appeals, and general feedback.</p>
        </div>
        
        {/* Tabs */}
        <div className="bg-gray-100 p-1.5 rounded-2xl flex gap-1">
           {(['open', 'resolved'] as const).map(tab => (
             <button 
               key={tab}
               onClick={() => setActiveTab(tab)}
               className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all capitalize ${
                 activeTab === tab 
                   ? 'bg-white text-gray-900 shadow-sm' 
                   : 'text-gray-400 hover:text-gray-600'
               }`}
             >
               {tab}
             </button>
           ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-8 min-h-0">
        
        {/* Inbox Sidebar List */}
        <div className="w-full lg:w-96 flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
           {loading ? (
             <div className="flex items-center justify-center h-64">
               <Loader2 className="w-8 h-8 animate-spin text-[#2D9A54]" />
             </div>
           ) : messages.length === 0 ? (
             <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                <CheckCircle className="w-10 h-10 text-gray-100 mx-auto mb-4" />
                <p className="text-gray-400 font-medium">Inbox Clear</p>
             </div>
           ) : (
             messages.map(m => (
               <button 
                 key={m._id}
                 onClick={() => setSelectedId(m._id)}
                 className={`p-5 rounded-3xl border text-left transition-all ${
                   selectedId === m._id 
                     ? 'bg-white border-[#2D9A54] shadow-md ring-4 ring-[#2D9A54]/5' 
                     : 'bg-white border-transparent hover:border-gray-200'
                 }`}
               >
                  <div className="flex justify-between items-start gap-4">
                     <div className="font-extrabold text-gray-900 line-clamp-1">{m.name}</div>
                     <span className="text-[10px] text-gray-300 font-bold whitespace-nowrap bg-gray-50 px-2 py-0.5 rounded uppercase">
                        {formatDistanceToNow(new Date(m.createdAt))}
                     </span>
                  </div>
                  <div className="text-xs text-[#2D9A54] font-black uppercase tracking-tighter mt-1">{m.subject.replace('_', ' ')}</div>
                  <p className="text-sm text-gray-500 mt-2 line-clamp-2 leading-relaxed italic">
                     "{m.message}"
                  </p>
               </button>
             ))
           )}
        </div>

        {/* Selected Message Detail View */}
        <div className="flex-1 bg-white border border-gray-100 rounded-[40px] p-8 lg:p-12 shadow-sm flex flex-col gap-8 relative overflow-hidden">
           
           <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/5 blur-3xl -mr-32 -mt-32 pointer-events-none" />

           {!selectedId ? (
             <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 text-gray-300 opacity-50">
                <MessageSquare className="w-16 h-16" />
                <p className="font-bold uppercase tracking-widest text-xs">Select an inquiry to review context</p>
             </div>
           ) : (
             <div className="flex-1 flex flex-col gap-10 animate-in fade-in slide-in-from-right-4 duration-500">
                
                {/* Meta info */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                   <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100 flex-shrink-0">
                         <User className="w-6 h-6 text-gray-400" />
                      </div>
                      <div>
                         <div className="text-2xl font-black text-gray-900">{messages.find(m => m._id === selectedId)?.name}</div>
                         <div className="text-sm text-gray-400 font-medium">{messages.find(m => m._id === selectedId)?.email}</div>
                      </div>
                   </div>
                   <div className="flex flex-col items-end gap-1">
                      <div className="text-[10px] text-gray-300 font-black uppercase tracking-widest">Received Date</div>
                      <div className="text-gray-900 font-bold flex items-center gap-2">
                         <Calendar className="w-4 h-4 text-[#2D9A54]" />
                         {new Date(messages.find(m => m._id === selectedId)?.createdAt!).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </div>
                   </div>
                </div>

                {/* Message Body */}
                <div className="bg-gray-50/50 rounded-[32px] p-8 md:p-10 border border-gray-100 relative group flex-1 min-h-0 overflow-y-auto custom-scrollbar">
                   <h4 className="text-[10px] text-gray-300 font-black uppercase tracking-[0.2em] mb-4">Official Submission Context</h4>
                   <p className="text-xl md:text-2xl font-medium text-gray-800 leading-relaxed text-justify">
                      {messages.find(m => m._id === selectedId)?.message}
                   </p>
                   <div className="absolute top-4 right-8 opacity-5 group-hover:opacity-10 transition-opacity">
                      <Mail className="w-24 h-24" />
                   </div>
                </div>

                {/* Resolve Action */}
                {activeTab === 'open' && (
                  <div className="flex justify-end pt-4 border-t border-gray-50">
                    <button 
                      onClick={() => handleResolve(selectedId)}
                      disabled={!!actionLoading}
                      className="h-16 px-12 bg-[#2D9A54] hover:bg-[#258246] text-white font-black rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-lg shadow-green-200"
                    >
                      {actionLoading === selectedId ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle className="w-6 h-6" />
                          Complete Vector & Resolve
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
