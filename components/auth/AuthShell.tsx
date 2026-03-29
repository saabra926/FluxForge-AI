"use client";

import type { ReactNode } from "react";
import Link from "next/link";

export function AuthShell({
  children,
  title,
  subtitle,
}: {
  children: ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div
      data-app-scroll-root
      className="relative flex min-h-0 flex-1 flex-col items-center justify-center overflow-x-hidden overflow-y-auto p-4"
      style={{ background: "var(--bg)" }}
    >
      <div className="app-backdrop opacity-40 pointer-events-none absolute inset-0" aria-hidden />
      <div className="relative z-[1] w-full max-w-[440px]">
        <div className="text-center mb-8">
          <Link
            href="/"
            className="inline-flex items-center justify-center w-12 h-12 rounded-2xl font-heading font-black text-lg mb-4 glow-blue"
            style={{ background: "linear-gradient(135deg, var(--blue), var(--violet))", color: "white" }}
          >
            ⚡
          </Link>
          <h1 className="font-heading font-bold text-xl sm:text-2xl" style={{ color: "var(--text)" }}>
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm mt-2" style={{ color: "var(--text2)" }}>
              {subtitle}
            </p>
          )}
        </div>
        <div
          className="rounded-2xl p-6 sm:p-8 border glass glass-strong"
          style={{ borderColor: "var(--border2)", borderRadius: "var(--radius-ui)" }}
        >
          {children}
        </div>
        <p className="text-center text-[11px] mt-6" style={{ color: "var(--text3)" }}>
          <Link href="/" className="hover:underline" style={{ color: "var(--blue)" }}>
            ← Back to app
          </Link>
        </p>
      </div>
    </div>
  );
}
