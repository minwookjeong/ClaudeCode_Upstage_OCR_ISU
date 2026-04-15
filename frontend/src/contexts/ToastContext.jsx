import { createContext, useCallback, useContext, useRef, useState } from 'react'

const ToastContext = createContext(null)

// ── 개별 Toast 아이템 ──────────────────────────────────────────
const TYPE_STYLES = {
  success: {
    bar: 'bg-green-500',
    icon: '✓',
    iconBg: 'bg-green-100 text-green-600',
    text: 'text-gray-900',
  },
  error: {
    bar: 'bg-red-500',
    icon: '✕',
    iconBg: 'bg-red-100 text-red-600',
    text: 'text-gray-900',
  },
  info: {
    bar: 'bg-blue-500',
    icon: 'i',
    iconBg: 'bg-blue-100 text-blue-600',
    text: 'text-gray-900',
  },
}

function ToastItem({ toast, onDismiss }) {
  const s = TYPE_STYLES[toast.type] ?? TYPE_STYLES.info

  return (
    <div className="flex items-start gap-3 bg-white rounded-xl shadow-lg border border-gray-100 p-4 w-80 animate-slide-in-right">
      {/* 좌측 컬러 바 */}
      <div className={`w-1 self-stretch rounded-full ${s.bar}`} />

      {/* 아이콘 */}
      <span className={`flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${s.iconBg}`}>
        {s.icon}
      </span>

      {/* 메시지 */}
      <p className={`flex-1 text-sm leading-snug ${s.text}`}>{toast.message}</p>

      {/* 닫기 버튼 */}
      <button
        onClick={() => onDismiss(toast.id)}
        className="flex-shrink-0 text-gray-300 hover:text-gray-500 transition-colors text-lg leading-none"
        aria-label="닫기"
      >
        ×
      </button>
    </div>
  )
}

// ── Toast 컨테이너 ─────────────────────────────────────────────
function ToastContainer({ toasts, onDismiss }) {
  if (toasts.length === 0) return null
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

// ── Provider ──────────────────────────────────────────────────
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timers = useRef({})

  const dismiss = useCallback((id) => {
    clearTimeout(timers.current[id])
    delete timers.current[id]
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const showToast = useCallback(
    (message, type = 'info', duration = 3000) => {
      const id = Date.now()
      setToasts((prev) => [...prev, { id, message, type }])
      timers.current[id] = setTimeout(() => dismiss(id), duration)
    },
    [dismiss],
  )

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}

// ── 훅 ────────────────────────────────────────────────────────
export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
