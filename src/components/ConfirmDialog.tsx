'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import { AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Variant = 'danger' | 'warning' | 'info';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: Variant;
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

interface DialogState extends ConfirmOptions {
  resolve: (value: boolean) => void;
}

/* ------------------------------------------------------------------ */
/*  Context                                                            */
/* ------------------------------------------------------------------ */

const ConfirmContext = createContext<ConfirmFn | null>(null);

/* ------------------------------------------------------------------ */
/*  Variant config                                                     */
/* ------------------------------------------------------------------ */

const variantConfig: Record<
  Variant,
  {
    icon: React.ElementType;
    iconBg: string;
    iconColor: string;
    btnBg: string;
    btnHover: string;
    btnText: string;
    ringColor: string;
  }
> = {
  danger: {
    icon: AlertTriangle,
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    btnBg: 'bg-red-600',
    btnHover: 'hover:bg-red-700',
    btnText: 'text-white',
    ringColor: 'ring-red-600/20',
  },
  warning: {
    icon: AlertCircle,
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    btnBg: 'bg-amber-500',
    btnHover: 'hover:bg-amber-600',
    btnText: 'text-white',
    ringColor: 'ring-amber-500/20',
  },
  info: {
    icon: Info,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    btnBg: 'bg-blue-600',
    btnHover: 'hover:bg-blue-700',
    btnText: 'text-white',
    ringColor: 'ring-blue-600/20',
  },
};

/* ------------------------------------------------------------------ */
/*  Provider                                                           */
/* ------------------------------------------------------------------ */

export function ConfirmDialogProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const cancelBtnRef = useRef<HTMLButtonElement>(null);

  /* ---- confirm() returned by the hook ---- */
  const confirm = useCallback<ConfirmFn>(
    (options) =>
      new Promise<boolean>((resolve) => {
        setDialog({ ...options, resolve });
      }),
    [],
  );

  /* ---- handlers ---- */
  const handleClose = useCallback(
    (value: boolean) => {
      dialog?.resolve(value);
      setDialog(null);
    },
    [dialog],
  );

  /* ---- Escape key ---- */
  useEffect(() => {
    if (!dialog) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose(false);
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dialog, handleClose]);

  /* ---- Focus cancel button on open ---- */
  useEffect(() => {
    if (dialog) cancelBtnRef.current?.focus();
  }, [dialog]);

  /* ---- Derive variant config ---- */
  const variant = dialog?.variant ?? 'danger';
  const cfg = variantConfig[variant];
  const Icon = cfg.icon;

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}

      {/* ---------- inline keyframes ---------- */}
      <style>{`
        @keyframes confirm-overlay-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes confirm-card-in {
          from { opacity: 0; transform: scale(0.95); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>

      {/* ---------- dialog ---------- */}
      {dialog && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm"
          style={{
            zIndex: 9998,
            animation: 'confirm-overlay-in 0.2s ease-out',
          }}
          onClick={() => handleClose(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-dialog-title"
          aria-describedby="confirm-dialog-message"
        >
          <div
            className="relative mx-4 w-full max-w-[420px] bg-white rounded-2xl shadow-2xl border border-slate-200"
            style={{ animation: 'confirm-card-in 0.2s ease-out' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* close button */}
            <button
              onClick={() => handleClose(false)}
              className="absolute right-3 top-3 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Close"
            >
              <X size={18} />
            </button>

            {/* body */}
            <div className="flex flex-col items-center px-6 pt-8 pb-6 text-center">
              {/* icon */}
              <div
                className={`flex items-center justify-center w-14 h-14 rounded-full ${cfg.iconBg} mb-5`}
              >
                <Icon className={cfg.iconColor} size={28} strokeWidth={2.2} />
              </div>

              {/* title */}
              <h2
                id="confirm-dialog-title"
                className="text-lg font-bold text-slate-900 mb-1"
              >
                {dialog.title}
              </h2>

              {/* message */}
              <p
                id="confirm-dialog-message"
                className="text-sm font-medium text-slate-500 leading-relaxed mb-6"
              >
                {dialog.message}
              </p>

              {/* actions */}
              <div className="flex w-full gap-3">
                <button
                  ref={cancelBtnRef}
                  onClick={() => handleClose(false)}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                >
                  {dialog.cancelText ?? 'Cancel'}
                </button>

                <button
                  onClick={() => handleClose(true)}
                  className={`flex-1 px-4 py-2.5 text-sm font-bold rounded-xl shadow-md ring-1 ${cfg.btnBg} ${cfg.btnHover} ${cfg.btnText} ${cfg.ringColor} transition-colors`}
                >
                  {dialog.confirmText ?? 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

/* ------------------------------------------------------------------ */
/*  Hook                                                               */
/* ------------------------------------------------------------------ */

export function useConfirm(): ConfirmFn {
  const confirm = useContext(ConfirmContext);
  if (!confirm) {
    throw new Error('useConfirm must be used within a <ConfirmDialogProvider>');
  }
  return confirm;
}
