import { createContext, useCallback, useContext, useMemo, useState } from "react";

type ToastItem = {
  id: string;
  title: string;
  description?: string;
  variant?: "success" | "error" | "info";
};

type ToastContextValue = {
  push: (toast: Omit<ToastItem, "id">) => void;
  remove: (id: string) => void;
  toasts: ToastItem[];
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback(
    (toast: Omit<ToastItem, "id">) => {
      const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      setToasts((prev) => [...prev, { ...toast, id }]);
      setTimeout(() => remove(id), 4000);
    },
    [remove]
  );

  const value = useMemo(() => ({ toasts, push, remove }), [toasts, push, remove]);

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}

export function ToastViewport() {
  const { toasts, remove } = useToast();
  return (
    <div className="pointer-events-none fixed bottom-20 right-4 z-50 flex w-[90vw] max-w-sm flex-col gap-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={
            "pointer-events-auto rounded-lg border border-slate-800/60 bg-slate-950 p-4 text-sm shadow-glow light:border-slate-200 light:bg-white " +
            (toast.variant === "success"
              ? "text-emerald-200"
              : toast.variant === "error"
                ? "text-rose-200"
                : "text-slate-200")
          }
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold">{toast.title}</p>
              {toast.description && (
                <p className="mt-1 text-xs text-slate-400 light:text-slate-600">
                  {toast.description}
                </p>
              )}
            </div>
            <button
              className="text-xs text-slate-500"
              onClick={() => remove(toast.id)}
            >
              Close
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
