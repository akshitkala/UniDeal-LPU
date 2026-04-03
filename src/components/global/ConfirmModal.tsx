import { AlertTriangle, Loader2 } from 'lucide-react'
import { ReactNode, useState } from 'react'

interface ConfirmModalProps {
  title: string
  description: ReactNode
  actionText: string
  actionVariant?: 'danger' | 'warning' | 'primary'
  requireText?: string
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmModal({
  title,
  description,
  actionText,
  actionVariant = 'danger',
  requireText,
  loading = false,
  onConfirm,
  onCancel
}: ConfirmModalProps) {
  const [typedValue, setTypedValue] = useState('')

  const buttonColors = {
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    warning: 'bg-amber-500 hover:bg-amber-600 text-white',
    primary: 'bg-[#2D9A54] hover:bg-[#258246] text-white'
  }

  const iconColors = {
    danger: 'bg-red-100 text-red-600',
    warning: 'bg-amber-100 text-amber-600',
    primary: 'bg-green-100 text-[#2D9A54]'
  }

  const isActionDisabled = loading || (requireText ? typedValue !== requireText : false)

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
         <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-2 ${iconColors[actionVariant]}`}>
             <AlertTriangle className="w-7 h-7" />
         </div>
         
         <h3 className="text-2xl font-bold text-center text-gray-900">{title}</h3>
         
         <div className="text-sm text-gray-600 text-center leading-relaxed">
           {description}
         </div>

         {requireText && (
           <label className="flex flex-col gap-2 mt-2">
              <span className="text-sm font-semibold text-gray-700 text-center">
                Please type <strong className="font-mono">{requireText}</strong> below to confirm.
              </span>
              <input 
                type="text" 
                value={typedValue}
                onChange={(e) => setTypedValue(e.target.value)}
                placeholder={requireText}
                className="w-full h-12 rounded-lg bg-white border border-gray-300 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-200 px-4 font-mono text-center text-lg"
              />
           </label>
         )}

         <div className="flex gap-3 w-full mt-4">
           <button 
             onClick={onCancel}
             disabled={loading}
             className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl transition disabled:opacity-50"
           >
             Cancel
           </button>
           <button 
             onClick={onConfirm}
             disabled={isActionDisabled}
             className={`flex-1 py-3 font-bold rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2 ${buttonColors[actionVariant]}`}
           >
             {loading ? <><Loader2 className="w-5 h-5 animate-spin"/> Processing...</> : actionText}
           </button>
         </div>
      </div>
    </div>
  )
}
