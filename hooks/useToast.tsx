"use client";
import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { ToastContainer } from "@/components/ui/Toast";

export type ToastKind = "success" | "error" | "info";

export interface ToastItem {
  id: string;
  message: string;
  type: ToastKind;
}

type ToastContextValue = {
  showToast: (message: string, type?: ToastKind) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const showToast = useCallback((message: string, type: ToastKind = "success") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((p) => [...p, { id, message, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3200);
  }, []);
  const removeToast = useCallback((id: string) => setToasts((p) => p.filter((t) => t.id !== id)), []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}
