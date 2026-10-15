"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastTone = "success" | "error" | "info" | "warning";

interface Toast {
  id: number;
  tone: ToastTone;
  title: string;
  description?: string;
}

interface ToastContextValue {
  toast: (input: { tone?: ToastTone; title: string; description?: string }) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used inside <ToastProvider>");
  }
  return context;
}

const TONE_STYLES: Record<ToastTone, { ring: string; icon: React.ReactNode }> = {
  success: { ring: "border-l-brand-600", icon: <CheckCircle2 className="size-5 text-brand-600" /> },
  error: { ring: "border-l-rose-brand", icon: <XCircle className="size-5 text-rose-brand" /> },
  info: { ring: "border-l-ocean-600", icon: <Info className="size-5 text-ocean-600" /> },
  warning: { ring: "border-l-amber-500", icon: <AlertTriangle className="size-5 text-amber-500" /> },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const [mounted, setMounted] = React.useState(false);
  const counter = React.useRef(0);

  React.useEffect(() => setMounted(true), []);

  const dismiss = React.useCallback((id: number) => {
    setToasts((current) => current.filter((entry) => entry.id !== id));
  }, []);

  const toast = React.useCallback<ToastContextValue["toast"]>(
    ({ tone = "info", title, description }) => {
      counter.current += 1;
      const id = counter.current;
      setToasts((current) => [...current.slice(-3), { id, tone, title, description }]);
      window.setTimeout(() => dismiss(id), 4200);
    },
    [dismiss],
  );

  const value = React.useMemo<ToastContextValue>(
    () => ({
      toast,
      success: (title, description) => toast({ tone: "success", title, description }),
      error: (title, description) => toast({ tone: "error", title, description }),
      info: (title, description) => toast({ tone: "info", title, description }),
    }),
    [toast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {mounted &&
        createPortal(
          <div
            className="pointer-events-none fixed inset-x-3 bottom-3 z-[100] flex flex-col gap-2.5 sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-[22rem]"
            role="region"
            aria-label="Notifications"
          >
            {toasts.map((entry) => (
              <div
                key={entry.id}
                role="status"
                className={cn(
                  "pointer-events-auto flex animate-[fade-up_0.25s_ease-out] items-start gap-3 rounded-xl border border-ink-200 border-l-4 bg-white p-3.5 shadow-lift",
                  TONE_STYLES[entry.tone].ring,
                )}
              >
                <span className="mt-0.5 shrink-0">{TONE_STYLES[entry.tone].icon}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-[0.85rem] font-semibold text-ink-900">{entry.title}</p>
                  {entry.description && (
                    <p className="mt-0.5 text-[0.78rem] leading-snug text-ink-500">{entry.description}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => dismiss(entry.id)}
                  aria-label="Dismiss notification"
                  className="-mr-1 -mt-1 grid size-7 shrink-0 place-items-center rounded-md text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-700"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ))}
          </div>,
          document.body,
        )}
    </ToastContext.Provider>
  );
}
