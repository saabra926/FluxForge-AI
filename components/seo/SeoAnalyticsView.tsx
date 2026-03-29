"use client";

import { useState } from "react";
import {
  BarChart3,
  Globe,
  Loader2,
  Search,
  ShieldCheck,
  Sparkles,
  Zap,
  AlertTriangle,
  Info,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

type ApiResponse = {
  analyzedUrl: string;
  error?: string;
  lighthouseEnabled: boolean;
  lighthouseNote: string;
  analyticsNote: string;
  htmlSnapshot:
    | {
        ok: true;
        finalUrl: string;
        onPage: {
          title: string | null;
          titleLen: number;
          metaDescription: string | null;
          metaDescriptionLen: number;
          canonical: string | null;
          robots: string | null;
          ogTitle: string | null;
          ogDescription: string | null;
          ogImage: string | null;
          h1Count: number;
          htmlLang: string | null;
          charsetMeta: boolean;
          viewportMeta: boolean;
          hasJsonLd: boolean;
        };
        analytics: Array<{ id: string; name: string; detected: boolean; hint: string }>;
        onPageTips: Array<{ severity: string; title: string; detail: string }>;
      }
    | { ok: false; error: string };
  lighthouse: Array<{
    strategy: string;
    scores: {
      performance: number | null;
      accessibility: number | null;
      bestPractices: number | null;
      seo: number | null;
    } | null;
    metrics: Array<{ id: string; title: string; display: string | null; score: number | null }>;
    fieldMetrics: Array<{ id: string; percentile?: string; category?: string }>;
    auditTips: Array<{ id: string; title: string; description: string }>;
    fetchTime: string;
  }>;
};

function ScoreRing({ label, value }: { label: string; value: number | null }) {
  const v = value ?? null;
  const color =
    v == null ? "var(--text3)" : v >= 90 ? "var(--green)" : v >= 50 ? "var(--amber)" : "var(--red)";
  return (
    <div className="flex flex-col items-center gap-1 min-w-[72px]">
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center text-[13px] font-black font-syne border-2"
        style={{ borderColor: color, color, background: `${color}14` }}
      >
        {v == null ? "—" : v}
      </div>
      <span className="text-[9px] font-bold uppercase text-center" style={{ color: "var(--text3)" }}>
        {label}
      </span>
    </div>
  );
}

export function SeoAnalyticsView({ onToast }: { onToast: (m: string, t?: "success" | "error") => void }) {
  const [url, setUrl] = useState("");
  const [strategy, setStrategy] = useState<"mobile" | "desktop" | "both">("mobile");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ApiResponse | null>(null);

  const run = async () => {
    const u = url.trim();
    if (!u) {
      onToast("Enter a website URL.", "error");
      return;
    }
    setLoading(true);
    setData(null);
    try {
      const res = await fetch("/api/seo-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: u, strategy }),
      });
      const json = (await res.json()) as ApiResponse & { error?: string };
      if (!res.ok) {
        onToast(json.error || `Request failed (${res.status})`, "error");
        if ("analyzedUrl" in json && json.analyzedUrl) {
          setData(json as ApiResponse);
        } else {
          setData(null);
        }
        return;
      }
      setData(json);
      onToast("Analysis complete.");
    } catch {
      onToast("Network error.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto p-5" style={{ color: "var(--text)" }}>
      <div className="max-w-4xl mx-auto space-y-5">
        <header className="rounded-2xl p-4" style={{ background: "var(--bg2)", border: "1px solid var(--border2)" }}>
          <div className="flex items-start gap-3 flex-wrap">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.2), rgba(139,92,246,0.25))" }}
            >
              <Search size={22} style={{ color: "var(--blue)" }} />
            </div>
            <div className="flex-1 min-w-[200px]">
              <h2 className="font-syne font-bold text-[18px]">SEO &amp; site analytics</h2>
              <p className="text-[12px] mt-1 leading-relaxed" style={{ color: "var(--text2)" }}>
                Lighthouse scores come from{" "}
                <strong className="text-[var(--text)]">Google PageSpeed Insights</strong> (requires{" "}
                <code className="text-[11px]">GOOGLE_PAGESPEED_API_KEY</code>). On-page SEO and tag detection use
                your page&apos;s HTML. Traffic and conversions are <strong>not</strong> read from GA4 — only common
                snippets are detected in HTML.
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-col sm:flex-row gap-2">
            <div className="flex-1 flex items-center gap-2 rounded-xl px-3 py-2" style={{ background: "var(--bg3)", border: "1px solid var(--border2)" }}>
              <Globe size={16} style={{ color: "var(--text3)" }} />
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                className="flex-1 bg-transparent outline-none text-[13px] min-w-0"
                style={{ color: "var(--text)" }}
              />
            </div>
            <select
              value={strategy}
              onChange={(e) => setStrategy(e.target.value as typeof strategy)}
              className="rounded-xl px-3 py-2 text-[12px] outline-none"
              style={{ background: "var(--bg3)", border: "1px solid var(--border2)", color: "var(--text)" }}
            >
              <option value="mobile">Lighthouse: mobile</option>
              <option value="desktop">Lighthouse: desktop</option>
              <option value="both">Lighthouse: mobile + desktop</option>
            </select>
            <button
              type="button"
              onClick={() => void run()}
              disabled={loading}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-[12px] font-bold"
              style={{ background: "var(--blue)", color: "#fff" }}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
              Run analysis
            </button>
          </div>
        </header>

        {data && (
          <>
            {data.error && (
              <div
                className="rounded-xl p-3 flex gap-2 items-start text-[12px]"
                style={{ background: "rgba(248,113,113,0.12)", border: "1px solid rgba(248,113,113,0.35)" }}
              >
                <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" style={{ color: "var(--red)" }} />
                <div>
                  <div className="font-bold mb-1" style={{ color: "var(--text)" }}>
                    PageSpeed / server issue
                  </div>
                  <p style={{ color: "var(--text2)" }}>{data.error}</p>
                </div>
              </div>
            )}
            <div
              className="rounded-xl p-3 flex gap-2 items-start text-[11px]"
              style={{ background: "var(--blue-dim)", border: "1px solid rgba(59,130,246,0.25)" }}
            >
              <Info size={14} className="flex-shrink-0 mt-0.5" style={{ color: "var(--blue)" }} />
              <div style={{ color: "var(--text2)" }}>
                <p className="font-semibold mb-1" style={{ color: "var(--text)" }}>
                  {data.lighthouseNote}
                </p>
                <p>{data.analyticsNote}</p>
                {!data.lighthouseEnabled && (
                  <a
                    href="https://developers.google.com/speed/docs/insights/v5/get-started"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 mt-2 font-semibold"
                    style={{ color: "var(--blue)" }}
                  >
                    Get a PageSpeed API key <ExternalLink size={10} />
                  </a>
                )}
              </div>
            </div>

            <section className="rounded-2xl p-4 space-y-3" style={{ background: "var(--panel)", border: "1px solid var(--border2)" }}>
              <h3 className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: "var(--text3)" }}>
                <BarChart3 size={14} /> Lighthouse (real scores)
              </h3>
              {(data.lighthouse ?? []).length === 0 ? (
                <p className="text-[12px]" style={{ color: "var(--text2)" }}>
                  No Lighthouse data — add <code className="text-[11px]">GOOGLE_PAGESPEED_API_KEY</code> to your server
                  environment and restart.
                </p>
              ) : (
                <div className="space-y-4">
                  {(data.lighthouse ?? []).map((run) => (
                    <div key={run.strategy} className="rounded-xl p-3 space-y-3" style={{ background: "var(--bg2)", border: "1px solid var(--border2)" }}>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[12px] font-bold capitalize">{run.strategy}</span>
                        <span className="text-[10px]" style={{ color: "var(--text3)" }}>
                          PSI runtime ~{run.fetchTime}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-4 justify-center sm:justify-start">
                        <ScoreRing label="Perf" value={run.scores?.performance ?? null} />
                        <ScoreRing label="SEO" value={run.scores?.seo ?? null} />
                        <ScoreRing label="A11y" value={run.scores?.accessibility ?? null} />
                        <ScoreRing label="Best" value={run.scores?.bestPractices ?? null} />
                      </div>
                      {run.metrics.length > 0 && (
                        <div>
                          <p className="text-[10px] font-bold uppercase mb-2" style={{ color: "var(--text3)" }}>
                            Lab metrics (Lighthouse)
                          </p>
                          <ul className="space-y-1.5 text-[11px]" style={{ color: "var(--text2)" }}>
                            {run.metrics.map((m) => (
                              <li key={m.id} className="flex flex-wrap gap-2 justify-between">
                                <span>{m.title}</span>
                                <span className="font-mono" style={{ color: "var(--text)" }}>
                                  {m.display ?? "—"}
                                  {m.score != null ? ` · ${m.score}/100` : ""}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {run.fieldMetrics.length > 0 && (
                        <div>
                          <p className="text-[10px] font-bold uppercase mb-2" style={{ color: "var(--text3)" }}>
                            Field data (Chrome UX Report — when available)
                          </p>
                          <ul className="space-y-1 text-[11px] font-mono" style={{ color: "var(--text2)" }}>
                            {run.fieldMetrics.map((f) => (
                              <li key={f.id}>
                                {f.id}
                                {f.percentile != null ? ` · p75: ${f.percentile}` : ""}
                                {f.category ? ` · ${f.category}` : ""}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {run.auditTips.length > 0 && (
                        <div>
                          <p className="text-[10px] font-bold uppercase mb-2 flex items-center gap-1" style={{ color: "var(--text3)" }}>
                            <Sparkles size={12} /> Lighthouse fix list (subset)
                          </p>
                          <ul className="space-y-3 max-h-80 overflow-y-auto pr-1">
                            {run.auditTips.map((t) => (
                              <li key={t.id} className="text-[11px] rounded-lg p-2" style={{ background: "var(--code-bg)", border: "1px solid var(--border2)" }}>
                                <div className="font-semibold mb-1" style={{ color: "var(--text)" }}>
                                  {t.title}
                                </div>
                                <p className="leading-relaxed whitespace-pre-wrap" style={{ color: "var(--text2)" }}>
                                  {t.description}
                                </p>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-2xl p-4 space-y-3" style={{ background: "var(--panel)", border: "1px solid var(--border2)" }}>
              <h3 className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: "var(--text3)" }}>
                <Globe size={14} /> On-page snapshot
              </h3>
              {data.htmlSnapshot.ok ? (
                <>
                  <p className="text-[11px] font-mono break-all" style={{ color: "var(--text2)" }}>
                    Fetched: {data.htmlSnapshot.finalUrl}
                  </p>
                  <div className="grid sm:grid-cols-2 gap-3 text-[12px]">
                    <Kv k="Title" v={data.htmlSnapshot.onPage.title || "—"} />
                    <Kv k="Title length" v={`${data.htmlSnapshot.onPage.titleLen} chars`} />
                    <Kv k="Meta description" v={data.htmlSnapshot.onPage.metaDescription || "—"} />
                    <Kv k="Description length" v={`${data.htmlSnapshot.onPage.metaDescriptionLen} chars`} />
                    <Kv k="Canonical" v={data.htmlSnapshot.onPage.canonical || "—"} />
                    <Kv k="robots" v={data.htmlSnapshot.onPage.robots || "—"} />
                    <Kv k="H1 count" v={String(data.htmlSnapshot.onPage.h1Count)} />
                    <Kv k="html lang" v={data.htmlSnapshot.onPage.htmlLang || "—"} />
                    <Kv k="Viewport meta" v={data.htmlSnapshot.onPage.viewportMeta ? "Yes" : "No"} />
                    <Kv k="JSON-LD" v={data.htmlSnapshot.onPage.hasJsonLd ? "Yes" : "No"} />
                    <Kv k="og:title" v={data.htmlSnapshot.onPage.ogTitle || "—"} />
                    <Kv k="og:image" v={data.htmlSnapshot.onPage.ogImage || "—"} />
                  </div>
                </>
              ) : (
                <div className="flex gap-2 text-[12px]" style={{ color: "var(--amber)" }}>
                  <AlertTriangle size={16} className="flex-shrink-0" />
                  <span>HTML snapshot unavailable: {data.htmlSnapshot.error}</span>
                </div>
              )}
            </section>

            {data.htmlSnapshot.ok && (
              <>
                <section className="rounded-2xl p-4 space-y-3" style={{ background: "var(--panel)", border: "1px solid var(--border2)" }}>
                  <h3 className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: "var(--text3)" }}>
                    <ShieldCheck size={14} /> Analytics &amp; tags (HTML detection)
                  </h3>
                  <ul className="space-y-2">
                    {data.htmlSnapshot.analytics.map((a) => (
                      <li
                        key={a.id}
                        className="flex flex-wrap gap-2 items-start justify-between rounded-xl p-2 text-[11px]"
                        style={{
                          background: a.detected ? "var(--green-dim)" : "var(--bg2)",
                          border: `1px solid ${a.detected ? "rgba(16,185,129,0.2)" : "var(--border2)"}`,
                        }}
                      >
                        <div>
                          <div className="font-semibold" style={{ color: "var(--text)" }}>
                            {a.name}
                          </div>
                          <div style={{ color: "var(--text2)" }}>{a.hint}</div>
                        </div>
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                          style={{
                            background: a.detected ? "var(--green)" : "var(--border2)",
                            color: a.detected ? "#fff" : "var(--text3)",
                          }}
                        >
                          {a.detected ? "Detected" : "Not in HTML"}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>

                <section className="rounded-2xl p-4 space-y-3" style={{ background: "var(--panel)", border: "1px solid var(--border2)" }}>
                  <h3 className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--text3)" }}>
                    Prioritized tips (on-page + analytics context)
                  </h3>
                  <ul className="space-y-2">
                    {data.htmlSnapshot.onPageTips.map((tip, i) => (
                      <li
                        key={`${tip.title}-${i}`}
                        className={cn("rounded-xl p-3 text-[12px] border-l-4")}
                        style={{
                          background: "var(--bg2)",
                          borderColor: "var(--border2)",
                          borderLeftColor:
                            tip.severity === "high" ? "var(--red)" : tip.severity === "medium" ? "var(--amber)" : "var(--blue)",
                        }}
                      >
                        <div className="font-bold mb-1">{tip.title}</div>
                        <p className="leading-relaxed" style={{ color: "var(--text2)" }}>
                          {tip.detail}
                        </p>
                      </li>
                    ))}
                  </ul>
                </section>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Kv({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-lg p-2" style={{ background: "var(--bg2)", border: "1px solid var(--border2)" }}>
      <div className="text-[10px] font-bold uppercase mb-0.5" style={{ color: "var(--text3)" }}>
        {k}
      </div>
      <div className="break-words leading-snug" style={{ color: "var(--text)" }}>
        {v}
      </div>
    </div>
  );
}
