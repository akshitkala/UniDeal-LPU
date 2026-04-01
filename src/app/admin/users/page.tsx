'use client'

import { useEffect, useState } from 'react'
import { Search, ShieldBan, ShieldCheck, Trash2, Loader2, UserX } from 'lucide-react'
import { ConfirmModal } from '@/components/admin/ConfirmModal'
import { Banner } from '@/components/global/Banner'
import { formatDistanceToNow } from 'date-fns'

export default function UsersManagement() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean
    type: 'ban' | 'unban' | 'delete'
    id: string | null
    displayName: string
  }>({ isOpen: false, type: 'ban', id: null, displayName: '' })

  const [reasonInput, setReasonInput] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const fetchUsers = async () => {
    setLoading(true)
      try {
        const qParams = searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : ''
        const res = await fetch(`/api/admin/users${qParams}`)
        if (res.ok) {
          const data = await res.json()
          setUsers(data.users)
          setError(null)
        }
      } catch {
        setError('Sync Error: Failed to retrieve user database.')
      } finally {
        setLoading(false)
      }
    }
  
    useEffect(() => {
      // Debounce search pattern
      const timeoutId = setTimeout(() => {
         fetchUsers()
      }, 400)
      return () => clearTimeout(timeoutId)
    }, [searchQuery])
  
    const handleAction = async () => {
      if (!modalConfig.id) return
      setActionLoading(true)
      
      try {
        let res
        if (modalConfig.type === 'delete') {
           res = await fetch(`/api/admin/users/${modalConfig.id}`, { method: 'DELETE' })
        } else {
           res = await fetch(`/api/admin/users/${modalConfig.id}`, {
             method: 'PATCH',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ action: modalConfig.type, reason: reasonInput })
           })
        }
  
        const data = await res.json()
        if (res.ok) {
           setModalConfig({ isOpen: false, type: 'ban', id: null, displayName: '' })
           setReasonInput('')
           setError(null)
           fetchUsers()
        } else {
           setError(data.error || 'Action failed')
        }
      } catch (e) {
        setError('Network Error: Action failed.')
      } finally {
        setActionLoading(false)
      }
    }
  
    return (
      <div className="flex flex-col gap-8 max-w-7xl mx-auto mb-20">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-[#1A1A1A]">User Management</h1>
            <p className="text-gray-500 mt-1">Manage accounts, handle reports, and suspend fraudulent actors across the platform.</p>
          </div>
          
          <div className="relative w-full md:w-80">
            <input 
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E5E5E5] rounded-xl outline-none focus:border-[#2D9A54] focus:ring-1 focus:ring-[#2D9A54] transition shadow-sm text-sm"
            />
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
          </div>
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
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-20 text-center">
              <UserX className="w-12 h-12 text-gray-300 mb-4" />
              <h3 className="text-xl font-bold text-gray-800">No users found</h3>
              <p className="text-gray-500 mt-2">Try adjusting your search criteria.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-[#F9F9F9] border-b border-[#E5E5E5] text-gray-500 uppercase text-xs font-bold tracking-wider">
                  <tr>
                    <th className="p-4">User Identity</th>
                    <th className="p-4">Role & Status</th>
                    <th className="p-4">Listings</th>
                    <th className="p-4">Joined</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
              <tbody className="divide-y divide-[#E5E5E5]">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-gray-50 transition-colors">
                    
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden">
                           {u.photoURL ? <img src={u.photoURL} alt="pfp" className="w-full h-full object-cover"/> : <span className="text-[10px] text-gray-500 font-bold uppercase">{u.displayName?.substring(0,2)}</span>}
                         </div>
                         <div className="flex flex-col">
                            <span className="font-bold text-gray-900">{u.displayName}</span>
                            <span className="text-xs text-gray-500 truncate max-w-[200px]">{u.email}</span>
                         </div>
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="flex flex-col gap-1 items-start">
                         <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded border ${u.role === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-gray-100 text-gray-700 border-gray-200'}`}>{u.role}</span>
                         {u.isActive ? (
                            <span className="text-xs text-green-600 font-semibold">• Active</span>
                         ) : (
                            <span className="text-xs text-red-600 font-semibold">• Banned</span>
                         )}
                      </div>
                    </td>

                    <td className="p-4 font-mono font-medium">{u.listingCount}</td>

                    <td className="p-4 text-xs whitespace-nowrap">
                       {formatDistanceToNow(new Date(u.createdAt))} ago
                    </td>

                    <td className="p-4">
                       <div className="flex items-center justify-end gap-2">
                          {u.role !== 'admin' && ( // Hide actions for admins
                            <>
                              {u.isActive ? (
                                <button 
                                  onClick={() => setModalConfig({ isOpen: true, type: 'ban', id: u._id, displayName: u.displayName })}
                                  className="p-2 text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors title='Ban User'"
                                >
                                  <ShieldBan className="w-4 h-4"/>
                                </button>
                              ) : (
                                <button 
                                  onClick={() => setModalConfig({ isOpen: true, type: 'unban', id: u._id, displayName: u.displayName })}
                                  className="p-2 text-[#2D9A54] bg-green-50 hover:bg-green-100 rounded-lg transition-colors title='Unban User'"
                                >
                                  <ShieldCheck className="w-4 h-4"/>
                                </button>
                              )}
                              <button 
                                 onClick={() => setModalConfig({ isOpen: true, type: 'delete', id: u._id, displayName: u.displayName })}
                                 className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors title='Destroy User Target'"
                              >
                                <Trash2 className="w-4 h-4"/>
                              </button>
                            </>
                          )}
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalConfig.isOpen && (
        <ConfirmModal 
          title={
            modalConfig.type === 'ban' ? 'Impose Ban Directive?' :
            modalConfig.type === 'unban' ? 'Lift Sanctions?' :
            'Execute Master Wipe?'
          }
          description={
            <div className="flex flex-col gap-4 text-left">
               <p className="text-gray-600">
                 You are targeting <strong>{modalConfig.displayName}</strong>. 
                 {modalConfig.type === 'ban' && ' Active items will be atomically wiped from live feeds caching.'}
                 {modalConfig.type === 'delete' && ' This sweeps the user\'s Profile, Listings, Images, and Cloudinary buckets permanently from the DB index.'}
               </p>
               
               {modalConfig.type === 'ban' && (
                 <label className="flex flex-col gap-1.5 mt-2">
                   <span className="text-sm font-bold text-gray-800">Enforcement Reason</span>
                   <input 
                     type="text"
                     value={reasonInput}
                     onChange={(e) => setReasonInput(e.target.value)}
                     className="w-full h-11 px-3 border border-gray-300 focus:border-red-500 rounded-lg outline-none bg-gray-50"
                     placeholder="e.g. Scammer network pattern"
                   />
                 </label>
               )}
            </div>
          }
          actionText={modalConfig.type === 'delete' ? 'Confirm M-Wipe' : `Confirm ${modalConfig.type.toUpperCase()}`}
          actionVariant={modalConfig.type === 'unban' ? 'primary' : 'danger'}
          requireText={modalConfig.type === 'delete' ? 'DELETE' : undefined}
          loading={actionLoading}
          onConfirm={handleAction}
          onCancel={() => {
            setModalConfig({ isOpen: false, type: 'ban', id: null, displayName: '' })
            setReasonInput('')
          }}
        />
      )}

    </div>
  )
}
