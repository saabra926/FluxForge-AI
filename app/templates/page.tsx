"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Search, Sparkles } from "lucide-react";
import { UI_TEMPLATES, type UITemplateCategory } from "@/lib/templates";

const ALL = "All categories" as const;

export default function TemplatesPage() {
  const categories = useMemo(() => {
    const s = new Set<UITemplateCategory>();
    UI_TEMPLATES.forEach((t) => s.add(t.category));
    return [ALL, ...Array.from(s)];
  }, []);

  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>(ALL);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return UI_TEMPLATES.filter((t) => {
      if (cat !== ALL && t.category !== cat) return false;
      if (!qq) return true;
      return (
        t.name.toLowerCase().includes(qq) ||
        t.description.toLowerCase().includes(qq) ||
        t.tags.some((x) => x.toLowerCase().includes(qq))
      );
    });
  }, [q, cat]);

  return (
    <div
      data-app-scroll-root
      className="relative flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden overscroll-y-contain"
      style={{ background: "var(--bg)" }}
    >
      <div className="app-backdrop opacity-50 pointer-events-none fixed inset-0" aria-hidden />
      <header
        className="sticky top-0 z-30 glass glass-strong border-b px-4 py-4 md:px-10"
        style={{ borderColor: "var(--border2)" }}
      >
        <div className="max-w-7xl mx-auto flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-[12px] font-bold mb-2 hover:underline"
              style={{ color: "var(--blue)" }}
            >
              <ArrowLeft size={14} /> Back to generator
            </Link>
            <h1 className="font-heading font-bold text-2xl md:text-3xl flex items-center gap-2" style={{ color: "var(--text)" }}>
              <Sparkles size={22} style={{ color: "var(--violet)" }} />
              Template library
            </h1>
            <p className="text-sm mt-1 max-w-2xl" style={{ color: "var(--text2)" }}>
              {UI_TEMPLATES.length} curated UI directions with production-grade prompts, motion notes, and stack hints.
              Pick one to load the builder with a tuned brief.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-xl border min-w-[min(100%,16rem)]"
              style={{ borderColor: "var(--border2)", background: "var(--panel)" }}
            >
              <Search size={16} style={{ color: "var(--text3)" }} />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search templates…"
                className="bg-transparent text-sm flex-1 min-w-0 outline-none"
                style={{ color: "var(--text)" }}
              />
            </div>
            <select
              value={cat}
              onChange={(e) => setCat(e.target.value)}
              className="text-sm px-3 py-2 rounded-xl border cursor-pointer"
              style={{ borderColor: "var(--border2)", background: "var(--panel)", color: "var(--text)" }}
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 md:px-10 relative z-[1]">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5">
          <AnimatePresence mode="popLayout">
            {filtered.map((t, i) => (
              <motion.article
                key={t.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.22, delay: Math.min(i * 0.01, 0.3) }}
                className="group relative rounded-2xl border overflow-hidden flex flex-col min-h-[220px]"
                style={{
                  borderColor: "var(--border2)",
                  background: "var(--panel)",
                  transformStyle: "preserve-3d",
                }}
              >
                <div
                  className="h-28 relative shrink-0 transition-transform duration-300 group-hover:scale-[1.02]"
                  style={{ background: t.gradient }}
                >
                  <div
                    className="absolute inset-0 opacity-40 mix-blend-overlay"
                    style={{
                      background:
                        "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.35), transparent 50%), radial-gradient(circle at 80% 80%, rgba(0,0,0,0.25), transparent 45%)",
                    }}
                  />
                  <div className="absolute bottom-2 left-3 right-3 flex items-end justify-between gap-2">
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md"
                      style={{ background: "rgba(0,0,0,0.35)", color: "white" }}
                    >
                      {t.category}
                    </span>
                  </div>
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <h2 className="font-heading font-bold text-[15px] leading-snug line-clamp-2" style={{ color: "var(--text)" }}>
                    {t.name}
                  </h2>
                  <p className="text-[12px] mt-2 line-clamp-2 flex-1" style={{ color: "var(--text2)" }}>
                    {t.description}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-3">
                    {t.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] px-1.5 py-0.5 rounded-md font-medium"
                        style={{ background: "var(--blue-dim)", color: "var(--blue)" }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <Link
                    href={`/?template=${encodeURIComponent(t.id)}`}
                    className="mt-4 inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-[12px] font-bold transition-transform group-hover:translate-y-[-1px]"
                    style={{
                      background: "linear-gradient(135deg, var(--blue), var(--violet))",
                      color: "white",
                    }}
                  >
                    Use template
                  </Link>
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        </div>
        {filtered.length === 0 ? (
          <p className="text-center py-20 text-sm" style={{ color: "var(--text3)" }}>
            No templates match your filters.
          </p>
        ) : null}
      </main>
    </div>
  );
}
