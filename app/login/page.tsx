"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";
import { useToast } from "@/hooks/useToast";

function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";
  const err = searchParams.get("error");
  const { showToast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauth, setOauth] = useState({ google: false, github: false });

  useEffect(() => {
    void fetch("/api/auth/oauth-flags")
      .then((r) => r.json() as Promise<{ google?: boolean; github?: boolean }>)
      .then((j) => setOauth({ google: !!j.google, github: !!j.github }))
      .catch(() => {});
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl,
      });
      if (res?.error) {
        showToast("Invalid email or password.", "error");
      } else if (res?.url) {
        window.location.href = res.url;
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to sync account settings and notifications.">
      {err ? (
        <p className="text-[12px] mb-4 p-2 rounded-lg" style={{ background: "rgba(244,63,94,0.12)", color: "var(--red)" }}>
          Sign-in failed. Check your credentials or OAuth configuration.
        </p>
      ) : null}
      <div className="flex flex-col gap-2 mb-6">
        <button
          type="button"
          className="ui-btn-secondary w-full justify-center gap-2"
          style={{ opacity: oauth.google ? 1 : 0.75 }}
          onClick={() => {
            if (!oauth.google) {
              showToast(
                "Google sign-in is not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env.local and restart the server.",
                "info"
              );
              return;
            }
            void signIn("google", { callbackUrl });
          }}
        >
          Continue with Google
        </button>
        <button
          type="button"
          className="ui-btn-secondary w-full justify-center gap-2"
          style={{ opacity: oauth.github ? 1 : 0.75 }}
          onClick={() => {
            if (!oauth.github) {
              showToast(
                "GitHub sign-in is not configured. Add GITHUB_ID and GITHUB_SECRET to .env.local and restart the server.",
                "info"
              );
              return;
            }
            void signIn("github", { callbackUrl });
          }}
        >
          Continue with GitHub
        </button>
      </div>
      <div className="flex items-center gap-2 mb-6">
        <div className="flex-1 h-px" style={{ background: "var(--border2)" }} />
        <span className="text-[10px] uppercase font-bold" style={{ color: "var(--text3)" }}>
          or email
        </span>
        <div className="flex-1 h-px" style={{ background: "var(--border2)" }} />
      </div>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="text-[11px] font-bold block mb-1" style={{ color: "var(--text2)" }}>
            Email
          </label>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg px-3 py-2 text-sm border bg-transparent"
            style={{ borderColor: "var(--border2)", color: "var(--text)" }}
          />
        </div>
        <div>
          <label className="text-[11px] font-bold block mb-1" style={{ color: "var(--text2)" }}>
            Password
          </label>
          <input
            type="password"
            required
            autoComplete="current-password"
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
          Sign in
        </button>
      </form>
      <div className="mt-6 flex flex-col gap-2 text-[12px]" style={{ color: "var(--text2)" }}>
        <Link href="/forgot-password" className="hover:underline" style={{ color: "var(--blue)" }}>
          Forgot password?
        </Link>
        <span>
          No account?{" "}
          <Link href="/signup" className="font-bold hover:underline" style={{ color: "var(--blue)" }}>
            Create one
          </Link>
        </span>
      </div>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-0 flex-1" style={{ background: "var(--bg)" }} />}>
      <LoginForm />
    </Suspense>
  );
}
