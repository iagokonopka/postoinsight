// Toast — spec: FRONTEND_TODO Bloco 10
// Imperative API: toast.success('...') / toast.info('...')
import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { CheckCircle, Info } from 'lucide-react'

type ToastType = 'success' | 'info'

interface ToastState {
  message: string
  type: ToastType
  visible: boolean
  id: number
}

interface ToastContextValue {
  success: (msg: string) => void
  info:    (msg: string) => void
}

const ToastContext = createContext<ToastContextValue>({
  success: () => {},
  info:    () => {},
})

export function useToast() {
  return useContext(ToastContext)
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState>({ message: '', type: 'success', visible: false, id: 0 })

  const show = useCallback((message: string, type: ToastType) => {
    const id = Date.now()
    setToast({ message, type, visible: true, id })
    setTimeout(() => {
      setToast(t => t.id === id ? { ...t, visible: false } : t)
    }, 2800)
  }, [])

  const success = useCallback((msg: string) => show(msg, 'success'), [show])
  const info    = useCallback((msg: string) => show(msg, 'info'),    [show])

  return (
    <ToastContext.Provider value={{ success, info }}>
      {children}
      <ToastDisplay toast={toast} />
    </ToastContext.Provider>
  )
}

function ToastDisplay({ toast }: { toast: ToastState }) {
  return (
    <div style={{
      position: 'fixed',
      right: '24px',
      bottom: '24px',
      background: 'hsl(var(--card))',
      border: '1px solid hsl(var(--border))',
      borderRadius: 'var(--radius)',
      boxShadow: 'var(--shadow-md)',
      padding: '12px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      fontSize: '13px',
      color: 'hsl(var(--foreground))',
      zIndex: 50,
      transform: toast.visible ? 'translateY(0)' : 'translateY(20px)',
      opacity: toast.visible ? 1 : 0,
      transition: 'transform 0.2s, opacity 0.2s',
      pointerEvents: toast.visible ? 'auto' : 'none',
    }}>
      {toast.type === 'success'
        ? <CheckCircle size={18} style={{ color: 'hsl(var(--success))', flexShrink: 0 }} />
        : <Info        size={18} style={{ color: 'hsl(var(--primary))', flexShrink: 0 }} />
      }
      {toast.message}
    </div>
  )
}
