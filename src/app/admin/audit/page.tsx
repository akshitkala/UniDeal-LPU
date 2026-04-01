'use client'

import { useEffect, useState } from 'react'
import { Activity, ShieldCheck, Loader2, Database, AlertTriangle } from 'lucide-react'
import { Banner } from '@/components/global/Banner'
import { formatDistanceToNow } from 'date-fns'

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
      setError('Trace Recovery Exception: Cryptographic audit stream disrupted.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAudit()
  }, [])

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto mb-20">
      
      <div>
        <h1 className="text-3xl font-extrabold text-[#1A1A1A]">Audit Log</h1>
        <p className="text-gray-500 mt-1">Immutable cryptographic trace of all administrative executions on the UniDeal network.</p>
      </div>

      {error && (
        <Banner 
          message={error} 
          variant="error" 
          onClose={() => setError(null)} 
        />
      )}

      <div className="bg-white border border-[#E5E5E5] rounded-2xl shadow-sm overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 text-[#2D9A54] animate-spin" /></div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-20 text-center">
            <Database className="w-12 h-12 text-gray-300 mb-4" />
            <h3 className="text-xl font-bold text-gray-800">No traces detected</h3>
            <p className="text-gray-500 mt-2">Administrative payload stream is empty.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-[#F9F9F9] border-b border-[#E5E5E5] text-gray-500 uppercase text-xs font-bold tracking-wider">
                <tr>
                  <th className="p-4">Action Pipeline</th>
                  <th className="p-4">Authorization</th>
                  <th className="p-4">Metadata Payload</th>
                  <th className="p-4 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E5]">
                {logs.map((log) => {
                  const isDestructive = log.action.includes('CASCADE') || log.action.includes('HARD_DELETE') || log.action.includes('BANNED')
                  return (
                    <tr key={log._id} className={`hover:bg-gray-50 transition-colors ${isDestructive ? 'bg-red-50/20' : ''}`}>
                      
                      <td className="p-4 font-mono font-bold">
                        <div className="flex items-center gap-2">
                          {isDestructive ? <AlertTriangle className="w-4 h-4 text-red-500"/> : <Activity className="w-4 h-4 text-blue-500"/>}
                          <span className={`${isDestructive ? 'text-red-700' : 'text-blue-700'}`}>{log.action}</span>
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="flex items-center gap-2">
                           <div className="flex flex-col">
                             {log.actorType === 'deleted_user' ? (
                                <span className="font-bold text-gray-900">System Trace (User Trigger)</span>
                             ) : (
                                <span className="font-bold text-gray-900">{log.actor?.displayName || 'Ghost'}</span>
                             )}
                             <div className="flex items-center gap-1.5 mt-0.5">
                               {log.actor?.isLpuVerified && <ShieldCheck className="w-3 h-3 text-[#2D9A54]"/>}
                               <span className="text-xs text-gray-500">{log.actor?.email || 'System Exec'}</span>
                             </div>
                           </div>
                        </div>
                      </td>

                      <td className="p-4 font-mono text-xs max-w-sm overflow-hidden text-ellipsis whitespace-nowrap text-gray-500">
                         {log.reason && <div className="text-gray-800 font-bold mb-1">» {log.reason}</div>}
                         {log.metadata ? JSON.stringify(log.metadata) : 'NO_PAYLOAD'}
                      </td>

                      <td className="p-4 text-right text-xs whitespace-nowrap">
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
