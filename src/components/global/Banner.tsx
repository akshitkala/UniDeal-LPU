import { AlertCircle, X } from 'lucide-react'

interface BannerProps {
  message: string
  variant?: 'error' | 'success' | 'info'
  onClose?: () => void
}

export function Banner({ message, variant = 'error', onClose }: BannerProps) {
  const styles = {
    error: 'bg-red-50 text-red-700 border-red-200',
    success: 'bg-green-50 text-green-700 border-green-200',
    info: 'bg-blue-50 text-blue-700 border-blue-200'
  }

  return (
    <div className={`flex items-center justify-between p-4 rounded-xl border ${styles[variant]} animate-in fade-in slide-in-from-top-2 duration-300`}>
      <div className="flex items-center gap-3">
        <AlertCircle className="w-5 h-5 flex-shrink-0" />
        <span className="text-sm font-semibold">{message}</span>
      </div>
      {onClose && (
        <button onClick={onClose} className="p-1 hover:bg-black/5 rounded-lg transition-colors">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
