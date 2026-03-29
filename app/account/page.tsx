"use client";

import { useSession, signIn } from "next-auth/react";
import Link from "next/link";
import { Github, Loader2 } from "lucide-react";
import { useCallback, useState } from "react";
import { PushNotifications } from "@/components/push/PushNotifications";
import { useToast } from "@/hooks/useToast";

export default function AccountPage() {
  const { data: session, status, update } = useSession();
  const { showToast } = useToast();
  const [unlinking, setUnlinking] = useState(false);

  const unlinkGithub = useCallback(async () => {
    if (!confirm("Unlink GitHub from this profile? You can connect a different account afterward.")) return;
    setUnlinking(true);
    try {
      const res = await fetch("/api/account/github/unlink", { method: "POST" });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        showToast(data.error || "Could not unlink", "error");
        return;
      }
      await update();
      showToast("GitHub unlinked.");
    } finally {
      setUnlinking(false);
    }
  }, [showToast, update]);

  if (status === "loading") {
    return (
      <div data-app-scroll-root className="flex min-h-0 flex-1 items-center justify-center" style={{ background: "var(--bg)" }}>
        <Loader2 className="animate-spin" style={{ color: "var(--blue)" }} />
      </div>
    );
  }

  const ghLinked = session?.user?.githubLinked;
  const ghLogin = session?.user?.githubLogin;

  return (
    <>
      <div
        data-app-scroll-root
        className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden p-4 md:p-10"
        style={{ background: "var(--bg)" }}
      >
        <div className="max-w-2xl mx-auto space-y-8">
          <div>
            <Link href="/" className="text-[12px] font-bold hover:underline" style={{ color: "var(--blue)" }}>
              ← Back to app
            </Link>
            <h1 className="font-heading font-bold text-2xl mt-4" style={{ color: "var(--text)" }}>
              Account
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--text2)" }}>
              Session lasts up to 30 days while active. GitHub can be linked for profile sync and API access.
            </p>
          </div>

          <section
            className="rounded-2xl p-6 border glass glass-strong"
            style={{ borderColor: "var(--border2)", borderRadius: "var(--radius-ui)" }}
          >
            <h2 className="font-heading font-bold text-sm mb-3" style={{ color: "var(--text)" }}>
              Profile
            </h2>
            <p className="text-[13px]" style={{ color: "var(--text2)" }}>
              {session?.user?.email}
            </p>
            {session?.user?.name && (
              <p className="text-[13px] mt-1" style={{ color: "var(--text2)" }}>
                {session.user.name}
              </p>
            )}
          </section>

          <section
            className="rounded-2xl p-6 border glass glass-strong"
            style={{ borderColor: "var(--border2)", borderRadius: "var(--radius-ui)" }}
          >
            <h2 className="font-heading font-bold text-sm mb-3" style={{ color: "var(--text)" }}>
              GitHub
            </h2>
            <p className="text-[12px] mb-4 leading-relaxed" style={{ color: "var(--text3)" }}>
              Signing in with GitHub links your handle automatically. Unlink here to connect a different GitHub account
              (then use &quot;Connect GitHub&quot; again).
            </p>
            {ghLinked && ghLogin ? (
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] font-semibold"
                  style={{ background: "var(--blue-dim)", color: "var(--blue)" }}
                >
                  <Github size={14} /> Linked as @{ghLogin}
                </span>
                <button
                  type="button"
                  onClick={() => void unlinkGithub()}
                  disabled={unlinking}
                  className="ui-btn-secondary text-[12px] gap-2"
                >
                  {unlinking ? <Loader2 size={14} className="animate-spin" /> : null}
                  Unlink GitHub
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="ui-btn-secondary gap-2 text-[12px]"
                onClick={() => void signIn("github", { callbackUrl: "/account" })}
              >
                <Github size={14} />
                Connect GitHub
              </button>
            )}
          </section>

          <section
            className="rounded-2xl p-6 border glass glass-strong"
            style={{ borderColor: "var(--border2)", borderRadius: "var(--radius-ui)" }}
          >
            <h2 className="font-heading font-bold text-sm mb-3" style={{ color: "var(--text)" }}>
              Push notifications
            </h2>
            <PushNotifications onToast={showToast} />
          </section>
        </div>
      </div>
    </>
  );
}
