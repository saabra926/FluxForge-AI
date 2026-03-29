"use client";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";
import type { ToastItem } from "@/hooks/useToast";

const icons = { success: <CheckCircle2 size={15} />, error: <XCircle size={15} />, info: <Info size={15} /> };
const colors = {
  success: { border: "rgba(16,185,129,0.4)", color: "var(--green)", bg: "rgba(16,185,129,0.06)" },
  error:   { border: "rgba(239,68,68,0.4)",  color: "var(--red)",   bg: "rgba(239,68,68,0.06)"  },
  info:    { border: "rgba(59,130,246,0.4)",  color: "var(--blue)",  bg: "rgba(59,130,246,0.06)"  },
};

export function ToastContainer({ toasts, onRemove }: { toasts: ToastItem[]; onRemove: (id: string) => void }) {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => {
          const c = colors[t.type];
          return (
            <motion.div key={t.id} initial={{ opacity: 0, x: 40, scale: 0.9 }} animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40 }} className="pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-xl text-[13px] font-medium shadow-2xl"
              style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.color, backdropFilter: "blur(12px)" }}>
              {icons[t.type]}
              <span className="flex-1">{t.message}</span>
              <button onClick={() => onRemove(t.id)} className="opacity-50 hover:opacity-100 transition-opacity ml-1">
                <X size={12} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
