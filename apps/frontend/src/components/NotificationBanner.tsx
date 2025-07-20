import { useEffect } from 'react'

interface NotificationBannerProps {
  message: string
  type?: 'info' | 'warning' | 'error' | 'success'
  onClose: () => void
  duration?: number
}

export function NotificationBanner({ 
  message, 
  type = 'info', 
  onClose, 
  duration = 3000 
}: NotificationBannerProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, duration)

    return () => clearTimeout(timer)
  }, [onClose, duration])

  const typeStyles = {
    info: 'bg-blue-600 border-blue-500',
    warning: 'bg-yellow-600 border-yellow-500',
    error: 'bg-red-600 border-red-500',
    success: 'bg-green-600 border-green-500'
  }

  const typeIcons = {
    info: 'ℹ️',
    warning: '⚠️',
    error: '❌',
    success: '✅'
  }

  return (
    <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 ${typeStyles[type]} border text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 min-w-80 max-w-md`}>
      <span className="text-lg">{typeIcons[type]}</span>
      <span className="flex-1 text-sm font-medium">{message}</span>
      <button
        onClick={onClose}
        className="text-white hover:text-gray-200 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}
