"use client";
import type { ReactNode } from "react";
import { useState } from "react";
import { Server, Zap } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { useBackendGenerate } from "@/hooks/useGenerate";
import { syntaxHighlight } from "@/lib/utils";
import type { BackendFramework, DatabaseType, Language } from "@/types";

export function BackendPanel({ onToast }: { onToast: (m: string, t?: "success" | "error") => void }) {
  const store = useAppStore();
  const { generate } = useBackendGenerate();
  const [endpoints, setEndpoints] = useState("GET /api/users\nPOST /api/users\nPUT /api/users/:id\nDELETE /api/users/:id");

  const cfg = store.backendConfig;
  const handleGenerate = async () => {
    store.setBackendConfig({ endpoints: endpoints.split("\n").filter(Boolean) });
    const r = await generate();
    if (r?.error) onToast(r.error, "error");
    else onToast("Backend generated!");
  };

  return (
    <div className="h-full flex overflow-hidden">
      {/* Config panel */}
      <div className="w-[340px] min-w-[340px] flex flex-col overflow-hidden" style={{ borderRight: "1px solid var(--border2)" }}>
        <div className="flex items-center gap-2 px-4 py-3 flex-shrink-0" style={{ borderBottom: "1px solid var(--border2)", background: "var(--panel)" }}>
          <Server size={14} style={{ color: "var(--violet)" }} />
          <span className="font-syne font-bold text-[13px] gradient-text">Backend Generator</span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Description */}
          <div>
            <Label>API Description</Label>
            <textarea value={cfg.description ?? ""} onChange={(e) => store.setBackendConfig({ description: e.target.value })}
              rows={4} placeholder="e.g. A REST API for a task management app with users, projects, tasks, and comments. Include JWT auth and role-based access control."
              className="w-full rounded-xl px-3 py-2.5 text-[13px] resize-none outline-none transition-all"
              style={{ background: "var(--bg3)", border: "1px solid var(--border2)", color: "var(--text)", lineHeight: 1.6, fontFamily: "inherit" }}
              onFocus={(e) => (e.target.style.borderColor = "var(--violet)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border2)")} />
          </div>

          <BRow label="Framework">
            <RadioRow options={["Express.js", "Fastify", "NestJS", "Hono"] as BackendFramework[]}
              value={cfg.backendFramework ?? "Express.js"} color="violet"
              onChange={(v) => store.setBackendConfig({ backendFramework: v })} />
          </BRow>

          <BRow label="Database">
            <RadioRow options={["MongoDB", "PostgreSQL", "MySQL", "SQLite", "None"] as DatabaseType[]}
              value={cfg.database ?? "MongoDB"} color="violet"
              onChange={(v) => store.setBackendConfig({ database: v })} />
          </BRow>

          <BRow label="Language">
            <RadioRow options={["TypeScript", "JavaScript"] as Language[]}
              value={cfg.language ?? "TypeScript"} color="violet"
              onChange={(v) => store.setBackendConfig({ language: v })} />
          </BRow>

          <div className="flex gap-3">
            <Toggle label="JWT Auth" value={!!cfg.includeAuth} onChange={(v) => store.setBackendConfig({ includeAuth: v })} />
            <Toggle label="Unit Tests" value={!!cfg.includeTests} onChange={(v) => store.setBackendConfig({ includeTests: v })} />
          </div>

          {/* Endpoints */}
          <div>
            <Label>Endpoints (one per line)</Label>
            <textarea value={endpoints} onChange={(e) => setEndpoints(e.target.value)} rows={6}
              placeholder={"GET /api/users\nPOST /api/users\nPUT /api/users/:id\nDELETE /api/users/:id"}
              className="w-full rounded-xl px-3 py-2.5 text-[12px] font-mono resize-none outline-none transition-all"
              style={{ background: "var(--bg3)", border: "1px solid var(--border2)", color: "var(--text)", lineHeight: 1.7 }}
              onFocus={(e) => (e.target.style.borderColor = "var(--violet)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border2)")} />
          </div>

          {/* What's included */}
          <div className="rounded-xl p-3.5" style={{ background: "var(--violet-dim)", border: "1px solid rgba(139,92,246,0.2)" }}>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "var(--violet)" }}>Always Included</p>
            {["Error handling middleware", "Input validation", "Security headers (helmet)", "Rate limiting", "CORS config", "Health check endpoint", "Environment variables", ".env.example & README"].map((f) => (
              <div key={f} className="flex items-center gap-1.5 text-[11px] mb-1" style={{ color: "var(--text2)" }}>
                <span style={{ color: "var(--green)" }}>✓</span> {f}
              </div>
            ))}
          </div>
        </div>

        <div className="p-3" style={{ borderTop: "1px solid var(--border)" }}>
          <button onClick={handleGenerate} disabled={store.isGenerating || !cfg.description?.trim()}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-[14px] text-white font-syne transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:-translate-y-0.5"
            style={{ background: "linear-gradient(135deg,var(--violet),var(--blue))", boxShadow: "0 4px 28px rgba(139,92,246,0.3)" }}>
            {store.isGenerating ? (
              <><svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>Generating...</>
            ) : (
              <><Server size={15} />Generate Backend</>
            )}
          </button>
        </div>
      </div>

      {/* Output panel */}
      <div className="flex-1 flex flex-col overflow-hidden" style={{ background: "var(--code-bg)" }}>
        {!store.backendCode ? (
          <div className="flex-1 flex items-center justify-center p-10 text-center">
            <div>
              <Server size={40} className="mx-auto mb-4 opacity-20" style={{ color: "var(--text2)" }} />
              <p className="font-syne font-bold text-[15px] mb-2 gradient-text">Backend Generator</p>
              <p className="text-[12px] leading-relaxed" style={{ color: "var(--text2)", maxWidth: "280px" }}>
                Describe your API, select stack, and click Generate. GPT-5.4 will create a full production backend.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 px-4 py-2.5 flex-shrink-0" style={{ borderBottom: "1px solid var(--border2)", background: "var(--panel)" }}>
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#ff5f57" }} />
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#ffbd2e" }} />
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#28c840" }} />
              </div>
              <span className="text-[11px] font-mono font-semibold px-2.5 py-1 rounded-md"
                style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)", color: "var(--violet)" }}>
                backend-project/
              </span>
              <button onClick={() => navigator.clipboard.writeText(store.backendCode)}
                className="ml-auto text-[11px] px-2.5 py-1 rounded-lg border hover:opacity-80 transition-all"
                style={{ borderColor: "var(--border2)", color: "var(--text2)" }}>Copy All</button>
            </div>
            <div className="flex flex-1 overflow-auto">
              <div className="select-none py-4 pr-3 pl-4 text-right leading-[1.7] font-mono text-[12.5px] flex-shrink-0"
                style={{ color: "var(--text3)", borderRight: "1px solid var(--border)", minWidth: "48px" }}>
                {Array.from({ length: store.backendCode.split("\n").length }, (_, i) => <div key={i}>{i + 1}</div>)}
              </div>
              <pre className="flex-1 py-4 px-5 leading-[1.7] font-mono text-[12.5px] overflow-x-auto m-0"
                style={{ color: "var(--text)", whiteSpace: "pre-wrap", wordBreak: "break-word" }}
                dangerouslySetInnerHTML={{ __html: syntaxHighlight(store.backendCode) }} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Label({ children }: { children: ReactNode }) {
  return <p className="text-[10px] font-bold uppercase tracking-[1px] mb-2" style={{ color: "var(--text2)" }}>{children}</p>;
}
function BRow({ label, children }: { label: string; children: ReactNode }) {
  return <div><Label>{label}</Label>{children}</div>;
}
function RadioRow<T extends string>({ options, value, onChange, color = "blue" }: { options: T[]; value: T; onChange: (v: T) => void; color?: string }) {
  const c = color === "violet" ? "var(--violet)" : "var(--blue)";
  const bg = color === "violet" ? "var(--violet-dim)" : "var(--blue-dim)";
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button key={o} onClick={() => onChange(o)}
          className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-all"
          style={{ background: value === o ? bg : "transparent", borderColor: value === o ? c : "var(--border2)", color: value === o ? c : "var(--text2)" }}>
          {o}
        </button>
      ))}
    </div>
  );
}
function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!value)} className="flex-1 flex items-center justify-between px-3 py-2.5 rounded-xl border transition-all"
      style={{ background: value ? "var(--blue-dim)" : "var(--bg3)", borderColor: value ? "var(--blue)" : "var(--border2)" }}>
      <span className="text-[11px] font-semibold" style={{ color: value ? "var(--blue)" : "var(--text2)" }}>{label}</span>
      <div className="w-8 h-4 rounded-full transition-all relative" style={{ background: value ? "var(--blue)" : "var(--border2)" }}>
        <div className="absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all" style={{ left: value ? "17px" : "2px" }} />
      </div>
    </button>
  );
}
