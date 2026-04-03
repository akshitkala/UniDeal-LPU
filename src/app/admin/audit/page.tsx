'use client'

import { useEffect, useState } from 'react'
import { Activity, ShieldCheck, Loader2, Database, AlertTriangle, ShieldAlert } from 'lucide-react'
import { Banner } from '@/components/global/Banner'
import { formatDistanceToNow } from 'date-fns'
import { Avatar } from '@/components/ui/Avatar'
import { cn } from '@/lib/utils'

export default function AuditLog() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAudit = async () => {
    try {
      const res = await fetch('/api/admin/audit')
      if (res.ok) {
        const data = await res.json()
        setLogs(data.logs)
        setError(null)
      }
    } catch {
      setError('Failed to load audit data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAudit()
  }, [])

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      
      <header className="mb-8">
        <h1 className="text-xl lg:text-2xl font-semibold text-gray-900">Audit log</h1>
        <p className="text-sm text-gray-500 mt-0.5">Record of administrative actions on the platform</p>
      </header>

      {error && (
        <div className="mb-6 p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-red-600 text-xs font-semibold">
           <AlertTriangle className="w-4 h-4" /> {error}
        </div>
      )}

      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3 opacity-50">
             <Loader2 className="w-8 h-8 text-[#16a34a] animate-spin" />
             <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Syncing...</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center opacity-50">
            <Database className="w-12 h-12 text-gray-200 mb-4" />
            <p className="text-sm font-semibold text-gray-400">No logs found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Action</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Actor</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Metadata</th>
                  <th className="px-6 py-4 text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {logs.map((log) => {
                  const isDestructive = log.action.includes('CASCADE') || log.action.includes('HARD_DELETE') || log.action.includes('BANNED') || log.action.includes('WIPE')
                  return (
                    <tr key={log._id} className={cn(
                        "hover:bg-gray-50/50 transition-colors",
                        isDestructive && "bg-red-50/10"
                    )}>
                      
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "text-[10px] font-bold font-mono px-2 py-0.5 rounded border",
                            isDestructive ? "bg-red-50 text-red-600 border-red-100" : "bg-blue-50 text-blue-600 border-blue-100"
                          )}>
                            {log.action}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                           <Avatar 
                             src={log.actor?.photoURL} 
                             name={log.actorType === 'deleted_user' ? 'System' : (log.actor?.displayName || 'System')}
                             size="sm"
                           />
                           <div className="min-w-0">
                             <span className="text-xs font-semibold text-gray-900 block truncate">
                                {log.actorType === 'deleted_user' ? 'System' : (log.actor?.displayName || 'System')}
                             </span>
                             <span className="text-[10px] text-gray-400 block truncate">{log.actor?.email || 'System Action'}</span>
                           </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                         <div className="max-w-xs truncate font-mono text-[10px] text-gray-400 bg-gray-50 p-1 rounded border border-gray-100">
                            {log.reason && <span className="text-gray-900 font-bold mr-2">{log.reason}</span>}
                            {log.metadata ? JSON.stringify(log.metadata) : 'No metadata'}
                         </div>
                      </td>

                      <td className="px-6 py-4 text-right text-[10px] font-medium text-gray-400 whitespace-nowrap">
                         {formatDistanceToNow(new Date(log.timestamp))} ago
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  )
}
