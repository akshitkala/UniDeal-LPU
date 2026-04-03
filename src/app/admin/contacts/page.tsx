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
  Clock,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  History,
  Archive,
  ArrowRight
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
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'open' | 'resolved'>('open')
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const fetchMessages = async (status: string, cursor: string | null = null) => {
    if (cursor) setLoadingMore(true)
    else setLoading(true)
    try {
      const url = new URL(`/api/admin/contacts`, window.location.origin)
      url.searchParams.set('status', status)
      if (cursor) url.searchParams.set('cursor', cursor)

      const res = await fetch(url.toString())
      const data = await res.json()
      if (cursor) {
        setMessages(prev => {
          const existingIds = new Set(prev.map(m => m._id))
          const newItems = data.messages.filter((m: any) => !existingIds.has(m._id))
          return [...prev, ...newItems]
        })
      } else {
        setMessages(data.messages || [])
      }
      setNextCursor(data.nextCursor)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  useEffect(() => {
    setNextCursor(null)
    fetchMessages(activeTab)
  }, [activeTab])

  const handleLoadMore = () => {
    if (nextCursor) {
      fetchMessages(activeTab, nextCursor)
    }
  }

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
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto h-[calc(100vh-80px)] flex flex-col">
      
      {/* Header & Tabs */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8 shrink-0">
        <div>
          <h1 className="text-xl lg:text-2xl font-semibold text-gray-900">Inquiries</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage user messages and support requests</p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-full">
            {[
                { id: 'open', label: 'Open', icon: Inbox },
                { id: 'resolved', label: 'Resolved', icon: CheckCircle }
            ].map(tab => (
                <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'open' | 'resolved')}
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

      <div className="flex-1 flex flex-col lg:flex-row gap-8 min-h-0">
        
        {/* Contact List */}
        <div className="w-full lg:w-80 flex flex-col gap-3 overflow-y-auto pr-2 no-scrollbar shrink-0">
           {loading && messages.length === 0 ? (
             <div className="flex flex-col items-center justify-center py-20 gap-3 opacity-50">
                <Loader2 className="w-8 h-8 text-[#16a34a] animate-spin" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Syncing...</span>
             </div>
           ) : messages.length === 0 ? (
             <div className="flex flex-col items-center justify-center py-24 text-center opacity-50">
                <ShieldCheck className="w-12 h-12 text-gray-200 mb-4" />
                <p className="text-sm font-semibold text-gray-400">No messages found</p>
             </div>
           ) : (
             <>
               {messages.map(m => (
                 <button 
                   key={m._id}
                   onClick={() => setSelectedId(m._id)}
                   className={cn(
                      "p-4 rounded-xl border text-left transition-all relative group",
                      selectedId === m._id 
                        ? 'bg-white border-[#16a34a] shadow-sm ring-1 ring-[#16a34a10]' 
                        : 'bg-white border-transparent hover:border-gray-200'
                   )}
                 >
                    <div className="flex justify-between items-start mb-2">
                       <span className="text-[9px] font-bold text-indigo-600 uppercase tracking-wider px-2 py-0.5 bg-indigo-50 rounded">
                          {m.subject.replace('_', ' ')}
                       </span>
                       <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap">
                          {formatDistanceToNow(new Date(m.createdAt))} ago
                       </span>
                    </div>
                    <div className="font-semibold text-gray-900 text-sm truncate">{m.name}</div>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-1 font-medium italic">"{m.message}"</p>
                 </button>
               ))}

               {nextCursor && (
                 <button 
                   onClick={handleLoadMore}
                   disabled={loadingMore}
                   className="py-4 text-xs font-bold text-[#16a34a] hover:text-[#15803d] flex items-center justify-center gap-2 disabled:opacity-50"
                 >
                   {loadingMore ? (
                     <Loader2 className="w-3.5 h-3.5 animate-spin" />
                   ) : (
                     <>
                        Load More
                        <ChevronRight className="w-3.5 h-3.5 rotate-90" />
                     </>
                   )}
                 </button>
               )}
             </>
           )}
        </div>

        {/* Detail View */}
        <div className="flex-1 bg-white border border-gray-100 rounded-xl shadow-sm flex flex-col overflow-hidden">
           
           {!selectedMessage ? (
             <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 opacity-30 p-12">
                <MessageSquare className="w-16 h-16 text-gray-200" />
                <p className="text-sm font-semibold text-gray-400">Select a message to read</p>
             </div>
           ) : (
             <div className="flex-1 flex flex-col min-h-0">
                
                {/* Detail Header */}
                <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
                   <div className="flex items-center gap-5">
                      <div className="w-12 h-12 bg-[#16a34a] text-white rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0 shadow-lg shadow-green-200/50">
                         {selectedMessage.name.charAt(0)}
                      </div>
                      <div>
                         <h2 className="text-lg font-semibold text-gray-900">{selectedMessage.name}</h2>
                         <div className="flex items-center gap-1.5 text-xs text-gray-400">
                             <Mail className="w-3.5 h-3.5" />
                             {selectedMessage.email}
                         </div>
                      </div>
                   </div>
                   <div className="text-right">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{selectedMessage.subject.replace('_', ' ')}</span>
                      <p className="text-xs text-gray-500 font-medium mt-1">{new Date(selectedMessage.createdAt).toLocaleDateString()}</p>
                   </div>
                </div>

                {/* Message Body */}
                <div className="flex-1 p-8 overflow-y-auto no-scrollbar">
                   <div className="max-w-3xl space-y-4">
                        <div className="flex items-center gap-2 text-xs font-semibold text-[#16a34a]">
                            <History className="w-4 h-4" /> Message content
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                            {selectedMessage.message}
                        </p>
                   </div>
                </div>

                {/* Resolve Action */}
                {activeTab === 'open' && (
                  <div className="p-8 bg-gray-50/50 border-t border-gray-50 flex items-center justify-between">
                     <p className="text-xs font-medium text-gray-400">Marking as resolved will archive this message.</p>
                     <button 
                       onClick={() => handleResolve(selectedId!)}
                       disabled={!!actionLoading}
                       className="h-10 px-6 bg-[#16a34a] text-white font-semibold rounded-lg text-xs flex items-center gap-2 hover:bg-[#15803d] transition-all"
                     >
                       {actionLoading === selectedId ? (
                         <Loader2 className="w-4 h-4 animate-spin" />
                       ) : (
                         <>
                           <CheckCircle2 className="w-4 h-4" />
                           Mark as resolved
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
