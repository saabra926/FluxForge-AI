"use client";
import { useEffect, useState } from "react";
import { Clock, Code2, Trash2, RefreshCw, Database } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { formatDate } from "@/lib/utils";

interface DBEntry {
  _id: string;
  prompt: string;
  config: { framework: string };
  lines: number;
  qualityScore: number;
  createdAt: string;
}

export function HistoryView({ onToast }: { onToast?: (m: string, t?: "success" | "error") => void }) {
  const { history, loadFromHistory, clearHistory } = useAppStore();
  const [dbHistory, setDbHistory] = useState<DBEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"local" | "db">("local");

  const fetchDB = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/history?limit=30");
      const data = await res.json();
      if (data.success) setDbHistory(data.data ?? []);
    } catch {
      onToast?.("Failed to load history from DB", "error");
    } finally {
      setLoading(false);
    }
  };

  const deleteDB = async (id: string) => {
    try {
      await fetch(`/api/history?id=${id}`, { method: "DELETE" });
      setDbHistory((p) => p.filter((e) => e._id !== id));
      onToast?.("Deleted");
    } catch {
      onToast?.("Delete failed", "error");
    }
  };

  useEffect(() => { if (tab === "db") fetchDB(); }, [tab]);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0" style={{ borderBottom: "1px solid var(--border2)" }}>
        <h2 className="font-syne font-bold text-[14px] flex-1 gradient-text">Version History</h2>
        <button onClick={tab === "db" ? fetchDB : clearHistory}
          className="flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 rounded-lg border transition-all hover:opacity-80"
          style={{ borderColor: "var(--border2)", color: "var(--text2)" }}>
          <RefreshCw size={11} />{tab === "db" ? "Refresh" : "Clear"}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-4 py-2 flex-shrink-0" style={{ borderBottom: "1px solid var(--border)" }}>
        <button onClick={() => setTab("local")} className={`flex-1 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${tab === "local" ? "tab-active" : "tab-inactive"}`}
          style={{ background: tab === "local" ? "var(--blue-dim)" : "transparent" }}>
          Local ({history.length})
        </button>
        <button onClick={() => setTab("db")} className={`flex-1 py-1.5 rounded-lg text-[11px] font-semibold transition-all flex items-center justify-center gap-1.5 ${tab === "db" ? "tab-active" : "tab-inactive"}`}
          style={{ background: tab === "db" ? "var(--blue-dim)" : "transparent" }}>
          <Database size={10} /> MongoDB
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3">
        {tab === "local" && (
          history.length === 0 ? (
            <Empty label="No local history yet" />
          ) : (
            <div className="space-y-2">
              {history.map((e, i) => (
                <div key={e.id} onClick={() => loadFromHistory(e.id)}
                  className="group rounded-xl p-3 border cursor-pointer transition-all hover:-translate-y-0.5"
                  style={{ background: "var(--card)", borderColor: "var(--border)" }}
                  onMouseEnter={(el) => (el.currentTarget.style.borderColor = "var(--blue)")}
                  onMouseLeave={(el) => (el.currentTarget.style.borderColor = "var(--border)")}>
                  <div className="flex items-start gap-2 mb-1">
                    <p className="text-[12px] font-semibold flex-1 leading-snug" style={{ color: "var(--text)" }}>{e.prompt}</p>
                    {i === 0 && <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold flex-shrink-0"
                      style={{ background: "var(--green-dim)", color: "var(--green)" }}>Latest</span>}
                  </div>
                  <div className="flex items-center gap-3 text-[10px]" style={{ color: "var(--text2)" }}>
                    <span className="flex items-center gap-1"><Code2 size={10} />{e.config.framework}</span>
                    <span>{e.lines} lines</span>
                    {e.qualityScore ? <span>{e.qualityScore}% quality</span> : null}
                    <span className="ml-auto">{formatDate(e.timestamp)}</span>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {tab === "db" && (
          loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--blue)" }} />
            </div>
          ) : dbHistory.length === 0 ? (
            <Empty label="No MongoDB history yet. Generate some code!" />
          ) : (
            <div className="space-y-2">
              {dbHistory.map((e) => (
                <div key={e._id} className="rounded-xl p-3 border" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-[12px] font-semibold flex-1" style={{ color: "var(--text)" }}>{e.prompt}</p>
                    <button onClick={() => deleteDB(e._id)} className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-400">
                      <Trash2 size={12} style={{ color: "var(--text3)" }} />
                    </button>
                  </div>
                  <div className="flex items-center gap-3 text-[10px]" style={{ color: "var(--text2)" }}>
                    <span>{e.config.framework}</span>
                    <span>{e.lines} lines</span>
                    {e.qualityScore ? <span>{e.qualityScore}% quality</span> : null}
                    <span className="ml-auto">{formatDate(e.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Clock size={32} className="mb-3 opacity-30" style={{ color: "var(--text2)" }} />
      <p className="text-[12px]" style={{ color: "var(--text2)" }}>{label}</p>
    </div>
  );
}
