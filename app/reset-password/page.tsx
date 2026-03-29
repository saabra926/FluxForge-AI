"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";
import { useToast } from "@/hooks/useToast";

function ResetForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { showToast } = useToast();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      showToast("Missing reset token.", "error");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        showToast(data.error || "Reset failed", "error");
        return;
      }
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <p className="text-[13px]" style={{ color: "var(--text2)" }}>
        Invalid link. Request a new reset from{" "}
        <Link href="/forgot-password" style={{ color: "var(--blue)" }} className="font-bold">
          forgot password
        </Link>
        .
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="text-[11px] font-bold block mb-1" style={{ color: "var(--text2)" }}>
          New password (min 8 characters)
        </label>
        <input
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
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
        Update password
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthShell title="Choose a new password" subtitle="After updating, sign in with your new password.">
      <Suspense fallback={<p style={{ color: "var(--text2)" }}>Loading…</p>}>
        <ResetForm />
      </Suspense>
      <p className="mt-6 text-[12px]" style={{ color: "var(--text2)" }}>
        <Link href="/login" className="font-bold hover:underline" style={{ color: "var(--blue)" }}>
          Back to login
        </Link>
      </p>
    </AuthShell>
  );
}
