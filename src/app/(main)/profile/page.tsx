'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  User, 
  Mail, 
  Calendar, 
  ShieldCheck, 
  Trash2, 
  Loader2, 
  LogOut,
  Save,
  ShieldEllipsis,
  AlertTriangle
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useAuth } from '@/components/auth/AuthProvider'
import { Avatar } from '@/components/ui/Avatar'
import { Banner } from '@/components/global/Banner'
import { ConfirmModal } from '@/components/global/ConfirmModal'
import { cn } from '@/lib/utils'

export default function ProfilePage() {
  const { user, setUser, loading: authLoading, logout } = useAuth()
  const router = useRouter()

  const [formData, setFormData] = useState({
    displayName: '',
    bio: ''
  })
  const [isChanged, setIsChanged] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null)
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?returnTo=/profile')
      return
    }

    if (user) {
      setFormData({
        displayName: user.displayName || '',
        bio: user.bio || ''
      })
    }
  }, [user, authLoading, router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setIsChanged(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isChanged || saving) return

    setSaving(true)
    setMessage(null)

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await res.json()

      if (res.ok) {
        setUser((prev: any) => prev ? { ...prev, ...data } : null)
        setMessage({ text: 'Profile updated successfully.', type: 'success' })
        setIsChanged(false)
      } else {
        setMessage({ text: data.error || 'Update failed.', type: 'error' })
      }
    } catch (err) {
      setMessage({ text: 'Network connection failed.', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    setDeleting(true)
    try {
      const res = await fetch('/api/user/profile', { method: 'DELETE' })
      if (res.ok) {
        window.location.href = '/login'
      } else {
        const data = await res.json()
        setMessage({ text: data.error || 'Deletion failed.', type: 'error' })
        setDeleting(false)
        setIsDeleteModalOpen(false)
      }
    } catch (err) {
      setMessage({ text: 'Network connection failed.', type: 'error' })
      setDeleting(false)
    }
  }

  if (authLoading || !user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 gap-3 opacity-50">
        <Loader2 className="w-10 h-10 text-[#16a34a] animate-spin" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Loading profile...</span>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6 flex flex-col gap-8 mb-24">
      
      <header>
        <h1 className="text-xl lg:text-2xl font-semibold text-gray-900">Profile</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage your account and public information</p>
      </header>

      {message && (
        <div className={cn(
            "p-3 border rounded-xl flex items-center gap-2 text-xs font-semibold",
            message.type === 'success' ? "bg-green-50 border-green-100 text-green-600" : "bg-red-50 border-red-100 text-red-600"
        )}>
            {message.type === 'success' ? <ShieldCheck className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            {message.text}
        </div>
      )}

      {/* Profile Card */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        
        {/* Identity Row */}
        <div className="p-6 sm:p-8 border-b border-gray-50 bg-gray-50/30">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <Avatar 
                src={user.photoURL} 
                name={user.displayName}
                size="xl"
                className="w-24 h-24 ring-4 ring-white shadow-md"
            />
            
            <div className="flex-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h2 className="text-lg font-semibold text-gray-900 leading-none">
                  {user.displayName}
                </h2>
                {user.role === 'admin' && (
                  <ShieldCheck className="w-4 h-4 text-[#16a34a]" />
                )}
              </div>
              <div className="flex flex-wrap justify-center sm:justify-start gap-x-4 gap-y-2 mt-2">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  <Mail className="w-3.5 h-3.5" /> {user.email}
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  <Calendar className="w-3.5 h-3.5" /> Joined {formatDistanceToNow(new Date(user.createdAt))} ago
                </div>
              </div>
            </div>

            {user.role === 'admin' && (
              <Link 
                href="/admin"
                className="h-9 px-4 bg-indigo-50 text-indigo-700 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 hover:bg-indigo-100 transition-all border border-indigo-100"
              >
                <ShieldEllipsis className="w-3.5 h-3.5" /> Admin Panel
              </Link>
            )}
          </div>
        </div>

        {/* Edit Form */}
        <form onSubmit={handleSave} className="p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest pl-1">Display Name</label>
              <input 
                type="text"
                name="displayName"
                value={formData.displayName}
                onChange={handleInputChange}
                className="w-full h-10 px-3 bg-gray-100 border-none rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-[#16a34a10]"
                placeholder="Full name or nickname"
                minLength={2}
                maxLength={50}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest pl-1">Email</label>
              <input 
                type="email"
                value={user.email}
                readOnly
                className="w-full h-10 px-3 bg-gray-50 border-none rounded-lg text-sm font-medium text-gray-400 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase text-gray-400 tracking-widest pl-1">Bio</label>
            <textarea 
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              rows={4}
              className="w-full p-3 bg-gray-100 border-none rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-[#16a34a10] resize-none"
              placeholder="Tell others about yourself..."
              maxLength={200}
            />
            <div className="text-right">
                <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">
                    {formData.bio.length} / 200 characters
                </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-50">
             <button 
                disabled={!isChanged || saving}
                className={cn(
                  "h-10 px-6 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all",
                  isChanged 
                    ? "bg-[#16a34a] text-white hover:bg-[#15803d]" 
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                )}
             >
                {saving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                Save Changes
             </button>
          </div>
        </form>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-50/50 border border-red-100 rounded-xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-red-600 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> Danger Zone
          </h3>
          <p className="text-xs text-red-500/70 font-medium">
             Permanently delete your account and all associated data.
          </p>
        </div>
        
        <button 
          onClick={() => setIsDeleteModalOpen(true)}
          className="h-10 px-4 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 transition-all shadow-sm shadow-red-100 flex items-center justify-center gap-2 whitespace-nowrap"
        >
          <Trash2 className="w-3.5 h-3.5" /> Delete Account
        </button>
      </div>

      {isDeleteModalOpen && (
        <ConfirmModal 
          title="Delete account"
          description={
            <div className="space-y-4 py-2">
               <p className="text-sm text-gray-600 leading-relaxed">
                 You are about to permanently delete your account. This will remove:
               </p>
               <ul className="text-xs text-gray-500 font-medium space-y-1 list-disc px-4">
                  <li>Your profile information and bio</li>
                  <li>All your active and pending listings</li>
                  <li>All listing images and saved data</li>
               </ul>
               <p className="text-xs text-red-600 font-semibold">
                 This action cannot be undone.
               </p>
            </div>
          }
          actionText="Confirm deletion"
          actionVariant="danger"
          requireText="DELETE"
          loading={deleting}
          onConfirm={handleDeleteAccount}
          onCancel={() => setIsDeleteModalOpen(false)}
        />
      )}

    </div>
  )
}
