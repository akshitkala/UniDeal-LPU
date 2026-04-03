'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { Search, ShieldBan, ShieldCheck, Trash2, Loader2, UserX, UserPlus, UserMinus, X, ChevronRight } from 'lucide-react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { ConfirmModal } from '@/components/global/ConfirmModal'
import { Banner } from '@/components/global/Banner'
import { getRelativeTime } from '@/lib/utils/time'
import { Avatar } from '@/components/ui/Avatar'
import { cn } from '@/lib/utils'

export default function UsersManagement() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  const [users, setUsers] = useState<any[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')

  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean
    type: 'ban' | 'unban' | 'delete' | 'promote' | 'demote'
    id: string | null
    displayName: string
  }>({ isOpen: false, type: 'ban', id: null, displayName: '' })

  const [reasonInput, setReasonInput] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const fetchUsers = useCallback(async (pageNum: number = 1, append: boolean = false) => {
    if (append) setLoadingMore(true)
    else setLoading(true)

    try {
      const params = new URLSearchParams(searchParams)
      params.set('page', pageNum.toString())
      params.set('limit', '50')

      const res = await fetch(`/api/admin/users?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        if (append) {
          setUsers(prev => {
            const existingIds = new Set(prev.map(u => u._id))
            const newItems = data.users.filter((u: any) => !existingIds.has(u._id))
            return [...prev, ...newItems]
          })
        } else {
          setUsers(data.users)
          setTotalCount(data.total)
        }
        setError(null)
      }
    } catch {
      setError('Failed to load users.')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [searchParams])

  useEffect(() => {
    setPage(1)
    fetchUsers(1, false)
  }, [fetchUsers])

  const handleLoadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    fetchUsers(nextPage, true)
  }

  const updateParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams)
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === 'all') {
        params.delete(key)
      } else {
        params.set(key, value)
      }
    })
    params.delete('page') // Reset page on filter change
    router.push(`${pathname}?${params.toString()}`)
  }

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery !== (searchParams.get('q') || '')) {
         updateParams({ q: searchQuery || null })
      }
    }, 400)
    return () => clearTimeout(timeoutId)
  }, [searchQuery, searchParams, pathname, router])

  const handleAction = async () => {
    if (!modalConfig.id) return
    setActionLoading(true)
    
    try {
      let res
      if (modalConfig.type === 'delete') {
         res = await fetch(`/api/admin/users/${modalConfig.id}`, { method: 'DELETE' })
      } else {
         const payload: any = { 
           action: modalConfig.type === 'promote' ? 'changeRole' : 
                   modalConfig.type === 'demote' ? 'changeRole' : 
                   modalConfig.type,
           reason: reasonInput 
         }
         
         if (modalConfig.type === 'promote') payload.role = 'admin'
         if (modalConfig.type === 'demote') payload.role = 'user'

         res = await fetch(`/api/admin/users/${modalConfig.id}`, {
           method: 'PATCH',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify(payload)
         })
      }

      const data = await res.json()
      if (res.ok) {
         setSuccessMessage(modalConfig.type === 'promote' || modalConfig.type === 'demote' ? 'Role updated' : 'Action successful')
         setModalConfig({ isOpen: false, type: 'ban', id: null, displayName: '' })
         setReasonInput('')
         setError(null)
         fetchUsers(1, false)
         setPage(1)
         setTimeout(() => setSuccessMessage(null), 3000)
      } else {
         setError(data.error || 'Action failed')
      }
    } catch (e) {
      setError('Connection failed.')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      
      {/* Header & Controls */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
        <div>
          <h1 className="text-xl lg:text-2xl font-semibold text-gray-900">Users</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage campus accounts and permissions</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
            <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search users..."
                    className="w-full h-10 pl-9 pr-4 bg-gray-100 border-none rounded-full text-sm font-medium outline-none focus:ring-2 focus:ring-[#16a34a10]"
                />
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto no-scrollbar">
                <select 
                    value={searchParams.get('role') || 'all'}
                    onChange={(e) => updateParams({ role: e.target.value })}
                    className="h-10 px-3 bg-white border border-gray-100 rounded-full text-xs font-semibold outline-none"
                >
                    <option value="all">All Roles</option>
                    <option value="user">Users</option>
                    <option value="admin">Admins</option>
                </select>

                <select 
                    value={searchParams.get('status') || 'all'}
                    onChange={(e) => updateParams({ status: e.target.value })}
                    className="h-10 px-3 bg-white border border-gray-100 rounded-full text-xs font-semibold outline-none"
                >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="banned">Banned</option>
                </select>

                <select 
                    value={searchParams.get('sort') || 'newest'}
                    onChange={(e) => updateParams({ sort: e.target.value })}
                    className="h-10 px-3 bg-white border border-gray-100 rounded-full text-xs font-semibold outline-none"
                >
                    <option value="newest">Newest</option>
                    <option value="oldest">Oldest</option>
                    <option value="listings">Most Listings</option>
                </select>
            </div>
        </div>
      </header>

      {(error || successMessage) && (
        <div className="mb-6 space-y-2">
          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-red-600 text-xs font-semibold">
               <ShieldBan className="w-4 h-4" /> {error}
            </div>
          )}
          {successMessage && (
            <div className="p-3 bg-green-50 border border-green-100 rounded-xl flex items-center gap-2 text-green-600 text-xs font-semibold">
               <ShieldCheck className="w-4 h-4" /> {successMessage}
            </div>
          )}
        </div>
      )}

      {/* Main Table Container */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden min-h-[400px]">
        {loading && users.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3 opacity-50">
             <Loader2 className="w-8 h-8 text-[#16a34a] animate-spin" />
             <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Syncing...</span>
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center opacity-50">
            <UserX className="w-12 h-12 text-gray-200 mb-4" />
            <p className="text-sm font-semibold text-gray-400">No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">User Details</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Role & Status</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Listings</th>
                  <th className="px-6 py-4 text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar 
                           src={u.photoURL} 
                           name={u.displayName}
                           size="sm"
                         />
                        <div className="min-w-0">
                           <span className="text-sm font-semibold text-gray-900 block truncate">{u.displayName}</span>
                           <span className="text-[10px] text-gray-400 block truncate">{u.email}</span>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 items-start">
                        <span className={cn(
                          "text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded border",
                          u.role === 'admin' ? "bg-indigo-50 text-indigo-700 border-indigo-100" : "bg-gray-50 text-gray-600 border-gray-200"
                        )}>
                          {u.role}
                        </span>
                        <span className={cn(
                          "text-[10px] font-medium",
                          u.isActive ? "text-green-600" : "text-red-500"
                        )}>
                          {u.isActive ? "Active" : "Banned"}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-semibold text-gray-900">{u.listingCount || 0}</span>
                    </td>

                    <td className="px-6 py-4">
                       <div className="flex items-center justify-end gap-2">
                          {u.role === 'user' ? (
                             <button 
                                onClick={() => setModalConfig({ isOpen: true, type: 'promote', id: u._id, displayName: u.displayName })}
                                className="h-9 w-9 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center hover:bg-indigo-100 transition-all"
                                title="Promote to admin"
                             >
                                <UserPlus className="w-3.5 h-3.5"/>
                             </button>
                          ) : (
                             <button 
                                onClick={() => setModalConfig({ isOpen: true, type: 'demote', id: u._id, displayName: u.displayName })}
                                className="h-9 w-9 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center hover:bg-orange-100 transition-all font-semibold"
                                title="Remove admin access"
                             >
                                <UserMinus className="w-3.5 h-3.5"/>
                             </button>
                          )}
                          
                          {u.role !== 'admin' && (
                            <>
                              {u.isActive ? (
                                <button 
                                  onClick={() => setModalConfig({ isOpen: true, type: 'ban', id: u._id, displayName: u.displayName })}
                                  className="h-9 w-9 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center hover:bg-amber-100"
                                  title="Ban user"
                                >
                                  <ShieldBan className="w-3.5 h-3.5"/>
                                </button>
                              ) : (
                                <button 
                                  onClick={() => setModalConfig({ isOpen: true, type: 'unban', id: u._id, displayName: u.displayName })}
                                  className="h-9 w-9 bg-green-50 text-green-600 rounded-lg flex items-center justify-center hover:bg-green-100"
                                  title="Unban user"
                                >
                                  <ShieldCheck className="w-3.5 h-3.5"/>
                                </button>
                              )}
                              <button 
                                 onClick={() => setModalConfig({ isOpen: true, type: 'delete', id: u._id, displayName: u.displayName })}
                                 className="h-9 w-9 bg-red-50 text-red-600 rounded-lg flex items-center justify-center hover:bg-red-100"
                                 title="Delete account"
                              >
                                <Trash2 className="w-3.5 h-3.5"/>
                              </button>
                            </>
                          )}
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {users.length < totalCount && (
              <div className="p-4 border-t border-gray-100 flex justify-center">
                 <button 
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="h-10 px-6 bg-white border border-gray-200 rounded-full text-xs font-bold text-gray-600 hover:bg-gray-50 transition-all flex items-center gap-2 disabled:opacity-50"
                 >
                    {loadingMore ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        Load More ({totalCount - users.length} remaining)
                        <ChevronRight className="w-3.5 h-3.5 rotate-90" />
                      </>
                    )}
                 </button>
              </div>
            )}
          </div>
        )}
      </div>

      {modalConfig.isOpen && (
        <ConfirmModal 
          title={
            modalConfig.type === 'ban' ? 'Ban user' :
            modalConfig.type === 'unban' ? 'Unban user' :
            modalConfig.type === 'promote' ? 'Promote to admin' :
            modalConfig.type === 'demote' ? 'Remove admin access' :
            'Delete account'
          }
          description={
            <div className="space-y-4 py-2">
               <div className="text-sm text-gray-600">
                {modalConfig.type === 'promote' && (
                  <p>This user will have full access to the admin dashboard.</p>
                )}
                {modalConfig.type === 'demote' && (
                  <p>This user will lose all administrative privileges.</p>
                )}
                {modalConfig.type === 'ban' && (
                  <p>User <strong>{modalConfig.displayName}</strong> will be banned from the platform.</p>
                )}
                {modalConfig.type === 'unban' && (
                  <p>Restore access for <strong>{modalConfig.displayName}</strong>?</p>
                )}
                {modalConfig.type === 'delete' && (
                  <p>This account will be permanently erased. This action cannot be undone.</p>
                )}
              </div>
               
               {['ban', 'promote', 'demote'].includes(modalConfig.type) && (
                 <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest pl-1">Reason for action</label>
                    <textarea 
                      value={reasonInput}
                      onChange={(e) => setReasonInput(e.target.value)}
                      className="w-full h-24 p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-[#16a34a10] text-sm font-medium transition-all resize-none"
                      placeholder="Explain the reason..."
                    />
                 </div>
               )}
            </div>
          }
          actionText={
            modalConfig.type === 'promote' ? 'Promote' :
            modalConfig.type === 'demote' ? 'Remove Access' :
            modalConfig.type === 'delete' ? 'Confirm Deletion' : 
            'Confirm'
          }
          actionVariant={
            modalConfig.type === 'promote' || modalConfig.type === 'unban' ? 'primary' : 'danger'
          }
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
