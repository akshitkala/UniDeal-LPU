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
  ExternalLink, 
  LogOut,
  Save,
  ShieldEllipsis,
  CircleUser,
  BadgeCheck,
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

  // State for form
  const [formData, setFormData] = useState({
    displayName: '',
    bio: ''
  })
  const [isChanged, setIsChanged] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null)
  
  // Danger Zone State
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
        // AuthProvider handles cookie clearing and redirect via state update or logout call
        // But here we explicitly redirect after a successful hard delete
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
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 gap-4">
        <Loader2 className="w-12 h-12 text-[#2D9A54] animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Syncing Identity</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto py-12 px-6 flex flex-col gap-8 min-h-screen mb-24">
      
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-black text-gray-900 tracking-tighter">Profile & Settings</h1>
        <p className="text-gray-500 font-medium">Manage your campus identity and account security.</p>
      </div>

      {message && (
        <Banner 
          message={message.text} 
          variant={message.type} 
          onClose={() => setMessage(null)} 
        />
      )}

      {/* Main Settings Card */}
      <div className="bg-white border border-gray-100 rounded-[2.5rem] shadow-premium overflow-hidden">
        
        {/* Profile Identity Section */}
        <div className="p-8 md:p-12 border-b border-gray-50 bg-gray-50/30">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="relative group">
              <div className="absolute inset-0 bg-emerald-500/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity rounded-full" />
              <div className="relative w-32 h-32 rounded-[2.5rem] overflow-hidden border-4 border-white shadow-xl ring-1 ring-gray-100">
                <Avatar 
                  src={user.photoURL} 
                  name={user.displayName}
                  size="xl"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            
            <div className="flex flex-col text-center md:text-left gap-2">
              <div className="flex items-center justify-center md:justify-start gap-2">
                <h2 className="text-3xl font-black text-gray-900 tracking-tight leading-none uppercase">
                  {user.displayName}
                </h2>
                {user.role === 'admin' && (
                  <ShieldCheck className="w-5 h-5 text-emerald-500" />
                )}
              </div>
              <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400 uppercase tracking-widest">
                  <Mail className="w-3.5 h-3.5" /> {user.email}
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400 uppercase tracking-widest">
                  <Calendar className="w-3.5 h-3.5" /> Member Since {formatDistanceToNow(new Date(user.createdAt))} ago
                </div>
              </div>
            </div>

            {user.role === 'admin' && (
              <Link 
                href="/admin/overview"
                className="md:ml-auto flex items-center gap-2 h-12 px-6 bg-emerald-50 text-emerald-700 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-100 transition-all border border-emerald-100 shadow-sm"
              >
                <ShieldEllipsis className="w-4 h-4" /> Admin Panel
              </Link>
            )}
          </div>
        </div>

        {/* Form Section */}
        <form onSubmit={handleSave} className="p-8 md:p-12 flex flex-col gap-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Display Name */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">
                Display Name
              </label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 group-focus-within:text-emerald-500 transition-colors" />
                <input 
                  type="text"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleInputChange}
                  className="w-full h-14 pl-12 pr-4 bg-gray-50 border border-transparent focus:border-emerald-500 focus:bg-white rounded-2xl outline-none text-gray-900 font-bold transition-all shadow-inner-sm"
                  placeholder="Your campus name"
                  minLength={2}
                  maxLength={50}
                  required
                />
              </div>
              <p className="text-[10px] text-gray-400 font-medium px-1">
                visible to all students on your public profile.
              </p>
            </div>

            {/* Email (Read-only) */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">
                Primary Email
              </label>
              <div className="relative group opacity-60 cursor-not-allowed">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                <input 
                  type="email"
                  value={user.email}
                  readOnly
                  className="w-full h-14 pl-12 pr-4 bg-gray-100 border border-transparent rounded-2xl outline-none text-gray-500 font-bold"
                />
              </div>
              <p className="text-[10px] text-gray-400 font-medium px-1">
                Managed by Google Workspace. Cannot be edited.
              </p>
            </div>
          </div>

          {/* Bio */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">
              Campus Bio
            </label>
            <div className="relative group">
              <textarea 
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                rows={4}
                className="w-full p-4 bg-gray-50 border border-transparent focus:border-emerald-500 focus:bg-white rounded-[2rem] outline-none text-gray-900 font-medium transition-all shadow-inner-sm resize-none"
                placeholder="Say hello to the campus community..."
                maxLength={200}
              />
              <div className="absolute bottom-4 right-4 text-[10px] font-black text-gray-300 bg-white/80 backdrop-blur-sm px-2 py-1 rounded-full border border-gray-100">
                {formData.bio.length} / 200
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-4 border-t border-gray-50 pt-8 mt-4">
             <button 
                type="button"
                onClick={() => router.push('/')}
                className="h-14 px-8 rounded-2xl font-black text-xs uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-all"
             >
                Discard
             </button>
             <button 
                disabled={!isChanged || saving}
                className={cn(
                  "h-14 px-10 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95",
                  isChanged 
                    ? "bg-[#2D9A54] text-white hover:bg-[#258246] shadow-emerald-200" 
                    : "bg-gray-100 text-gray-400 shadow-none cursor-not-allowed"
                )}
             >
                {saving ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Updating...</>
                ) : (
                  <><Save className="w-4 h-4" /> Save Changes</>
                )}
             </button>
          </div>
        </form>
      </div>

      {/* Danger Zone */}
      <div className="bg-rose-50/30 border border-rose-100 rounded-[2.5rem] p-8 md:p-12 flex flex-col items-center md:items-start gap-6">
        <div className="flex flex-col gap-1 text-center md:text-left">
          <h3 className="text-xl font-black text-rose-600 uppercase tracking-tight flex items-center justify-center md:justify-start gap-2">
            <AlertTriangle className="w-5 h-5" /> Danger Zone
          </h3>
          <p className="text-rose-500/70 font-medium text-sm">
            Irreversibly erase your account, active listings, and all associated images from UniDeal.
          </p>
        </div>
        
        <button 
          onClick={() => setIsDeleteModalOpen(true)}
          className="h-14 px-8 bg-white border border-rose-200 text-rose-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-all shadow-sm shadow-rose-100 flex items-center gap-2"
        >
          <Trash2 className="w-4 h-4" /> Delete Account Permanently
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <ConfirmModal 
          title="Master Wipe Protocol"
          description={
            <div className="flex flex-col gap-3 text-center">
              <p className="text-gray-800 font-medium">
                You are about to irreversibly erase your campus identity.
              </p>
              <div className="bg-rose-50 p-4 rounded-2xl text-left border border-rose-100 flex flex-col gap-2">
                <div className="text-[10px] font-black text-rose-600 uppercase tracking-widest flex items-center gap-2">
                  <BadgeCheck className="w-3 h-3" /> Impact Summary:
                </div>
                <ul className="text-xs text-rose-700/80 font-bold flex flex-col gap-1 list-disc px-4">
                  <li>Profile metadata & biography</li>
                  <li>All active & pending listings</li>
                  <li>Injected Cloudinary assets (images)</li>
                  <li>Community trust signals</li>
                </ul>
              </div>
              <p className="text-xs text-gray-500 font-bold leading-relaxed mt-2">
                This action executes a multi-db cascade wipe. <br/>It cannot be recovered.
              </p>
            </div>
          }
          actionText="Execute Master Wipe"
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
