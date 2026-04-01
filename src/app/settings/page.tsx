'use client'

import { useEffect, useState } from 'react'
import { AlertOctagon, User, ShieldCheck, Mail, Calendar, LogOut, Loader2 } from 'lucide-react'
import { Banner } from '@/components/global/Banner'
import { ConfirmModal } from '@/components/admin/ConfirmModal'

export default function SettingsPage() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    async function fetchMe() {
      try {
        const res = await fetch('/api/user/me')
        if (res.ok) {
          setProfile(await res.json())
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchMe()
  }, [])

  const handleDeleteExecute = async () => {
    setDeleting(true)
    try {
      const res = await fetch('/api/user/me', { method: 'DELETE' })
      if (res.ok) {
        window.location.href = '/'
      } else {
        const data = await res.json()
        setError(data.error || 'Identity Wipe Failure: Persistence layer error during evacuation.')
      }
    } catch (e) {
      setError('Communication Interruption: Network error during account deletion.')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-6 max-w-3xl mx-auto mt-6 animate-pulse">
        <div className="h-40 bg-gray-100 rounded-2xl w-full"></div>
        <div className="h-64 bg-gray-100 rounded-2xl w-full mt-6"></div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="text-center py-20 bg-[#F9F9F9] border border-[#E5E5E5] rounded-xl max-w-3xl mx-auto mt-6">
        <h3 className="text-xl font-bold text-gray-800">You are not logged in</h3>
        <p className="text-gray-500 mt-2">Please login to view account settings.</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto mt-6 mb-20 flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold text-[#1A1A1A]">Account Settings</h1>
        <p className="text-gray-500 mt-1">Manage your UniDeal student profile and preferences.</p>
      </div>

      {error && (
        <Banner 
          message={error} 
          variant="error" 
          onClose={() => setError(null)} 
        />
      )}

      {/* Profile Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#E5E5E5] p-6 md:p-8 flex flex-col md:flex-row gap-8 items-center md:items-start">
        <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center border border-gray-200 overflow-hidden flex-shrink-0">
          {profile.photoURL ? (
             <img src={profile.photoURL} alt="avatar" className="w-full h-full object-cover" />
          ) : (
             <User className="w-12 h-12 text-gray-400" />
          )}
        </div>
        <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left">
          <h2 className="text-2xl font-bold text-gray-900">{profile.displayName}</h2>
          
          {profile.isLpuVerified && (
             <span className="inline-flex items-center gap-1.5 bg-[#2D9A54]/10 text-[#2D9A54] font-bold px-3 py-1 rounded-full text-sm mt-2">
                <ShieldCheck className="w-4 h-4" /> LPU Verified
             </span>
          )}

          <div className="flex flex-col gap-3 mt-6 w-full">
            <div className="flex items-center gap-3 text-gray-600">
               <Mail className="w-5 h-5 text-gray-400" />
               <span className="font-medium">{profile.email}</span>
            </div>
            <div className="flex items-center gap-3 text-gray-600">
               <Calendar className="w-5 h-5 text-gray-400" />
               <span className="font-medium">Joined {new Date(profile.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="border border-red-200 bg-red-50 rounded-2xl p-6 md:p-8 flex flex-col gap-4">
        <div className="flex items-center gap-2 text-red-600">
          <AlertOctagon className="w-6 h-6" />
          <h3 className="text-xl font-bold">Danger Zone</h3>
        </div>
        <p className="text-red-700 max-w-2xl text-sm">
          Once you delete your account, there is no going back. Please be certain.
          Deleting your account will trigger a cascade wipe of all your Active Listings, Messages, and Images from our servers instantly to comply with our rigorous privacy policy.
        </p>
        <button 
           onClick={() => setDeleteModalOpen(true)}
           className="mt-2 w-fit bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-6 rounded-lg transition-colors"
        >
          Delete Account
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <ConfirmModal 
          title="Are you absolutely sure?"
          description={
            <div className="flex flex-col gap-4 text-left">
               <p className="text-gray-600"> This action is irreversible. It will permanently delete:</p>
               <ul className="list-disc ml-5 font-medium text-gray-800 space-y-1">
                  <li>Your user profile</li>
                  <li>All your published listings</li>
                  <li>All uploaded images (wiped from Cloudinary)</li>
               </ul>
            </div>
          }
          actionText="Yes, Delete my account"
          actionVariant="danger"
          requireText="DELETE"
          onConfirm={handleDeleteExecute}
          onCancel={() => setDeleteModalOpen(false)}
          loading={deleting}
        />
      )}

    </div>
  )
}
