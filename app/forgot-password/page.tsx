"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";
import { useToast } from "@/hooks/useToast";

export default function ForgotPasswordPage() {
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        showToast(j.error || "Request failed", "error");
        return;
      }
      setDone(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Reset password"
      subtitle="We will email you a link if an account exists for that address."
    >
      {done ? (
        <p className="text-[13px] leading-relaxed" style={{ color: "var(--text2)" }}>
          If an account exists, check your inbox for a reset link. In development, the link may be printed to the server
          console when SMTP is not configured.
        </p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-[11px] font-bold block mb-1" style={{ color: "var(--text2)" }}>
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-sm border bg-transparent"
              style={{ borderColor: "var(--border2)", color: "var(--text)" }}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full ui-btn-primary py-2.5 flex items-center justify-center gap-2 font-bold"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : null}
            Send reset link
          </button>
        </form>
      )}
      <p className="mt-6 text-[12px]" style={{ color: "var(--text2)" }}>
        <Link href="/login" className="font-bold hover:underline" style={{ color: "var(--blue)" }}>
          Back to login
        </Link>
      </p>
    </AuthShell>
  );
}
