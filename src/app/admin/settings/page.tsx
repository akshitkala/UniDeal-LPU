'use client'

import { useEffect, useState } from 'react'
import { 
  Settings, 
  ShieldAlert, 
  Activity, 
  RefreshCcw, 
  Save, 
  Loader2, 
  CheckCircle, 
  Zap, 
  Eye, 
  Lock,
  Smartphone
} from 'lucide-react'

interface Config {
  maintenanceMode: boolean
  allowNewListings: boolean
  approvalMode: 'manual' | 'ai_flagging' | 'automatic'
  updatedAt: string
}

/**
 * A-07: Admin System Settings (Fix 15).
 * Features: live toggle controls, maintenance mode, and audit logging.
 */
export default function AdminSettingsPage() {
  const [config, setConfig] = useState<Config | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/admin/config')
      const data = await res.json()
      setConfig(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchConfig()
  }, [])

  const handleToggle = async (key: keyof Config, value: any) => {
    setSaving(key)
    try {
      const res = await fetch('/api/admin/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value })
      })
      if (res.ok) {
        const newData = await res.json()
        setConfig(newData)
        setSuccess(`${key.charAt(0).toUpperCase() + key.slice(1)} Updated.`)
        setTimeout(() => setSuccess(null), 3000)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(null)
    }
  }

  if (loading || !config) {
    return (
      <div className="flex items-center justify-center py-20 h-full">
        <Loader2 className="w-10 h-10 animate-spin text-[#2D9A54]" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-12 mb-12">
      
      {/* Header */}
      <div className="flex justify-between items-end border-b border-gray-100 pb-8">
        <div>
          <h1 className="text-3xl font-extrabold flex items-center gap-3">
             <Settings className="w-8 h-8 text-blue-500" />
             Core Configuration
          </h1>
          <p className="text-gray-500 mt-2">Manage global marketplace parameters and security overrides.</p>
        </div>
        {success && (
          <div className="flex items-center gap-1.5 text-[#2D9A54] font-bold text-xs uppercase animate-in slide-in-from-right-4 duration-300">
             <CheckCircle className="w-4 h-4" />
             {success}
          </div>
        )}
      </div>

      <div className="grid gap-10">
        
        {/* Toggle Block: Maintenance */}
        <section className="bg-white border border-gray-100 rounded-[32px] p-8 shadow-sm relative overflow-hidden flex flex-col md:flex-row gap-6 items-center">
           <div className={`absolute top-0 right-0 w-2 h-full ${config.maintenanceMode ? 'bg-red-500' : 'bg-gray-100'}`} />
           
           <div className="w-16 h-16 bg-red-50 rounded-[22px] flex items-center justify-center flex-shrink-0 animate-pulse-slow">
              <ShieldAlert className={`w-8 h-8 ${config.maintenanceMode ? 'text-red-600' : 'text-gray-300'}`} />
           </div>

           <div className="flex-1 text-center md:text-left">
              <h3 className="text-xl font-bold text-gray-900">Maintenance Protocol</h3>
              <p className="text-gray-500 text-sm mt-1 max-w-md">
                 Globally disable all student access to listings, profiles, and dashboards. Site will display a system-wide banner.
              </p>
           </div>

           <button 
             onClick={() => handleToggle('maintenanceMode', !config.maintenanceMode)}
             disabled={saving === 'maintenanceMode'}
             className={`w-28 h-12 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${
               config.maintenanceMode 
                 ? 'bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-200' 
                 : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
             }`}
           >
             {saving === 'maintenanceMode' ? <Loader2 className="w-4 h-4 animate-spin mx-auto"/> : config.maintenanceMode ? 'ENGAGED' : 'OFFLINE'}
           </button>
        </section>

        {/* Toggle Block: New Listings */}
        <section className="bg-white border border-gray-100 rounded-[32px] p-8 shadow-sm flex flex-col md:flex-row gap-6 items-center">
           <div className="w-16 h-16 bg-blue-50 rounded-[22px] flex items-center justify-center flex-shrink-0">
              <Activity className={`w-8 h-8 ${config.allowNewListings ? 'text-blue-600' : 'text-gray-300'}`} />
           </div>

           <div className="flex-1 text-center md:text-left">
              <h3 className="text-xl font-bold text-gray-900">Listing Submission Gate</h3>
              <p className="text-gray-500 text-sm mt-1 max-w-md">
                 Toggle standard user ability to create new listings. Use this during high-load periods or content audits.
              </p>
           </div>

           <button 
             onClick={() => handleToggle('allowNewListings', !config.allowNewListings)}
             disabled={saving === 'allowNewListings'}
             className={`w-28 h-12 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${
               config.allowNewListings 
                 ? 'bg-[#2D9A54] text-white hover:bg-[#258246] shadow-lg shadow-green-200' 
                 : 'bg-gray-100 text-gray-400'
             }`}
           >
             {saving === 'allowNewListings' ? <Loader2 className="w-4 h-4 animate-spin mx-auto"/> : config.allowNewListings ? 'ENABLED' : 'PAUSED'}
           </button>
        </section>

        {/* Selection Block: Approval Mode */}
        <section className="bg-white border border-gray-100 rounded-[32px] p-10 shadow-sm space-y-8">
           <div className="flex items-center gap-3">
              <Zap className="w-6 h-6 text-amber-500" />
              <h3 className="text-xl font-bold text-gray-900">Moderation Intelligence Level</h3>
           </div>

           <div className="grid md:grid-cols-3 gap-4">
              {[
                { id: 'automatic', icon: <Smartphone />, title: 'Autopilot', desc: 'No moderation queue. Auto-approve all content.' },
                { id: 'ai_flagging', icon: <Eye />, title: 'AI-Shield', desc: 'Auto-approve low risk. Queue AI-flagged items.' },
                { id: 'manual', icon: <Lock />, title: 'Full Review', desc: 'Queue every single listing for admin approval.' }
              ].map(mode => (
                <button 
                  key={mode.id}
                  onClick={() => handleToggle('approvalMode', mode.id)}
                  disabled={saving === 'approvalMode'}
                  className={`p-6 rounded-[24px] border-2 text-left flex flex-col gap-3 transition-all ${
                    config.approvalMode === mode.id 
                      ? 'border-[#2D9A54] bg-[#2D9A54]/5 ring-4 ring-[#2D9A54]/5' 
                      : 'border-gray-50 hover:border-gray-200 bg-white'
                  }`}
                >
                   <div className={`${config.approvalMode === mode.id ? 'text-[#2D9A54]' : 'text-gray-400'}`}>
                      {mode.icon}
                   </div>
                   <div>
                      <div className="font-extrabold text-gray-900">{mode.title}</div>
                      <div className="text-[10px] text-gray-400 mt-1 uppercase font-bold leading-relaxed">{mode.desc}</div>
                   </div>
                </button>
              ))}
           </div>
        </section>

      </div>
    </div>
  )
}
