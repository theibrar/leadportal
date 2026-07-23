'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Info,
  AlertTriangle,
  X,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastMethods {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  warning: (message: string) => void;
}

interface ToastContextValue {
  toast: ToastMethods;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const ToastContext = createContext<ToastContextValue | null>(null);

// ---------------------------------------------------------------------------
// Constants & helpers
// ---------------------------------------------------------------------------

const AUTO_DISMISS_MS = 4000;

let toastCounter = 0;
const nextId = () => `toast-${++toastCounter}-${Date.now()}`;

const CONFIG: Record<
  ToastType,
  {
    icon: React.ElementType;
    accent: string; // Tailwind ring / border colour
    iconColor: string; // Tailwind text colour for the icon
    progressColor: string; // Tailwind bg colour for the progress bar
  }
> = {
  success: {
    icon: CheckCircle2,
    accent: 'ring-emerald-500/30',
    iconColor: 'text-emerald-400',
    progressColor: 'bg-emerald-400',
  },
  error: {
    icon: AlertCircle,
    accent: 'ring-red-500/30',
    iconColor: 'text-red-400',
    progressColor: 'bg-red-400',
  },
  info: {
    icon: Info,
    accent: 'ring-blue-500/30',
    iconColor: 'text-blue-400',
    progressColor: 'bg-blue-400',
  },
  warning: {
    icon: AlertTriangle,
    accent: 'ring-amber-500/30',
    iconColor: 'text-amber-400',
    progressColor: 'bg-amber-400',
  },
};

// ---------------------------------------------------------------------------
// Single toast component
// ---------------------------------------------------------------------------

interface ToastCardProps {
  item: ToastItem;
  onDismiss: (id: string) => void;
}

const ToastCard: React.FC<ToastCardProps> = ({ item, onDismiss }) => {
  const { icon: Icon, accent, iconColor, progressColor } = CONFIG[item.type];
  const [exiting, setExiting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    setExiting(true);
    // Wait for the exit animation before removing from state
    setTimeout(() => onDismiss(item.id), 280);
  }, [item.id, onDismiss]);

  useEffect(() => {
    timerRef.current = setTimeout(dismiss, AUTO_DISMISS_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [dismiss]);

  return (
    <div
      className={`
        pointer-events-auto relative flex w-full max-w-[400px] items-start gap-3
        overflow-hidden rounded-xl
        bg-slate-900/80 px-4 py-3
        text-white shadow-2xl shadow-black/30
        ring-1 ${accent}
        backdrop-blur-xl
      `}
      style={{
        animation: exiting
          ? 'toast-slide-out 0.28s ease-in forwards'
          : 'toast-slide-in 0.32s cubic-bezier(0.16,1,0.3,1) forwards',
      }}
    >
      {/* Icon */}
      <span className={`mt-0.5 shrink-0 ${iconColor}`}>
        <Icon size={20} strokeWidth={2.2} />
      </span>

      {/* Message */}
      <p className="flex-1 text-sm font-medium leading-snug">{item.message}</p>

      {/* Close button */}
      <button
        type="button"
        onClick={dismiss}
        className="mt-0.5 shrink-0 rounded-md p-0.5 text-slate-400 transition-colors hover:bg-slate-700 hover:text-white"
        aria-label="Dismiss"
      >
        <X size={16} />
      </button>

      {/* Progress bar */}
      <span
        className={`absolute bottom-0 left-0 h-[3px] ${progressColor} rounded-b-xl`}
        style={{
          animation: `toast-progress ${AUTO_DISMISS_MS}ms linear forwards`,
        }}
      />
    </div>
  );
};

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((type: ToastType, message: string) => {
    setToasts((prev) => [...prev, { id: nextId(), type, message }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast: ToastMethods = React.useMemo(
    () => ({
      success: (msg: string) => addToast('success', msg),
      error: (msg: string) => addToast('error', msg),
      info: (msg: string) => addToast('info', msg),
      warning: (msg: string) => addToast('warning', msg),
    }),
    [addToast],
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      {/* Keyframe styles injected once */}
      <style>{`
        @keyframes toast-slide-in {
          0% {
            opacity: 0;
            transform: translateX(100%);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes toast-slide-out {
          0% {
            opacity: 1;
            transform: translateX(0);
          }
          100% {
            opacity: 0;
            transform: translateX(100%);
          }
        }

        @keyframes toast-progress {
          0% {
            width: 100%;
          }
          100% {
            width: 0%;
          }
        }
      `}</style>

      {/* Toast container – top-right, stacked vertically */}
      <div
        aria-live="polite"
        className="pointer-events-none fixed right-4 top-4 z-[9999] flex flex-col items-end gap-3"
      >
        {toasts.map((t) => (
          <ToastCard key={t.id} item={t} onDismiss={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useToast(): ToastMethods {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a <ToastProvider>');
  }
  return ctx.toast;
}
