"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { signOut, useSession } from "next-auth/react";
import { User, LogOut, ChevronDown, LayoutTemplate, Settings, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

export function UserMenu() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  if (status === "loading") {
    return (
      <div className="h-8 w-8 rounded-full animate-pulse shrink-0" style={{ background: "var(--border2)" }} />
    );
  }

  if (!session?.user) {
    return (
      <div className="flex items-center gap-1 shrink-0">
        <Link
          href="/guide"
          className="ui-btn-secondary text-[11px] px-2 py-1.5 hidden sm:inline-flex items-center gap-1"
          title="User guide"
        >
          <BookOpen size={12} />
          <span className="hidden md:inline">Guide</span>
        </Link>
        <Link href="/login" className="ui-btn-secondary text-[11px] px-2.5 py-1.5 hidden sm:inline-flex">
          Log in
        </Link>
        <Link
          href="/signup"
          className="text-[11px] font-bold px-2.5 py-1.5 rounded-lg hidden sm:inline-flex"
          style={{
            background: "var(--blue-dim)",
            color: "var(--blue)",
            border: "1px solid rgba(var(--primary-rgb, 59 130 246) / 0.25)",
          }}
        >
          Sign up
        </Link>
      </div>
    );
  }

  const label = session.user.name ?? session.user.email ?? "Account";

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 ui-btn-secondary py-1 pl-1 pr-2 max-w-[10rem]"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        {session.user.image ? (
          <Image
            src={session.user.image}
            alt=""
            width={28}
            height={28}
            className="w-7 h-7 rounded-full object-cover"
          />
        ) : (
          <span
            className="w-7 h-7 rounded-full flex items-center justify-center"
            style={{ background: "var(--blue-dim)", color: "var(--blue)" }}
          >
            <User size={14} />
          </span>
        )}
        <span className="text-[11px] font-semibold truncate hidden sm:inline">{label}</span>
        <ChevronDown size={12} className={cn("opacity-60 transition", open && "rotate-180")} />
      </button>
      {open && (
        <div
          className="absolute right-0 top-full mt-1 py-1 min-w-[200px] z-[200] rounded-xl border shadow-xl glass glass-strong"
          style={{ borderColor: "var(--border2)" }}
          role="menu"
        >
          <Link
            href="/account"
            className="flex items-center gap-2 px-3 py-2 text-[12px] hover:bg-white/5"
            style={{ color: "var(--text)" }}
            onClick={() => setOpen(false)}
          >
            <Settings size={14} /> Account
          </Link>
          <Link
            href="/templates"
            className="flex items-center gap-2 px-3 py-2 text-[12px] hover:bg-white/5"
            style={{ color: "var(--text)" }}
            onClick={() => setOpen(false)}
          >
            <LayoutTemplate size={14} /> Templates
          </Link>
          <Link
            href="/guide"
            className="flex items-center gap-2 px-3 py-2 text-[12px] hover:bg-white/5"
            style={{ color: "var(--text)" }}
            onClick={() => setOpen(false)}
          >
            <BookOpen size={14} /> User guide
          </Link>
          <button
            type="button"
            className="w-full flex items-center gap-2 px-3 py-2 text-[12px] hover:bg-white/5 text-left"
            style={{ color: "var(--red)" }}
            onClick={() => {
              setOpen(false);
              void signOut({ callbackUrl: "/" });
            }}
          >
            <LogOut size={14} /> Log out
          </button>
        </div>
      )}
    </div>
  );
}
