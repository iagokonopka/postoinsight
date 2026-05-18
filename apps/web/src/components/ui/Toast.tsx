/**
 * Toast — sistema de notificações leve baseado em Context
 *
 * Provider: <ToastProvider> envolve a app (em main.tsx ou AppLayout)
 * Hook:     useToast() → { show(message, variant?) }
 * Viewport: <ToastViewport /> dentro do Provider, posicionada bottom-right
 *
 * Variantes:
 *  - default | success | warning | danger | info
 *
 * Auto-dismiss em 4s. Fechar manual com botão x.
 * Não depende de bibliotecas externas — só React + Tailwind.
 */
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type ToastVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';

interface Toast {
  id: number;
  message: string;
  description?: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  show: (message: string, opts?: { variant?: ToastVariant; description?: string }) => void;
  success: (message: string, description?: string) => void;
  error: (message: string, description?: string) => void;
  warning: (message: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let nextId = 1;
const AUTO_DISMISS_MS = 4_000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback<ToastContextValue['show']>((message, opts) => {
    const id = nextId++;
    setToasts((prev) => [
      ...prev,
      { id, message, description: opts?.description, variant: opts?.variant ?? 'default' },
    ]);
  }, []);

  const success = useCallback((m: string, d?: string) => show(m, { variant: 'success', description: d }), [show]);
  const error   = useCallback((m: string, d?: string) => show(m, { variant: 'danger',  description: d }), [show]);
  const warning = useCallback((m: string, d?: string) => show(m, { variant: 'warning', description: d }), [show]);

  return (
    <ToastContext.Provider value={{ show, success, error, warning }}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast deve ser usado dentro de <ToastProvider>');
  return ctx;
}

/* ─── Viewport ─────────────────────────────────────────────── */

function ToastViewport({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  return (
    <div
      className="pointer-events-none fixed bottom-4 right-4 z-[60] flex flex-col gap-2"
      aria-live="polite"
      aria-atomic="true"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

/* ─── Item ─────────────────────────────────────────────────── */

const VARIANT_STYLES: Record<ToastVariant, { icon: ReactNode; cls: string }> = {
  default: { icon: <Info size={16} />,                               cls: 'border-border text-foreground' },
  success: { icon: <CheckCircle2 size={16} className="text-[hsl(var(--success))]" />, cls: 'border-[hsl(var(--success)/0.4)]' },
  warning: { icon: <AlertTriangle size={16} className="text-[hsl(var(--warning))]" />, cls: 'border-[hsl(var(--warning)/0.4)]' },
  danger:  { icon: <XCircle size={16} className="text-[hsl(var(--danger))]" />,        cls: 'border-[hsl(var(--danger)/0.4)]' },
  info:    { icon: <Info size={16} className="text-[hsl(var(--primary))]" />,          cls: 'border-[hsl(var(--primary)/0.4)]' },
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: number) => void }) {
  useEffect(() => {
    const timer = window.setTimeout(() => onDismiss(toast.id), AUTO_DISMISS_MS);
    return () => window.clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const { icon, cls } = VARIANT_STYLES[toast.variant];

  return (
    <div
      className={cn(
        'pointer-events-auto flex w-80 max-w-[92vw] items-start gap-2 rounded-lg border bg-card p-3',
        'shadow-[var(--shadow-md)] animate-in fade-in slide-in-from-bottom-2 duration-200',
        cls,
      )}
    >
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium text-foreground">{toast.message}</p>
        {toast.description && (
          <p className="mt-0.5 text-[12px] text-muted-foreground">{toast.description}</p>
        )}
      </div>
      <button
        type="button"
        aria-label="Fechar"
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 rounded p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <X size={14} />
      </button>
    </div>
  );
}
